# AI Spec – Modular Clean Architecture Refactor

## Summary

Restructure the codebase into self-contained modules that encapsulate their own clean-architecture slices (domain, application, interface, infrastructure). The goal is to make each module independently testable, deployable, and eventually splittable into microservices while preserving shared platform capabilities (HTTP server, observability, DI, security).

## Goals

- Establish clear module boundaries aligned with business capabilities (Auth, Accounts, Content, etc.).
- Co-locate domain rules, use cases, interface adapters, and infrastructure inside each module.
- Standardize module scaffolding to enable consistent development and future code generation.
- Provide a composition layer that registers modules and wiring (DI, routing, events).
- Preserve existing functionality while enabling phased migration of code from current structure.

## Non-Goals

- Rewrite business logic or introduce new features.
- Split services into separate repositories yet.
- Replace Bun/Elysia/Drizzle or other core technologies.
- Introduce synchronous communication between modules via network calls (remain in-process for now).

## Architectural Principles

1. **Independent Modules** – Each module owns its domain model, application services, interface adapters, and infrastructure adapters.
2. **Clean Architecture Enforcement** – Domain layer free of framework dependencies; outer layers depend inward only.
3. **Explicit Contracts** – Ports (interfaces) define cross-module interaction. Shared layer only hosts truly cross-cutting primitives.
4. **Composition Root** – A platform bootstrap layer composes modules via DI container, HTTP routing, telemetry, etc.
5. **Microservice Ready** – Modules expose contracts/events to make future extraction to separate service straightforward.

## Target Module Topology

| Module | Capability | Notes |
| --- | --- | --- |
| `auth` | Authentication, sessions, refresh tokens | Owns JWT issuance, credential validation |
| `accounts` | User profiles, roles, account management | Decouple from auth for future IAM expansion |
| `content` | Posts or other publishable entities | Current posts module fits here |
| `platform` | Composition root, shared adapters (HTTP server, telemetry, config) | Bootstraps modules |
| `shared` | Utility libraries, common value objects, error types | Must remain infrastructure-agnostic |

Additional future modules (booking, billing, notifications) should follow the same template.

## Module Folder Template

```
src/
  modules/
    <module-name>/
      domain/
        entities/
        aggregates/
        value-objects/
        services/       # Domain services (pure)
        events/
        ports/          # Repository & integration interfaces
      application/
        use-cases/
        dtos/
        validators/
        mappers/
        policies/       # Authorization policies, orchestration logic
      interface/
        http/
          controllers/
          routes.ts
          transformers/
        subscribers/    # Event listeners (e.g. domain events)
        graphql?/grpc?  # Placeholder for future transports
      infrastructure/
        persistence/
          repositories/
          mappers/
        messaging/
        providers/      # External services implementation
        config/
      tests/
        unit/
        integration/
        contract/
```

### Shared & Platform Layers

```
src/
  platform/
    http/
      server.ts
      router.ts
    di/
      container.ts
      module.registry.ts
    observability/
    security/
    bootstrap.ts
  shared/
    kernel/
      result.ts
      value-object.ts
      entity.ts
    errors/
    utils/
    logging/
    env/
```

- `platform` owns composition root, DI container wiring, app bootstrap, global middleware, telemetry, and configuration of modules.
- `shared` contains framework-agnostic building blocks (base classes, error objects, functional helpers, cross-module DTO primitives).

## Module Contracts

Each module exports a `ModuleDefinition` to register itself with the platform:

```typescript
export interface ModuleDefinition {
  name: ModuleName;
  routes?: (ctx: RegisterHttpContext) => void;
  bindings: (container: DependencyContainer) => void;
  projections?: ModuleProjection[]; // e.g. read models, background jobs
  policies?: PolicyDefinition[];
  events?: DomainEventDefinition[];
}
```

- `bindings` registers domain/application/infrastructure services.
- `routes` attaches HTTP controllers to the shared router.
- `policies` describes module-level authorization requirements.
- `events` documents domain event publications and subscriptions.

Modules live behind DI tokens defined locally (e.g. `AuthTokens.RefreshTokenRepository`). Cross-module access happens through interfaces exported from `ports/`.

## Domain to Module Mapping

| Current Location | Target Module | Notes |
| --- | --- | --- |
| `src/core/domain/auth` | `src/modules/auth/domain` | Entities, value objects, services, use cases |
| `src/adapters/auth` | `src/modules/auth/interface/http` | Controllers, guards, DTOs mapped to new folder |
| `src/external/auth` | `src/modules/auth/infrastructure/providers` | JWT service implementations |
| `src/external/drizzle/auth` | `src/modules/auth/infrastructure/persistence` | Repository implementations |
| `src/core/domain/users` | `src/modules/accounts/domain` | Separate accounts from auth |
| `src/adapters/posts` | `src/modules/content/interface/http` | Rename posts -> content |
| `src/external/drizzle/posts` | `src/modules/content/infrastructure/persistence` | |
| `src/core/shared` | `src/shared` | Keep domain-agnostic primitives |
| `src/external/api` | `src/platform/http` | Centralized HTTP bootstrap |

## Cross-Module Communication

- **Synchronous**: Modules call each other via application services exposed behind interfaces registered in DI (e.g. `AccountsApplication.CurrentUserService`). Keep calls at application layer; avoid direct infrastructure dependency.
- **Domain Events**: Modules publish events via an in-process dispatcher (future-proof for message bus). Define event contracts in `domain/events` and handle in `interface/subscribers` or `application`.
- **Policies**: Authorization checks defined in `application/policies`. Platform-level guard composes module policies.

## Configuration & Environment

- Module-specific env keys defined under `modules/<module>/infrastructure/config` with TypeBox schema for validation.
- Platform exports a central `ConfigService` reading `.env` and distributing typed configs to modules.
- Each module registers its config schema during bootstrap so validation happens at startup.

## Testing Strategy

- **Unit Tests**: `modules/<module>/tests/unit` target domain & application layers (no infrastructure).
- **Integration Tests**: `modules/<module>/tests/integration` spin up module with in-memory adapters or test DB.
- **Contract Tests**: `modules/<module>/tests/contract` define API schemas and module-to-module contracts (event payloads, DI interfaces).
- Global E2E tests remain under `src/test/e2e` and exercise the composed platform.

## Migration Plan (Phased)

1. **Scaffold Platform & Shared Layers**
   - Create `src/modules`, `src/platform`, and `src/shared` directories following template.
   - Move current DI container, tokens, and HTTP bootstrap into `platform/` while maintaining exports.

2. **Migrate Auth Module**
   - Move domain entities/use cases from `core/domain/auth` to `modules/auth/domain` & `application`.
  - Move controllers/DTOs to `modules/auth/interface/http`.
   - Relocate Drizzle repositories and JWT providers to `modules/auth/infrastructure`.
   - Update DI registrations to use new module definition.

3. **Migrate Accounts Module**
   - Extract user-related logic from auth domain into separate `accounts` module.
   - Update dependencies: auth module queries accounts via DI ports.

4. **Migrate Content Module**
   - Relocate posts domain/application/controller/repository into `modules/content`.
   - Rename DTOs/entities as needed (e.g. `Post` remains, but inside content module).

5. **Refine Shared Utilities**
   - Move reusable primitives into `src/shared` (value objects, base use case class, error mapper).
   - Ensure modules import from `shared` not from other modules directly if primitive is cross-cutting.

6. **Introduce Module Registry & Bootstrap**
   - Implement `ModuleRegistry` that loads module definitions, applies bindings, registers routes.
   - Refactor `index.ts` to compose `platform` and register modules in desired order.

7. **Testing & Documentation**
   - Update tests to point to new paths.
   - Document module responsibilities in `docs/modules/<module>.md`.
   - Update API specs and Postman collections if needed.

8. **Prepare for Microservices**
   - Document event contracts and data ownership per module.
   - Introduce optional `messaging` adapter behind interface to support future broker.

Each step should be merged independently with regression tests (unit/integration/E2E).

## Microservice Extraction Guidance

- Keep module dependencies acyclic to simplify extraction.
- Ensure each module publishes domain events for state changes (create/update/delete) using event dispatcher.
- Maintain module-specific configuration and secrets to mirror future service boundaries.
- Abstract infrastructure dependencies (DB tables, external APIs) behind module-specific repositories and providers.
- When extracting, reuse module `application` and `domain` as base service logic; replace `interface` and `infrastructure` with service-specific adapters.

## Deliverables

- New folder structure under `src/modules`, `src/platform`, `src/shared`.
- Per-module `module-definition.ts` implementing registration contract.
- Updated DI container and HTTP bootstrap referencing module definitions.
- Documentation updates in `docs/modules` and `docs/ai-specs` referencing modular architecture.
- Migration checklist to track progress for each module.

## Open Questions

- Should database schemas remain in a monolithic Drizzle setup or split per module with schema namespaces?
- Which modules will own cross-cutting entities (e.g. tenant, organization) when introduced?
- Do we introduce API versioning during migration or keep current endpoints and add later?

These should be resolved before full implementation.
