import { nanoid } from 'nanoid';
import { inject, injectable } from 'tsyringe';

import type { IUser } from '@modules/accounts/domain/entities/user.entity';
import { AuthModuleTokens } from '@modules/auth/module.tokens';
import type { AuthConfig } from '@modules/auth/infrastructure/config/auth.config';
import { toUserResponse } from '@modules/auth/interface/http/transformers/auth.transformers';
import type { LoggerPort } from '@shared/logging/logger.port';
import { PlatformTokens } from '@platform/di/tokens';
import {
  buildClearRefreshTokenCookie,
  buildClearRefreshTokenCsrfCookie,
  buildRefreshTokenCookie,
  buildRefreshTokenCsrfCookie,
  parseCookies,
} from '@shared/utils/cookie.util';

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
    @inject(AuthModuleTokens.AuthConfig) protected readonly authConfig: AuthConfig,
    @inject(PlatformTokens.Logger) protected readonly logger: LoggerPort
  ) {}

  protected setAuthCookies(set: unknown, tokens: AuthTokens): string {
    const csrfToken = nanoid();
    const cookies = [
      buildRefreshTokenCookie(tokens.refreshToken, tokens.refreshTokenExpiresAt, this.authConfig),
      buildRefreshTokenCsrfCookie(csrfToken, tokens.refreshTokenExpiresAt, this.authConfig),
    ];

    this.setCookies(set, cookies);
    return csrfToken;
  }

  protected clearAuthCookies(set: unknown): void {
    const cookiesToClear = [
      buildClearRefreshTokenCookie(this.authConfig),
      buildClearRefreshTokenCsrfCookie(this.authConfig),
    ];

    this.setCookies(set, cookiesToClear);
  }

  protected setCookies(set: unknown, cookies: string[]): void {
    const setObj = set as { headers?: Record<string, unknown> };
    setObj.headers = setObj.headers ?? {};
    const existing = setObj.headers['Set-Cookie'];
    const currentCookies = Array.isArray(existing) ? existing : existing ? [existing] : [];
    setObj.headers['Set-Cookie'] = [...currentCookies, ...cookies].join('; ');
  }

  protected parseRequestCookies(request: Request): Record<string, string> {
    const cookieHeader = request.headers.get('cookie') ?? request.headers.get('Cookie');
    return parseCookies(cookieHeader);
  }

  protected createAuthResponse(user: IUser, tokens: AuthTokens, csrfToken: string) {
    return {
      user: toUserResponse(user),
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      csrf_token: csrfToken,
    };
  }

  protected handleError(error: unknown, context: string, metadata?: Record<string, unknown>): never {
    const normalizedError = error instanceof Error ? error : new Error('Unknown error');

    this.logger.error(`Failed to ${context}`, {
      ...metadata,
      error: normalizedError,
    });

    throw error;
  }

  protected logSuccess(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(message, metadata);
  }

  protected generateRequestId(): string {
    return nanoid();
  }
}
