import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserDrizzleRepository } from '../../external/drizzle/users/user.drizzle.repository';
import { PostDrizzleRepository } from '../../external/drizzle/posts/post.drizzle.repository';
import { PinoLogger } from '../../external/logging/pinoLogger';
import { appConfig } from '../../external/config/app-config';
import type { AppConfig } from '../../external/config/app-config';
import { TOKENS } from './tokens';
import { UserRepository } from '../domain/users/service/user.repository';
import { PostRepository } from '../domain/posts/service/post.repository';
import type { LoggerPort } from './logger/logger.port';

// Register implementations
container.register<AppConfig>(TOKENS.AppConfig, { useValue: appConfig });
container.registerSingleton<UserRepository>(TOKENS.IUserRepository, UserDrizzleRepository);
container.registerSingleton<PostRepository>(TOKENS.IPostRepository, PostDrizzleRepository);
container.registerSingleton<LoggerPort>(TOKENS.Logger, PinoLogger);

export { container };
