# AI Security Specification

## Overview

This document provides comprehensive security guidelines for AI assistants when generating CRUD operations, authentication systems, and infrastructure components for the Elysia Clean Architecture project.

## 🎯 **Security Principles**

### Defense in Depth

- **Multiple Security Layers**: Authentication, validation, authorization, data protection
- **Fail Securely**: Default to deny access, secure error handling
- **Least Privilege**: Minimum required permissions and access
- **Input Validation**: Validate all inputs at multiple layers

### Security by Design

- **Built-in Security**: Security considerations from the start
- **Threat Modeling**: Consider potential attack vectors
- **Regular Updates**: Keep security measures current
- **Documentation**: Security decisions and rationale documented

## 🔐 **Authentication & Authorization Security**

### JWT Implementation Security

#### JWT Best Practices

```typescript
// ✅ Secure JWT Implementation
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET, // Strong, unique secret
  accessTokenExpiry: '15m', // Short-lived access tokens
  refreshTokenExpiry: '7d', // Longer refresh tokens
  algorithm: 'HS256', // Strong algorithm
  issuer: 'your-app-name', // Prevent token reuse
  audience: 'your-app-users', // Token audience validation
};

// ✅ Proper Token Validation
const validateJWT = (token: string) => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      maxAge: JWT_CONFIG.accessTokenExpiry,
    });
  } catch (error) {
    // Log security events
    logger.warn('Invalid JWT token attempt', { token: token.substring(0, 20) });
    throw new UnauthorizedError('Invalid token');
  }
};
```

#### Refresh Token Security

```typescript
// ✅ Secure Refresh Token Storage
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(), // Hashed, not plaintext
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsed: timestamp('last_used'), // Track usage
  deviceFingerprint: varchar('device_fingerprint', { length: 255 }), // Device binding
  ipAddress: varchar('ip_address', { length: 45 }), // IP tracking
  userAgent: text('user_agent'), // Browser/client tracking
});

// ✅ Refresh Token Rotation
const rotateRefreshToken = async (oldToken: string): Promise<AuthResponse> => {
  // Invalidate old token immediately
  await invalidateRefreshToken(oldToken);

  // Generate new token pair
  const newTokens = await generateTokenPair(userId);

  // Log rotation event
  logger.info('Refresh token rotated', { userId, timestamp: new Date() });

  return newTokens;
};
```

### CSRF Protection

#### CSRF Token Implementation

```typescript
// ✅ Secure CSRF Token Generation
const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex'); // Cryptographically secure
};

// ✅ CSRF Validation Middleware
const validateCSRF = (request: Request) => {
  const tokenFromHeader = request.headers['x-csrf-token'];
  const tokenFromSession = request.session?.csrfToken;

  if (!tokenFromHeader || !tokenFromSession) {
    logger.warn('Missing CSRF token', {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
    throw new ForbiddenError('CSRF token required');
  }

  if (!crypto.timingSafeEqual(Buffer.from(tokenFromHeader), Buffer.from(tokenFromSession))) {
    logger.warn('Invalid CSRF token', {
      ip: request.ip,
      userId: request.user?.id,
    });
    throw new ForbiddenError('Invalid CSRF token');
  }
};
```

### Session Security

#### Secure Session Management

```typescript
// ✅ Secure Session Configuration
const SESSION_CONFIG = {
  name: 'sessionId', // Generic name, don't expose framework
  secret: process.env.SESSION_SECRET, // Strong session secret
  resave: false, // Don't save unchanged sessions
  saveUninitialized: false, // Don't save empty sessions
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS access
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict', // CSRF protection
  },
  rolling: true, // Extend session on activity
};
```

## 🛡️ **Input Validation Security**

### TypeBox Schema Security

#### Comprehensive Validation

```typescript
// ✅ Secure TypeBox Schemas
export const CreateProductSchema = t.Object({
  name: t.String({
    minLength: 2,
    maxLength: 100,
    pattern: '^[a-zA-Z0-9\\s\\-\\.]+$', // Whitelist allowed characters
    description: 'Product name (alphanumeric, spaces, hyphens, dots only)',
  }),
  description: t.Optional(
    t.String({
      maxLength: 1000,
      description: 'Product description (max 1000 characters)',
    })
  ),
  price: t.Integer({
    minimum: 0,
    maximum: 999999999, // Reasonable upper limit
    description: 'Product price in cents (0-$9,999,999.99)',
  }),
  categoryId: t.String({
    format: 'uuid',
    description: 'Category UUID (must be valid UUID format)',
  }),
  tags: t.Optional(
    t.Array(
      t.String({
        minLength: 1,
        maxLength: 50,
      }),
      {
        maxItems: 10, // Prevent array-based DoS
      }
    )
  ),
});
```

#### SQL Injection Prevention

```typescript
// ✅ Parameterized Queries (Drizzle ORM)
const getProductsByCategory = async (categoryId: CategoryId, search?: string) => {
  // Drizzle automatically parameterizes queries
  const conditions = [eq(products.categoryId, categoryId)];

  if (search) {
    // Use parameterized LIKE queries
    conditions.push(or(like(products.name, `%${search}%`), like(products.description, `%${search}%`)));
  }

  return await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(100); // Always limit results
};

// ❌ NEVER do this - Direct string concatenation
// const query = `SELECT * FROM products WHERE name = '${userInput}'`;
```

### Rate Limiting & DoS Protection

#### Request Rate Limiting

```typescript
// ✅ Rate Limiting Implementation
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    error: 'Too many requests',
    retryAfter: 15 * 60, // Seconds
  },
  skip: req => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
};

// Different limits for different endpoints
const strictRateLimit = {
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 requests per 15 minutes for sensitive operations
};

// Apply strict limits to authentication endpoints
app.use('/auth', strictRateLimit);
```

#### Request Size Limits

```typescript
// ✅ Request Size Limiting
const SECURITY_LIMITS = {
  maxRequestSize: '1mb', // Total request size
  maxFileSize: '5mb', // File upload size
  maxFieldSize: '100kb', // Individual field size
  maxFields: 20, // Number of form fields
  maxArrayItems: 100, // Array length limit
  maxStringLength: 10000, // String length limit
  maxDepth: 5, // Object nesting depth
};
```

## 🔒 **Data Protection Security**

### Password Security

#### Secure Password Handling

```typescript
// ✅ Argon2id Password Hashing
import argon2 from 'argon2';

const ARGON2_CONFIG = {
  type: argon2.argon2id, // Most secure variant
  memoryCost: 2 ** 16, // 64 MB memory usage
  timeCost: 3, // 3 iterations
  parallelism: 1, // 1 thread
  hashLength: 64, // 64-byte hash length
};

export const hashPassword = async (password: string): Promise<string> => {
  // Validate password strength
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  return argon2.hash(password, ARGON2_CONFIG);
};

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // Log potential attack attempts
    logger.warn('Password verification failed', { error: error.message });
    return false;
  }
};
```

### Data Filtering & Sanitization

#### Response Data Filtering

```typescript
// ✅ Secure Data Transformation
const mapUserToResponse = (user: IUser): UserResponseDto => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // ❌ NEVER include: password, refreshTokens, internal flags
  };
};

// ✅ Conditional Data Filtering
const mapPostToResponse = (post: IPost, isOwner: boolean): PostResponseDto => {
  const baseData = {
    id: post.id,
    title: post.title,
    content: post.content,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };

  // Only include author info if post is published or user is owner
  if (post.status === 'published' || isOwner) {
    return { ...baseData, authorId: post.authorId };
  }

  return baseData;
};
```

### Audit Logging

#### Security Event Logging

```typescript
// ✅ Comprehensive Audit Logging
const auditLogger = {
  authSuccess: (userId: UserId, ip: string, userAgent: string) => {
    logger.info('Authentication successful', {
      event: 'auth_success',
      userId,
      ip,
      userAgent: userAgent.substring(0, 200), // Truncate long user agents
      timestamp: new Date().toISOString(),
    });
  },

  authFailure: (email: string, ip: string, reason: string) => {
    logger.warn('Authentication failed', {
      event: 'auth_failure',
      email: email.substring(0, 50), // Truncate for privacy
      ip,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  dataAccess: (userId: UserId, resource: string, action: string) => {
    logger.info('Data access', {
      event: 'data_access',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
    });
  },

  securityEvent: (type: string, details: Record<string, any>) => {
    logger.warn('Security event detected', {
      event: 'security_event',
      type,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};
```

## 🌐 **Infrastructure Security**

### Database Security

#### Connection Security

```typescript
// ✅ Secure Database Configuration
const databaseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: true,
          ca: process.env.DB_CA_CERT, // CA certificate
          cert: process.env.DB_CLIENT_CERT, // Client certificate
          key: process.env.DB_CLIENT_KEY, // Client key
        }
      : false,
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000, // Close idle connections
  connectionTimeoutMillis: 2000, // Connection timeout
  statement_timeout: 30000, // Query timeout
  query_timeout: 30000, // Query execution timeout
};
```

#### Database Access Control

```sql
-- ✅ Secure Database Setup
-- Create application user with limited permissions
CREATE USER app_user WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE your_app TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ❌ Never use superuser or owner permissions for application connections
-- GRANT ALL PRIVILEGES TO app_user; -- DON'T DO THIS

-- Enable row level security where applicable
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_data_policy ON sensitive_data FOR ALL TO app_user
USING (user_id = current_setting('app.current_user_id')::uuid);
```

### CORS Configuration

#### Secure CORS Setup

```typescript
// ✅ Strict CORS Configuration
const corsConfig = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'http://localhost:3000', // Development frontend
      'https://your-app.com', // Production domain
      'https://www.your-app.com', // Production www domain
    ];

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn('CORS violation', { origin, ip: request.ip });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200, // Support legacy browsers
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods only
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'], // Headers client can access
  maxAge: 86400, // Cache preflight for 24 hours
};
```

### Environment Security

#### Secure Environment Configuration

```typescript
// ✅ Environment Variable Validation
const validateEnvironment = () => {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET', 'CSRF_SECRET'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate secret strength
  const secrets = ['JWT_SECRET', 'SESSION_SECRET', 'CSRF_SECRET'];
  secrets.forEach(secret => {
    const value = process.env[secret];
    if (value && value.length < 32) {
      throw new Error(`${secret} must be at least 32 characters long`);
    }
  });
};

// ✅ Secure Environment Defaults
const config = {
  port: parseInt(process.env.PORT || '7000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret:
    process.env.JWT_SECRET ||
    (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
      return 'development-secret-change-me';
    })(),
  // Never expose secrets in logs
  toString: () => '[Config Object - Secrets Hidden]',
};
```

## 🧪 **Security Testing**

### Authentication Testing

#### JWT Security Tests

```typescript
// ✅ JWT Security Test Cases
describe('JWT Security', () => {
  it('should reject expired tokens', async () => {
    const expiredToken = generateExpiredToken();
    const response = await request(app).get('/protected-endpoint').set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token expired');
  });

  it('should reject malformed tokens', async () => {
    const malformedToken = 'not.a.valid.jwt';
    const response = await request(app).get('/protected-endpoint').set('Authorization', `Bearer ${malformedToken}`);

    expect(response.status).toBe(401);
  });

  it('should reject tokens with invalid signature', async () => {
    const tokenWithBadSignature = validJwtPayload + '.badsignature';
    const response = await request(app)
      .get('/protected-endpoint')
      .set('Authorization', `Bearer ${tokenWithBadSignature}`);

    expect(response.status).toBe(401);
  });
});
```

#### CSRF Protection Tests

```typescript
// ✅ CSRF Protection Test Cases
describe('CSRF Protection', () => {
  it('should reject state-changing requests without CSRF token', async () => {
    const response = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validProductData);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('CSRF token required');
  });

  it('should reject requests with invalid CSRF token', async () => {
    const response = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${validToken}`)
      .set('X-CSRF-Token', 'invalid-token')
      .send(validProductData);

    expect(response.status).toBe(403);
  });
});
```

### Input Validation Testing

#### SQL Injection Tests

```typescript
// ✅ SQL Injection Prevention Tests
describe('SQL Injection Prevention', () => {
  it('should handle malicious search inputs safely', async () => {
    const maliciousInputs = [
      "'; DROP TABLE products; --",
      "' OR '1'='1",
      "'; DELETE FROM products WHERE '1'='1'; --",
      "\\'; UNION SELECT * FROM users; --",
    ];

    for (const input of maliciousInputs) {
      const response = await request(app)
        .get(`/products?search=${encodeURIComponent(input)}`)
        .set('Authorization', `Bearer ${validToken}`)
        .set('X-CSRF-Token', validCsrfToken);

      // Should not crash and should return safe results
      expect(response.status).toBeLessThan(500);
      expect(response.body).toBeDefined();
    }
  });
});
```

#### XSS Prevention Tests

```typescript
// ✅ XSS Prevention Tests
describe('XSS Prevention', () => {
  it('should sanitize HTML in product descriptions', async () => {
    const xssPayload = '<script>alert("XSS")</script>';

    const response = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${validToken}`)
      .set('X-CSRF-Token', validCsrfToken)
      .send({
        name: 'Test Product',
        description: xssPayload,
        price: 1000,
      });

    expect(response.status).toBe(400); // Should be rejected by validation
    expect(response.body.message).toContain('Invalid characters');
  });
});
```

## 📋 **Security Checklist**

### Pre-Deployment Security Audit

#### Authentication & Authorization

- [ ] **JWT Configuration**: Strong secret, appropriate expiration times
- [ ] **Refresh Tokens**: Secure storage, rotation implemented
- [ ] **CSRF Protection**: CSRF tokens required for state changes
- [ ] **Session Security**: Secure cookie settings, proper expiration
- [ ] **Rate Limiting**: Appropriate limits on authentication endpoints

#### Input Validation & Data Protection

- [ ] **TypeBox Schemas**: Comprehensive validation for all inputs
- [ ] **SQL Injection**: Parameterized queries, no string concatenation
- [ ] **XSS Prevention**: Input sanitization and validation
- [ ] **Data Filtering**: Sensitive data never exposed in responses
- [ ] **Request Size Limits**: Appropriate limits to prevent DoS

#### Infrastructure Security

- [ ] **Database Security**: Secure connection, limited user permissions
- [ ] **CORS Configuration**: Strict origin validation
- [ ] **Environment Variables**: All secrets properly configured
- [ ] **HTTPS**: SSL/TLS properly configured in production
- [ ] **Security Headers**: Appropriate HTTP security headers

#### Logging & Monitoring

- [ ] **Audit Logging**: Security events properly logged
- [ ] **Error Handling**: No sensitive data in error responses
- [ ] **Monitoring**: Security alerts configured
- [ ] **Log Protection**: Logs stored securely, no sensitive data

### Security Testing Requirements

- [ ] **Authentication Tests**: All auth scenarios covered
- [ ] **Authorization Tests**: Permission checks validated
- [ ] **Input Validation**: Malicious input handling tested
- [ ] **CSRF Tests**: Cross-site request forgery prevention verified
- [ ] **Rate Limiting**: DoS protection tested

---

## 📚 **Security Resources**

### OWASP Guidelines

- **OWASP Top 10**: Latest web application security risks
- **OWASP JWT Security**: JWT implementation best practices
- **OWASP Input Validation**: Comprehensive input validation guide
- **OWASP Authentication**: Authentication security patterns

### Security Tools

- **Static Analysis**: ESLint security plugins, Semgrep
- **Dependency Scanning**: npm audit, Snyk, GitHub Dependabot
- **Dynamic Testing**: OWASP ZAP, Burp Suite
- **Secret Scanning**: GitLeaks, TruffleHog

### Regular Security Tasks

- **Weekly**: Review security logs, update dependencies
- **Monthly**: Security testing, vulnerability assessments
- **Quarterly**: Security policy review, penetration testing
- **Annually**: Full security audit, compliance review

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Security Review**: Required for all implementations  
**Next Review**: March 2025
