import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';

import { DeletePostByIdUseCase } from '@modules/content/application/use-cases/delete-post-by-id.usecase';
import type { PostId } from '@modules/content/domain/entities/post.entity';
import {
  DeletePostResponseDto,
  ErrorResponseDto,
  PostIdParamsDto,
} from '@modules/content/interface/http/dtos/post.dto';
import { PlatformTokens } from '@platform/di/tokens';
import type { LoggerPort } from '@shared/logging/logger.port';

@injectable()
export class DeletePostByIdController {
  constructor(
    @inject(DeletePostByIdUseCase) private readonly useCase: DeletePostByIdUseCase,
    @inject(PlatformTokens.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.delete(
      '/posts/:id',
      async ({ params }) => {
        const { id } = params as { id: PostId };

        this.logger.info('Deleting post by id', { id });
        await this.useCase.execute(id);
        this.logger.info('Post deleted successfully', { id });

        return { success: true };
      },
      {
        params: PostIdParamsDto,
        response: {
          200: DeletePostResponseDto,
          404: ErrorResponseDto,
        },
        detail: {
          summary: 'Delete post by ID',
          description: 'Deletes a post identified by the provided ID',
          tags: ['Posts'],
        },
      }
    );
  }
}
