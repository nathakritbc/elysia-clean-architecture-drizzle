# CRUD Module Code Review Checklist

## Overview

This checklist ensures that all AI-generated CRUD modules meet project standards for architecture, security, performance, and maintainability.

## 🏗️ **Architecture & Clean Code**

### Domain Layer

- [ ] **Entity Interface**: Uses branded types and proper TypeScript interfaces
- [ ] **Repository Interface**: Follows repository pattern with proper abstractions
- [ ] **Use Cases**: Single responsibility, proper error handling, business logic separation
- [ ] **Business Rules**: Implemented in domain layer, not in controllers
- [ ] **Dependencies**: Proper dependency injection with tokens

### Infrastructure Layer

- [ ] **Database Schema**: Uses UUID primary keys, proper indexes, constraints
- [ ] **Repository Implementation**: Proper domain/infrastructure mapping
- [ ] **Query Optimization**: No N+1 queries, proper use of joins
- [ ] **Connection Management**: Uses connection pooling appropriately

### Application Layer

- [ ] **Controllers**: Thin controllers, proper error handling, logging
- [ ] **DTOs**: Comprehensive TypeBox validation schemas
- [ ] **Authentication**: Proper JWT + CSRF validation for protected routes
- [ ] **Response Format**: Consistent API responses across endpoints

### Code Quality

- [ ] **Naming Conventions**: Follows kebab-case for files, PascalCase for classes
- [ ] **File Structure**: Matches project organization patterns
- [ ] **No Code Duplication**: DRY principles followed
- [ ] **TypeScript Strict**: Proper types, no `any` usage
- [ ] **Error Handling**: Proper error classes and meaningful messages

## 🔐 **Security & Validation**

### Input Validation

- [ ] **TypeBox Schemas**: All inputs validated with comprehensive schemas
- [ ] **Business Rule Validation**: Unique constraints, format validation
- [ ] **SQL Injection Prevention**: Parameterized queries, no string concatenation
- [ ] **XSS Prevention**: Proper input sanitization and output encoding

### Authentication & Authorization

- [ ] **JWT Validation**: Proper token verification and expiration handling
- [ ] **CSRF Protection**: CSRF tokens required for state-changing operations
- [ ] **Permission Checks**: Proper authorization for resource access
- [ ] **Session Management**: Secure session handling and cleanup

### Data Protection

- [ ] **Sensitive Data**: No passwords, tokens, or secrets in responses
- [ ] **Data Filtering**: Only authorized data returned to client
- [ ] **Audit Logging**: Important actions logged with proper context
- [ ] **Error Information**: No sensitive data exposed in error messages

### Security Headers

- [ ] **CORS Configuration**: Proper cross-origin settings
- [ ] **Rate Limiting**: Appropriate request rate limits
- [ ] **Security Headers**: Proper HTTP security headers set
- [ ] **Input Size Limits**: Request body size limitations

## ⚡ **Performance & Database**

### Database Design

- [ ] **Indexing Strategy**: Proper indexes for search, filter, and sort columns
- [ ] **Foreign Keys**: Proper relationships with cascade options
- [ ] **Data Types**: Appropriate PostgreSQL data types used
- [ ] **Constraints**: Database-level constraints for data integrity

### Query Performance

- [ ] **Query Optimization**: Efficient queries with proper use of WHERE, JOIN
- [ ] **Pagination**: Implemented with OFFSET/LIMIT or cursor-based pagination
- [ ] **Search Implementation**: Efficient full-text search with indexes
- [ ] **Aggregation Queries**: Optimized COUNT queries for pagination metadata

### API Performance

- [ ] **Response Time**: API responses under 200ms for simple operations
- [ ] **Payload Size**: Minimal response payloads, no unnecessary data
- [ ] **Caching Headers**: Appropriate HTTP caching headers
- [ ] **Connection Pooling**: Efficient database connection usage

### Monitoring

- [ ] **Logging Performance**: Response times and database query times logged
- [ ] **Health Checks**: Module health check endpoints implemented
- [ ] **Error Tracking**: Proper error logging and monitoring
- [ ] **Metrics Collection**: Request counts, success rates tracked

## 🧪 **Testing & Documentation**

### Test Coverage

- [ ] **Unit Tests**: All use cases have comprehensive unit tests
- [ ] **Integration Tests**: Repository and controller integration tests
- [ ] **E2E Tests**: Complete API flow tests with authentication
- [ ] **Edge Cases**: Error scenarios, validation failures, not found cases
- [ ] **Performance Tests**: Load testing for high-traffic endpoints

### Test Quality

- [ ] **Test Data**: Proper test data factories and cleanup
- [ ] **Mock Strategies**: Appropriate mocking of external dependencies
- [ ] **Test Isolation**: Tests don't affect each other
- [ ] **Code Coverage**: Minimum 80% code coverage achieved
- [ ] **Business Rule Tests**: All business rules have corresponding tests

### Documentation

- [ ] **Module README**: Comprehensive module documentation created
- [ ] **API Examples**: Working curl examples for all endpoints
- [ ] **Database Schema**: Complete schema documentation with constraints
- [ ] **Business Rules**: All validation rules documented
- [ ] **Migration Documentation**: Database changes properly documented

### HTTP Tests

- [ ] **Complete Coverage**: All endpoints have HTTP test cases
- [ ] **Authentication Tests**: Both authenticated and unauthenticated scenarios
- [ ] **Validation Tests**: Invalid input scenarios tested
- [ ] **Error Scenarios**: 404, 400, 409, 500 responses tested
- [ ] **Working Examples**: All HTTP tests execute successfully

## 🔄 **Migration & Deployment**

### Database Migration

- [ ] **Migration Safety**: Migrations are backwards compatible where possible
- [ ] **Rollback Plan**: Clear rollback strategy documented
- [ ] **Data Integrity**: No data loss during migration
- [ ] **Performance Impact**: Migration performance impact assessed
- [ ] **Testing**: Migration tested in development environment

### Configuration

- [ ] **Environment Variables**: All configuration externalized properly
- [ ] **Dependency Injection**: All dependencies properly registered in container
- [ ] **Route Registration**: All routes properly registered and working
- [ ] **Token Updates**: DI tokens added to tokens file

### Documentation Updates

- [ ] **README.md**: Main README updated with new API endpoints
- [ ] **AI-SPEC.md**: AI specification updated with new domain
- [ ] **Module README**: Detailed module documentation created
- [ ] **Version Increment**: Document versions incremented appropriately

## 📊 **Code Review Process**

### Pre-Review Checklist

- [ ] **Linting Passed**: All linting errors resolved
- [ ] **Tests Passing**: All tests pass locally
- [ ] **Build Success**: TypeScript compilation successful
- [ ] **Documentation Created**: Module README and examples complete

### Review Focus Areas

1. **Security First**: Check authentication, validation, data protection
2. **Performance**: Verify query optimization and response times
3. **Architecture**: Confirm Clean Architecture principles followed
4. **Testing**: Validate comprehensive test coverage
5. **Documentation**: Ensure working examples and complete docs

### Approval Criteria

- [ ] **All Checklist Items**: Every applicable item checked
- [ ] **Working Examples**: All API examples tested and functional
- [ ] **No Security Issues**: Security review completed successfully
- [ ] **Performance Acceptable**: Response times within targets
- [ ] **Complete Documentation**: Module fully documented

## 🚨 **Common Issues to Watch For**

### Architecture Violations

- ❌ Business logic in controllers
- ❌ Database queries in use cases
- ❌ Missing error handling
- ❌ Improper dependency injection

### Security Vulnerabilities

- ❌ Missing input validation
- ❌ SQL injection possibilities
- ❌ Authentication bypass scenarios
- ❌ Sensitive data exposure

### Performance Problems

- ❌ Missing database indexes
- ❌ N+1 query problems
- ❌ Inefficient pagination
- ❌ Oversized API responses

### Documentation Issues

- ❌ Outdated API examples
- ❌ Missing error scenarios
- ❌ Incomplete business rules
- ❌ Broken curl commands

## 📋 **Reviewer Notes Template**

```markdown
## Code Review: {Module Name}

### ✅ Approved Areas

- [List areas that passed review]

### ⚠️ Issues Found

- [List issues with severity and recommendations]

### 🔧 Required Changes

- [List mandatory changes before approval]

### 💡 Suggestions

- [List optional improvements]

### 🧪 Testing Notes

- [Notes on test coverage and scenarios]

**Overall Status**: ✅ Approved / ⚠️ Needs Changes / ❌ Major Issues

**Reviewer**: [Name]
**Date**: [Date]
```

---

## 📚 **Quick Reference**

### Essential Files to Review

- `src/core/domain/{domain}/` - Domain layer implementation
- `src/adapters/{domain}/` - Controllers and DTOs
- `src/external/drizzle/{domain}/` - Repository implementation
- `docs/modules/{domain}-README.md` - Module documentation
- `src/adapters/{domain}/{entity}.http` - HTTP tests

### Key Quality Indicators

- ✅ **Architecture**: Clean separation of concerns
- ✅ **Security**: Proper authentication and validation
- ✅ **Performance**: Optimized queries and responses
- ✅ **Testing**: Comprehensive test coverage
- ✅ **Documentation**: Complete and working examples

### Approval Shortcuts

If all these pass, likely ready for approval:

- [ ] All tests pass
- [ ] Security checklist complete
- [ ] Performance targets met
- [ ] Documentation working
- [ ] No linting errors

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Maintained By**: Development Team
