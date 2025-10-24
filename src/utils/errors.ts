/**
 * Error handling and mapping utilities
 */

export class CannyError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'CannyError';
  }
}

export class CannyAPIError extends CannyError {
  constructor(message: string, statusCode: number, retryable: boolean = false) {
    super(message, 'CANNY_API_ERROR', statusCode, retryable);
    this.name = 'CannyAPIError';
  }
}

export class RateLimitError extends CannyError {
  constructor(public retryAfter: number) {
    super(
      `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    );
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends CannyError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400, false);
    this.name = 'ValidationError';
  }
}

export function mapHTTPError(error: any): CannyError {
  const status = error.response?.status || error.statusCode || 500;
  const message = error.response?.data?.error || error.message || 'Unknown error';

  switch (status) {
    case 400:
      return new ValidationError(message);
    case 401:
      return new CannyAPIError(
        'Invalid API key. Check your configuration.',
        401,
        false
      );
    case 403:
      return new CannyAPIError(
        'Permission denied. Check your API key permissions.',
        403,
        false
      );
    case 404:
      return new CannyAPIError(
        'Resource not found. Verify IDs and permissions.',
        404,
        false
      );
    case 429:
      const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '60', 10);
      return new RateLimitError(retryAfter);
    case 500:
    case 502:
    case 503:
      return new CannyAPIError(
        'Canny API error. Service may be temporarily unavailable.',
        status,
        true
      );
    default:
      return new CannyAPIError(message, status, false);
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const cannyError = error instanceof CannyError ? error : mapHTTPError(error);

      // Don't retry if not retryable
      if (!cannyError.retryable) {
        throw cannyError;
      }

      // Calculate backoff delay
      const delay =
        cannyError instanceof RateLimitError
          ? cannyError.retryAfter * 1000
          : baseDelay * Math.pow(2, attempt);

      // Don't wait on last attempt
      if (attempt < maxRetries - 1) {
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}
