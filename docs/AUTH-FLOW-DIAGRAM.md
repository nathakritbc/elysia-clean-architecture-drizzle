# Authentication Flow Diagrams

## 1. Complete Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant API as API Server
    participant UC as Use Cases
    participant DB as Database
    participant JWT as JWT Service

    Note over U,JWT: Sign Up Flow
    U->>C: Enter credentials
    C->>API: POST /auth/signup
    API->>UC: SignUpUseCase
    UC->>DB: Check if email exists
    DB-->>UC: User not found
    UC->>DB: Create user with hashed password
    DB-->>UC: User created
    UC->>JWT: Generate tokens
    JWT-->>UC: Access + Refresh tokens
    UC->>DB: Store refresh token
    UC-->>API: AuthenticatedUser
    API-->>C: Set cookies + return user
    C-->>U: Registration successful

    Note over U,JWT: Sign In Flow
    U->>C: Enter credentials
    C->>API: POST /auth/signin
    API->>UC: SignInUseCase
    UC->>DB: Find user by email
    DB-->>UC: User found
    UC->>UC: Validate password
    UC->>DB: Revoke existing tokens
    UC->>JWT: Generate new tokens
    JWT-->>UC: Access + Refresh tokens
    UC->>DB: Store refresh token
    UC-->>API: AuthenticatedUser
    API-->>C: Set cookies + return user
    C-->>U: Login successful

    Note over U,JWT: Protected Request Flow
    U->>C: Make API request
    C->>API: Request with Bearer token
    API->>API: Validate JWT token
    API->>UC: Process request
    UC-->>API: Response
    API-->>C: Response
    C-->>U: Data

    Note over U,JWT: Token Refresh Flow
    U->>C: Access token expired
    C->>API: POST /auth/refresh
    API->>UC: RefreshSessionUseCase
    UC->>DB: Validate refresh token
    DB-->>UC: Token valid
    UC->>DB: Revoke old refresh token
    UC->>JWT: Generate new tokens
    JWT-->>UC: New tokens
    UC->>DB: Store new refresh token
    UC-->>API: AuthenticatedUser
    API-->>C: Set new cookies
    C-->>U: Tokens refreshed

    Note over U,JWT: Logout Flow
    U->>C: Logout request
    C->>API: POST /auth/logout
    API->>UC: LogoutUseCase
    UC->>DB: Revoke refresh token
    DB-->>UC: Token revoked
    UC-->>API: Success
    API-->>C: Clear cookies
    C-->>U: Logged out
```

## 2. Use Case Architecture Diagram

```mermaid
classDiagram
    class BaseAuthUseCase {
        <<abstract>>
        +generateTokensForUser(user)
        +generateTokensForUserWithoutRevoke(user)
        +revokeRefreshTokenByJti(jti)
        +validateRefreshTokenFormat(token)
        +validateAndRetrieveRefreshToken(token)
    }

    class BaseLogoutUseCase {
        <<abstract>>
        +validateRefreshToken(token)
        +revokeRefreshTokenByJti(jti)
    }

    class SignInUseCase {
        +execute(input: SignInInput)
        -validateCredentials()
        -generateTokens()
    }

    class SignUpUseCase {
        +execute(input: SignUpInput)
        -checkEmailExists()
        -createUser()
        -generateTokens()
    }

    class RefreshSessionUseCase {
        +execute(input: RefreshSessionInput)
        -validateRefreshToken()
        -revokeOldToken()
        -generateNewTokens()
    }

    class LogoutUseCase {
        +execute(input: LogoutInput)
        -validateRefreshToken()
        -revokeToken()
    }

    class AuthenticatedUser {
        +user: IUser
        +tokens: GeneratedAuthTokens
    }

    class LogoutOutput {
        +success: boolean
    }

    BaseAuthUseCase <|-- SignInUseCase
    BaseAuthUseCase <|-- SignUpUseCase
    BaseAuthUseCase <|-- RefreshSessionUseCase
    BaseLogoutUseCase <|-- LogoutUseCase

    SignInUseCase --> AuthenticatedUser
    SignUpUseCase --> AuthenticatedUser
    RefreshSessionUseCase --> AuthenticatedUser
    LogoutUseCase --> LogoutOutput
```

## 3. JWT Token Flow Diagram

```mermaid
flowchart TD
    A[User Login] --> B[Validate Credentials]
    B --> C{Valid?}
    C -->|No| D[Return 401 Error]
    C -->|Yes| E[Generate JWT Access Token]
    E --> F[Generate Refresh Token]
    F --> G[Hash Refresh Token]
    G --> H[Store Refresh Token in DB]
    H --> I[Set HTTP-Only Cookies]
    I --> J[Return User + Tokens]

    K[API Request] --> L[Extract Bearer Token]
    L --> M[Verify JWT Signature]
    M --> N{Valid Token?}
    N -->|No| O[Return 401 Error]
    N -->|Yes| P[Check Token Expiration]
    P --> Q{Expired?}
    Q -->|Yes| R[Return 401 Error]
    Q -->|No| S[Extract User ID]
    S --> T[Process Request]

    U[Token Refresh] --> V[Extract Refresh Token]
    V --> W[Validate Refresh Token]
    W --> X{Valid?}
    X -->|No| Y[Return 401 Error]
    X -->|Yes| Z[Revoke Old Refresh Token]
    Z --> AA[Generate New Access Token]
    AA --> BB[Generate New Refresh Token]
    BB --> CC[Store New Refresh Token]
    CC --> DD[Return New Tokens]

    EE[Logout] --> FF[Extract Refresh Token]
    FF --> GG[Revoke Refresh Token]
    GG --> HH[Clear Cookies]
    HH --> II[Return Success]
```

## 4. Security Architecture Diagram

```mermaid
graph TB
    subgraph "Client Side"
        A[Browser]
        B[HTTP-Only Cookies]
        C[CSRF Token]
    end

    subgraph "API Gateway"
        D[Elysia Server]
        E[Auth Guard]
        F[JWT Middleware]
    end

    subgraph "Authentication Layer"
        G[Auth Controllers]
        H[Use Cases]
        I[JWT Service]
        J[Password Hashing]
    end

    subgraph "Data Layer"
        K[User Repository]
        L[Refresh Token Repository]
        M[PostgreSQL Database]
    end

    subgraph "Security Features"
        N[Argon2id Hashing]
        O[Token Rotation]
        P[CSRF Protection]
        Q[Secure Cookies]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    H --> J
    I --> K
    I --> L
    K --> M
    L --> M
    J --> N
    I --> O
    D --> P
    D --> Q
```

## 5. Database Schema Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar name
        varchar password_hash
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar jti UK
        varchar token_hash
        timestamp expires_at
        timestamp revoked_at
        timestamp created_at
    }

    USERS ||--o{ REFRESH_TOKENS : "has many"
```

## 6. Error Handling Flow

```mermaid
flowchart TD
    A[API Request] --> B{Authentication Required?}
    B -->|No| C[Process Request]
    B -->|Yes| D[Check Authorization Header]
    D --> E{Token Present?}
    E -->|No| F[Return 401 Unauthorized]
    E -->|Yes| G[Validate JWT Token]
    G --> H{Valid Token?}
    H -->|No| I[Return 401 Invalid Token]
    H -->|Yes| J[Check Token Expiration]
    J --> K{Expired?}
    K -->|Yes| L[Return 401 Token Expired]
    K -->|No| M[Extract User ID]
    M --> N[Process Request]
    N --> O{Success?}
    O -->|Yes| P[Return Response]
    O -->|No| Q[Return Error Response]
```

## 7. Cookie Management Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    Note over C,DB: Setting Cookies
    C->>S: Login Request
    S->>S: Generate Tokens
    S->>DB: Store Refresh Token
    S->>C: Set-Cookie: access_token=xxx; HttpOnly; Secure; SameSite=Strict
    S->>C: Set-Cookie: refresh_token=xxx; HttpOnly; Secure; SameSite=Strict
    S->>C: Set-Cookie: csrf_token=xxx; HttpOnly; Secure; SameSite=Strict

    Note over C,DB: Using Cookies
    C->>S: API Request with Cookies
    S->>S: Extract tokens from cookies
    S->>S: Validate tokens
    S->>C: Response

    Note over C,DB: Clearing Cookies
    C->>S: Logout Request
    S->>DB: Revoke refresh token
    S->>C: Set-Cookie: access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT
    S->>C: Set-Cookie: refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT
    S->>C: Set-Cookie: csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT
```
