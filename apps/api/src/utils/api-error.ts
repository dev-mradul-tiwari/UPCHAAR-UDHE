/**
 * Errors thrown by route/service code. The central error handler turns these
 * into the standard `{ success, message, data }` envelope with `status`.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = "Invalid request", details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "You do not have access to this resource"): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = "Request conflicts with the current state"): ApiError {
    return new ApiError(409, message);
  }

  static internal(message = "Something went wrong"): ApiError {
    return new ApiError(500, message);
  }

  static badGateway(message = "Upstream service failed"): ApiError {
    return new ApiError(502, message);
  }

  static serviceUnavailable(message = "Service unavailable"): ApiError {
    return new ApiError(503, message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
