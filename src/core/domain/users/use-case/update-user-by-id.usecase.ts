import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { IUser } from '../entity/user.entity';
import { UserRepository } from '../service/user.repository';
import { TOKENS } from '../../../shared/tokens';
import { NotFoundError } from '../../../shared/errors/error-mapper';

@injectable()
export class UpdateUserByIdUseCase implements IUseCase<IUser, IUser> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async execute(user: IUser): Promise<IUser> {
    const userExist = await this.userRepository.getById(user.id);
    if (!userExist) throw new NotFoundError('User not found');

    return this.userRepository.updateById(user);
  }
}
