import 'dotenv/config';
export type ServerConfig = {
  host: string;
  port: number;
};

export type LoggingConfig = {
  level: string;
  transport?: {
    target: string;
    options: {
      colorize: boolean;
    };
  };
};

export type TelemetryConfig = {
  enabled: boolean;
  serviceName: string;
  otlpEndpoint?: string;
};

export type DatabaseConfig = {
  url: string;
};

export type AppConfig = {
  env: string;
  server: ServerConfig;
  logging: LoggingConfig;
  telemetry: TelemetryConfig;
  database: DatabaseConfig;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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

const env = process.env.NODE_ENV ?? 'development';
const port = toNumber(process.env.PORT, 3000);
const logLevel = process.env.LOG_LEVEL ?? (env === 'production' ? 'info' : 'debug');
const telemetryEnabled = toBoolean(process.env.OTEL_ENABLED, false);
const telemetryServiceName = process.env.OTEL_SERVICE_NAME ?? 'elysia-clean-architecture';
const telemetryEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const databaseUrl = process.env.DATABASE_URL ?? '';

//Logger
const loggerTransport =
  env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined;

export const appConfig: AppConfig = {
  env,
  server: {
    host: process.env.HOST ?? '0.0.0.0',
    port,
  },
  logging: {
    level: logLevel,
    transport: loggerTransport,
  },
  telemetry: {
    enabled: telemetryEnabled,
    serviceName: telemetryServiceName,
    otlpEndpoint: telemetryEndpoint,
  },
  database: {
    url: databaseUrl,
  },
};
