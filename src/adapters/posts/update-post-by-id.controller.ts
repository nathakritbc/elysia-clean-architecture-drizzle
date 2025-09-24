import { Builder } from 'builder-pattern';
import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';

import { IPost, PostContent, PostId, PostStatus, PostTitle } from '../../core/domain/posts/entity/post.entity';
import { UpdatePostByIdUseCase } from '../../core/domain/posts/use-case/update-post-by-id.usecase';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import { ErrorResponseDto, PostIdParamsDto, UpdatePostRequestDto, UpdatePostResponseDto } from './dtos/post.dto';

@injectable()
export class UpdatePostByIdController {
  constructor(
    @inject(UpdatePostByIdUseCase) private readonly useCase: UpdatePostByIdUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.put(
      '/posts/:id',
      async ({ params, body }) => {
        const { id } = params as { id: PostId };
        const { title, content, status } = body;

        try {
          this.logger.info('Updating post by id', { id });
          this.logger.info('Post to update', body);

          const post = Builder<IPost>()
            .id(id)
            .title(title as PostTitle)
            .content(content as PostContent)
            .status(status as PostStatus)
            .build();

          const updatedPost = await this.useCase.execute(post);
          this.logger.info('Post updated successfully', { id });
          return updatedPost;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to update post', { id, error: normalizedError });
          throw error;
        }
      },
      {
        params: PostIdParamsDto,
        body: UpdatePostRequestDto,
        response: {
          200: UpdatePostResponseDto,
          404: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Update post by ID',
          description: 'Updates an existing post with the provided information',
          tags: ['Posts'],
        },
      }
    );
  }
}
