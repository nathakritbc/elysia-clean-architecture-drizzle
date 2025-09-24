# AI Testing Specification

## Overview

This document provides comprehensive testing guidelines for AI assistants when generating CRUD operations, ensuring proper test coverage, quality, and reliability for the Elysia Clean Architecture project.

## 🎯 **Testing Philosophy**

### Test-Driven Development

- **Write Tests First**: Tests define expected behavior before implementation
- **Red-Green-Refactor**: Write failing test, make it pass, then refactor
- **Comprehensive Coverage**: Test all paths, edge cases, and error scenarios
- **Fast Feedback**: Tests should run quickly and provide immediate feedback

### Testing Pyramid

```text
                    /\
                   /  \
                  / E2E \ (Few, Slow, Expensive)
                 /______\
                /        \
               / Integration \ (Some, Medium Speed)
              /______________\
             /                \
            /   Unit Tests     \ (Many, Fast, Cheap)
           /____________________\
```

## 🏗️ **Test Structure & Organization**

### Directory Structure

```text
src/
├── core/domain/{domain}/
│   ├── entity/
│   │   └── {entity}.entity.spec.ts          # Entity tests
│   ├── service/
│   │   └── {entity}.repository.spec.ts      # Repository interface tests
│   └── use-case/
│       ├── create-{entity}.usecase.spec.ts  # Use case unit tests
│       ├── get-all-{entities}.usecase.spec.ts
│       └── ...
├── adapters/{domain}/
│   ├── {controller}.controller.spec.ts      # Controller integration tests
│   └── dtos/{entity}.dto.spec.ts           # DTO validation tests
├── external/drizzle/{domain}/
│   └── {entity}.drizzle.repository.spec.ts  # Repository implementation tests
└── test/
    ├── e2e/
    │   └── {domain}.e2e.spec.ts             # End-to-end tests
    ├── helpers/
    │   ├── test-data-factory.ts             # Test data generation
    │   ├── test-database.ts                 # Test DB setup
    │   └── test-auth.ts                     # Test authentication helpers
    └── setup.ts                             # Global test setup
```

### Test File Naming Conventions

- **Unit Tests**: `{filename}.spec.ts`
- **Integration Tests**: `{filename}.integration.spec.ts`
- **E2E Tests**: `{filename}.e2e.spec.ts`
- **Test Helpers**: `{filename}.helper.ts`
- **Test Data**: `{filename}.factory.ts`

## 🧪 **Unit Testing**

### Entity Testing

#### Entity Interface Tests

```typescript
// Example: src/core/domain/products/entity/product.entity.spec.ts
import type { IProduct, ProductId, ProductName } from './product.entity';
import { ProductStatusValues } from './product.entity';

describe('Product Entity', () => {
  describe('ProductStatusValues', () => {
    it('should have all required status values', () => {
      expect(ProductStatusValues.ACTIVE).toBe('active');
      expect(ProductStatusValues.INACTIVE).toBe('inactive');
      expect(ProductStatusValues.DISCONTINUED).toBe('discontinued');
    });
  });

  describe('Type Safety', () => {
    it('should enforce branded types', () => {
      // This test ensures TypeScript compilation catches type errors
      const validProduct: IProduct = {
        id: 'valid-uuid' as ProductId,
        name: 'Product Name' as ProductName,
        // ... other required fields
      };

      expect(validProduct.id).toBeDefined();
      expect(validProduct.name).toBeDefined();
    });
  });
});
```

### Use Case Testing

#### Comprehensive Use Case Tests

```typescript
// Example: src/core/domain/products/use-case/create-product.usecase.spec.ts
import { ConflictError, ValidationError } from '../../../shared/errors/error-mapper';
import type { LoggerPort } from '../../../shared/logger/logger.port';
import type { IProductRepository } from '../service/product.repository';
import { CreateProductUseCase } from './create-product.usecase';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockRepository: jest.Mocked<IProductRepository>;
  let mockLogger: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByName: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCategory: jest.fn(),
      findByStatus: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    useCase = new CreateProductUseCase(mockRepository, mockLogger);
  });

  describe('Successful Creation', () => {
    it('should create a product with valid input', async () => {
      // Arrange
      const input = {
        name: 'Test Product' as ProductName,
        description: 'Test Description' as ProductDescription,
        price: 1000 as ProductPrice,
        categoryId: 'category-uuid' as CategoryId,
        status: ProductStatusValues.ACTIVE,
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 'product-uuid' as ProductId,
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(input.name);
      expect(mockRepository.findByName).toHaveBeenCalledWith(input.name);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: input.name,
          price: input.price,
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Product created successfully',
        expect.objectContaining({ name: input.name })
      );
    });
  });

  describe('Business Rule Validation', () => {
    it('should throw ConflictError when product name already exists', async () => {
      // Arrange
      const input = {
        name: 'Existing Product' as ProductName,
        price: 1000 as ProductPrice,
        categoryId: 'category-uuid' as CategoryId,
      };

      mockRepository.findByName.mockResolvedValue({
        id: 'existing-id' as ProductId,
        name: input.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IProduct);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ConflictError);
      await expect(useCase.execute(input)).rejects.toThrow('Product name already exists');
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Product name already exists',
        expect.objectContaining({ name: input.name })
      );
    });

    it('should throw ValidationError for negative price', async () => {
      // Arrange
      const input = {
        name: 'Test Product' as ProductName,
        price: -100 as ProductPrice,
        categoryId: 'category-uuid' as CategoryId,
      };

      mockRepository.findByName.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(input)).rejects.toThrow('Price must be positive');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for zero price', async () => {
      const input = {
        name: 'Test Product' as ProductName,
        price: 0 as ProductPrice,
        categoryId: 'category-uuid' as CategoryId,
      };

      mockRepository.findByName.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const input = {
        name: 'Test Product' as ProductName,
        price: 1000 as ProductPrice,
        categoryId: 'category-uuid' as CategoryId,
      };

      mockRepository.findByName.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty optional fields', async () => {
      const input = {
        name: 'Test Product' as ProductName,
        price: 1000 as ProductPrice,
        categoryId: 'category-uuid' as CategoryId,
        // description omitted
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 'product-uuid' as ProductId,
        ...input,
        description: undefined,
        status: ProductStatusValues.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute(input);
      expect(result.description).toBeUndefined();
    });

    it('should use default status when not provided', async () => {
      const input = {
        name: 'Test Product' as ProductName,
        price: 1000 as ProductPrice,
        categoryId: 'category-uuid' as CategoryId,
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: 'product-uuid' as ProductId,
        ...input,
        status: ProductStatusValues.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await useCase.execute(input);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ProductStatusValues.ACTIVE,
        })
      );
    });
  });
});
```

### Repository Interface Testing

#### Repository Contract Tests

```typescript
// Example: src/core/domain/products/service/product.repository.spec.ts
import type { IProductRepository, PaginationMeta } from './product.repository';

// This is a contract test that ensures any implementation follows the interface
export const testProductRepositoryContract = (createRepository: () => IProductRepository) => {
  describe('IProductRepository Contract', () => {
    let repository: IProductRepository;

    beforeEach(() => {
      repository = createRepository();
    });

    describe('findById', () => {
      it('should return null for non-existent ID', async () => {
        const result = await repository.findById('non-existent-id' as ProductId);
        expect(result).toBeNull();
      });

      it('should return product for valid ID', async () => {
        // This test requires actual implementation
        // Will be tested in integration tests
      });
    });

    describe('findAll', () => {
      it('should return empty array when no products exist', async () => {
        const result = await repository.findAll();
        expect(result.data).toEqual([]);
        expect(result.meta).toEqual({
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        });
      });

      it('should respect pagination parameters', async () => {
        const result = await repository.findAll({ page: 2, limit: 5 });
        expect(result.meta.page).toBe(2);
        expect(result.meta.limit).toBe(5);
      });
    });

    // More contract tests...
  });
};
```

## 🔗 **Integration Testing**

### Repository Implementation Testing

#### Database Integration Tests

```typescript
// Example: src/external/drizzle/products/product.drizzle.repository.spec.ts
import { testProductRepositoryContract } from '../../../core/domain/products/service/product.repository.spec';
import { ProductDataFactory } from '../../../test/helpers/product-data.factory';
import { cleanupTestDatabase, createTestDatabase } from '../../../test/helpers/test-database';
import { ProductDrizzleRepository } from './product.drizzle.repository';

describe('ProductDrizzleRepository', () => {
  let repository: ProductDrizzleRepository;
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  beforeEach(async () => {
    await testDb.cleanup(); // Clean data between tests
    repository = new ProductDrizzleRepository();
  });

  // Run contract tests
  testProductRepositoryContract(() => repository);

  describe('Database-Specific Implementation', () => {
    it('should create product with correct database mapping', async () => {
      // Arrange
      const productData = ProductDataFactory.build({
        name: 'Database Test Product' as ProductName,
        price: 2000 as ProductPrice,
      });

      // Act
      const result = await repository.create(productData);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.name).toBe(productData.name);
      expect(result.price).toBe(productData.price);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      // Verify in database
      const fromDb = await repository.findById(result.id);
      expect(fromDb).toEqual(result);
    });

    it('should handle database constraints properly', async () => {
      // Create a product
      const productData = ProductDataFactory.build({
        name: 'Unique Product' as ProductName,
      });
      await repository.create(productData);

      // Try to create another with the same name
      const duplicateData = ProductDataFactory.build({
        name: 'Unique Product' as ProductName,
      });

      await expect(repository.create(duplicateData)).rejects.toThrow(/unique constraint/i);
    });

    describe('Search and Filtering', () => {
      beforeEach(async () => {
        // Setup test data
        await repository.create(
          ProductDataFactory.build({
            name: 'Apple iPhone' as ProductName,
            description: 'Latest smartphone' as ProductDescription,
            status: ProductStatusValues.ACTIVE,
          })
        );

        await repository.create(
          ProductDataFactory.build({
            name: 'Samsung Phone' as ProductName,
            description: 'Android device' as ProductDescription,
            status: ProductStatusValues.INACTIVE,
          })
        );
      });

      it('should search products by name', async () => {
        const result = await repository.findAll({ search: 'iPhone' });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toContain('iPhone');
      });

      it('should filter products by status', async () => {
        const result = await repository.findAll({ status: 'active' });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].status).toBe(ProductStatusValues.ACTIVE);
      });

      it('should combine search and filter', async () => {
        const result = await repository.findAll({
          search: 'Phone',
          status: 'active',
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toContain('iPhone');
      });
    });

    describe('Pagination', () => {
      beforeEach(async () => {
        // Create 25 products for pagination testing
        for (let i = 1; i <= 25; i++) {
          await repository.create(
            ProductDataFactory.build({
              name: `Product ${i}` as ProductName,
              price: (i * 100) as ProductPrice,
            })
          );
        }
      });

      it('should paginate results correctly', async () => {
        const page1 = await repository.findAll({ page: 1, limit: 10 });
        const page2 = await repository.findAll({ page: 2, limit: 10 });

        expect(page1.data).toHaveLength(10);
        expect(page2.data).toHaveLength(10);
        expect(page1.meta.total).toBe(25);
        expect(page1.meta.totalPages).toBe(3);

        // Products should be different
        const page1Ids = page1.data.map(p => p.id);
        const page2Ids = page2.data.map(p => p.id);
        expect(page1Ids).not.toEqual(page2Ids);
      });

      it('should handle last page correctly', async () => {
        const lastPage = await repository.findAll({ page: 3, limit: 10 });

        expect(lastPage.data).toHaveLength(5); // Remaining products
        expect(lastPage.meta.page).toBe(3);
        expect(lastPage.meta.total).toBe(25);
      });
    });

    describe('Sorting', () => {
      beforeEach(async () => {
        await repository.create(
          ProductDataFactory.build({
            name: 'Z Product' as ProductName,
            price: 100 as ProductPrice,
          })
        );

        await repository.create(
          ProductDataFactory.build({
            name: 'A Product' as ProductName,
            price: 300 as ProductPrice,
          })
        );

        await repository.create(
          ProductDataFactory.build({
            name: 'M Product' as ProductName,
            price: 200 as ProductPrice,
          })
        );
      });

      it('should sort by name ascending', async () => {
        const result = await repository.findAll({
          sortBy: 'name',
          sortOrder: 'asc',
        });

        const names = result.data.map(p => p.name);
        expect(names).toEqual(['A Product', 'M Product', 'Z Product']);
      });

      it('should sort by price descending', async () => {
        const result = await repository.findAll({
          sortBy: 'price',
          sortOrder: 'desc',
        });

        const prices = result.data.map(p => p.price);
        expect(prices).toEqual([300, 200, 100]);
      });
    });
  });
});
```

### Controller Integration Testing

#### HTTP Controller Tests

```typescript
// Example: src/adapters/products/create-product.controller.spec.ts
import request from 'supertest';

import { ProductDataFactory } from '../../../test/helpers/product-data.factory';
import { cleanupTestApp, createTestApp } from '../../../test/helpers/test-app';
import { AuthTestHelper } from '../../../test/helpers/test-auth';

describe('CreateProductController', () => {
  let app: TestApp;
  let authHelper: AuthTestHelper;

  beforeAll(async () => {
    app = await createTestApp();
    authHelper = new AuthTestHelper(app);
  });

  afterAll(async () => {
    await cleanupTestApp(app);
  });

  describe('POST /products', () => {
    it('should create product with valid data and authentication', async () => {
      // Arrange
      const { accessToken, csrfToken } = await authHelper.signIn('user@example.com', 'password');
      const productData = ProductDataFactory.buildCreateRequest();

      // Act
      const response = await request(app.server)
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send(productData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: productData.name,
        price: productData.price,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 401 without authentication', async () => {
      const productData = ProductDataFactory.buildCreateRequest();

      const response = await request(app.server).post('/products').send(productData);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        name: 'UnauthorizedError',
        message: expect.stringContaining('token'),
      });
    });

    it('should return 403 without CSRF token', async () => {
      const { accessToken } = await authHelper.signIn('user@example.com', 'password');
      const productData = ProductDataFactory.buildCreateRequest();

      const response = await request(app.server)
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(productData);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        name: 'ForbiddenError',
        message: 'CSRF token required',
      });
    });

    describe('Input Validation', () => {
      let accessToken: string;
      let csrfToken: string;

      beforeEach(async () => {
        const tokens = await authHelper.signIn('user@example.com', 'password');
        accessToken = tokens.accessToken;
        csrfToken = tokens.csrfToken;
      });

      it('should return 400 for missing required fields', async () => {
        const invalidData = { name: 'Product' }; // Missing price, categoryId

        const response = await request(app.server)
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('validation');
      });

      it('should return 400 for invalid data types', async () => {
        const invalidData = {
          name: 'Product',
          price: 'not-a-number', // Should be number
          categoryId: 'invalid-uuid',
        };

        const response = await request(app.server)
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('validation');
      });

      it('should return 400 for negative price', async () => {
        const invalidData = ProductDataFactory.buildCreateRequest({
          price: -100,
        });

        const response = await request(app.server)
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('minimum');
      });

      it('should return 400 for name too long', async () => {
        const invalidData = ProductDataFactory.buildCreateRequest({
          name: 'a'.repeat(101), // Over 100 char limit
        });

        const response = await request(app.server)
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send(invalidData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('maxLength');
      });
    });

    describe('Business Rule Validation', () => {
      let accessToken: string;
      let csrfToken: string;

      beforeEach(async () => {
        const tokens = await authHelper.signIn('user@example.com', 'password');
        accessToken = tokens.accessToken;
        csrfToken = tokens.csrfToken;
      });

      it('should return 409 for duplicate product name', async () => {
        const productData = ProductDataFactory.buildCreateRequest({
          name: 'Unique Product Name',
        });

        // Create first product
        await request(app.server)
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send(productData);

        // Try to create duplicate
        const response = await request(app.server)
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send(productData);

        expect(response.status).toBe(409);
        expect(response.body).toMatchObject({
          name: 'ConflictError',
          message: 'Product name already exists',
        });
      });
    });
  });
});
```

## 🌐 **End-to-End Testing**

### Complete API Flow Tests

#### E2E Test Suite

```typescript
// Example: src/test/e2e/products.e2e.spec.ts
import request from 'supertest';

import { cleanupE2ETestApp, createE2ETestApp } from '../helpers/e2e-test-app';
import { ProductDataFactory } from '../helpers/product-data.factory';
import { AuthTestHelper } from '../helpers/test-auth';

describe('Products E2E', () => {
  let app: E2ETestApp;
  let authHelper: AuthTestHelper;

  beforeAll(async () => {
    app = await createE2ETestApp();
    authHelper = new AuthTestHelper(app);
  });

  afterAll(async () => {
    await cleanupE2ETestApp(app);
  });

  describe('Complete Product Management Flow', () => {
    it('should handle complete CRUD lifecycle', async () => {
      // 1. Sign up and sign in
      const userEmail = 'testuser@example.com';
      const password = 'securepassword123';

      await authHelper.signUp(userEmail, password);
      const { accessToken, csrfToken } = await authHelper.signIn(userEmail, password);

      // 2. Create a product
      const createData = ProductDataFactory.buildCreateRequest({
        name: 'E2E Test Product',
        description: 'Product for end-to-end testing',
        price: 1500,
      });

      const createResponse = await request(app.server)
        .post('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send(createData);

      expect(createResponse.status).toBe(201);
      const createdProduct = createResponse.body;

      // 3. Get the created product by ID
      const getResponse = await request(app.server)
        .get(`/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toMatchObject({
        id: createdProduct.id,
        name: createData.name,
        description: createData.description,
        price: createData.price,
      });

      // 4. List products (should include our product)
      const listResponse = await request(app.server)
        .get('/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toContainEqual(expect.objectContaining({ id: createdProduct.id }));

      // 5. Update the product
      const updateData = {
        name: 'Updated E2E Product',
        price: 2000,
      };

      const updateResponse = await request(app.server)
        .put(`/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toMatchObject({
        id: createdProduct.id,
        name: updateData.name,
        price: updateData.price,
      });

      // 6. Search for updated product
      const searchResponse = await request(app.server)
        .get('/products?search=Updated')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data).toContainEqual(expect.objectContaining({ name: updateData.name }));

      // 7. Delete the product
      const deleteResponse = await request(app.server)
        .delete(`/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(deleteResponse.status).toBe(204);

      // 8. Verify product is deleted
      const getDeletedResponse = await request(app.server)
        .get(`/products/${createdProduct.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(getDeletedResponse.status).toBe(404);
    });

    it('should handle pagination and filtering correctly', async () => {
      const { accessToken, csrfToken } = await authHelper.signIn('user@example.com', 'password');

      // Create multiple products for testing
      const products = [];
      for (let i = 1; i <= 15; i++) {
        const productData = ProductDataFactory.buildCreateRequest({
          name: `Pagination Test Product ${i}`,
          price: i * 100,
          categoryId: i % 2 === 0 ? 'even-category-id' : 'odd-category-id',
        });

        const response = await request(app.server)
          .post('/products')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-CSRF-Token', csrfToken)
          .send(productData);

        products.push(response.body);
      }

      // Test pagination
      const page1 = await request(app.server)
        .get('/products?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(page1.status).toBe(200);
      expect(page1.body.data).toHaveLength(5);
      expect(page1.body.meta).toMatchObject({
        total: expect.any(Number),
        page: 1,
        limit: 5,
        totalPages: expect.any(Number),
      });

      const page2 = await request(app.server)
        .get('/products?page=2&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(page2.status).toBe(200);
      expect(page2.body.data).toHaveLength(5);

      // Test search
      const searchResponse = await request(app.server)
        .get('/products?search=Test Product 1')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data.length).toBeGreaterThan(0);
      expect(searchResponse.body.data.every(p => p.name.includes('1'))).toBe(true);

      // Test sorting
      const sortedResponse = await request(app.server)
        .get('/products?sortBy=price&sortOrder=desc')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-CSRF-Token', csrfToken);

      expect(sortedResponse.status).toBe(200);
      const prices = sortedResponse.body.data.map(p => p.price);
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle token expiration correctly', async () => {
      // This test would require manipulating token expiration
      // Implementation depends on specific token management
    });

    it('should handle refresh token rotation', async () => {
      // Test refresh token flow
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database connection issues gracefully', async () => {
      // This would require a way to simulate database issues
      // Implementation depends on test infrastructure
    });

    it('should handle concurrent access correctly', async () => {
      // Test concurrent operations
    });
  });
});
```

## 🏭 **Test Data Management**

### Test Data Factories

#### Product Data Factory

```typescript
// Example: src/test/helpers/product-data.factory.ts
import { faker } from '@faker-js/faker';

import type {
  CategoryId,
  IProduct,
  ProductDescription,
  ProductId,
  ProductName,
  ProductPrice,
} from '../../core/domain/products/entity/product.entity';
import { ProductStatusValues } from '../../core/domain/products/entity/product.entity';

export class ProductDataFactory {
  static build(overrides: Partial<IProduct> = {}): IProduct {
    return {
      id: faker.datatype.uuid() as ProductId,
      name: faker.commerce.productName() as ProductName,
      description: faker.commerce.productDescription() as ProductDescription,
      price: faker.datatype.number({ min: 100, max: 10000 }) as ProductPrice,
      categoryId: faker.datatype.uuid() as CategoryId,
      status: faker.helpers.arrayElement(Object.values(ProductStatusValues)),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static buildCreateRequest(overrides: Partial<any> = {}) {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.datatype.number({ min: 100, max: 10000 }),
      categoryId: faker.datatype.uuid(),
      status: ProductStatusValues.ACTIVE,
      ...overrides,
    };
  }

  static buildUpdateRequest(overrides: Partial<any> = {}) {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.datatype.number({ min: 100, max: 10000 }),
      ...overrides,
    };
  }

  static buildList(count: number, overrides: Partial<IProduct> = {}): IProduct[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  static buildCreateRequestList(count: number, overrides: Partial<any> = {}) {
    return Array.from({ length: count }, () => this.buildCreateRequest(overrides));
  }
}
```

### Test Database Management

#### Database Test Helpers

```typescript
// Example: src/test/helpers/test-database.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import * as schema from '../../external/drizzle/schema';

export interface TestDatabase {
  pool: Pool;
  db: ReturnType<typeof drizzle>;
  cleanup: () => Promise<void>;
  reset: () => Promise<void>;
}

export const createTestDatabase = async (): Promise<TestDatabase> => {
  const databaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://localhost/test_db';

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1, // Single connection for tests
  });

  const db = drizzle(pool, { schema });

  // Run migrations
  await migrate(db, { migrationsFolder: './src/external/drizzle/migrations' });

  const cleanup = async () => {
    await pool.end();
  };

  const reset = async () => {
    // Truncate all tables in reverse dependency order
    await db.execute(`
      TRUNCATE TABLE refresh_tokens CASCADE;
      TRUNCATE TABLE posts CASCADE;
      TRUNCATE TABLE users CASCADE;
    `);
  };

  return { pool, db, cleanup, reset };
};

export const cleanupTestDatabase = async (testDb: TestDatabase) => {
  await testDb.cleanup();
};

// Transaction-based test isolation
export const withTransaction = async <T>(
  testDb: TestDatabase,
  fn: (db: typeof testDb.db) => Promise<T>
): Promise<T> => {
  return testDb.db.transaction(async tx => {
    try {
      const result = await fn(tx);
      // Rollback transaction after test
      throw new Error('ROLLBACK_TEST');
    } catch (error) {
      if (error.message === 'ROLLBACK_TEST') {
        return result;
      }
      throw error;
    }
  });
};
```

### Authentication Test Helpers

#### Auth Test Helper

```typescript
// Example: src/test/helpers/test-auth.ts
import request from 'supertest';

import type { TestApp } from './test-app';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export class AuthTestHelper {
  constructor(private app: TestApp) {}

  async signUp(email: string, password: string, name: string = 'Test User'): Promise<void> {
    const response = await request(this.app.server).post('/auth/signup').send({ email, password, name });

    if (response.status !== 201) {
      throw new Error(`Sign up failed: ${response.body.message}`);
    }
  }

  async signIn(email: string, password: string): Promise<AuthTokens> {
    const response = await request(this.app.server).post('/auth/signin').send({ email, password });

    if (response.status !== 200) {
      throw new Error(`Sign in failed: ${response.body.message}`);
    }

    return {
      accessToken: response.body.accessToken,
      refreshToken: response.body.refreshToken,
      csrfToken: response.body.csrf_token,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const response = await request(this.app.server).post('/auth/refresh').send({ refreshToken });

    if (response.status !== 200) {
      throw new Error(`Token refresh failed: ${response.body.message}`);
    }

    return {
      accessToken: response.body.accessToken,
      refreshToken: response.body.refreshToken,
      csrfToken: response.body.csrf_token,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const response = await request(this.app.server).post('/auth/logout').send({ refreshToken });

    if (response.status !== 204) {
      throw new Error(`Logout failed: ${response.body?.message}`);
    }
  }

  async createAuthenticatedUser(
    email: string = 'test@example.com',
    password: string = 'password123'
  ): Promise<{ user: any; tokens: AuthTokens }> {
    await this.signUp(email, password);
    const tokens = await this.signIn(email, password);

    return {
      user: { email, password },
      tokens,
    };
  }
}
```

## ⚡ **Performance Testing**

### Load Testing

#### API Performance Tests

```typescript
// Example: src/test/performance/products-load.spec.ts
import request from 'supertest';

import { ProductDataFactory } from '../helpers/product-data.factory';
import { createTestApp } from '../helpers/test-app';
import { AuthTestHelper } from '../helpers/test-auth';

describe('Products Load Testing', () => {
  let app: TestApp;
  let authHelper: AuthTestHelper;
  let tokens: AuthTokens;

  beforeAll(async () => {
    app = await createTestApp();
    authHelper = new AuthTestHelper(app);
    tokens = (await authHelper.createAuthenticatedUser()).tokens;
  });

  describe('GET /products Performance', () => {
    beforeAll(async () => {
      // Create test data
      const products = ProductDataFactory.buildCreateRequestList(1000);

      for (const product of products) {
        await request(app.server)
          .post('/products')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .set('X-CSRF-Token', tokens.csrfToken)
          .send(product);
      }
    });

    it('should handle multiple concurrent requests', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.server)
          .get('/products?limit=20')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .set('X-CSRF-Token', tokens.csrfToken)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assertions
      expect(responses).toHaveLength(concurrentRequests);
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(200); // Average response time under 200ms
    });

    it('should maintain performance with large result sets', async () => {
      const startTime = Date.now();

      const response = await request(app.server)
        .get('/products?limit=100')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .set('X-CSRF-Token', tokens.csrfToken);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(100);
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
    });

    it('should handle search operations efficiently', async () => {
      const searches = ['Test', 'Product', 'Sample', 'Demo', 'Example'];
      const startTime = Date.now();

      const promises = searches.map(search =>
        request(app.server)
          .get(`/products?search=${search}&limit=50`)
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .set('X-CSRF-Token', tokens.csrfToken)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(2000); // All searches within 2 seconds
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during extended operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await request(app.server)
          .get('/products?limit=10')
          .set('Authorization', `Bearer ${tokens.accessToken}`)
          .set('X-CSRF-Token', tokens.csrfToken);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
```

## 📊 **Test Coverage Requirements**

### Coverage Targets

#### Minimum Coverage Requirements

```json
// jest.config.js coverage thresholds
{
  "collectCoverage": true,
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "./src/core/domain/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "./src/adapters/": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

### Critical Path Coverage

#### High-Priority Testing Areas

1. **Business Rules**: 100% coverage required
2. **Authentication Logic**: 100% coverage required
3. **Data Validation**: 95% coverage required
4. **Error Handling**: 90% coverage required
5. **Repository Operations**: 90% coverage required

#### Test Priority Matrix

```text
High Impact, High Risk:
- Authentication/Authorization
- Data persistence
- Business rule validation
- Security operations

High Impact, Low Risk:
- API endpoints
- Data transformation
- Logging operations

Low Impact, High Risk:
- Edge case handling
- Error recovery
- Performance optimizations

Low Impact, Low Risk:
- Utility functions
- Configuration loading
- Static content
```

## 🛠️ **Test Infrastructure**

### Test Configuration

#### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
};
```

#### Test Scripts

```json
// package.json scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=spec.ts",
    "test:integration": "jest --testPathPattern=integration.spec.ts",
    "test:e2e": "jest --testPathPattern=e2e.spec.ts",
    "test:performance": "jest --testPathPattern=performance",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### Continuous Integration

#### CI Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun run test:unit

      - name: Run integration tests
        run: bun run test:integration
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost/test_db

      - name: Run E2E tests
        run: bun run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📚 **Testing Best Practices**

### Test Writing Guidelines

#### The 3 A's Pattern

- **Arrange**: Set up test data and conditions
- **Act**: Execute the code under test
- **Assert**: Verify the expected outcome

#### Test Naming Convention

```typescript
// ✅ Good: Descriptive test names
describe('CreateProductUseCase', () => {
  it('should create product when valid data is provided', () => {});
  it('should throw ConflictError when product name already exists', () => {});
  it('should throw ValidationError when price is negative', () => {});
});

// ❌ Bad: Vague test names
describe('CreateProductUseCase', () => {
  it('should work', () => {});
  it('should handle errors', () => {});
  it('should validate input', () => {});
});
```

#### Test Independence

```typescript
// ✅ Good: Each test is independent
describe('ProductRepository', () => {
  beforeEach(async () => {
    await testDb.reset(); // Clean state for each test
  });

  it('should create product', async () => {
    const product = await repository.create(productData);
    expect(product.id).toBeDefined();
  });

  it('should find product by ID', async () => {
    const created = await repository.create(productData);
    const found = await repository.findById(created.id);
    expect(found).toEqual(created);
  });
});

// ❌ Bad: Tests depend on each other
describe('ProductRepository', () => {
  let createdProductId;

  it('should create product', async () => {
    const product = await repository.create(productData);
    createdProductId = product.id; // State shared between tests
  });

  it('should find product by ID', async () => {
    const found = await repository.findById(createdProductId); // Depends on previous test
    expect(found).toBeDefined();
  });
});
```

### Common Anti-Patterns

#### What to Avoid

- **Testing Implementation Details**: Test behavior, not internal structure
- **Overly Complex Tests**: Keep tests simple and focused
- **Missing Edge Cases**: Test error conditions and boundary cases
- **Slow Tests**: Optimize test performance for fast feedback
- **Flaky Tests**: Ensure tests are deterministic and reliable

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Testing Framework**: Jest + Supertest  
**Coverage Target**: 80% minimum, 90% for domain layer
