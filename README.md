# Elysia Clean Architecture Backend with JWT Authentication

A modern TypeScript backend application built with Clean Architecture principles, featuring JWT authentication, posts management, and comprehensive observability stack using Elysia framework, Drizzle ORM, and TSyringe dependency injection.

## 🏗️ Architecture Overview

The codebase is organised as a modular clean-architecture monolith. Each business capability lives under `src/modules/<domain>` and carries its own domain, application, interface, infrastructure, and tests. A thin `platform` layer wires modules into the runtime, and a `shared` layer exposes framework-agnostic primitives used across modules.

```text
src/
├── modules/
│   ├── auth/                # Authentication domain & session flows
│   │   ├── domain/          # Entities & ports (refresh tokens, JWT service)
│   │   ├── application/     # Use cases (sign-in, sign-up, refresh, logout)
│   │   ├── interface/http/  # Controllers, DTOs, guard, REST specs
│   │   └── infrastructure/  # Drizzle repositories, JWT provider, config
│   ├── accounts/            # User aggregate powering authentication
│   └── content/             # Posts CRUD (use cases, controllers, persistence)
├── platform/
│   ├── di/                  # Container, tokens, module registry
│   ├── http/                # Elysia app bootstrap, global routes (health)
│   ├── config/              # App-level configuration providers
│   ├── database/            # Drizzle connection, schema, migrations
│   ├── logging/             # Pino logger adapter
│   └── observability/       # OpenTelemetry helpers
├── shared/
│   ├── kernel/              # Base entity/value types, status enum
│   ├── errors/              # Error mapper & custom errors
│   ├── utils/               # Helpers (cookie builder, duration parsing, etc.)
│   ├── logging/             # Logger port
│   └── dtos/                # Common DTO definitions
├── test/                    # Global test utilities & suites
└── index.ts                 # Application entry point (module bootstrap)
```

The module registry composes the application at runtime by registering module dependencies and routes in `platform/http/routes.ts`. Authentication refresh now accepts the refresh token from either the request body or the HTTP-only cookie, preserving backward compatibility with existing clients.

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
3. **Token Refresh**: When the access token expires, call `/auth/refresh` with the CSRF header; the endpoint accepts the refresh token from the HTTP-only cookie or an optional JSON payload, so existing clients remain compatible.
4. **Logout**: Invalidate refresh token and clear cookies

## 🏛️ Clean Architecture Layers

### 1. Modules (`src/modules/*`)

- **Domain**: Entities, value objects, and repository ports for each capability (`auth`, `accounts`, `content`).
- **Application**: Use cases and base classes orchestrating domain logic. Example: `auth` use cases handle sign-in/sign-up/refresh by depending on accounts and refresh-token ports through module tokens.
- **Interface (HTTP)**: Controllers, DTOs, and guards that expose each module over REST. Controllers resolve dependencies through DI and register their routes via the module definition.
- **Infrastructure**: Drizzle repositories, providers, and configuration bound to module-specific ports.

### 2. Platform Layer (`src/platform/*`)

- **DI & Routing**: Container, tokens, `ModuleRegistry`, and HTTP bootstrap.
- **Config & Database**: Centralised configuration readers, Drizzle connection, and migration assets.
- **Cross-Cutting Services**: Logging adapter, health checks, telemetry helpers, and other runtime glue shared by modules.

### 3. Shared Layer (`src/shared/*`)

- **Kernel**: Base entity/value types, status enums, and use-case contracts.
- **Errors & DTOs**: Common error mapper and reusable DTO schemas.
- **Utilities**: Cookie builders, duration helpers, function utilities, and logger port used across modules.

## 🔧 Dependency Injection

Dependency injection is powered by **TSyringe**. The platform container provides global infrastructure (app config, logger), while each module registers its own bindings through its module definition.

### Platform Container

```typescript
// src/platform/di/container.ts
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
    @inject(AccountsModuleTokens.UserRepository) private readonly users: UserRepository,
    @inject(AuthModuleTokens.RefreshTokenRepository) private readonly refreshTokens: RefreshTokenRepository,
    @inject(AuthModuleTokens.AuthTokenService) private readonly tokens: AuthTokenService
  ) {
    super(users, refreshTokens, tokens);
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

The project includes comprehensive HTTP test files in the `src/modules` directory:

- **`src/modules/auth/interface/http/auth.http`** – Authentication API tests (Sign Up, Sign In, Refresh, Logout)
- **`src/modules/content/interface/http/post.http`** – Posts management API tests (CRUD operations)

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

### Development Tools & Automation

- **[Development Scripts](scripts/)** - Automation tools for development workflow
  - `new-module.sh` - Generate new CRUD module structure
  - `test-module.sh` - Comprehensive module testing
  - `deploy-check.sh` - Pre-deployment validation
- **[Code Review Checklist](docs/CODE-REVIEW-CHECKLIST.md)** - Comprehensive review guidelines
- **[Health Check System](src/shared/health/)** - Application health monitoring

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
