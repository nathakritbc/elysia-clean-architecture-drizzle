import { UserEmail, UserId, IUser } from '../entity/user.entity';

export abstract class UserRepository {
  abstract getByEmail(email: UserEmail): Promise<IUser | undefined>;
  abstract create(user: IUser): Promise<IUser>;
  abstract findAll(): Promise<IUser[]>;
  abstract findById(id: UserId): Promise<IUser | undefined>;
  abstract deleteById(id: UserId): Promise<boolean>;
}
