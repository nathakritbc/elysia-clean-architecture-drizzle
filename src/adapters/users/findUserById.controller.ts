import Elysia, { t } from 'elysia';
import { inject, injectable } from 'tsyringe';
import { FindUserByIdUseCase } from '../../core/domain/users/use-case/findUserById.usecase';
import { GetUserResponseDto, ErrorResponseDto } from '../../core/shared/dtos/user.dto';
import { UserId } from '../../core/domain/users/entity/user.entity';
import { UserMapper } from './mappers/user.mapper';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';

@injectable()
export class FindUserByIdController {
  constructor(
    @inject(FindUserByIdUseCase) private readonly useCase: FindUserByIdUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.get(
      '/users/:id',
      async ({ params }) => {
        const { id } = params as { id: string };
        try {
          this.logger.info('Fetching user by id', { id });
          const user = await this.useCase.execute(id as UserId);
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
          400: ErrorResponseDto,
          404: ErrorResponseDto,
          500: ErrorResponseDto,
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
