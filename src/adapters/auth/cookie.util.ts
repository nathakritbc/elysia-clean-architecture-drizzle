import type { AuthConfig } from '../../external/config/auth.config';

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

const buildBaseCookieAttributes = (config: AuthConfig) => {
  const attributes = [`Path=${config.refreshTokenCookie.path}`];

  if (config.refreshTokenCookie.domain) {
    attributes.push(`Domain=${config.refreshTokenCookie.domain}`);
  }

  const sameSiteKey = config.refreshTokenCookie.sameSite as SameSiteKey;
  attributes.push(`SameSite=${sameSiteLabel[sameSiteKey]}`);
  attributes.push('HttpOnly');

  if (config.refreshTokenCookie.secure) {
    attributes.push('Secure');
  }

  return attributes;
};

export const buildRefreshTokenCookie = (token: string, expiresAt: Date, config: AuthConfig): string => {
  const base = buildBaseCookieAttributes(config);
  base.unshift(
    `${config.refreshTokenCookie.name}=${encodeURIComponent(token)}`,
    `Max-Age=${config.refreshTokenCookie.maxAgeSeconds}`,
    `Expires=${expiresAt.toUTCString()}`
  );

  return base.join('; ');
};

export const buildClearRefreshTokenCookie = (config: AuthConfig): string => {
  const base = buildBaseCookieAttributes(config);
  base.unshift(`${config.refreshTokenCookie.name}=`, 'Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return base.join('; ');
};
