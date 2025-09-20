import { container } from '../../core/shared/container';
import { CreateUserController } from '../../adapters/users/create-user.controller';
import { GetUserByIdController } from '../../adapters/users/get-user-by-id.controller';
import { GetAllUsersController } from '../../adapters/users/get-all-users.controller';
import app from './elysiaApp';

// Resolve controllers from DI container and register routes
const createUserController = container.resolve(CreateUserController);
const findUsersController = container.resolve(GetAllUsersController);
const findUserByIdController = container.resolve(GetUserByIdController);

// Register routes
createUserController.register(app);
findUsersController.register(app);
findUserByIdController.register(app);

export default app;
