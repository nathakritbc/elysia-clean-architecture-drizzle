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
      async ({ params }) => {
        try {
          this.logger.info('Fetching users:', { params });

          const query = Builder<GetAllUsersQuery>()
            .search(params.search)
            .sort(params.sort)
            .order(params.order)
            .page(params.page)
            .limit(params.limit)
            .name(params.name as BUserName)
            .email(params.email as UserEmail)
            .build();

          const data = await this.useCase.execute(query);
          this.logger.debug('Fetched users successfully', { count: data.meta.total });

          return data;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to fetch users', { error: normalizedError });
          throw new Error(`Failed to fetch users: ${normalizedError.message}`);
        }
      },
      {
        params: GetAllUsersQueryDto,
        response: {
          200: GetAllUsersReturnTypeDto,
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
