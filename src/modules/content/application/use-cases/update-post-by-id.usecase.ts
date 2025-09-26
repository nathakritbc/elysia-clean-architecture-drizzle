import { inject, injectable } from 'tsyringe';

import { ContentModuleTokens } from '@modules/content/module.tokens';
import type { IPost } from '@modules/content/domain/entities/post.entity';
import { PostRepository } from '@modules/content/domain/ports/post.repository';
import { NotFoundError } from '@shared/errors/error-mapper';
import type { IUseCase } from '@shared/application/use-case';

@injectable()
export class UpdatePostByIdUseCase implements IUseCase<IPost, IPost> {
  constructor(
    @inject(ContentModuleTokens.PostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(post: IPost): Promise<IPost> {
    const postExist = await this.postRepository.getById(post.id);
    if (!postExist) {
      throw new NotFoundError('Post not found');
    }

    return this.postRepository.updateById(post);
  }
}
