import 'reflect-metadata';
import { Builder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { ConflictError } from '../../../shared/errors/error-mapper';
import { EStatus } from '../../../shared/status.enum';
import type { BUserName, UserEmail, UserPassword, UserStatus } from '../../users/entity/user.entity';
import { User } from '../../users/entity/user.entity';
import { BaseAuthUseCase, type AuthenticatedUser } from './base-auth.usecase';
import { UserRepository } from '../../users/service/user.repository';
import { TOKENS } from '../../../shared/tokens';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { AuthTokenService } from '../service/auth-token.service';

export interface SignUpInput {
  name: BUserName;
  email: UserEmail;
  password: UserPassword;
}

@injectable()
export class SignUpUseCase extends BaseAuthUseCase<SignUpInput, AuthenticatedUser> {
  constructor(
    @inject(TOKENS.IUserRepository)
    protected readonly userRepository: UserRepository,
    @inject(TOKENS.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(TOKENS.AuthTokenService)
    protected readonly authTokenService: AuthTokenService
  ) {
    super(userRepository, refreshTokenRepository, authTokenService);
  }

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

    // Use the common token generation method from base class
    return await this.generateTokensForUser(createdUser);
  }
}
