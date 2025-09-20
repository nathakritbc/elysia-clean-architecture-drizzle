import { GetAllMetaType, GetAllParamsType } from '../../../shared/common.type';
import { UserEmail, UserId, IUser, BUserName } from '../entity/user.entity';

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
  abstract deleteById(id: UserId): Promise<void>;
  abstract getAll(query: GetAllUsersQuery): Promise<GetAllUsersReturnType>;
  abstract getById(id: UserId): Promise<IUser | undefined>;
  abstract getByEmail(email: UserEmail): Promise<IUser | undefined>;
  abstract updateById(user: IUser): Promise<IUser>;
}
