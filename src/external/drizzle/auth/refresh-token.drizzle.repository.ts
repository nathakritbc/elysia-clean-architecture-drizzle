import 'reflect-metadata';
import { eq } from 'drizzle-orm';
import { Builder } from 'builder-pattern';
import { injectable } from 'tsyringe';
import { db } from '../connection';
import { refreshTokens, type RefreshToken as DrizzleRefreshToken } from './refresh-token.schema';
import {
  IRefreshToken,
  RefreshToken,
  RefreshTokenCreatedAt,
  RefreshTokenExpiresAt,
  RefreshTokenHash,
  RefreshTokenId,
  RefreshTokenJti,
  RefreshTokenRevokedAt,
} from '../../../core/domain/auth/entity/refresh-token.entity';
import { RefreshTokenRepository } from '../../../core/domain/auth/service/refresh-token.repository';
import type { UserId } from '../../../core/domain/users/entity/user.entity';

@injectable()
export class RefreshTokenDrizzleRepository extends RefreshTokenRepository {
  async create(token: IRefreshToken): Promise<IRefreshToken> {
    const result = await db
      .insert(refreshTokens)
      .values({
        userId: token.userId as string,
        jti: token.jti as string,
        tokenHash: token.tokenHash as string,
        expiresAt: token.expiresAt as Date,
        revokedAt: token.revokedAt ? (token.revokedAt as Date) : null,
      })
      .returning();

    return this.toDomain(result[0]);
  }

  async findByJti(jti: RefreshTokenJti): Promise<IRefreshToken | undefined> {
    const result = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.jti, jti as string))
      .limit(1);

    return result[0] ? this.toDomain(result[0]) : undefined;
  }

  async revokeByJti(jti: RefreshTokenJti, revokedAt: RefreshTokenRevokedAt): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: revokedAt as Date })
      .where(eq(refreshTokens.jti, jti as string));
  }

  async revokeAllByUserId(userId: UserId, revokedAt: RefreshTokenRevokedAt): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: revokedAt as Date })
      .where(eq(refreshTokens.userId, userId as string));
  }

  private toDomain(drizzleToken: DrizzleRefreshToken): IRefreshToken {
    const builder = Builder(RefreshToken)
      .id(drizzleToken.id as RefreshTokenId)
      .userId(drizzleToken.userId as UserId)
      .jti(drizzleToken.jti as RefreshTokenJti)
      .tokenHash(drizzleToken.tokenHash as RefreshTokenHash)
      .createdAt(drizzleToken.createdAt as RefreshTokenCreatedAt)
      .expiresAt(drizzleToken.expiresAt as RefreshTokenExpiresAt);

    if (drizzleToken.revokedAt) {
      builder.revokedAt(drizzleToken.revokedAt as RefreshTokenRevokedAt);
    }

    return builder.build();
  }
}
