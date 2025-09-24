import 'reflect-metadata';
import { inject } from 'tsyringe';

import { UnauthorizedError } from '../../../shared/errors/error-mapper';
import { TOKENS } from '../../../shared/tokens';
import { IUseCase } from '../../../shared/useCase';
import { RefreshTokenJti, RefreshTokenPlain, RefreshTokenRevokedAt } from '../entity/refresh-token.entity';
import { RefreshTokenRepository } from '../service/refresh-token.repository';

export interface LogoutOutput {
  success: boolean;
}

/**
 * Base class for logout-related use cases
 * Provides common token validation and revocation logic
 */
export abstract class BaseLogoutUseCase<Input, Output> implements IUseCase<Input, Output> {
  constructor(
    @inject(TOKENS.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  abstract execute(input: Input): Promise<Output>;

  /**
   * Common method to validate refresh token format and extract JTI
   */
  protected async validateRefreshToken(refreshToken: RefreshTokenPlain): Promise<RefreshTokenJti> {
    const [jti] = refreshToken.split('.');

    if (!jti) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return jti as RefreshTokenJti;
  }

  /**
   * Common method to revoke refresh token by JTI
   */
  protected async revokeRefreshTokenByJti(jti: RefreshTokenJti): Promise<void> {
    const revokedAt = new Date() as RefreshTokenRevokedAt;
    await this.refreshTokenRepository.revokeByJti(jti, revokedAt);
  }
}
