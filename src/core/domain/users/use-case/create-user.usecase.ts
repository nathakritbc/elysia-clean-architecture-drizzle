import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import {
  User,
  BUserName,
  UserEmail,
  UserPassword,
  UserStatus,
  UserUpdatedAt,
  UserCreatedAt,
  IUser,
} from '../entity/user.entity';
import { TOKENS } from '../../../shared/tokens';
import { EStatus } from '../../../shared/status.enum';
import { Builder } from 'builder-pattern';
import { UserRepository } from '../service/user.repository';
import dayjs from 'dayjs';
export interface CreateUserInput {
  name: BUserName;
  email: UserEmail;
  password: UserPassword;
}

@injectable()
export class CreateUserUseCase implements IUseCase<CreateUserInput, IUser> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async execute(input: CreateUserInput): Promise<IUser> {
    const { name, email, password } = input;

    const user = Builder(User)
      .email(email)
      .name(name)
      .password(password)
      .createdAt(dayjs().toDate() as UserCreatedAt)
      .updatedAt(dayjs().toDate() as UserUpdatedAt)
      .status(EStatus.active as UserStatus)
      .build();

    return await this.userRepository.create(user);
  }
}
