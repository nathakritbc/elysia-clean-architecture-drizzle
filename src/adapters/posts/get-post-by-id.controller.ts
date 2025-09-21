import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { GetPostByIdUseCase } from '../../core/domain/posts/use-case/get-post-by-id.usecase';
import { PostId } from '../../core/domain/posts/entity/post.entity';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { GetPostResponseDto, ErrorResponseDto, PostIdParamsDto } from './dtos/post.dto';

@injectable()
export class GetPostByIdController {
  constructor(
    @inject(GetPostByIdUseCase) private readonly useCase: GetPostByIdUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
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
