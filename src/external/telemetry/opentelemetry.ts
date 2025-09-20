import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

import type { AppConfig } from '../config/appConfig';
import type { LoggerPort } from '../../core/shared/logger/logger.port';

export type TelemetryController = {
  shutdown(): Promise<void>;
};

let sdk: NodeSDK | undefined;

export const initializeTelemetry = async (
  config: AppConfig,
  logger: LoggerPort
): Promise<TelemetryController | null> => {
  if (!config.telemetry.enabled) {
    logger.debug('OpenTelemetry disabled via configuration');
    return null;
  }

  try {
    const exporter = config.telemetry.otlpEndpoint
      ? new OTLPTraceExporter({ url: config.telemetry.otlpEndpoint })
      : undefined;

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]: config.telemetry.serviceName,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.env,
      }),
      traceExporter: exporter,
      instrumentations: [],
    });

    await sdk.start();
    logger.info('OpenTelemetry initialized', {
      serviceName: config.telemetry.serviceName,
      exporter: exporter ? 'otlp-http' : 'default',
    });

    return {
      shutdown: async () => {
        if (!sdk) {
          return;
        }

        try {
          await sdk.shutdown();
          logger.info('OpenTelemetry shutdown complete');
        } catch (error) {
          logger.error('Failed to shut down OpenTelemetry', { error });
        } finally {
          sdk = undefined;
        }
      },
    };
  } catch (error) {
    logger.error('OpenTelemetry initialization failed', { error });
    return null;
  }
};
