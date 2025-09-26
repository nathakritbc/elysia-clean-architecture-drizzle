# AI CRUD Generation Specification

This specification guides AI assistants through creating CRUD capabilities inside the modular clean-architecture codebase.

## 1. Context Recap

- **Runtime**: Bun + TypeScript
- **Framework**: Elysia (REST controllers, TypeBox validation)
- **Architecture**: Feature modules under `src/modules/*`, orchestrated via a platform-level module registry
- **Database**: PostgreSQL with Drizzle ORM
- **Security**: JWT access tokens, refresh tokens stored in HTTP-only cookies, CSRF protection
- **Dependency Injection**: TSyringe with per-module token maps

### Module Layout

```
src/modules/{module}/
├── domain/
│   ├── entities/
│   └── ports/
├── application/
│   └── use-cases/
├── infrastructure/
│   └── persistence/
├── interface/
│   └── http/
├── module-definition.ts
├── module.tokens.ts
└── tests/
    └── unit/
```

`src/platform` hosts DI/container wiring, HTTP bootstrap, config, database, logging, telemetry. `src/shared` contains reusable domain-agnostic primitives (kernel entities, DTO helpers, error mapper, utilities, logger port).

## 2. Information AI Must Collect

1. **Module name** (plural, lowercase, e.g., `inventory`).
2. **Entity name** (PascalCase singular, e.g., `Product`).
3. **Fields** with types, optional/required flags, validation rules, default values.
4. **Relationships** (foreign keys, linkage to other modules).
5. **Business rules** (uniqueness, state transitions, computed values, invariants).
6. **Operations** required (create/list/get/update/delete/search/etc.).
7. **Security** requirements (public vs protected endpoints).

## 3. Generation Workflow

### Step 1 – Domain

- Create `src/modules/{module}/domain/entities/{entity}.entity.ts`.
- Create `src/modules/{module}/domain/ports/{entity}.repository.ts` with CRUD signatures and pagination contract if required.
- Ensure entities extend `@shared/kernel/entity` if base behaviour is needed and use branded types from `@shared/kernel`.

### Step 2 – Application

- Place use cases in `src/modules/{module}/application/use-cases/`.
- Implement `Create`, `GetAll`, `GetById`, `Update`, `Delete` use cases (and any extras) using the repository port.
- Inject dependencies using module tokens (`@modules/{module}/module.tokens`).
- Reuse shared helpers (`@shared/utils/...`, `@shared/errors/...`).

### Step 3 – Infrastructure

- Update or create Drizzle schema under `src/modules/{module}/infrastructure/persistence/{entity}.schema.ts`.
- Implement repository class at `src/modules/{module}/infrastructure/persistence/{entity}.drizzle.repository.ts` using the schema and `@platform/database/connection`.
- Map rows to domain entities via builder pattern.
- Register new schema exports in `@platform/database/schema` when needed and manage migrations.

### Step 4 – Interface (HTTP)

- Define DTOs under `src/modules/{module}/interface/http/dtos/{entity}.dto.ts` using TypeBox.
- Create controllers in `src/modules/{module}/interface/http/controllers/`. Each controller should:
  - Resolve its use case via DI.
  - Register routes on the provided Elysia instance.
  - Attach schema validation and OpenAPI metadata (`detail` block).
  - Handle auth/CSRF if required.
- Add/extend HTTP REST Client file `src/modules/{module}/interface/http/{entity}.http`.

### Step 5 – Module Wiring

- Update `src/modules/{module}/module.tokens.ts` with repository/service tokens.
- In `module-definition.ts`, register infrastructure implementations and route registrations (similar to existing modules).
- Ensure the module is imported in `@platform/http/routes` and passed to the `ModuleRegistry` (usually already included for existing modules; add new module if necessary).

### Step 6 – Tests

- Add unit tests for use cases and repositories under `src/modules/{module}/tests/unit`.
- Cover success and failure scenarios (e.g., validation, not-found, uniqueness violations).
- Update or add HTTP tests in the REST Client file for manual verification.

## 4. File Templates

### Entity

```typescript
import { Entity } from '@shared/kernel/entity';
import type { Brand } from '@shared/kernel/brand.type';

export type ProductId = Brand<string, 'ProductId'>;

export class Product extends Entity {
  id: ProductId = '' as ProductId;
  name!: string;
  price!: number;
  categoryId!: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Repository Port

```typescript
export interface ProductRepository {
  create(product: Product): Promise<Product>;
  getById(id: ProductId): Promise<Product | undefined>;
  getAll(params: PaginationParams): Promise<{ result: Product[]; meta: PaginationMeta }>;
  update(product: Product): Promise<Product>;
  delete(id: ProductId): Promise<void>;
}
```

### Use Case

```typescript
@injectable()
export class CreateProductUseCase implements IUseCase<CreateProductInput, Product> {
  constructor(
    @inject(ProductsModuleTokens.Repository)
    private readonly products: ProductRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const entity = Builder(Product)
      .name(input.name)
      .price(input.price)
      .categoryId(input.categoryId)
      .build();

    return this.products.create(entity);
  }
}
```

### Controller

```typescript
@injectable()
export class CreateProductController {
  constructor(@inject(CreateProductUseCase) private readonly useCase: CreateProductUseCase) {}

  register(app: Elysia) {
    app.post('/products', async ({ body }) => {
      return this.useCase.execute(body);
    }, {
      body: CreateProductRequestDto,
      response: {
        200: ProductResponseDto,
        400: ErrorResponseDto,
      },
      detail: {
        summary: 'Create product',
        tags: ['Products'],
      },
    });
  }
}
```

### Module Definition & Tokens

```typescript
// module.tokens.ts
export const ProductsModuleTokens = {
  Repository: Symbol('Products.Repository'),
};

// module-definition.ts
export const productsModule: ModuleDefinition = {
  name: 'products',
  register(container) {
    container.registerSingleton<ProductRepository>(
      ProductsModuleTokens.Repository,
      ProductDrizzleRepository
    );
  },
  routes(app, container) {
    container.resolve(CreateProductController).register(app);
    container.resolve(GetProductsController).register(app);
    container.resolve(GetProductByIdController).register(app);
    container.resolve(UpdateProductController).register(app);
    container.resolve(DeleteProductController).register(app);
  },
};
```

### Drizzle Repository

```typescript
@injectable()
export class ProductDrizzleRepository implements ProductRepository {
  async create(product: Product): Promise<Product> {
    const [row] = await db
      .insert(products)
      .values({
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
        description: product.description ?? null,
      })
      .returning();

    return this.toDomain(row);
  }

  private toDomain(row: ProductRow): Product {
    return Builder(Product)
      .id(row.id as ProductId)
      .name(row.name)
      .price(row.price)
      .categoryId(row.categoryId)
      .description(row.description ?? undefined)
      .createdAt(row.createdAt)
      .updatedAt(row.updatedAt)
      .build();
  }
}
```

### DTOs

```typescript
export const CreateProductRequestDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  price: t.Number({ minimum: 0 }),
  categoryId: t.String({ format: 'uuid' }),
  description: t.Optional(t.String({ maxLength: 500 })),
});

export const ProductResponseDto = t.Object({
  id: t.String(),
  name: t.String(),
  price: t.Number(),
  categoryId: t.String(),
  description: t.Optional(t.String()),
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});
```

## 5. Database & Migrations

- Update the Drizzle schema (`product.schema.ts`) and export it via `@platform/database/schema` if needed.
- Generate or update SQL migrations under `@platform/database/migrations` using `drizzle-kit`.
- Keep naming consistent (`products` table, snake_case columns).

## 6. Testing Guidance

- Unit tests belong in `src/modules/{module}/tests/unit` and should cover each use case plus repository adapters (with mocks/in-memory DB if necessary).
- HTTP behaviour can be validated manually using the generated `.http` file.
- Run `bun run test` after scaffolding.

## 7. Sample AI Prompt

```
Generate full CRUD support for the "Product" entity in our modular architecture.

Module: inventory
Security: Protected (JWT + CSRF)
Fields:
- id: string (uuid, primary key)
- name: string (required, 2-100 chars, unique per tenant)
- price: number (required, > 0)
- categoryId: string (required, uuid, references categories)
- description?: string (optional, <= 500 chars)

Rules:
- Name unique within tenant
- Price must be positive
- Premium category (categoryId === PREMIUM_UUID) requires price <= 1000

Operations: create, list, get by id, update, delete, pagination

Output: domain, application use cases, repository port/impl, DTOs, controllers, module tokens/definition, unit tests, HTTP spec, and necessary schema updates.
```

Following this specification keeps CRUD features aligned with the modular clean architecture and platform wiring.
