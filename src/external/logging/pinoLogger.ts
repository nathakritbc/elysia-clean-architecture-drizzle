import 'dotenv/config';
import { inject, injectable } from 'tsyringe';
import pino, { Logger as Pino } from 'pino';

import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import type { AppConfig } from '../config/app-config';

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
