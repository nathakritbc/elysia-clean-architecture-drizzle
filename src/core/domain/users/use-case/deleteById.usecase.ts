import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../../shared/useCase";
import { UserId } from "../entity/user.entity";
import { UserRepository } from "../service/user.repository";
import { TOKENS } from "../../../shared/tokens";

@injectable()
export class DeleteByIdUseCase implements IUseCase<UserId, boolean> {
  constructor(
    @inject(TOKENS.IUserRepository)
    private readonly collection: UserRepository
  ) {}

  async execute(input: UserId): Promise<boolean> {
    const userExist = await this.collection.findById(input);

    if (!userExist) throw new Error("User ID is required");

    return this.collection.deleteById(input);
  }
}
