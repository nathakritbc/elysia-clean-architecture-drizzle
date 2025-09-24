import { StrictBuilder } from 'builder-pattern';
import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';

import { PostTitle } from '../../core/domain/posts/entity/post.entity';
import { PostContent } from '../../core/domain/posts/entity/post.entity';
import { CreatePostInput, CreatePostUseCase } from '../../core/domain/posts/use-case/create-post.usecase';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import { CreatePostRequestDto, CreatePostResponseDto, ErrorResponseDto } from './dtos/post.dto';

@injectable()
export class CreatePostController {
  constructor(
    @inject(CreatePostUseCase) private readonly useCase: CreatePostUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.post(
      '/posts',
      async ({ body }) => {
        const input = StrictBuilder<CreatePostInput>()
          .title(body.title as PostTitle)
          .content(body.content as PostContent)
          .build();

        try {
          this.logger.info('Creating post', { ...input });

          const postCreated = await this.useCase.execute(input);

          this.logger.info('Post created successfully', { ...postCreated });

          return postCreated;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to create post', { ...input, error: normalizedError });
          throw error;
        }
      },
      {
        body: CreatePostRequestDto,
        response: {
          200: CreatePostResponseDto,
          400: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Create a new post',
          description: 'Creates a new post with the provided title and content',
          tags: ['Posts'],
        },
      }
    );
  }
}
