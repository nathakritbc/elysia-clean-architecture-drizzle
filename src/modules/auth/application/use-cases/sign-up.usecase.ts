import { Builder } from 'builder-pattern';
import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import { AccountsModuleTokens } from '@modules/accounts/module.tokens';
import type { BUserName, UserEmail, UserPassword, UserStatus } from '@modules/accounts/domain/entities/user.entity';
import { User } from '@modules/accounts/domain/entities/user.entity';
import { UserRepository } from '@modules/accounts/domain/ports/user.repository';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import { AuthTokenService } from '@modules/auth/domain/ports/auth-token.service';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { ConflictError } from '@shared/errors/error-mapper';
import { EStatus } from '@shared/kernel/status.enum';
import { type AuthenticatedUser, BaseAuthUseCase } from '../base/base-auth.usecase';

export interface SignUpInput {
  name: BUserName;
  email: UserEmail;
  password: UserPassword;
}

@injectable()
export class SignUpUseCase extends BaseAuthUseCase<SignUpInput, AuthenticatedUser> {
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

  async execute(input: SignUpInput): Promise<AuthenticatedUser> {
    const existingUser = await this.userRepository.getByEmail(input.email);

    if (existingUser) {
      throw new ConflictError('Email is already registered');
    }

    const user = Builder(User)
      .email(input.email)
      .name(input.name)
      .status(EStatus.active as UserStatus)
      .build();

    await user.setHashPassword(input.password);

    const createdUser = await this.userRepository.create(user);

    return await this.generateTokensForUser(createdUser);
  }
}
