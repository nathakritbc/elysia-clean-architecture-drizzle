import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { CreateUserUseCase } from '../../core/domain/users/use-case/createUser.usecase';
import { CreateUserRequestDto, CreateUserResponseDto, ErrorResponseDto } from '../../core/shared/dtos/user.dto';
import { BUserName } from '../../core/domain/users/entity/user.entity';
import { UserEmail } from '../../core/domain/users/entity/user.entity';
import { UserPassword } from '../../core/domain/users/entity/user.entity';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';

@injectable()
export class CreateUserController {
  constructor(
    @inject(CreateUserUseCase) private readonly useCase: CreateUserUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.post(
      '/users',
      async ({ body }) => {
        const { name, email, password } = body as {
          name: BUserName;
          email: UserEmail;
          password: UserPassword;
        };
        try {
          this.logger.info('Creating user', { email, name });
          await this.useCase.execute({ name, email, password });
          this.logger.info('User created successfully', { email });

          return {
            status: 200,
            body: {
              message: 'Usuario criado com sucesso',
            },
          };
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to create user', { email, error: normalizedError });
          throw error;
        }
      },
      {
        body: CreateUserRequestDto,
        response: {
          200: CreateUserResponseDto,
          400: ErrorResponseDto,
          409: ErrorResponseDto,
        },
        detail: {
          summary: 'Create a new user',
          description: 'Creates a new user with the provided information',
          tags: ['Users'],
        },
      }
    );
  }
}
