import { inject, injectable } from 'tsyringe';

import { ContentModuleTokens } from '@modules/content/module.tokens';
import { PostRepository } from '@modules/content/domain/ports/post.repository';
import type { PostId } from '@modules/content/domain/entities/post.entity';
import { NotFoundError } from '@shared/errors/error-mapper';
import type { IUseCase } from '@shared/application/use-case';

@injectable()
export class DeletePostByIdUseCase implements IUseCase<PostId, void> {
  constructor(
    @inject(ContentModuleTokens.PostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(input: PostId): Promise<void> {
    const postExist = await this.postRepository.getById(input);

    if (!postExist) {
      throw new NotFoundError('Post not found');
    }

    await this.postRepository.deleteById(input);
  }
}
