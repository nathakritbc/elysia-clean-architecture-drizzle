import Elysia, { t } from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'tsyringe';

import {
  RefreshSessionUseCase,
  type RefreshSessionInput,
} from '@modules/auth/application/use-cases/refresh-session.usecase';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import type { AuthConfig } from '@modules/auth/infrastructure/config/auth.config';
import { UnauthorizedError } from '@shared/errors/error-mapper';
import type { LoggerPort } from '@shared/logging/logger.port';
import { PlatformTokens } from '@platform/di/tokens';
import { BaseAuthController } from './base-auth.controller';
import { AuthResponseDto, ErrorResponseDto, RefreshSessionRequestDto } from '../dtos/auth.dto';

@injectable()
export class RefreshSessionController extends BaseAuthController {
  constructor(
    @inject(RefreshSessionUseCase) private readonly refreshSessionUseCase: RefreshSessionUseCase,
    @inject(AuthModuleTokens.AuthConfig) authConfig: AuthConfig,
    @inject(PlatformTokens.Logger) logger: LoggerPort
  ) {
    super(authConfig, logger);
  }

  register(app: Elysia) {
    app.post(
      '/auth/refresh',
      async ({ request, headers, body, set }) => {
        const cookies = this.parseRequestCookies(request);
        const csrfHeader = headers['x-csrf-token'];
        const csrfCookie = cookies[this.authConfig.refreshTokenCsrfCookie.name];

        if (!csrfHeader || csrfHeader !== csrfCookie) {
          throw new UnauthorizedError('Invalid CSRF token');
        }

        const refreshTokenFromBody = (body as RefreshSessionInput | undefined)?.refreshToken;
        const refreshTokenCookie = cookies[this.authConfig.refreshTokenCookie.name];
        const refreshToken = refreshTokenFromBody ?? (refreshTokenCookie as RefreshSessionInput['refreshToken']);

        if (!refreshToken) {
          throw new UnauthorizedError('Refresh token not found');
        }

        const input: RefreshSessionInput = { refreshToken };
        const requestId = this.generateRequestId();

        try {
          this.logSuccess('Handling refresh session request', {
            requestId,
          });

          const result = await this.refreshSessionUseCase.execute(input);
          const { user, tokens } = result;

          set.status = StatusCodes.OK;
          const csrfToken = this.setAuthCookies(set, tokens);

          return this.createAuthResponse(user, tokens, csrfToken);
        } catch (error) {
          this.handleError(error, 'refresh session', {
            requestId,
          });
        }
      },
      {
        body: t.Optional(RefreshSessionRequestDto),
        response: {
          200: AuthResponseDto,
          400: ErrorResponseDto,
          401: ErrorResponseDto,
          403: ErrorResponseDto,
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
