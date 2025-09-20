import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { isEmpty } from 'radash';

import { FindUsersUseCase } from '../../core/domain/users/use-case/findUsers.usecase';
import { GetUsersResponseDto, ErrorResponseDto } from '../../core/shared/dtos/user.dto';
import { UserMapper } from './mappers/user.mapper';

@injectable()
export class FindUsersController {
  constructor(@inject(FindUsersUseCase) private readonly useCase: FindUsersUseCase) {}

  register(server: Elysia) {
    server.get(
      '/users',
      async () => {
        try {
          const data = await this.useCase.execute();
          return !isEmpty(data) ? UserMapper.mapToDtoArray(data) : [];
        } catch (error) {
          throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
