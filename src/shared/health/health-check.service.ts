import { inject, injectable } from 'tsyringe';

import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import { db } from '../../external/drizzle/connection';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime?: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheckResult[];
}

@injectable()
export class HealthCheckService {
  constructor(@inject(TOKENS.Logger) private readonly logger: LoggerPort) {}

  /**
   * Perform comprehensive system health check
   */
  async checkSystemHealth(): Promise<SystemHealthStatus> {
    const startTime = Date.now();

    this.logger.debug('Starting system health check');

    const checks: HealthCheckResult[] = [];

    // Run all health checks in parallel
    const healthChecks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemoryUsage(),
      this.checkDiskSpace(),
      this.checkEnvironmentVariables(),
      this.checkExternalDependencies(),
    ]);

    // Process results
    healthChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        // Handle rejected promises
        const services = ['database', 'memory', 'disk', 'environment', 'external'];
        checks.push({
          service: services[index] || 'unknown',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // Determine overall system status
    const overallStatus = this.determineOverallStatus(checks);

    const healthStatus: SystemHealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      checks,
    };

    const responseTime = Date.now() - startTime;

    this.logger.info('System health check completed', {
      status: overallStatus,
      responseTime,
      healthyServices: checks.filter(c => c.status === 'healthy').length,
      totalServices: checks.length,
    });

    return healthStatus;
  }

  /**
   * Quick health check for liveness probe
   */
  async checkLiveness(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
      // Basic application responsiveness check
      const timestamp = new Date().toISOString();

      return {
        status: 'ok',
        timestamp,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? (error instanceof Error ? error.message : 'Unknown error') : 'Unknown error';
      this.logger.error('Liveness check failed', { error: errorMessage });
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Readiness check for readiness probe
   */
  async checkReadiness(): Promise<{
    status: 'ready' | 'not_ready';
    timestamp: string;
    details?: Record<string, unknown>;
  }> {
    try {
      const startTime = Date.now();

      // Check critical dependencies
      const dbCheck = await this.checkDatabase();
      const envCheck = await this.checkEnvironmentVariables();

      const isReady = dbCheck.status === 'healthy' && envCheck.status === 'healthy';

      const result = {
        status: isReady ? ('ready' as const) : ('not_ready' as const),
        timestamp: new Date().toISOString(),
        details: {
          database: dbCheck.status,
          environment: envCheck.status,
          responseTime: Date.now() - startTime,
        },
      };

      this.logger.debug('Readiness check completed', result);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? (error instanceof Error ? error.message : 'Unknown error') : 'Unknown error';
      this.logger.error('Readiness check failed', { error: errorMessage });
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      await db.execute('SELECT 1 as health_check');

      const responseTime = Date.now() - startTime;

      // Check connection pool status if available
      const poolStatus = this.getConnectionPoolStatus();

      // Determine status based on response time
      let status: 'healthy' | 'degraded' = 'healthy';
      if (responseTime > 1000) {
        // > 1 second is considered degraded
        status = 'degraded';
      }

      return {
        service: 'database',
        status,
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          connectionPool: poolStatus,
          query: 'SELECT 1 as health_check',
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        service: 'database',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);

      // Define thresholds
      const WARNING_THRESHOLD = 400; // MB
      const CRITICAL_THRESHOLD = 800; // MB

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (heapUsedMB > CRITICAL_THRESHOLD) {
        status = 'unhealthy';
      } else if (heapUsedMB > WARNING_THRESHOLD) {
        status = 'degraded';
      }

      return {
        service: 'memory',
        status,
        timestamp: new Date().toISOString(),
        details: {
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          rss: `${rssMB}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
          thresholds: {
            warning: `${WARNING_THRESHOLD}MB`,
            critical: `${CRITICAL_THRESHOLD}MB`,
          },
        },
      };
    } catch (error) {
      return {
        service: 'memory',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<HealthCheckResult> {
    try {
      // This is a simplified check - in production, you might want to use a library
      // to get actual disk usage information like 'node-disk-usage' or system commands

      return {
        service: 'disk',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: {
          message: 'Disk space check completed',
          // In a real implementation, you'd check actual disk usage
          // using libraries like 'node-disk-usage' or system commands
        },
      };
    } catch (error) {
      return {
        service: 'disk',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check critical environment variables
   */
  private async checkEnvironmentVariables(): Promise<HealthCheckResult> {
    try {
      const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET', 'CSRF_SECRET'];

      const missingVars: string[] = [];
      const weakSecrets: string[] = [];

      for (const varName of requiredVars) {
        const value = process.env[varName];

        if (!value) {
          missingVars.push(varName);
        } else if (varName.includes('SECRET') && value.length < 32) {
          weakSecrets.push(varName);
        }
      }

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (missingVars.length > 0) {
        status = 'unhealthy';
      } else if (weakSecrets.length > 0) {
        status = 'degraded';
      }

      return {
        service: 'environment',
        status,
        timestamp: new Date().toISOString(),
        details: {
          requiredVariables: requiredVars.length,
          configuredVariables: requiredVars.length - missingVars.length,
          missingVariables: missingVars,
          weakSecrets: weakSecrets,
          nodeEnv: process.env.NODE_ENV || 'undefined',
        },
        ...(missingVars.length > 0 && { error: `Missing variables: ${missingVars.join(', ')}` }),
      };
    } catch (error) {
      return {
        service: 'environment',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check external dependencies
   */
  private async checkExternalDependencies(): Promise<HealthCheckResult> {
    try {
      // In a real application, you might check:
      // - External APIs
      // - Redis connection
      // - Message queues
      // - File storage services
      // etc.

      const checks = await Promise.allSettled([
        // Example external service checks
        this.checkExternalService('health-check', async () => {
          // Placeholder for external service check
          return { status: 'healthy', responseTime: 50 };
        }),
      ]);

      const failedChecks = checks.filter(check => check.status === 'rejected').length;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (failedChecks > 0) {
        status = failedChecks === checks.length ? 'unhealthy' : 'degraded';
      }

      return {
        service: 'external',
        status,
        timestamp: new Date().toISOString(),
        details: {
          totalChecks: checks.length,
          passedChecks: checks.length - failedChecks,
          failedChecks,
        },
      };
    } catch (error) {
      return {
        service: 'external',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generic external service check
   */
  private async checkExternalService<T>(
    serviceName: string,
    checkFunction: () => Promise<T>
  ): Promise<{ service: string; result: T }> {
    const result = await checkFunction();
    return { service: serviceName, result };
  }

  /**
   * Get connection pool status
   */
  private getConnectionPoolStatus(): Record<string, unknown> {
    try {
      // This would depend on your specific database connection implementation
      // For Drizzle with pg, you might access pool statistics differently
      return {
        status: 'available',
        // Add actual pool statistics here
        totalConnections: 'unknown',
        idleConnections: 'unknown',
        waitingClients: 'unknown',
      };
    } catch {
      return { status: 'unavailable' };
    }
  }

  /**
   * Determine overall system status based on individual checks
   */
  private determineOverallStatus(checks: HealthCheckResult[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = checks.filter(check => check.status === 'unhealthy').length;
    const degradedCount = checks.filter(check => check.status === 'degraded').length;

    // Critical services that must be healthy
    const criticalServices = ['database', 'environment'];
    const criticalUnhealthy = checks.filter(
      check => criticalServices.includes(check.service) && check.status === 'unhealthy'
    ).length;

    if (criticalUnhealthy > 0 || unhealthyCount > checks.length / 2) {
      return 'unhealthy';
    }

    if (unhealthyCount > 0 || degradedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get detailed metrics for monitoring
   */
  async getDetailedMetrics(): Promise<Record<string, unknown>> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoop: {
        // This would require additional libraries for detailed event loop metrics
        lag: 'unavailable',
      },
      database: {
        // Add database-specific metrics
        connectionPool: this.getConnectionPoolStatus(),
      },
    };
  }
}
