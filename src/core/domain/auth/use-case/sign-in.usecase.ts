import { Builder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { UnauthorizedError } from '../../../shared/errors/error-mapper';
import { TOKENS } from '../../../shared/tokens';
import { IUseCase } from '../../../shared/useCase';
import type { UserEmail, UserPassword } from '../../users/entity/user.entity';
import { UserRepository } from '../../users/service/user.repository';
import { AuthTokenService } from '../service/auth-token.service';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import { RefreshToken, RefreshTokenRevokedAt } from '../entity/refresh-token.entity';
import type { AuthenticatedUser } from './sign-up.usecase';

export interface SignInInput {
  email: UserEmail;
  password: UserPassword;
}

@injectable()
export class SignInUseCase implements IUseCase<SignInInput, AuthenticatedUser> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository,
    @inject(TOKENS.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(TOKENS.AuthTokenService)
    private readonly authTokenService: AuthTokenService
  ) {}

  async execute(input: SignInInput): Promise<AuthenticatedUser> {
    const user = await this.userRepository.getByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await user.comparePassword(input.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const revokedAt = new Date() as RefreshTokenRevokedAt;
    await this.refreshTokenRepository.revokeAllByUserId(user.id, revokedAt);

    const tokens = await this.authTokenService.generateTokens(user);

    const refreshToken = Builder(RefreshToken)
      .userId(user.id)
      .jti(tokens.jti)
      .tokenHash(tokens.refreshTokenHash)
      .expiresAt(tokens.refreshTokenExpiresAt)
      .build();

    await this.refreshTokenRepository.create(refreshToken);

    user.hiddenPassword();

    return {
      user,
      tokens,
    };
  }
}
