import { container } from '../../core/shared/container';
import { CreateUserController } from '../../adapters/users/create-user.controller';
import { GetUserByIdController } from '../../adapters/users/get-user-by-id.controller';
import { GetAllUsersController } from '../../adapters/users/get-all-users.controller';
import { UpdateUserByIdController } from '../../adapters/users/update-user-by-id.controller';
import { DeleteUserByIdController } from '../../adapters/users/delete-user-by-id.controller';
import { GetAllPostsController } from '../../adapters/posts/get-all-posts.controller';
import { CreatePostController } from '../../adapters/posts/create-post.controller';
import createElysiaApp from './elysia-app';
import type { Elysia } from 'elysia';
import type { AppConfig } from '../config/app-config';

export const createRoutes = (appConfig: AppConfig) => {
  const app = createElysiaApp(appConfig);

  const createUserController = container.resolve(CreateUserController);
  const findUsersController = container.resolve(GetAllUsersController);
  const findUserByIdController = container.resolve(GetUserByIdController);
  const updateUserByIdController = container.resolve(UpdateUserByIdController);
  const deleteUserByIdController = container.resolve(DeleteUserByIdController);
  const getAllPostsController = container.resolve(GetAllPostsController);
  const createPostController = container.resolve(CreatePostController);

  createUserController.register(app as unknown as Elysia);
  findUsersController.register(app as unknown as Elysia);
  findUserByIdController.register(app as unknown as Elysia);
  updateUserByIdController.register(app as unknown as Elysia);
  deleteUserByIdController.register(app as unknown as Elysia);
  getAllPostsController.register(app as unknown as Elysia);
  createPostController.register(app as unknown as Elysia);

  return app;
};

export default createRoutes;
