import type { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { t } from 'elysia';
import { UnauthorizedError } from '../../core/shared/errors/error-mapper';

type JwtDecorator = ReturnType<typeof jwt>['decorator']['jwt'];

interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  type: string;
}

export const withAuth = (app: Elysia) =>
  app.guard({
    headers: t.Object({
      authorization: t.String({ pattern: '^Bearer\\s+.+$' }),
    }),
    beforeHandle: async context => {
      const ctx = context as typeof context & {
        jwt: JwtDecorator;
        bearer?: {
          token?: string;
        };
        store: Record<string, unknown>;
      };

      let token = ctx.bearer?.token?.trim();

      if (!token) {
        const authorization = ctx.request.headers.get('authorization');
        if (authorization?.toLowerCase().startsWith('bearer ')) {
          token = authorization.slice('bearer '.length).trim();
        }
      }

      if (!token) {
        throw new UnauthorizedError('Missing access token');
      }

      const payload: JwtPayload = await ctx.jwt.verify(token);
      if (!payload || typeof payload !== 'object') {
        throw new UnauthorizedError('Invalid access token');
      }

      const userId = 'sub' in payload ? payload.sub : undefined;

      if (!userId || typeof userId !== 'string') {
        throw new UnauthorizedError('Invalid access token');
      }

      ctx.store.userId = userId;
    },
  });
