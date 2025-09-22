# Auth Use Cases Refactoring

## Overview
This directory contains refactored authentication use cases that use base classes to share common logic and reduce code duplication.

## Design Patterns Used

### 1. Template Method Pattern
- **BaseAuthUseCase**: Provides common token generation and user management logic
- **BaseLogoutUseCase**: Provides common token validation and revocation logic

### 2. Inheritance Hierarchy
```
BaseAuthUseCase (abstract)
├── SignInUseCase
├── SignUpUseCase
└── RefreshSessionUseCase

BaseLogoutUseCase (abstract)
└── LogoutUseCase
```

## Base Classes

### BaseAuthUseCase
**Purpose**: Handles authentication flows that return `AuthenticatedUser`

**Common Methods**:
- `generateTokensForUser(user)`: Generates tokens and revokes existing ones
- `generateTokensForUserWithoutRevoke(user)`: Generates tokens without revoking existing ones
- `revokeRefreshTokenByJti(jti)`: Revokes refresh token by JTI

**Dependencies**:
- `UserRepository`
- `RefreshTokenRepository`
- `AuthTokenService`

### BaseLogoutUseCase
**Purpose**: Handles logout-related operations

**Common Methods**:
- `validateRefreshToken(token)`: Validates refresh token format and extracts JTI
- `revokeRefreshTokenByJti(jti)`: Revokes refresh token by JTI

**Dependencies**:
- `RefreshTokenRepository`

## Benefits

1. **Code Reuse**: Common logic is centralized in base classes
2. **Consistency**: All auth use cases follow the same patterns
3. **Maintainability**: Changes to common logic only need to be made in one place
4. **Type Safety**: Generic base classes provide type safety
5. **Separation of Concerns**: Each use case focuses on its specific business logic

## Usage Example

```typescript
@injectable()
export class SignInUseCase extends BaseAuthUseCase<SignInInput, AuthenticatedUser> {
  async execute(input: SignInInput): Promise<AuthenticatedUser> {
    // Specific business logic
    const user = await this.userRepository.getByEmail(input.email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await user.comparePassword(input.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Use common token generation logic
    return await this.generateTokensForUser(user);
  }
}
```

## Files Structure

```
use-case/
├── base-auth.usecase.ts          # Base class for auth flows
├── base-logout.usecase.ts       # Base class for logout flows
├── sign-in.usecase.ts           # Sign in implementation
├── sign-up.usecase.ts           # Sign up implementation
├── refresh-session.usecase.ts   # Refresh session implementation
├── logout.usecase.ts            # Logout implementation
└── README.md                    # This documentation
```
