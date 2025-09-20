import Elysia, { t } from "elysia";
import { inject, injectable } from "tsyringe";
import { FindUserByIdUseCase } from "../../core/domain/users/use-case/findUserById.usecase";
import {
  GetUserResponseDto,
  ErrorResponseDto,
} from "../../core/shared/dtos/user.dto";
import { UserId } from "../../core/domain/users/entity/user.entity";
import { UserMapper } from "./mappers/user.mapper";

@injectable()
export class FindUserByIdController {
  constructor(
    @inject(FindUserByIdUseCase) private readonly useCase: FindUserByIdUseCase
  ) {}

  register(app: Elysia) {
    app.get(
      "/users/:id",
      async ({ params }) => {
        const { id } = params as { id: string };
        const user = await this.useCase.execute(id as UserId);
        return UserMapper.mapToDto(user);
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
