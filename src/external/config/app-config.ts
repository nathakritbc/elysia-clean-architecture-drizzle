import 'dotenv/config';
import {
  OpenTelemetryConfig,
  telemetryEnabled,
  telemetryEndpoint,
  telemetryServiceName,
} from './open-telemetry.config';
import { loggerTransport, LoggingConfig, logLevel } from './logger.config';
import { DatabaseConfig, databaseUrl } from './postgres-db.config';
import { corsConfig } from './cors.config';
export interface AppConfig {
  env: string;
  server: ServerConfig;
  logging: LoggingConfig;
  telemetry: OpenTelemetryConfig;
  database: DatabaseConfig;
  cors: typeof corsConfig;
}

export interface ServerConfig {
  host: string;
  port: number;
}

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = process.env.NODE_ENV ?? 'development';
const port = toNumber(process.env.PORT, 7000);
const host = process.env.HOST ?? '0.0.0.0';

export const appConfig: AppConfig = {
  env,
  server: {
    host,
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
  cors: corsConfig,
};
