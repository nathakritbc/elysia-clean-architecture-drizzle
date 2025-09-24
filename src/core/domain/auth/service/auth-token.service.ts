import { Brand } from '../../../shared/branded.type';
import type { IUser } from '../../users/entity/user.entity';
import type { RefreshTokenExpiresAt, RefreshTokenHash, RefreshTokenJti } from '../entity/refresh-token.entity';

export type AccessTokenExpiresAt = Brand<Date, 'AccessTokenExpiresAt'>;

export interface GeneratedAuthTokens {
  accessToken: string;
  accessTokenExpiresAt: AccessTokenExpiresAt;
  refreshToken: string;
  refreshTokenHash: RefreshTokenHash;
  refreshTokenExpiresAt: RefreshTokenExpiresAt;
  jti: RefreshTokenJti;
}

export abstract class AuthTokenService {
  abstract generateTokens(user: IUser): Promise<GeneratedAuthTokens>;
}
