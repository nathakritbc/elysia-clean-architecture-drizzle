import { injectable, inject } from 'tsyringe';
import { nanoid } from 'nanoid';
import * as argon2 from 'argon2';
import jwt from '@elysiajs/jwt';
import {
  AuthTokenService,
  GeneratedAuthTokens,
  AccessTokenExpiresAt,
} from '../../core/domain/auth/service/auth-token.service';
import type { IUser } from '../../core/domain/users/entity/user.entity';
import {
  RefreshTokenHash,
  RefreshTokenJti,
  RefreshTokenExpiresAt,
} from '../../core/domain/auth/entity/refresh-token.entity';
import type { AuthConfig } from '../config/auth.config';
import { DEFAULT_ACCESS_TOKEN_EXPIRES_IN, DEFAULT_REFRESH_TOKEN_EXPIRES_IN } from '../config/auth.config';
import { TOKENS } from '../../core/shared/tokens';
import { addDuration } from '../../core/shared/utils/duration';
import { argon2Config } from '../config/auth.config';

type JwtSignFunction = ReturnType<typeof jwt>['decorator']['jwt']['sign'];

@injectable()
export class JwtTokenService extends AuthTokenService {
  private readonly signAccessToken: JwtSignFunction;

  constructor(@inject(TOKENS.AuthConfig) private readonly config: AuthConfig) {
    super();
    const plugin = jwt({
      secret: config.jwt.secret,
      iss: config.jwt.issuer,
      ...(config.jwt.audience ? { aud: config.jwt.audience } : {}),
      exp: config.jwt.accessTokenExpiresIn,
    });

    this.signAccessToken = plugin.decorator.jwt.sign.bind(plugin.decorator.jwt);
  }

  async generateTokens(user: IUser): Promise<GeneratedAuthTokens> {
    const jtiValue = nanoid(32);
    const jti = jtiValue as RefreshTokenJti;
    const issuedAt = new Date();

    const accessTokenExpiresAt = addDuration(
      issuedAt,
      this.config.jwt.accessTokenExpiresIn,
      DEFAULT_ACCESS_TOKEN_EXPIRES_IN
    ) as AccessTokenExpiresAt;

    const refreshTokenExpiresAt = addDuration(
      issuedAt,
      this.config.jwt.refreshTokenExpiresIn,
      DEFAULT_REFRESH_TOKEN_EXPIRES_IN
    ) as RefreshTokenExpiresAt;

    const accessToken = await this.signAccessToken({
      sub: user.id as unknown as string,
      email: user.email as unknown as string,
      jti: jtiValue,
      type: 'access',
    });

    const refreshSecret = nanoid(64);
    const refreshToken = `${jtiValue}.${refreshSecret}`;

    const argon2Options: argon2.Options = {
      type: argon2.argon2id,
      memoryCost: argon2Config.memoryCost,
      timeCost: argon2Config.timeCost,
      parallelism: argon2Config.parallelism,
      salt: argon2Config.saltBuffer,
    };

    const refreshTokenHash = (await argon2.hash(refreshToken, argon2Options)) as RefreshTokenHash;

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
      jti,
    };
  }
}
