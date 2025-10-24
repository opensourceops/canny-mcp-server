/**
 * Board summary resource
 */

import { MCPResource } from '../types/mcp.js';

export const boardSummary: MCPResource = {
  uri: 'canny:boards/summary',
  name: 'Board Summary',
  description: 'Aggregated board metrics with status counts',
  mimeType: 'application/json',
  subscribable: false,
  handler: async ({ client, cache, logger }) => {
    logger.info('Generating board summary');

    // Check cache
    const cacheKey = 'resource:boards:summary';
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.debug('Returning cached board summary');
      return {
        text: cached,
        mimeType: 'application/json',
      };
    }

    // Fetch boards
    const boards = await client.listBoards();

    // Fetch post counts for each board
    const boardSummaries = await Promise.all(
      boards.map(async (board) => {
        // Get recent posts for status breakdown
        const postsResponse = await client.listPosts({
          boardID: board.id,
          limit: 100,
        });

        const statusCounts: Record<string, number> = {};
        postsResponse.posts.forEach((post) => {
          statusCounts[post.status] = (statusCounts[post.status] || 0) + 1;
        });

        return {
          id: board.id,
          name: board.name,
          totalPosts: board.postCount,
          openCount: statusCounts['open'] || 0,
          inProgressCount:
            (statusCounts['in progress'] || 0) + (statusCounts['under review'] || 0),
          completedLast30Days: 0, // Would need additional API call
          statusBreakdown: statusCounts,
        };
      })
    );

    const summary = {
      boards: boardSummaries,
      totalOpen: boardSummaries.reduce((sum, b) => sum + b.openCount, 0),
      totalInProgress: boardSummaries.reduce((sum, b) => sum + b.inProgressCount, 0),
      lastUpdated: new Date().toISOString(),
    };

    const result = JSON.stringify(summary, null, 2);

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300);

    logger.info('Board summary generated');

    return {
      text: result,
      mimeType: 'application/json',
    };
  },
};
