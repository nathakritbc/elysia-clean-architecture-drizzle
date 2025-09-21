import { Builder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { ConflictError } from '../../../shared/errors/error-mapper';
import { TOKENS } from '../../../shared/tokens';
import { IUseCase } from '../../../shared/useCase';
import { EStatus } from '../../../shared/status.enum';
import type { IUser, BUserName, UserEmail, UserPassword, UserStatus } from '../../users/entity/user.entity';
import { User } from '../../users/entity/user.entity';
import { UserRepository } from '../../users/service/user.repository';
import type { GeneratedAuthTokens } from '../service/auth-token.service';
import { AuthTokenService } from '../service/auth-token.service';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { RefreshToken } from '../entity/refresh-token.entity';

export interface SignUpInput {
  name: BUserName;
  email: UserEmail;
  password: UserPassword;
}

export interface AuthenticatedUser {
  user: IUser;
  tokens: GeneratedAuthTokens;
}

@injectable()
export class SignUpUseCase implements IUseCase<SignUpInput, AuthenticatedUser> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository,
    @inject(TOKENS.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(TOKENS.AuthTokenService)
    private readonly authTokenService: AuthTokenService
  ) {}

  async execute(input: SignUpInput): Promise<AuthenticatedUser> {
    const existingUser = await this.userRepository.getByEmail(input.email);

    if (existingUser) {
      throw new ConflictError('Email is already registered');
    }

    const user = Builder(User)
      .email(input.email)
      .name(input.name)
      .status(EStatus.active as UserStatus)
      .build();

    await user.setHashPassword(input.password);

    const createdUser = await this.userRepository.create(user);
    const tokens = await this.authTokenService.generateTokens(createdUser);

    const refreshToken = Builder(RefreshToken)
      .userId(createdUser.id)
      .jti(tokens.jti)
      .tokenHash(tokens.refreshTokenHash)
      .expiresAt(tokens.refreshTokenExpiresAt)
      .build();

    await this.refreshTokenRepository.create(refreshToken);

    createdUser.hiddenPassword();

    return {
      user: createdUser,
      tokens,
    };
  }
}
