# AI CRUD Generation – Quick Reference

Use this cheat sheet when generating new CRUD capabilities inside the modular architecture.

## 🚀 Quick Start

### 1. Gather Requirements

Ask for:
- Module / domain name (e.g. `inventory`, `billing`).
- Entity name and field definitions (type, validation, optional/required).
- Business rules (uniqueness, relationships, status workflows, etc.).
- Required operations (Create, Read, Update, Delete).

### 2. Recommended Generation Order

1. **Scaffold module folders** under `src/modules/{module}/` if they do not exist yet.
2. **Domain**: entity/value objects → repository port.
3. **Application**: use cases (create/get/update/delete) + shared base classes if needed.
4. **Infrastructure**: Drizzle schema updates → repository implementation.
5. **Interface (HTTP)**: DTO schemas → controllers → optional guard/policies.
6. **Module wiring**: update `module.tokens.ts` and `module-definition.ts`.
7. **Platform wiring**: ensure module is registered (normally already handled via `ModuleRegistry`).
8. **Tests**: unit tests (`src/modules/{module}/tests/unit`) + HTTP spec file.

### 3. Naming Cheatsheet

```text
Entity   : Product
File     : product.entity.ts
Class    : Product, CreateProductUseCase
Variable : product, products
Route    : /products, /products/:id
Table    : products
```

## 📁 Module File Layout

```
src/modules/{module}/
├── domain/
│   ├── entities/{entity}.entity.ts
│   └── ports/{entity}.repository.ts
├── application/
│   └── use-cases/
│       ├── create-{entity}.usecase.ts
│       ├── get-{entities}.usecase.ts
│       ├── get-{entity}-by-id.usecase.ts
│       ├── update-{entity}.usecase.ts
│       └── delete-{entity}.usecase.ts
├── infrastructure/
│   └── persistence/
│       ├── {entity}.schema.ts          # Drizzle
│       └── {entity}.drizzle.repository.ts
├── interface/
│   └── http/
│       ├── dtos/{entity}.dto.ts
│       ├── controllers/
│       │   ├── create-{entity}.controller.ts
│       │   ├── get-{entities}.controller.ts
│       │   ├── get-{entity}-by-id.controller.ts
│       │   ├── update-{entity}.controller.ts
│       │   └── delete-{entity}.controller.ts
│       └── {entity}.http               # REST Client tests
├── module-definition.ts
├── module.tokens.ts
└── tests/
    └── unit/...
```

## 🔌 Key Integration Points

### Module Tokens

Create DI tokens local to the module:

```typescript
// src/modules/products/module.tokens.ts
export const ProductsModuleTokens = {
  Repository: Symbol('Products.Repository'),
};
```

### Module Definition

```typescript
// src/modules/products/module-definition.ts
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
    container.resolve(GetAllProductsController).register(app);
    container.resolve(GetProductByIdController).register(app);
    container.resolve(UpdateProductController).register(app);
    container.resolve(DeleteProductController).register(app);
  },
};
```

### Directory Aliases

Use path aliases when importing:

- `@modules/<module>/domain/...`
- `@modules/<module>/application/...`
- `@modules/<module>/interface/http/...`
- `@modules/<module>/infrastructure/...`
- `@shared/...`
- `@platform/...`

## 🧩 Patterns & Snippets

### Domain Entity

```typescript
import { Entity } from '@shared/kernel/entity';
import type { Brand } from '@shared/kernel/brand.type';

export type ProductId = Brand<string, 'ProductId'>;

export class Product extends Entity {
  id: ProductId = '' as ProductId;
  name!: string;
  price!: number;
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

### Use Case Skeleton

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
      .build();

    return this.products.create(entity);
  }
}
```

### Controller Pattern

```typescript
@injectable()
export class CreateProductController {
  constructor(@inject(CreateProductUseCase) private readonly useCase: CreateProductUseCase) {}

  register(app: Elysia) {
    app.post('/products', async ({ body }) => {
      const product = await this.useCase.execute(body);
      return product;
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

### Drizzle Repository

```typescript
@injectable()
export class ProductDrizzleRepository implements ProductRepository {
  async create(product: Product): Promise<Product> {
    const [row] = await db.insert(products).values({
      name: product.name,
      price: product.price,
    }).returning();

    return this.toDomain(row);
  }

  private toDomain(row: ProductRow): Product {
    return Builder(Product)
      .id(row.id as ProductId)
      .name(row.name)
      .price(row.price)
      .createdAt(row.createdAt)
      .updatedAt(row.updatedAt)
      .build();
  }
}
```

### DTO Schema

```typescript
export const CreateProductRequestDto = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  price: t.Number({ minimum: 0 }),
});

export const ProductResponseDto = t.Object({
  id: t.String(),
  name: t.String(),
  price: t.Number(),
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});
```

### HTTP Test Template

```http
### Variables
@baseUrl = http://localhost:7000
@contentType = application/json

### Create Product
POST {{baseUrl}}/products
Content-Type: {{contentType}}

{ "name": "Sample", "price": 25 }

### List Products
GET {{baseUrl}}/products

### Get Product by ID
GET {{baseUrl}}/products/{{productId}}

### Update Product
PUT {{baseUrl}}/products/{{productId}}
Content-Type: {{contentType}}

{ "name": "Updated", "price": 30 }

### Delete Product
DELETE {{baseUrl}}/products/{{productId}}
```

## ✅ Final Checklist

- Module folder structure created.
- Domain entity & repository port implemented.
- Use cases cover requested operations.
- DTOs validate payloads with TypeBox.
- Controllers register under correct routes and use DI.
- Drizzle schema & repository persist data.
- Module tokens and definition updated.
- Tests and HTTP spec files added.
- All imports use path aliases (`@modules`, `@shared`, `@platform`).

---

Use this guide to keep CRUD feature generation consistent with the modular architecture. 🛠️
