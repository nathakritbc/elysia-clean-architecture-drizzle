import { Brand } from "../../../shared/branded.type";
import { EStatus } from "../../../shared/status.enum";

export type UserId = Brand<string, "UserId">;
export type BUserName = Brand<string, "BUserName">;
export type UserPassword = Brand<string, "PasswordUser">;
export type UserEmail = Brand<string, "EmailUser">;
export type UserCreatedAt = Brand<Date, "UserCreatedAt">;
export type UserStatus = Brand<EStatus, "UserStatus">;
export type UserUpdatedAt = Brand<Date, "UserUpdatedAt">;

export interface IUser {
  id: UserId;
  name: BUserName;
  password: UserPassword;
  email: UserEmail;
  status: UserStatus;
  createdAt?: UserCreatedAt;
  updatedAt?: UserUpdatedAt;
}

export class User implements IUser {
  id: UserId = "" as UserId;
  name: BUserName = "" as BUserName;
  password: UserPassword = "" as UserPassword;
  email: UserEmail = "" as UserEmail;
  status: UserStatus = "" as UserStatus;
  createdAt?: UserCreatedAt;
  updatedAt?: UserUpdatedAt;
}
