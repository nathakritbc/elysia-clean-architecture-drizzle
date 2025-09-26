import Elysia from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'tsyringe';

import { LogoutUseCase } from '@modules/auth/application/use-cases/logout.usecase';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import type { AuthConfig } from '@modules/auth/infrastructure/config/auth.config';
import type { RefreshTokenPlain } from '@modules/auth/domain/entities/refresh-token.entity';
import type { LoggerPort } from '@shared/logging/logger.port';
import { PlatformTokens } from '@platform/di/tokens';
import { BaseAuthController } from './base-auth.controller';

@injectable()
export class LogoutController extends BaseAuthController {
  constructor(
    @inject(LogoutUseCase) private readonly logoutUseCase: LogoutUseCase,
    @inject(AuthModuleTokens.AuthConfig) authConfig: AuthConfig,
    @inject(PlatformTokens.Logger) logger: LoggerPort
  ) {
    super(authConfig, logger);
  }

  register(app: Elysia) {
    app.post('/auth/logout', async ({ request, set }) => {
      try {
        const cookies = this.parseRequestCookies(request);
        const refreshToken = cookies[this.authConfig.refreshTokenCookie.name];

        await this.logoutUseCase.execute({ refreshToken: refreshToken as RefreshTokenPlain });

        set.status = StatusCodes.OK;
        this.clearAuthCookies(set);
        this.logSuccess('User logged out');

        return { success: true };
      } catch (error) {
        this.handleError(error, 'logout user');
      }
    });
  }
}
