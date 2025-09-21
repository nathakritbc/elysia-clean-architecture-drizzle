import Elysia from 'elysia';
import { StrictBuilder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { SignUpUseCase, SignUpInput } from '../../core/domain/auth/use-case/sign-up.usecase';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import type { AuthConfig } from '../../external/config/auth.config';
import { buildRefreshTokenCookie } from './cookie.util';
import { SignUpRequestDto, AuthResponseDto, ErrorResponseDto } from './dtos/auth.dto';
import type { BUserName, UserEmail, UserPassword } from '../../core/domain/users/entity/user.entity';
import { toUserResponse } from './transformers';
import { nanoid } from 'nanoid';

@injectable()
export class SignUpController {
  constructor(
    @inject(SignUpUseCase) private readonly signUpUseCase: SignUpUseCase,
    @inject(TOKENS.AuthConfig) private readonly authConfig: AuthConfig,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.post(
      '/auth/signup',
      async ({ body, set }) => {
        const input = StrictBuilder<SignUpInput>()
          .name(body.name as BUserName)
          .email(body.email as UserEmail)
          .password(body.password as UserPassword)
          .build();
        const requestId = nanoid();

        try {
          this.logger.info('Handling sign-up request', {
            email: body.email,
            requestId: requestId,
          });

          const result = await this.signUpUseCase.execute(input);

          const { user, tokens } = result;

          set.status = StatusCodes.CREATED;
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
          this.logger.error('Failed to sign up user', {
            email: body.email,
            requestId: requestId,
            error: normalizedError,
          });
          throw error;
        }
      },
      {
        body: SignUpRequestDto,
        response: {
          201: AuthResponseDto,
          400: ErrorResponseDto,
          401: ErrorResponseDto,
          409: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Sign up',
          tags: ['Auth'],
        },
      }
    );
  }
}
