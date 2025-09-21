import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { GetAllPostsUseCase } from '../../core/domain/posts/use-case/get-all-posts.usecase';
import { Builder } from 'builder-pattern';
import { GetAllPostsQuery } from '../../core/domain/posts/service/post.repository';
import { ErrorResponseDto, GetAllPostsQueryDto, GetAllPostsReturnTypeDto } from './dtos/post.dto';

@injectable()
export class GetAllPostsController {
  constructor(
    @inject(GetAllPostsUseCase) private readonly useCase: GetAllPostsUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(server: Elysia) {
    server.get(
      '/posts',
      async ({ query }) => {
        try {
          this.logger.info('Fetching posts', { query });

          const page = Number(query?.page ?? 1);
          const limit = Number(query?.limit ?? -1);
          const queryParams = Builder<GetAllPostsQuery>()
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
