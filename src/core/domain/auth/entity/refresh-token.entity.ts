import * as argon2 from 'argon2';
import { Brand } from '../../../shared/branded.type';
import type { UserId } from '../../users/entity/user.entity';

export type RefreshTokenId = Brand<string, 'RefreshTokenId'>;
export type RefreshTokenJti = Brand<string, 'RefreshTokenJti'>;
export type RefreshTokenHash = Brand<string, 'RefreshTokenHash'>;
export type RefreshTokenPlain = Brand<string, 'RefreshTokenPlain'>;
export type RefreshTokenCreatedAt = Brand<Date, 'RefreshTokenCreatedAt'>;
export type RefreshTokenExpiresAt = Brand<Date, 'RefreshTokenExpiresAt'>;
export type RefreshTokenRevokedAt = Brand<Date, 'RefreshTokenRevokedAt'>;

export interface IRefreshToken {
  id: RefreshTokenId;
  userId: UserId;
  jti: RefreshTokenJti;
  tokenHash: RefreshTokenHash;
  createdAt?: RefreshTokenCreatedAt;
  expiresAt: RefreshTokenExpiresAt;
  revokedAt?: RefreshTokenRevokedAt;

  compareToken(token: RefreshTokenPlain): Promise<boolean>;
  markRevoked(revokedAt?: RefreshTokenRevokedAt): void;
  isRevoked(): boolean;
  isExpired(referenceDate?: Date): boolean;
}

export class RefreshToken implements IRefreshToken {
  id: RefreshTokenId = '' as RefreshTokenId;
  userId: UserId = '' as UserId;
  jti: RefreshTokenJti = '' as RefreshTokenJti;
  tokenHash: RefreshTokenHash = '' as RefreshTokenHash;
  createdAt?: RefreshTokenCreatedAt;
  expiresAt: RefreshTokenExpiresAt = new Date() as RefreshTokenExpiresAt;
  revokedAt?: RefreshTokenRevokedAt;

  async compareToken(token: RefreshTokenPlain): Promise<boolean> {
    return argon2.verify(this.tokenHash, token);
  }

  markRevoked(revokedAt: RefreshTokenRevokedAt = new Date() as RefreshTokenRevokedAt): void {
    this.revokedAt = revokedAt;
  }

  isRevoked(): boolean {
    return Boolean(this.revokedAt);
  }

  isExpired(referenceDate: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= referenceDate.getTime();
  }
}
