# AI Specification Document

## Project Overview

**Project Name**: Elysia Clean Architecture Backend with JWT Authentication  
**Framework**: Elysia + TypeScript + Bun  
**Architecture Pattern**: Clean Architecture with Multi-Domain Design  
**Database**: PostgreSQL with Drizzle ORM  
**Authentication**: JWT with Refresh Token Pattern  
**Dependency Injection**: TSyringe  
**Observability**: OpenTelemetry + Grafana Stack

## System Architecture

### Clean Architecture Layout

```text
src/
├── modules/
│   ├── auth/                # Authentication and session lifecycle
│   │   ├── domain/          # Entities, value objects, ports
│   │   ├── application/     # Use cases and base classes
│   │   ├── interface/http/  # Controllers, DTOs, guards, HTTP specs
│   │   └── infrastructure/  # Drizzle repositories, providers, config
│   ├── accounts/            # User aggregate backing authentication
│   └── content/             # Posts CRUD capability
├── platform/
│   ├── di/                  # DI container, tokens, module registry
│   ├── http/                # Elysia bootstrap, global controllers
│   ├── config/              # App-level configuration sources
│   ├── database/            # Drizzle connection, schema, migrations
│   ├── logging/             # Logger adapter (Pino)
│   └── observability/       # OpenTelemetry helpers
├── shared/
│   ├── kernel/              # Base entity/value types, status enums
│   ├── application/         # Generic use-case contracts
│   ├── errors/              # Error mapper & custom errors
│   ├── dtos/                # Reusable DTO schemas
│   └── utils/               # Cookie builders, duration helpers, etc.
└── index.ts                 # Application entry point
```

- **Modules** encapsulate business capabilities. Each exposes a `module-definition.ts` that registers DI bindings and routes. Modules never import other modules' internals—interaction happens via shared ports or DI interfaces.
- **Platform** hosts cross-cutting infrastructure (HTTP server, DI container, logging, telemetry, configuration, database wiring) and is the single composition root.
- **Shared** contains framework-agnostic primitives that modules reuse (value objects, logger ports, DTO helpers, utility functions).
- The `ModuleRegistry` composes the application at runtime by registering modules in `platform/http/routes.ts`.

## Domain Model

### Auth Domain

#### RefreshToken Entity

```typescript
export interface IRefreshToken {
  id: RefreshTokenId;
  tokenHash: RefreshTokenHash;
  userId: UserId;
  expiresAt: Date;
  createdAt: Date;
}
```

#### Auth Business Rules

1. **Token Uniqueness**: Each refresh token must be unique and hashed
2. **Token Expiration**: Refresh tokens have configurable expiration time
3. **CSRF Protection**: All authenticated requests require CSRF token validation
4. **Password Security**: Passwords are hashed using Argon2id
5. **JWT Security**: Access tokens are short-lived, refresh tokens are long-lived

### Posts Domain

#### Post Entity

```typescript
export interface IPost {
  id: PostId;
  title: PostTitle;
  content: PostContent;
  status: PostStatus;
  authorId: UserId;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Posts Business Rules

1. **Content Validation**: Title and content are required
2. **Status Management**: Posts can have status (draft, published, archived)
3. **Author Association**: Each post must be associated with a user
4. **Authorization**: Only authenticated users can create/edit posts

### Users Domain

#### User Entity

```typescript
export interface IUser {
  id: UserId;
  name: BUserName;
  email: UserEmail;
  password: UserPassword; // Hashed with Argon2id
  createdAt: Date;
  updatedAt: Date;
}
```

#### Users Business Rules

1. **Email Uniqueness**: Email must be unique across all users
2. **Data Validation**: All fields are required for user creation
3. **Password Security**: Passwords are hashed using Argon2id with salt
4. **Account Management**: Users can update profile information

## Use Cases

### Auth Domain Use Cases

#### 1. Sign Up Use Case

- **Input**: `{ name: string, email: string, password: string }`
- **Output**: `{ user: IUser, tokens: AuthTokens }`
- **Business Rules**:
  - Check if user with email already exists
  - Hash password with Argon2id
  - Create new user if email is unique
  - Generate JWT access token and refresh token
  - Store hashed refresh token in database
  - Return user data and tokens

#### 2. Sign In Use Case

- **Input**: `{ email: string, password: string }`
- **Output**: `{ user: IUser, tokens: AuthTokens }`
- **Business Rules**:
  - Validate user credentials
  - Verify password with Argon2id
  - Generate new JWT access token and refresh token
  - Store hashed refresh token in database
  - Return user data and tokens

#### 3. Refresh Session Use Case

- **Input**: `{ refreshToken: string }`
- **Output**: `{ user: IUser, tokens: AuthTokens }`
- **Business Rules**:
  - Validate refresh token
  - Verify token hasn't expired
  - Generate new access token and refresh token
  - Update refresh token in database
  - Return user data and new tokens

#### 4. Logout Use Case

- **Input**: `{ refreshToken: string }`
- **Output**: `void`
- **Business Rules**:
  - Invalidate refresh token in database
  - Clear authentication cookies

### Posts Domain Use Cases

#### 5. Create Post Use Case

- **Input**: `{ title: string, content: string, authorId: string }`
- **Output**: `IPost`
- **Business Rules**:
  - Validate title and content are not empty
  - Set default status to 'draft'
  - Associate post with authenticated user
  - Return created post data

#### 6. Get All Posts Use Case

- **Input**: `{ page?: number, limit?: number, search?: string, sort?: string, order?: string }`
- **Output**: `{ posts: IPost[], meta: PaginationMeta }`
- **Business Rules**:
  - Support pagination with page and limit
  - Support search by title/content
  - Support sorting by various fields
  - Return posts with pagination metadata

#### 7. Get Post By ID Use Case

- **Input**: `PostId`
- **Output**: `IPost | null`
- **Business Rules**:
  - Return post if found
  - Return null if not found

#### 8. Update Post Use Case

- **Input**: `IPost` (with updated fields)
- **Output**: `IPost`
- **Business Rules**:
  - Validate post exists
  - Update allowed fields (title, content, status)
  - Update timestamp
  - Return updated post

#### 9. Delete Post Use Case

- **Input**: `PostId`
- **Output**: `void`
- **Business Rules**:
  - Validate post exists
  - Remove post from database

## API Specification

### Base URL

```text
http://localhost:7000
```

### Authentication Endpoints

#### POST /auth/signup

**Description**: Create a new user account  
**Authentication**: None  
**Request Body**:

```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response** (201 Created):

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt_access_token",
  "accessTokenExpiresAt": "2024-01-01T00:15:00.000Z",
  "refreshTokenExpiresAt": "2024-01-08T00:00:00.000Z",
  "csrf_token": "csrf_token"
}
```

#### POST /auth/signin

**Description**: Sign in with credentials  
**Authentication**: None  
**Request Body**:

```json
{
  "email": "string",
  "password": "string"
}
```

**Response** (200 OK):

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "jwt_access_token",
  "accessTokenExpiresAt": "2024-01-01T00:15:00.000Z",
  "refreshTokenExpiresAt": "2024-01-08T00:00:00.000Z",
  "csrf_token": "csrf_token"
}
```

#### POST /auth/refresh

**Description**: Refresh access token  
**Authentication**: Refresh Token Cookie + CSRF Header  
**Headers**:

- `X-CSRF-Token`: CSRF token from signin response
- `Cookie`: Refresh token (automatically set)

**Response** (200 OK):

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "new_jwt_access_token",
  "accessTokenExpiresAt": "2024-01-01T00:15:00.000Z",
  "refreshTokenExpiresAt": "2024-01-08T00:00:00.000Z",
  "csrf_token": "new_csrf_token"
}
```

#### POST /auth/logout

**Description**: Logout and invalidate tokens  
**Authentication**: Refresh Token Cookie  
**Response** (200 OK): Empty response with cleared cookies

### Posts Endpoints (Protected)

All posts endpoints require:

- `Authorization: Bearer {access_token}`
- `X-CSRF-Token: {csrf_token}`

#### POST /posts

**Description**: Create a new post  
**Request Body**:

```json
{
  "title": "string",
  "content": "string"
}
```

**Response** (200 OK):

```json
{
  "id": "uuid",
  "title": "My Post Title",
  "content": "Post content here...",
  "status": "draft",
  "authorId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /posts

**Description**: Get all posts with pagination  
**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: -1 for all)
- `search`: Search term for title/content
- `sort`: Sort field
- `order`: Sort order (asc/desc)

**Response** (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Post Title",
      "content": "Post content...",
      "status": "published",
      "authorId": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### GET /posts/:id

**Description**: Get post by ID  
**Path Parameters**: `id` (UUID)

**Response** (200 OK):

```json
{
  "id": "uuid",
  "title": "Post Title",
  "content": "Post content...",
  "status": "published",
  "authorId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /posts/:id

**Description**: Update post by ID  
**Request Body**:

```json
{
  "title": "string",
  "content": "string",
  "status": "string"
}
```

**Response** (200 OK): Updated post object

#### DELETE /posts/:id

**Description**: Delete post by ID  
**Response** (200 OK): Empty response

## Database Schema

### Core Tables

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Posts Table

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  author_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Drizzle Schema Definitions

#### Users Schema

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Posts Schema

```typescript
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  status: varchar('status', { length: 50 }).default('draft'),
  authorId: uuid('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Refresh Tokens Schema

```typescript
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Dependency Injection Configuration

Dependency injection is handled by **TSyringe**. The platform container wires global infrastructure (configuration, logging, database access) while each module registers its own dependencies inside `module-definition.ts`.

### Platform Container

```typescript
// src/platform/di/container.ts
import { container } from 'tsyringe';
import { PlatformTokens } from '@platform/di/tokens';
import { appConfig } from '@platform/config/app-config';
import type { AppConfig } from '@platform/config/app-config';
import { PinoLogger } from '@platform/logging/pino.logger';
import type { LoggerPort } from '@shared/logging/logger.port';

container.register<AppConfig>(PlatformTokens.AppConfig, { useValue: appConfig });
container.registerSingleton<LoggerPort>(PlatformTokens.Logger, PinoLogger);
```

### Module Registration

```typescript
// src/modules/auth/module-definition.ts
export const authModule: ModuleDefinition = {
  name: 'auth',
  register(container) {
    container.register<AuthConfig>(AuthModuleTokens.AuthConfig, { useValue: authConfig });
    container.registerSingleton<RefreshTokenRepository>(
      AuthModuleTokens.RefreshTokenRepository,
      RefreshTokenDrizzleRepository
    );
    container.registerSingleton<AuthTokenService>(
      AuthModuleTokens.AuthTokenService,
      JwtTokenService
    );
  },
  routes(app, container) {
    container.resolve(SignUpController).register(app);
    container.resolve(SignInController).register(app);
    container.resolve(RefreshSessionController).register(app);
    container.resolve(LogoutController).register(app);
  },
};
```

### Use Case Injection

```typescript
@injectable()
export class SignInUseCase extends BaseAuthUseCase<SignInInput, AuthenticatedUser> {
  constructor(
    @inject(AccountsModuleTokens.UserRepository) protected readonly users: UserRepository,
    @inject(AuthModuleTokens.RefreshTokenRepository) protected readonly refreshTokens: RefreshTokenRepository,
    @inject(AuthModuleTokens.AuthTokenService) protected readonly tokens: AuthTokenService
  ) {
    super(users, refreshTokens, tokens);
  }
}
```

Each module defines its own token map in `module.tokens.ts`, keeping DI boundaries explicit and preventing accidental cross-module coupling.
## File Structure Specification

```text
(See architecture layout above for the current module structure.)
```

## Development Guidelines

### Code Organization

1. **Modules (`src/modules/*`)** – Feature slices containing domain, application, interface, infrastructure, and tests. Example folders: `auth`, `accounts`, `content`.
2. **Platform (`src/platform/*`)** – Composition root providing DI container, HTTP bootstrap, config, logging, telemetry, and database wiring.
3. **Shared (`src/shared/*`)** – Framework-agnostic primitives such as kernel entities, DTO helpers, error mapper, logger port, and utilities reused across modules.

### Architecture Principles

1. **Module Isolation** – Modules expose contracts via `module-definition.ts` and local token maps; cross-module access occurs through DI interfaces only.
2. **Dependency Direction** – Domain and application code remain framework-free. Interface and infrastructure layers depend inward on ports and use cases.
3. **Runtime Composition** – `platform/http/routes.ts` uses the `ModuleRegistry` to register modules, apply bindings, and attach HTTP routes.
4. **Configuration Clarity** – Platform-level configuration lives under `platform/config`, while module-specific secrets/config stay inside the module's `infrastructure/config`.

### Authentication & Security

- **JWT Strategy**: Access tokens (short-lived) plus refresh tokens stored in HTTP-only cookies.
- **Refresh Flow**: `/auth/refresh` accepts the refresh token from the cookie or an optional JSON body to maintain backward compatibility.
- **CSRF Protection**: Custom CSRF token issued alongside refresh token and required for state-changing requests.
- **Password Hashing**: Argon2id with configurable memory/time cost.

### Error Handling & Logging

- Centralised error mapper in `@shared/errors/error-mapper` ensures consistent HTTP responses.
- Structured logging via Pino (`@platform/logging/pino.logger`) with trace/span correlation when telemetry is enabled.
- Controllers log success/failure using the injected `LoggerPort`.

### Testing Strategy

- **Unit Tests**: Per-module suites under `src/modules/<module>/tests/unit` covering domain/application logic.
- **Integration/E2E**: Future modules can add dedicated integration tests; global E2E lives under `src/test`.
- **HTTP Specs**: REST Client files at `src/modules/<module>/interface/http/*.http` for manual validation.

### Code Quality

- Oxlint + Prettier formatting
- Strict TypeScript configuration with branded types and module path aliases
- Husky hooks for pre-commit checks
## Observability & Monitoring

### Telemetry Stack

- **OpenTelemetry**: Distributed tracing and metrics collection
- **Prometheus**: Metrics storage and alerting
- **Grafana**: Dashboards and visualization
- **Loki**: Centralized log aggregation
- **Promtail**: Log collection from containers

### Logging

- **Pino**: High-performance structured logging
- **Log Levels**: Debug, info, warn, error with context
- **Request Logging**: HTTP request/response tracking
- **Error Tracking**: Detailed error context and stack traces

### Performance Monitoring

- **Response Time**: API endpoint performance tracking
- **Database Queries**: Query performance and optimization
- **Memory Usage**: Application resource monitoring
- **Container Metrics**: Docker container resource tracking

## Security Considerations

### Authentication Security

- Secure JWT signing with configurable secrets
- Refresh token rotation on each use
- CSRF token validation for state-changing operations
- HTTP-Only cookies with Secure and SameSite flags

### Data Protection

- Password hashing with Argon2id (memory-hard function)
- Sensitive data filtering in logs and responses
- Input validation and sanitization with TypeBox
- SQL injection prevention with Drizzle ORM

### Infrastructure Security

- Database connection security with SSL
- Environment variable management
- CORS configuration for allowed origins
- Rate limiting (planned for future implementation)

## Deployment & DevOps

### Containerization

- **Docker**: Multi-stage builds for optimized images
- **Docker Compose**: Local development environment
- **Health Checks**: Container health monitoring
- **Volume Management**: Database persistence

### Database Management

- **Migrations**: Versioned database schema changes
- **Connection Pooling**: Optimized PostgreSQL connections
- **Backup Strategy**: Database backup and recovery
- **Schema Evolution**: Safe schema migration practices

## Future Enhancements

### Short-term Goals

1. **API Rate Limiting**
   - Request throttling per user/IP
   - Abuse prevention mechanisms
   - Graceful degradation

2. **Enhanced Security**
   - Multi-factor authentication (MFA)
   - Password complexity requirements
   - Session management improvements

3. **Advanced Posts Features**
   - Rich text content support
   - Image/file attachments
   - Post categories and tags
   - Comment system

### Medium-term Goals

1. **Real-time Features**
   - WebSocket support for live updates
   - Real-time notifications
   - Collaborative editing

2. **Advanced Monitoring**
   - Custom business metrics
   - Performance alerting
   - Error rate monitoring
   - User analytics

3. **Scalability Improvements**
   - Database read replicas
   - Caching layer (Redis)
   - CDN integration
   - Horizontal scaling

### Long-term Vision

1. **Microservices Architecture**
   - Service decomposition
   - Inter-service communication
   - Distributed system patterns

2. **Advanced Analytics**
   - Business intelligence dashboards
   - User behavior tracking
   - Performance optimization insights

3. **Developer Experience**
   - API versioning strategy
   - Enhanced documentation
   - SDK/client library generation

---

**Document Version**: 2.0  
**Last Updated**: December 2024  
**Project**: Elysia Clean Architecture Backend with JWT Authentication  
**Maintainer**: Development Team

## Quick Reference

### Key Technologies

- **Runtime**: Bun
- **Framework**: Elysia + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: JWT + Refresh Tokens + CSRF
- **Observability**: OpenTelemetry + Grafana Stack
- **Testing**: Vitest
- **Quality**: Oxlint + Prettier + Husky

### Current Domains

1. **Auth Domain**: JWT authentication, session management, CSRF protection
2. **Posts Domain**: CRUD operations, pagination, search functionality
3. **Users Domain**: User profile management and account operations

### API Base URL

```text
http://localhost:7000
```

### AI Development Specifications

For AI-assisted development, consult these specialized guides:

#### Core Development Specifications

- **[AI-SPEC-CRUD.md](ai-spec-crud.md)** - Complete CRUD generation specification
- **[AI-SPEC-MIGRATE.md](ai-spec-migrate.md)** - Database migration generation specification
- **[ai-crud-useage.md](ai-crud-useage.md)** - CRUD usage examples and patterns

#### Quality & Testing Specifications

- **[AI-SPEC-SECURITY.md](ai-spec-security.md)** - Security implementation guidelines and best practices
- **[AI-SPEC-TESTING.md](ai-spec-testing.md)** - Testing strategies for unit, integration, and E2E tests
- **[AI-SPEC-PERFORMANCE.md](ai-spec-performance.md)** - Performance optimization guidelines and benchmarks

#### Operations & Maintenance Specifications

- **[AI-SPEC-MAINTENANCE.md](ai-spec-maintenance.md)** - System maintenance and monitoring procedures

### Documentation Links

#### Core Documentation

- **Main README**: `README.md`
- **Development Guide**: `docs/DEVELOPMENT.md`
- **Authentication Guide**: `docs/AUTH-README.md`
- **DTOs Documentation**: `docs/DTOs.md`

#### Quality Assurance

- **Code Review Checklist**: `docs/CODE-REVIEW-CHECKLIST.md`

#### Module & Migration Documentation

- **Modules Documentation**: `docs/modules/` - Individual module READMEs
- **Migrations Documentation**: `docs/migrations/` - Standalone migration records

#### Development Tools

- **Development Scripts**: `scripts/` - Automation tools and utilities
- **Health Check System**: `src/shared/health/` - Application health monitoring

### Migration & CRUD Workflow

When adding new domains/entities to the project:

1. **Read Specifications**: Review AI-SPEC-CRUD.md and AI-SPEC-MIGRATE.md
2. **Plan Migration**: Use ai-spec-migrate.md to create database schema
3. **Generate CRUD**: Use ai-spec-crud.md to create full CRUD operations
4. **Update Documentation**: Always update README.md and AI-SPEC.md after completion
