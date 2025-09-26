import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';

import { GetPostByIdUseCase } from '@modules/content/application/use-cases/get-post-by-id.usecase';
import type { PostId } from '@modules/content/domain/entities/post.entity';
import { ErrorResponseDto, GetPostResponseDto, PostIdParamsDto } from '@modules/content/interface/http/dtos/post.dto';
import { PlatformTokens } from '@platform/di/tokens';
import type { LoggerPort } from '@shared/logging/logger.port';

@injectable()
export class GetPostByIdController {
  constructor(
    @inject(GetPostByIdUseCase) private readonly useCase: GetPostByIdUseCase,
    @inject(PlatformTokens.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.get(
      '/posts/:id',
      async ({ params }) => {
        const { id } = params as { id: PostId };
        try {
          this.logger.info('Fetching post by id', { id });
          const post = await this.useCase.execute(id);

          this.logger.debug('Post fetched successfully', { id });
          return post;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to fetch post by id', { id, error: normalizedError });
          throw error;
        }
      },
      {
        params: PostIdParamsDto,
        response: {
          200: GetPostResponseDto,
          404: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Get post by ID',
          description: 'Retrieves a specific post by its ID',
          tags: ['Posts'],
        },
      }
    );
  }
}
