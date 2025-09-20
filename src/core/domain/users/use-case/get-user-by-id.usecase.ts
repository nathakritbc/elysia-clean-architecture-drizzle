import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { IUser, UserId } from '../entity/user.entity';
import { UserRepository } from '../service/user.repository';
import { TOKENS } from '../../../shared/tokens';
import { NotFoundError } from 'elysia';

@injectable()
export class getUserByIdUseCase implements IUseCase<UserId, IUser> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async execute(userId: UserId): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
