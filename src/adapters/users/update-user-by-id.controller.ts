import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { UpdateUserByIdUseCase } from '../../core/domain/users/use-case/update-user-by-id.usecase';
import {
  BUserName,
  IUser,
  UserEmail,
  UserId,
  UserPassword,
  UserStatus,
} from '../../core/domain/users/entity/user.entity';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { UpdateUserRequestDto, UpdateUserResponseDto, ErrorResponseDto, UserIdParamsDto } from './dtos/user.dto';
import { Builder } from 'builder-pattern';

@injectable()
export class UpdateUserByIdController {
  constructor(
    @inject(UpdateUserByIdUseCase) private readonly useCase: UpdateUserByIdUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.put(
      '/users/:id',
      async ({ params, body }) => {
        const { id } = params as { id: UserId };
        const { name, email, password, status } = body;

        try {
          this.logger.info('Updating user by id', { id });
          this.logger.info('User to update', body);

          const user = Builder<IUser>()
            .id(id)
            .name(name as BUserName)
            .email(email as UserEmail)
            .password(password as UserPassword)
            .status(status as UserStatus)
            .build();

          const updatedUser = await this.useCase.execute(user);
          this.logger.info('User updated successfully', { id });
          return updatedUser;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to update user', { id, error: normalizedError });
          throw error;
        }
      },
      {
        params: UserIdParamsDto,
        body: UpdateUserRequestDto,
        response: {
          200: UpdateUserResponseDto,
          404: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Update user by ID',
          description: 'Updates an existing user with the provided information',
          tags: ['Users'],
        },
      }
    );
  }
}
