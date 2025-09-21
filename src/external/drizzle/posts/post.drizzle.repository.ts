import { and, asc, desc, ilike, sql, eq, or, type SQL } from 'drizzle-orm';
import { injectable } from 'tsyringe';
import { db } from '../connection';
import { posts, type Post as DrizzlePost } from './post.schema';
import { Builder } from 'builder-pattern';
import { isEmpty } from 'radash';
import {
  IPost,
  Post,
  PostContent,
  PostCreatedAt,
  PostId,
  PostStatus,
  PostTitle,
  PostUpdatedAt,
} from '../../../core/domain/posts/entity/post.entity';
import {
  GetAllPostsQuery,
  GetAllPostsReturnType,
  PostRepository,
} from '../../../core/domain/posts/service/post.repository';

@injectable()
export class PostDrizzleRepository extends PostRepository {
  async create(post: IPost): Promise<IPost> {
    const result = await db
      .insert(posts)
      .values({
        title: post.title as string,
        content: post.content as string,
        status: post.status,
      })
      .returning();

    return this.toDomain(result[0]);
  }

  async getAll(query: GetAllPostsQuery): Promise<GetAllPostsReturnType> {
    const { search, sort, order, page = 1, limit = 10 } = query;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const offset = (safePage - 1) * safeLimit;

    const filters: SQL[] = [];

    if (search) {
      const searchValue = `%${search}%`;
      const result = or(ilike(posts.title, searchValue), ilike(posts.content, searchValue));
      filters.push(result ?? sql``);
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const sortKey = (sort ?? 'created_at').toLowerCase();
    const sortMap = {
      id: posts.id,
      title: posts.title,
      status: posts.status,
      created_at: posts.created_at,
      createdAt: posts.created_at,
      updated_at: posts.updated_at,
      updatedAt: posts.updated_at,
    } as const;

    const sortColumn = sortMap[sortKey as keyof typeof sortMap] ?? posts.created_at;
    const orderClause = order?.toLowerCase() === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(posts);
    const totalResult = await (whereClause ? countQuery.where(whereClause) : countQuery);
    const total = totalResult[0]?.count ? Number(totalResult[0]?.count) : 0;

    let dataQuery = db.select().from(posts).$dynamic();
    if (whereClause) dataQuery = dataQuery.where(whereClause);

    const rows = await dataQuery.orderBy(orderClause).limit(safeLimit).offset(offset);
    const totalPages = safeLimit > 0 ? Math.ceil(total / safeLimit) : 0;
    const result = !isEmpty(rows) ? rows.map(row => this.toDomain(row)) : [];

    return {
      result,
      meta: {
        limit: safeLimit,
        page: safePage,
        total,
        totalPages,
      },
    };
  }

  async getById(id: PostId): Promise<IPost | undefined> {
    const result = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id as string))
      .limit(1);

    return result[0] ? this.toDomain(result[0]) : undefined;
  }

  private toDomain(drizzlePost: DrizzlePost): IPost {
    return Builder(Post)
      .id(drizzlePost.id as PostId)
      .title(drizzlePost.title as PostTitle)
      .content(drizzlePost.content as PostContent)
      .status(drizzlePost.status as PostStatus)
      .createdAt(drizzlePost.created_at as PostCreatedAt)
      .updatedAt(drizzlePost.updated_at as PostUpdatedAt)
      .build();
  }
}
