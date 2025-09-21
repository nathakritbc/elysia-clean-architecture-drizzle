import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { TOKENS } from '../../../shared/tokens';
import { NotFoundError } from '../../../shared/errors/error-mapper';
import { IPost, PostId } from '../entity/post.entity';
import { PostRepository } from '../service/post.repository';

@injectable()
export class GetPostByIdUseCase implements IUseCase<PostId, IPost> {
  constructor(
    @inject(TOKENS.IPostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(postId: PostId): Promise<IPost> {
    const post = await this.postRepository.getById(postId);
    if (!post) throw new NotFoundError('Post not found');
    return post;
  }
}
