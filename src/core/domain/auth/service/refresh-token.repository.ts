import type { UserId } from '../../users/entity/user.entity';
import type { IRefreshToken, RefreshTokenJti, RefreshTokenRevokedAt } from '../entity/refresh-token.entity';

export abstract class RefreshTokenRepository {
  abstract create(token: IRefreshToken): Promise<IRefreshToken>;
  abstract findByJti(jti: RefreshTokenJti): Promise<IRefreshToken | undefined>;
  abstract revokeByJti(jti: RefreshTokenJti, revokedAt: RefreshTokenRevokedAt): Promise<void>;
  abstract revokeAllByUserId(userId: UserId, revokedAt: RefreshTokenRevokedAt): Promise<void>;
}
