/**
 * Board discovery tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { CannyBoard } from '../../types/canny.js';

export const listBoards: MCPTool = {
  name: 'canny_list_boards',
  title: 'List Canny Boards',
  description: `List all boards in your Canny workspace with key metadata.

Returns a list of every board including post counts and visibility settings.

Args:
  None

Returns:
  JSON object with a "boards" array, each containing id, name, postCount, isPrivate, and url.

Examples:
  - "Show all boards" -> no params needed
  - "Which boards are available?" -> no params needed`,
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {},
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, cache, logger }) => {
    logger.info('Fetching boards list');

    // Check cache first
    const cacheKey = 'boards:all';
    const cached = cache.get<{ boards: unknown[] }>(cacheKey);
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
