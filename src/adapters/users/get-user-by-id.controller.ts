import Elysia, { t } from 'elysia';
import { inject, injectable } from 'tsyringe';
import { getUserByIdUseCase } from '../../core/domain/users/use-case/get-user-by-id.usecase';
import { GetUserResponseDto, ErrorResponseDto } from '../../core/shared/dtos/user.dto';
import { UserId } from '../../core/domain/users/entity/user.entity';
import { UserMapper } from './mappers/user.mapper';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';

@injectable()
export class GetUserByIdController {
  constructor(
    @inject(getUserByIdUseCase) private readonly useCase: getUserByIdUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.get(
      '/users/:id',
      async ({ params }) => {
        const { id } = params as { id: UserId };
        try {
          this.logger.info('Fetching user by id', { id });
          const user = await this.useCase.execute(id);

          this.logger.debug('User fetched successfully', { id });
          return UserMapper.mapToDto(user);
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to fetch user by id', { id, error: normalizedError });
          throw error;
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: GetUserResponseDto,
          404: ErrorResponseDto,
        },
        detail: {
          summary: 'Get user by ID',
          description: 'Retrieves a specific user by their ID',
          tags: ['Users'],
        },
      }
    );
  }
}
