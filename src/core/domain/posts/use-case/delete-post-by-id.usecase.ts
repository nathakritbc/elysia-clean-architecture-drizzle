import { inject, injectable } from 'tsyringe';

import { NotFoundError } from '../../../shared/errors/error-mapper';
import { TOKENS } from '../../../shared/tokens';
import { IUseCase } from '../../../shared/useCase';
import { PostId } from '../entity/post.entity';
import { PostRepository } from '../service/post.repository';

@injectable()
export class DeletePostByIdUseCase implements IUseCase<PostId, void> {
  constructor(
    @inject(TOKENS.IPostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(input: PostId): Promise<void> {
    const postExist = await this.postRepository.getById(input);

    if (!postExist) throw new NotFoundError('Post not found');

    return this.postRepository.deleteById(input);
  }
}
