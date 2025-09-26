import 'dotenv/config';
import { IncomingMessage } from 'http';
import pino, { Logger as Pino } from 'pino';
import { inject, injectable } from 'tsyringe';

import { context, trace } from '@opentelemetry/api';

import type { LoggerPort } from '@shared/logging/logger.port';
import type { AppConfig } from '@platform/config/app-config';
import { k8s } from '@platform/config/otlp.config';
import { PlatformTokens } from '@platform/di/tokens';

@injectable()
export class PinoLogger implements LoggerPort {
  private readonly logger: Pino;

  constructor(@inject(PlatformTokens.AppConfig) private readonly config: AppConfig) {
    this.logger = pino({
      level: config.logging.level,
      transport: config.logging.transport,
      base: {
        env: config.env,
        service: config.telemetry.serviceName,
      },
      redact: {
        paths: ['res.headers', '[*].remoteAddress', '[*].remotePort'],
        remove: true,
      },
      serializers: {
        req(req: IncomingMessage): Record<string, unknown> {
          return req as unknown as Record<string, unknown>;
        },
      },
      formatters: {
        log(object: Record<string, unknown>): Record<string, unknown> {
          const span = trace.getSpan(context.active());
          const environment = k8s.namespace;
          if (!span) {
            return { ...object, environment };
          }
          const { spanId, traceId } = span.spanContext();
          return { ...object, spanId, traceId, environment };
        },
      },
    });
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    const details = this.normalizeMetadata(metadata);
    if (details) {
      this.logger.debug(details, message);
    } else {
      this.logger.debug(message);
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    const details = this.normalizeMetadata(metadata);
    if (details) {
      this.logger.info(details, message);
    } else {
      this.logger.info(message);
    }
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    const details = this.normalizeMetadata(metadata);
    if (details) {
      this.logger.warn(details, message);
    } else {
      this.logger.warn(message);
    }
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    const details = this.normalizeMetadata(metadata);
    if (details) {
      this.logger.error(details, message);
    } else {
      this.logger.error(message);
    }
  }

  private normalizeMetadata(metadata?: Record<string, unknown>) {
    if (!metadata) {
      return undefined;
    }

    const entries = Object.entries(metadata).map(([key, value]) => {
      if (value instanceof Error) {
        return [key, { name: value.name, message: value.message, stack: value.stack }];
      }

      return [key, value];
    });

    if (entries.length === 0) {
      return undefined;
    }

    return Object.fromEntries(entries);
  }
}
