# AI Migration Specification

## Overview

This document provides comprehensive specifications for AI assistants to generate and manage database migrations following the project's migration patterns and best practices.

## 📚 Prerequisites

Before generating migrations, ensure you understand:

1. **Project Context**: Review [AI-SPEC.md](AI-SPEC.md) for overall architecture
2. **CRUD Context**: If creating CRUD, review [ai-spec-crud.md](ai-spec-crud.md)
3. **Current Database**: Understand existing schema and relationships
4. **Migration History**: Check existing migrations in `src/external/drizzle/migrations/`

## 🗃️ Database Migration System

### Current Setup

- **Tool**: Drizzle Kit for schema management
- **Database**: PostgreSQL with UUID primary keys
- **Migration Location**: `src/external/drizzle/migrations/`
- **Schema Location**: `src/external/drizzle/schema.ts` + domain-specific schemas

### Migration Commands

```bash
# Generate new migration
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Push schema directly (development only)
bun run db:push
```

## 🔄 Migration Generation Process

### Step 1: Schema Planning

Before generating any migration, plan the database changes:

#### For New CRUD Domain

```yaml
migration_type: 'new_domain'
domain_name: 'products'
table_name: 'products'
fields:
  - name: 'id'
    type: 'UUID'
    constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()']
  - name: 'name'
    type: 'VARCHAR(100)'
    constraints: ['NOT NULL', 'UNIQUE']
  - name: 'description'
    type: 'TEXT'
    constraints: []
  - name: 'price'
    type: 'INTEGER'
    constraints: ['NOT NULL']
  - name: 'category_id'
    type: 'UUID'
    constraints: ['NOT NULL']
  - name: 'status'
    type: 'VARCHAR(20)'
    constraints: ['NOT NULL', "DEFAULT 'active'"]
  - name: 'created_at'
    type: 'TIMESTAMP'
    constraints: ['NOT NULL', 'DEFAULT NOW()']
  - name: 'updated_at'
    type: 'TIMESTAMP'
    constraints: ['NOT NULL', 'DEFAULT NOW()']

indexes:
  - fields: ['name']
    type: 'unique'
  - fields: ['category_id']
    type: 'index'
  - fields: ['status']
    type: 'index'
  - fields: ['created_at']
    type: 'index'

foreign_keys:
  - field: 'category_id'
    references: 'categories(id)'
    on_delete: 'CASCADE'
```

#### For Schema Modifications

```yaml
migration_type: 'modify_existing'
table_name: 'products'
changes:
  add_columns:
    - name: 'brand_id'
      type: 'UUID'
      constraints: ['NULL']
  modify_columns:
    - name: 'description'
      old_type: 'VARCHAR(500)'
      new_type: 'TEXT'
  drop_columns:
    - 'old_field'
  add_indexes:
    - fields: ['brand_id']
      type: 'index'
```

### Step 2: Update Domain Schema File

First, update the domain-specific schema file:

```typescript
// Example: src/external/drizzle/products/product.schema.ts
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    price: integer('price').notNull(),
    categoryId: uuid('category_id').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => {
    return {
      nameIdx: uniqueIndex('products_name_idx').on(table.name),
      categoryIdx: index('products_category_idx').on(table.categoryId),
      statusIdx: index('products_status_idx').on(table.status),
      createdAtIdx: index('products_created_at_idx').on(table.createdAt),
    };
  }
);

export type DrizzleProduct = typeof products.$inferSelect;
export type NewDrizzleProduct = typeof products.$inferInsert;
```

### Step 3: Update Main Schema Export

Update the main schema file to export the new table:

```typescript
// src/external/drizzle/schema.ts
// Add new export
export { products } from './products/product.schema';
```

### Step 4: Generate Migration

Run the migration generation command:

```bash
bun run db:generate
```

This will create a new migration file like:
`src/external/drizzle/migrations/0007_friendly_wolverine.sql`

### Step 5: Review Generated Migration

Always review the generated migration file:

```sql
-- Example generated migration
CREATE TABLE IF NOT EXISTS "products" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "name" varchar(100) NOT NULL,
 "description" text,
 "price" integer NOT NULL,
 "category_id" uuid NOT NULL,
 "status" varchar(20) DEFAULT 'active' NOT NULL,
 "created_at" timestamp DEFAULT now() NOT NULL,
 "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_name_idx" ON "products" ("name");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category_id");
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" ("status");
CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "products" ("created_at");

-- Foreign key constraints (if applicable)
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk"
FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;
```

### Step 6: Apply Migration

Apply the migration to your database:

```bash
# For development
bun run db:migrate

# Or for direct push (development only)
bun run db:push
```

## 🛠️ Migration Best Practices

### 1. **Schema Design**

- Always use UUID primary keys: `uuid('id').primaryKey().defaultRandom()`
- Include created_at and updated_at timestamps
- Use appropriate data types for your use case
- Add proper indexes for query performance

### 2. **Naming Conventions**

- **Tables**: plural, snake_case (e.g., `user_profiles`, `product_categories`)
- **Columns**: snake_case (e.g., `created_at`, `category_id`)
- **Indexes**: `{table}_{column}_idx` (e.g., `products_name_idx`)
- **Foreign Keys**: `{table}_{column}_{ref_table}_{ref_column}_fk`

### 3. **Index Strategy**

- Unique indexes for unique constraints
- Regular indexes for:
  - Foreign key columns
  - Frequently searched columns
  - Sorting columns (created_at, updated_at)
  - Status/enum columns

### 4. **Migration Safety**

- **Always review** generated migrations before applying
- **Test migrations** on development database first
- **Backup production** before applying migrations
- **Avoid destructive changes** in production

### 5. **Rollback Strategy**

- Keep track of schema changes
- Test rollback procedures
- Document breaking changes
- Plan for zero-downtime migrations

## 🚨 Common Migration Scenarios

### Adding New CRUD Domain

```typescript
// 1. Create domain schema file
// src/external/drizzle/{domain}/{entity}.schema.ts

// 2. Add to main schema exports
// src/external/drizzle/schema.ts

// 3. Generate migration
// bun run db:generate

// 4. Review and apply
// bun run db:migrate
```

### Adding Column to Existing Table

```typescript
// 1. Update domain schema file
export const products = pgTable('products', {
  // ... existing fields
  brandId: uuid('brand_id'), // New optional field
  // ... rest of fields
});

// 2. Generate migration
// bun run db:generate
```

### Adding Foreign Key Relationship

```typescript
// 1. Ensure referenced table exists
// 2. Add foreign key column
categoryId: uuid('category_id').notNull(),

// 3. Add foreign key constraint in table config
}, (table) => {
  return {
    // ... existing indexes
    categoryFk: foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
    }),
  };
});
```

### Modifying Existing Column

```typescript
// 1. Update schema with new definition
description: text('description'), // Changed from varchar(500) to text

// 2. Generate migration
// bun run db:generate

// 3. Review SQL - ensure no data loss
```

## 📋 Migration Checklist

### Before Migration Generation

- [ ] Plan schema changes thoroughly
- [ ] Check for conflicts with existing schema
- [ ] Ensure proper relationships and constraints
- [ ] Plan for indexes and performance

### During Migration Generation

- [ ] Update domain schema file
- [ ] Update main schema exports
- [ ] Run `bun run db:generate`
- [ ] Review generated SQL file

### After Migration Generation

- [ ] Test migration on development database
- [ ] Verify schema matches expectations
- [ ] Check all constraints and indexes
- [ ] Test rollback if applicable
- [ ] Apply to target environment: `bun run db:migrate`

### Post Migration

- [ ] Verify schema in database
- [ ] Test related functionality
- [ ] Update documentation if needed
- [ ] Create migration README (if standalone migration)
- [ ] Commit migration files to version control

### Create Migration Documentation (for standalone migrations)

If this migration is **not part of CRUD generation**, create a migration record:

Create `docs/migrations/migration-{number}-{description}.md`:

```markdown
# Migration {Number}: {Description}

## Overview

**Migration File**: `{number}_{description}.sql`  
**Applied**: [Date]  
**Type**: [Schema Change/New Table/Alter Table/Index Creation]  
**Impact**: [Low/Medium/High]

## Changes Made

### Tables Affected

- `{table_name}` - [Description of changes]

### Schema Changes

1. **Added Columns**:
   - `column_name` - {type} - {description}

2. **Modified Columns**:
   - `column_name` - Changed from {old_type} to {new_type}

3. **Indexes Added**:
   - `index_name` on `table_name(columns)` - {purpose}

4. **Foreign Keys**:
   - Added FK `{constraint_name}` - {description}

### SQL Changes

\`\`\`sql
-- Copy the actual SQL from migration file
[SQL CONTENT]
\`\`\`

## Rollback Plan

If rollback is needed:

\`\`\`sql
-- Rollback SQL commands
[ROLLBACK SQL]
\`\`\`

## Testing Performed

- [ ] Migration applied successfully in development
- [ ] No data loss occurred
- [ ] Application starts without errors
- [ ] Related functionality tested
- [ ] Performance impact assessed

## Related Changes

- **Code Changes**: [List any related code changes]
- **Documentation**: [List documentation updates needed]
- **Dependencies**: [List any dependency changes]

---

**Migration Author**: [Name]  
**Reviewed By**: [Name]  
**Applied Date**: [Date]
\`\`\`

## 🔗 Integration with CRUD Generation

When generating CRUD operations, the migration should be created **first**:

1. **Plan CRUD Entity**: Define fields, relationships, constraints
2. **Generate Migration**: Create database schema
3. **Apply Migration**: Update database structure
4. **Generate CRUD Code**: Create domain, adapters, and controllers
5. **Test Integration**: Verify CRUD operations work with schema

## 📖 References

- **Drizzle Kit Documentation**: [https://orm.drizzle.team/kit-docs/overview](https://orm.drizzle.team/kit-docs/overview)
- **PostgreSQL Data Types**: [https://www.postgresql.org/docs/current/datatype.html](https://www.postgresql.org/docs/current/datatype.html)
- **Project Migration Examples**: Check `src/external/drizzle/migrations/` for existing patterns

---

### Follow this specification for consistent, safe, and maintainable database migrations! 🚀
```
