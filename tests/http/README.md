# HTTP Test Files

This directory contains HTTP test files for testing the API endpoints using REST Client extensions in VS Code or other compatible editors.

## 📁 File Organization

### `users.http`
- **Purpose**: Core user management API tests
- **Endpoints**: POST /users, GET /users, GET /users/:id
- **Tests**: Valid requests, invalid requests, edge cases

### `validation.http`
- **Purpose**: DTO validation testing
- **Tests**: Edge cases, malformed data, security tests
- **Focus**: Input validation and sanitization

### `performance.http`
- **Purpose**: Performance and load testing
- **Tests**: Concurrent requests, bulk operations
- **Focus**: Response times and system stability

### `error-scenarios.http`
- **Purpose**: Error handling testing
- **Tests**: Invalid methods, malformed requests, edge cases
- **Focus**: Error responses and status codes

### `health.http`
- **Purpose**: Health check and monitoring
- **Tests**: Basic connectivity, service status
- **Focus**: System availability

## 🚀 How to Use

### Prerequisites
1. Install REST Client extension in VS Code
2. Start the development server: `bun run dev`
3. Ensure server is running on `http://localhost:3000`

### Running Tests

#### Method 1: VS Code REST Client
1. Open any `.http` file
2. Click "Send Request" above each request
3. View response in the editor

#### Method 2: Command Line (curl)
```bash
# Example: Test user creation
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

#### Method 3: Postman/Insomnia
Import the requests from the HTTP files into your preferred API testing tool.

## 📋 Test Categories

### ✅ **Happy Path Tests**
- Valid user creation
- Successful user retrieval
- Proper response formats

### ❌ **Error Handling Tests**
- Invalid input validation
- Malformed requests
- Non-existent resources

### 🔒 **Security Tests**
- SQL injection attempts
- XSS attempts
- Input sanitization

### ⚡ **Performance Tests**
- Concurrent requests
- Bulk operations
- Response time validation

### 🧪 **Edge Case Tests**
- Boundary values
- Special characters
- Unicode support

## 🎯 Test Scenarios

### User Creation Tests
```http
### Valid Request
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Validation Tests
```http
### Invalid Email
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "invalid-email",
  "password": "password123"
}
```

### Error Tests
```http
### Non-existent User
GET http://localhost:3000/users/999
```

## 📊 Expected Responses

### Success Response (200)
```json
{
  "status": 200,
  "body": {
    "mensagem": "Usuario criado com sucesso"
  }
}
```

### Validation Error (400)
```json
{
  "type": "validation",
  "on": "body",
  "property": "/email",
  "message": "Expected string to match 'email' format",
  "errors": [...]
}
```

### Not Found Error (404)
```json
{
  "name": "NotFoundError",
  "message": "User not found"
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PORT=3000
NODE_ENV=development
```

### Server Setup
```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Server will be available at http://localhost:3000
```

## 📝 Adding New Tests

### 1. Create New Test File
```http
### New Test
POST {{baseUrl}}/new-endpoint
Content-Type: {{contentType}}

{
  "field": "value"
}
```

### 2. Add to Existing File
```http
### Additional Test
GET {{baseUrl}}/users/{{userId}}
```

### 3. Use Variables
```http
### Variables
@baseUrl = http://localhost:3000
@userId = 1

### Test with Variable
GET {{baseUrl}}/users/{{userId}}
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure server is running: `bun run dev`
   - Check port: Default is 3000

2. **Validation Errors**
   - Check request format
   - Verify Content-Type header
   - Validate JSON syntax

3. **Database Errors**
   - Set up database connection
   - Run migrations: `bun run db:migrate`
   - Check DATABASE_URL

### Debug Tips

1. **Check Server Logs**
   ```bash
   bun run dev
   # Watch console for errors
   ```

2. **Test with curl**
   ```bash
   curl -v http://localhost:3000/users
   ```

3. **Validate JSON**
   ```bash
   echo '{"test": "value"}' | jq .
   ```

---

**Happy Testing! 🚀**
