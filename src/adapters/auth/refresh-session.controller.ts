import Elysia from 'elysia';
import { StrictBuilder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { RefreshSessionUseCase, RefreshSessionInput } from '../../core/domain/auth/use-case/refresh-session.usecase';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import type { AuthConfig } from '../../external/config/auth.config';
import { RefreshResponseDto, ErrorResponseDto } from './dtos/auth.dto';
import type { RefreshTokenPlain } from '../../core/domain/auth/entity/refresh-token.entity';
import { UnauthorizedError } from '../../core/shared/errors/error-mapper';
import { BaseAuthController } from './base-auth.controller';

@injectable()
export class RefreshSessionController extends BaseAuthController {
  constructor(
    @inject(RefreshSessionUseCase) private readonly refreshSessionUseCase: RefreshSessionUseCase,
    @inject(TOKENS.AuthConfig) authConfig: AuthConfig,
    @inject(TOKENS.Logger) logger: LoggerPort
  ) {
    super(authConfig, logger);
  }

  register(app: Elysia) {
    app.post(
      '/auth/refresh',
      async ({ set, request }) => {
        try {
          const cookies = this.parseRequestCookies(request);
          const refreshTokenValue = cookies[this.authConfig.refreshTokenCookie.name];
          const csrfCookieValue = cookies[this.authConfig.refreshTokenCsrfCookie.name];
          const csrfHeaderValue = request.headers.get('x-csrf-token');

          if (!csrfHeaderValue || !csrfCookieValue || csrfHeaderValue !== csrfCookieValue) {
            this.logger.warn('CSRF token validation failed for refresh session');
            throw new UnauthorizedError('Invalid CSRF token');
          }

          const input = StrictBuilder<RefreshSessionInput>()
            .refreshToken(refreshTokenValue as RefreshTokenPlain)
            .build();

          const result = await this.refreshSessionUseCase.execute(input);
          const { user, tokens } = result;

          set.status = StatusCodes.OK;
          this.setAuthCookies(set, tokens);

          return this.createAuthResponse(user, tokens);
        } catch (error) {
          this.handleError(error, 'refresh session');
        }
      },
      {
        response: {
          200: RefreshResponseDto,
          401: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Refresh session',
          tags: ['Auth'],
        },
      }
    );
  }
}
