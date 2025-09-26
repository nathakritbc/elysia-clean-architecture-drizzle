import { Elysia, t } from 'elysia';
import { inject, injectable } from 'tsyringe';

import type { LoggerPort } from '@shared/logging/logger.port';
import { PlatformTokens } from '@platform/di/tokens';
import { HealthCheckService, type SystemHealthStatus } from '@platform/health/health-check.service';

@injectable()
export class HealthController {
  constructor(
    @inject(HealthCheckService) private readonly healthCheckService: HealthCheckService,
    @inject(PlatformTokens.Logger) private readonly logger: LoggerPort
  ) {}

  register(app: Elysia) {
    // Basic health check endpoint
    app.get(
      '/health',
      async () => {
        try {
          const health = await this.healthCheckService.checkLiveness();
          return health;
        } catch (error: unknown) {
          this.logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
          throw error;
        }
      },
      {
        response: t.Object({
          status: t.Union([t.Literal('ok'), t.Literal('error')]),
          timestamp: t.String(),
        }),
        detail: {
          summary: 'Basic health check',
          description: 'Returns basic application health status for liveness probes',
          tags: ['Health'],
        },
      }
    );

    // Detailed health check endpoint
    app.get(
      '/health/detailed',
      async () => {
        try {
          const health = await this.healthCheckService.checkSystemHealth();

          // Set appropriate HTTP status based on health
          // Status code will be handled by Elysia response schema

          return health;
        } catch (error) {
          this.logger.error('Detailed health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Union([t.Literal('healthy'), t.Literal('unhealthy'), t.Literal('degraded')]),
            timestamp: t.String(),
            version: t.String(),
            uptime: t.Number(),
            checks: t.Array(
              t.Object({
                service: t.String(),
                status: t.Union([t.Literal('healthy'), t.Literal('unhealthy'), t.Literal('degraded')]),
                timestamp: t.String(),
                responseTime: t.Optional(t.Number()),
                details: t.Optional(t.Record(t.String(), t.Any())),
                error: t.Optional(t.String()),
              })
            ),
          }),
          503: t.Object({
            status: t.Literal('unhealthy'),
            timestamp: t.String(),
            version: t.String(),
            uptime: t.Number(),
            checks: t.Array(t.Any()),
          }),
        },
        detail: {
          summary: 'Detailed health check',
          description: 'Returns comprehensive system health information including all subsystems',
          tags: ['Health'],
        },
      }
    );

    // Readiness probe endpoint
    app.get(
      '/health/ready',
      async () => {
        try {
          const readiness = await this.healthCheckService.checkReadiness();

          // Set HTTP status based on readiness
          // Status code will be handled by Elysia response schema

          return readiness;
        } catch (error) {
          this.logger.error('Readiness check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Literal('ready'),
            timestamp: t.String(),
            details: t.Optional(t.Any()),
          }),
          503: t.Object({
            status: t.Literal('not_ready'),
            timestamp: t.String(),
            details: t.Optional(t.Any()),
          }),
        },
        detail: {
          summary: 'Readiness check',
          description: 'Returns application readiness status for readiness probes',
          tags: ['Health'],
        },
      }
    );

    // Liveness probe endpoint
    app.get(
      '/health/live',
      async () => {
        try {
          const liveness = await this.healthCheckService.checkLiveness();
          return liveness;
        } catch (error) {
          this.logger.error('Liveness check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      {
        response: t.Object({
          status: t.Union([t.Literal('ok'), t.Literal('error')]),
          timestamp: t.String(),
        }),
        detail: {
          summary: 'Liveness check',
          description: 'Returns application liveness status for liveness probes',
          tags: ['Health'],
        },
      }
    );

    // System metrics endpoint
    app.get(
      '/health/metrics',
      async () => {
        try {
          const metrics = await this.healthCheckService.getDetailedMetrics();
          return {
            timestamp: metrics.timestamp as string,
            uptime: metrics.uptime as number,
            nodeVersion: metrics.nodeVersion as string,
            platform: metrics.platform as string,
            arch: metrics.arch as string,
            pid: metrics.pid as number,
            memory: metrics.memory as {
              rss: number;
              heapTotal: number;
              heapUsed: number;
              external: number;
              arrayBuffers: number;
            },
            cpu: metrics.cpu as {
              user: number;
              system: number;
            },
            eventLoop: metrics.eventLoop as {
              lag: number | string;
            },
            database: metrics.database as {
              connectionPool: Record<string, unknown>;
            },
          };
        } catch (error) {
          this.logger.error('Metrics collection failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      {
        response: t.Object({
          timestamp: t.String(),
          uptime: t.Number(),
          nodeVersion: t.String(),
          platform: t.String(),
          arch: t.String(),
          pid: t.Number(),
          memory: t.Object({
            rss: t.Number(),
            heapTotal: t.Number(),
            heapUsed: t.Number(),
            external: t.Number(),
            arrayBuffers: t.Number(),
          }),
          cpu: t.Object({
            user: t.Number(),
            system: t.Number(),
          }),
          eventLoop: t.Object({
            lag: t.Union([t.Number(), t.String()]),
          }),
          database: t.Object({
            connectionPool: t.Record(t.String(), t.Any()),
          }),
        }),
        detail: {
          summary: 'System metrics',
          description: 'Returns detailed system metrics for monitoring and observability',
          tags: ['Health', 'Metrics'],
        },
      }
    );

    // Health status endpoint with custom format for monitoring tools
    app.get(
      '/health/status',
      async ({ query }) => {
        try {
          const format = query.format || 'json';
          const health = await this.healthCheckService.checkSystemHealth();

          if (format === 'prometheus') {
            // Return Prometheus-style metrics
            const promMetrics = this.formatForPrometheus(health);
            return new Response(promMetrics, {
              headers: { 'Content-Type': 'text/plain' },
            });
          }

          return health;
        } catch (error) {
          this.logger.error('Health status check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      {
        query: t.Object({
          format: t.Optional(t.Union([t.Literal('json'), t.Literal('prometheus')])),
        }),
        detail: {
          summary: 'Health status with format options',
          description: 'Returns health status in various formats for different monitoring tools',
          tags: ['Health', 'Monitoring'],
        },
      }
    );
  }

  /**
   * Format health data for Prometheus metrics
   */
  private formatForPrometheus(health: SystemHealthStatus): string {
    const metrics: string[] = [];

    // Overall health status
    metrics.push(`# HELP system_health_status Overall system health status (0=unhealthy, 1=degraded, 2=healthy)`);
    metrics.push(`# TYPE system_health_status gauge`);
    const statusValue = health.status === 'healthy' ? 2 : health.status === 'degraded' ? 1 : 0;
    metrics.push(`system_health_status ${statusValue}`);

    // System uptime
    metrics.push(`# HELP system_uptime_seconds System uptime in seconds`);
    metrics.push(`# TYPE system_uptime_seconds counter`);
    metrics.push(`system_uptime_seconds ${health.uptime}`);

    // Service health status
    metrics.push(
      `# HELP service_health_status Health status of individual services (0=unhealthy, 1=degraded, 2=healthy)`
    );
    metrics.push(`# TYPE service_health_status gauge`);

    health.checks.forEach(check => {
      const serviceStatusValue = check.status === 'healthy' ? 2 : check.status === 'degraded' ? 1 : 0;
      metrics.push(`service_health_status{service="${check.service}"} ${serviceStatusValue}`);

      if (check.responseTime !== undefined) {
        metrics.push(`# HELP service_response_time_ms Service response time in milliseconds`);
        metrics.push(`# TYPE service_response_time_ms gauge`);
        metrics.push(`service_response_time_ms{service="${check.service}"} ${check.responseTime}`);
      }
    });

    return metrics.join('\n') + '\n';
  }
}
