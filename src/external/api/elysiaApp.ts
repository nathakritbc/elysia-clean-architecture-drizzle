import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';
import { ErrorMapper } from '../../core/shared/errors/errorMapper';
import { container } from '../../core/shared/container';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';

const logger = container.resolve<LoggerPort>(TOKENS.Logger);
const tracer = trace.getTracer('elysia-app');

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Elysia Clean Architecture Backend API',
          version: '1.0.0',
          description: 'API documentation for the Clean Architecture Backend with Drizzle ORM',
        },
        tags: [{ name: 'Users', description: 'User management endpoints' }],
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Development server',
          },
        ],
      },
    })
  )
  // Handle common browser requests
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
  )
  .trace(({ context, response, onHandle, onAfterResponse, onError }) => {
    let span: Span | null = null;
    let spanEnded = false;

    const requestUrl = (() => {
      try {
        return new URL(context.request.url);
      } catch {
        return null;
      }
    })();

    const route = context.route ?? requestUrl?.pathname ?? context.path;
    const spanName = `${context.request.method} ${route}`;
    const baseAttributes: Record<string, string | number | boolean> = {
      'http.method': context.request.method,
      'http.route': route,
      'http.target': requestUrl?.pathname ?? context.path,
      'http.url': requestUrl?.toString() ?? context.request.url,
    };

    if (requestUrl?.host) {
      baseAttributes['http.host'] = requestUrl.host;
    }

    if (requestUrl?.protocol) {
      baseAttributes['http.scheme'] = requestUrl.protocol.replace(':', '');
    }

    const createSpan = (): Span =>
      tracer.startSpan(spanName, {
        kind: SpanKind.SERVER,
        attributes: baseAttributes,
      });

    const ensureSpan = (): Span => {
      if (!span || spanEnded) {
        span = createSpan();
        spanEnded = false;
      }
      return span;
    };

    const endSpan = () => {
      if (!span || spanEnded) {
        return;
      }

      span.end();
      spanEnded = true;
      span = null;
    };

    onHandle(process => {
      span = createSpan();
      spanEnded = false;

      process.onStop(({ error }) => {
        if (!span || spanEnded) {
          return;
        }

        if (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
          endSpan();
        }
      });
    });

    onAfterResponse(process => {
      process.onStop(() => {
        if (!span || spanEnded) {
          return;
        }

        const status =
          typeof context.set.status === 'number'
            ? context.set.status
            : response instanceof Response
              ? response.status
              : undefined;

        if (typeof status === 'number') {
          span.setAttribute('http.status_code', status);
          span.setStatus({ code: status >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        endSpan();
      });
    });

    onError(process => {
      process.onStop(({ error }) => {
        if (!error) {
          return;
        }

        const activeSpan = ensureSpan();
        activeSpan.recordException(error);
        activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        endSpan();
      });
    });
  })
  .onError(({ error, code, request }) => {
    const normalizedError = error instanceof Error ? error : new Error('Unknown error');

    // Skip logging for common browser requests that don't exist
    const url = request?.url;
    const isCommonBrowserRequest =
      url &&
      (url.includes('/favicon.ico') ||
        url.includes('/sw.js') ||
        url.includes('/manifest.json') ||
        url.includes('/robots.txt'));

    if (!isCommonBrowserRequest) {
      logger.error('Request handling failed', {
        code,
        url: request?.url,
        error: normalizedError,
      });
    }

    // Handle validation errors with custom messages
    if (code === 'VALIDATION') {
      return Response.json(
        {
          error: 'VALIDATION_ERROR',
          message: normalizedError.message,
        },
        {
          status: 400,
        }
      );
    }

    // Handle 404 errors for common browser requests with appropriate responses
    if (code === 'NOT_FOUND' && isCommonBrowserRequest) {
      if (url?.includes('/favicon.ico')) {
        return new Response(null, { status: 204 }); // No Content for favicon
      }
      if (url?.includes('/sw.js')) {
        return new Response('// Service worker not implemented', {
          status: 404,
          headers: { 'Content-Type': 'application/javascript' },
        });
      }
      if (url?.includes('/manifest.json')) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }
      if (url?.includes('/robots.txt')) {
        return new Response('User-agent: *\nDisallow: /', {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }

    // Handle all other errors using ErrorMapper
    return ErrorMapper.handleError(normalizedError);
  });

export default app;
