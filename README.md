# Elysia Architecture Backend with Drizzle ORM

A modern TypeScript backend application built with Clean Architecture principles, using Elysia framework, Drizzle ORM, and TSyringe dependency injection.

## 🏗️ Architecture Overview

This project follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── core/                    # Business Logic Layer
│   ├── domain/             # Domain Layer
│   │   └── users/          # User Domain
│   │       ├── entity/     # Domain Entities
│   │       ├── service/    # Domain Services & Interfaces
│   │       └── use-case/   # Business Use Cases
│   └── shared/             # Shared Components
│       ├── container.ts    # DI Container Configuration
│       ├── tokens.ts       # DI Tokens
│       ├── Entity.ts       # Base Entity Class
│       ├── UseCase.ts      # Use Case Interface
│       └── dtos/           # Data Transfer Objects
├── adapters/               # Interface Adapters
│   └── users/              # User Controllers
│       ├── createUser.controller.ts
│       ├── findUserById.controller.ts
│       └── findUsers.controller.ts
├── external/               # External Layer
│   ├── api/                # Web API
│   │   ├── config.ts       # Elysia App Configuration
│   │   └── routes.ts       # Route Registration
│   └── drizzle/            # Database Layer
│       ├── schema.ts       # Database Schema
│       ├── connection.ts   # Database Connection
│       ├── migrations/     # Database Migrations
│       └── users/          # User Repository Implementation
├── test/                   # Test Files
└── index.ts                # Application Entry Point
```

## 🚀 Tech Stack

- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Elysia (Fast web framework with TypeBox validation)
- **ORM**: Drizzle ORM (Type-safe SQL ORM)
- **Database**: PostgreSQL
- **DI Container**: TSyringe (Dependency injection)
- **Testing**: Vitest (Unit & E2E testing)
- **Language**: TypeScript
- **API Documentation**: Swagger/OpenAPI (via Elysia)

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

The server will start at `http://localhost:3000`

## 📚 API Endpoints

### User Management

| Method | Endpoint     | Description       | Request Body                                        |
| ------ | ------------ | ----------------- | --------------------------------------------------- |
| `POST` | `/users`     | Create a new user | `{ name: string, email: string, password: string }` |
| `GET`  | `/users`     | Get all users     | -                                                   |
| `GET`  | `/users/:id` | Get user by ID    | -                                                   |

### Example Requests

**Create User**

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

**Get All Users**

```bash
curl http://localhost:3000/users
```

**Get User by ID**

```bash
curl http://localhost:3000/users/1
```

## 🏛️ Clean Architecture Layers

### 1. Domain Layer (`src/core/domain/`)

- **Entities**: Core business objects (`User.ts`)
- **Use Cases**: Business logic implementation
- **Services**: Domain service interfaces

### 2. Application Layer (`src/adapters/`)

- **Controllers**: Handle HTTP requests and responses
- **DTOs**: Data Transfer Objects with TypeBox validation
- **Presenters**: Format data for external interfaces

### 3. Infrastructure Layer (`src/external/`)

- **Database**: Drizzle ORM implementation with migrations
- **Web API**: Elysia framework setup with Swagger
- **External Services**: Third-party integrations

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

### User Table

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

```
src/test/                    # Test files
├── unit/                    # Unit tests
├── integration/             # Integration tests
└── e2e/                     # End-to-end tests
```

### HTTP API Testing

The project includes comprehensive HTTP test files in the `tests/` directory:

- **`tests/http/users.http`** - User management API tests
- **`tests/http/validation.http`** - DTO validation tests
- **`tests/http/performance.http`** - Performance and load tests
- **`tests/http/error-scenarios.http`** - Error handling tests
- **`tests/http/health.http`** - Health check tests

See [tests/README.md](tests/README.md) for detailed testing instructions.

## 📝 Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PORT=3000
NODE_ENV=development
```

## 📚 Documentation

### Core Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Comprehensive development guide with architecture explanations
- **[DTOs.md](DTOs.md)** - Data Transfer Objects documentation with TypeBox validation
- **[tests/README.md](tests/README.md)** - HTTP API testing guide and examples

### API Documentation

- **Swagger UI**: Available at `http://localhost:3000/swagger` when server is running
- **OpenAPI Spec**: Auto-generated from Elysia TypeBox schemas

### Architecture Documentation

- **Clean Architecture**: Domain-driven design with clear layer separation
- **Dependency Injection**: TSyringe container configuration and usage
- **Repository Pattern**: Abstract data access layer with Drizzle ORM implementation

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

For a complete development setup guide, see [DEVELOPMENT.md](DEVELOPMENT.md).

For DTO validation and API documentation, see [DTOs.md](DTOs.md).

For HTTP API testing, see [tests/README.md](tests/README.md).

---

**Built with ❤️ using Clean Architecture principles and modern TypeScript stack**
