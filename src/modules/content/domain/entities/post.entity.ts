import { Brand } from '@shared/kernel/brand.type';
import { EStatus } from '@shared/kernel/status.enum';

export type PostId = Brand<string, 'PostId'>;
export type PostTitle = Brand<string, 'PostTitle'>;
export type PostContent = Brand<string, 'PostContent'>;
export type PostStatus = Brand<EStatus, 'PostStatus'>;
export type PostCreatedAt = Brand<Date, 'PostCreatedAt'>;
export type PostUpdatedAt = Brand<Date, 'PostUpdatedAt'>;

export interface IPost {
  id: PostId;
  title: PostTitle;
  content: PostContent;
  status: PostStatus;
  createdAt?: PostCreatedAt;
  updatedAt?: PostUpdatedAt;
}

export class Post implements IPost {
  id: PostId = '' as PostId;
  title: PostTitle = '' as PostTitle;
  content: PostContent = '' as PostContent;
  status: PostStatus = '' as PostStatus;
  createdAt?: PostCreatedAt;
  updatedAt?: PostUpdatedAt;
}
