import { Builder } from 'builder-pattern';
import dayjs from 'dayjs';
import { inject, injectable } from 'tsyringe';

import { ContentModuleTokens } from '@modules/content/module.tokens';
import {
  type IPost,
  Post,
  type PostContent,
  type PostCreatedAt,
  type PostStatus,
  type PostTitle,
  type PostUpdatedAt,
} from '@modules/content/domain/entities/post.entity';
import { PostRepository } from '@modules/content/domain/ports/post.repository';
import { EStatus } from '@shared/kernel/status.enum';
import type { IUseCase } from '@shared/application/use-case';

export interface CreatePostInput {
  title: PostTitle;
  content: PostContent;
}

@injectable()
export class CreatePostUseCase implements IUseCase<CreatePostInput, IPost> {
  constructor(
    @inject(ContentModuleTokens.PostRepository)
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
