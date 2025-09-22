import type { AuthConfig } from '../../../external/config/auth.config';
import type { RefreshTokenCookieConfig } from '../../../external/config/auth.config';

const sameSiteLabel = {
  lax: 'Lax',
  strict: 'Strict',
  none: 'None',
} as const;

type SameSiteKey = keyof typeof sameSiteLabel;

type CookieRecord = Record<string, string>;

export const parseCookies = (header: string | null | undefined): CookieRecord => {
  if (!header) {
    return {};
  }

  return header.split(';').reduce<CookieRecord>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) {
      return acc;
    }

    const value = rawValue.join('=');
    acc[rawKey] = decodeURIComponent(value ?? '');
    return acc;
  }, {});
};

const buildBaseCookieAttributes = (cookieConfig: RefreshTokenCookieConfig) => {
  const attributes = [`Path=${cookieConfig.path}`];

  if (cookieConfig.domain) {
    attributes.push(`Domain=${cookieConfig.domain}`);
  }

  const sameSiteKey = cookieConfig.sameSite as SameSiteKey;
  attributes.push(`SameSite=${sameSiteLabel[sameSiteKey]}`);

  if (cookieConfig.httpOnly) {
    attributes.push('HttpOnly');
  }

  if (cookieConfig.secure) {
    attributes.push('Secure');
  }

  return attributes;
};

export const buildRefreshTokenCookie = (token: string, expiresAt: Date, config: AuthConfig): string => {
  const base = buildBaseCookieAttributes(config.refreshTokenCookie);
  base.unshift(
    `${config.refreshTokenCookie.name}=${encodeURIComponent(token)}`,
    `Max-Age=${config.refreshTokenCookie.maxAgeSeconds}`,
    `Expires=${expiresAt.toUTCString()}`
  );

  return base.join('; ');
};

export const buildRefreshTokenCsrfCookie = (token: string, expiresAt: Date, config: AuthConfig): string => {
  const base = buildBaseCookieAttributes(config.refreshTokenCsrfCookie);
  base.unshift(
    `${config.refreshTokenCsrfCookie.name}=${encodeURIComponent(token)}`,
    `Max-Age=${config.refreshTokenCsrfCookie.maxAgeSeconds}`,
    `Expires=${expiresAt.toUTCString()}`
  );

  return base.join('; ');
};

export const buildClearRefreshTokenCookie = (config: AuthConfig): string => {
  const base = buildBaseCookieAttributes(config.refreshTokenCookie);
  base.unshift(`${config.refreshTokenCookie.name}=`, 'Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return base.join('; ');
};

export const buildClearRefreshTokenCsrfCookie = (config: AuthConfig): string => {
  const base = buildBaseCookieAttributes(config.refreshTokenCsrfCookie);
  base.unshift(`${config.refreshTokenCsrfCookie.name}=`, 'Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return base.join('; ');
};
