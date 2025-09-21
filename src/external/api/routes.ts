import { container } from '../../core/shared/container';
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

  // Resolve controllers from DI container and register users routes
  const createPostController = container.resolve(CreatePostController);
  const deletePostByIdController = container.resolve(DeletePostByIdController);
  const getAllPostsController = container.resolve(GetAllPostsController);
  const getPostByIdController = container.resolve(GetPostByIdController);
  const updatePostByIdController = container.resolve(UpdatePostByIdController);

  // Register users routes
  createPostController.register(app as unknown as Elysia);
  deletePostByIdController.register(app as unknown as Elysia);
  getAllPostsController.register(app as unknown as Elysia);
  getPostByIdController.register(app as unknown as Elysia);
  updatePostByIdController.register(app as unknown as Elysia);

  return app;
};

export default createRoutes;
