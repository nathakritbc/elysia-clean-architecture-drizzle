import { GetAllMetaType, GetAllParamsType } from '../../../shared/common.type';
import { IPost, PostId } from '../entity/post.entity';

export interface GetAllPostsQuery extends GetAllParamsType {}

export interface GetAllPostsReturnType {
  result: IPost[];
  meta: GetAllMetaType;
}

export abstract class PostRepository {
  abstract create(post: IPost): Promise<IPost>;
  abstract getAll(query: GetAllPostsQuery): Promise<GetAllPostsReturnType>;
  abstract getById(id: PostId): Promise<IPost | undefined>;
}
