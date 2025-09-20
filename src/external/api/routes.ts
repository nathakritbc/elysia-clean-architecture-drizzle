import { container } from "../../core/shared/container";
import { CreateUserController } from "../../adapters/users/createUser.controller";
import { FindUserByIdController } from "../../adapters/users/findUserById.controller";
import { FindUsersController } from "../../adapters/users/findUsers.controller";
import app from "./elysiaApp";

// Resolve controllers from DI container and register routes
const createUserController = container.resolve(CreateUserController);
const findUsersController = container.resolve(FindUsersController);
const findUserByIdController = container.resolve(FindUserByIdController);

// Register routes
createUserController.register(app);
findUsersController.register(app);
findUserByIdController.register(app);

export default app;
