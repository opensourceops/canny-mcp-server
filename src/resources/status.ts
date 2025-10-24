/**
 * Status overview resource
 */

import { MCPResource } from '../types/mcp.js';

export const statusOverview: MCPResource = {
  uri: 'canny:posts/status-overview',
  name: 'Status Overview',
  description: 'Post counts by status with trends',
  mimeType: 'application/json',
  subscribable: true,
  handler: async ({ client, cache, config, logger }) => {
    logger.info('Generating status overview');

    // Check cache
    const cacheKey = 'resource:status:overview';
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.debug('Returning cached status overview');
      return {
        text: cached,
        mimeType: 'application/json',
      };
    }

    // Fetch recent posts across all boards
    const postsResponse = await client.listPosts({
      limit: 100,
      sort: 'newest',
    });

    // Count by status
    const statusCounts: Record<string, number> = {};
    config.canny.workspace.customStatuses.forEach((status) => {
      statusCounts[status] = 0;
    });

    postsResponse.posts.forEach((post) => {
      statusCounts[post.status] = (statusCounts[post.status] || 0) + 1;
    });

    // Calculate trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPosts = postsResponse.posts.filter(
      (post) => new Date(post.created) > sevenDaysAgo
    );

    const recentStatusChanges = postsResponse.posts.filter(
      (post) => new Date(post.statusChangedAt) > sevenDaysAgo
    );

    const overview = {
      statusCounts,
      totalPosts: postsResponse.posts.length,
      trendsLast7Days: {
        newPosts: recentPosts.length,
        statusChanges: recentStatusChanges.length,
        completed: recentStatusChanges.filter((p) => p.status === 'complete').length,
      },
      lastUpdated: new Date().toISOString(),
    };

    const result = JSON.stringify(overview, null, 2);

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300);

    logger.info('Status overview generated');

    return {
      text: result,
      mimeType: 'application/json',
    };
  },
};
