import { UserEmail, UserId, IUser } from '../entity/user.entity';

export interface UpdateUserByIdInput {
  id: UserId;
  user: Partial<IUser>;
}

export abstract class UserRepository {
  abstract create(user: IUser): Promise<IUser>;
  abstract deleteById(id: UserId): Promise<boolean>;
  abstract findAll(): Promise<IUser[]>;
  abstract findById(id: UserId): Promise<IUser | undefined>;
  abstract getByEmail(email: UserEmail): Promise<IUser | undefined>;
  abstract updateById({ id, user }: UpdateUserByIdInput): Promise<IUser>;
}
