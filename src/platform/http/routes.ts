import type { Elysia } from 'elysia';

import accountsModule from '@modules/accounts/module-definition';
import authModule from '@modules/auth/module-definition';
import contentModule from '@modules/content/module-definition';
import type { AppConfig } from '@platform/config/app-config';
import { container } from '@platform/di/container';
import { ModuleRegistry } from '@platform/di/module.registry';
import { HealthController } from '@platform/http/controllers/health.controller';
import createElysiaApp from '@platform/http/elysia-app';

export const createRoutes = (appConfig: AppConfig) => {
  const app = createElysiaApp(appConfig);
  const elysiaApp = app as unknown as Elysia;

  const moduleRegistry = new ModuleRegistry(container);
  moduleRegistry.registerModules(elysiaApp, [accountsModule, authModule, contentModule]);

  container.resolve(HealthController).register(elysiaApp);

  return app;
};

export default createRoutes;
