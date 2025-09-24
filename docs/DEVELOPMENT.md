# Development Guide

## Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PORT=3000
NODE_ENV=development
```

### 2. Database Setup

```bash
# Install dependencies
bun install

# Generate database migrations
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Or push schema directly (development only)
bun run db:push
```

### 3. Start Development Server

```bash
bun run dev
```

## Project Structure Explanation

### Clean Architecture Layers

#### 1. Domain Layer (`src/core/domain/`)

- **Purpose**: Contains business logic and rules
- **Dependencies**: None (pure business logic)
- **Components**:
  - `entity/`: Domain entities (User)
  - `service/`: Domain service interfaces
  - `use-case/`: Business use cases

#### 2. Application Layer (`src/adapters/`)

- **Purpose**: Interface adapters that connect external world to domain
- **Dependencies**: Domain layer only
- **Components**:
  - Controllers: Handle HTTP requests/responses
  - Presenters: Format data for external interfaces

#### 3. Infrastructure Layer (`src/external/`)

- **Purpose**: External concerns (database, web framework, etc.)
- **Dependencies**: Application and Domain layers
- **Components**:
  - `api/`: Web API setup with Elysia
  - `drizzle/`: Database implementation
  - `memory/`: In-memory implementation for testing

## Key Concepts

### Dependency Injection with TSyringe

The project uses TSyringe for dependency injection to achieve loose coupling:

```typescript
// 1. Define tokens
export const TOKENS = {
  ICollectionUser: Symbol('ICollectionUser'),
} as const;

// 2. Register implementations
container.registerSingleton<BaseCollectionUser>(TOKENS.ICollectionUser, CollectionUserDrizzle);

// 3. Inject dependencies
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(TOKENS.ICollectionUser)
    private readonly collection: BaseCollectionUser
  ) {}
}
```

### Repository Pattern

The project uses the Repository pattern to abstract data access:

```typescript
// Abstract base class
export abstract class BaseCollectionUser {
  abstract getByEmail(email: string): Promise<User | null>;
  abstract create(user: User): Promise<User>;
  abstract find(): Promise<User[]>;
  abstract findById(id: number): Promise<User | null>;
}

// Concrete implementation
export class CollectionUserDrizzle extends BaseCollectionUser {
  // Drizzle ORM implementation
}
```

### Use Case Pattern

Business logic is encapsulated in use cases:

```typescript
@injectable()
export class CreateUserUseCase implements IUseCase<Input, void> {
  constructor(
    @inject(TOKENS.ICollectionUser)
    private readonly collection: BaseCollectionUser
  ) {}

  async execute(input: Input): Promise<void> {
    // Business logic here
  }
}
```

## Adding New Features

### 1. Adding a New Use Case

1. Create use case in `src/core/domain/usuario/use-case/`
2. Implement the `IUseCase<Input, Output>` interface
3. Add `@injectable()` decorator
4. Inject required dependencies

### 2. Adding a New Controller

1. Create controller in `src/adapters/`
2. Add `@injectable()` decorator
3. Inject required use cases
4. Implement `register(server: Elysia)` method
5. Register in `src/external/api/routes.ts`

### 3. Adding Database Operations

1. Add methods to `BaseCollectionUser` abstract class
2. Implement in `CollectionUserDrizzle`
3. Update schema if needed in `src/external/drizzle/schema.ts`

## Testing Strategy

### Unit Tests

- Test use cases with mocked dependencies
- Test domain entities and business rules
- Use in-memory repository for testing

### Integration Tests

- Test controllers with real use cases
- Test database operations
- Test API endpoints

### Example Test Setup

```typescript
// Use in-memory repository for testing
container.registerSingleton<BaseCollectionUser>(TOKENS.ICollectionUser, CollectionUserMemory);
```

## Database Operations

### Drizzle ORM Usage

```typescript
// Select operations
const users = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

// Insert operations
const result = await db
  .insert(users)
  .values({
    name: user.name,
    email: user.email,
    password: user.password,
  })
  .returning();

// Update operations (when implemented)
await db.update(users).set({ name: newName }).where(eq(users.id, id));
```

### Migration Commands

```bash
# Generate migration files
bun run db:generate

# Apply migrations
bun run db:migrate

# Push schema (development)
bun run db:push
```

## Code Style Guidelines

### TypeScript

- Use strict mode
- Prefer interfaces over types for object shapes
- Use abstract classes for base implementations
- Use dependency injection for loose coupling

### Naming Conventions

- Use PascalCase for classes and interfaces
- Use camelCase for methods and variables
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that explain intent

### File Organization

- One class per file
- Group related files in directories
- Use index files for clean imports
- Separate concerns by layers

## Common Patterns

### Error Handling

```typescript
// In use cases
if (isUserExist) {
  throw new Error('User already exists');
}

// In controllers
try {
  await this.useCase.execute(input);
  return { status: 200, body: { message: 'Success' } };
} catch (error) {
  return { status: 400, body: { error: error.message } };
}
```

### Data Mapping

```typescript
// Map between Drizzle types and domain entities
private mapDrizzleUserToDomain(drizzleUser: DrizzleUser): User {
  return new User(
    drizzleUser.id,
    drizzleUser.name,
    drizzleUser.password,
    drizzleUser.email,
    drizzleUser.created_at,
    drizzleUser.updated_at
  );
}
```

## Troubleshooting

### Common Issues

1. **Dependency Injection Errors**
   - Ensure `@injectable()` decorator is present
   - Check token registration in container
   - Verify import paths

2. **Database Connection Issues**
   - Check DATABASE_URL environment variable
   - Ensure PostgreSQL is running
   - Verify database exists

3. **Type Errors**
   - Ensure proper imports
   - Check interface implementations
   - Verify generic type parameters

### Debug Tips

- Use `console.log` for debugging
- Check browser network tab for API errors
- Use database client to verify data
- Check server logs for detailed errors

---

**Happy Coding! 🚀**
