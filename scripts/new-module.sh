#!/bin/bash

# New Module Generation Script
# This script initializes a new CRUD module structure following Clean Architecture patterns

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate input parameters
validate_inputs() {
    if [[ -z "$DOMAIN_NAME" ]]; then
        log_error "Domain name is required"
        echo "Usage: $0 <domain-name> <entity-name> [public|protected]"
        echo "Example: $0 products Product protected"
        exit 1
    fi

    if [[ -z "$ENTITY_NAME" ]]; then
        log_error "Entity name is required"
        echo "Usage: $0 <domain-name> <entity-name> [public|protected]"
        echo "Example: $0 products Product protected"
        exit 1
    fi

    # Validate naming conventions
    if [[ ! "$DOMAIN_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
        log_error "Domain name must be lowercase, kebab-case (e.g., 'products', 'order-items')"
        exit 1
    fi

    if [[ ! "$ENTITY_NAME" =~ ^[A-Z][a-zA-Z0-9]*$ ]]; then
        log_error "Entity name must be PascalCase (e.g., 'Product', 'OrderItem')"
        exit 1
    fi

    # Check if module already exists
    if [[ -d "$PROJECT_ROOT/src/core/domain/$DOMAIN_NAME" ]]; then
        log_warning "Module '$DOMAIN_NAME' already exists!"
        read -p "Do you want to continue and potentially overwrite files? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Operation cancelled"
            exit 0
        fi
    fi
}

# Create directory structure
create_directories() {
    log_info "Creating directory structure for '$DOMAIN_NAME' module..."
    
    # Domain directories
    mkdir -p "$PROJECT_ROOT/src/core/domain/$DOMAIN_NAME/entity"
    mkdir -p "$PROJECT_ROOT/src/core/domain/$DOMAIN_NAME/service"
    mkdir -p "$PROJECT_ROOT/src/core/domain/$DOMAIN_NAME/use-case"
    
    # Adapter directories
    mkdir -p "$PROJECT_ROOT/src/adapters/$DOMAIN_NAME/dtos"
    
    # External directories
    mkdir -p "$PROJECT_ROOT/src/external/drizzle/$DOMAIN_NAME"
    
    # Documentation directories
    mkdir -p "$PROJECT_ROOT/docs/modules"
    
    log_success "Directory structure created"
}

# Generate entity interface template
generate_entity() {
    log_info "Generating entity interface..."
    
    local entity_file="$PROJECT_ROOT/src/core/domain/$DOMAIN_NAME/entity/${DOMAIN_NAME%-*}.entity.ts"
    local entity_lower=$(echo "$ENTITY_NAME" | tr '[:upper:]' '[:lower:]')
    local entity_snake=$(echo "$ENTITY_NAME" | sed 's/\([A-Z]\)/_\1/g' | sed 's/^_//' | tr '[:upper:]' '[:lower:]')
    
cat > "$entity_file" << EOF
import type { Branded } from '../../../shared/branded.type';

// Branded Types
export type ${ENTITY_NAME}Id = Branded<string, '${ENTITY_NAME}Id'>;
export type ${ENTITY_NAME}Name = Branded<string, '${ENTITY_NAME}Name'>;
export type ${ENTITY_NAME}Description = Branded<string, '${ENTITY_NAME}Description'>;

// TODO: Add more branded types based on your entity fields
// export type ${ENTITY_NAME}Status = Branded<'active' | 'inactive', '${ENTITY_NAME}Status'>;

// Entity Interface
export interface I${ENTITY_NAME} {
  id: ${ENTITY_NAME}Id;
  name: ${ENTITY_NAME}Name;
  description?: ${ENTITY_NAME}Description;
  // TODO: Add your entity fields here
  // status: ${ENTITY_NAME}Status;
  createdAt: Date;
  updatedAt: Date;
}

// TODO: Add status enum if needed
// export const ${ENTITY_NAME}StatusValues = {
//   ACTIVE: 'active' as ${ENTITY_NAME}Status,
//   INACTIVE: 'inactive' as ${ENTITY_NAME}Status,
// } as const;
EOF
    
    log_success "Entity interface generated: $entity_file"
}

# Generate repository interface
generate_repository_interface() {
    log_info "Generating repository interface..."
    
    local repo_file="$PROJECT_ROOT/src/core/domain/$DOMAIN_NAME/service/${DOMAIN_NAME%-*}.repository.ts"
    
cat > "$repo_file" << EOF
import type { I${ENTITY_NAME}, ${ENTITY_NAME}Id, ${ENTITY_NAME}Name } from '../entity/${DOMAIN_NAME%-*}.entity';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FindAll${ENTITY_NAME}Options {
  page?: number;
  limit?: number;
  search?: string;
  // TODO: Add filter options based on your entity
  // status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface I${ENTITY_NAME}Repository {
  // Core CRUD operations
  create(${entity_lower}: Omit<I${ENTITY_NAME}, 'id' | 'createdAt' | 'updatedAt'>): Promise<I${ENTITY_NAME}>;
  findById(id: ${ENTITY_NAME}Id): Promise<I${ENTITY_NAME} | null>;
  findAll(options?: FindAll${ENTITY_NAME}Options): Promise<{ data: I${ENTITY_NAME}[]; meta: PaginationMeta }>;
  update(id: ${ENTITY_NAME}Id, updates: Partial<I${ENTITY_NAME}>): Promise<I${ENTITY_NAME} | null>;
  delete(id: ${ENTITY_NAME}Id): Promise<boolean>;
  
  // Business-specific queries
  findByName(name: ${ENTITY_NAME}Name): Promise<I${ENTITY_NAME} | null>;
  // TODO: Add more specific query methods based on your needs
}
EOF
    
    log_success "Repository interface generated: $repo_file"
}

# Generate use case templates
generate_use_cases() {
    log_info "Generating use case templates..."
    
    local use_case_dir="$PROJECT_ROOT/src/core/domain/$DOMAIN_NAME/use-case"
    local entity_lower=$(echo "$ENTITY_NAME" | tr '[:upper:]' '[:lower:]')
    
    # Create use case template
    local create_use_case="$use_case_dir/create-${DOMAIN_NAME%-*}.usecase.ts"
cat > "$create_use_case" << EOF
import { StrictBuilder } from 'builder-pattern';
import { inject, injectable } from 'tsyringe';
import type { IUseCase } from '../../../shared/useCase';
import type { LoggerPort } from '../../../shared/logger/logger.port';
import { TOKENS } from '../../../shared/tokens';
import { ConflictError, ValidationError } from '../../../shared/errors/error-mapper';
import type { I${ENTITY_NAME}, ${ENTITY_NAME}Name, ${ENTITY_NAME}Description } from '../entity/${DOMAIN_NAME%-*}.entity';
import type { I${ENTITY_NAME}Repository } from '../service/${DOMAIN_NAME%-*}.repository';

export interface Create${ENTITY_NAME}Input {
  name: ${ENTITY_NAME}Name;
  description?: ${ENTITY_NAME}Description;
  // TODO: Add required input fields
}

@injectable()
export class Create${ENTITY_NAME}UseCase implements IUseCase<Create${ENTITY_NAME}Input, I${ENTITY_NAME}> {
  constructor(
    @inject(TOKENS.I${ENTITY_NAME}Repository) 
    private readonly ${entity_lower}Repository: I${ENTITY_NAME}Repository,
    @inject(TOKENS.Logger) 
    private readonly logger: LoggerPort
  ) {}

  async execute(input: Create${ENTITY_NAME}Input): Promise<I${ENTITY_NAME}> {
    const { name, description } = input;

    this.logger.info('Creating ${entity_lower}', { name });

    // Business Rule: Check if ${entity_lower} name already exists
    const existing${ENTITY_NAME} = await this.${entity_lower}Repository.findByName(name);
    if (existing${ENTITY_NAME}) {
      this.logger.warn('${ENTITY_NAME} name already exists', { name });
      throw new ConflictError('${ENTITY_NAME} name already exists');
    }

    // TODO: Add more business rule validations

    // Create ${entity_lower}
    const ${entity_lower}Data = StrictBuilder<Omit<I${ENTITY_NAME}, 'id' | 'createdAt' | 'updatedAt'>>()
      .name(name)
      .description(description)
      // TODO: Add other required fields
      .build();

    const created${ENTITY_NAME} = await this.${entity_lower}Repository.create(${entity_lower}Data);
    
    this.logger.info('${ENTITY_NAME} created successfully', { 
      id: created${ENTITY_NAME}.id, 
      name: created${ENTITY_NAME}.name 
    });

    return created${ENTITY_NAME};
  }
}
EOF

    # Get all use case template
    local get_all_use_case="$use_case_dir/get-all-${DOMAIN_NAME}.usecase.ts"
cat > "$get_all_use_case" << EOF
import { inject, injectable } from 'tsyringe';
import type { IUseCase } from '../../../shared/useCase';
import type { LoggerPort } from '../../../shared/logger/logger.port';
import { TOKENS } from '../../../shared/tokens';
import type { I${ENTITY_NAME} } from '../entity/${DOMAIN_NAME%-*}.entity';
import type { I${ENTITY_NAME}Repository, PaginationMeta, FindAll${ENTITY_NAME}Options } from '../service/${DOMAIN_NAME%-*}.repository';

export interface GetAll${ENTITY_NAME}sResult {
  data: I${ENTITY_NAME}[];
  meta: PaginationMeta;
}

@injectable()
export class GetAll${ENTITY_NAME}sUseCase implements IUseCase<FindAll${ENTITY_NAME}Options, GetAll${ENTITY_NAME}sResult> {
  constructor(
    @inject(TOKENS.I${ENTITY_NAME}Repository) 
    private readonly ${entity_lower}Repository: I${ENTITY_NAME}Repository,
    @inject(TOKENS.Logger) 
    private readonly logger: LoggerPort
  ) {}

  async execute(options: FindAll${ENTITY_NAME}Options = {}): Promise<GetAll${ENTITY_NAME}sResult> {
    this.logger.info('Getting all ${DOMAIN_NAME}', { options });

    const result = await this.${entity_lower}Repository.findAll(options);
    
    this.logger.info('${ENTITY_NAME}s retrieved', { 
      count: result.data.length,
      total: result.meta.total,
      page: result.meta.page
    });

    return result;
  }
}
EOF

    # Add more use case templates...
    local get_by_id_use_case="$use_case_dir/get-${DOMAIN_NAME%-*}-by-id.usecase.ts"
cat > "$get_by_id_use_case" << EOF
import { inject, injectable } from 'tsyringe';
import type { IUseCase } from '../../../shared/useCase';
import type { LoggerPort } from '../../../shared/logger/logger.port';
import { TOKENS } from '../../../shared/tokens';
import { NotFoundError } from '../../../shared/errors/error-mapper';
import type { I${ENTITY_NAME}, ${ENTITY_NAME}Id } from '../entity/${DOMAIN_NAME%-*}.entity';
import type { I${ENTITY_NAME}Repository } from '../service/${DOMAIN_NAME%-*}.repository';

@injectable()
export class Get${ENTITY_NAME}ByIdUseCase implements IUseCase<${ENTITY_NAME}Id, I${ENTITY_NAME}> {
  constructor(
    @inject(TOKENS.I${ENTITY_NAME}Repository) 
    private readonly ${entity_lower}Repository: I${ENTITY_NAME}Repository,
    @inject(TOKENS.Logger) 
    private readonly logger: LoggerPort
  ) {}

  async execute(id: ${ENTITY_NAME}Id): Promise<I${ENTITY_NAME}> {
    this.logger.info('Getting ${entity_lower} by ID', { id });

    const ${entity_lower} = await this.${entity_lower}Repository.findById(id);
    
    if (!${entity_lower}) {
      this.logger.warn('${ENTITY_NAME} not found', { id });
      throw new NotFoundError('${ENTITY_NAME} not found');
    }

    this.logger.info('${ENTITY_NAME} found', { id, name: ${entity_lower}.name });

    return ${entity_lower};
  }
}
EOF
    
    log_success "Use case templates generated"
}

# Generate DTO templates
generate_dtos() {
    log_info "Generating DTO templates..."
    
    local dto_file="$PROJECT_ROOT/src/adapters/$DOMAIN_NAME/dtos/${DOMAIN_NAME%-*}.dto.ts"
    
cat > "$dto_file" << EOF
import { t } from 'elysia';

// Request DTOs
export const Create${ENTITY_NAME}RequestDto = t.Object({
  name: t.String({ 
    minLength: 2, 
    maxLength: 100,
    description: '${ENTITY_NAME} name'
  }),
  description: t.Optional(t.String({ 
    maxLength: 1000,
    description: '${ENTITY_NAME} description'
  }))
  // TODO: Add your required fields with proper validation
});

export const Update${ENTITY_NAME}RequestDto = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
  description: t.Optional(t.String({ maxLength: 1000 }))
  // TODO: Add your updatable fields
});

// Query DTOs
export const GetAll${ENTITY_NAME}sQueryDto = t.Object({
  page: t.Optional(t.Integer({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Integer({ minimum: 1, maximum: 100, default: 10 })),
  search: t.Optional(t.String({ description: 'Search in name and description' })),
  sortBy: t.Optional(t.Union([
    t.Literal('name'),
    t.Literal('createdAt'),
    t.Literal('updatedAt')
  ], { default: 'createdAt' })),
  sortOrder: t.Optional(t.Union([
    t.Literal('asc'),
    t.Literal('desc')
  ], { default: 'desc' }))
  // TODO: Add filter options
});

// Path parameter DTOs
export const ${ENTITY_NAME}IdParamsDto = t.Object({
  id: t.String({ 
    format: 'uuid',
    description: '${ENTITY_NAME} UUID'
  })
});

// Response DTOs
export const ${ENTITY_NAME}ResponseDto = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date()
  // TODO: Add response fields
});

export const GetAll${ENTITY_NAME}sReturnTypeDto = t.Object({
  data: t.Array(${ENTITY_NAME}ResponseDto),
  meta: t.Object({
    total: t.Integer(),
    page: t.Integer(),
    limit: t.Integer(),
    totalPages: t.Integer()
  })
});

// Common Error Response
export const ErrorResponseDto = t.Object({
  name: t.String(),
  message: t.String()
});

// Type exports
export type Create${ENTITY_NAME}RequestType = typeof Create${ENTITY_NAME}RequestDto.static;
export type Update${ENTITY_NAME}RequestType = typeof Update${ENTITY_NAME}RequestDto.static;
export type GetAll${ENTITY_NAME}sQueryType = typeof GetAll${ENTITY_NAME}sQueryDto.static;
export type ${ENTITY_NAME}IdParamsType = typeof ${ENTITY_NAME}IdParamsDto.static;
export type ${ENTITY_NAME}ResponseType = typeof ${ENTITY_NAME}ResponseDto.static;
EOF
    
    log_success "DTO templates generated: $dto_file"
}

# Generate Drizzle schema template
generate_drizzle_schema() {
    log_info "Generating Drizzle schema template..."
    
    local schema_file="$PROJECT_ROOT/src/external/drizzle/$DOMAIN_NAME/${DOMAIN_NAME%-*}.schema.ts"
    local table_name=$(echo "$DOMAIN_NAME" | tr '[:upper:]' '[:lower:]')
    
cat > "$schema_file" << EOF
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const $table_name = pgTable('$table_name', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  // TODO: Add your table fields here
  // status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for Drizzle
export type Drizzle${ENTITY_NAME} = typeof $table_name.\$inferSelect;
export type NewDrizzle${ENTITY_NAME} = typeof $table_name.\$inferInsert;

// TODO: Update main schema.ts to export this table:
// export { $table_name } from './$DOMAIN_NAME/${DOMAIN_NAME%-*}.schema';
EOF
    
    log_success "Drizzle schema template generated: $schema_file"
}

# Generate repository implementation template
generate_repository_implementation() {
    log_info "Generating repository implementation template..."
    
    local repo_impl_file="$PROJECT_ROOT/src/external/drizzle/$DOMAIN_NAME/${DOMAIN_NAME%-*}.drizzle.repository.ts"
    local entity_lower=$(echo "$ENTITY_NAME" | tr '[:upper:]' '[:lower:]')
    local table_name=$(echo "$DOMAIN_NAME" | tr '[:upper:]' '[:lower:]')
    
cat > "$repo_impl_file" << EOF
import { eq, like, and, desc, asc, count } from 'drizzle-orm';
import { injectable } from 'tsyringe';
import { db } from '../connection';
import { $table_name, type Drizzle${ENTITY_NAME} } from './${DOMAIN_NAME%-*}.schema';
import type { 
  I${ENTITY_NAME}, 
  ${ENTITY_NAME}Id, 
  ${ENTITY_NAME}Name, 
  ${ENTITY_NAME}Description
} from '../../../core/domain/$DOMAIN_NAME/entity/${DOMAIN_NAME%-*}.entity';
import type { 
  I${ENTITY_NAME}Repository, 
  PaginationMeta, 
  FindAll${ENTITY_NAME}Options
} from '../../../core/domain/$DOMAIN_NAME/service/${DOMAIN_NAME%-*}.repository';
import { Builder } from 'builder-pattern';

@injectable()
export class ${ENTITY_NAME}DrizzleRepository implements I${ENTITY_NAME}Repository {
  
  // Map Drizzle entity to Domain entity
  private mapToDomain(drizzle${ENTITY_NAME}: Drizzle${ENTITY_NAME}): I${ENTITY_NAME} {
    return Builder<I${ENTITY_NAME}>()
      .id(drizzle${ENTITY_NAME}.id as ${ENTITY_NAME}Id)
      .name(drizzle${ENTITY_NAME}.name as ${ENTITY_NAME}Name)
      .description(drizzle${ENTITY_NAME}.description as ${ENTITY_NAME}Description)
      .createdAt(drizzle${ENTITY_NAME}.createdAt)
      .updatedAt(drizzle${ENTITY_NAME}.updatedAt)
      .build();
  }

  async create(${entity_lower}Data: Omit<I${ENTITY_NAME}, 'id' | 'createdAt' | 'updatedAt'>): Promise<I${ENTITY_NAME}> {
    const [result] = await db
      .insert($table_name)
      .values({
        name: ${entity_lower}Data.name,
        description: ${entity_lower}Data.description,
        // TODO: Add other fields
      })
      .returning();
    
    return this.mapToDomain(result);
  }

  async findById(id: ${ENTITY_NAME}Id): Promise<I${ENTITY_NAME} | null> {
    const [result] = await db
      .select()
      .from($table_name)
      .where(eq($table_name.id, id))
      .limit(1);
    
    return result ? this.mapToDomain(result) : null;
  }

  async findAll(options?: FindAll${ENTITY_NAME}Options): Promise<{ data: I${ENTITY_NAME}[]; meta: PaginationMeta }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const offset = (page - 1) * limit;
    const sortBy = options?.sortBy ?? 'createdAt';
    const sortOrder = options?.sortOrder ?? 'desc';

    // Build where conditions
    const conditions = [];
    
    if (options?.search) {
      conditions.push(
        like($table_name.name, \`%\${options.search}%\`)
      );
    }
    
    // TODO: Add more filter conditions

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from($table_name)
      .where(whereClause);

    // Get paginated data
    const orderBy = sortOrder === 'asc' 
      ? asc($table_name[sortBy]) 
      : desc($table_name[sortBy]);

    const results = await db
      .select()
      .from($table_name)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

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

  async update(id: ${ENTITY_NAME}Id, updates: Partial<I${ENTITY_NAME}>): Promise<I${ENTITY_NAME} | null> {
    const [result] = await db
      .update($table_name)
      .set({
        name: updates.name,
        description: updates.description,
        updatedAt: new Date(),
        // TODO: Add other updatable fields
      })
      .where(eq($table_name.id, id))
      .returning();

    return result ? this.mapToDomain(result) : null;
  }

  async delete(id: ${ENTITY_NAME}Id): Promise<boolean> {
    const result = await db
      .delete($table_name)
      .where(eq($table_name.id, id))
      .returning();

    return result.length > 0;
  }

  async findByName(name: ${ENTITY_NAME}Name): Promise<I${ENTITY_NAME} | null> {
    const [result] = await db
      .select()
      .from($table_name)
      .where(eq($table_name.name, name))
      .limit(1);

    return result ? this.mapToDomain(result) : null;
  }
}
EOF
    
    log_success "Repository implementation template generated: $repo_impl_file"
}

# Generate HTTP test file
generate_http_tests() {
    log_info "Generating HTTP test file..."
    
    local http_file="$PROJECT_ROOT/src/adapters/$DOMAIN_NAME/${DOMAIN_NAME%-*}.http"
    
cat > "$http_file" << EOF
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

### Store tokens (if this is a protected module)
@accessToken = {{signin.response.body.accessToken}}
@csrfToken = {{signin.response.body.csrf_token}}

### Create ${ENTITY_NAME} - Valid Request
POST {{baseUrl}}/$DOMAIN_NAME
Content-Type: {{contentType}}
$(if [[ "$AUTH_TYPE" == "protected" ]]; then echo "Authorization: Bearer {{accessToken}}"; echo "X-CSRF-Token: {{csrfToken}}"; fi)

{
  "name": "Test ${ENTITY_NAME}",
  "description": "A test ${entity_lower} for testing"
}

### Create ${ENTITY_NAME} - Invalid Data
POST {{baseUrl}}/$DOMAIN_NAME
Content-Type: {{contentType}}
$(if [[ "$AUTH_TYPE" == "protected" ]]; then echo "Authorization: Bearer {{accessToken}}"; echo "X-CSRF-Token: {{csrfToken}}"; fi)

{
  "name": "",
  "description": "Invalid ${entity_lower} with empty name"
}

### Get All ${ENTITY_NAME}s with Pagination
GET {{baseUrl}}/$DOMAIN_NAME?page=1&limit=10&sortBy=name&sortOrder=asc
$(if [[ "$AUTH_TYPE" == "protected" ]]; then echo "Authorization: Bearer {{accessToken}}"; echo "X-CSRF-Token: {{csrfToken}}"; fi)

### Search ${ENTITY_NAME}s
GET {{baseUrl}}/$DOMAIN_NAME?search=Test
$(if [[ "$AUTH_TYPE" == "protected" ]]; then echo "Authorization: Bearer {{accessToken}}"; echo "X-CSRF-Token: {{csrfToken}}"; fi)

### Get ${ENTITY_NAME} by ID (replace with actual ID)
GET {{baseUrl}}/$DOMAIN_NAME/550e8400-e29b-41d4-a716-446655440000
$(if [[ "$AUTH_TYPE" == "protected" ]]; then echo "Authorization: Bearer {{accessToken}}"; echo "X-CSRF-Token: {{csrfToken}}"; fi)

### Update ${ENTITY_NAME} (replace with actual ID)
PUT {{baseUrl}}/$DOMAIN_NAME/550e8400-e29b-41d4-a716-446655440000
Content-Type: {{contentType}}
$(if [[ "$AUTH_TYPE" == "protected" ]]; then echo "Authorization: Bearer {{accessToken}}"; echo "X-CSRF-Token: {{csrfToken}}"; fi)

{
  "name": "Updated ${ENTITY_NAME}",
  "description": "Updated description"
}

### Delete ${ENTITY_NAME} (replace with actual ID)
DELETE {{baseUrl}}/$DOMAIN_NAME/550e8400-e29b-41d4-a716-446655440000
$(if [[ "$AUTH_TYPE" == "protected" ]]; then echo "Authorization: Bearer {{accessToken}}"; echo "X-CSRF-Token: {{csrfToken}}"; fi)

### Error Cases

### Get ${ENTITY_NAME} by Invalid ID
GET {{baseUrl}}/$DOMAIN_NAME/invalid-uuid
$(if [[ "$AUTH_TYPE" == "protected" ]]; then echo "Authorization: Bearer {{accessToken}}"; echo "X-CSRF-Token: {{csrfToken}}"; fi)

$(if [[ "$AUTH_TYPE" == "protected" ]]; then cat << 'PROTECTED_EOF'
### Create ${ENTITY_NAME} without Auth (should fail)
POST {{baseUrl}}/$DOMAIN_NAME
Content-Type: {{contentType}}

{
  "name": "Unauthorized ${ENTITY_NAME}",
  "description": "This should fail"
}
PROTECTED_EOF
fi)
EOF
    
    log_success "HTTP test file generated: $http_file"
}

# Update configuration files
update_configuration() {
    log_info "Configuration update reminders..."
    
    # Create a reminder file for manual updates
    local reminder_file="$PROJECT_ROOT/docs/modules/${DOMAIN_NAME}-SETUP-REMINDERS.md"
    
cat > "$reminder_file" << EOF
# ${ENTITY_NAME} Module Setup Reminders

## Manual Configuration Updates Required

After generating the ${ENTITY_NAME} module structure, you need to manually update the following files:

### 1. Update Tokens (src/core/shared/tokens.ts)

Add the repository token:

\`\`\`typescript
export const TOKENS = {
  // ... existing tokens
  I${ENTITY_NAME}Repository: Symbol('I${ENTITY_NAME}Repository'),
} as const;
\`\`\`

### 2. Update Container (src/core/shared/container.ts)

Register the repository implementation:

\`\`\`typescript
import { ${ENTITY_NAME}DrizzleRepository } from '../../external/drizzle/$DOMAIN_NAME/${DOMAIN_NAME%-*}.drizzle.repository';
import type { I${ENTITY_NAME}Repository } from '../domain/$DOMAIN_NAME/service/${DOMAIN_NAME%-*}.repository';

// Register repository implementation
container.registerSingleton<I${ENTITY_NAME}Repository>(
  TOKENS.I${ENTITY_NAME}Repository,
  ${ENTITY_NAME}DrizzleRepository
);
\`\`\`

### 3. Update Main Schema (src/external/drizzle/schema.ts)

Export the new table:

\`\`\`typescript
// Add to exports
export { ${DOMAIN_NAME} } from './$DOMAIN_NAME/${DOMAIN_NAME%-*}.schema';
\`\`\`

### 4. Generate Controllers

Create controllers using AI-SPEC-CRUD or manually:
- create-${DOMAIN_NAME%-*}.controller.ts
- get-all-${DOMAIN_NAME}.controller.ts
- get-${DOMAIN_NAME%-*}-by-id.controller.ts
- update-${DOMAIN_NAME%-*}-by-id.controller.ts
- delete-${DOMAIN_NAME%-*}-by-id.controller.ts

### 5. Update Routes (src/external/api/routes.ts)

Register the controllers and routes.

### 6. Create Database Migration

Generate and apply migration:

\`\`\`bash
bun run db:generate
bun run db:migrate
\`\`\`

### 7. Create Module README

Run the module completion:

\`\`\`bash
# Generate module README after implementation
./scripts/complete-module.sh $DOMAIN_NAME
\`\`\`

## Next Steps

1. Complete the TODO items in generated files
2. Implement business logic in use cases
3. Add proper field validation in DTOs
4. Implement controllers
5. Add comprehensive tests
6. Generate database migration
7. Update main project documentation

## Clean Up

Delete this file after completing all setup steps.
EOF
    
    log_warning "Setup reminders created: $reminder_file"
    log_warning "Please complete the manual configuration steps before proceeding!"
}

# Main execution
main() {
    echo "=== New Module Generation Script ==="
    echo "This script creates a new CRUD module structure following Clean Architecture patterns."
    echo
    
    # Parse arguments
    DOMAIN_NAME="$1"
    ENTITY_NAME="$2"
    AUTH_TYPE="${3:-protected}" # Default to protected
    
    # Convert entity name to lowercase for some contexts
    entity_lower=$(echo "$ENTITY_NAME" | tr '[:upper:]' '[:lower:]')
    
    # Validate inputs
    validate_inputs
    
    log_info "Creating module: $DOMAIN_NAME ($ENTITY_NAME) - $AUTH_TYPE"
    echo
    
    # Create the module structure
    create_directories
    generate_entity
    generate_repository_interface
    generate_use_cases
    generate_dtos
    generate_drizzle_schema
    generate_repository_implementation
    generate_http_tests
    update_configuration
    
    echo
    log_success "Module '$DOMAIN_NAME' structure generated successfully!"
    echo
    echo "Next steps:"
    echo "1. Review generated files and complete TODO items"
    echo "2. Check setup reminders: docs/modules/${DOMAIN_NAME}-SETUP-REMINDERS.md"
    echo "3. Update configuration files as specified in reminders"
    echo "4. Generate and apply database migration"
    echo "5. Implement controllers"
    echo "6. Run tests to verify functionality"
    echo
    echo "Generated files:"
    echo "- Domain: src/core/domain/$DOMAIN_NAME/"
    echo "- Adapters: src/adapters/$DOMAIN_NAME/"
    echo "- External: src/external/drizzle/$DOMAIN_NAME/"
    echo "- Setup guide: docs/modules/${DOMAIN_NAME}-SETUP-REMINDERS.md"
    echo
    log_info "Use './scripts/complete-module.sh $DOMAIN_NAME' after implementation to generate documentation"
}

# Run the script
main "$@"
