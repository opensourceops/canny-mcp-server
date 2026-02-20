/**
 * Tag discovery tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';

export const listTags: MCPTool = {
  name: 'canny_list_tags',
  title: 'List Canny Tags',
  description: `List tags in Canny, optionally filtered by board. Supports pagination via limit/skip.

Retrieves tags with their post counts. Use boardID to scope results to a specific board.

Args:
  - boardID (string, optional): Board ID to filter tags by
  - limit (number, optional): Max tags to return (default 50).
  - skip (number, optional): Number of tags to skip for pagination (default 0).

Returns:
  JSON object with a "tags" array (each containing id, name, and postCount) and "hasMore" boolean.

Examples:
  - "List all tags" -> no params needed
  - "Show tags for board abc123" -> { boardID: "abc123" }
  - "Next page of tags" -> { boardID: "abc123", skip: 50 }`,
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {
    boardID: z.string().optional().describe('Board ID to filter tags'),
    limit: z.number().optional().describe('Max tags to return (default 50)'),
    skip: z.number().optional().describe('Number of tags to skip for pagination (default 0)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { boardID, limit, skip } = params;

    logger.info('Fetching tags list', { boardID, limit, skip });

    const { tags, hasMore } = await client.listTags(boardID, limit, skip);

    // Compact response
    const compact = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      postCount: tag.postCount,
    }));

    logger.info(`Fetched ${tags.length} tags`);
    return { tags: compact, hasMore };
  },
};

export const createTag: MCPTool = {
  name: 'canny_create_tag',
  title: 'Create Tag',
  description: `Create a new tag on a Canny board.

Args:
  - boardID (string, required): Board ID to create the tag on
  - name (string, required): Name for the new tag

Returns:
  JSON object with the created tag's id and name.

Examples:
  - "Create an iOS tag" -> { boardID: "abc123", name: "iOS" }
  - "Add a tag for mobile" -> { boardID: "abc123", name: "mobile" }`,
  readOnly: false,
  toolset: 'discovery',
  inputSchema: {
    boardID: z.string().describe('Board ID to create tag on'),
    name: z.string().describe('Tag name'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler: async (params, { client, cache, logger }) => {
    const { boardID, name } = params;

    validateRequired(boardID, 'boardID');
    validateRequired(name, 'name');

    logger.info('Creating tag', { boardID, name });

    const tag = await client.createTag(boardID, name);

    // Invalidate tag cache for this board
    cache.delete(`tags:board:${boardID}`);

    logger.info('Tag created successfully', { tagID: tag.id });

    return {
      id: tag.id,
      name: tag.name,
    };
  },
};
