import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { CreateUserInput, CreateUserUseCase } from '../../core/domain/users/use-case/createUser.usecase';
import { CreateUserRequestDto, CreateUserResponseDto } from '../../core/shared/dtos/user.dto';
import { BUserName } from '../../core/domain/users/entity/user.entity';
import { UserEmail } from '../../core/domain/users/entity/user.entity';
import { UserPassword } from '../../core/domain/users/entity/user.entity';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { StrictBuilder } from 'builder-pattern';

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
        const input = StrictBuilder<CreateUserInput>()
          .email(body.email as UserEmail)
          .name(body.name as BUserName)
          .password(body.password as UserPassword)
          .build();

        try {
          this.logger.info('Creating user', { ...input });

          const userCreated = await this.useCase.execute(input);

          this.logger.info('User created successfully', { ...userCreated });

          return userCreated;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to create user', { ...input, error: normalizedError });
          throw error;
        }
      },
      {
        body: CreateUserRequestDto,
        response: {
          200: CreateUserResponseDto,
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
