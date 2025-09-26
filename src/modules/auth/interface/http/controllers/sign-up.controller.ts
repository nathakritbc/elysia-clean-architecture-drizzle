import { StrictBuilder } from 'builder-pattern';
import Elysia from 'elysia';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'tsyringe';

import { SignUpUseCase, type SignUpInput } from '@modules/auth/application/use-cases/sign-up.usecase';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import type { AuthConfig } from '@modules/auth/infrastructure/config/auth.config';
import type { BUserName, UserEmail, UserPassword } from '@modules/accounts/domain/entities/user.entity';
import type { LoggerPort } from '@shared/logging/logger.port';
import { PlatformTokens } from '@platform/di/tokens';
import { BaseAuthController } from './base-auth.controller';
import { AuthResponseDto, ErrorResponseDto, SignUpRequestDto } from '../dtos/auth.dto';

@injectable()
export class SignUpController extends BaseAuthController {
  constructor(
    @inject(SignUpUseCase) private readonly signUpUseCase: SignUpUseCase,
    @inject(AuthModuleTokens.AuthConfig) authConfig: AuthConfig,
    @inject(PlatformTokens.Logger) logger: LoggerPort
  ) {
    super(authConfig, logger);
  }

  register(app: Elysia) {
    app.post(
      '/auth/signup',
      async ({ body, set }) => {
        const input: SignUpInput = StrictBuilder<SignUpInput>()
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
