# AI CRUD Generation - Quick Reference

## 🚀 Quick Start for AI Assistants

### 1. **Input Requirements**
Ask the user for:
- Entity name (e.g., "Product", "Order", "Category")
- Entity fields with types and validation rules
- Business rules and constraints
- Required CRUD operations (Create, Read, Update, Delete)

### 2. **File Generation Order**
Generate files in this sequence:
1. **Domain Layer**: Entity → Service Interface → Base Service → Use Cases
2. **Infrastructure Layer**: Drizzle Schema → Repository Implementation
3. **Application Layer**: DTOs → Controllers
4. **Configuration**: Container → Tokens → Routes
5. **Tests**: HTTP test files

### 3. **Naming Conventions**
```typescript
// Entity: Product
// Files: Product.ts, CollectionProduct.ts, CreateProductUseCase.ts
// Variables: product, products
// Endpoints: /products, /products/:id
// Database: products table
```

## 📋 Template Variables

Replace these placeholders in all generated files:

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `{Entity}` | `Product` | PascalCase entity name |
| `{entity}` | `product` | camelCase entity name |
| `{entities}` | `products` | camelCase plural |
| `{ENTITY}` | `PRODUCT` | UPPER_CASE entity name |

## 🎯 Essential Files to Generate

### Domain Layer
```
src/core/domain/{entity}/
├── entity/{Entity}.ts
├── service/Collection{Entity}.ts
├── service/BaseCollection{Entity}.ts
└── use-case/
    ├── Create{Entity}UseCase.ts
    ├── Find{Entity}ByIdUseCase.ts
    ├── Find{Entity}sUseCase.ts
    ├── Update{Entity}UseCase.ts
    └── Delete{Entity}UseCase.ts
```

### Infrastructure Layer
```
src/external/drizzle/
├── schema.ts (add {Entity} table)
└── Collection{Entity}Drizzle.ts
```

### Application Layer
```
src/adapters/
├── Create{Entity}Controller.ts
├── Find{Entity}ByIdController.ts
├── Find{Entity}sController.ts
├── Update{Entity}Controller.ts
└── Delete{Entity}Controller.ts

src/core/shared/dtos/
└── {Entity}DTOs.ts
```

### Configuration
```
src/core/shared/
├── container.ts (add registrations)
└── tokens.ts (add tokens)

src/external/api/
└── routes.ts (add route registrations)
```

### Tests
```
tests/http/
└── {entities}.http
```

## 🔧 Key Patterns

### Entity Pattern
```typescript
export class {Entity} extends Entity {
  // Fields with proper types
  constructor(id, field1, field2, created_at, updated_at) {
    super();
    // Initialize all fields
  }
}
```

### Service Pattern
```typescript
export abstract class BaseCollection{Entity} {
  abstract getById(id: number): Promise<{Entity} | null>;
  abstract find(): Promise<{Entity}[]>;
  abstract create({entity}: {Entity}): Promise<{Entity}>;
  abstract update(id: number, {entity}: Partial<{Entity}>): Promise<{Entity} | null>;
  abstract delete(id: number): Promise<boolean>;
}
```

### Use Case Pattern
```typescript
@injectable()
export class Create{Entity}UseCase implements IUseCase<Input, void> {
  constructor(
    @inject(TOKENS.ICollection{Entity}) 
    private readonly collection: BaseCollection{Entity}
  ) {}
  
  async execute(input: Input): Promise<void> {
    // Business logic and validation
  }
}
```

### Controller Pattern
```typescript
@injectable()
export class Create{Entity}Controller {
  constructor(
    @inject(Create{Entity}UseCase) 
    private readonly useCase: Create{Entity}UseCase
  ) {}
  
  register(server: Elysia) {
    server.post("/{entities}", handler, {
      body: Create{Entity}RequestDTO,
      response: { 200: {Entity}ResponseDTO, 400: ErrorResponseDTO },
    });
  }
}
```

### DTO Pattern
```typescript
export const Create{Entity}RequestDTO = t.Object({
  field1: t.String({ minLength: 2, maxLength: 100 }),
  field2: t.Number({ minimum: 0 }),
  field3: t.Optional(t.String()),
});
```

## 🎯 Common Field Types

### String Fields
```typescript
// Required string
name: t.String({ minLength: 2, maxLength: 100 })

// Optional string
description: t.Optional(t.String({ maxLength: 500 }))

// Email validation
email: t.String({ format: "email" })

// Unique string
sku: t.String({ pattern: /^[A-Z0-9-]+$/ })
```

### Number Fields
```typescript
// Required number
price: t.Number({ minimum: 0 })

// Optional number
quantity: t.Optional(t.Number({ minimum: 0 }))

// Integer
category_id: t.Number()
```

### Date Fields
```typescript
// Auto-generated dates
created_at: t.Optional(t.Date())
updated_at: t.Optional(t.Date())
```

## 🔄 Database Schema Patterns

### Basic Table
```typescript
export const {entities} = pgTable("{entities}", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
```

### Foreign Key
```typescript
category_id: integer("category_id").notNull().references(() => categories.id),
```

### Unique Constraint
```typescript
name: varchar("name", { length: 100 }).notNull().unique(),
```

## 🧪 Test Patterns

### HTTP Test Structure
```http
### Variables
@baseUrl = http://localhost:3000
@contentType = application/json

### Create {Entity} - Valid
POST {{baseUrl}}/{entities}
Content-Type: {{contentType}}

{
  "field1": "value1",
  "field2": 123
}

### Create {Entity} - Invalid
POST {{baseUrl}}/{entities}
Content-Type: {{contentType}}

{
  "field1": "a",
  "field2": -1
}

### Get All {Entity}s
GET {{baseUrl}}/{entities}

### Get {Entity} by ID
GET {{baseUrl}}/{entities}/1

### Update {Entity}
PUT {{baseUrl}}/{entities}/1
Content-Type: {{contentType}}

{
  "field1": "updated value"
}

### Delete {Entity}
DELETE {{baseUrl}}/{entities}/1
```

## ⚡ Quick Checklist

Before finishing, ensure:
- ✅ All files follow naming conventions
- ✅ Dependencies are properly injected
- ✅ DTOs include proper validation
- ✅ Controllers handle errors correctly
- ✅ Use cases include business logic
- ✅ Repository implements all methods
- ✅ Container registrations are added
- ✅ Tokens are defined
- ✅ Routes are registered
- ✅ HTTP tests are comprehensive
- ✅ All imports are correct
- ✅ TypeScript types are proper

## 🎯 Example Prompt

```
Generate CRUD operations for Product entity:

Fields:
- id: number (primary key, auto-increment)
- name: string (required, 2-100 chars, unique)
- price: number (required, positive)
- category_id: number (required, foreign key)
- description?: string (optional, max 500 chars)
- created_at: Date (auto-generated)
- updated_at: Date (auto-updated)

Business Rules:
- Product name must be unique
- Price must be positive
- Category must exist

Operations: Full CRUD (Create, Read, Update, Delete)

Please generate all necessary files following the Clean Architecture pattern.
```

---

**Use this reference to generate consistent, high-quality CRUD operations! 🚀**
