import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserDrizzleRepository } from '../../external/drizzle/users/user.drizzle.repository';
import { TOKENS } from './tokens';
import { UserRepository } from '../domain/users/service/user.repository';

// Register implementations
container.registerSingleton<UserRepository>(TOKENS.IUserRepository, UserDrizzleRepository);

export { container };
