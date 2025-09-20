import 'dotenv/config';
import { inject, injectable } from 'tsyringe';
import pino, { Logger as Pino } from 'pino';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import type { AppConfig } from '../config/app-config';

// import { GenReqId, ReqId } from 'pino-http';
// import { nanoid } from 'nanoid';
import { IncomingMessage } from 'http';
import { context, trace } from '@opentelemetry/api';
import 'dotenv/config';
import { k8s } from '../config/otlp.config';

// const genReqId: GenReqId = (req: IncomingMessage, res: ServerResponse) => {
//   const reqId = req.id as string;

//   const xRequestId = req.headers['x-request-id'] as string;
//   const id: string = reqId ?? xRequestId ?? nanoid();

//   res.setHeader('x-request-id', id);
//   return id as ReqId;
// };

@injectable()
export class PinoLogger implements LoggerPort {
  private readonly logger: Pino;

  constructor(@inject(TOKENS.AppConfig) private readonly config: AppConfig) {
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
