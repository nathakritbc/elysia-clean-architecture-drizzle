# AI Testing Specification

Guidelines for generating tests that align with the modular clean-architecture project structure.

## 1. Testing Philosophy

- **Red → Green → Refactor**: write failing tests first, satisfy them with minimal code, then improve.
- **Fast feedback**: keep unit tests lightweight and deterministic.
- **Comprehensive coverage**: exercise happy paths, edge cases, and error flows.
- **Readable tests**: favour clear arrange/act/assert structure with descriptive names.

## 2. Testing Pyramid

```text
                    /\
                   /  \
                  / E2E \        (few, slow, end-to-end confidence)
                 /______\
                /        \
               / Integration \   (some, medium scope)
              /______________\
             /                \
            /   Unit Tests     \ (many, fast feedback)
           /____________________\
```

## 3. Directory Layout

```
src/modules/{module}/
├── domain/
│   └── entities/
├── application/
├── infrastructure/
├── interface/http/
└── tests/
    └── unit/
        ├── create-{entity}.usecase.spec.ts
        ├── get-{entity}.usecase.spec.ts
        ├── update-{entity}.usecase.spec.ts
        ├── delete-{entity}.usecase.spec.ts
        └── {entity}.drizzle.repository.spec.ts  (optional)

src/test/
├── integration/        # cross-module scenarios
├── e2e/                # end-to-end API tests
└── helpers/            # shared test utilities
```

## 4. Naming Conventions

- Unit tests: `*.spec.ts`
- Integration tests: `*.integration.spec.ts`
- End-to-end tests: `*.e2e.spec.ts`
- Helpers/factories: `*.helper.ts`, `*.factory.ts`
- HTTP client specs: `*.http` under `src/modules/{module}/interface/http/`

## 5. Unit Test Patterns

### Use Case Tests

```typescript
// src/modules/inventory/tests/unit/create-product.usecase.spec.ts
import { mock } from 'vitest-mock-extended';

import { ProductsModuleTokens } from '@modules/inventory/module.tokens';
import { ProductRepository } from '@modules/inventory/domain/ports/product.repository';
import { CreateProductUseCase } from '@modules/inventory/application/use-cases/create-product.usecase';

describe('CreateProductUseCase', () => {
  const repository = mock<ProductRepository>();
  const useCase = new CreateProductUseCase(repository);

  it('creates a product when validation passes', async () => {
    const input = { name: 'Sample', price: 100, categoryId: 'cat-id' };
    repository.create.mockResolvedValue({ ...input, id: 'prod-id' });

    const result = await useCase.execute(input);

    expect(repository.create).toHaveBeenCalled();
    expect(result.id).toBe('prod-id');
  });

  it('throws when name already exists', async () => {
    repository.getByName?.mockResolvedValue({ id: 'existing-id', name: 'Sample' } as any);

    await expect(useCase.execute({ name: 'Sample', price: 100, categoryId: 'cat-id' }))
      .rejects.toThrowError();
  });
});
```

### Repository Adapter Tests (optional)

```typescript
// src/modules/inventory/tests/unit/product.drizzle.repository.spec.ts
import { db } from '@platform/database/connection';
import { products } from '@modules/inventory/infrastructure/persistence/product.schema';
import { ProductDrizzleRepository } from '@modules/inventory/infrastructure/persistence/product.drizzle.repository';

// Use a transaction/in-memory DB helper from src/test/helpers if available
```

### DTO Validation Tests (when complex)

```typescript
// src/modules/inventory/interface/http/dtos/product.dto.spec.ts
import { Value } from '@sinclair/typebox/value';
import { CreateProductRequestDto } from './product.dto';

describe('CreateProductRequestDto', () => {
  it('fails when price is negative', () => {
    const result = Value.Check(CreateProductRequestDto, { name: 'X', price: -1, categoryId: 'id' });
    expect(result).toBe(false);
  });
});
```

## 6. Integration & E2E Tests

- Integration tests live in `src/test/integration` and can spin up modules with an in-memory database.
- End-to-end tests in `src/test/e2e` exercise the running HTTP server (consider Bun test runner or Vitest environment).
- Use fixtures from `src/test/helpers` to create data, authenticate users, etc.

## 7. HTTP Specs

Each module ships a REST Client file (`*.http`) under `src/modules/{module}/interface/http/`. Update or add new requests when manipulating CRUD endpoints. Example sections should cover success and failure cases.

## 8. Tooling

- Run unit tests with `bun run test` (Vitest configuration supports path aliases `@modules`, `@shared`, `@platform`).
- Consider using `vitest --run --coverage` for coverage reports.
- For repository integration tests, leverage transaction helpers or a dedicated test database.

## 9. Checklist for Generated Tests

- [ ] Use cases have unit tests for success and validation errors.
- [ ] Repository adapter tests cover mapping logic (optional but recommended).
- [ ] DTOs with complex validation have dedicated tests.
- [ ] HTTP `.http` file includes CRUD flows and error scenarios.
- [ ] Tests import via aliases, not long relative paths.
- [ ] Refresh-session scenarios also test cookie + body behaviour when relevant to module.

Following these guidelines keeps automated test generation aligned with the modular architecture and ensures reliable CRUD features.
