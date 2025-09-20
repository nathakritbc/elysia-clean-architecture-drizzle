import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../../shared/useCase";
import { IUser, UserId } from "../entity/user.entity";
import { UserRepository } from "../service/user.repository";
import { TOKENS } from "../../../shared/tokens";

@injectable()
export class FindUserByIdUseCase
  implements IUseCase<UserId, IUser | undefined>
{
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly collection: UserRepository
  ) {}

  execute(input: UserId): Promise<IUser | undefined> {
    return this.collection.findById(input);
  }
}
