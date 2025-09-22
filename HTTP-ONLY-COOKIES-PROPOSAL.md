# HTTP-Only Cookies Proposal

## Overview
ปรับปรุงระบบ authentication ให้ใช้ HTTP-only cookies ทั้งหมด แทนการส่ง tokens ใน response body

## Changes Required

### 1. Update Auth Response DTO
```typescript
// Before
export const AuthResponseDto = t.Object({
  user: UserResponseDto,
  accessToken: t.String(),
  accessTokenExpiresAt: t.Date(),
  refreshTokenExpiresAt: t.Date(),
  csrf_token: t.String(),
});

// After
export const AuthResponseDto = t.Object({
  user: UserResponseDto,
  // No tokens in response body - all in cookies
});
```

### 2. Update Cookie Configuration
```typescript
// auth.config.ts
export const authConfig: AuthConfig = {
  // ... existing config
  accessTokenCookie: {
    name: process.env.ACCESS_TOKEN_COOKIE_NAME ?? 'access_token',
    path: process.env.ACCESS_TOKEN_COOKIE_PATH ?? '/',
    domain: process.env.ACCESS_TOKEN_COOKIE_DOMAIN,
    sameSite: normalizeSameSite(process.env.ACCESS_TOKEN_COOKIE_SAME_SITE),
    secure: normalizeBoolean(process.env.ACCESS_TOKEN_COOKIE_SECURE, cookieSecureDefault),
    httpOnly: true, // ← HTTP-only
    maxAgeSeconds: durationToSeconds(accessTokenExpiresIn, DEFAULT_ACCESS_TOKEN_EXPIRES_IN),
  },
  refreshTokenCookie: {
    name: process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'refresh_token',
    path: process.env.REFRESH_TOKEN_COOKIE_PATH ?? '/',
    domain: process.env.REFRESH_TOKEN_COOKIE_DOMAIN,
    sameSite: normalizeSameSite(process.env.REFRESH_TOKEN_COOKIE_SAME_SITE),
    secure: normalizeBoolean(process.env.REFRESH_TOKEN_COOKIE_SECURE, cookieSecureDefault),
    httpOnly: true, // ← HTTP-only
    maxAgeSeconds: durationToSeconds(refreshTokenExpiresIn, DEFAULT_REFRESH_TOKEN_EXPIRES_IN),
  },
  refreshTokenCsrfCookie: {
    name: process.env.REFRESH_TOKEN_CSRF_COOKIE_NAME ?? 'refresh_token_csrf',
    path: process.env.REFRESH_TOKEN_CSRF_COOKIE_PATH ?? '/',
    domain: process.env.REFRESH_TOKEN_CSRF_COOKIE_DOMAIN,
    sameSite: normalizeSameSite(process.env.REFRESH_TOKEN_CSRF_COOKIE_SAME_SITE),
    secure: normalizeBoolean(process.env.REFRESH_TOKEN_CSRF_COOKIE_SECURE, cookieSecureDefault),
    httpOnly: true, // ← HTTP-only
    maxAgeSeconds: durationToSeconds(refreshTokenExpiresIn, DEFAULT_REFRESH_TOKEN_EXPIRES_IN),
  },
};
```

### 3. Update Base Auth Controller
```typescript
// base-auth.controller.ts
export class BaseAuthController {
  protected setAuthCookies(set: unknown, tokens: AuthTokens): void {
    const csrfToken = nanoid();
    const cookies = [
      // Access token cookie
      buildAccessTokenCookie(tokens.accessToken, tokens.accessTokenExpiresAt, this.authConfig),
      // Refresh token cookie
      buildRefreshTokenCookie(tokens.refreshToken, tokens.refreshTokenExpiresAt, this.authConfig),
      // CSRF token cookie
      buildRefreshTokenCsrfCookie(csrfToken, tokens.refreshTokenExpiresAt, this.authConfig),
    ];

    this.setCookies(set, cookies);
  }

  protected createAuthResponse(user: IUser, tokens: AuthTokens) {
    return {
      user: toUserResponse(user),
      // No tokens in response body
    };
  }
}
```

### 4. Update Auth Guard
```typescript
// auth.guard.ts
export class AuthGuard {
  async validate(request: Request): Promise<IUser> {
    // Extract access token from cookie instead of Authorization header
    const cookies = this.parseRequestCookies(request);
    const accessToken = cookies[this.authConfig.accessTokenCookie.name];
    
    if (!accessToken) {
      throw new UnauthorizedError('Access token not found');
    }

    // Validate access token
    const payload = await this.authTokenService.verifyAccessToken(accessToken);
    const user = await this.userRepository.getById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }
}
```

### 5. Update Refresh Token Flow
```typescript
// refresh-session.controller.ts
export class RefreshSessionController extends BaseAuthController {
  register(app: Elysia) {
    app.post('/auth/refresh', async ({ set, request }) => {
      try {
        const cookies = this.parseRequestCookies(request);
        const refreshTokenValue = cookies[this.authConfig.refreshTokenCookie.name];
        const csrfCookieValue = cookies[this.authConfig.refreshTokenCsrfCookie.name];
        const csrfHeaderValue = request.headers.get('x-csrf-token');

        // CSRF validation
        if (!csrfHeaderValue || !csrfCookieValue || csrfHeaderValue !== csrfCookieValue) {
          throw new UnauthorizedError('Invalid CSRF token');
        }

        // Process refresh token
        const input = StrictBuilder<RefreshSessionInput>()
          .refreshToken(refreshTokenValue as RefreshTokenPlain)
          .build();

        const result = await this.refreshSessionUseCase.execute(input);
        const { user, tokens } = result;

        set.status = StatusCodes.OK;
        this.setAuthCookies(set, tokens);

        return this.createAuthResponse(user, tokens);
      } catch (error) {
        this.handleError(error, 'refresh session');
      }
    });
  }
}
```

## API Usage Examples

### Before (Current)
```http
# Login
POST /auth/signin
Response: {
  "user": {...},
  "accessToken": "eyJ...",
  "csrf_token": "abc123"
}

# API Call
GET /posts
Authorization: Bearer eyJ...

# Refresh
POST /auth/refresh
X-CSRF-Token: abc123
Cookie: refresh_token=...; refresh_token_csrf=abc123
```

### After (HTTP-Only Cookies)
```http
# Login
POST /auth/signin
Response: {
  "user": {...}
}
# Cookies set automatically:
# - access_token=eyJ... (HttpOnly)
# - refresh_token=... (HttpOnly)
# - refresh_token_csrf=abc123 (HttpOnly)

# API Call
GET /posts
# No Authorization header needed - access_token cookie sent automatically

# Refresh
POST /auth/refresh
X-CSRF-Token: abc123
# refresh_token and refresh_token_csrf cookies sent automatically
```

## Benefits

1. **Enhanced Security**: All tokens are HTTP-only
2. **Simplified Client**: No token management needed
3. **Automatic Cookies**: Sent with every request
4. **XSS Protection**: JavaScript cannot access tokens
5. **Cleaner API**: No tokens in response bodies

## Considerations

1. **CSRF Protection**: Still needed for state-changing operations
2. **Same-Origin Policy**: Limited to same domain
3. **Mobile Apps**: May need alternative approach
4. **Cookie Size**: 4KB limit per cookie
5. **Browser Compatibility**: Modern browsers support HTTP-only cookies

## Implementation Steps

1. Update cookie configuration
2. Modify auth response DTOs
3. Update base auth controller
4. Modify auth guard
5. Update refresh token flow
6. Test all authentication flows
7. Update client-side code
8. Update documentation

## Migration Strategy

1. **Phase 1**: Implement HTTP-only cookies alongside current system
2. **Phase 2**: Add feature flag to switch between approaches
3. **Phase 3**: Gradually migrate clients
4. **Phase 4**: Remove old token-based approach
