import { container } from '../../core/shared/container';
import { GetAllPostsController } from '../../adapters/posts/get-all-posts.controller';
import { CreatePostController } from '../../adapters/posts/create-post.controller';
import { GetPostByIdController } from '../../adapters/posts/get-post-by-id.controller';
import { UpdatePostByIdController } from '../../adapters/posts/update-post-by-id.controller';
import { DeletePostByIdController } from '../../adapters/posts/delete-post-by-id.controller';
import { SignUpController } from '../../adapters/auth/sign-up.controller';
import { SignInController } from '../../adapters/auth/sign-in.controller';
import { RefreshSessionController } from '../../adapters/auth/refresh-session.controller';
import { LogoutController } from '../../adapters/auth/logout.controller';
import { withAuth } from '../../adapters/auth/auth.guard';
import createElysiaApp from './elysia-app';
import type { Elysia } from 'elysia';
import type { AppConfig } from '../config/app-config';

export const createRoutes = (appConfig: AppConfig) => {
  const app = createElysiaApp(appConfig);
  const elysiaApp = app as unknown as Elysia;

  // Resolve controllers from DI container
  const signUpController = container.resolve(SignUpController);
  const signInController = container.resolve(SignInController);
  const refreshSessionController = container.resolve(RefreshSessionController);
  const logoutController = container.resolve(LogoutController);
  const createPostController = container.resolve(CreatePostController);
  const deletePostByIdController = container.resolve(DeletePostByIdController);
  const getAllPostsController = container.resolve(GetAllPostsController);
  const getPostByIdController = container.resolve(GetPostByIdController);
  const updatePostByIdController = container.resolve(UpdatePostByIdController);

  // Register auth routes
  signUpController.register(elysiaApp);
  signInController.register(elysiaApp);
  refreshSessionController.register(elysiaApp);
  logoutController.register(elysiaApp);

  // Register post routes with auth guard
  const protectedApp = withAuth(elysiaApp) as unknown as Elysia;
  createPostController.register(protectedApp);
  deletePostByIdController.register(protectedApp);
  getAllPostsController.register(protectedApp);
  getPostByIdController.register(protectedApp);
  updatePostByIdController.register(protectedApp);

  return app;
};

export default createRoutes;
