import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { IUser } from '../entity/user.entity';
import { UpdateUserByIdInput, UserRepository } from '../service/user.repository';
import { TOKENS } from '../../../shared/tokens';
import { NotFoundError } from '../../../shared/errors/error-mapper';

@injectable()
export class UpdateUserByIdUseCase implements IUseCase<UpdateUserByIdInput, IUser> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async execute({ id, user }: UpdateUserByIdInput): Promise<IUser> {
    const userExist = await this.userRepository.getById(id);
    if (!userExist) throw new NotFoundError('User not found');

    return this.userRepository.updateById({ id, user });
  }
}
