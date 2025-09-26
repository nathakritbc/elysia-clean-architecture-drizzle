import type { Elysia } from 'elysia';
import type { DependencyContainer } from 'tsyringe';

import { AuthTokenService } from '@modules/auth/domain/ports/auth-token.service';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { AuthConfig, authConfig } from '@modules/auth/infrastructure/config/auth.config';
import { RefreshTokenDrizzleRepository } from '@modules/auth/infrastructure/persistence/refresh-token.drizzle.repository';
import { JwtTokenService } from '@modules/auth/infrastructure/providers/jwt-token.service';
import { LogoutController } from '@modules/auth/interface/http/controllers/logout.controller';
import { RefreshSessionController } from '@modules/auth/interface/http/controllers/refresh-session.controller';
import { SignInController } from '@modules/auth/interface/http/controllers/sign-in.controller';
import { SignUpController } from '@modules/auth/interface/http/controllers/sign-up.controller';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import type { ModuleDefinition } from '@platform/di/module-definition';

export const authModule: ModuleDefinition = {
  name: 'auth',
  register(container: DependencyContainer) {
    container.register<AuthConfig>(AuthModuleTokens.AuthConfig, { useValue: authConfig });
    container.registerSingleton<RefreshTokenRepository>(
      AuthModuleTokens.RefreshTokenRepository,
      RefreshTokenDrizzleRepository
    );
    container.registerSingleton<AuthTokenService>(AuthModuleTokens.AuthTokenService, JwtTokenService);
  },
  routes(app: Elysia, container: DependencyContainer) {
    container.resolve(SignUpController).register(app);
    container.resolve(SignInController).register(app);
    container.resolve(RefreshSessionController).register(app);
    container.resolve(LogoutController).register(app);
  },
};

export default authModule;
