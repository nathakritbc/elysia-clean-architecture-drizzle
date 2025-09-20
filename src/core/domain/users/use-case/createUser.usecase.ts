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
} from '../entity/user.entity';
import { TOKENS } from '../../../shared/tokens';
import { EStatus } from '../../../shared/status.enum';
import { Builder } from 'builder-pattern';
import { UserRepository } from '../service/user.repository';

type Input = {
  name: BUserName;
  email: UserEmail;
  password: UserPassword;
};

@injectable()
export class CreateUserUseCase implements IUseCase<Input, void> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async execute(input: Input): Promise<void> {
    const { name, email, password } = input;

    const isUserExist = await this.userRepository.getByEmail(email);

    if (isUserExist) {
      throw new Error('User already exists');
    }

    const user = Builder(User)
      .email(email as UserEmail)
      .name(name as BUserName)
      .password(password as UserPassword)
      .createdAt(new Date() as UserCreatedAt)
      .updatedAt(new Date() as UserUpdatedAt)
      .status(EStatus.ACTIVE as UserStatus)
      .build();

    await this.userRepository.create(user);
  }
}
