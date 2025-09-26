import { StrictBuilder } from 'builder-pattern';
import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';

import {
  type CreatePostInput,
  CreatePostUseCase,
} from '@modules/content/application/use-cases/create-post.usecase';
import {
  type PostContent,
  type PostTitle,
} from '@modules/content/domain/entities/post.entity';
import { CreatePostRequestDto, CreatePostResponseDto, ErrorResponseDto } from '@modules/content/interface/http/dtos/post.dto';
import { PlatformTokens } from '@platform/di/tokens';
import type { LoggerPort } from '@shared/logging/logger.port';

@injectable()
export class CreatePostController {
  constructor(
    @inject(CreatePostUseCase) private readonly useCase: CreatePostUseCase,
    @inject(PlatformTokens.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.post(
      '/posts',
      async ({ body }) => {
        const input: CreatePostInput = StrictBuilder<CreatePostInput>()
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
