/**
 * Jira link status resource
 */

import { MCPResource } from '../types/mcp.js';

export const jiraLinkStatus: MCPResource = {
  uri: 'canny:jira/link-status',
  name: 'Jira Link Status',
  description: 'Jira integration metrics and unlinked high-priority posts',
  mimeType: 'application/json',
  subscribable: true,
  handler: async ({ client, cache, logger }) => {
    logger.info('Generating Jira link status');

    // Check cache
    const cacheKey = 'resource:jira:status';
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      logger.debug('Returning cached Jira status');
      return {
        text: cached,
        mimeType: 'application/json',
      };
    }

    // Fetch posts
    const postsResponse = await client.listPosts({
      limit: 100,
      sort: 'score',
    });

    const linkedPosts = postsResponse.posts.filter(
      (post) => post.jira?.linkedIssues && post.jira.linkedIssues.length > 0
    );

    const unlinkedHighPriority = postsResponse.posts.filter(
      (post) => (!post.jira?.linkedIssues || post.jira.linkedIssues.length === 0) && post.score > 10
    );

    const recentlyLinked = linkedPosts
      .filter((post) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(post.statusChangedAt) > weekAgo;
      })
      .slice(0, 10)
      .map((post) => ({
        postID: post.id,
        postTitle: post.title,
        issueKeys: post.jira?.linkedIssues?.map((j) => j.key) || [],
        linkedAt: post.statusChangedAt,
      }));

    const status = {
      linkedPosts: linkedPosts.length,
      unlinkedHighPriority: unlinkedHighPriority.length,
      linkageRate:
        postsResponse.posts.length > 0
          ? ((linkedPosts.length / postsResponse.posts.length) * 100).toFixed(1) + '%'
          : '0%',
      recentlyLinked,
      topUnlinked: unlinkedHighPriority.slice(0, 5).map((post) => ({
        id: post.id,
        title: post.title,
        score: post.score,
        status: post.status,
      })),
      lastUpdated: new Date().toISOString(),
    };

    const result = JSON.stringify(status, null, 2);

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300);

    logger.info('Jira link status generated');

    return {
      text: result,
      mimeType: 'application/json',
    };
  },
};
