import 'reflect-metadata';
import { inject } from 'tsyringe';

import { AuthModuleTokens } from '@modules/auth/module.tokens';
import {
  type RefreshTokenJti,
  type RefreshTokenPlain,
  type RefreshTokenRevokedAt,
} from '@modules/auth/domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { UnauthorizedError } from '@shared/errors/error-mapper';
import type { IUseCase } from '@shared/application/use-case';

export interface LogoutOutput {
  success: boolean;
}

export abstract class BaseLogoutUseCase<Input, Output> implements IUseCase<Input, Output> {
  constructor(
    @inject(AuthModuleTokens.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  abstract execute(input: Input): Promise<Output>;

  protected async validateRefreshToken(refreshToken: RefreshTokenPlain): Promise<RefreshTokenJti> {
    const [jti] = refreshToken.split('.');

    if (!jti) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return jti as RefreshTokenJti;
  }

  protected async revokeRefreshTokenByJti(jti: RefreshTokenJti): Promise<void> {
    const revokedAt = new Date() as RefreshTokenRevokedAt;
    await this.refreshTokenRepository.revokeByJti(jti, revokedAt);
  }
}
