import { randomBytes } from 'crypto';
import 'dotenv/config';

import { durationToSeconds } from '../../core/shared/utils/duration';

export const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = '15m';
export const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = '7d';

const normalizeBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
};

const normalizeSameSite = (value: string | undefined): 'lax' | 'strict' | 'none' => {
  const normalized = value?.toLowerCase();
  if (normalized === 'strict' || normalized === 'none') {
    return normalized;
  }
  return 'lax';
};

export interface JwtConfig {
  secret: string;
  issuer: string;
  audience?: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface RefreshTokenCookieConfig {
  name: string;
  path: string;
  domain?: string;
  sameSite: 'lax' | 'strict' | 'none';
  secure: boolean;
  httpOnly: boolean;
  maxAgeSeconds: number;
}

export interface AuthConfig {
  jwt: JwtConfig;
  refreshTokenCookie: RefreshTokenCookieConfig;
  refreshTokenCsrfCookie: RefreshTokenCookieConfig;
}

const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? DEFAULT_ACCESS_TOKEN_EXPIRES_IN;
const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? DEFAULT_REFRESH_TOKEN_EXPIRES_IN;

const cookieSecureDefault = process.env.NODE_ENV === 'production';

export const authConfig: AuthConfig = {
  jwt: {
    secret: process.env.JWT_SECRET ?? 'mySecret',
    issuer: process.env.JWT_ISSUER ?? 'elysia-app',
    audience: process.env.JWT_AUDIENCE,
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
  },
  refreshTokenCookie: {
    name: process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'refresh_token',
    path: process.env.REFRESH_TOKEN_COOKIE_PATH ?? '/',
    domain: process.env.REFRESH_TOKEN_COOKIE_DOMAIN,
    sameSite: normalizeSameSite(process.env.REFRESH_TOKEN_COOKIE_SAME_SITE),
    secure: normalizeBoolean(process.env.REFRESH_TOKEN_COOKIE_SECURE, cookieSecureDefault),
    httpOnly: true,
    maxAgeSeconds: durationToSeconds(refreshTokenExpiresIn, DEFAULT_REFRESH_TOKEN_EXPIRES_IN),
  },
  refreshTokenCsrfCookie: {
    name: process.env.REFRESH_TOKEN_CSRF_COOKIE_NAME ?? 'refresh_token_csrf',
    path: process.env.REFRESH_TOKEN_CSRF_COOKIE_PATH ?? '/',
    domain: process.env.REFRESH_TOKEN_CSRF_COOKIE_DOMAIN,
    sameSite: normalizeSameSite(process.env.REFRESH_TOKEN_CSRF_COOKIE_SAME_SITE),
    secure: normalizeBoolean(process.env.REFRESH_TOKEN_CSRF_COOKIE_SECURE, cookieSecureDefault),
    httpOnly: false,
    maxAgeSeconds: durationToSeconds(refreshTokenExpiresIn, DEFAULT_REFRESH_TOKEN_EXPIRES_IN),
  },
};

export const jwtConfig = authConfig.jwt;

export const argon2Config = {
  memoryCost: Number(process.env.ARGON2_MEMORY_COST ?? 19456),
  timeCost: Number(process.env.ARGON2_TIME_COST ?? 2),
  parallelism: Number(process.env.ARGON2_PARALLELISM ?? 1),
  saltBuffer: Buffer.from(randomBytes(16)),
};

// Default export for better module resolution
export default authConfig;
