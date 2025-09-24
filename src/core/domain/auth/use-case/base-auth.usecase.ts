import { Builder } from 'builder-pattern';
import 'reflect-metadata';
import { inject } from 'tsyringe';

import { UnauthorizedError } from '../../../shared/errors/error-mapper';
import { TOKENS } from '../../../shared/tokens';
import { IUseCase } from '../../../shared/useCase';
import type { IUser } from '../../users/entity/user.entity';
import { UserRepository } from '../../users/service/user.repository';
import {
  IRefreshToken,
  RefreshToken,
  RefreshTokenJti,
  RefreshTokenPlain,
  RefreshTokenRevokedAt,
} from '../entity/refresh-token.entity';
import { AuthTokenService } from '../service/auth-token.service';
import type { GeneratedAuthTokens } from '../service/auth-token.service';
import { RefreshTokenRepository } from '../service/refresh-token.repository';

export interface AuthenticatedUser {
  user: IUser;
  tokens: GeneratedAuthTokens;
}

/**
 * Base class for authentication use cases that return AuthenticatedUser
 * Provides common token generation and user management logic
 */
export abstract class BaseAuthUseCase<Input, Output> implements IUseCase<Input, Output> {
  constructor(
    @inject(TOKENS.IUserRepository)
    protected readonly userRepository: UserRepository,
    @inject(TOKENS.RefreshTokenRepository)
    protected readonly refreshTokenRepository: RefreshTokenRepository,
    @inject(TOKENS.AuthTokenService)
    protected readonly authTokenService: AuthTokenService
  ) {}

  abstract execute(input: Input): Promise<Output>;

  /**
   * Prepares user for response by hiding sensitive information
   */
  private prepareUserForResponse(user: IUser): void {
    user.hiddenPassword();
  }

  /**
   * Creates a new refresh token and stores it in the database
   */
  private async createAndStoreRefreshToken(user: IUser, tokens: GeneratedAuthTokens): Promise<void> {
    const refreshToken = Builder(RefreshToken)
      .userId(user.id)
      .jti(tokens.jti)
      .tokenHash(tokens.refreshTokenHash)
      .expiresAt(tokens.refreshTokenExpiresAt)
      .build();

    await this.refreshTokenRepository.create(refreshToken);
  }

  /**
   * Generates tokens and creates refresh token for a user
   */
  private async generateTokensAndCreateRefreshToken(user: IUser): Promise<GeneratedAuthTokens> {
    const tokens = await this.authTokenService.generateTokens(user);
    await this.createAndStoreRefreshToken(user, tokens);
    return tokens;
  }

  /**
   * Common method to generate tokens and create refresh token for a user
   * This is the template method that encapsulates the common token flow
   */
  protected async generateTokensForUser(user: IUser): Promise<AuthenticatedUser> {
    // Revoke all existing refresh tokens for this user
    const revokedAt = new Date() as RefreshTokenRevokedAt;
    await this.refreshTokenRepository.revokeAllByUserId(user.id, revokedAt);

    // Generate tokens and create refresh token
    const tokens = await this.generateTokensAndCreateRefreshToken(user);

    // Prepare user for response
    this.prepareUserForResponse(user);

    return {
      user,
      tokens,
    };
  }

  /**
   * Common method to generate tokens and create refresh token for a user
   * without revoking existing tokens (useful for refresh-session)
   */
  public async generateTokensForUserWithoutRevoke(user: IUser): Promise<AuthenticatedUser> {
    // Generate tokens and create refresh token
    const tokens = await this.generateTokensAndCreateRefreshToken(user);

    // Prepare user for response
    this.prepareUserForResponse(user);

    return {
      user,
      tokens,
    };
  }

  /**
   * Common method to revoke refresh token by JTI
   */
  protected async revokeRefreshTokenByJti(jti: RefreshTokenJti): Promise<void> {
    const revokedAt = new Date() as RefreshTokenRevokedAt;
    await this.refreshTokenRepository.revokeByJti(jti, revokedAt);
  }

  /**
   * Common method to validate refresh token format and extract JTI
   */
  protected validateRefreshTokenFormat(refreshToken: RefreshTokenPlain): RefreshTokenJti {
    const parts = refreshToken.split('.');
    const [jti, secret] = parts;

    if (!jti || !secret || parts.length !== 2) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return jti as RefreshTokenJti;
  }

  /**
   * Validates token status (revoked, expired) and token comparison
   */
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

  /**
   * Common method to validate and retrieve refresh token from database
   * Returns the stored token if valid, throws error if invalid
   */
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
