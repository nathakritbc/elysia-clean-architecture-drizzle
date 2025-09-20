# AI CRUD Generation Usage Guide

## 🎯 How to Use the AI CRUD Specification

This guide explains how to use the AI CRUD specification to generate new CRUD operations for your Clean Architecture backend.

## 📋 Step-by-Step Process

### Step 1: Define Your Entity

Before generating CRUD operations, clearly define your entity:

```typescript
// Example: Product Entity
interface ProductEntity {
  // Primary Key
  id: number; // Auto-increment, primary key

  // Required Fields
  name: string; // Required, 2-100 characters, unique
  price: number; // Required, positive number
  category_id: number; // Required, foreign key to categories

  // Optional Fields
  description?: string; // Optional, max 500 characters
  sku?: string; // Optional, unique identifier

  // Timestamps
  created_at: Date; // Auto-generated
  updated_at: Date; // Auto-updated
}
```

### Step 2: Define Business Rules

Specify the business rules for your entity:

```typescript
// Business Rules for Product
const businessRules = {
  // Uniqueness constraints
  uniqueFields: ['name', 'sku'],

  // Validation rules
  validations: {
    name: { minLength: 2, maxLength: 100, required: true },
    price: { min: 0, required: true },
    description: { maxLength: 500, required: false },
    sku: { pattern: /^[A-Z0-9-]+$/, required: false },
    category_id: { required: true, foreignKey: 'categories.id' },
  },

  // Business logic
  rules: [
    'Product name must be unique',
    'Price must be positive',
    'SKU must be unique if provided',
    'Category must exist',
  ],
};
```

### Step 3: Specify CRUD Operations

Define which CRUD operations you need:

```typescript
// CRUD Operations
const operations = {
  create: true, // POST /products
  read: true, // GET /products, GET /products/:id
  update: true, // PUT /products/:id
  delete: true, // DELETE /products/:id

  // Additional operations
  search: false, // GET /products/search?q=...
  filter: false, // GET /products?category=...
  paginate: false, // GET /products?page=1&limit=10
};
```

## 🤖 AI Prompt Template

Use this template when asking AI to generate CRUD operations:

```
Please generate CRUD operations for the following entity using the AI-CRUD-SPEC.md specification:

**Entity Name**: Product

**Fields**:
- id: number (auto-increment, primary key)
- name: string (required, 2-100 chars, unique)
- price: number (required, positive)
- category_id: number (required, foreign key)
- description?: string (optional, max 500 chars)
- sku?: string (optional, unique, pattern: /^[A-Z0-9-]+$/)
- created_at: Date (auto-generated)
- updated_at: Date (auto-updated)

**Business Rules**:
- Product name must be unique
- Price must be positive
- SKU must be unique if provided
- Category must exist

**CRUD Operations**: Full CRUD (Create, Read, Update, Delete)

**Validation Rules**:
- name: minLength: 2, maxLength: 100, required: true
- price: min: 0, required: true
- description: maxLength: 500, required: false
- sku: pattern: /^[A-Z0-9-]+$/, required: false
- category_id: required: true

Please generate all necessary files following the Clean Architecture pattern.
```

## 📁 Generated File Structure

After running the AI generation, you should get these files:

```
src/
├── core/
│   ├── domain/
│   │   └── product/                    # New domain module
│   │       ├── entity/
│   │       │   └── Product.ts          # Product entity
│   │       ├── service/
│   │       │   ├── CollectionProduct.ts      # Interface
│   │       │   └── BaseCollectionProduct.ts  # Abstract class
│   │       └── use-case/
│   │           ├── CreateProductUseCase.ts
│   │           ├── FindProductByIdUseCase.ts
│   │           ├── FindProductsUseCase.ts
│   │           ├── UpdateProductUseCase.ts
│   │           └── DeleteProductUseCase.ts
│   └── shared/
│       ├── dtos/
│       │   └── ProductDTOs.ts          # Product DTOs
│       ├── container.ts                # Updated with new registrations
│       └── tokens.ts                   # Updated with new tokens
├── adapters/                           # New controllers
│   ├── CreateProductController.ts
│   ├── FindProductByIdController.ts
│   ├── FindProductsController.ts
│   ├── UpdateProductController.ts
│   └── DeleteProductController.ts
└── external/
    ├── drizzle/
    │   ├── schema.ts                   # Updated with Product table
    │   └── CollectionProductDrizzle.ts # Product repository
    └── api/
        └── routes.ts                   # Updated with new routes

tests/
└── http/
    └── products.http                   # Product API tests
```

## 🔧 Post-Generation Steps

### 1. Update Database Schema

```bash
# Generate migration
bun run db:generate

# Apply migration
bun run db:migrate
```

### 2. Test the Generated Code

```bash
# Start server
bun run dev

# Test endpoints using the generated HTTP files
# Open tests/http/products.http in VS Code
```

### 3. Verify All Files

Check that all generated files:

- ✅ Follow naming conventions
- ✅ Have proper imports
- ✅ Include error handling
- ✅ Have comprehensive DTOs
- ✅ Include proper validation

## 🎯 Example Usage Scenarios

### Scenario 1: Simple Entity

```typescript
// Entity: Category
// Fields: id, name, description
// Rules: name unique, description optional
// Operations: Full CRUD

// AI Prompt:
'Generate CRUD for Category entity with fields: id (number, primary key), name (string, required, unique), description (string, optional). Full CRUD operations needed.';
```

### Scenario 2: Complex Entity with Relationships

```typescript
// Entity: Order
// Fields: id, user_id, total, status, items
// Rules: user must exist, total positive, status enum
// Operations: Create, Read, Update (no delete)

// AI Prompt:
'Generate CRUD for Order entity with fields: id (number, primary key), user_id (number, foreign key), total (number, positive), status (enum: pending, completed, cancelled), items (array). Operations: Create, Read, Update only.';
```

### Scenario 3: Entity with Custom Validation

```typescript
// Entity: User
// Fields: id, email, password, role
// Rules: email unique, password hashed, role enum
// Operations: Full CRUD

// AI Prompt:
'Generate CRUD for User entity with fields: id (number, primary key), email (string, required, unique, email format), password (string, required, min 8 chars), role (enum: admin, user). Full CRUD operations needed.';
```

## 🚀 Advanced Features

### Custom Business Logic

```typescript
// Add custom business logic to use cases
export class CreateProductUseCase {
  async execute(input: Input): Promise<void> {
    // Custom validation
    if (input.price < 0) {
      throw new Error('Price cannot be negative');
    }

    // Custom business rule
    if (input.category_id === 1 && input.price > 1000) {
      throw new Error('Premium products cannot exceed $1000');
    }

    // Continue with standard flow...
  }
}
```

### Custom DTOs

```typescript
// Add custom DTOs for specific operations
export const ProductSearchRequestDTO = t.Object({
  query: t.String({ minLength: 1 }),
  category_id: t.Optional(t.Number()),
  min_price: t.Optional(t.Number({ minimum: 0 })),
  max_price: t.Optional(t.Number({ minimum: 0 })),
});
```

### Custom Controllers

```typescript
// Add custom endpoints
export class SearchProductsController {
  register(server: Elysia) {
    server.get(
      '/products/search',
      async ({ query }) => {
        // Custom search logic
      },
      {
        query: ProductSearchRequestDTO,
        response: { 200: ProductsResponseDTO },
      }
    );
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Missing Dependencies**

   ```bash
   # Check if all imports are correct
   # Verify container registrations
   # Ensure tokens are defined
   ```

2. **Validation Errors**

   ```bash
   # Check DTO definitions
   # Verify field types and constraints
   # Test with HTTP files
   ```

3. **Database Errors**
   ```bash
   # Generate and apply migrations
   # Check schema definitions
   # Verify foreign key constraints
   ```

### Debug Steps

1. **Check Generated Files**

   ```bash
   # Verify all files were created
   # Check file contents
   # Validate imports and exports
   ```

2. **Test API Endpoints**

   ```bash
   # Use generated HTTP test files
   # Check server logs
   # Verify response formats
   ```

3. **Validate Business Logic**
   ```bash
   # Test use cases directly
   # Verify error handling
   # Check business rules
   ```

## 📚 Best Practices

### 1. **Entity Design**

- Keep entities focused and cohesive
- Use clear, descriptive field names
- Include proper validation rules
- Consider relationships early

### 2. **Business Rules**

- Document all business rules clearly
- Include validation in use cases
- Handle edge cases properly
- Provide meaningful error messages

### 3. **API Design**

- Follow RESTful conventions
- Use consistent response formats
- Include proper HTTP status codes
- Document all endpoints

### 4. **Testing**

- Create comprehensive test files
- Test both success and error scenarios
- Include edge cases and boundary values
- Validate all business rules

---

**Follow this guide to generate consistent, maintainable CRUD operations! 🚀**
