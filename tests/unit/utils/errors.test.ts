/**
 * Unit tests for error handling utilities
 */

import {
  CannyError,
  CannyAPIError,
  RateLimitError,
  ValidationError,
  mapHTTPError,
  withRetry,
  sleep,
} from '../../../src/utils/errors';

describe('Error Classes', () => {
  describe('CannyError', () => {
    it('should create error with correct properties', () => {
      const error = new CannyError('Test error', 'TEST_CODE', 500, true);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('CannyError');
    });

    it('should default retryable to false', () => {
      const error = new CannyError('Test error', 'TEST_CODE');

      expect(error.retryable).toBe(false);
    });
  });

  describe('CannyAPIError', () => {
    it('should create API error with correct properties', () => {
      const error = new CannyAPIError('API failed', 500, true);

      expect(error.message).toBe('API failed');
      expect(error.code).toBe('CANNY_API_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('CannyAPIError');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry-after', () => {
      const error = new RateLimitError(60);

      expect(error.message).toBe('Rate limit exceeded. Retry after 60 seconds');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBe(60);
      expect(error.name).toBe('RateLimitError');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('ValidationError');
    });
  });
});

describe('mapHTTPError', () => {
  it('should map 400 to ValidationError', () => {
    const httpError = {
      response: {
        status: 400,
        data: { error: 'Bad request' },
      },
    };

    const error = mapHTTPError(httpError);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Bad request');
    expect(error.statusCode).toBe(400);
  });

  it('should map 401 to CannyAPIError with auth message', () => {
    const httpError = {
      response: { status: 401 },
    };

    const error = mapHTTPError(httpError);

    expect(error).toBeInstanceOf(CannyAPIError);
    expect(error.message).toBe('Invalid API key. Check your configuration.');
    expect(error.statusCode).toBe(401);
    expect(error.retryable).toBe(false);
  });

  it('should map 403 to CannyAPIError with permission message', () => {
    const httpError = {
      response: { status: 403 },
    };

    const error = mapHTTPError(httpError);

    expect(error).toBeInstanceOf(CannyAPIError);
    expect(error.message).toBe('Permission denied. Check your API key permissions.');
    expect(error.statusCode).toBe(403);
  });

  it('should map 404 to CannyAPIError with not found message', () => {
    const httpError = {
      response: { status: 404 },
    };

    const error = mapHTTPError(httpError);

    expect(error).toBeInstanceOf(CannyAPIError);
    expect(error.message).toBe('Resource not found. Verify IDs and permissions.');
    expect(error.statusCode).toBe(404);
  });

  it('should map 429 to RateLimitError with retry-after header', () => {
    const httpError = {
      response: {
        status: 429,
        headers: { 'retry-after': '120' },
      },
    };

    const error = mapHTTPError(httpError);

    expect(error).toBeInstanceOf(RateLimitError);
    if (error instanceof RateLimitError) {
      expect(error.retryAfter).toBe(120);
    }
    expect(error.retryable).toBe(true);
  });

  it('should map 429 to RateLimitError with default retry-after', () => {
    const httpError = {
      response: { status: 429 },
    };

    const error = mapHTTPError(httpError);

    expect(error).toBeInstanceOf(RateLimitError);
    if (error instanceof RateLimitError) {
      expect(error.retryAfter).toBe(60);
    }
  });

  it('should map 500 to retryable CannyAPIError', () => {
    const httpError = {
      response: { status: 500 },
    };

    const error = mapHTTPError(httpError);

    expect(error).toBeInstanceOf(CannyAPIError);
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(true);
  });

  it('should map 502 to retryable CannyAPIError', () => {
    const httpError = {
      response: { status: 502 },
    };

    const error = mapHTTPError(httpError);

    expect(error.retryable).toBe(true);
  });

  it('should handle errors without response object', () => {
    const httpError = {
      message: 'Network error',
      statusCode: 500,
    };

    const error = mapHTTPError(httpError);

    expect(error).toBeInstanceOf(CannyAPIError);
    expect(error.message).toBe('Canny API error. Service may be temporarily unavailable.');
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(true);
  });
});

describe('sleep', () => {
  it('should sleep for specified duration', async () => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();

    expect(end - start).toBeGreaterThanOrEqual(90);
    expect(end - start).toBeLessThan(150);
  });
});

describe('withRetry', () => {
  it('should return result on first try if successful', async () => {
    const fn = jest.fn().mockResolvedValue('success');

    const result = await withRetry(fn, 3, 100);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new CannyAPIError('Server error', 500, true))
      .mockResolvedValue('success');

    const result = await withRetry(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable errors', async () => {
    const fn = jest
      .fn()
      .mockRejectedValue(new ValidationError('Invalid input'));

    await expect(withRetry(fn, 3, 10)).rejects.toThrow(ValidationError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retries', async () => {
    const fn = jest
      .fn()
      .mockRejectedValue(new CannyAPIError('Server error', 500, true));

    await expect(withRetry(fn, 3, 10)).rejects.toThrow(CannyAPIError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new CannyAPIError('Error', 500, true))
      .mockRejectedValueOnce(new CannyAPIError('Error', 500, true))
      .mockResolvedValue('success');

    const start = Date.now();
    await withRetry(fn, 3, 50);
    const duration = Date.now() - start;

    // First retry: 50ms, Second retry: 100ms = ~150ms total
    expect(duration).toBeGreaterThanOrEqual(140);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should handle RateLimitError with custom retry-after', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new RateLimitError(1)) // 1 second
      .mockResolvedValue('success');

    const start = Date.now();
    await withRetry(fn, 3, 50);
    const duration = Date.now() - start;

    // Should wait 1000ms (1 second)
    expect(duration).toBeGreaterThanOrEqual(950);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should handle non-CannyError errors', async () => {
    const genericError = new Error('Generic error');
    const fn = jest.fn().mockRejectedValue(genericError);

    await expect(withRetry(fn, 3, 10)).rejects.toThrow();
    // Should attempt to map and might retry based on mapped error
  });
});
