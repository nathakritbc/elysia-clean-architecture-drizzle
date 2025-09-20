import { eq } from 'drizzle-orm';
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

  async getAll(): Promise<IUser[]> {
    const result = await db.select().from(users);
    return result ? result.map(user => this.toDomain(user)) : [];
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
