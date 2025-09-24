import 'reflect-metadata';

import { container } from './core/shared/container';
import type { LoggerPort } from './core/shared/logger/logger.port';
import { TOKENS } from './core/shared/tokens';
import { createRoutes } from './external/api/routes';
import type { AppConfig } from './external/config/app-config';
import { initializeTelemetry, TelemetryController } from './external/telemetry/opentelemetry';

const bootstrap = async () => {
  const config = container.resolve<AppConfig>(TOKENS.AppConfig);
  const logger = container.resolve<LoggerPort>(TOKENS.Logger);

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
