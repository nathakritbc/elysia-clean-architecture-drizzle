import 'reflect-metadata';

import { container } from '@platform/di/container';
import { PlatformTokens } from '@platform/di/tokens';
import type { AppConfig } from '@platform/config/app-config';
import { initializeTelemetry, TelemetryController } from '@platform/observability/opentelemetry';
import { createRoutes } from '@platform/http/routes';
import type { LoggerPort } from '@shared/logging/logger.port';

const bootstrap = async () => {
  const config = container.resolve<AppConfig>(PlatformTokens.AppConfig);
  const logger = container.resolve<LoggerPort>(PlatformTokens.Logger);

  let telemetry: TelemetryController | null = null;
  try {
    telemetry = await initializeTelemetry(config, logger);
  } catch (error) {
    logger.error('Failed to initialize telemetry', { error });
  }

  const app = createRoutes(config);

  app.listen({
    port: config.server.port,
    hostname: config.server.host,
  });

  const messageContext = {
    hostname: app.server?.hostname,
    port: app.server?.port,
  };

  logger.info('🦊 Elysia is running', messageContext);

  const shutdown = async (signal: string) => {
    logger.warn('Received shutdown signal, closing server', { signal });

    try {
      await app.stop();
      logger.info('HTTP server stopped');
    } catch (error) {
      logger.error('Error while stopping server', { error });
    }

    if (telemetry) {
      await telemetry.shutdown();
    }

    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

bootstrap().catch(error => {
  console.error('Failed to bootstrap application', error);
  process.exit(1);
});
