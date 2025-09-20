import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../../shared/useCase";
import { IUser } from "../entity/user.entity";
import { UserRepository } from "../service/user.repository";
import { TOKENS } from "../../../shared/tokens";

@injectable()
export class FindUsersUseCase implements IUseCase<void, IUser[]> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly collection: UserRepository
  ) {}

  async execute(): Promise<IUser[]> {
    return this.collection.findAll();
  }
}
