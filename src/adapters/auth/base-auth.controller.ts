import { nanoid } from 'nanoid';
import { inject, injectable } from 'tsyringe';

import type { IUser } from '../../core/domain/users/entity/user.entity';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { TOKENS } from '../../core/shared/tokens';
import {
  buildClearRefreshTokenCookie,
  buildClearRefreshTokenCsrfCookie,
  buildRefreshTokenCookie,
  buildRefreshTokenCsrfCookie,
  parseCookies,
} from '../../core/shared/utils/cookie.util';
import type { AuthConfig } from '../../external/config/auth.config';
import { toUserResponse } from './transformers';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface AuthResult {
  user: IUser;
  tokens: AuthTokens;
}

@injectable()
export class BaseAuthController {
  constructor(
    @inject(TOKENS.AuthConfig) protected readonly authConfig: AuthConfig,
    @inject(TOKENS.Logger) protected readonly logger: LoggerPort
  ) {}

  /**
   * Sets authentication cookies (refresh token and CSRF token)
   * Returns the generated CSRF token
   */
  protected setAuthCookies(set: unknown, tokens: AuthTokens): string {
    const csrfToken = nanoid();
    const cookies = [
      buildRefreshTokenCookie(tokens.refreshToken, tokens.refreshTokenExpiresAt, this.authConfig),
      buildRefreshTokenCsrfCookie(csrfToken, tokens.refreshTokenExpiresAt, this.authConfig),
    ];

    this.setCookies(set, cookies);
    return csrfToken;
  }

  /**
   * Clears authentication cookies
   */
  protected clearAuthCookies(set: unknown): void {
    const cookiesToClear = [
      buildClearRefreshTokenCookie(this.authConfig),
      buildClearRefreshTokenCsrfCookie(this.authConfig),
    ];

    this.setCookies(set, cookiesToClear);
  }

  /**
   * Sets cookies in the response headers
   */
  protected setCookies(set: unknown, cookies: string[]): void {
    const setObj = set as { headers?: Record<string, unknown> };
    setObj.headers = setObj.headers ?? {};
    const existing = setObj.headers['Set-Cookie'];
    const currentCookies = Array.isArray(existing) ? existing : existing ? [existing] : [];
    setObj.headers['Set-Cookie'] = [...currentCookies, ...cookies].join('; ');
  }

  /**
   * Parses cookies from request headers
   */
  protected parseRequestCookies(request: Request): Record<string, string> {
    const cookieHeader = request.headers.get('cookie') ?? request.headers.get('Cookie');
    return parseCookies(cookieHeader);
  }

  /**
   * Creates a standardized auth response
   */
  protected createAuthResponse(user: IUser, tokens: AuthTokens, csrfToken: string) {
    return {
      user: toUserResponse(user),
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      csrf_token: csrfToken,
    };
  }

  /**
   * Handles errors with consistent logging
   */
  protected handleError(error: unknown, context: string, metadata?: Record<string, unknown>): never {
    const normalizedError = error instanceof Error ? error : new Error('Unknown error');

    this.logger.error(`Failed to ${context}`, {
      ...metadata,
      error: normalizedError,
    });

    throw error;
  }

  /**
   * Logs successful operations
   */
  protected logSuccess(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(message, metadata);
  }

  /**
   * Generates a unique request ID for tracking
   */
  protected generateRequestId(): string {
    return nanoid();
  }
}
