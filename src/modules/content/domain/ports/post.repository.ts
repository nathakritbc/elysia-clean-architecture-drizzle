import type { GetAllMetaType, GetAllParamsType } from '@shared/kernel/types';
import type { IPost, PostId } from '@modules/content/domain/entities/post.entity';

export interface GetAllPostsQuery extends GetAllParamsType {}

export interface GetAllPostsReturnType {
  result: IPost[];
  meta: GetAllMetaType;
}

export abstract class PostRepository {
  abstract create(post: IPost): Promise<IPost>;
  abstract deleteById(id: PostId): Promise<void>;
  abstract getAll(query: GetAllPostsQuery): Promise<GetAllPostsReturnType>;
  abstract getById(id: PostId): Promise<IPost | undefined>;
  abstract updateById(post: IPost): Promise<IPost>;
}
