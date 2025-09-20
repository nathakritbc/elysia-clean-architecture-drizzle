# API Testing Suite

This directory contains comprehensive test files for the Clean Architecture Backend API.

## 📁 Directory Structure

```
tests/
├── http/                    # HTTP test files
│   ├── users.http          # User management tests
│   ├── validation.http     # DTO validation tests
│   ├── performance.http    # Performance tests
│   ├── error-scenarios.http # Error handling tests
│   ├── health.http         # Health check tests
│   ├── all-tests.http      # Combined test suite
│   └── README.md           # HTTP testing guide
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Prerequisites
- VS Code with REST Client extension
- Server running on `http://localhost:3000`

### 2. Start Server
```bash
bun run dev
```

### 3. Run Tests
1. Open any `.http` file in VS Code
2. Click "Send Request" above each request
3. View responses in the editor

## 📋 Test Categories

### 🧪 **Core API Tests** (`users.http`)
- ✅ User creation (valid/invalid)
- ✅ User retrieval (single/all)
- ✅ Parameter validation
- ✅ Edge cases

### 🔍 **Validation Tests** (`validation.http`)
- ✅ DTO validation
- ✅ Input sanitization
- ✅ Security tests (SQL injection, XSS)
- ✅ Boundary value testing

### ⚡ **Performance Tests** (`performance.http`)
- ✅ Concurrent requests
- ✅ Bulk operations
- ✅ Response time validation
- ✅ Load testing

### ❌ **Error Scenarios** (`error-scenarios.http`)
- ✅ Invalid HTTP methods
- ✅ Malformed requests
- ✅ Non-existent endpoints
- ✅ Error response validation

### 🏥 **Health Checks** (`health.http`)
- ✅ Basic connectivity
- ✅ Service status
- ✅ API availability

## 🎯 Test Coverage

| Category | Coverage | Status |
|----------|----------|---------|
| **Happy Path** | ✅ Complete | All valid scenarios |
| **Validation** | ✅ Complete | All DTO validations |
| **Error Handling** | ✅ Complete | All error scenarios |
| **Security** | ✅ Complete | Injection attempts |
| **Performance** | ✅ Complete | Load testing |
| **Edge Cases** | ✅ Complete | Boundary values |

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PORT=3000
NODE_ENV=development
```

### VS Code Settings
```json
{
  "rest-client.environmentVariables": {
    "development": {
      "baseUrl": "http://localhost:3000",
      "contentType": "application/json"
    }
  }
}
```

## 📊 Expected Responses

### Success (200)
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
  "message": "Expected string to match 'email' format"
}
```

### Not Found (404)
```json
{
  "name": "NotFoundError",
  "message": "User not found"
}
```

## 🧪 Running Specific Tests

### User Management
```bash
# Open users.http in VS Code
# Click "Send Request" on desired test
```

### Validation Testing
```bash
# Open validation.http in VS Code
# Test edge cases and security scenarios
```

### Performance Testing
```bash
# Open performance.http in VS Code
# Run concurrent requests
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Ensure server is running
   bun run dev
   ```

2. **Validation Errors**
   ```bash
   # Check request format
   # Verify Content-Type header
   ```

3. **Database Errors**
   ```bash
   # Set up database
   bun run db:migrate
   ```

### Debug Commands
```bash
# Test with curl
curl -v http://localhost:3000/users

# Check server logs
bun run dev

# Validate JSON
echo '{"test": "value"}' | jq .
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
```

## 🎯 Best Practices

### Test Organization
- ✅ Group related tests together
- ✅ Use descriptive test names
- ✅ Include both positive and negative cases
- ✅ Test edge cases and boundary values

### Test Data
- ✅ Use realistic test data
- ✅ Include various data types
- ✅ Test special characters and Unicode
- ✅ Include security test cases

### Documentation
- ✅ Document expected responses
- ✅ Include setup instructions
- ✅ Provide troubleshooting guides
- ✅ Keep tests up to date

---

**Comprehensive API Testing Made Easy! 🚀**
