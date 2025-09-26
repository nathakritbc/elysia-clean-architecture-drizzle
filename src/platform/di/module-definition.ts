import type { Elysia } from 'elysia';
import type { DependencyContainer } from 'tsyringe';

export interface ModuleDefinition {
  name: string;
  register(container: DependencyContainer): void;
  routes?: (app: Elysia, container: DependencyContainer) => void;
}
