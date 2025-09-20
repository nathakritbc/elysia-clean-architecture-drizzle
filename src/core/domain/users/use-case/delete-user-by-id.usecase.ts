import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { UserId } from '../entity/user.entity';
import { UserRepository } from '../service/user.repository';
import { TOKENS } from '../../../shared/tokens';
import { NotFoundError } from 'elysia';

@injectable()
export class DeleteUserByIdUseCase implements IUseCase<UserId, void> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async execute(input: UserId): Promise<void> {
    const userExist = await this.userRepository.getById(input);

    if (!userExist) throw new NotFoundError('User not found');

    return this.userRepository.deleteById(input);
  }
}
