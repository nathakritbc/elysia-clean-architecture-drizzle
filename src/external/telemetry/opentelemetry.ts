import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import type { LoggerPort } from '../../core/shared/logger/logger.port';
import type { AppConfig } from '../config/app-config';

export type TelemetryController = {
  shutdown(): Promise<void>;
};

let sdk: NodeSDK | undefined;

const buildCollectorUrl = (endpoint: string, resourcePath: string): string => {
  const normalizedPath = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
  const base = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  return new URL(normalizedPath, `${base}/`).toString();
};

export const createTraceExporter = (
  endpoint: string | undefined,
  logger: LoggerPort,
  options: { warnOnMissing?: boolean } = {}
): OTLPTraceExporter | undefined => {
  if (!endpoint) {
    if (options.warnOnMissing ?? true) {
      logger.warn('OTLP endpoint not configured; traces will not be exported');
    }
    return undefined;
  }

  try {
    const url = buildCollectorUrl(endpoint, 'v1/traces');
    return new OTLPTraceExporter({ url });
  } catch (error) {
    logger.error('Invalid OTLP exporter endpoint', { endpoint, error });
    return undefined;
  }
};

export const initializeTelemetry = async (
  config: AppConfig,
  logger: LoggerPort
): Promise<TelemetryController | null> => {
  if (!config.telemetry.enabled) {
    logger.debug('OpenTelemetry disabled via configuration');
    return null;
  }

  try {
    const exporter = createTraceExporter(config.telemetry.otlpEndpoint, logger);

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
