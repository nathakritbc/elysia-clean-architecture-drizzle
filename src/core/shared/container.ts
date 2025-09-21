import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserDrizzleRepository } from '../../external/drizzle/users/user.drizzle.repository';
import { PostDrizzleRepository } from '../../external/drizzle/posts/post.drizzle.repository';
import { RefreshTokenDrizzleRepository } from '../../external/drizzle/auth/refresh-token.drizzle.repository';
import { PinoLogger } from '../../external/logging/pinoLogger';
import { appConfig } from '../../external/config/app-config';
import type { AppConfig } from '../../external/config/app-config';
import { authConfig } from '../../external/config/auth.config';
import type { AuthConfig } from '../../external/config/auth.config';
import { TOKENS } from './tokens';
import { UserRepository } from '../domain/users/service/user.repository';
import { PostRepository } from '../domain/posts/service/post.repository';
import { RefreshTokenRepository } from '../domain/auth/service/refresh-token.repository';
import { AuthTokenService } from '../domain/auth/service/auth-token.service';
import { JwtTokenService } from '../../external/auth/jwt-token.service';
import type { LoggerPort } from './logger/logger.port';

// Register implementations
container.register<AppConfig>(TOKENS.AppConfig, { useValue: appConfig });
container.register<AuthConfig>(TOKENS.AuthConfig, { useValue: authConfig });
container.registerSingleton<UserRepository>(TOKENS.IUserRepository, UserDrizzleRepository);
container.registerSingleton<PostRepository>(TOKENS.IPostRepository, PostDrizzleRepository);
container.registerSingleton<RefreshTokenRepository>(TOKENS.RefreshTokenRepository, RefreshTokenDrizzleRepository);
container.registerSingleton<AuthTokenService>(TOKENS.AuthTokenService, JwtTokenService);
container.registerSingleton<LoggerPort>(TOKENS.Logger, PinoLogger);

export { container };
