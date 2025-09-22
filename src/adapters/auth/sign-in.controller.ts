import Elysia from 'elysia';
import { StrictBuilder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';
import { SignInUseCase, SignInInput } from '../../core/domain/auth/use-case/sign-in.usecase';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import type { AuthConfig } from '../../external/config/auth.config';
import { SignInRequestDto, AuthResponseDto, ErrorResponseDto } from './dtos/auth.dto';
import type { UserEmail, UserPassword } from '../../core/domain/users/entity/user.entity';
import { BaseAuthController } from './base-auth.controller';

@injectable()
export class SignInController extends BaseAuthController {
  constructor(
    @inject(SignInUseCase) private readonly signInUseCase: SignInUseCase,
    @inject(TOKENS.AuthConfig) authConfig: AuthConfig,
    @inject(TOKENS.Logger) logger: LoggerPort
  ) {
    super(authConfig, logger);
  }

  register(app: Elysia) {
    app.post(
      '/auth/signin',
      async ({ body, set }) => {
        const input = StrictBuilder<SignInInput>()
          .email(body.email as UserEmail)
          .password(body.password as UserPassword)
          .build();

        const requestId = this.generateRequestId();

        try {
          this.logSuccess('Handling sign-in request', {
            email: body.email,
            requestId,
          });

          const result = await this.signInUseCase.execute(input);
          const { user, tokens } = result;

          set.status = StatusCodes.OK;
          const csrfToken = this.setAuthCookies(set, tokens);

          return this.createAuthResponse(user, tokens, csrfToken);
        } catch (error) {
          this.handleError(error, 'sign in user', {
            email: body.email,
            requestId,
          });
        }
      },
      {
        body: SignInRequestDto,
        response: {
          200: AuthResponseDto,
          400: ErrorResponseDto,
          401: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Sign in',
          tags: ['Auth'],
        },
      }
    );
  }
}
