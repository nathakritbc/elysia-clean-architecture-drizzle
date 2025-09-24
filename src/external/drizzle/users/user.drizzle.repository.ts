import { Builder } from 'builder-pattern';
import { and, eq } from 'drizzle-orm';
import { injectable } from 'tsyringe';

import {
  BUserName,
  IUser,
  User,
  UserCreatedAt,
  UserEmail,
  UserId,
  UserPassword,
  UserStatus,
  UserUpdatedAt,
} from '../../../core/domain/users/entity/user.entity';
import { UserRepository } from '../../../core/domain/users/service/user.repository';
import { EStatus } from '../../../core/shared/status.enum';
import { db } from '../connection';
import { type User as DrizzleUser, users } from './user.schema';

@injectable()
export class UserDrizzleRepository extends UserRepository {
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

  async getByEmail(email: UserEmail): Promise<IUser | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.status, EStatus.active)))
      .limit(1);
    return result[0] ? this.toDomain(result[0]) : undefined;
  }

  async getById(id: UserId): Promise<IUser | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.status, EStatus.active)))
      .limit(1);
    return result[0] ? this.toDomain(result[0]) : undefined;
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
