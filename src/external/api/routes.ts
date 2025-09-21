import { container } from '../../core/shared/container';
import { CreateUserController } from '../../adapters/users/create-user.controller';
import { GetUserByIdController } from '../../adapters/users/get-user-by-id.controller';
import { GetAllUsersController } from '../../adapters/users/get-all-users.controller';
import { UpdateUserByIdController } from '../../adapters/users/update-user-by-id.controller';
import { DeleteUserByIdController } from '../../adapters/users/delete-user-by-id.controller';
import { GetAllPostsController } from '../../adapters/posts/get-all-posts.controller';
import { CreatePostController } from '../../adapters/posts/create-post.controller';
import { GetPostByIdController } from '../../adapters/posts/get-post-by-id.controller';
import { UpdatePostByIdController } from '../../adapters/posts/update-post-by-id.controller';
import { DeletePostByIdController } from '../../adapters/posts/delete-post-by-id.controller';
import createElysiaApp from './elysia-app';
import type { Elysia } from 'elysia';
import type { AppConfig } from '../config/app-config';

export const createRoutes = (appConfig: AppConfig) => {
  const app = createElysiaApp(appConfig);

  const createPostController = container.resolve(CreatePostController);
  const createUserController = container.resolve(CreateUserController);
  const deletePostByIdController = container.resolve(DeletePostByIdController);
  const deleteUserByIdController = container.resolve(DeleteUserByIdController);
  const findUserByIdController = container.resolve(GetUserByIdController);
  const findUsersController = container.resolve(GetAllUsersController);
  const getAllPostsController = container.resolve(GetAllPostsController);
  const getPostByIdController = container.resolve(GetPostByIdController);
  const updatePostByIdController = container.resolve(UpdatePostByIdController);
  const updateUserByIdController = container.resolve(UpdateUserByIdController);

  createPostController.register(app as unknown as Elysia);
  createUserController.register(app as unknown as Elysia);
  deletePostByIdController.register(app as unknown as Elysia);
  deleteUserByIdController.register(app as unknown as Elysia);
  findUserByIdController.register(app as unknown as Elysia);
  findUsersController.register(app as unknown as Elysia);
  getAllPostsController.register(app as unknown as Elysia);
  getPostByIdController.register(app as unknown as Elysia);
  updatePostByIdController.register(app as unknown as Elysia);
  updateUserByIdController.register(app as unknown as Elysia);

  return app;
};

export default createRoutes;
