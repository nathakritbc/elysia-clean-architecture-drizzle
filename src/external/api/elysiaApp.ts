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

        const status = typeof context.set.status === 'number'
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

    logger.error('Request handling failed', {
      code,
      url: request?.url,
      error: normalizedError,
    });

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

    // Handle all other errors using ErrorMapper
    return ErrorMapper.handleError(normalizedError);
  });

export default app;
