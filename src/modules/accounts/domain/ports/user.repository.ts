import type { GetAllMetaType, GetAllParamsType } from '@shared/kernel/types';
import type { BUserName, IUser, UserEmail, UserId } from '@modules/accounts/domain/entities/user.entity';

export interface GetAllUsersQuery extends GetAllParamsType {
  name?: BUserName;
  email?: UserEmail;
}

export interface GetAllUsersReturnType {
  result: IUser[];
  meta: GetAllMetaType;
}

export abstract class UserRepository {
  abstract create(user: IUser): Promise<IUser>;
  abstract getByEmail(email: UserEmail): Promise<IUser | undefined>;
  abstract getById(id: UserId): Promise<IUser | undefined>;
}
