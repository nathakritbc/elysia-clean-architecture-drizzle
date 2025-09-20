import { inject, injectable } from 'tsyringe';
import { IUseCase } from '../../../shared/useCase';
import { GetAllUsersQuery, GetAllUsersReturnType, UserRepository } from '../service/user.repository';
import { TOKENS } from '../../../shared/tokens';

@injectable()
export class GetAllUsersUseCase implements IUseCase<GetAllUsersQuery, GetAllUsersReturnType> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly userRepository: UserRepository
  ) {}

  async execute(query: GetAllUsersQuery): Promise<GetAllUsersReturnType> {
    return this.userRepository.getAll(query);
  }
}
