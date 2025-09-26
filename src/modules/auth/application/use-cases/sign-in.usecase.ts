import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import { AccountsModuleTokens } from '@modules/accounts/module.tokens';
import type { UserEmail, UserPassword } from '@modules/accounts/domain/entities/user.entity';
import { UserRepository } from '@modules/accounts/domain/ports/user.repository';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import { AuthTokenService } from '@modules/auth/domain/ports/auth-token.service';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { UnauthorizedError } from '@shared/errors/error-mapper';
import { type AuthenticatedUser, BaseAuthUseCase } from '../base/base-auth.usecase';

export interface SignInInput {
  email: UserEmail;
  password: UserPassword;
}

@injectable()
export class SignInUseCase extends BaseAuthUseCase<SignInInput, AuthenticatedUser> {
  constructor(
    @inject(AccountsModuleTokens.UserRepository)
    protected readonly userRepository: UserRepository,
    @inject(AuthModuleTokens.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(AuthModuleTokens.AuthTokenService)
    protected readonly authTokenService: AuthTokenService
  ) {
    super(userRepository, refreshTokenRepository, authTokenService);
  }

  async execute(input: SignInInput): Promise<AuthenticatedUser> {
    const user = await this.userRepository.getByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await user.comparePassword(input.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return await this.generateTokensForUser(user);
  }
}
