import { Builder } from 'builder-pattern';
import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';

import { GetAllPostsUseCase } from '@modules/content/application/use-cases/get-all-posts.usecase';
import { GetAllPostsQuery } from '@modules/content/domain/ports/post.repository';
import {
  ErrorResponseDto,
  GetAllPostsQueryDto,
  GetAllPostsReturnTypeDto,
} from '@modules/content/interface/http/dtos/post.dto';
import { PlatformTokens } from '@platform/di/tokens';
import type { LoggerPort } from '@shared/logging/logger.port';

@injectable()
export class GetAllPostsController {
  constructor(
    @inject(GetAllPostsUseCase) private readonly useCase: GetAllPostsUseCase,
    @inject(PlatformTokens.Logger) private readonly logger: LoggerPort
  ) {}

  register(server: Elysia) {
    server.get(
      '/posts',
      async ({ query }) => {
        try {
          this.logger.info('Fetching posts', { query });

          const page = Number(query?.page ?? 1);
          const limit = Number(query?.limit ?? -1);
          const queryParams: GetAllPostsQuery = Builder<GetAllPostsQuery>()
            .search(query.search)
            .sort(query.sort)
            .order(query.order)
            .page(page)
            .limit(limit)
            .build();

          const data = await this.useCase.execute(queryParams);
          this.logger.debug('Fetched posts successfully', { count: data.meta.total });

          return data;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to fetch posts', { error: normalizedError });
          throw new Error(`Failed to fetch posts: ${normalizedError.message}`);
        }
      },
      {
        query: GetAllPostsQueryDto,
        response: {
          200: GetAllPostsReturnTypeDto,
          400: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Get all posts',
          description: 'Retrieves a list of blog posts',
          tags: ['Posts'],
        },
      }
    );
  }
}
