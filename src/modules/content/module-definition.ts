import type { Elysia } from 'elysia';
import type { DependencyContainer } from 'tsyringe';

import { CreatePostController } from '@modules/content/interface/http/controllers/create-post.controller';
import { DeletePostByIdController } from '@modules/content/interface/http/controllers/delete-post-by-id.controller';
import { GetAllPostsController } from '@modules/content/interface/http/controllers/get-all-posts.controller';
import { GetPostByIdController } from '@modules/content/interface/http/controllers/get-post-by-id.controller';
import { UpdatePostByIdController } from '@modules/content/interface/http/controllers/update-post-by-id.controller';
import { ContentModuleTokens } from '@modules/content/module.tokens';
import { PostRepository } from '@modules/content/domain/ports/post.repository';
import { PostDrizzleRepository } from '@modules/content/infrastructure/persistence/post.drizzle.repository';
import { withAuth } from '@modules/auth/interface/http/guards/auth.guard';
import type { ModuleDefinition } from '@platform/di/module-definition';

export const contentModule: ModuleDefinition = {
  name: 'content',
  register(container: DependencyContainer) {
    container.registerSingleton<PostRepository>(ContentModuleTokens.PostRepository, PostDrizzleRepository);
  },
  routes(app: Elysia, container: DependencyContainer) {
    const protectedApp = withAuth(app) as unknown as Elysia;

    container.resolve(CreatePostController).register(protectedApp);
    container.resolve(DeletePostByIdController).register(protectedApp);
    container.resolve(GetAllPostsController).register(protectedApp);
    container.resolve(GetPostByIdController).register(protectedApp);
    container.resolve(UpdatePostByIdController).register(protectedApp);
  },
};

export default contentModule;
