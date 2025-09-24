# Authentication System Documentation

## Overview

ระบบ Authentication ของแอปพลิเคชันนี้ใช้ JWT (JSON Web Token) ร่วมกับ Refresh Token pattern เพื่อความปลอดภัยและประสิทธิภาพ โดยใช้ Clean Architecture pattern และ Dependency Injection

## Architecture

### Core Components

1. **Domain Layer** (`src/core/domain/auth/`)
   - **Entities**: User, RefreshToken
   - **Use Cases**: SignIn, SignUp, RefreshSession, Logout
   - **Services**: AuthTokenService, RefreshTokenRepository

2. **Adapters Layer** (`src/adapters/auth/`)
   - **Controllers**: HTTP controllers สำหรับแต่ละ endpoint
   - **Guards**: Authentication middleware
   - **DTOs**: Data Transfer Objects

3. **External Layer** (`src/external/auth/`)
   - **JWT Service**: JWT token generation และ validation
   - **Config**: Authentication configuration

## Authentication Flow

### 1. Sign Up Process

```
User → POST /auth/signup → SignUpController → SignUpUseCase → UserRepository → Database
```

### 2. Sign In Process

```
User → POST /auth/signin → SignInController → SignInUseCase → UserRepository → JWT Service
```

### 3. Token Refresh Process

```
User → POST /auth/refresh → RefreshController → RefreshSessionUseCase → RefreshTokenRepository
```

### 4. Logout Process

```
User → POST /auth/logout → LogoutController → LogoutUseCase → RefreshTokenRepository
```

## Security Features

### JWT Token Structure

- **Access Token**: ใช้สำหรับ API calls (อายุสั้น)
- **Refresh Token**: ใช้สำหรับ refresh access token (อายุยาว)
- **JTI (JWT ID)**: Unique identifier สำหรับ token tracking

### Password Security

- ใช้ Argon2id สำหรับ password hashing
- Salt และ memory cost ที่เหมาะสม

### Token Security

- Refresh token ถูก hash ก่อนเก็บใน database
- JTI ใช้สำหรับ token revocation
- Automatic token revocation เมื่อ sign in ใหม่

## Use Cases

### BaseAuthUseCase

Base class ที่มี common logic สำหรับ:

- Token generation
- User preparation
- Refresh token management

### BaseLogoutUseCase

Base class สำหรับ logout operations:

- Token validation
- Token revocation

### Specific Use Cases

#### SignInUseCase

- Validate user credentials
- Generate tokens
- Revoke existing tokens

#### SignUpUseCase

- Create new user
- Hash password
- Generate initial tokens

#### RefreshSessionUseCase

- Validate refresh token
- Generate new tokens
- Revoke old refresh token

#### LogoutUseCase

- Validate refresh token
- Revoke token

## API Endpoints

### Authentication Endpoints

| Method | Endpoint        | Description          | Request Body              |
| ------ | --------------- | -------------------- | ------------------------- |
| POST   | `/auth/signup`  | Register new user    | `{name, email, password}` |
| POST   | `/auth/signin`  | Sign in user         | `{email, password}`       |
| POST   | `/auth/refresh` | Refresh access token | `{refreshToken}`          |
| POST   | `/auth/logout`  | Logout user          | `{refreshToken}`          |

### Protected Endpoints

Protected endpoints ต้องมี `Authorization: Bearer <access_token>` header

## Configuration

### Environment Variables

```env
JWT_SECRET=your-secret-key
JWT_ISSUER=your-app-name
JWT_AUDIENCE=your-audience
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
```

### Auth Config

```typescript
interface AuthConfig {
  jwt: {
    secret: string;
    issuer: string;
    audience?: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
  cookies: {
    accessTokenCookie: CookieConfig;
    refreshTokenCookie: CookieConfig;
    accessTokenCsrfCookie: CookieConfig;
    refreshTokenCsrfCookie: CookieConfig;
  };
}
```

## Error Handling

### Common Errors

- `401 Unauthorized`: Invalid credentials หรือ expired token
- `409 Conflict`: Email already exists (signup)
- `400 Bad Request`: Invalid request format

### Error Response Format

```json
{
  "error": "Error message",
  "statusCode": 401,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  jti VARCHAR(255) UNIQUE NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL
);
```

## Security Best Practices

1. **Token Rotation**: Refresh token ถูก revoke และสร้างใหม่ทุกครั้ง
2. **Secure Cookies**: ใช้ HttpOnly และ Secure flags
3. **CSRF Protection**: ใช้ CSRF tokens
4. **Password Hashing**: ใช้ Argon2id algorithm
5. **Token Expiration**: Access token อายุสั้น, Refresh token อายุยาว
6. **Input Validation**: Validate ทุก input
7. **Error Handling**: ไม่ expose sensitive information

## Testing

### Unit Tests

- Use case tests
- Service tests
- Entity tests

### Integration Tests

- Controller tests
- End-to-end authentication flow

### Test Commands

```bash
# Run all tests
npm test

# Run auth tests only
npm test -- --grep "auth"

# Run with coverage
npm run test:coverage
```

## Monitoring and Logging

### Logging

- Authentication attempts
- Token generation
- Security events
- Error tracking

### Metrics

- Login success/failure rates
- Token refresh frequency
- Session duration

## Troubleshooting

### Common Issues

1. **Token Expired**
   - ใช้ refresh token เพื่อ get new access token
   - ถ้า refresh token expired ต้อง sign in ใหม่

2. **Invalid Token**
   - ตรวจสอบ token format
   - ตรวจสอบ token signature
   - ตรวจสอบ token expiration

3. **CSRF Token Mismatch**
   - ตรวจสอบ CSRF token ใน request
   - ตรวจสอบ cookie settings

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
2. **OAuth Integration**
3. **Session Management**
4. **Device Tracking**
5. **Audit Logging**
