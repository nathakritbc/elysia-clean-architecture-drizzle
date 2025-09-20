import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { DeleteUserByIdUseCase } from '../../core/domain/users/use-case/delete-user-by-id.usecase';
import { UserId } from '../../core/domain/users/entity/user.entity';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { DeleteUserResponseDto, ErrorResponseDto, UserIdParamsDto } from './dtos/user.dto';

@injectable()
export class DeleteUserByIdController {
  constructor(
    @inject(DeleteUserByIdUseCase) private readonly useCase: DeleteUserByIdUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.delete(
      '/users/:id',
      async ({ params }) => {
        const { id } = params as { id: UserId };
        try {
          this.logger.info('Deleting user by id', { id });
          await this.useCase.execute(id);
          this.logger.info('User deleted successfully', { id });
          return { success: true };
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to delete user', { id, error: normalizedError });
          throw error;
        }
      },
      {
        params: UserIdParamsDto,
        response: {
          200: DeleteUserResponseDto,
          404: ErrorResponseDto,
        },
        detail: {
          summary: 'Delete user by ID',
          description: 'Deletes a user identified by the provided ID',
          tags: ['Users'],
        },
      }
    );
  }
}
