# AI CRUD Generation Usage Guide

This guide walks through using the CRUD specification in the modular architecture.

## 1. Describe the Domain

Provide the AI with:
- Module name (`inventory`, `billing`, etc.).
- Entity definition (fields, data types, optional/required, validation constraints).
- Relationships and business invariants.
- Required operations (create/read/update/delete, extras such as search or filter).

```typescript
// Example entity description for reference
interface ProductEntity {
  id: string;                 // UUID primary key
  name: string;               // unique, 2-100 chars
  price: number;              // positive
  categoryId: string;         // foreign key to categories
  description?: string;       // optional, up to 500 chars
  createdAt: Date;            // auto-generated
  updatedAt: Date;            // auto-updated
}
```

## 2. Share Business Rules

List any invariants so the generated use cases can enforce them:

```text
- Product name must be unique per tenant
- Price must be greater than zero
- If category is "premium" then price <= 1000
- categoryId must reference an existing category
```

## 3. Specify CRUD Scope

```typescript
const operations = {
  create: true,
  list: true,
  get: true,
  update: true,
  delete: true,
  search: false,
  paginate: true,
};
```

## 4. Prompt Template

```
Please generate CRUD support for the Product entity inside our modular architecture.

Module name: inventory
Entity fields:
- id: string (uuid, primary key)
- name: string (required, 2-100 chars, unique per tenant)
- price: number (required, positive)
- categoryId: string (required, references categories.id)
- description?: string (optional, <= 500 chars)
- createdAt: Date (auto-generated)
- updatedAt: Date (auto-updated)

Business rules:
- Name must be unique within a tenant
- Price must be positive
- Premium categories cannot exceed price 1000

Operations: create, list, get by id, update, delete, pagination

Follow the AI CRUD specification and use the new module layout (`src/modules/inventory/...`).
```

## 5. Expected Output Structure

```
src/modules/inventory/
├── domain/
│   ├── entities/product.entity.ts
│   └── ports/product.repository.ts
├── application/
│   └── use-cases/
│       ├── create-product.usecase.ts
│       ├── get-products.usecase.ts
│       ├── get-product-by-id.usecase.ts
│       ├── update-product.usecase.ts
│       └── delete-product.usecase.ts
├── infrastructure/
│   └── persistence/
│       ├── product.schema.ts
│       └── product.drizzle.repository.ts
├── interface/
│   └── http/
│       ├── dtos/product.dto.ts
│       ├── controllers/
│       │   ├── create-product.controller.ts
│       │   ├── get-products.controller.ts
│       │   ├── get-product-by-id.controller.ts
│       │   ├── update-product.controller.ts
│       │   └── delete-product.controller.ts
│       └── product.http
├── module-definition.ts
├── module.tokens.ts
└── tests/unit/
```

## 6. Remember the Wiring

1. Define module-specific tokens in `module.tokens.ts`.
2. Register repositories/providers in `module-definition.ts`.
3. Ensure the module is exported in the platform registry (normally already included).
4. Update database schema & migrations (`@platform/database`).
5. Add unit tests under `src/modules/<module>/tests/unit`.

## 7. Import Patterns

Use path aliases:
- Domain/application: `@modules/inventory/...`
- Shared primitives: `@shared/...`
- Platform services: `@platform/...`

Example controller import list:

```typescript
import { t } from 'elysia';
import { inject, injectable } from 'tsyringe';

import { CreateProductUseCase } from '@modules/inventory/application/use-cases/create-product.usecase';
import { ProductsModuleTokens } from '@modules/inventory/module.tokens';
import { ProductResponseDto, CreateProductRequestDto } from '@modules/inventory/interface/http/dtos/product.dto';
import type { LoggerPort } from '@shared/logging/logger.port';
import { PlatformTokens } from '@platform/di/tokens';
```

## 8. Testing & Verification

- Use the generated REST Client file (`*.http`) to exercise endpoints.
- Add Vitest unit tests under the module's `tests/unit` folder.
- Run `bun run test` to confirm suites pass.
- If Drizzle schema changed, update migrations or `schema.ts` accordingly.

## 9. Quality Checklist

- ✅ Repository implements all port methods.
- ✅ Use cases enforce business rules and reuse shared helpers.
- ✅ DTOs validate payloads with TypeBox.
- ✅ Controllers register routes with correct guards and responses.
- ✅ Module tokens/definition updated.
- ✅ Imports use aliases, no relative `../../..` paths.
- ✅ Tests cover happy path and failure scenarios.

Following these steps keeps CRUD features consistent with the modular clean architecture. 🚀
