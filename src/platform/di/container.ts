import 'reflect-metadata';
import { container } from 'tsyringe';

import type { AppConfig } from '@platform/config/app-config';
import { appConfig } from '@platform/config/app-config';
import { PinoLogger } from '@platform/logging/pino.logger';
import { PlatformTokens } from '@platform/di/tokens';
import type { LoggerPort } from '@shared/logging/logger.port';

container.register<AppConfig>(PlatformTokens.AppConfig, { useValue: appConfig });
container.registerSingleton<LoggerPort>(PlatformTokens.Logger, PinoLogger);

export { container };
