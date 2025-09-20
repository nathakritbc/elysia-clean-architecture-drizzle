import type { Elysia } from 'elysia';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export interface AppErrorOptions {
  status: number;
  message: string;
  code?: string;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor({ status, message, code }: AppErrorOptions) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponse() {
    return Response.json(
      {
        error: this.code ?? this.name ?? 'APP_ERROR',
        message: this.message,
      },
      {
        status: this.status,
      }
    );
  }
}

// Specific error types for better type safety
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super({
      status: StatusCodes.NOT_FOUND,
      message,
      code: 'NOT_FOUND',
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super({
      status: StatusCodes.BAD_REQUEST,
      message,
      code: 'VALIDATION_ERROR',
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super({
      status: StatusCodes.CONFLICT,
      message,
      code: 'CONFLICT',
    });
  }
}

export class ErrorMapper {
  static register(app: Elysia) {
    return app.error({
      AppError,
      NotFoundError,
      ValidationError,
      InternalServerError,
      ConflictError,
    });
  }

  static toHttp(error: unknown) {
    if (error instanceof AppError) {
      return {
        status: error.status,
        body: {
          error: error.code ?? error.name ?? 'APP_ERROR',
          message: error.message,
        },
      };
    }

    // Unexpected error
    if (error instanceof Error) {
      return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        body: {
          error: ReasonPhrases.INTERNAL_SERVER_ERROR,
          message: error.message,
        },
      };
    }

    // Fallback case
    return {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }

  // For use with Elysia onError hook - returns Response object
  static handleError(error: unknown) {
    if (error instanceof AppError) {
      return error.toResponse();
    }

    // Unexpected error
    if (error instanceof Error) {
      return Response.json(
        {
          error: ReasonPhrases.INTERNAL_SERVER_ERROR,
          message: error.message,
        },
        {
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        }
      );
    }

    // Fallback case
    return Response.json(
      {
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
      {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      }
    );
  }
}
