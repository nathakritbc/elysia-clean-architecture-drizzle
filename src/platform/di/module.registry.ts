import type { Elysia } from 'elysia';
import type { DependencyContainer } from 'tsyringe';

import type { ModuleDefinition } from './module-definition';

export class ModuleRegistry {
  constructor(private readonly container: DependencyContainer) {}

  registerModules(app: Elysia, modules: ModuleDefinition[]): void {
    modules.forEach(module => {
      module.register(this.container);
      module.routes?.(app, this.container);
    });
  }
}
