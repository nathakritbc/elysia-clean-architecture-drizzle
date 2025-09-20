import Elysia from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Span } from '@opentelemetry/api';
import { ErrorMapper } from '../../core/shared/errors/errorMapper';
import { container } from '../../core/shared/container';
import { TOKENS } from '../../core/shared/tokens';
import type { LoggerPort } from '../../core/shared/logger/logger.port';

interface TraceProcessStopEvent {
  error?: unknown;
}

interface TraceProcess {
  onStop(callback: (event?: TraceProcessStopEvent) => void): void;
}

interface TracingPluginParams {
  context: TracingContext;
  response: unknown;
  onHandle: (callback: (process: TraceProcess) => void) => void;
  onAfterResponse: (callback: (process: TraceProcess) => void) => void;
  onError: (callback: (process: TraceProcess) => void) => void;
}

interface TracingContext {
  route?: string;
  path?: string;
  request: {
    method: string;
    url: string;
  };
  set?: {
    status?: number | string;
  };
}

const logger = container.resolve<LoggerPort>(TOKENS.Logger);
const tracer = trace.getTracer('elysia-app');

const COMMON_BROWSER_PATHS = ['/favicon.ico', '/sw.js', '/manifest.json', '/robots.txt'];

const createSwaggerConfig = () => ({
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
});

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

const createSpanAttributes = (context: TracingContext, requestUrl: URL | null) => {
  const route = context.route ?? requestUrl?.pathname ?? context.path;
  const baseAttributes: Record<string, string | number | boolean> = {
    'http.method': context.request.method,
    'http.route': route ?? '',
    'http.target': requestUrl?.pathname ?? context.path ?? '',
    'http.url': requestUrl?.toString() ?? context.request.url,
  };

  if (requestUrl?.host) {
    baseAttributes['http.host'] = requestUrl.host;
  }

  if (requestUrl?.protocol) {
    baseAttributes['http.scheme'] = requestUrl.protocol.replace(':', '');
  }

  return { route, baseAttributes };
};

const parseRequestUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
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

const createTracingPlugin = () => {
  return ({ context, response, onHandle, onAfterResponse, onError }: TracingPluginParams) => {
    let span: Span | null = null;
    let spanEnded = false;

    const requestUrl = parseRequestUrl(context.request.url);
    const { route, baseAttributes } = createSpanAttributes(context, requestUrl);
    const spanName = `${context.request.method} ${route}`;

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
      if (!span || spanEnded) return;
      span.end();
      spanEnded = true;
      span = null;
    };

    const recordError = (error: Error) => {
      const activeSpan = ensureSpan();
      activeSpan.recordException(error);
      activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      endSpan();
    };

    onHandle(process => {
      span = createSpan();
      spanEnded = false;

      process.onStop(({ error } = {}) => {
        if (!error || !span || spanEnded) return;
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        recordError(normalizedError);
      });
    });

    onAfterResponse(process => {
      process.onStop(() => {
        if (!span || spanEnded) return;

        const contextStatus = context.set?.status;
        const status =
          typeof contextStatus === 'number'
            ? contextStatus
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
      process.onStop(({ error } = {}) => {
        if (!error) return;
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        recordError(normalizedError);
      });
    });
  };
};

interface ErrorHandlerParams {
  error: unknown;
  code: number | string;
  request?: {
    url?: string;
  };
}

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

const app = new Elysia()
  .use(swagger(createSwaggerConfig()))
  .use(createBrowserRoutes)
  .trace(createTracingPlugin())
  .onError(createErrorHandler());

export default app;
