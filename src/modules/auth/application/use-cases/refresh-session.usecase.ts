import 'reflect-metadata';
import { inject, injectable } from 'tsyringe';

import { AccountsModuleTokens } from '@modules/accounts/module.tokens';
import { UserRepository } from '@modules/accounts/domain/ports/user.repository';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import { type RefreshTokenPlain } from '@modules/auth/domain/entities/refresh-token.entity';
import { AuthTokenService } from '@modules/auth/domain/ports/auth-token.service';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { UnauthorizedError } from '@shared/errors/error-mapper';
import { type AuthenticatedUser, BaseAuthUseCase } from '../base/base-auth.usecase';

export interface RefreshSessionInput {
  refreshToken: RefreshTokenPlain;
}

@injectable()
export class RefreshSessionUseCase extends BaseAuthUseCase<RefreshSessionInput, AuthenticatedUser> {
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

  async execute(input: RefreshSessionInput): Promise<AuthenticatedUser> {
    const { storedToken } = await this.validateAndRetrieveRefreshToken(input.refreshToken);

    await this.revokeRefreshTokenByJti(storedToken.jti);

    const user = await this.userRepository.getById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedError('Associated user not found');
    }

    return await this.generateTokensForUserWithoutRevoke(user);
  }
}
