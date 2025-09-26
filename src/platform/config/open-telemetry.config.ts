import 'dotenv/config';

export interface OpenTelemetryConfig {
  enabled: boolean;
  serviceName: string;
  otlpEndpoint?: string;
}

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return fallback;
};

export const telemetryEnabled = toBoolean(process.env.OTEL_ENABLED, false);
export const telemetryServiceName = process.env.OTEL_SERVICE_NAME ?? 'elysia-clean-architecture';
export const telemetryEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
