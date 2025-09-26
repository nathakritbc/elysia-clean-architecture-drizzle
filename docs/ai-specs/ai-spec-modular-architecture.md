# AI Spec – Modular Clean Architecture Refactor

## Summary

The application now runs as a modular clean-architecture monolith. Business capabilities live in independent `src/modules/*` packages that each contain their own domain model, application services, interface adapters, and infrastructure adapters. A thin `src/platform` layer hosts composition concerns (DI container, HTTP bootstrap, telemetry, config), while `src/shared` exposes framework-agnostic building blocks reused by every module. The structure keeps the service deployable as a single Bun runtime today, yet lets any module be extracted into a microservice later with minimal friction.

## Goals

- Keep module boundaries aligned with business capabilities (`auth`, `accounts`, `content`) and allow new domains to reuse the same template.
- Ensure each module ships a self-contained clean architecture slice (domain ◀ application ◀ interface & infrastructure).
- Centralise cross-cutting concerns (HTTP server, config, logging, telemetry, DI) inside `platform` and framework-neutral primitives inside `shared`.
- Rely on a runtime module registry so features plug into the app through declarative registration.
- Preserve existing behaviour (authentication flows, posts CRUD, health checks) while enabling incremental feature work per module.

## Non-Goals

- Running separate processes per module (still an in-process monolith).
- Replacing Bun, Elysia, or Drizzle ORM.
- Rewriting business logic; only reorganising and tightening boundaries.
- Introducing network calls between modules (keep synchronous DI calls for now).

## Architectural Principles

1. **Module autonomy** – Each module owns its domain model, ports, use cases, controllers, persistence, and tests.
2. **Direction of dependencies** – Domain logic stays framework-free; outer layers depend inward. Modules never import other modules' internals, only their public interfaces.
3. **Explicit contracts** – Ports and DI tokens live inside the owning module (`module.tokens.ts`) so consumers cannot reach through layers implicitly.
4. **Composition root** – `platform/di/module.registry.ts` wires modules into the Elysia app and DI container. The bootstrap stays the single place where modules are enabled/disabled.
5. **Cross-cutting isolation** – Shared utilities (`@shared/*`) remain infrastructure-agnostic; anything framework-specific belongs to either a module or the platform.
6. **Microservice readiness** – Modules expose HTTP routes via `ModuleDefinition.routes`, register dependencies via `ModuleDefinition.register`, and encapsulate infrastructure so extraction means copying one folder.

## Current Topology

| Folder | Responsibility |
| --- | --- |
| `src/modules/auth` | Authentication, session lifecycle, JWT handling (domain, application, HTTP controllers, Drizzle repositories, config). Refresh endpoints accept tokens from the body *or* cookies, falling back to cookies when the body is empty. |
| `src/modules/accounts` | User aggregate (entities, repository port/implementation, usage within auth use cases). |
| `src/modules/content` | Post aggregate (CRUD use cases, controllers, persistence). |
| `src/platform` | Composition root: DI container and tokens, HTTP routes and controllers, logging adapters, database wiring, telemetry, health checks, config, migration assets. |
| `src/shared` | Framework-agnostic primitives (kernel entity/value types, DTOs, error mapper, logger port, utility helpers such as cookie builders and duration parsing). |

Additional domains can be scaffolded by copying any module folder and registering it with the module registry.

## Module Template

```
src/modules/<module>/
  domain/
    entities/
    ports/
  application/
    base/
    use-cases/
  interface/
    http/
      controllers/
      dtos/
      guards/
  infrastructure/
    config/
    persistence/
    providers/
  tests/
    unit/
```

Shared DI tokens for a module live in `module.tokens.ts` and the module exposes a single `module-definition.ts` entry point so the platform can discover bindings and routes.

## Platform & Shared Layers

```
src/
  platform/
    config/
    database/
    di/
      container.ts
      module-definition.ts
      module.registry.ts
    health/
    http/
      controllers/
      elysia-app.ts
      routes.ts
    logging/
    observability/
  shared/
    application/
    dtos/
    errors/
    kernel/
    logging/
    utils/
```

- `platform/di/module-definition.ts` defines the runtime contract:

```ts
export interface ModuleDefinition {
  name: string;
  register(container: DependencyContainer): void;
  routes?: (app: Elysia, container: DependencyContainer) => void;
}
```

- The `ModuleRegistry` applies each module's bindings and attaches routes when bootstrapping the server.
- `platform/health/health-check.service.ts` handles liveness/readiness/system checks using shared logging utilities and the central Drizzle connection.

## DI and Configuration

- Global DI tokens (`PlatformTokens`) live under `platform/di/tokens.ts`; module-specific tokens remain internal to each module.
- `platform/di/container.ts` registers platform primitives (AppConfig, Logger) only. Modules register their own dependencies inside `module-definition.ts`.
- Config values sit in `platform/config/*` or `modules/<module>/infrastructure/config`. Auth config now exposes both refresh token cookies; controllers reference `refreshTokenCookie` and `refreshTokenCsrfCookie` explicitly.

## HTTP Composition

- `platform/http/routes.ts` creates the Elysia app, instantiates the module registry, and registers modules (`accounts`, `auth`, `content`).
- Platform controllers (e.g. health endpoints) continue to resolve through DI and register directly after modules.
- Module controllers are responsible for their own validation. The refresh-session controller demonstrates the dual-source token retrieval (body or cookie), ensuring compatibility with earlier clients that only use cookies.

## Testing Strategy

- Unit tests stay colocated under each module (`modules/<module>/tests/unit`). They import through module aliases (`@modules/...`) and reuse shared utilities.
- Global Vitest config recognises the new path aliases; warnings remain for un-awaited `expect(...).resolves/rejects` in `auth.guard.spec.ts` and should be addressed separately.

## Migration Checklist (Completed)

1. Scaffolded `modules`, `platform`, and `shared` directories and moved legacy `core`, `adapters`, and `external` code into their new homes.
2. Ported DI container, tokens, and HTTP bootstrap into `platform` and introduced the module registry.
3. Migrated **auth** module (domain, application, HTTP, persistence, config) and enhanced refresh-session handling to support cookie/body tokens.
4. Migrated **accounts** module (user aggregate and Drizzle repository) and updated auth use cases to depend on accounts ports via module tokens.
5. Migrated **content** module (post aggregate, controllers, repositories, tests) using the same module token pattern.
6. Extracted shared primitives (entities, DTOs, error mapper, logger port, utilities) into `shared` with framework-neutral aliases.
7. Pointed tests, configs, and bootstrap to the new path aliases (`@modules/*`, `@shared/*`, `@platform/*`) and re-enabled Vitest.
8. Verified runtime behaviour (sign-in, refresh via cookie fallback, posts CRUD, health endpoints) and updated documentation.

## Outstanding Work & Next Steps

- Address Vitest warnings by awaiting `expect(...).resolves/rejects` in guard tests.
- Consider adding per-module integration tests under `tests/integration` to exercise HTTP behaviour in isolation.
- Build a scaffolding script (optional) that generates new module skeletons following the template above.
- Evaluate message/event infrastructure once asynchronous workflows are required; the module registry already provides hooks for future subscriptions.
