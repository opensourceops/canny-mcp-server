/**
 * Post listing and search tool
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateLimit, validateStatus, validateBoardAlias } from '../../utils/validators.js';

export const listPosts: MCPTool = {
  name: 'canny_list_posts',
  title: 'List Canny Posts',
  description: `Search and filter posts in Canny with pagination. Supports filtering by board, author, company, status, tags, or free-text search.

Args:
  - boardID (string, optional): Board ID to filter posts
  - boardAlias (string, optional): Board alias from config (e.g., "features", "bugs")
  - authorID (string, optional): Filter by author ID
  - companyID (string, optional): Filter by company ID
  - status (string, optional): Filter by status (e.g., "open", "in progress")
  - search (string, optional): Free-text search query
  - tagIDs (string[], optional): Filter by tag IDs
  - sort (string, optional): Sort order - "newest", "oldest", "relevance", "score", "trending", "statusChanged" (default: "newest")
  - limit (number, optional): Results per page, 1-20 (default: 10)
  - skip (number, optional): Number of posts to skip for pagination (default: 0)
  - compact (boolean, optional): Return compact format (default: true)
  - fields (string[], optional): Specific fields to include in response

Returns:
  JSON with posts array and hasMore boolean for pagination.

Examples:
  - "List recent posts" -> no params needed
  - "Search posts about dark mode" -> search: "dark mode"
  - "Show open bugs" -> boardAlias: "bugs", status: "open"`,
  readOnly: true,
  toolset: 'discovery',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    boardID: z.string().optional().describe('Board ID to filter posts'),
    boardAlias: z.string().optional().describe('Board alias from config (e.g., "features", "bugs")'),
    authorID: z.string().optional().describe('Filter posts by specific author ID'),
    companyID: z.string().optional().describe('Filter posts created by users linked to this company'),
    status: z.string().optional().describe('Filter by status (e.g., "open", "in progress")'),
    search: z.string().optional().describe('Search query string'),
    tagIDs: z.array(z.string()).optional().describe('Filter by tag IDs'),
    sort: z.enum(['newest', 'oldest', 'relevance', 'score', 'trending', 'statusChanged']).optional().describe('Sort order (relevance only works with search parameter)'),
    limit: z.number().int().min(1).max(20).optional().describe('Number of results per page (default: 10, max: 20)'),
    skip: z.number().int().min(0).optional().describe('Number of posts to skip for pagination (default: 0)'),
    compact: z.boolean().optional().describe('Return compact format (default: true)'),
    fields: z.array(z.string()).optional().describe('Select specific fields to include'),
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
      skip = 0,
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
      skip,
    });

    // Transform to compact format if requested
    const posts = compact
      ? ResponseTransformer.compactPosts(response.posts, fields || config.canny.defaults.defaultFields)
      : response.posts;

    logger.info(`Found ${posts.length} posts`);

    return {
      posts,
      hasMore: response.hasMore,
    };
  },
};
