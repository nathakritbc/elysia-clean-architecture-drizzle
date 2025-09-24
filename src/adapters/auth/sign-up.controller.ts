import { StrictBuilder } from 'builder-pattern';
import Elysia from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'tsyringe';

import { SignUpInput, SignUpUseCase } from '../../core/domain/auth/use-case/sign-up.usecase';
import type { BUserName, UserEmail, UserPassword } from '../../core/domain/users/entity/user.entity';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import type { AuthConfig } from '../../external/config/auth.config';
import { BaseAuthController } from './base-auth.controller';
import { AuthResponseDto, ErrorResponseDto, SignUpRequestDto } from './dtos/auth.dto';

@injectable()
export class SignUpController extends BaseAuthController {
  constructor(
    @inject(SignUpUseCase) private readonly signUpUseCase: SignUpUseCase,
    @inject(TOKENS.AuthConfig) authConfig: AuthConfig,
    @inject(TOKENS.Logger) logger: LoggerPort
  ) {
    super(authConfig, logger);
  }

  register(app: Elysia) {
    app.post(
      '/auth/signup',
      async ({ body, set }) => {
        const input = StrictBuilder<SignUpInput>()
          .name(body.name as BUserName)
          .email(body.email as UserEmail)
          .password(body.password as UserPassword)
          .build();

        const requestId = this.generateRequestId();

        try {
          this.logSuccess('Handling sign-up request', {
            email: body.email,
            requestId,
          });

          const result = await this.signUpUseCase.execute(input);
          const { user, tokens } = result;

          set.status = StatusCodes.CREATED;
          const csrfToken = this.setAuthCookies(set, tokens);

          return this.createAuthResponse(user, tokens, csrfToken);
        } catch (error) {
          this.handleError(error, 'sign up user', {
            email: body.email,
            requestId,
          });
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
