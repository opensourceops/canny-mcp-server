/**
 * Pagination handling for different Canny API endpoints
 * Supports both cursor-based and skip-based pagination
 */

import { PaginationStrategy, PaginationOptions } from '../types/mcp.js';

export interface PaginationResult<T> {
  data: T[];
  hasMore: boolean;
  cursor?: string;
  skip?: number;
}

export class PaginationHandler {
  /**
   * Determine pagination strategy for endpoint
   */
  static getStrategy(endpoint: string): PaginationStrategy {
    const strategies: Record<string, PaginationStrategy> = {
      'posts/list': 'skip',
      'votes/list': 'skip',
      'comments/list': 'skip',
      'boards/list': 'none',
      'tags/list': 'none',
      'categories/list': 'none',
    };

    return strategies[endpoint] || 'none';
  }

  /**
   * Paginate through results using cursor-based pagination
   */
  static async *cursorPaginate<T>(
    fetchFn: (cursor?: string, limit?: number) => Promise<{
      data: T[];
      hasMore: boolean;
      cursor?: string;
    }>,
    options: PaginationOptions = {}
  ): AsyncGenerator<T[]> {
    const { limit = 10, maxTotal = 50 } = options;
    let cursor: string | undefined;
    let totalFetched = 0;

    while (totalFetched < maxTotal) {
      const batchSize = Math.min(limit, maxTotal - totalFetched);
      const result = await fetchFn(cursor, batchSize);

      if (result.data.length > 0) {
        yield result.data;
        totalFetched += result.data.length;
      }

      if (!result.hasMore || !result.cursor) {
        break;
      }

      cursor = result.cursor;
    }
  }

  /**
   * Paginate through results using skip-based pagination
   */
  static async *skipPaginate<T>(
    fetchFn: (skip: number, limit: number) => Promise<{
      data: T[];
      hasMore: boolean;
    }>,
    options: PaginationOptions = {}
  ): AsyncGenerator<T[]> {
    const { limit = 10, maxTotal = 50 } = options;
    let skip = 0;
    let totalFetched = 0;

    while (totalFetched < maxTotal) {
      const batchSize = Math.min(limit, maxTotal - totalFetched);
      const result = await fetchFn(skip, batchSize);

      if (result.data.length > 0) {
        yield result.data;
        totalFetched += result.data.length;
      }

      if (!result.hasMore || result.data.length < batchSize) {
        break;
      }

      skip += result.data.length;
    }
  }

  /**
   * Fetch all results (no pagination)
   */
  static async fetchAll<T>(
    fetchFn: () => Promise<T[]>
  ): Promise<T[]> {
    return await fetchFn();
  }
}
