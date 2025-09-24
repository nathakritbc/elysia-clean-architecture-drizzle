# AI CRUD Generation Specification

## Overview

This document provides comprehensive specifications for AI assistants to generate CRUD (Create, Read, Update, Delete) operations following the Clean Architecture pattern with JWT authentication, posts management, and observability stack used in this project.

## 📋 Before Starting CRUD Generation

### Prerequisites

1. **Read Project Context**: Review the main [AI-SPEC.md](AI-SPEC.md) for overall project architecture
2. **Migration Planning**: Consult [AI-SPEC-MIGRATE.md](ai-spec-migrate.md) for database migration requirements
3. **Current Domains**: This project supports Auth, Posts, and Users domains
4. **Authentication**: All protected endpoints require JWT + CSRF tokens

### Required Project Knowledge

- **Framework**: Elysia + TypeScript + Bun
- **Database**: PostgreSQL + Drizzle ORM with UUID primary keys
- **Authentication**: JWT access tokens + refresh tokens + CSRF protection
- **Validation**: TypeBox schema validation with comprehensive DTOs
- **Architecture**: Multi-domain Clean Architecture with dependency injection

## 🏗️ Architecture Pattern

### Clean Architecture Layers

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            External Layer                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web API   │  │  Database   │  │ JWT Service │  │ Observability│        │
│  │  (Elysia)   │  │ (Drizzle)   │  │  (Tokens)   │  │ (OpenTel)    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Interface Adapters                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Controllers │  │ Auth Guards │  │    DTOs     │  │ Transformers │        │
│  │ (REST API)  │  │ (JWT/CSRF)  │  │ (TypeBox)   │  │   (Data)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Domain Layer                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Auth Domain │  │Posts Domain │  │Users Domain │  │ NEW Domain   │        │
│  │ (JWT/Auth)  │  │(CRUD Posts) │  │ (Profiles)  │  │ (Your CRUD)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                    Use Cases, Entities, Services                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Project Structure

```text
src/
├── core/domain/
│   ├── auth/           # 🔐 Authentication (JWT, Refresh Tokens)
│   ├── posts/          # 📝 Posts Management (CRUD with pagination)
│   ├── users/          # 👤 User Management
│   └── {new-domain}/   # 🆕 Your New Domain (Generated CRUD)
├── adapters/
│   ├── auth/           # Auth controllers + guards
│   ├── posts/          # Posts controllers + DTOs
│   └── {new-domain}/   # 🆕 New domain controllers
└── external/
    ├── drizzle/
    │   ├── auth/       # Auth repositories
    │   ├── posts/      # Posts repositories
    │   └── {new-domain}/ # 🆕 New domain repositories
    └── config/         # JWT, CORS, OpenTelemetry configs
```

## 📋 CRUD Generation Template

### Input Parameters

When generating CRUD operations, the AI should collect the following information:

#### 🎯 **Primary Requirements**

1. **Domain Name** (e.g., "products", "orders", "categories")
   - Will create `/src/core/domain/{domain-name}/` structure
   - Should be plural, lowercase, hyphenated

2. **Entity Name** (e.g., "Product", "Order", "Category")
   - PascalCase singular form
   - Used for class names and TypeScript interfaces

3. **Authentication Requirements**
   - **Public**: No authentication required
   - **Protected**: Requires JWT + CSRF tokens (like posts domain)
   - **Admin Only**: Requires specific role/permission

#### 🗃️ **Entity Structure**

1. **Entity Fields** with comprehensive specifications:

```typescript
interface FieldSpec {
  name: string; // Field name (camelCase)
  type: 'uuid' | 'string' | 'number' | 'boolean' | 'date' | 'text';
  required: boolean; // Is field required?
  unique?: boolean; // Should be unique in database?
  validation?: {
    // Validation rules
    minLength?: number;
    maxLength?: number;
    min?: number; // For numbers
    max?: number; // For numbers
    pattern?: string; // Regex pattern
  };
  defaultValue?: any; // Default value
  description?: string; // Field description
}
```

1. **Relationships** (if any):
   - Foreign key references
   - Relationship type (belongs to, has many, etc.)

#### 🔧 **Business Logic**

1. **Business Rules**:
   - Unique constraints
   - Validation rules
   - Custom business logic

1. **CRUD Operations Needed**:
   - **Create**: POST /{domain}
   - **Read All**: GET /{domain} (with pagination/search)
   - **Read One**: GET /{domain}/:id
   - **Update**: PUT /{domain}/:id
   - **Delete**: DELETE /{domain}/:id

### Example Input Specification

```yaml
# Example: E-commerce Product Management
domain_name: 'products'
entity_name: 'Product'
authentication: 'protected' # Requires JWT + CSRF

fields:
  - name: 'id'
    type: 'uuid'
    required: true
    unique: true
    description: 'Primary key'

  - name: 'name'
    type: 'string'
    required: true
    unique: true
    validation:
      minLength: 2
      maxLength: 100
    description: 'Product name'

  - name: 'description'
    type: 'text'
    required: false
    validation:
      maxLength: 1000
    description: 'Product description'

  - name: 'price'
    type: 'number'
    required: true
    validation:
      min: 0
    description: 'Product price in cents'

  - name: 'categoryId'
    type: 'uuid'
    required: true
    description: 'Reference to category'

  - name: 'status'
    type: 'string'
    required: true
    defaultValue: 'active'
    validation:
      pattern: '^(active|inactive|discontinued)$'
    description: 'Product status'

relationships:
  - field: 'categoryId'
    references: 'categories.id'
    type: 'belongs_to'

business_rules:
  - 'Product name must be unique'
  - 'Price must be positive'
  - 'Category must exist'
  - 'Only active products appear in public listings'

crud_operations:
  - 'create'
  - 'read_all' # with pagination, search, filter
  - 'read_one'
  - 'update'
  - 'delete' # soft delete (set status to discontinued)

pagination:
  default_limit: 10
  max_limit: 100

search_fields:
  - 'name'
  - 'description'

filter_fields:
  - 'status'
  - 'categoryId'

sort_fields:
  - 'name'
  - 'price'
  - 'createdAt'
  - 'updatedAt'
```

## 🎯 Generated File Structure

Follow the existing project patterns exactly. Study the `posts` domain as a reference implementation.

### 1. Domain Layer Files

#### Entity Interface (`src/core/domain/{domain-name}/entity/{entity-name}.entity.ts`)

```typescript
// Example: src/core/domain/products/entity/product.entity.ts
import type { Branded } from '../../../shared/branded.type';

// Branded Types (follow existing pattern)
export type ProductId = Branded<string, 'ProductId'>;
export type ProductName = Branded<string, 'ProductName'>;
export type ProductDescription = Branded<string, 'ProductDescription'>;
export type ProductPrice = Branded<number, 'ProductPrice'>;
export type ProductStatus = Branded<'active' | 'inactive' | 'discontinued', 'ProductStatus'>;
export type CategoryId = Branded<string, 'CategoryId'>;

// Entity Interface
export interface IProduct {
  id: ProductId;
  name: ProductName;
  description?: ProductDescription;
  price: ProductPrice;
  categoryId: CategoryId;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Entity Status Enum (if needed)
export const ProductStatusValues = {
  ACTIVE: 'active' as ProductStatus,
  INACTIVE: 'inactive' as ProductStatus,
  DISCONTINUED: 'discontinued' as ProductStatus,
} as const;
```

#### Repository Interface (`src/core/domain/{domain-name}/service/{entity-name}.repository.ts`)

```typescript
// Example: src/core/domain/products/service/product.repository.ts
import type { IProduct, ProductId, ProductName } from '../entity/product.entity';

export interface IProductRepository {
  // Core CRUD operations
  create(product: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<IProduct>;
  findById(id: ProductId): Promise<IProduct | null>;
  findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: IProduct[]; meta: PaginationMeta }>;
  update(id: ProductId, updates: Partial<IProduct>): Promise<IProduct | null>;
  delete(id: ProductId): Promise<boolean>;

  // Business-specific queries
  findByName(name: ProductName): Promise<IProduct | null>;
  findByCategory(categoryId: CategoryId): Promise<IProduct[]>;
  findByStatus(status: ProductStatus): Promise<IProduct[]>;
}

// Pagination metadata interface
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### Use Cases (Generate all 5 standard use cases)

```typescript
// Example: src/core/domain/products/use-case/create-product.usecase.ts
import { StrictBuilder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';

import { ConflictError, ValidationError } from '../../../shared/errors/error-mapper';
import type { LoggerPort } from '../../../shared/logger/logger.port';
import { TOKENS } from '../../../shared/tokens';
import type { IUseCase } from '../../../shared/useCase';
import type {
  CategoryId,
  IProduct,
  ProductDescription,
  ProductName,
  ProductPrice,
  ProductStatus,
} from '../entity/product.entity';
import { ProductStatusValues } from '../entity/product.entity';
import type { IProductRepository } from '../service/product.repository';

export interface CreateProductInput {
  name: ProductName;
  description?: ProductDescription;
  price: ProductPrice;
  categoryId: CategoryId;
  status?: ProductStatus;
}

@injectable()
export class CreateProductUseCase implements IUseCase<CreateProductInput, IProduct> {
  constructor(
    @inject(TOKENS.IProductRepository)
    private readonly productRepository: IProductRepository,
    @inject(TOKENS.Logger)
    private readonly logger: LoggerPort
  ) {}

  async execute(input: CreateProductInput): Promise<IProduct> {
    const { name, description, price, categoryId, status = ProductStatusValues.ACTIVE } = input;

    this.logger.info('Creating product', { name, categoryId });

    // Business Rule: Check if product name already exists
    const existingProduct = await this.productRepository.findByName(name);
    if (existingProduct) {
      this.logger.warn('Product name already exists', { name });
      throw new ConflictError('Product name already exists');
    }

    // Business Rule: Validate price is positive
    if (price <= 0) {
      this.logger.warn('Invalid price provided', { price });
      throw new ValidationError('Price must be positive');
    }

    // Create product
    const productData = StrictBuilder<Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>>()
      .name(name)
      .description(description)
      .price(price)
      .categoryId(categoryId)
      .status(status)
      .build();

    const createdProduct = await this.productRepository.create(productData);

    this.logger.info('Product created successfully', {
      id: createdProduct.id,
      name: createdProduct.name,
    });

    return createdProduct;
  }
}
```

**Generate similar use cases for:**

- `get-all-products.usecase.ts` (with pagination, search, filter)
- `get-product-by-id.usecase.ts`
- `update-product-by-id.usecase.ts`
- `delete-product-by-id.usecase.ts`

### 2. Infrastructure Layer Files

#### Drizzle Schema (`src/external/drizzle/{domain-name}/{entity-name}.schema.ts`)

```typescript
// Example: src/external/drizzle/products/product.schema.ts
import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  price: integer('price').notNull(), // Store price in cents
  categoryId: uuid('category_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for Drizzle
export type DrizzleProduct = typeof products.$inferSelect;
export type NewDrizzleProduct = typeof products.$inferInsert;

// Update main schema.ts to export the new table
// Add to src/external/drizzle/schema.ts:
// export { products } from './products/product.schema';
```

#### Repository Implementation (`src/external/drizzle/{domain-name}/{entity-name}.drizzle.repository.ts`)

```typescript
// Example: src/external/drizzle/products/product.drizzle.repository.ts
import { Builder } from 'builder-pattern';
import { and, asc, count, desc, eq, like } from 'drizzle-orm';
import { injectable } from 'tsyringe';

import type {
  CategoryId,
  IProduct,
  ProductDescription,
  ProductId,
  ProductName,
  ProductPrice,
  ProductStatus,
} from '../../../core/domain/products/entity/product.entity';
import type { IProductRepository, PaginationMeta } from '../../../core/domain/products/service/product.repository';
import { db } from '../connection';
import { type DrizzleProduct, products } from './product.schema';

@injectable()
export class ProductDrizzleRepository implements IProductRepository {
  // Map Drizzle entity to Domain entity
  private mapToDomain(drizzleProduct: DrizzleProduct): IProduct {
    return Builder<IProduct>()
      .id(drizzleProduct.id as ProductId)
      .name(drizzleProduct.name as ProductName)
      .description(drizzleProduct.description as ProductDescription)
      .price(drizzleProduct.price as ProductPrice)
      .categoryId(drizzleProduct.categoryId as CategoryId)
      .status(drizzleProduct.status as ProductStatus)
      .createdAt(drizzleProduct.createdAt)
      .updatedAt(drizzleProduct.updatedAt)
      .build();
  }

  async create(productData: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<IProduct> {
    const [result] = await db
      .insert(products)
      .values({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId,
        status: productData.status,
      })
      .returning();

    return this.mapToDomain(result);
  }

  async findById(id: ProductId): Promise<IProduct | null> {
    const [result] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    return result ? this.mapToDomain(result) : null;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: IProduct[]; meta: PaginationMeta }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const offset = (page - 1) * limit;
    const sortBy = options?.sortBy ?? 'createdAt';
    const sortOrder = options?.sortOrder ?? 'desc';

    // Build where conditions
    const conditions = [];

    if (options?.search) {
      conditions.push(like(products.name, `%${options.search}%`));
    }

    if (options?.status) {
      conditions.push(eq(products.status, options.status));
    }

    if (options?.categoryId) {
      conditions.push(eq(products.categoryId, options.categoryId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count: totalCount }] = await db.select({ count: count() }).from(products).where(whereClause);

    // Get paginated data
    const orderBy = sortOrder === 'asc' ? asc(products[sortBy]) : desc(products[sortBy]);

    const results = await db.select().from(products).where(whereClause).orderBy(orderBy).limit(limit).offset(offset);

    const data = results.map(result => this.mapToDomain(result));
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  async update(id: ProductId, updates: Partial<IProduct>): Promise<IProduct | null> {
    const [result] = await db
      .update(products)
      .set({
        name: updates.name,
        description: updates.description,
        price: updates.price,
        categoryId: updates.categoryId,
        status: updates.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return result ? this.mapToDomain(result) : null;
  }

  async delete(id: ProductId): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();

    return result.length > 0;
  }

  async findByName(name: ProductName): Promise<IProduct | null> {
    const [result] = await db.select().from(products).where(eq(products.name, name)).limit(1);

    return result ? this.mapToDomain(result) : null;
  }

  async findByCategory(categoryId: CategoryId): Promise<IProduct[]> {
    const results = await db.select().from(products).where(eq(products.categoryId, categoryId));

    return results.map(result => this.mapToDomain(result));
  }

  async findByStatus(status: ProductStatus): Promise<IProduct[]> {
    const results = await db.select().from(products).where(eq(products.status, status));

    return results.map(result => this.mapToDomain(result));
  }
}
```

### 3. Application Layer Files

#### DTOs (`src/adapters/{domain-name}/dtos/{entity-name}.dto.ts`)

```typescript
// Example: src/adapters/products/dtos/product.dto.ts
import { t } from 'elysia';

// Request DTOs
export const CreateProductRequestDto = t.Object({
  name: t.String({
    minLength: 2,
    maxLength: 100,
    description: 'Product name',
  }),
  description: t.Optional(
    t.String({
      maxLength: 1000,
      description: 'Product description',
    })
  ),
  price: t.Integer({
    minimum: 0,
    description: 'Product price in cents',
  }),
  categoryId: t.String({
    format: 'uuid',
    description: 'Category UUID',
  }),
  status: t.Optional(
    t.Union([t.Literal('active'), t.Literal('inactive'), t.Literal('discontinued')], {
      default: 'active',
      description: 'Product status',
    })
  ),
});

export const UpdateProductRequestDto = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
  price: t.Optional(t.Integer({ minimum: 0 })),
  categoryId: t.Optional(t.String({ format: 'uuid' })),
  status: t.Optional(t.Union([t.Literal('active'), t.Literal('inactive'), t.Literal('discontinued')])),
});

// Query DTOs
export const GetAllProductsQueryDto = t.Object({
  page: t.Optional(t.Integer({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Integer({ minimum: 1, maximum: 100, default: 10 })),
  search: t.Optional(t.String({ description: 'Search in name and description' })),
  status: t.Optional(t.Union([t.Literal('active'), t.Literal('inactive'), t.Literal('discontinued')])),
  categoryId: t.Optional(t.String({ format: 'uuid' })),
  sortBy: t.Optional(
    t.Union([t.Literal('name'), t.Literal('price'), t.Literal('createdAt'), t.Literal('updatedAt')], {
      default: 'createdAt',
    })
  ),
  sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')], { default: 'desc' })),
});

// Path parameter DTOs
export const ProductIdParamsDto = t.Object({
  id: t.String({
    format: 'uuid',
    description: 'Product UUID',
  }),
});

// Response DTOs
export const ProductResponseDto = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  price: t.Integer(),
  categoryId: t.String(),
  status: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const GetAllProductsReturnTypeDto = t.Object({
  data: t.Array(ProductResponseDto),
  meta: t.Object({
    total: t.Integer(),
    page: t.Integer(),
    limit: t.Integer(),
    totalPages: t.Integer(),
  }),
});

// Common Error Response
export const ErrorResponseDto = t.Object({
  name: t.String(),
  message: t.String(),
});

// Type exports
export type CreateProductRequestType = typeof CreateProductRequestDto.static;
export type UpdateProductRequestType = typeof UpdateProductRequestDto.static;
export type GetAllProductsQueryType = typeof GetAllProductsQueryDto.static;
export type ProductIdParamsType = typeof ProductIdParamsDto.static;
export type ProductResponseType = typeof ProductResponseDto.static;
```

#### Controllers (Generate all 5 controllers)

```typescript
// Example: src/adapters/products/create-product.controller.ts
import { StrictBuilder } from 'builder-pattern';
import Elysia from 'elysia';
import { inject, injectable } from 'tsyringe';

import type {
  CategoryId,
  ProductDescription,
  ProductName,
  ProductPrice,
  ProductStatus,
} from '../../core/domain/products/entity/product.entity';
import { CreateProductUseCase } from '../../core/domain/products/use-case/create-product.usecase';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import { CreateProductRequestDto, ErrorResponseDto, ProductResponseDto } from './dtos/product.dto';

@injectable()
export class CreateProductController {
  constructor(
    @inject(CreateProductUseCase) private readonly useCase: CreateProductUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.post(
      '/products',
      async ({ body }) => {
        const input = StrictBuilder<CreateProductInput>()
          .name(body.name as ProductName)
          .description(body.description as ProductDescription)
          .price(body.price as ProductPrice)
          .categoryId(body.categoryId as CategoryId)
          .status(body.status as ProductStatus)
          .build();

        try {
          this.logger.info('Creating product', { ...input });

          const productCreated = await this.useCase.execute(input);

          this.logger.info('Product created successfully', { id: productCreated.id });

          return productCreated;
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error('Unknown error');
          this.logger.error('Failed to create product', { ...input, error: normalizedError });
          throw error;
        }
      },
      {
        body: CreateProductRequestDto,
        response: {
          200: ProductResponseDto,
          400: ErrorResponseDto,
          409: ErrorResponseDto, // Conflict (duplicate name)
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Create a new product',
          description: 'Creates a new product with the provided information',
          tags: ['Products'],
        },
      }
    );
  }
}
```

**Generate similar controllers for:**

- `get-all-products.controller.ts` (with pagination, search, filter)
- `get-product-by-id.controller.ts`
- `update-product-by-id.controller.ts`
- `delete-product-by-id.controller.ts`

**Authentication Considerations:**

- If endpoints are **protected**: Use `withAuth(app)` wrapper like posts domain
- If endpoints are **public**: Register directly without auth wrapper

### 4. Configuration Files

#### Update Dependency Injection Container (`src/core/shared/container.ts`)

```typescript
// Add to existing container.ts
import { ProductDrizzleRepository } from '../../external/drizzle/products/product.drizzle.repository';
import type { IProductRepository } from '../domain/products/service/product.repository';

// Register repository implementation
container.registerSingleton<IProductRepository>(TOKENS.IProductRepository, ProductDrizzleRepository);
```

#### Update Tokens (`src/core/shared/tokens.ts`)

```typescript
// Add to existing tokens.ts
export const TOKENS = {
  // ... existing tokens
  IProductRepository: Symbol('IProductRepository'),
} as const;
```

#### Update Routes (`src/external/api/routes.ts`)

```typescript
// Add to existing routes.ts
import { withAuth } from '../../adapters/auth/auth.guard';
import { CreateProductController } from '../../adapters/products/create-product.controller';
import { DeleteProductByIdController } from '../../adapters/products/delete-product-by-id.controller';
import { GetAllProductsController } from '../../adapters/products/get-all-products.controller';
import { GetProductByIdController } from '../../adapters/products/get-product-by-id.controller';
import { UpdateProductByIdController } from '../../adapters/products/update-product-by-id.controller';

export const createRoutes = (appConfig: AppConfig) => {
  const app = createElysiaApp(appConfig);
  const elysiaApp = app as unknown as Elysia;

  // Resolve controllers from DI container
  const createProductController = container.resolve(CreateProductController);
  const getAllProductsController = container.resolve(GetAllProductsController);
  const getProductByIdController = container.resolve(GetProductByIdController);
  const updateProductByIdController = container.resolve(UpdateProductByIdController);
  const deleteProductByIdController = container.resolve(DeleteProductByIdController);

  // Register routes - choose authentication strategy:

  // Option A: Protected routes (like posts)
  const protectedApp = withAuth(elysiaApp) as unknown as Elysia;
  createProductController.register(protectedApp);
  getAllProductsController.register(protectedApp);
  getProductByIdController.register(protectedApp);
  updateProductByIdController.register(protectedApp);
  deleteProductByIdController.register(protectedApp);

  // Option B: Public routes (no authentication)
  // createProductController.register(elysiaApp);
  // getAllProductsController.register(elysiaApp);
  // getProductByIdController.register(elysiaApp);
  // updateProductByIdController.register(elysiaApp);
  // deleteProductByIdController.register(elysiaApp);

  return app;
};
```

### 5. Test Files

#### HTTP Tests (`src/adapters/{domain-name}/{entity-name}.http`)

```http
### Variables
@baseUrl = http://localhost:7000
@contentType = application/json

# For protected endpoints, get tokens from auth first
### Sign in to get tokens
# @name signin
POST {{baseUrl}}/auth/signin
Content-Type: {{contentType}}

{
  "email": "user1@gmail.com",
  "password": "12345678"
}

### Store tokens
@accessToken = {{signin.response.body.accessToken}}
@csrfToken = {{signin.response.body.csrf_token}}

### Create Product - Valid Request (Protected)
POST {{baseUrl}}/products
Content-Type: {{contentType}}
Authorization: Bearer {{accessToken}}
X-CSRF-Token: {{csrfToken}}

{
  "name": "Sample Product",
  "description": "A sample product for testing",
  "price": 9999,
  "categoryId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "active"
}

### Create Product - Invalid Price
POST {{baseUrl}}/products
Content-Type: {{contentType}}
Authorization: Bearer {{accessToken}}
X-CSRF-Token: {{csrfToken}}

{
  "name": "Invalid Product",
  "description": "A product with invalid price",
  "price": -10,
  "categoryId": "550e8400-e29b-41d4-a716-446655440001"
}

### Get All Products with Pagination
GET {{baseUrl}}/products?page=1&limit=10&search=Sample&sortBy=name&sortOrder=asc
Authorization: Bearer {{accessToken}}
X-CSRF-Token: {{csrfToken}}

### Get All Products with Filter
GET {{baseUrl}}/products?status=active&categoryId=550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer {{accessToken}}
X-CSRF-Token: {{csrfToken}}

### Get Product by ID
GET {{baseUrl}}/products/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer {{accessToken}}
X-CSRF-Token: {{csrfToken}}

### Update Product
PUT {{baseUrl}}/products/550e8400-e29b-41d4-a716-446655440002
Content-Type: {{contentType}}
Authorization: Bearer {{accessToken}}
X-CSRF-Token: {{csrfToken}}

{
  "name": "Updated Product",
  "price": 14999,
  "status": "inactive"
}

### Delete Product
DELETE {{baseUrl}}/products/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer {{accessToken}}
X-CSRF-Token: {{csrfToken}}

### Error Cases

### Get Product by Invalid ID
GET {{baseUrl}}/products/invalid-uuid
Authorization: Bearer {{accessToken}}
X-CSRF-Token: {{csrfToken}}

### Create Product without Auth (should fail)
POST {{baseUrl}}/products
Content-Type: {{contentType}}

{
  "name": "Unauthorized Product",
  "price": 9999,
  "categoryId": "550e8400-e29b-41d4-a716-446655440001"
}
```

## 🔄 CRUD Generation Process

### Step 1: Requirements Gathering

Collect comprehensive requirements from the user:

1. **Domain Specification**: Domain name, entity name, authentication requirements
1. **Field Specification**: All entity fields with types, validation, relationships
1. **Business Rules**: Unique constraints, validation rules, custom logic
1. **API Requirements**: Which CRUD operations are needed, pagination, search, filters

### Step 2: Migration Planning

**IMPORTANT**: Always handle database migration first!

1. **Read Migration Spec**: Consult [ai-spec-migrate.md](ai-spec-migrate.md)
1. **Plan Schema**: Design database table structure
1. **Generate Migration**: Create and apply database migration
1. **Verify Schema**: Ensure migration was successful

### Step 3: File Generation

Generate files in this **exact order**:

#### Phase 1: Domain Layer

1. Entity interface with branded types
1. Repository interface
1. All use cases (Create, GetAll, GetById, Update, Delete)

#### Phase 2: Infrastructure Layer

1. Drizzle schema file
1. Drizzle repository implementation
1. Update main schema exports

#### Phase 3: Application Layer

1. DTOs with comprehensive TypeBox validation
1. All controllers (5 controllers)

#### Phase 4: Configuration

1. Update DI container registrations
1. Update tokens
1. Update routes with authentication strategy

#### Phase 5: Testing

1. HTTP test file with all scenarios

### Step 4: Integration & Testing

1. **Compile Check**: Ensure TypeScript compiles without errors
1. **Start Server**: Verify application starts successfully
1. **Test Endpoints**: Use HTTP test file to verify functionality
1. **Test Authentication**: Verify protected endpoints require JWT + CSRF

### Step 5: Documentation Updates

**CRITICAL**: Always update project documentation after CRUD completion!

1. **Create Module README**: Create `docs/modules/{domain-name}-README.md` (see template above)
2. **Update Main README**: Add new API endpoints to main README.md
3. **Update AI-SPEC**: Add new domain to AI-SPEC.md documentation
4. **Version Increment**: Update document versions appropriately

## 📋 Post-Completion Tasks

### MANDATORY: Update Project Documentation

After successfully generating CRUD operations, **ALWAYS** update the following files:

#### 1. Update README.md

Add the new domain to the API endpoints section:

```markdown
### {Entity} Management (Protected Routes)

| Method   | Endpoint          | Description                    | Authentication | Request Body |
| -------- | ----------------- | ------------------------------ | -------------- | ------------ |
| `POST`   | `/{entities}`     | Create a new {entity}          | JWT + CSRF     | `{ fields }` |
| `GET`    | `/{entities}`     | Get all {entities} (paginated) | JWT + CSRF     | Query params |
| `GET`    | `/{entities}/:id` | Get {entity} by ID             | JWT + CSRF     | -            |
| `PUT`    | `/{entities}/:id` | Update {entity} by ID          | JWT + CSRF     | `{ fields }` |
| `DELETE` | `/{entities}/:id` | Delete {entity} by ID          | JWT + CSRF     | -            |
```

#### 2. Update AI-SPEC.md

Add the new domain to the Domain Model section:

```markdown
### {Entity} Domain

#### {Entity} Entity

\`\`\`typescript
export interface I{Entity} {
id: {Entity}Id;
// ... other fields
createdAt: Date;
updatedAt: Date;
}
\`\`\`

#### {Entity} Business Rules

1. **Field Validation**: Describe validation rules
2. **Unique Constraints**: Describe unique fields
3. **Business Logic**: Describe custom rules
```

Add new use cases to the Use Cases section:

```markdown
#### {Entity} Domain Use Cases

#### X. Create {Entity} Use Case

- **Input**: `CreateProductInput`
- **Output**: `IProduct`
- **Business Rules**: Describe rules

#### X+1. Get All {Entity}s Use Case

- **Input**: `GetAllProductsQuery`
- **Output**: `{ data: IProduct[], meta: PaginationMeta }`
- **Business Rules**: Describe pagination/filtering rules

// ... continue for all use cases
```

Update the database schema section with new table.

#### 3. Update File Structure Documentation

Update the file structure in both README.md and AI-SPEC.md to show the new domain:

```text
src/
├── core/domain/
│   ├── auth/
│   ├── posts/
│   ├── users/
│   └── {new-domain}/     # 🆕 New domain
│       ├── entity/
│       ├── service/
│       └── use-case/
├── adapters/
│   └── {new-domain}/     # 🆕 New controllers
└── external/drizzle/
    └── {new-domain}/     # 🆕 New repositories
```

#### 4. Create Module README

**MANDATORY**: Create a comprehensive README for the new module/domain:

Create `docs/modules/{domain-name}-README.md` with the following structure:

````markdown
# {Entity} Management Module

## Overview

This module provides comprehensive {entity} management functionality with CRUD operations, authentication, and business rule validation.

**Domain**: {domain-name}  
**Authentication**: [Protected/Public]  
**Created**: [Date]  
**Version**: 1.0

## 🎯 Features

- ✅ Create {entity} with validation
- ✅ List {entities} with pagination, search, and filtering
- ✅ Get {entity} by ID
- ✅ Update {entity} with business rule validation
- ✅ Delete {entity} (soft/hard delete)
- ✅ JWT + CSRF authentication (if protected)
- ✅ Comprehensive error handling
- ✅ OpenAPI documentation

## 📋 API Endpoints

### Base URL: `http://localhost:7000`

| Method   | Endpoint          | Description                 | Auth Required | Request Body |
| -------- | ----------------- | --------------------------- | ------------- | ------------ |
| `POST`   | `/{entities}`     | Create new {entity}         | [Yes/No]      | [Body spec]  |
| `GET`    | `/{entities}`     | List {entities} (paginated) | [Yes/No]      | Query params |
| `GET`    | `/{entities}/:id` | Get {entity} by ID          | [Yes/No]      | -            |
| `PUT`    | `/{entities}/:id` | Update {entity}             | [Yes/No]      | [Body spec]  |
| `DELETE` | `/{entities}/:id` | Delete {entity}             | [Yes/No]      | -            |

### Query Parameters (GET /{entities})

| Parameter   | Type   | Default   | Description              |
| ----------- | ------ | --------- | ------------------------ |
| `page`      | number | 1         | Page number              |
| `limit`     | number | 10        | Items per page (max 100) |
| `search`    | string | -         | Search in [fields]       |
| `sortBy`    | string | createdAt | Sort field               |
| `sortOrder` | string | desc      | Sort order (asc/desc)    |
| [filters]   | [type] | -         | Filter options           |

## 🗃️ Database Schema

### {Entity} Table

\`\`\`sql
CREATE TABLE {table_name} (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- [list all fields with types and constraints]
created_at TIMESTAMP DEFAULT NOW() NOT NULL,
updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX {table}\_name_idx ON {table_name} (field_name);
CREATE INDEX {table}\_created_at_idx ON {table_name} (created_at);
-- [list all indexes]

-- Foreign Keys (if any)
ALTER TABLE {table_name} ADD CONSTRAINT {constraint_name}
FOREIGN KEY (field_id) REFERENCES other_table(id) ON DELETE CASCADE;
\`\`\`

## 🔧 Business Rules

1. **[Rule 1]**: Description and validation
2. **[Rule 2]**: Description and validation
3. **[Rule 3]**: Description and validation
4. **[etc]**: Continue listing all business rules

## 📝 Usage Examples

### Authentication (if protected)

\`\`\`bash

# Get access token first

curl -X POST http://localhost:7000/auth/signin \\
-H "Content-Type: application/json" \\
-d '{"email": "user@example.com", "password": "password"}'

# Use the returned accessToken and csrf_token in subsequent requests

\`\`\`

### Create {Entity}

\`\`\`bash
curl -X POST http://localhost:7000/{entities} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-H "X-CSRF-Token: YOUR_CSRF_TOKEN" \\
-d '{
"field1": "value1",
"field2": "value2"
}'
\`\`\`

### List {Entities} with Pagination

\`\`\`bash
curl -X GET "http://localhost:7000/{entities}?page=1&limit=10&search=term&sortBy=name&sortOrder=asc" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-H "X-CSRF-Token: YOUR_CSRF_TOKEN"
\`\`\`

### Get {Entity} by ID

\`\`\`bash
curl -X GET http://localhost:7000/{entities}/550e8400-e29b-41d4-a716-446655440000 \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-H "X-CSRF-Token: YOUR_CSRF_TOKEN"
\`\`\`

### Update {Entity}

\`\`\`bash
curl -X PUT http://localhost:7000/{entities}/550e8400-e29b-41d4-a716-446655440000 \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-H "X-CSRF-Token: YOUR_CSRF_TOKEN" \\
-d '{
"field1": "updated_value1",
"field2": "updated_value2"
}'
\`\`\`

### Delete {Entity}

\`\`\`bash
curl -X DELETE http://localhost:7000/{entities}/550e8400-e29b-41d4-a716-446655440000 \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
-H "X-CSRF-Token: YOUR_CSRF_TOKEN"
\`\`\`

## 🧪 Testing

### HTTP Tests

Use the HTTP test file: `src/adapters/{domain-name}/{entity-name}.http`

\`\`\`bash

# Test all endpoints using REST Client extension in VS Code

# Or use curl commands from the examples above

\`\`\`

### Validation Tests

Test cases included:

- ✅ Valid {entity} creation
- ✅ Invalid data validation (required fields, format validation)
- ✅ Business rule validation (unique constraints, etc.)
- ✅ Authentication validation (if protected)
- ✅ Not found scenarios (404 errors)
- ✅ Pagination and search functionality

## 📁 File Structure

\`\`\`
src/
├── core/domain/{domain-name}/
│ ├── entity/{entity-name}.entity.ts # Entity interface & types
│ ├── service/{entity-name}.repository.ts # Repository interface  
│ └── use-case/
│ ├── create-{entity-name}.usecase.ts # Create use case
│ ├── get-all-{entities}.usecase.ts # List with pagination
│ ├── get-{entity-name}-by-id.usecase.ts # Get by ID
│ ├── update-{entity-name}-by-id.usecase.ts # Update
│ └── delete-{entity-name}-by-id.usecase.ts # Delete
├── adapters/{domain-name}/
│ ├── dtos/{entity-name}.dto.ts # TypeBox DTOs
│ ├── create-{entity-name}.controller.ts # Create controller
│ ├── get-all-{entities}.controller.ts # List controller
│ ├── get-{entity-name}-by-id.controller.ts # Get controller
│ ├── update-{entity-name}-by-id.controller.ts # Update controller
│ ├── delete-{entity-name}-by-id.controller.ts # Delete controller
│ └── {entity-name}.http # HTTP tests
└── external/drizzle/{domain-name}/
├── {entity-name}.schema.ts # Drizzle schema
└── {entity-name}.drizzle.repository.ts # Repository implementation
\`\`\`

## 🔗 Dependencies

### Domain Dependencies

- `../../../shared/branded.type` - Branded types
- `../../../shared/useCase` - Use case interface
- `../../../shared/logger/logger.port` - Logger interface
- `../../../shared/errors/error-mapper` - Error classes

### External Dependencies

- `elysia` - Web framework
- `drizzle-orm` - ORM and query builder
- `builder-pattern` - Object builder
- `tsyringe` - Dependency injection

## 🚀 Getting Started

1. **Ensure Database Migration**:
   \`\`\`bash
   bun run db:migrate
   \`\`\`

2. **Start Development Server**:
   \`\`\`bash
   bun run dev
   \`\`\`

3. **Access API Documentation**:
   - Swagger UI: `http://localhost:7000/swagger`
   - Look for "{Entity}" tag in the documentation

4. **Run Tests**:
   - Use HTTP test file in VS Code with REST Client extension
   - Or use the curl examples above

## 📋 Error Handling

### Common Error Responses

| Status | Error Type        | Description                                    |
| ------ | ----------------- | ---------------------------------------------- |
| 400    | ValidationError   | Invalid input data                             |
| 401    | UnauthorizedError | Missing or invalid authentication              |
| 403    | ForbiddenError    | CSRF token mismatch                            |
| 404    | NotFoundError     | {Entity} not found                             |
| 409    | ConflictError     | Business rule violation (e.g., duplicate name) |
| 500    | InternalError     | Server error                                   |

### Example Error Response

\`\`\`json
{
"name": "ValidationError",
"message": "Validation failed: field 'name' must be between 2 and 100 characters"
}
\`\`\`

## 🔄 Migration History

### Migration: [Migration Number] - Create {Entity} Table

- **Date**: [Migration Date]
- **File**: `src/external/drizzle/migrations/[number]_[description].sql`
- **Changes**: Created {table_name} table with all fields, indexes, and constraints

## 👥 Contributing

When modifying this module:

1. **Update Business Rules**: Document any new business rules
2. **Update API Documentation**: Keep endpoint documentation current
3. **Update Tests**: Add test cases for new functionality
4. **Update Migration**: Create new migration for schema changes
5. **Version Increment**: Update module version in this README

---

**Module Version**: 1.0  
**Last Updated**: [Date]  
**Maintainer**: Development Team
\`\`\`

### Version Update

Update the document version in AI-SPEC.md:

```markdown
**Document Version**: 2.1 (or next increment)
**Last Updated**: [Current Date]
```
````

## 📝 Naming Conventions

### File Naming (Current Project Pattern)

- **Entities**: `{entity-name}.entity.ts` (kebab-case)
- **Repositories**: `{entity-name}.repository.ts` (kebab-case)
- **Use Cases**: `{action}-{entity-name}.usecase.ts` (kebab-case)
- **Controllers**: `{action}-{entity-name}.controller.ts` (kebab-case)
- **DTOs**: `{entity-name}.dto.ts` (kebab-case)
- **Drizzle Repos**: `{entity-name}.drizzle.repository.ts` (kebab-case)
- **Schemas**: `{entity-name}.schema.ts` (kebab-case)

### Directory Naming

- **Domains**: `{domain-name}/` (plural, kebab-case)
- **Database Tables**: `{table_name}` (plural, snake_case)
- **API Endpoints**: `/{entities}` (plural, kebab-case)

### TypeScript Naming

- **Interfaces**: `I{Entity}` (PascalCase with I prefix)
- **Types**: `{Entity}Id`, `{Entity}Name` (PascalCase)
- **Classes**: `{Entity}DrizzleRepository` (PascalCase)
- **Use Cases**: `Create{Entity}UseCase` (PascalCase)

## 🎯 Best Practices

### 1. **Follow Existing Patterns**

- **Study Reference Implementation**: Always examine `posts` domain as reference
- **Consistent Naming**: Follow existing kebab-case file naming
- **Same File Structure**: Maintain identical directory organization
- **Import Patterns**: Use same import structure and organization

### 2. **Security First**

- **Authentication Strategy**: Decide early if endpoints are public or protected
- **JWT + CSRF**: For protected endpoints, always require both tokens
- **Input Validation**: Comprehensive TypeBox validation on all inputs
- **Business Rules**: Validate business logic in use cases, not controllers

### 3. **Database Best Practices**

- **UUID Primary Keys**: Always use `uuid().primaryKey().defaultRandom()`
- **Proper Indexing**: Add indexes for search, filter, and sort columns
- **Foreign Keys**: Use proper relationships with cascade rules
- **Timestamps**: Always include `createdAt` and `updatedAt`

### 4. **Error Handling**

- **Use Error Classes**: Use existing `ConflictError`, `ValidationError`, `NotFoundError`
- **Structured Logging**: Log errors with context using injected logger
- **Meaningful Messages**: Provide clear, actionable error messages
- **HTTP Status Codes**: Use proper status codes (400, 404, 409, 500)

### 5. **Performance Considerations**

- **Pagination**: Always implement pagination for list endpoints
- **Query Optimization**: Use proper indexes and efficient queries
- **Search Implementation**: Use `like` queries with proper indexes
- **Limit Results**: Set reasonable default and maximum limits

### 6. **Testing & Validation**

- **Comprehensive HTTP Tests**: Test all CRUD operations thoroughly
- **Error Scenarios**: Test validation failures, auth failures, not found cases
- **Authentication Tests**: Verify auth requirements work correctly
- **Business Rule Tests**: Test unique constraints and validation rules

### 7. **Documentation Maintenance**

- **Always Update Docs**: Never skip documentation updates
- **Version Increment**: Update AI-SPEC version after changes
- **API Examples**: Provide working curl examples in README
- **Schema Documentation**: Keep database schema docs current

### 8. **Code Quality**

- **TypeScript Strict**: Use branded types and proper interfaces
- **Dependency Injection**: Follow existing DI patterns with tokens
- **Builder Pattern**: Use `StrictBuilder` for complex object creation
- **Single Responsibility**: Each class/function has one clear purpose

## ⚠️ Common Pitfalls to Avoid

### ❌ **Don't Do These**

1. **Skip Migration**: Never generate CRUD without database migration first
2. **Inconsistent Naming**: Don't deviate from existing naming conventions
3. **Missing Auth**: Don't forget authentication for protected endpoints
4. **Skip Documentation**: Never skip README and AI-SPEC updates
5. **Hard-code Values**: Don't use magic numbers or hard-coded UUIDs
6. **Ignore Validation**: Don't skip input validation or business rules
7. **Poor Error Handling**: Don't return generic or unclear error messages

### ✅ **Always Do These**

1. **Follow Migration Spec**: Use ai-spec-migrate.md for database changes
2. **Study Existing Code**: Examine posts domain before starting
3. **Test Thoroughly**: Use HTTP files to test all scenarios
4. **Update Documentation**: README and AI-SPEC updates are mandatory
5. **Use Proper Types**: Branded types, interfaces, and proper TypeScript
6. **Log Appropriately**: Use injected logger for debugging and monitoring
7. **Handle Edge Cases**: Consider validation, not found, and error scenarios

## 📚 Quick Reference Links

### Essential Reading Before CRUD Generation

- **[AI-SPEC.md](AI-SPEC.md)** - Overall project architecture
- **[ai-spec-migrate.md](ai-spec-migrate.md)** - Database migration guide
- **Posts Domain** - `src/core/domain/posts/`, `src/adapters/posts/`, `src/external/drizzle/posts/`

### Key Files to Study

- **Entity Pattern**: `src/core/domain/posts/entity/post.entity.ts`
- **Repository Pattern**: `src/core/domain/posts/service/post.repository.ts`
- **Use Case Pattern**: `src/core/domain/posts/use-case/create-post.usecase.ts`
- **Controller Pattern**: `src/adapters/posts/create-post.controller.ts`
- **DTO Pattern**: `src/adapters/posts/dtos/post.dto.ts`
- **Schema Pattern**: `src/external/drizzle/posts/post.schema.ts`
- **Repository Implementation**: `src/external/drizzle/posts/post.drizzle.repository.ts`

### Configuration Files

- **Container**: `src/core/shared/container.ts`
- **Tokens**: `src/core/shared/tokens.ts`
- **Routes**: `src/external/api/routes.ts`
- **Main Schema**: `src/external/drizzle/schema.ts`

---

#### This specification ensures consistent, secure, and maintainable CRUD operations following Clean Architecture principles with JWT authentication and comprehensive observability! 🚀

**Version**: 2.0  
**Compatible with**: Elysia Clean Architecture Backend with JWT Authentication  
**Last Updated**: December 2024
