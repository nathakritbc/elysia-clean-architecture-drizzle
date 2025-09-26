import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import { AuthModuleTokens } from '@modules/auth/module.tokens';
import { type RefreshTokenPlain } from '@modules/auth/domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { UnauthorizedError } from '@shared/errors/error-mapper';
import { BaseLogoutUseCase, type LogoutOutput } from '../base/base-logout.usecase';

export interface LogoutInput {
  refreshToken: RefreshTokenPlain;
}

@injectable()
export class LogoutUseCase extends BaseLogoutUseCase<LogoutInput, LogoutOutput> {
  constructor(
    @inject(AuthModuleTokens.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository
  ) {
    super(refreshTokenRepository);
  }

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    if (!input?.refreshToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    const jti = await this.validateRefreshToken(input.refreshToken);
    await this.revokeRefreshTokenByJti(jti);

    return { success: true };
  }
}
