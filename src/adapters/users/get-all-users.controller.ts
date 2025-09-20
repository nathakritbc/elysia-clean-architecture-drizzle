import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { GetAllUsersUseCase } from '../../core/domain/users/use-case/get-all-users.usecase';
import { GetUsersResponseDto } from '../../core/shared/dtos/user.dto';
import { UserMapper } from './mappers/user.mapper';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';

@injectable()
export class GetAllUsersController {
  constructor(
    @inject(GetAllUsersUseCase) private readonly useCase: GetAllUsersUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(server: Elysia) {
    server.get(
      '/users',
      async () => {
        try {
          this.logger.info('Fetching users');
          const data = await this.useCase.execute();
          const count = Array.isArray(data) ? data.length : 0;
          this.logger.debug('Fetched users successfully', { count });
          return UserMapper.mapToDtoArray(data);
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to fetch users', { error: normalizedError });
          throw new Error(`Failed to fetch users: ${normalizedError.message}`);
        }
      },
      {
        response: {
          200: GetUsersResponseDto,
        },
        detail: {
          summary: 'Get all users',
          description: 'Retrieves a list of all users in the system',
          tags: ['Users'],
        },
      }
    );
  }
}
