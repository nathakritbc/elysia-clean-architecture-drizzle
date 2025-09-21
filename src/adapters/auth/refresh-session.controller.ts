import Elysia from 'elysia';
import { StrictBuilder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { RefreshSessionUseCase, RefreshSessionInput } from '../../core/domain/auth/use-case/refresh-session.usecase';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import type { AuthConfig } from '../../external/config/auth.config';
import { buildRefreshTokenCookie, parseCookies } from './cookie.util';
import { RefreshResponseDto, ErrorResponseDto } from './dtos/auth.dto';
import { toUserResponse } from './transformers';
import type { RefreshTokenPlain } from '../../core/domain/auth/entity/refresh-token.entity';

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

          const input = StrictBuilder<RefreshSessionInput>()
            .refreshToken(refreshTokenValue as RefreshTokenPlain)
            .build();

          const result = await this.refreshSessionUseCase.execute(input);
          const { user, tokens } = result;

          set.status = StatusCodes.OK;
          set.headers = set.headers ?? {};
          const cookie = buildRefreshTokenCookie(
            tokens.refreshToken,
            tokens.refreshTokenExpiresAt as unknown as Date,
            this.authConfig
          );

          const existing = set.headers['Set-Cookie'];
          if (!existing) {
            set.headers['Set-Cookie'] = cookie;
          }
          if (Array.isArray(existing)) {
            set.headers['Set-Cookie'] = [...existing, cookie].join('; ');
          } else {
            set.headers['Set-Cookie'] = [existing, cookie].join('; ');
          }

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
