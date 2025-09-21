import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { Post, PostTitle, PostContent, PostStatus, PostUpdatedAt, PostCreatedAt, IPost } from '../entity/post.entity';
import { TOKENS } from '../../../shared/tokens';
import { EStatus } from '../../../shared/status.enum';
import { Builder } from 'builder-pattern';
import { PostRepository } from '../service/post.repository';
import dayjs from 'dayjs';

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
