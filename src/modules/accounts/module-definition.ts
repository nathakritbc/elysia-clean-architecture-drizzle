import type { DependencyContainer } from 'tsyringe';

import { UserRepository } from '@modules/accounts/domain/ports/user.repository';
import { AccountsModuleTokens } from '@modules/accounts/module.tokens';
import { UserDrizzleRepository } from '@modules/accounts/infrastructure/persistence/user.drizzle.repository';
import type { ModuleDefinition } from '@platform/di/module-definition';

export const accountsModule: ModuleDefinition = {
  name: 'accounts',
  register(container: DependencyContainer) {
    container.registerSingleton<UserRepository>(AccountsModuleTokens.UserRepository, UserDrizzleRepository);
  },
};

export default accountsModule;
