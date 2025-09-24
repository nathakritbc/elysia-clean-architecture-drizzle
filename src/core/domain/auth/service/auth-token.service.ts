import { Brand } from '../../../shared/branded.type';
import type { IUser } from '../../users/entity/user.entity';
import type { RefreshTokenExpiresAt, RefreshTokenHash, RefreshTokenJti } from '../entity/refresh-token.entity';

export type AccessTokenExpiresAt = Brand<Date, 'AccessTokenExpiresAt'>;

export interface GeneratedAuthTokens {
  accessToken: string;
  accessTokenExpiresAt: AccessTokenExpiresAt;
  jti: RefreshTokenJti;
  refreshToken: string;
  refreshTokenExpiresAt: RefreshTokenExpiresAt;
  refreshTokenHash: RefreshTokenHash;
}

export abstract class AuthTokenService {
  abstract generateTokens(user: IUser): Promise<GeneratedAuthTokens>;
}
