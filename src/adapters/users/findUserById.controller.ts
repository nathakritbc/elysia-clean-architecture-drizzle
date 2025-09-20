import Elysia, { t } from "elysia";
import { inject, injectable } from "tsyringe";
import { FindUserByIdUseCase } from "../../core/domain/users/use-case/findUserById.usecase";
import {
  GetUserResponseDto,
  ErrorResponseDto,
} from "../../core/shared/dtos/user.dto";
import { UserId } from "../../core/domain/users/entity/user.entity";

@injectable()
export class FindUserByIdController {
  constructor(
    @inject(FindUserByIdUseCase) private readonly useCase: FindUserByIdUseCase
  ) {}

  register(server: Elysia) {
    server.get(
      "/users/:id",
      async ({ params, error }) => {
        try {
          const { id } = params as { id: string };
          const user = await this.useCase.execute(id as UserId);

          if (!user) {
            return error(404, {
              name: "NotFoundError",
              message: "User not found",
            });
          }

          return user;
        } catch (err) {
          return error(500, {
            name: "Error",
            message:
              err instanceof Error ? err.message : "Internal server error",
          });
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: GetUserResponseDto,
          400: ErrorResponseDto,
          404: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: "Get user by ID",
          description: "Retrieves a specific user by their ID",
          tags: ["Users"],
        },
      }
    );
  }
}
