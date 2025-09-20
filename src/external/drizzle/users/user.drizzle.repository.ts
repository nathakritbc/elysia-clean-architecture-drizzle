import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { injectable } from 'tsyringe';
import { db } from '../connection';
import { users, type User as DrizzleUser } from './user.schema';
import { isEmpty } from 'radash';
import {
  BUserName,
  User,
  UserCreatedAt,
  UserEmail,
  UserId,
  UserStatus,
  UserPassword,
  UserUpdatedAt,
  IUser,
} from '../../../core/domain/users/entity/user.entity';
import { Builder } from 'builder-pattern';
import {
  GetAllUsersQuery,
  GetAllUsersReturnType,
  UserRepository,
} from '../../../core/domain/users/service/user.repository';

@injectable()
export class UserDrizzleRepository extends UserRepository {
  async deleteById(id: UserId): Promise<void> {
    await db.delete(users).where(eq(users.id, id as string));
  }

  async getById(id: UserId): Promise<IUser | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id as string))
      .limit(1);

    return result[0] ? this.toDomain(result[0]) : undefined;
  }

  async getAll(query: GetAllUsersQuery): Promise<GetAllUsersReturnType> {
    const { search, sort, order, page = 1, limit = 10, name, email } = query;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const offset = (safePage - 1) * safeLimit;

    const filters: SQL[] = [];

    if (search) {
      const searchValue = `%${search}%`;
      const result = or(ilike(users.name, searchValue), ilike(users.email, searchValue));
      filters.push(result ?? sql``);
    }

    if (name) {
      const result = ilike(users.name, `%${name as string}%`);
      filters.push(result ?? sql``);
    }

    if (email) {
      const result = ilike(users.email, `%${email as string}%`);
      filters.push(result ?? sql``);
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const sortKey = (sort ?? 'created_at').toLowerCase();
    const sortMap = {
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      created_at: users.created_at,
      createdAt: users.created_at,
      updatedAt: users.updated_at,
    } as const;

    const sortColumn = sortMap[sortKey as keyof typeof sortMap] ?? users.created_at;
    const orderClause = order?.toLowerCase() === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(users);
    const totalResult = await (whereClause ? countQuery.where(whereClause) : countQuery);
    const total = totalResult[0]?.count ?? 0;

    let dataQuery = db.select().from(users).$dynamic();

    if (whereClause) dataQuery = dataQuery.where(whereClause);

    const rows = await dataQuery.orderBy(orderClause).limit(safeLimit).offset(offset);
    const totalPages = safeLimit > 0 ? Math.ceil(total / safeLimit) : 0;
    const result = !isEmpty(rows) ? rows.map(row => this.toDomain(row)) : [];

    return {
      result,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
      },
    };
  }

  async getByEmail(email: UserEmail): Promise<IUser | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] ? this.toDomain(result[0]) : undefined;
  }

  async updateById(user: IUser): Promise<IUser> {
    const result = await db
      .update(users)
      .set(user)
      .where(eq(users.id, user.id as string))
      .returning();
    return this.toDomain(result[0]);
  }

  async create(user: IUser): Promise<IUser> {
    const result = await db
      .insert(users)
      .values({
        name: user.name as string,
        email: user.email as string,
        password: user.password as string,
      })
      .returning();
    return this.toDomain(result[0]);
  }

  private toDomain(drizzleUser: DrizzleUser): IUser {
    return Builder(User)
      .id(drizzleUser.id as UserId)
      .email(drizzleUser.email as UserEmail)
      .name(drizzleUser.name as BUserName)
      .password(drizzleUser.password as UserPassword)
      .createdAt(drizzleUser.created_at as UserCreatedAt)
      .updatedAt(drizzleUser.updated_at as UserUpdatedAt)
      .status(drizzleUser.status as UserStatus)
      .build();
  }
}
