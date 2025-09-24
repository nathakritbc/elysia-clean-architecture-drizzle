# Elysia Clean Architecture Backend with JWT Authentication

A modern TypeScript backend application built with Clean Architecture principles, featuring JWT authentication, posts management, and comprehensive observability stack using Elysia framework, Drizzle ORM, and TSyringe dependency injection.

## 🏗️ Architecture Overview

This project follows **Clean Architecture** principles with clear separation of concerns across multiple domains:

```text
src/
├── core/                    # Business Logic Layer
│   ├── domain/             # Domain Layer
│   │   ├── auth/           # Authentication Domain
│   │   │   ├── entity/     # Auth Entities (RefreshToken)
│   │   │   ├── service/    # Domain Services & Interfaces
│   │   │   └── use-case/   # Auth Use Cases (SignIn, SignUp, etc.)
│   │   ├── posts/          # Posts Domain
│   │   │   ├── entity/     # Post Entities
│   │   │   ├── service/    # Domain Services & Interfaces
│   │   │   └── use-case/   # Posts Use Cases (CRUD Operations)
│   │   └── users/          # User Domain
│   │       ├── entity/     # Domain Entities
│   │       ├── service/    # Domain Services & Interfaces
│   │       └── use-case/   # Business Use Cases
│   └── shared/             # Shared Components
│       ├── container.ts    # DI Container Configuration
│       ├── tokens.ts       # DI Tokens
│       ├── common.entity.ts # Base Entity Class
│       ├── useCase.ts      # Use Case Interface
│       ├── logger/         # Logger Port
│       ├── errors/         # Error Handling
│       └── dtos/           # Data Transfer Objects
├── adapters/               # Interface Adapters
│   ├── auth/               # Authentication Controllers
│   │   ├── sign-up.controller.ts
│   │   ├── sign-in.controller.ts
│   │   ├── refresh-session.controller.ts
│   │   ├── logout.controller.ts
│   │   ├── auth.guard.ts   # JWT Authentication Guard
│   │   └── dtos/           # Auth DTOs
│   └── posts/              # Posts Controllers
│       ├── create-post.controller.ts
│       ├── get-all-posts.controller.ts
│       ├── get-post-by-id.controller.ts
│       ├── update-post-by-id.controller.ts
│       ├── delete-post-by-id.controller.ts
│       └── dtos/           # Post DTOs
├── external/               # External Layer
│   ├── api/                # Web API
│   │   ├── elysia-app.ts   # Elysia App Configuration
│   │   └── routes.ts       # Route Registration
│   ├── auth/               # Authentication Services
│   │   └── jwt-token.service.ts # JWT Service Implementation
│   ├── config/             # Configuration
│   │   ├── app-config.ts   # App Configuration
│   │   ├── auth.config.ts  # Auth Configuration
│   │   ├── cors.config.ts  # CORS Configuration
│   │   └── open-telemetry.config.ts # Observability Config
│   ├── drizzle/            # Database Layer
│   │   ├── schema.ts       # Database Schema
│   │   ├── connection.ts   # Database Connection
│   │   ├── migrations/     # Database Migrations
│   │   ├── auth/           # Auth Repository Implementation
│   │   ├── posts/          # Posts Repository Implementation
│   │   └── users/          # Users Repository Implementation
│   ├── logging/            # Logging Implementation
│   └── telemetry/          # OpenTelemetry Setup
├── test/                   # Test Files
└── index.ts                # Application Entry Point
```

## 🚀 Tech Stack

### Core Framework

- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Elysia (Fast web framework with TypeBox validation)
- **Language**: TypeScript
- **DI Container**: TSyringe (Dependency injection)

### Database & ORM

- **ORM**: Drizzle ORM (Type-safe SQL ORM)
- **Database**: PostgreSQL
- **Migrations**: Drizzle Kit

### Authentication & Security

- **Authentication**: JWT (JSON Web Tokens)
- **Token Strategy**: Access Token + Refresh Token pattern
- **Password Hashing**: Argon2id
- **CSRF Protection**: Custom CSRF token implementation
- **CORS**: Configurable cross-origin resource sharing

### API & Documentation

- **API Documentation**: Swagger/OpenAPI (via Elysia)
- **Validation**: TypeBox schema validation
- **HTTP Client**: Bearer token authentication

### Testing & Quality

- **Testing**: Vitest (Unit & E2E testing)
- **Linting**: Oxlint
- **Code Formatting**: Prettier
- **Git Hooks**: Husky

### Observability & Monitoring

- **Telemetry**: OpenTelemetry
- **Tracing**: OTLP (OpenTelemetry Protocol)
- **Logging**: Pino (High-performance logging)
- **Metrics**: Prometheus
- **Dashboards**: Grafana
- **Log Aggregation**: Loki
- **Log Collection**: Promtail

### Development & DevOps

- **Containerization**: Docker & Docker Compose
- **Hot Reload**: Bun development server
- **Environment**: dotenv configuration

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd clean-arch-backend
   ```

2. **Install dependencies**

   ```bash
   # Using pnpm (recommended)
   pnpm install

   # Or using bun
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

4. **Set up the database**

   ```bash
   # Generate migration files
   bun run db:generate

   # Apply migrations to database
   bun run db:migrate

   # Or push schema directly (for development)
   bun run db:push
   ```

## 🛠️ Development

### Available Scripts

```bash
# Development
bun run dev                    # Start development server with hot reload

# Database Operations
bun run db:generate           # Generate database migrations
bun run db:migrate            # Apply database migrations
bun run db:push               # Push schema to database (development only)

# Testing
bun run test                  # Run all tests
bun run test:watch            # Run tests in watch mode
bun run test:cov              # Run tests with coverage
bun run test:e2e              # Run end-to-end tests
```

### Running the Application

```bash
bun run dev
```

The server will start at `http://localhost:7000`

## 🐳 Docker & Observability Stack

This project now ships with a full Docker Compose setup that runs the API, PostgreSQL, and a Grafana/Prometheus/Loki observability stack.

```bash
docker compose up -d
```

The compose file builds the Bun application image, starts the database, and launches the monitoring services:

- **API** – `http://localhost:7000` (depends on the environment variables defined in the compose file)
- **PostgreSQL** – exposed on `localhost:5432`
- **Prometheus** – available at `http://localhost:9090`
- **Grafana** – available at `http://localhost:3000` (default credentials: `admin` / `admin`)
- **Loki** – log storage, queried via Grafana Explore

Promtail tails Docker container logs and pushes them to Loki. The OpenTelemetry Collector receives OTLP traces/metrics from the application and exposes them for Prometheus scraping. If you need additional metrics, enable the relevant OpenTelemetry instrumentation in the application and they will automatically flow into Prometheus/Grafana.

To tear everything down:

```bash
docker compose down -v
```

## 📚 API Endpoints

### Authentication

| Method | Endpoint        | Description                  | Authentication | Request Body                                        |
| ------ | --------------- | ---------------------------- | -------------- | --------------------------------------------------- |
| `POST` | `/auth/signup`  | Create a new user account    | None           | `{ name: string, email: string, password: string }` |
| `POST` | `/auth/signin`  | Sign in with credentials     | None           | `{ email: string, password: string }`               |
| `POST` | `/auth/refresh` | Refresh access token         | Refresh Token  | None (uses refresh token cookie + CSRF header)      |
| `POST` | `/auth/logout`  | Logout and invalidate tokens | Refresh Token  | None (uses refresh token cookie)                    |

### Posts Management (Protected Routes)

| Method   | Endpoint     | Description                     | Authentication | Request Body                                               |
| -------- | ------------ | ------------------------------- | -------------- | ---------------------------------------------------------- |
| `POST`   | `/posts`     | Create a new post               | JWT + CSRF     | `{ title: string, content: string }`                       |
| `GET`    | `/posts`     | Get all posts (with pagination) | JWT + CSRF     | Query: `?page=1&limit=10&search=term&sort=title&order=asc` |
| `GET`    | `/posts/:id` | Get post by ID                  | JWT + CSRF     | -                                                          |
| `PUT`    | `/posts/:id` | Update post by ID               | JWT + CSRF     | `{ title: string, content: string, status: string }`       |
| `DELETE` | `/posts/:id` | Delete post by ID               | JWT + CSRF     | -                                                          |

### Example Requests

#### Sign Up

```bash
curl -X POST http://localhost:7000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

#### Sign In

```bash
curl -X POST http://localhost:7000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

#### Create Post (Protected)

```bash
curl -X POST http://localhost:7000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my post"
  }'
```

#### Get All Posts (Protected)

```bash
curl -X GET "http://localhost:7000/posts?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN"
```

### Authentication Flow

1. **Sign Up/Sign In**: Receive access token (short-lived) and refresh token (long-lived, HTTP-only cookie)
2. **API Requests**: Use access token in Authorization header + CSRF token in X-CSRF-Token header
3. **Token Refresh**: When access token expires, use refresh endpoint with refresh token cookie + CSRF token
4. **Logout**: Invalidate refresh token and clear cookies

## 🏛️ Clean Architecture Layers

### 1. Domain Layer (`src/core/domain/`)

- **Entities**: Core business objects across three domains:
  - **Auth Domain**: User authentication, refresh tokens
  - **Posts Domain**: Post management entities
  - **Users Domain**: User profile and account management
- **Use Cases**: Business logic implementation for all domains
- **Services**: Domain service interfaces and contracts

### 2. Application Layer (`src/adapters/`)

- **Controllers**: Handle HTTP requests and responses for each domain
- **Guards**: Authentication and authorization middleware
- **DTOs**: Data Transfer Objects with TypeBox validation
- **Transformers**: Data transformation utilities

### 3. Infrastructure Layer (`src/external/`)

- **Database**: Drizzle ORM implementation with migrations
- **Web API**: Elysia framework setup with Swagger
- **Authentication**: JWT service implementation
- **Configuration**: Environment-based configuration management
- **Observability**: OpenTelemetry, logging, and monitoring setup

## 🔧 Dependency Injection

The project uses **TSyringe** for dependency injection with the following setup:

### Container Configuration

```typescript
// src/core/shared/container.ts
container.registerSingleton<BaseCollectionUser>(TOKENS.ICollectionUser, CollectionUserDrizzle);
```

### Token-based Injection

```typescript
// src/core/shared/tokens.ts
export const TOKENS = {
  ICollectionUser: Symbol('ICollectionUser'),
} as const;
```

### Usage in Use Cases

```typescript
@injectable()
export class CreateUserUseCase implements IUseCase<Input, void> {
  constructor(
    @inject(TOKENS.ICollectionUser)
    private readonly collection: BaseCollectionUser
  ) {}

  async execute(input: Input): Promise<void> {
    // Business logic implementation
  }
}
```

## 🗄️ Database Schema

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

## 🧪 Testing

The project uses **Vitest** for comprehensive testing with coverage support.

### Test Commands

```bash
# Run all tests
bun run test

# Run tests in watch mode (development)
bun run test:watch

# Run tests with coverage report
bun run test:cov

# Run end-to-end tests
bun run test:e2e
```

### Test Structure

```text
src/test/                    # Test files
├── unit/                    # Unit tests
├── integration/             # Integration tests
└── e2e/                     # End-to-end tests
```

### HTTP API Testing

The project includes comprehensive HTTP test files in the `src/adapters/` directory:

- **`src/adapters/auth/auth.http`** - Authentication API tests (Sign Up, Sign In, Refresh, Logout)
- **`src/adapters/posts/post.http`** - Posts management API tests (CRUD operations)

These files can be used directly in VS Code with the REST Client extension for interactive API testing.

## 📝 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Application
PORT=7000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# CSRF Protection
REFRESH_TOKEN_CSRF_SECRET=your-csrf-secret-key

# CORS
CORS_ORIGIN=http://localhost:3000

# OpenTelemetry (Optional)
OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=elysia-clean-architecture
```

## 📚 Documentation

### Core Documentation

- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Comprehensive development guide with architecture explanations
- **[DTOs.md](docs/DTOs.md)** - Data Transfer Objects documentation with TypeBox validation
- **[AUTH-README.md](docs/AUTH-README.md)** - Authentication system documentation and JWT implementation
- **[AUTH-FLOW-DIAGRAM.md](docs/AUTH-FLOW-DIAGRAM.md)** - Authentication flow diagrams and security details

### Module Documentation

- **[Modules](docs/modules/)** - Individual module/domain documentation
  - Each CRUD module has its own comprehensive README
  - Complete API documentation with examples
  - Database schema and business rules
  - Testing guides and usage examples

### Migration Documentation

- **[Migrations](docs/migrations/)** - Database migration records
  - Standalone migration documentation
  - Schema change tracking
  - Rollback plans and testing records

### API Documentation

- **Swagger UI**: Available at `http://localhost:7000/swagger` when server is running
- **OpenAPI Spec**: Auto-generated from Elysia TypeBox schemas
- **API Documentation**: Available in `docs/api-docs/` directory

### AI Specifications

- **[AI-SPEC.md](docs/ai-specs/AI-SPEC.md)** - AI development specifications and guidelines
- **[AI-CRUD-SPEC.md](docs/ai-specs/ai-spec-crud.md)** - CRUD operations specifications for AI development
- **[AI-CRUD-USAGE.md](docs/ai-specs/ai-crud-useage.md)** - Usage examples for AI-assisted development

### Architecture Documentation

- **Clean Architecture**: Multi-domain design with clear layer separation
- **Authentication System**: JWT + Refresh Token pattern with CSRF protection
- **Dependency Injection**: TSyringe container configuration and usage
- **Repository Pattern**: Abstract data access layer with Drizzle ORM implementation
- **Observability**: OpenTelemetry integration with comprehensive monitoring stack

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help, please open an issue in the repository.

## 🚀 Quick Start

For a complete development setup guide, see [DEVELOPMENT.md](docs/DEVELOPMENT.md).

For authentication system details, see [AUTH-README.md](docs/AUTH-README.md).

For DTO validation and API documentation, see [DTOs.md](docs/DTOs.md).

For AI development specifications, see [AI-SPEC.md](docs/ai-specs/AI-SPEC.md).

---

Built with ❤️ using Clean Architecture principles, JWT authentication, and modern TypeScript observability stack
