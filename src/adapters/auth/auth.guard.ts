import jwt from '@elysiajs/jwt';
import type { Context, Elysia } from 'elysia';
import { t } from 'elysia';
import { UnauthorizedError } from '../../core/shared/errors/error-mapper';

export type JwtDecorator = ReturnType<typeof jwt>['decorator']['jwt'];

export interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  type: string;
}

export const validateToken = async (ctx: Context): Promise<string> => {
  const token = ctx.request.headers.get('authorization')?.slice('bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Missing access token');
  }
  return token;
};

export const validatePayload = async (payload: JwtPayload): Promise<void> => {
  if (!payload || typeof payload !== 'object') {
    throw new UnauthorizedError('Invalid access token');
  }
};

export const validateUserId = async (payload: JwtPayload): Promise<string | undefined> => {
  const userId = 'sub' in payload ? payload.sub : undefined;
  if (!userId || typeof userId !== 'string') {
    throw new UnauthorizedError('Invalid access token');
  }
  return userId;
};

export const withAuth = (app: Elysia) =>
  app.guard({
    headers: t.Object({
      // authorization: t.String({ pattern: '^Bearer\\s+.+$' }),
    }),
    beforeHandle: async context => {
      const ctx = context as typeof context & {
        jwt: JwtDecorator;
        bearer?: {
          token?: string;
        };
        store: Record<string, unknown>;
      };

      const token = await validateToken(ctx);

      const payload: JwtPayload = await ctx.jwt.verify(token);
      await validatePayload(payload);

      ctx.store.userId = await validateUserId(payload);
    },
  });
