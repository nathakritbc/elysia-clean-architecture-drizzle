import { inject, injectable } from 'tsyringe';

import { ContentModuleTokens } from '@modules/content/module.tokens';
import {
  type GetAllPostsQuery,
  type GetAllPostsReturnType,
  PostRepository,
} from '@modules/content/domain/ports/post.repository';
import type { IUseCase } from '@shared/application/use-case';

@injectable()
export class GetAllPostsUseCase implements IUseCase<GetAllPostsQuery, GetAllPostsReturnType> {
  constructor(
    @inject(ContentModuleTokens.PostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(query: GetAllPostsQuery): Promise<GetAllPostsReturnType> {
    return this.postRepository.getAll(query);
  }
}
