import { StrictBuilder } from 'builder-pattern';
import { argon2Config } from '../../../../external/config/auth.config';
import { Brand } from '../../../shared/branded.type';
import { EStatus } from '../../../shared/status.enum';
import * as argon2 from 'argon2';

export type UserId = Brand<string, 'UserId'>;
export type BUserName = Brand<string, 'BUserName'>;
export type UserPassword = Brand<string, 'PasswordUser'>;
export type UserEmail = Brand<string, 'EmailUser'>;
export type UserCreatedAt = Brand<Date, 'UserCreatedAt'>;
export type UserStatus = Brand<EStatus, 'UserStatus'>;
export type UserUpdatedAt = Brand<Date, 'UserUpdatedAt'>;

export interface IUser {
  id: UserId;
  name: BUserName;
  password: UserPassword;
  email: UserEmail;
  status: UserStatus;
  createdAt?: UserCreatedAt;
  updatedAt?: UserUpdatedAt;

  comparePassword(password: UserPassword): Promise<boolean>;
  hiddenPassword(): void;
  setHashPassword(password: UserPassword): Promise<void>;
}

export class User implements IUser {
  id: UserId = '' as UserId;
  name: BUserName = '' as BUserName;
  password: UserPassword = '' as UserPassword;
  email: UserEmail = '' as UserEmail;
  status: UserStatus = '' as UserStatus;
  createdAt?: UserCreatedAt;
  updatedAt?: UserUpdatedAt;

  public async comparePassword(password: UserPassword): Promise<boolean> {
    return argon2.verify(this.password, password);
  }

  public hiddenPassword() {
    this.password = '' as UserPassword;
  }

  public async setHashPassword(password: UserPassword): Promise<void> {
    const argon2Options = StrictBuilder<argon2.Options>()
      .type(argon2.argon2id)
      .memoryCost(argon2Config.memoryCost)
      .timeCost(argon2Config.timeCost)
      .parallelism(argon2Config.parallelism)
      .salt(argon2Config.saltBuffer)
      .build();

    this.password = (await argon2.hash(password, argon2Options)) as UserPassword;
  }
}
