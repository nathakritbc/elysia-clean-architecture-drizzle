import { GetAllMetaType, GetAllParamsType } from '../../../shared/common.type';
import { BUserName, IUser, UserEmail, UserId } from '../entity/user.entity';

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
