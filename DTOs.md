# DTOs (Data Transfer Objects) Documentation

## Overview

This project uses **Elysia's built-in TypeBox validation** (`t`) for DTOs instead of Zod. This choice provides:

- ✅ **Better Performance**: TypeBox is faster than Zod
- ✅ **Native Integration**: Built into Elysia framework
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Automatic Validation**: Request/response validation
- ✅ **OpenAPI Generation**: Automatic API documentation

## DTO Structure

### Location

```
src/core/shared/dtos/
├── UserDTOs.ts      # User-related DTOs
└── CommonDTOs.ts    # Shared/common DTOs
```

## User DTOs

### 1. Create User Request DTO

```typescript
export const CreateUserRequestDTO = t.Object({
  name: t.String({ minLength: 2, maxLength: 100 }),
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 6, maxLength: 100 }),
});
```

**Validation Rules:**

- `name`: 2-100 characters
- `email`: Valid email format
- `password`: 6-100 characters

### 2. Create User Response DTO

```typescript
export const CreateUserResponseDTO = t.Object({
  status: t.Number(),
  body: t.Object({
    mensagem: t.String(),
  }),
});
```

### 3. Get User Response DTO

```typescript
export const GetUserResponseDTO = t.Object({
  id: t.Optional(t.Number()),
  name: t.String(),
  email: t.String({ format: 'email' }),
  password: t.String(),
  created_at: t.Optional(t.Date()),
  updated_at: t.Optional(t.Date()),
});
```

### 4. Get Users Response DTO

```typescript
export const GetUsersResponseDTO = t.Array(GetUserResponseDTO);
```

### 5. Error Response DTO

```typescript
export const ErrorResponseDTO = t.Object({
  name: t.String(),
  message: t.String(),
});
```

## Controller Implementation

### Example: Create User Controller

```typescript
server.post(
  '/users',
  async ({ body, error }) => {
    try {
      const { name, email, password } = body as {
        name: string;
        email: string;
        password: string;
      };

      await this.useCase.execute({ name, email, password });

      return {
        status: 200,
        body: {
          mensagem: 'Usuario criado com sucesso',
        },
      };
    } catch (err) {
      return error(400, {
        name: 'Error',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
      });
    }
  },
  {
    body: CreateUserRequestDTO,
    response: {
      200: CreateUserResponseDTO,
      400: ErrorResponseDTO,
    },
    detail: {
      summary: 'Create a new user',
      description: 'Creates a new user with the provided information',
      tags: ['Users'],
    },
  }
);
```

## Validation Features

### 1. Request Validation

- **Automatic**: Elysia validates incoming requests
- **Type Safe**: TypeScript types are inferred
- **Error Handling**: Detailed validation error messages

### 2. Response Validation

- **Schema Enforcement**: Ensures response matches DTO
- **Type Safety**: Compile-time type checking
- **Documentation**: Auto-generates OpenAPI specs

### 3. Error Responses

```json
{
  "type": "validation",
  "on": "body",
  "property": "/email",
  "message": "Expected string to match 'email' format",
  "errors": [
    {
      "type": 50,
      "schema": {
        "format": "email",
        "type": "string"
      },
      "path": "/email",
      "value": "invalid-email",
      "message": "Expected string to match 'email' format"
    }
  ]
}
```

## API Testing Examples

### Valid Request

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Invalid Request (Validation Error)

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "invalid-email",
    "password": "123"
  }'
```

**Response:**

```json
{
  "type": "validation",
  "on": "body",
  "property": "/email",
  "message": "Expected string to match 'email' format",
  "errors": [
    {
      "type": 50,
      "schema": {
        "format": "email",
        "type": "string"
      },
      "path": "/email",
      "value": "invalid-email",
      "message": "Expected string to match 'email' format"
    },
    {
      "type": 52,
      "schema": {
        "minLength": 6,
        "maxLength": 100,
        "type": "string"
      },
      "path": "/password",
      "value": "123",
      "message": "Expected string length greater or equal to 6"
    }
  ]
}
```

## Benefits of Using Elysia's TypeBox

### vs Zod

| Feature         | Elysia TypeBox | Zod      |
| --------------- | -------------- | -------- |
| **Performance** | ⚡ Faster      | Slower   |
| **Bundle Size** | 📦 Smaller     | Larger   |
| **Integration** | 🔗 Native      | External |
| **Type Safety** | ✅ Full        | ✅ Full  |
| **Validation**  | ✅ Built-in    | ✅ Good  |
| **OpenAPI**     | ✅ Auto        | Manual   |

### Performance Benefits

- **Faster Validation**: TypeBox is optimized for speed
- **Smaller Bundle**: No external dependencies
- **Native Support**: Built into Elysia framework
- **Better DX**: Seamless TypeScript integration

## Adding New DTOs

### 1. Create DTO Definition

```typescript
// In UserDTOs.ts
export const NewFeatureRequestDTO = t.Object({
  field1: t.String({ minLength: 1 }),
  field2: t.Number({ minimum: 0 }),
  field3: t.Optional(t.Boolean()),
});
```

### 2. Add to Controller

```typescript
server.post(
  '/new-endpoint',
  async ({ body }) => {
    // Implementation
  },
  {
    body: NewFeatureRequestDTO,
    response: {
      200: SuccessResponseDTO,
      400: ErrorResponseDTO,
    },
  }
);
```

### 3. Export Types

```typescript
export type NewFeatureRequestDTOType = typeof NewFeatureRequestDTO;
```

## Best Practices

### 1. Naming Convention

- Use descriptive names: `CreateUserRequestDTO`
- Include operation: `Request`, `Response`, `Params`
- Be consistent: `DTO` suffix for all DTOs

### 2. Validation Rules

- Set appropriate limits: `minLength`, `maxLength`
- Use format validation: `email`, `date`, `uri`
- Make optional fields explicit: `t.Optional()`

### 3. Error Handling

- Provide meaningful error messages
- Use consistent error response format
- Include validation details in errors

### 4. Documentation

- Add OpenAPI details: `summary`, `description`, `tags`
- Document validation rules
- Provide example requests/responses

---

**DTOs provide type safety, validation, and documentation all in one! 🚀**
