import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { GetAllUsersUseCase } from '../../core/domain/users/use-case/get-all-users.usecase';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { ErrorResponseDto, GetAllUsersQueryDto, GetAllUsersReturnTypeDto } from './dtos/user.dto';
import { GetAllUsersQuery } from '../../core/domain/users/service/user.repository';
import { Builder } from 'builder-pattern';
import { BUserName, UserEmail } from '../../core/domain/users/entity/user.entity';

@injectable()
export class GetAllUsersController {
  constructor(
    @inject(GetAllUsersUseCase) private readonly useCase: GetAllUsersUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(server: Elysia) {
    server.get(
      '/users',
      async ({ query }) => {
        try {
          this.logger.info('Fetching users:', { query });

          const page = Number(query?.page ?? 1);
          const limit = Number(query?.limit ?? -1);
          const queryParams = Builder<GetAllUsersQuery>()
            .search(query.search)
            .sort(query.sort)
            .order(query.order)
            .page(page)
            .limit(limit)
            .name(query.name as BUserName)
            .email(query.email as UserEmail)
            .build();

          const data = await this.useCase.execute(queryParams);
          this.logger.debug('Fetched users successfully', { count: data.meta.total });

          return data;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to fetch users', { error: normalizedError });
          throw new Error(`Failed to fetch users: ${normalizedError.message}`);
        }
      },
      {
        query: GetAllUsersQueryDto,
        response: {
          200: GetAllUsersReturnTypeDto,
          400: ErrorResponseDto,
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
