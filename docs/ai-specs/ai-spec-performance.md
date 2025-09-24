# AI Performance Specification

## Overview

This document provides comprehensive performance optimization guidelines for AI assistants when generating CRUD operations, ensuring optimal response times, database efficiency, and scalable architecture for the Elysia Clean Architecture project.

## 🎯 **Performance Targets**

### Response Time Targets

- **Simple GET Operations**: < 100ms (95th percentile)
- **Complex Queries with Joins**: < 200ms (95th percentile)
- **CREATE/UPDATE Operations**: < 150ms (95th percentile)
- **DELETE Operations**: < 100ms (95th percentile)
- **Search Operations**: < 300ms (95th percentile)
- **Paginated Lists**: < 200ms (95th percentile)

### Throughput Targets

- **Minimum**: 100 requests/second per endpoint
- **Target**: 500 requests/second per endpoint
- **Concurrent Users**: 1000+ simultaneous users
- **Database Connections**: Max 20 concurrent connections

### Resource Limits

- **Memory Usage**: < 512MB per instance
- **CPU Usage**: < 70% under normal load
- **Database Query Time**: < 50ms average
- **Connection Pool**: 20 connections max

## 🗃️ **Database Performance**

### Index Strategy

#### Primary Indexes (Always Required)

```sql
-- UUID Primary Keys with default random generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Primary key indexes (automatic)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- other fields...
);
```

#### Search and Filter Indexes

```sql
-- ✅ Search Indexes
CREATE INDEX products_name_search_idx ON products USING GIN (to_tsvector('english', name));
CREATE INDEX products_description_search_idx ON products USING GIN (to_tsvector('english', description));

-- ✅ Filter Indexes
CREATE INDEX products_status_idx ON products (status);
CREATE INDEX products_category_id_idx ON products (category_id);
CREATE INDEX products_price_range_idx ON products (price);

-- ✅ Sorting Indexes
CREATE INDEX products_created_at_idx ON products (created_at DESC);
CREATE INDEX products_updated_at_idx ON products (updated_at DESC);
CREATE INDEX products_name_sort_idx ON products (name);
CREATE INDEX products_price_sort_idx ON products (price);

-- ✅ Composite Indexes for Common Query Patterns
CREATE INDEX products_status_created_at_idx ON products (status, created_at DESC);
CREATE INDEX products_category_status_idx ON products (category_id, status);

-- ✅ Unique Constraint Indexes
CREATE UNIQUE INDEX products_name_unique_idx ON products (lower(name));
```

#### Foreign Key and Relationship Indexes

```sql
-- ✅ Foreign Key Indexes
CREATE INDEX posts_author_id_idx ON posts (author_id);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE INDEX products_category_id_fk_idx ON products (category_id);

-- ✅ Composite Foreign Key Indexes
CREATE INDEX order_items_order_product_idx ON order_items (order_id, product_id);
```

### Query Optimization

#### Efficient Repository Patterns

##### Optimized Query Implementation

```typescript
// ✅ Efficient Product Repository
export class ProductDrizzleRepository implements IProductRepository {
  async findAll(options?: FindAllOptions): Promise<{ data: IProduct[]; meta: PaginationMeta }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 10, 100); // Cap at 100
    const offset = (page - 1) * limit;

    // Build optimized WHERE conditions
    const conditions: SQL[] = [];

    // Status filter (uses index)
    if (options?.status) {
      conditions.push(eq(products.status, options.status));
    }

    // Category filter (uses index)
    if (options?.categoryId) {
      conditions.push(eq(products.categoryId, options.categoryId));
    }

    // Price range filter (uses index)
    if (options?.minPrice !== undefined) {
      conditions.push(gte(products.price, options.minPrice));
    }
    if (options?.maxPrice !== undefined) {
      conditions.push(lte(products.price, options.maxPrice));
    }

    // Full-text search (uses GIN index)
    if (options?.search) {
      const searchCondition = sql`
        (to_tsvector('english', ${products.name}) @@ plainto_tsquery('english', ${options.search})
         OR to_tsvector('english', ${products.description}) @@ plainto_tsquery('english', ${options.search}))
      `;
      conditions.push(searchCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Optimized count query (uses covering indexes when possible)
    const [{ totalCount }] = await db.select({ totalCount: count() }).from(products).where(whereClause);

    // Main data query with optimized sorting
    let orderByClause: SQL[];
    switch (options?.sortBy) {
      case 'name':
        orderByClause = [options.sortOrder === 'asc' ? asc(products.name) : desc(products.name)];
        break;
      case 'price':
        orderByClause = [options.sortOrder === 'asc' ? asc(products.price) : desc(products.price)];
        break;
      case 'updatedAt':
        orderByClause = [options.sortOrder === 'asc' ? asc(products.updatedAt) : desc(products.updatedAt)];
        break;
      default:
        orderByClause = [desc(products.createdAt)]; // Default sort uses index
    }

    const results = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(limit)
      .offset(offset);

    const data = results.map(result => this.mapToDomain(result));
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    };
  }

  // ✅ Optimized search with caching-friendly queries
  async searchProducts(searchTerm: string, options?: SearchOptions): Promise<IProduct[]> {
    // Use prepared statement for better performance
    const searchResults = await db
      .select()
      .from(products)
      .where(
        and(
          // Full-text search with ranking
          sql`to_tsvector('english', ${products.name} || ' ' || coalesce(${products.description}, '')) 
              @@ plainto_tsquery('english', ${searchTerm})`,
          eq(products.status, ProductStatusValues.ACTIVE) // Only active products
        )
      )
      .orderBy(
        // Order by search ranking
        sql`ts_rank(to_tsvector('english', ${products.name} || ' ' || coalesce(${products.description}, '')), 
                    plainto_tsquery('english', ${searchTerm})) DESC`
      )
      .limit(options?.limit ?? 20);

    return searchResults.map(result => this.mapToDomain(result));
  }

  // ✅ Batch operations for better performance
  async createMany(products: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<IProduct[]> {
    const results = await db
      .insert(products)
      .values(
        products.map(product => ({
          name: product.name,
          description: product.description,
          price: product.price,
          categoryId: product.categoryId,
          status: product.status,
        }))
      )
      .returning();

    return results.map(result => this.mapToDomain(result));
  }
}
```

#### Query Performance Best Practices

##### Avoiding N+1 Queries

```typescript
// ❌ Bad: N+1 Query Problem
async getBooksWithAuthors(): Promise<BookWithAuthor[]> {
  const books = await db.select().from(books);

  // This creates N+1 queries (1 + N author queries)
  const booksWithAuthors = await Promise.all(
    books.map(async (book) => ({
      ...book,
      author: await db.select().from(authors).where(eq(authors.id, book.authorId))
    }))
  );

  return booksWithAuthors;
}

// ✅ Good: Single Join Query
async getBooksWithAuthors(): Promise<BookWithAuthor[]> {
  const results = await db
    .select({
      // Book fields
      bookId: books.id,
      bookTitle: books.title,
      bookPrice: books.price,
      // Author fields
      authorId: authors.id,
      authorName: authors.name,
      authorEmail: authors.email
    })
    .from(books)
    .leftJoin(authors, eq(books.authorId, authors.id));

  return results.map(row => ({
    id: row.bookId,
    title: row.bookTitle,
    price: row.bookPrice,
    author: {
      id: row.authorId,
      name: row.authorName,
      email: row.authorEmail
    }
  }));
}
```

##### Efficient Aggregation Queries

```typescript
// ✅ Optimized aggregation with proper indexing
async getProductStatistics(): Promise<ProductStatistics> {
  const [stats] = await db
    .select({
      totalProducts: count(products.id),
      totalValue: sum(products.price),
      averagePrice: avg(products.price),
      activeCount: count(case(eq(products.status, 'active'), products.id)),
      inactiveCount: count(case(eq(products.status, 'inactive'), products.id))
    })
    .from(products);

  return {
    totalProducts: Number(stats.totalProducts),
    totalValue: Number(stats.totalValue || 0),
    averagePrice: Number(stats.averagePrice || 0),
    activeCount: Number(stats.activeCount),
    inactiveCount: Number(stats.inactiveCount)
  };
}
```

### Connection Pool Optimization

#### Database Connection Configuration

```typescript
// ✅ Optimized Connection Pool Settings
const databaseConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  // Connection pool settings
  max: 20, // Maximum connections in pool
  min: 2, // Minimum connections maintained
  acquireTimeoutMillis: 30000, // Max time to get connection
  createTimeoutMillis: 30000, // Max time to create connection
  destroyTimeoutMillis: 5000, // Max time to destroy connection
  idleTimeoutMillis: 30000, // Idle connection timeout
  reapIntervalMillis: 1000, // How often to check for idle connections
  createRetryIntervalMillis: 200, // Retry interval for failed connections

  // Performance settings
  statement_timeout: 30000, // SQL query timeout
  query_timeout: 30000, // Query execution timeout
  connectionTimeoutMillis: 2000, // Connection establishment timeout

  // Prepared statement caching
  max_prepared_statements: 100,
};
```

## 🚀 **API Performance**

### Response Optimization

#### Efficient Controller Patterns

```typescript
// ✅ Optimized Controller with Caching Headers
export class GetAllProductsController {
  constructor(
    @inject(GetAllProductsUseCase) private readonly useCase: GetAllProductsUseCase,
    @inject(TOKENS.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    app.get(
      '/products',
      async ({ query, set }) => {
        const startTime = Date.now();

        try {
          const options = this.parseQueryOptions(query);
          const result = await this.useCase.execute(options);

          // Set caching headers for better performance
          set.headers['Cache-Control'] = 'public, max-age=300'; // 5 minutes
          set.headers['ETag'] = this.generateETag(result);

          // Add pagination info to headers
          set.headers['X-Total-Count'] = result.meta.total.toString();
          set.headers['X-Page-Count'] = result.meta.totalPages.toString();

          const responseTime = Date.now() - startTime;
          this.logger.info('Products retrieved', {
            count: result.data.length,
            total: result.meta.total,
            responseTime,
            query: options,
          });

          return result;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          this.logger.error('Failed to retrieve products', {
            error: error.message,
            responseTime,
            query,
          });
          throw error;
        }
      },
      {
        query: GetAllProductsQueryDto,
        response: {
          200: GetAllProductsReturnTypeDto,
          400: ErrorResponseDto,
          500: ErrorResponseDto,
        },
        detail: {
          summary: 'Get all products with pagination and filtering',
          description: 'Retrieves products with advanced filtering, sorting, and pagination',
          tags: ['Products'],
        },
      }
    );
  }

  private parseQueryOptions(query: any): GetAllProductsOptions {
    return {
      page: parseInt(query.page) || 1,
      limit: Math.min(parseInt(query.limit) || 10, 100), // Cap limit
      search: query.search?.trim(),
      status: query.status,
      categoryId: query.categoryId,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
      minPrice: query.minPrice ? parseInt(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseInt(query.maxPrice) : undefined,
    };
  }

  private generateETag(result: any): string {
    // Generate ETag based on result data for caching
    const hash = require('crypto')
      .createHash('md5')
      .update(
        JSON.stringify({
          count: result.data.length,
          total: result.meta.total,
          lastUpdated: result.data[0]?.updatedAt,
        })
      )
      .digest('hex');
    return `"${hash}"`;
  }
}
```

### Request Size and Rate Limiting

#### Performance-Oriented Middleware

```typescript
// ✅ Performance-optimized middleware
export const createPerformanceMiddleware = () => {
  // Request size limiting
  const requestSizeLimit =
    (maxSize: string = '1mb') =>
    (request: Request) => {
      const contentLength = request.headers['content-length'];
      if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
        throw new PayloadTooLargeError(`Request size exceeds ${maxSize}`);
      }
    };

  // Response compression
  const compressionMiddleware = (request: Request, response: Response) => {
    const acceptEncoding = request.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
      response.setHeader('Content-Encoding', 'gzip');
    }
  };

  // Performance monitoring
  const performanceMonitoring = (request: Request) => {
    const startTime = Date.now();

    return {
      finish: () => {
        const duration = Date.now() - startTime;

        // Log slow requests
        if (duration > 1000) {
          logger.warn('Slow request detected', {
            method: request.method,
            url: request.url,
            duration,
            userAgent: request.headers['user-agent'],
          });
        }

        // Emit metrics
        metrics.histogram('http_request_duration_ms', duration, {
          method: request.method,
          route: request.route?.path || 'unknown',
        });
      },
    };
  };

  return {
    requestSizeLimit,
    compressionMiddleware,
    performanceMonitoring,
  };
};
```

### Memory Management

#### Efficient Data Processing

```typescript
// ✅ Memory-efficient data processing
export class DataProcessor {
  // Stream processing for large datasets
  async processLargeDataset<T, R>(
    data: AsyncIterable<T>,
    processor: (item: T) => Promise<R>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    let batch: T[] = [];

    for await (const item of data) {
      batch.push(item);

      if (batch.length >= batchSize) {
        const batchResults = await Promise.all(batch.map(item => processor(item)));
        results.push(...batchResults);
        batch = []; // Clear batch to free memory
      }
    }

    // Process remaining items
    if (batch.length > 0) {
      const batchResults = await Promise.all(batch.map(item => processor(item)));
      results.push(...batchResults);
    }

    return results;
  }

  // Memory-efficient pagination
  async *paginateQuery<T>(query: () => Promise<T[]>, pageSize: number = 1000): AsyncGenerator<T[], void, unknown> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const results = await query();

      if (results.length === 0) {
        hasMore = false;
        break;
      }

      yield results;

      if (results.length < pageSize) {
        hasMore = false;
      }

      page++;
    }
  }
}
```

## ⚡ **Caching Strategies**

### HTTP Response Caching

#### Smart Caching Implementation

```typescript
// ✅ Intelligent response caching
export class CacheService {
  private cache = new Map<string, CacheEntry>();

  // Cache with TTL and conditional invalidation
  async getOrSet<T>(key: string, factory: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached, options.ttl)) {
      return cached.value;
    }

    const value = await factory();

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    });

    return value;
  }

  // Cache invalidation patterns
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Memory management for cache
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// ✅ Cache-aware repository decorator
export class CachedProductRepository implements IProductRepository {
  constructor(
    private baseRepository: IProductRepository,
    private cache: CacheService
  ) {}

  async findById(id: ProductId): Promise<IProduct | null> {
    return this.cache.getOrSet(
      `product:${id}`,
      () => this.baseRepository.findById(id),
      { ttl: 5 * 60 * 1000 } // 5 minutes
    );
  }

  async findAll(options?: FindAllOptions): Promise<{ data: IProduct[]; meta: PaginationMeta }> {
    const cacheKey = `products:${JSON.stringify(options)}`;

    return this.cache.getOrSet(
      cacheKey,
      () => this.baseRepository.findAll(options),
      { ttl: 2 * 60 * 1000 } // 2 minutes for lists
    );
  }

  async create(product: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<IProduct> {
    const result = await this.baseRepository.create(product);

    // Invalidate related caches
    this.cache.invalidatePattern('products:.*');
    this.cache.invalidatePattern('product-stats:.*');

    return result;
  }

  async update(id: ProductId, updates: Partial<IProduct>): Promise<IProduct | null> {
    const result = await this.baseRepository.update(id, updates);

    // Invalidate specific and related caches
    this.cache.invalidatePattern(`product:${id}`);
    this.cache.invalidatePattern('products:.*');

    return result;
  }
}
```

### Database Query Result Caching

#### Query Result Optimization

```typescript
// ✅ Database query result caching
export class OptimizedQueryService {
  private queryCache = new LRUCache<string, any>({ max: 1000 });

  async executeWithCache<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> {
    const cached = this.queryCache.get(queryKey);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await queryFn();

    this.queryCache.set(queryKey, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  // Cached aggregation queries
  async getCachedProductStatistics(): Promise<ProductStatistics> {
    return this.executeWithCache(
      'product-statistics',
      async () => {
        // Expensive aggregation query
        const [stats] = await db
          .select({
            totalProducts: count(products.id),
            totalValue: sum(products.price),
            averagePrice: avg(products.price),
            categoryCounts: countDistinct(products.categoryId),
          })
          .from(products);

        return stats;
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }
}
```

## 📊 **Performance Monitoring**

### Metrics Collection

#### Performance Metrics Implementation

```typescript
// ✅ Comprehensive performance monitoring
export class PerformanceMonitor {
  private metrics = {
    requestDuration: new Map<string, number[]>(),
    dbQueryDuration: new Map<string, number[]>(),
    memoryUsage: [] as number[],
    activeConnections: 0,
  };

  // Request performance tracking
  trackRequest(route: string, duration: number): void {
    if (!this.metrics.requestDuration.has(route)) {
      this.metrics.requestDuration.set(route, []);
    }

    const durations = this.metrics.requestDuration.get(route)!;
    durations.push(duration);

    // Keep only last 1000 measurements
    if (durations.length > 1000) {
      durations.shift();
    }

    // Alert on slow requests
    if (duration > 1000) {
      this.alertSlowRequest(route, duration);
    }
  }

  // Database query performance
  trackDbQuery(query: string, duration: number): void {
    const queryKey = this.normalizeQuery(query);

    if (!this.metrics.dbQueryDuration.has(queryKey)) {
      this.metrics.dbQueryDuration.set(queryKey, []);
    }

    const durations = this.metrics.dbQueryDuration.get(queryKey)!;
    durations.push(duration);

    if (durations.length > 1000) {
      durations.shift();
    }

    // Alert on slow queries
    if (duration > 100) {
      this.alertSlowQuery(queryKey, duration);
    }
  }

  // Memory usage tracking
  trackMemoryUsage(): void {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push(usage.heapUsed);

    // Keep only last hour of measurements (1 per minute)
    if (this.metrics.memoryUsage.length > 60) {
      this.metrics.memoryUsage.shift();
    }

    // Alert on high memory usage
    if (usage.heapUsed > 400 * 1024 * 1024) {
      // 400MB
      this.alertHighMemoryUsage(usage);
    }
  }

  // Performance statistics
  getPerformanceStats(): PerformanceStats {
    const stats: PerformanceStats = {
      requests: {},
      database: {},
      memory: this.getMemoryStats(),
      connections: this.metrics.activeConnections,
    };

    // Request statistics
    for (const [route, durations] of this.metrics.requestDuration) {
      stats.requests[route] = this.calculateStats(durations);
    }

    // Database statistics
    for (const [query, durations] of this.metrics.dbQueryDuration) {
      stats.database[query] = this.calculateStats(durations);
    }

    return stats;
  }

  private calculateStats(values: number[]): StatsSummary {
    if (values.length === 0) {
      return { mean: 0, median: 0, p95: 0, p99: 0, min: 0, max: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);

    return {
      mean: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  private alertSlowRequest(route: string, duration: number): void {
    logger.warn('Slow request detected', {
      route,
      duration,
      threshold: 1000,
      timestamp: new Date().toISOString(),
    });
  }

  private alertSlowQuery(query: string, duration: number): void {
    logger.warn('Slow database query detected', {
      query: query.substring(0, 100),
      duration,
      threshold: 100,
      timestamp: new Date().toISOString(),
    });
  }

  private alertHighMemoryUsage(usage: NodeJS.MemoryUsage): void {
    logger.warn('High memory usage detected', {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      threshold: '400MB',
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Performance Testing Integration

#### Automated Performance Tests

```typescript
// ✅ Performance test integration
export class PerformanceTestRunner {
  constructor(
    private app: TestApp,
    private monitor: PerformanceMonitor
  ) {}

  async runPerformanceTests(): Promise<PerformanceTestResults> {
    const results: PerformanceTestResults = {
      endpoints: {},
      database: {},
      memory: {},
      overall: { passed: true, issues: [] },
    };

    // Test each endpoint
    for (const endpoint of this.getTestEndpoints()) {
      results.endpoints[endpoint.name] = await this.testEndpointPerformance(endpoint);
    }

    // Test database performance
    results.database = await this.testDatabasePerformance();

    // Test memory usage
    results.memory = await this.testMemoryPerformance();

    // Evaluate overall performance
    results.overall = this.evaluateOverallPerformance(results);

    return results;
  }

  private async testEndpointPerformance(endpoint: TestEndpoint): Promise<EndpointTestResult> {
    const iterations = 100;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      const response = await request(this.app.server).get(endpoint.path).set('Authorization', endpoint.authToken);

      const duration = Date.now() - startTime;
      durations.push(duration);

      if (response.status !== 200) {
        throw new Error(`Endpoint ${endpoint.name} returned status ${response.status}`);
      }
    }

    const stats = this.calculateStats(durations);

    return {
      endpoint: endpoint.name,
      stats,
      passed: stats.p95 < endpoint.maxResponseTime,
      issues:
        stats.p95 >= endpoint.maxResponseTime
          ? [`95th percentile response time (${stats.p95}ms) exceeds target (${endpoint.maxResponseTime}ms)`]
          : [],
    };
  }

  private async testDatabasePerformance(): Promise<DatabaseTestResult> {
    const testQueries = [
      { name: 'simple-select', query: () => db.select().from(products).limit(10) },
      {
        name: 'complex-join',
        query: () => db.select().from(products).leftJoin(categories, eq(products.categoryId, categories.id)).limit(10),
      },
      { name: 'aggregation', query: () => db.select({ count: count() }).from(products) },
    ];

    const results: { [key: string]: QueryTestResult } = {};

    for (const testQuery of testQueries) {
      const iterations = 50;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await testQuery.query();
        const duration = Date.now() - startTime;
        durations.push(duration);
      }

      const stats = this.calculateStats(durations);
      results[testQuery.name] = {
        query: testQuery.name,
        stats,
        passed: stats.mean < 50, // 50ms average target
        issues: stats.mean >= 50 ? [`Average query time (${stats.mean}ms) exceeds target (50ms)`] : [],
      };
    }

    return {
      queries: results,
      passed: Object.values(results).every(r => r.passed),
      issues: Object.values(results).flatMap(r => r.issues),
    };
  }

  private async testMemoryPerformance(): Promise<MemoryTestResult> {
    const initialMemory = process.memoryUsage();

    // Perform memory-intensive operations
    await this.simulateMemoryIntensiveOperations();

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const maxAllowedIncrease = 100 * 1024 * 1024; // 100MB

    return {
      initialMemory: Math.round(initialMemory.heapUsed / 1024 / 1024),
      finalMemory: Math.round(finalMemory.heapUsed / 1024 / 1024),
      memoryIncrease: Math.round(memoryIncrease / 1024 / 1024),
      passed: memoryIncrease < maxAllowedIncrease,
      issues:
        memoryIncrease >= maxAllowedIncrease
          ? [`Memory increase (${Math.round(memoryIncrease / 1024 / 1024)}MB) exceeds target (100MB)`]
          : [],
    };
  }
}
```

## 🔍 **Performance Profiling**

### Query Analysis

#### Slow Query Detection and Optimization

```typescript
// ✅ Query performance analyzer
export class QueryAnalyzer {
  private slowQueries = new Map<string, SlowQueryInfo>();

  analyzeQuery(query: string, duration: number, params?: any[]): void {
    if (duration > 100) {
      // Queries taking more than 100ms
      const normalizedQuery = this.normalizeQuery(query);

      if (!this.slowQueries.has(normalizedQuery)) {
        this.slowQueries.set(normalizedQuery, {
          query: normalizedQuery,
          occurrences: 0,
          totalDuration: 0,
          maxDuration: 0,
          avgDuration: 0,
          firstSeen: new Date(),
          lastSeen: new Date(),
          examples: [],
        });
      }

      const slowQuery = this.slowQueries.get(normalizedQuery)!;
      slowQuery.occurrences++;
      slowQuery.totalDuration += duration;
      slowQuery.maxDuration = Math.max(slowQuery.maxDuration, duration);
      slowQuery.avgDuration = slowQuery.totalDuration / slowQuery.occurrences;
      slowQuery.lastSeen = new Date();

      if (slowQuery.examples.length < 5) {
        slowQuery.examples.push({ params, duration, timestamp: new Date() });
      }
    }
  }

  generateOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const [query, info] of this.slowQueries) {
      const recommendation = this.analyzeSlowQuery(query, info);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private analyzeSlowQuery(query: string, info: SlowQueryInfo): OptimizationRecommendation | null {
    const suggestions: string[] = [];
    let priority = 1;

    // Check for missing indexes
    if (query.includes('WHERE') && !query.includes('INDEX')) {
      suggestions.push('Consider adding indexes for WHERE clause columns');
      priority += 2;
    }

    // Check for SELECT *
    if (query.includes('SELECT *')) {
      suggestions.push('Specify only needed columns instead of SELECT *');
      priority += 1;
    }

    // Check for N+1 query patterns
    if (info.occurrences > 10 && query.includes('WHERE id =')) {
      suggestions.push('Potential N+1 query - consider using JOIN or batch loading');
      priority += 3;
    }

    // Check for missing LIMIT
    if (!query.includes('LIMIT') && query.includes('SELECT')) {
      suggestions.push('Add LIMIT clause to prevent large result sets');
      priority += 1;
    }

    // Check for inefficient ORDER BY
    if (query.includes('ORDER BY') && !query.includes('INDEX')) {
      suggestions.push('Add index for ORDER BY columns');
      priority += 2;
    }

    if (suggestions.length === 0) {
      return null;
    }

    return {
      query,
      avgDuration: info.avgDuration,
      occurrences: info.occurrences,
      priority,
      suggestions,
      impact: this.calculateImpact(info),
    };
  }

  private calculateImpact(info: SlowQueryInfo): 'low' | 'medium' | 'high' {
    const totalTimeSpent = info.totalDuration;
    const frequency = info.occurrences;

    if (totalTimeSpent > 10000 || frequency > 100) {
      // 10 seconds total or > 100 occurrences
      return 'high';
    } else if (totalTimeSpent > 5000 || frequency > 50) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
```

### Application Profiling

#### CPU and Memory Profiling

```typescript
// ✅ Application performance profiler
export class ApplicationProfiler {
  private cpuProfile: CPUProfile | null = null;
  private memoryProfile: MemoryProfile | null = null;

  async startCPUProfiling(): Promise<void> {
    const inspector = require('inspector');
    const session = new inspector.Session();
    session.connect();

    return new Promise(resolve => {
      session.post('Profiler.enable', () => {
        session.post('Profiler.start', resolve);
      });
    });
  }

  async stopCPUProfiling(): Promise<CPUProfile> {
    const inspector = require('inspector');
    const session = new inspector.Session();

    return new Promise(resolve => {
      session.post('Profiler.stop', (err, { profile }) => {
        session.disconnect();
        this.cpuProfile = this.analyzeCPUProfile(profile);
        resolve(this.cpuProfile);
      });
    });
  }

  startMemoryProfiling(): void {
    const interval = setInterval(() => {
      const usage = process.memoryUsage();

      if (!this.memoryProfile) {
        this.memoryProfile = {
          samples: [],
          startTime: Date.now(),
          peakUsage: usage.heapUsed,
          averageUsage: usage.heapUsed,
        };
      }

      this.memoryProfile.samples.push({
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        rss: usage.rss,
        external: usage.external,
      });

      this.memoryProfile.peakUsage = Math.max(this.memoryProfile.peakUsage, usage.heapUsed);
      this.memoryProfile.averageUsage =
        this.memoryProfile.samples.reduce((sum, sample) => sum + sample.heapUsed, 0) /
        this.memoryProfile.samples.length;

      // Keep only last 1000 samples
      if (this.memoryProfile.samples.length > 1000) {
        this.memoryProfile.samples.shift();
      }
    }, 1000); // Sample every second

    return () => clearInterval(interval);
  }

  generatePerformanceReport(): PerformanceReport {
    return {
      cpu: this.cpuProfile,
      memory: this.memoryProfile,
      recommendations: this.generateRecommendations(),
      timestamp: new Date(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: require('os').cpus().length,
      },
    };
  }

  private generateRecommendations(): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // CPU recommendations
    if (this.cpuProfile) {
      const hotFunctions = this.cpuProfile.functions
        .filter(fn => fn.selfTime > 100) // Functions taking more than 100ms
        .sort((a, b) => b.selfTime - a.selfTime);

      hotFunctions.forEach(fn => {
        recommendations.push({
          type: 'cpu',
          severity: fn.selfTime > 500 ? 'high' : 'medium',
          message: `Function '${fn.name}' is CPU intensive (${fn.selfTime}ms self time)`,
          suggestion: 'Consider optimizing this function or breaking it into smaller parts',
        });
      });
    }

    // Memory recommendations
    if (this.memoryProfile) {
      const peakUsageMB = this.memoryProfile.peakUsage / 1024 / 1024;

      if (peakUsageMB > 512) {
        recommendations.push({
          type: 'memory',
          severity: 'high',
          message: `High memory usage detected (${Math.round(peakUsageMB)}MB peak)`,
          suggestion: 'Review memory usage patterns and implement proper cleanup',
        });
      }

      // Check for memory leaks
      const samples = this.memoryProfile.samples;
      if (samples.length > 100) {
        const recentSamples = samples.slice(-50);
        const oldSamples = samples.slice(0, 50);

        const recentAvg = recentSamples.reduce((sum, s) => sum + s.heapUsed, 0) / recentSamples.length;
        const oldAvg = oldSamples.reduce((sum, s) => sum + s.heapUsed, 0) / oldSamples.length;

        const growthRate = (recentAvg - oldAvg) / oldAvg;

        if (growthRate > 0.1) {
          // 10% growth
          recommendations.push({
            type: 'memory',
            severity: 'medium',
            message: `Memory usage is growing (${Math.round(growthRate * 100)}% increase)`,
            suggestion: 'Investigate potential memory leaks',
          });
        }
      }
    }

    return recommendations;
  }
}
```

## 📋 **Performance Checklist**

### Pre-Deployment Performance Audit

#### Database Performance

- [ ] **Indexes**: All search, filter, and sort columns have appropriate indexes
- [ ] **Query Optimization**: No N+1 queries, efficient joins, proper use of LIMIT
- [ ] **Connection Pool**: Optimized pool size and connection settings
- [ ] **Query Analysis**: Slow query monitoring and optimization in place

#### API Performance

- [ ] **Response Times**: All endpoints meet target response times (<200ms)
- [ ] **Caching**: Appropriate HTTP caching headers set
- [ ] **Request Limits**: Request size and rate limiting implemented
- [ ] **Error Handling**: Efficient error processing without performance impact

#### Memory Management

- [ ] **Memory Usage**: Application memory usage under 512MB
- [ ] **Garbage Collection**: Proper object cleanup and GC optimization
- [ ] **Memory Leaks**: No memory leaks detected in extended testing
- [ ] **Resource Cleanup**: Database connections and other resources properly closed

#### Monitoring & Alerting

- [ ] **Performance Metrics**: Comprehensive metrics collection in place
- [ ] **Slow Query Detection**: Automatic slow query detection and alerting
- [ ] **Memory Monitoring**: Memory usage monitoring and alerts
- [ ] **Response Time Tracking**: Request duration monitoring across all endpoints

### Production Performance Monitoring

#### Real-time Monitoring

```typescript
// ✅ Production performance monitoring setup
export const setupProductionMonitoring = () => {
  const monitor = new PerformanceMonitor();

  // Monitor all HTTP requests
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      monitor.trackRequest(req.route?.path || req.path, duration);
    });

    next();
  });

  // Monitor database queries
  db.on('query', (query, duration) => {
    monitor.trackDbQuery(query, duration);
  });

  // Monitor memory usage every minute
  setInterval(() => {
    monitor.trackMemoryUsage();
  }, 60000);

  // Generate performance reports every hour
  setInterval(() => {
    const stats = monitor.getPerformanceStats();
    logger.info('Performance statistics', stats);
  }, 3600000);
};
```

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Performance Targets**: <200ms response time, >100 RPS throughput  
**Review Schedule**: Monthly performance analysis required
