import { UserEmail, UserId, IUser } from '../entity/user.entity';

export interface UpdateUserByIdInput {
  id: UserId;
  user: Partial<IUser>;
}

export abstract class UserRepository {
  abstract create(user: IUser): Promise<IUser>;
  abstract deleteById(id: UserId): Promise<void>;
  abstract getAll(): Promise<IUser[]>;
  abstract getById(id: UserId): Promise<IUser | undefined>;
  abstract getByEmail(email: UserEmail): Promise<IUser | undefined>;
  abstract updateById({ id, user }: UpdateUserByIdInput): Promise<IUser>;
}
