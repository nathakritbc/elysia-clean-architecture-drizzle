import Elysia from "elysia";
import { inject, injectable } from "tsyringe";
import { CreateUserUseCase } from "../../core/domain/users/use-case/createUser.usecase";
import {
  CreateUserRequestDto,
  CreateUserResponseDto,
  ErrorResponseDto,
} from "../../core/shared/dtos/user.dto";
import { BUserName } from "../../core/domain/users/entity/user.entity";
import { UserEmail } from "../../core/domain/users/entity/user.entity";
import { UserPassword } from "../../core/domain/users/entity/user.entity";

@injectable()
export class CreateUserController {
  constructor(
    @inject(CreateUserUseCase) private readonly useCase: CreateUserUseCase
  ) {}

  register(server: Elysia) {
    server.post(
      "/users",
      async ({ body, error }) => {
        try {
          const { name, email, password } = body as {
            name: BUserName;
            email: UserEmail;
            password: UserPassword;
          };

          await this.useCase.execute({ name, email, password });

          return {
            status: 200,
            body: {
              mensagem: "Usuario criado com sucesso",
            },
          };
        } catch (err) {
          return error(400, {
            name: "Error",
            message:
              err instanceof Error ? err.message : "Unknown error occurred",
          });
        }
      },
      {
        body: CreateUserRequestDto,
        response: {
          200: CreateUserResponseDto,
          400: ErrorResponseDto,
        },
        detail: {
          summary: "Create a new user",
          description: "Creates a new user with the provided information",
          tags: ["Users"],
        },
      }
    );
  }
}
