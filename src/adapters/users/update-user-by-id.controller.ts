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
import { UserMapper } from './mappers/user.mapper';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { UpdateUserRequestDto, UpdateUserResponseDto, ErrorResponseDto, UserIdParamsDto } from './dtos/user.dto';
import { Builder, StrictBuilder } from 'builder-pattern';
import { UpdateUserByIdInput } from '../../core/domain/users/service/user.repository';

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

          const userToUpdate = Builder<IUser>()
            .name(name as BUserName)
            .email(email as UserEmail)
            .password(password as UserPassword)
            .status(status as UserStatus)
            .build();
          const input = StrictBuilder<UpdateUserByIdInput>().id(id).user(userToUpdate).build();

          const updatedUser = await this.useCase.execute(input);
          this.logger.info('User updated successfully', { id });
          return UserMapper.mapToDto(updatedUser);
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
