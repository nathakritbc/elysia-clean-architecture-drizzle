import { and, eq, not } from 'drizzle-orm';
import { injectable } from 'tsyringe';
import { db } from '../connection';
import { users, type User as DrizzleUser } from './user.schema';
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
import { UserRepository } from '../../../core/domain/users/service/user.repository';
import { EStatus } from '../../../core/shared/status.enum';

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
      .where(and(eq(users.email, email), not(eq(users.status, EStatus.deleted))))
      .limit(1);
    return result[0] ? this.toDomain(result[0]) : undefined;
  }

  async getById(id: UserId): Promise<IUser | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), not(eq(users.status, EStatus.deleted))))
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
