import { performance } from 'node:perf_hooks';
import { inject, injectable } from 'tsyringe';

import { db } from '@platform/database/connection';
import { PlatformTokens } from '@platform/di/tokens';
import type { LoggerPort } from '@shared/logging/logger.port';

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
  constructor(@inject(PlatformTokens.Logger) private readonly logger: LoggerPort) {}

  async checkSystemHealth(): Promise<SystemHealthStatus> {
    const startTime = Date.now();

    this.logger.debug('Starting system health check');

    const checks: HealthCheckResult[] = [];

    const healthChecks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemoryUsage(),
      this.checkDiskSpace(),
      this.checkEnvironmentVariables(),
      this.checkExternalDependencies(),
    ]);

    healthChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        const services = ['database', 'memory', 'disk', 'environment', 'external'];
        checks.push({
          service: services[index] || 'unknown',
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

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

  async checkLiveness(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    try {
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

  async checkReadiness(): Promise<{
    status: 'ready' | 'not_ready';
    timestamp: string;
    details?: Record<string, unknown>;
  }> {
    try {
      const startTime = Date.now();

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

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      await db.execute('SELECT 1 as health_check');

      const responseTime = Date.now() - startTime;

      const poolStatus = this.getConnectionPoolStatus();

      let status: 'healthy' | 'degraded' = 'healthy';
      if (responseTime > 1000) {
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

  private determineOverallStatus(checks: HealthCheckResult[]): SystemHealthStatus['status'] {
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    if (hasUnhealthy) {
      return 'unhealthy';
    }

    const hasDegraded = checks.some(check => check.status === 'degraded');
    if (hasDegraded) {
      return 'degraded';
    }

    return 'healthy';
  }

  private getConnectionPoolStatus() {
    return {};
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;

    const status: HealthCheckResult['status'] = heapUsedMB / heapTotalMB > 0.9 ? 'degraded' : 'healthy';

    return {
      service: 'memory',
      status,
      timestamp: new Date().toISOString(),
      details: {
        heapUsedMB,
        heapTotalMB,
        rssMB: memoryUsage.rss / 1024 / 1024,
      },
    };
  }

  private async checkDiskSpace(): Promise<HealthCheckResult> {
    return {
      service: 'disk',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details: {
        available: 'unknown',
      },
    };
  }

  private async checkEnvironmentVariables(): Promise<HealthCheckResult> {
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    return {
      service: 'environment',
      status: missingVars.length ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      details: {
        missingVars,
      },
    };
  }

  private async checkExternalDependencies(): Promise<HealthCheckResult> {
    return {
      service: 'external',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  async getDetailedMetrics(): Promise<Record<string, unknown>> {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    const eventLoop = await this.measureEventLoopLag();

    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
        arrayBuffers: memory.arrayBuffers,
      },
      cpu: {
        user: cpu.user,
        system: cpu.system,
      },
      eventLoop: {
        lag: eventLoop,
      },
      database: {
        connectionPool: this.getConnectionPoolStatus(),
      },
    };
  }

  private async measureEventLoopLag(): Promise<number> {
    return new Promise(resolve => {
      const start = performance.now();
      setImmediate(() => {
        const end = performance.now();
        resolve(end - start);
      });
    });
  }
}
