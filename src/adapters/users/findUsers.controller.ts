import Elysia from "elysia";
import { inject, injectable } from "tsyringe";
import { FindUsersUseCase } from "../../core/domain/users/use-case/findUsers.usecase";
import {
  GetUsersResponseDto,
  ErrorResponseDto,
} from "../../core/shared/dtos/user.dto";

@injectable()
export class FindUsersController {
  constructor(
    @inject(FindUsersUseCase) private readonly useCase: FindUsersUseCase
  ) {}

  register(server: Elysia) {
    server.get(
      "/users",
      async ({ error }) => {
        try {
          const data = await this.useCase.execute();
          return data;
        } catch (err) {
          return error(500, {
            name: "Error",
            message:
              err instanceof Error ? err.message : "Internal server error",
          });
        }
      },
      {
        response: {
          200: GetUsersResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: "Get all users",
          description: "Retrieves a list of all users in the system",
          tags: ["Users"],
        },
      }
    );
  }
}
