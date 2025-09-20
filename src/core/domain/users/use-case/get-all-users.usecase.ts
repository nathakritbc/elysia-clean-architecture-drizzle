import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { IUser } from '../entity/user.entity';
import { UserRepository } from '../service/user.repository';
import { TOKENS } from '../../../shared/tokens';

@injectable()
export class GetAllUsersUseCase implements IUseCase<void, IUser[]> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async execute(): Promise<IUser[]> {
    return this.userRepository.getAll();
  }
}
