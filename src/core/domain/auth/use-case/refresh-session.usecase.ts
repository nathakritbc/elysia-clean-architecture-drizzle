import { Builder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { UnauthorizedError } from '../../../shared/errors/error-mapper';
import { TOKENS } from '../../../shared/tokens';
import { IUseCase } from '../../../shared/useCase';
import { AuthTokenService } from '../service/auth-token.service';
import { RefreshTokenRepository } from '../service/refresh-token.repository';
import {
  RefreshToken,
  RefreshTokenJti,
  RefreshTokenPlain,
  RefreshTokenRevokedAt,
} from '../entity/refresh-token.entity';
import type { AuthenticatedUser } from './sign-up.usecase';
import { UserRepository } from '../../users/service/user.repository';

export interface RefreshSessionInput {
  refreshToken: RefreshTokenPlain;
}

@injectable()
export class RefreshSessionUseCase implements IUseCase<RefreshSessionInput, AuthenticatedUser> {
  constructor(
    @inject(TOKENS.RefreshTokenRepository)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository,
    @inject(TOKENS.AuthTokenService)
    private readonly authTokenService: AuthTokenService
  ) {}

  async execute(input: RefreshSessionInput): Promise<AuthenticatedUser> {
    const tokenString = input.refreshToken as unknown as string;
    const parts = tokenString.split('.');
    const [jti, secret] = parts;

    if (!jti || !secret || parts.length !== 2) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const storedToken = await this.refreshTokenRepository.findByJti(jti as RefreshTokenJti);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (storedToken.isRevoked()) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (storedToken.isExpired()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const isValid = await storedToken.compareToken(input.refreshToken);

    if (!isValid) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const revokedAt = new Date() as RefreshTokenRevokedAt;
    await this.refreshTokenRepository.revokeByJti(storedToken.jti, revokedAt);

    const user = await this.userRepository.getById(storedToken.userId);

    if (!user) {
      throw new UnauthorizedError('Associated user not found');
    }

    const tokens = await this.authTokenService.generateTokens(user);

    const newRefreshToken = Builder(RefreshToken)
      .userId(user.id)
      .jti(tokens.jti)
      .tokenHash(tokens.refreshTokenHash)
      .expiresAt(tokens.refreshTokenExpiresAt)
      .build();

    await this.refreshTokenRepository.create(newRefreshToken);

    user.hiddenPassword();

    return {
      user,
      tokens,
    };
  }
}
