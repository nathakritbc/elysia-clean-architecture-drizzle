import type { IUser } from '@modules/accounts/domain/entities/user.entity';
import type {
  RefreshTokenExpiresAt,
  RefreshTokenHash,
  RefreshTokenJti,
} from '@modules/auth/domain/entities/refresh-token.entity';
import { Brand } from '@shared/kernel/brand.type';

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
