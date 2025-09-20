import {
	ReasonPhrases,
	StatusCodes,
} from 'http-status-codes';

export interface AppErrorOptions {
  statusCode: number;
  message: string;
  code?: string;  
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor({ statusCode, message, code }: AppErrorOptions) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponse() {
    return Response.json({
      error: this.code ?? "APP_ERROR",
      message: this.message,
    }, {
      status: this.statusCode
    });
  }
}

// Specific error types for better type safety
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super({
      statusCode: StatusCodes.NOT_FOUND,
      message,
      code: "NOT_FOUND"
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed") {
    super({
      statusCode: StatusCodes.BAD_REQUEST,
      message,
      code: "VALIDATION_ERROR"
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message,
      code: "INTERNAL_SERVER_ERROR"
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super({
      statusCode: StatusCodes.CONFLICT,
      message,
      code: "CONFLICT"
    });
  }
}

export class ErrorMapper {
  static toHttp(error: unknown) {
    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        body: {
          error: error.code ?? "APP_ERROR",
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
        error: "UNKNOWN_ERROR",
        message: "An unexpected error occurred",
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
      return Response.json({
        error: ReasonPhrases.INTERNAL_SERVER_ERROR,
        message: error.message,
      }, {
        status: StatusCodes.INTERNAL_SERVER_ERROR
      });
    }

    // Fallback case
    return Response.json({
      error: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
    }, {
      status: StatusCodes.INTERNAL_SERVER_ERROR
    });
  }
}
