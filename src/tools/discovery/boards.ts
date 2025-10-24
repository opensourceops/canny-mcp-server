/**
 * Board discovery tools
 */

import { MCPTool } from '../../types/mcp.js';
import { CannyBoard } from '../../types/canny.js';

export const listBoards: MCPTool = {
  name: 'canny_list_boards',
  description: 'Get all available boards with metadata',
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (params, { client, cache, logger }) => {
    logger.info('Fetching boards list');

    // Check cache first
    const cacheKey = 'boards:all';
    const cached = cache.get<{ boards: any[] }>(cacheKey);
    if (cached) {
      logger.debug('Returning cached boards');
      return cached;
    }

    const boards = await client.listBoards();

    // Compact response
    const compact = boards.map((board: CannyBoard) => ({
      id: board.id,
      name: board.name,
      postCount: board.postCount,
      isPrivate: board.isPrivate,
      url: board.url,
    }));

    const result = { boards: compact };

    // Cache for 1 hour
    cache.set(cacheKey, result, 3600);

    logger.info(`Fetched ${boards.length} boards`);
    return result;
  },
};
