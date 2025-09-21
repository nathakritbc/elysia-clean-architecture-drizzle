import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import type { AuthConfig } from '../../external/config/auth.config';
import { buildClearRefreshTokenCookie, parseCookies } from './cookie.util';
import { LogoutUseCase } from '../../core/domain/auth/use-case/logout.usecase';
import type { RefreshTokenPlain } from '../../core/domain/auth/entity/refresh-token.entity';
import { UnauthorizedError } from '../../core/shared/errors/error-mapper';

@injectable()
export class LogoutController {
  constructor(
    @inject(LogoutUseCase) private readonly logoutUseCase: LogoutUseCase,
    @inject(TOKENS.AuthConfig) private readonly authConfig: AuthConfig,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.post('/auth/logout', async ({ request, set }) => {
      const cookies = parseCookies(request.headers.get('cookie'));
      const refreshToken = cookies[this.authConfig.refreshTokenCookie.name];

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token not found');
      }

      await this.logoutUseCase.execute(refreshToken as RefreshTokenPlain);

      const clearCookie = buildClearRefreshTokenCookie(this.authConfig);
      set.status = StatusCodes.OK;
      set.headers = set.headers ?? {};
      set.headers['Set-Cookie'] = clearCookie;

      this.logger.info('User logged out');

      return { success: true };
    });
  }
}
