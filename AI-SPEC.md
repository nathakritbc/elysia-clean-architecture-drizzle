# AI Specification Document

## Project Overview

**Project Name**: Clean Architecture Backend with Drizzle ORM  
**Framework**: Elysia + TypeScript + Bun  
**Architecture Pattern**: Clean Architecture  
**Database**: PostgreSQL with Drizzle ORM  
**Dependency Injection**: TSyringe

## System Architecture

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

## Domain Model

### User Entity

```typescript
class User extends Entity {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}
```

### Business Rules

1. **User Uniqueness**: Email must be unique across all users
2. **Data Validation**: All fields are required for user creation
3. **Password Security**: Passwords should be hashed (implementation pending)

## Use Cases

### 1. Create User Use Case

- **Input**: `{ name: string, email: string, password: string }`
- **Output**: `void`
- **Business Rules**:
  - Check if user with email already exists
  - Create new user if email is unique
  - Throw error if user already exists

### 2. Find User by ID Use Case

- **Input**: `number` (user ID)
- **Output**: `User | null`
- **Business Rules**:
  - Return user if found
  - Return null if not found

### 3. Find All Users Use Case

- **Input**: `void`
- **Output**: `User[]`
- **Business Rules**:
  - Return all users in the system
  - Return empty array if no users exist

## API Specification

### Base URL

```
http://localhost:3000
```

### Endpoints

#### POST /users

**Description**: Create a new user  
**Request Body**:

```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response**:

```json
{
  "status": 200,
  "body": {
    "mensagem": "Usuario criado com sucesso"
  }
}
```

**Error Response**:

```json
{
  "name": "Error",
  "message": "User already exists"
}
```

#### GET /users

**Description**: Get all users  
**Response**:

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "password": "hashedpassword",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /users/:id

**Description**: Get user by ID  
**Path Parameters**:

- `id`: User ID (number)
  **Response**:

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashedpassword",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Drizzle Schema Definition

```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

## Dependency Injection Configuration

### Container Setup

```typescript
// Registration
container.registerSingleton<BaseCollectionUser>(TOKENS.ICollectionUser, CollectionUserDrizzle);

// Injection
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(TOKENS.ICollectionUser)
    private readonly collection: BaseCollectionUser
  ) {}
}
```

### DI Tokens

```typescript
export const TOKENS = {
  ICollectionUser: Symbol('ICollectionUser'),
} as const;
```

## File Structure Specification

```
src/
├── core/                           # Business Logic
│   ├── domain/
│   │   └── usuario/               # User Domain
│   │       ├── entity/
│   │       │   └── User.ts        # User Entity
│   │       ├── service/
│   │       │   ├── CollectionUser.ts      # Interface
│   │       │   └── BaseCollectionUser.ts  # Abstract Class
│   │       └── use-case/
│   │           ├── CreateUserUseCase.ts
│   │           ├── FindUserById.ts
│   │           └── FindUsersUseCase.ts
│   └── shared/
│       ├── container.ts           # DI Container
│       ├── tokens.ts              # DI Tokens
│       ├── Entity.ts              # Base Entity
│       └── UseCase.ts             # Use Case Interface
├── adapters/                      # Interface Adapters
│   ├── CreateUserController.ts
│   ├── FindUserByIdController.ts
│   └── FindUsersController.ts
└── external/                      # External Layer
    ├── api/
    │   ├── config.ts              # Elysia Config
    │   └── routes.ts              # Route Setup
    ├── drizzle/
    │   ├── schema.ts              # DB Schema
    │   ├── connection.ts          # DB Connection
    │   └── CollectionUserDrizzle.ts # Repository
    └── memory/
        └── CollectionUserMemory.ts # In-Memory Implementation
```

## Development Guidelines

### Code Organization

1. **Domain Layer**: Contains business logic, entities, and use cases
2. **Application Layer**: Contains controllers and interface adapters
3. **Infrastructure Layer**: Contains external dependencies (database, web framework)

### Dependency Rules

1. **Dependencies point inward**: External layers depend on inner layers
2. **Use interfaces**: Define contracts in domain layer, implement in infrastructure
3. **Dependency Injection**: Use TSyringe for loose coupling

### Error Handling

- Use custom error classes for business logic errors
- Return appropriate HTTP status codes
- Provide meaningful error messages

### Testing Strategy

- **Unit Tests**: Test use cases and domain logic
- **Integration Tests**: Test controllers and database interactions
- **Repository Pattern**: Use in-memory implementation for testing

## Performance Considerations

### Database

- Use connection pooling for PostgreSQL
- Implement proper indexing on email field
- Consider query optimization for large datasets

### Caching

- Implement Redis for session management (future)
- Cache frequently accessed user data

### Security

- Hash passwords using bcrypt (pending implementation)
- Implement JWT authentication (future)
- Add input validation and sanitization

## Future Enhancements

### Planned Features

1. **Authentication & Authorization**
   - JWT token-based authentication
   - Role-based access control
   - Password hashing with bcrypt

2. **Additional User Operations**
   - Update user information
   - Delete user account
   - User profile management

3. **Advanced Features**
   - Email verification
   - Password reset functionality
   - User search and filtering

4. **Monitoring & Logging**
   - Application logging with Winston
   - Health check endpoints
   - Performance monitoring

### Scalability Considerations

- Implement database migrations
- Add API rate limiting
- Consider microservices architecture for larger applications
- Implement horizontal scaling strategies

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Development Team
