import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserDrizzleRepository } from '../../external/drizzle/users/user.drizzle.repository';
import { PinoLogger } from '../../external/logging/pinoLogger';
import { appConfig } from '../../external/config/app-config';
import type { AppConfig } from '../../external/config/app-config';
import { TOKENS } from './tokens';
import { UserRepository } from '../domain/users/service/user.repository';
import type { LoggerPort } from './logger/logger.port';

// Register implementations
container.register<AppConfig>(TOKENS.AppConfig, { useValue: appConfig });
container.registerSingleton<UserRepository>(TOKENS.IUserRepository, UserDrizzleRepository);
container.registerSingleton<LoggerPort>(TOKENS.Logger, PinoLogger);

export { container };
