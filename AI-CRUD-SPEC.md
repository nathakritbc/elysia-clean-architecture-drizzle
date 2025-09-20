# AI CRUD Generation Specification

## Overview

This document provides specifications for AI assistants to generate CRUD (Create, Read, Update, Delete) operations following the Clean Architecture pattern used in this project.

## 🏗️ Architecture Pattern

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    External Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web API   │  │  Database   │  │   Memory    │        │
│  │  (Elysia)   │  │ (Drizzle)   │  │ (Testing)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Interface Adapters                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Controllers │  │ Presenters  │  │ Gateways    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Use Cases   │  │ Services    │  │ Interfaces  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Entities   │  │  Services   │  │  Business   │        │
│  │             │  │             │  │   Rules     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 📋 CRUD Generation Template

### Input Parameters

When generating CRUD operations, the AI should request:

1. **Entity Name** (e.g., "Product", "Order", "Category")
2. **Entity Fields** with types and validation rules
3. **Business Rules** (unique constraints, relationships)
4. **API Endpoints** needed (full CRUD or partial)

### Example Input

```typescript
// Entity: Product
// Fields:
// - id: number (auto-increment, primary key)
// - name: string (required, 2-100 chars)
// - description: string (optional, max 500 chars)
// - price: number (required, positive)
// - category_id: number (required, foreign key)
// - created_at: Date (auto-generated)
// - updated_at: Date (auto-updated)

// Business Rules:
// - Product name must be unique
// - Price must be positive
// - Category must exist

// Endpoints: Full CRUD (Create, Read, Update, Delete)
```

## 🎯 Generated File Structure

### 1. Domain Layer Files

#### Entity (`src/core/domain/{entity}/entity/{Entity}.ts`)

```typescript
import { Entity } from "../../../shared/Entity";

export class {Entity} extends Entity {
  name: string;
  description?: string;
  price: number;
  category_id: number;

  constructor(
    id: number,
    name: string,
    description: string | undefined,
    price: number,
    category_id: number,
    created_at: Date,
    updated_at: Date
  ) {
    super();
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.category_id = category_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
```

#### Service Interface (`src/core/domain/{entity}/service/Collection{Entity}.ts`)

```typescript
import { {Entity} } from "../entity/{Entity}";

export interface ICollection{Entity} {
  getById(id: number): Promise<{Entity} | null>;
  find(): Promise<{Entity}[]>;
  getByName(name: string): Promise<{Entity} | null>;
  create({entity}: {Entity}): Promise<{Entity}>;
  update(id: number, {entity}: Partial<{Entity}>): Promise<{Entity} | null>;
  delete(id: number): Promise<boolean>;
}
```

#### Base Service (`src/core/domain/{entity}/service/BaseCollection{Entity}.ts`)

```typescript
import { {Entity} } from "../entity/{Entity}";

export abstract class BaseCollection{Entity} {
  abstract getById(id: number): Promise<{Entity} | null>;
  abstract find(): Promise<{Entity}[]>;
  abstract getByName(name: string): Promise<{Entity} | null>;
  abstract create({entity}: {Entity}): Promise<{Entity}>;
  abstract update(id: number, {entity}: Partial<{Entity}>): Promise<{Entity} | null>;
  abstract delete(id: number): Promise<boolean>;
}
```

#### Use Cases

```typescript
// Create{Entity}UseCase.ts
import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../../shared/UseCase";
import { BaseCollection{Entity} } from "../service/BaseCollection{Entity}";
import { {Entity} } from "../entity/{Entity}";
import { TOKENS } from "../../../shared/tokens";

type Input = {
  name: string;
  description?: string;
  price: number;
  category_id: number;
};

@injectable()
export class Create{Entity}UseCase implements IUseCase<Input, void> {
  constructor(
    @inject(TOKENS.ICollection{Entity})
    private readonly collection: BaseCollection{Entity}
  ) {}

  async execute(input: Input): Promise<void> {
    const { name, description, price, category_id } = input;

    // Business rule: Check if name already exists
    const existing{Entity} = await this.collection.getByName(name);
    if (existing{Entity}) {
      throw new Error("{Entity} name already exists");
    }

    // Business rule: Validate price
    if (price <= 0) {
      throw new Error("Price must be positive");
    }

    const {entity} = new {Entity}(
      0, // id will be set by database
      name,
      description,
      price,
      category_id,
      new Date(),
      new Date()
    );

    await this.collection.create({entity});
  }
}

// Find{Entity}ByIdUseCase.ts
// Find{Entity}sUseCase.ts
// Update{Entity}UseCase.ts
// Delete{Entity}UseCase.ts
```

### 2. Infrastructure Layer Files

#### Drizzle Schema (`src/external/drizzle/schema.ts`)

```typescript
// Add to existing schema.ts
export const {entities} = pgTable("{entities}", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category_id: integer("category_id").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type {Entity} = typeof {entities}.$inferSelect;
export type New{Entity} = typeof {entities}.$inferInsert;
```

#### Repository Implementation (`src/external/drizzle/Collection{Entity}Drizzle.ts`)

```typescript
import { eq } from "drizzle-orm";
import { injectable } from "tsyringe";
import { db } from "./connection";
import { {entities}, type {Entity} as Drizzle{Entity} } from "./schema";
import { {Entity} } from "../../core/domain/{entity}/entity/{Entity}";
import { BaseCollection{Entity} } from "../../core/domain/{entity}/service/BaseCollection{Entity}";

@injectable()
export class Collection{Entity}Drizzle extends BaseCollection{Entity} {
  private mapDrizzle{Entity}ToDomain(drizzle{Entity}: Drizzle{Entity}): {Entity} {
    return new {Entity}(
      drizzle{Entity}.id,
      drizzle{Entity}.name,
      drizzle{Entity}.description,
      parseFloat(drizzle{Entity}.price),
      drizzle{Entity}.category_id,
      drizzle{Entity}.created_at,
      drizzle{Entity}.updated_at
    );
  }

  async getById(id: number): Promise<{Entity} | null> {
    const result = await db
      .select()
      .from({entities})
      .where(eq({entities}.id, id))
      .limit(1);
    return result[0] ? this.mapDrizzle{Entity}ToDomain(result[0]) : null;
  }

  async find(): Promise<{Entity}[]> {
    const result = await db.select().from({entities});
    return result.map({entity} => this.mapDrizzle{Entity}ToDomain({entity}));
  }

  async getByName(name: string): Promise<{Entity} | null> {
    const result = await db
      .select()
      .from({entities})
      .where(eq({entities}.name, name))
      .limit(1);
    return result[0] ? this.mapDrizzle{Entity}ToDomain(result[0]) : null;
  }

  async create({entity}: {Entity}): Promise<{Entity}> {
    const result = await db
      .insert({entities})
      .values({
        name: {entity}.name,
        description: {entity}.description,
        price: {entity}.price.toString(),
        category_id: {entity}.category_id,
      })
      .returning();
    return this.mapDrizzle{Entity}ToDomain(result[0]);
  }

  async update(id: number, {entity}: Partial<{Entity}>): Promise<{Entity} | null> {
    const result = await db
      .update({entities})
      .set({
        name: {entity}.name,
        description: {entity}.description,
        price: {entity}.price?.toString(),
        category_id: {entity}.category_id,
        updated_at: new Date(),
      })
      .where(eq({entities}.id, id))
      .returning();
    return result[0] ? this.mapDrizzle{Entity}ToDomain(result[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete({entities})
      .where(eq({entities}.id, id))
      .returning();
    return result.length > 0;
  }
}
```

### 3. Application Layer Files

#### DTOs (`src/core/shared/dtos/{Entity}DTOs.ts`)

```typescript
import { t } from "elysia";

// Base {Entity} DTO
export const {Entity}DTO = t.Object({
  id: t.Optional(t.Number()),
  name: t.String({ minLength: 2, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  price: t.Number({ minimum: 0 }),
  category_id: t.Number(),
  created_at: t.Optional(t.Date()),
  updated_at: t.Optional(t.Date()),
});

// Create {Entity} Request DTO
export const Create{Entity}RequestDTO = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  price: t.Number({ minimum: 0 }),
  category_id: t.Number(),
});

// Update {Entity} Request DTO
export const Update{Entity}RequestDTO = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  description: t.Optional(t.String({ maxLength: 500 })),
  price: t.Optional(t.Number({ minimum: 0 })),
  category_id: t.Optional(t.Number()),
});

// Response DTOs
export const {Entity}ResponseDTO = t.Object({
  id: t.Optional(t.Number()),
  name: t.String(),
  description: t.Optional(t.String()),
  price: t.Number(),
  category_id: t.Number(),
  created_at: t.Optional(t.Date()),
  updated_at: t.Optional(t.Date()),
});

export const {Entity}sResponseDTO = t.Array({Entity}ResponseDTO);

// Type exports
export type {Entity}DTOType = typeof {Entity}DTO;
export type Create{Entity}RequestDTOType = typeof Create{Entity}RequestDTO;
export type Update{Entity}RequestDTOType = typeof Update{Entity}RequestDTO;
export type {Entity}ResponseDTOType = typeof {Entity}ResponseDTO;
export type {Entity}sResponseDTOType = typeof {Entity}sResponseDTO;
```

#### Controllers

```typescript
// Create{Entity}Controller.ts
import Elysia from "elysia";
import { inject, injectable } from "tsyringe";
import { Create{Entity}UseCase } from "../core/domain/{entity}/use-case/Create{Entity}UseCase";
import {
  Create{Entity}RequestDTO,
  {Entity}ResponseDTO,
  ErrorResponseDTO
} from "../core/shared/dtos/{Entity}DTOs";

@injectable()
export class Create{Entity}Controller {
  constructor(
    @inject(Create{Entity}UseCase) private readonly useCase: Create{Entity}UseCase
  ) {}

  register(server: Elysia) {
    server.post(
      "/{entities}",
      async ({ body, error }) => {
        try {
          const { name, description, price, category_id } = body as {
            name: string;
            description?: string;
            price: number;
            category_id: number;
          };

          await this.useCase.execute({ name, description, price, category_id });

          return {
            status: 200,
            body: {
              mensagem: "{Entity} criado com sucesso",
            },
          };
        } catch (err) {
          return error(400, {
            name: "Error",
            message: err instanceof Error ? err.message : "Unknown error occurred",
          });
        }
      },
      {
        body: Create{Entity}RequestDTO,
        response: {
          200: {Entity}ResponseDTO,
          400: ErrorResponseDTO,
        },
        detail: {
          summary: "Create a new {entity}",
          description: "Creates a new {entity} with the provided information",
          tags: ["{Entity}s"],
        },
      }
    );
  }
}

// Find{Entity}ByIdController.ts
// Find{Entity}sController.ts
// Update{Entity}Controller.ts
// Delete{Entity}Controller.ts
```

### 4. Configuration Files

#### Update Container (`src/core/shared/container.ts`)

```typescript
// Add to existing container.ts
import { Collection{Entity}Drizzle } from "../../external/drizzle/Collection{Entity}Drizzle";
import { BaseCollection{Entity} } from "../domain/{entity}/service/BaseCollection{Entity}";

// Register implementations
container.registerSingleton<BaseCollection{Entity}>(
  TOKENS.ICollection{Entity},
  Collection{Entity}Drizzle
);
```

#### Update Tokens (`src/core/shared/tokens.ts`)

```typescript
// Add to existing tokens.ts
export const TOKENS = {
  ICollectionUser: Symbol("ICollectionUser"),
  ICollection{Entity}: Symbol("ICollection{Entity}"),
} as const;
```

#### Update Routes (`src/external/api/routes.ts`)

```typescript
// Add to existing routes.ts
import { Create{Entity}Controller } from "../../adapters/Create{Entity}Controller";
import { Find{Entity}ByIdController } from "../../adapters/Find{Entity}ByIdController";
import { Find{Entity}sController } from "../../adapters/Find{Entity}sController";
import { Update{Entity}Controller } from "../../adapters/Update{Entity}Controller";
import { Delete{Entity}Controller } from "../../adapters/Delete{Entity}Controller";

// Resolve controllers from DI container and register routes
const create{Entity}Controller = container.resolve(Create{Entity}Controller);
const find{Entity}ByIdController = container.resolve(Find{Entity}ByIdController);
const find{Entity}sController = container.resolve(Find{Entity}sController);
const update{Entity}Controller = container.resolve(Update{Entity}Controller);
const delete{Entity}Controller = container.resolve(Delete{Entity}Controller);

// Register routes
create{Entity}Controller.register(app);
find{Entity}ByIdController.register(app);
find{Entity}sController.register(app);
update{Entity}Controller.register(app);
delete{Entity}Controller.register(app);
```

### 5. Test Files

#### HTTP Tests (`tests/http/{entities}.http`)

```http
### Variables
@baseUrl = http://localhost:3000
@contentType = application/json

### Create {Entity} - Valid Request
POST {{baseUrl}}/{entities}
Content-Type: {{contentType}}

{
  "name": "Sample {Entity}",
  "description": "A sample {entity} for testing",
  "price": 99.99,
  "category_id": 1
}

### Create {Entity} - Invalid Price
POST {{baseUrl}}/{entities}
Content-Type: {{contentType}}

{
  "name": "Invalid {Entity}",
  "description": "A {entity} with invalid price",
  "price": -10,
  "category_id": 1
}

### Get All {Entity}s
GET {{baseUrl}}/{entities}

### Get {Entity} by ID
GET {{baseUrl}}/{entities}/1

### Update {Entity}
PUT {{baseUrl}}/{entities}/1
Content-Type: {{contentType}}

{
  "name": "Updated {Entity}",
  "price": 149.99
}

### Delete {Entity}
DELETE {{baseUrl}}/{entities}/1
```

## 🔄 Generation Process

### Step 1: Input Collection

AI should ask for:

1. Entity name and fields
2. Business rules and constraints
3. Required CRUD operations
4. Validation rules

### Step 2: File Generation

Generate files in this order:

1. Domain layer (Entity, Service, Use Cases)
2. Infrastructure layer (Schema, Repository)
3. Application layer (DTOs, Controllers)
4. Configuration (Container, Tokens, Routes)
5. Tests (HTTP files)

### Step 3: Validation

Ensure:

- All files follow naming conventions
- Dependencies are properly injected
- DTOs include proper validation
- Controllers handle errors correctly
- Tests cover all scenarios

## 📝 Naming Conventions

### File Naming

- **Entities**: `{Entity}.ts` (PascalCase)
- **Services**: `Collection{Entity}.ts` (PascalCase)
- **Use Cases**: `{Action}{Entity}UseCase.ts` (PascalCase)
- **Controllers**: `{Action}{Entity}Controller.ts` (PascalCase)
- **DTOs**: `{Entity}DTOs.ts` (PascalCase)
- **Repositories**: `Collection{Entity}Drizzle.ts` (PascalCase)

### Variable Naming

- **Entity instances**: `{entity}` (camelCase)
- **Entity arrays**: `{entities}` (camelCase)
- **Database tables**: `{entities}` (snake_case)
- **API endpoints**: `/{entities}` (kebab-case)

### Class Naming

- **Entities**: `{Entity}` (PascalCase)
- **Services**: `ICollection{Entity}`, `BaseCollection{Entity}` (PascalCase)
- **Use Cases**: `{Action}{Entity}UseCase` (PascalCase)
- **Controllers**: `{Action}{Entity}Controller` (PascalCase)

## 🎯 Best Practices

### 1. **Consistency**

- Follow existing patterns in the codebase
- Use consistent naming conventions
- Maintain the same file structure

### 2. **Error Handling**

- Include proper error handling in all layers
- Provide meaningful error messages
- Handle validation errors gracefully

### 3. **Validation**

- Include comprehensive DTO validation
- Add business rule validation in use cases
- Test edge cases and error scenarios

### 4. **Testing**

- Create comprehensive HTTP test files
- Include positive and negative test cases
- Test validation and error scenarios

### 5. **Documentation**

- Add proper TypeScript types
- Include OpenAPI documentation in controllers
- Document business rules and constraints

---

**This specification ensures consistent, maintainable CRUD operations following Clean Architecture principles! 🚀**
