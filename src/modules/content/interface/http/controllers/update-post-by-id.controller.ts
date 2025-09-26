import { Builder } from 'builder-pattern';
import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';

import { UpdatePostByIdUseCase } from '@modules/content/application/use-cases/update-post-by-id.usecase';
import {
  type IPost,
  type PostContent,
  type PostId,
  type PostStatus,
  type PostTitle,
} from '@modules/content/domain/entities/post.entity';
import {
  ErrorResponseDto,
  PostIdParamsDto,
  UpdatePostRequestDto,
  UpdatePostResponseDto,
} from '@modules/content/interface/http/dtos/post.dto';
import { PlatformTokens } from '@platform/di/tokens';
import type { LoggerPort } from '@shared/logging/logger.port';

@injectable()
export class UpdatePostByIdController {
  constructor(
    @inject(UpdatePostByIdUseCase) private readonly useCase: UpdatePostByIdUseCase,
    @inject(PlatformTokens.Logger) private readonly logger: LoggerPort
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

          const post: IPost = Builder<IPost>()
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
