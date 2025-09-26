import { Builder } from 'builder-pattern';
import 'reflect-metadata';
import { inject } from 'tsyringe';

import { AccountsModuleTokens } from '@modules/accounts/module.tokens';
import type { IUser } from '@modules/accounts/domain/entities/user.entity';
import { UserRepository } from '@modules/accounts/domain/ports/user.repository';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import {
  RefreshToken,
  type IRefreshToken,
  type RefreshTokenJti,
  type RefreshTokenPlain,
  type RefreshTokenRevokedAt,
} from '@modules/auth/domain/entities/refresh-token.entity';
import { AuthTokenService, type GeneratedAuthTokens } from '@modules/auth/domain/ports/auth-token.service';
import { RefreshTokenRepository } from '@modules/auth/domain/ports/refresh-token.repository';
import { UnauthorizedError } from '@shared/errors/error-mapper';
import type { IUseCase } from '@shared/application/use-case';

export interface AuthenticatedUser {
  user: IUser;
  tokens: GeneratedAuthTokens;
}

export abstract class BaseAuthUseCase<Input, Output> implements IUseCase<Input, Output> {
  constructor(
    @inject(AccountsModuleTokens.UserRepository)
    protected readonly userRepository: UserRepository,
    @inject(AuthModuleTokens.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(AuthModuleTokens.AuthTokenService)
    protected readonly authTokenService: AuthTokenService
  ) {}

  abstract execute(input: Input): Promise<Output>;

  private prepareUserForResponse(user: IUser): void {
    user.hiddenPassword();
  }

  private async createAndStoreRefreshToken(user: IUser, tokens: GeneratedAuthTokens): Promise<void> {
    const refreshToken = Builder(RefreshToken)
      .userId(user.id)
      .jti(tokens.jti)
      .tokenHash(tokens.refreshTokenHash)
      .expiresAt(tokens.refreshTokenExpiresAt)
      .build();

    await this.refreshTokenRepository.create(refreshToken);
  }

  private async generateTokensAndCreateRefreshToken(user: IUser): Promise<GeneratedAuthTokens> {
    const tokens = await this.authTokenService.generateTokens(user);
    await this.createAndStoreRefreshToken(user, tokens);
    return tokens;
  }

  protected async generateTokensForUser(user: IUser): Promise<AuthenticatedUser> {
    const revokedAt = new Date() as RefreshTokenRevokedAt;
    await this.refreshTokenRepository.revokeAllByUserId(user.id, revokedAt);

    const tokens = await this.generateTokensAndCreateRefreshToken(user);

    this.prepareUserForResponse(user);

    return {
      user,
      tokens,
    };
  }

  public async generateTokensForUserWithoutRevoke(user: IUser): Promise<AuthenticatedUser> {
    const tokens = await this.generateTokensAndCreateRefreshToken(user);

    this.prepareUserForResponse(user);

    return {
      user,
      tokens,
    };
  }

  protected async revokeRefreshTokenByJti(jti: RefreshTokenJti): Promise<void> {
    const revokedAt = new Date() as RefreshTokenRevokedAt;
    await this.refreshTokenRepository.revokeByJti(jti, revokedAt);
  }

  protected validateRefreshTokenFormat(refreshToken: RefreshTokenPlain): RefreshTokenJti {
    const parts = refreshToken.split('.');
    const [jti, secret] = parts;

    if (!jti || !secret || parts.length !== 2) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return jti as RefreshTokenJti;
  }

  private async validateTokenStatus(storedToken: IRefreshToken, refreshToken: RefreshTokenPlain): Promise<void> {
    if (storedToken.isRevoked()) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (storedToken.isExpired()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const isValid = await storedToken.compareToken(refreshToken);
    if (!isValid) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  protected async validateAndRetrieveRefreshToken(
    refreshToken: RefreshTokenPlain
  ): Promise<{ storedToken: IRefreshToken; jti: RefreshTokenJti }> {
    const jti = this.validateRefreshTokenFormat(refreshToken);
    const storedToken = await this.refreshTokenRepository.findByJti(jti);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    await this.validateTokenStatus(storedToken, refreshToken);

    return { storedToken, jti };
  }
}
