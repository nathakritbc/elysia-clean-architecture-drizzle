import { Builder } from 'builder-pattern';
import dayjs from 'dayjs';
import { inject, injectable } from 'tsyringe';

import { EStatus } from '../../../shared/status.enum';
import { TOKENS } from '../../../shared/tokens';
import { IUseCase } from '../../../shared/useCase';
import { IPost, Post, PostContent, PostCreatedAt, PostStatus, PostTitle, PostUpdatedAt } from '../entity/post.entity';
import { PostRepository } from '../service/post.repository';

export interface CreatePostInput {
  title: PostTitle;
  content: PostContent;
}

@injectable()
export class CreatePostUseCase implements IUseCase<CreatePostInput, IPost> {
  constructor(
    @inject(TOKENS.IPostRepository)
    private readonly postRepository: PostRepository
  ) {}

  async execute(input: CreatePostInput): Promise<IPost> {
    const { title, content } = input;

    const post = Builder(Post)
      .title(title)
      .content(content)
      .createdAt(dayjs().toDate() as PostCreatedAt)
      .updatedAt(dayjs().toDate() as PostUpdatedAt)
      .status(EStatus.active as PostStatus)
      .build();

    return await this.postRepository.create(post);
  }
}
