import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { GetAllPostsQuery, GetAllPostsReturnType, PostRepository } from '../service/post.repository';
import { TOKENS } from '../../../shared/tokens';

@injectable()
export class GetAllPostsUseCase implements IUseCase<GetAllPostsQuery, GetAllPostsReturnType> {
  constructor(
    @inject(TOKENS.IPostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(query: GetAllPostsQuery): Promise<GetAllPostsReturnType> {
    return this.postRepository.getAll(query);
  }
}
