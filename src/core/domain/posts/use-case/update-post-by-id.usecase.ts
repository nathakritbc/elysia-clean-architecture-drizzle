import { inject, injectable } from 'tsyringe';

import { NotFoundError } from '../../../shared/errors/error-mapper';
import { TOKENS } from '../../../shared/tokens';
import { IUseCase } from '../../../shared/useCase';
import { IPost } from '../entity/post.entity';
import { PostRepository } from '../service/post.repository';

@injectable()
export class UpdatePostByIdUseCase implements IUseCase<IPost, IPost> {
  constructor(
    @inject(TOKENS.IPostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(post: IPost): Promise<IPost> {
    const postExist = await this.postRepository.getById(post.id);
    if (!postExist) throw new NotFoundError('Post not found');

    return this.postRepository.updateById(post);
  }
}
