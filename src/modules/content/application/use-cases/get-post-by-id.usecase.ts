import { inject, injectable } from 'tsyringe';

import { ContentModuleTokens } from '@modules/content/module.tokens';
import type { IPost, PostId } from '@modules/content/domain/entities/post.entity';
import { PostRepository } from '@modules/content/domain/ports/post.repository';
import { NotFoundError } from '@shared/errors/error-mapper';
import type { IUseCase } from '@shared/application/use-case';

@injectable()
export class GetPostByIdUseCase implements IUseCase<PostId, IPost> {
  constructor(
    @inject(ContentModuleTokens.PostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(postId: PostId): Promise<IPost> {
    const post = await this.postRepository.getById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    return post;
  }
}
