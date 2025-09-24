import Elysia from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'tsyringe';

import type { RefreshTokenPlain } from '../../core/domain/auth/entity/refresh-token.entity';
import { LogoutUseCase } from '../../core/domain/auth/use-case/logout.usecase';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import type { AuthConfig } from '../../external/config/auth.config';
import { BaseAuthController } from './base-auth.controller';

@injectable()
export class LogoutController extends BaseAuthController {
  constructor(
    @inject(LogoutUseCase) private readonly logoutUseCase: LogoutUseCase,
    @inject(TOKENS.AuthConfig) authConfig: AuthConfig,
    @inject(TOKENS.Logger) logger: LoggerPort
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
