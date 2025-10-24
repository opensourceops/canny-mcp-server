/**
 * Tag discovery tools
 */

import { MCPTool } from '../../types/mcp.js';

export const listTags: MCPTool = {
  name: 'canny_list_tags',
  description: 'Get all available tags, optionally filtered by board',
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {
    type: 'object',
    properties: {
      boardID: {
        type: 'string',
        description: 'Optional board ID to filter tags',
      },
    },
    required: [],
  },
  handler: async (params, { client, cache, logger }) => {
    const { boardID } = params;

    logger.info('Fetching tags list', { boardID });

    // Check cache
    const cacheKey = boardID ? `tags:board:${boardID}` : 'tags:all';
    const cached = cache.get<{ tags: any[] }>(cacheKey);
    if (cached) {
      logger.debug('Returning cached tags');
      return cached;
    }

    const tags = await client.listTags(boardID);

    // Compact response
    const compact = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      postCount: tag.postCount,
    }));

    const result = { tags: compact };

    // Cache for 1 hour
    cache.set(cacheKey, result, 3600);

    logger.info(`Fetched ${tags.length} tags`);
    return result;
  },
};
