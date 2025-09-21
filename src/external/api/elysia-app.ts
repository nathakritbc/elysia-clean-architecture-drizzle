import 'dotenv/config';
import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { ErrorMapper } from '../../core/shared/errors/error-mapper';
import { container } from '../../core/shared/container';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';
import { createSwaggerConfig } from '../config/swagger.config';
import type { AppConfig } from '../config/app-config';
import { openapi } from '@elysiajs/openapi';
import { opentelemetry } from '@elysiajs/opentelemetry';
import { createTraceExporter } from '../telemetry/opentelemetry';
import { jwt } from '@elysiajs/jwt';
import bearer from '@elysiajs/bearer';
import { authConfig } from '../config/auth.config';

const logger = container.resolve<LoggerPort>(TOKENS.Logger);

const COMMON_BROWSER_PATHS = ['/favicon.ico', '/sw.js', '/manifest.json', '/robots.txt'];

interface ErrorHandlerParams {
  error: unknown;
  code: number | string;
  request?: {
    url?: string;
  };
}

const createBrowserRoutes = (app: Elysia) => {
  return app
    .get('/favicon.ico', () => new Response(null, { status: 204 }))
    .get(
      '/sw.js',
      () =>
        new Response('// Service worker not implemented', {
          headers: { 'Content-Type': 'application/javascript' },
        })
    )
    .get('/manifest.json', () => Response.json({ error: 'Not found' }, { status: 404 }))
    .get(
      '/robots.txt',
      () =>
        new Response('User-agent: *\nDisallow: /', {
          headers: { 'Content-Type': 'text/plain' },
        })
    );
};

const isCommonBrowserRequest = (url?: string): boolean => {
  if (!url) return false;
  return COMMON_BROWSER_PATHS.some(path => url.includes(path));
};

const handleBrowserRequestError = (url: string) => {
  if (url.includes('/favicon.ico')) {
    return new Response(null, { status: 204 });
  }
  if (url.includes('/sw.js')) {
    return new Response('// Service worker not implemented', {
      status: 404,
      headers: { 'Content-Type': 'application/javascript' },
    });
  }
  if (url.includes('/manifest.json')) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (url.includes('/robots.txt')) {
    return new Response('User-agent: *\nDisallow: /', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return null;
};

const createErrorHandler = () => {
  return ({ error, code, request }: ErrorHandlerParams) => {
    const normalizedError = error instanceof Error ? error : new Error('Unknown error');
    const url = request?.url;
    const isBrowserRequest = isCommonBrowserRequest(url);

    if (!isBrowserRequest) {
      logger.error('Request handling failed', {
        code,
        url,
        error: normalizedError,
      });
    }

    if (code === 'VALIDATION' || code === 400) {
      return Response.json(
        {
          error: 'VALIDATION_ERROR',
          message: normalizedError.message,
        },
        { status: 400 }
      );
    }

    if ((code === 'NOT_FOUND' || code === 404) && isBrowserRequest && url) {
      const browserResponse = handleBrowserRequestError(url);
      if (browserResponse) return browserResponse;
    }

    return ErrorMapper.handleError(normalizedError);
  };
};

export const createElysiaApp = (appConfig: AppConfig) => {
  const app = ErrorMapper.register(new Elysia())
    .use(bearer())
    .use(
      jwt({
        name: 'jwt',
        secret: authConfig.jwt.secret,
        iss: authConfig.jwt.issuer,
        aud: authConfig.jwt.audience,
        exp: authConfig.jwt.accessTokenExpiresIn,
      })
    )
    .use(openapi())
    .use(appConfig.cors)
    .use(swagger(createSwaggerConfig()))
    .use(createBrowserRoutes)
    .onError(createErrorHandler());

  if (appConfig.telemetry.enabled) {
    const traceExporter = createTraceExporter(appConfig.telemetry.otlpEndpoint, logger, {
      warnOnMissing: false,
    });

    app.use(
      opentelemetry({
        serviceName: appConfig.telemetry.serviceName,
        traceExporter,
      })
    );
  }

  return app;
};

export default createElysiaApp;
