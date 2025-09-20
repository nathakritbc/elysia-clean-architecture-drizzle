import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { isEmpty } from 'radash';

import { FindUsersUseCase } from '../../core/domain/users/use-case/findUsers.usecase';
import { GetUsersResponseDto, ErrorResponseDto } from '../../core/shared/dtos/user.dto';
import { UserMapper } from './mappers/user.mapper';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';

@injectable()
export class FindUsersController {
  constructor(
    @inject(FindUsersUseCase) private readonly useCase: FindUsersUseCase,
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
          return !isEmpty(data) ? UserMapper.mapToDtoArray(data) : [];
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to fetch users', { error: normalizedError });
          throw new Error(`Failed to fetch users: ${normalizedError.message}`);
        }
      },
      {
        response: {
          200: GetUsersResponseDto,
          500: ErrorResponseDto,
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
