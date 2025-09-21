import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { TOKENS } from '../../../shared/tokens';
import { NotFoundError } from '../../../shared/errors/error-mapper';
import { PostRepository } from '../service/post.repository';
import { IPost } from '../entity/post.entity';

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
