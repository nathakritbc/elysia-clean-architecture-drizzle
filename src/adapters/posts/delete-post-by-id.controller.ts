import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';
import { DeletePostByIdUseCase } from '../../core/domain/posts/use-case/delete-post-by-id.usecase';
import { PostId } from '../../core/domain/posts/entity/post.entity';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { DeletePostResponseDto, ErrorResponseDto, PostIdParamsDto } from './dtos/post.dto';

@injectable()
export class DeletePostByIdController {
  constructor(
    @inject(DeletePostByIdUseCase) private readonly useCase: DeletePostByIdUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
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
