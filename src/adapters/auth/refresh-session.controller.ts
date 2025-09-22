import Elysia from 'elysia';
import { StrictBuilder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { RefreshSessionUseCase, RefreshSessionInput } from '../../core/domain/auth/use-case/refresh-session.usecase';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import type { AuthConfig } from '../../external/config/auth.config';
import { buildRefreshTokenCookie, buildRefreshTokenCsrfCookie, parseCookies } from './cookie.util';
import { RefreshResponseDto, ErrorResponseDto } from './dtos/auth.dto';
import { toUserResponse } from './transformers';
import type { RefreshTokenPlain } from '../../core/domain/auth/entity/refresh-token.entity';
import { nanoid } from 'nanoid';
import { UnauthorizedError } from '../../core/shared/errors/error-mapper';

@injectable()
export class RefreshSessionController {
  constructor(
    @inject(RefreshSessionUseCase) private readonly refreshSessionUseCase: RefreshSessionUseCase,
    @inject(TOKENS.AuthConfig) private readonly authConfig: AuthConfig,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.post(
      '/auth/refresh',
      async ({ set, request }) => {
        try {
          const cookieHeader = request.headers.get('cookie') ?? request.headers.get('Cookie');
          const cookies = parseCookies(cookieHeader);
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
          set.headers = set.headers ?? {};
          const csrfToken = nanoid();
          const cookiesToSet = [
            buildRefreshTokenCookie(
              tokens.refreshToken,
              tokens.refreshTokenExpiresAt as unknown as Date,
              this.authConfig
            ),
            buildRefreshTokenCsrfCookie(csrfToken, tokens.refreshTokenExpiresAt as unknown as Date, this.authConfig),
          ];

          const existing = set.headers?.['Set-Cookie'];
          const currentCookies = Array.isArray(existing) ? existing : existing ? [existing] : [];

          set.headers = set.headers ?? {};
          set.headers['Set-Cookie'] = [...currentCookies, ...cookiesToSet].join('; ');

          return {
            user: toUserResponse(user),
            accessToken: tokens.accessToken,
            accessTokenExpiresAt: tokens.accessTokenExpiresAt,
            refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
          };
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to refresh session', {
            error: normalizedError,
          });
          throw error;
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
