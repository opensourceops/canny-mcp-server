/**
 * Post listing and search tool
 */

import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateLimit, validateStatus, validateBoardAlias } from '../../utils/validators.js';

export const listPosts: MCPTool = {
  name: 'canny_list_posts',
  description: 'Search and filter posts with pagination. Filter by board, author, company, status, tags, or search query.',
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {
    type: 'object',
    properties: {
      boardID: {
        type: 'string',
        description: 'Board ID to filter posts',
      },
      boardAlias: {
        type: 'string',
        description: 'Board alias from config (e.g., "features", "bugs")',
      },
      authorID: {
        type: 'string',
        description: 'Filter posts by specific author ID',
      },
      companyID: {
        type: 'string',
        description: 'Filter posts created by users linked to this company',
      },
      status: {
        type: 'string',
        description: 'Filter by status (e.g., "open", "in progress")',
      },
      search: {
        type: 'string',
        description: 'Search query string',
      },
      tagIDs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tag IDs',
      },
      sort: {
        type: 'string',
        enum: ['newest', 'oldest', 'relevance', 'score', 'trending', 'statusChanged'],
        description: 'Sort order (relevance only works with search parameter)',
      },
      limit: {
        type: 'number',
        description: 'Number of results per page (default: 10, max: 20)',
        minimum: 1,
        maximum: 20,
      },
      cursor: {
        type: 'string',
        description: 'Pagination cursor from previous response',
      },
      compact: {
        type: 'boolean',
        description: 'Return compact format (default: true)',
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'Select specific fields to include',
      },
    },
    required: [],
  },
  handler: async (params, { client, config, logger }) => {
    const {
      boardID: directBoardID,
      boardAlias,
      authorID,
      companyID,
      status,
      search,
      tagIDs,
      sort = 'newest',
      limit = 10,
      cursor,
      compact = true,
      fields,
    } = params;

    // Resolve board ID from alias if provided
    let boardID = directBoardID;
    if (boardAlias) {
      boardID = validateBoardAlias(boardAlias, config.canny.workspace.boards);
    }

    // Validate status if provided
    if (status) {
      validateStatus(status, config.canny.workspace.customStatuses);
    }

    // Validate limit
    if (limit) {
      validateLimit(limit, 20);
    }

    logger.info('Listing posts', {
      boardID,
      authorID,
      companyID,
      status,
      search,
      limit,
    });

    const response = await client.listPosts({
      boardID,
      authorID,
      companyID,
      status,
      search,
      tagIDs,
      sort,
      limit,
      cursor,
    });

    // Transform to compact format if requested
    const posts = compact
      ? ResponseTransformer.compactPosts(response.posts, fields || config.canny.defaults.defaultFields)
      : response.posts;

    logger.info(`Found ${posts.length} posts`);

    return {
      posts,
      hasMore: response.hasMore,
      cursor: response.cursor,
    };
  },
};
