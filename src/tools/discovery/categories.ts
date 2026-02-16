/**
 * Category management tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';

export const listCategories: MCPTool = {
  name: 'canny_list_categories',
  title: 'List Categories',
  description: `List categories in Canny, optionally filtered by board. Supports pagination via limit/skip.

Retrieves categories including post counts and parent-child relationships. When boardID is omitted, returns categories from all boards with boardID and boardName fields.

Args:
  - boardID (string, optional): Board ID to filter categories by. If omitted, returns categories across all boards.
  - limit (number, optional): Max categories to return (default 50).
  - skip (number, optional): Number of categories to skip for pagination (default 0).

Returns:
  JSON object with a "categories" array (each containing id, name, postCount, parentID) and "hasMore" boolean. When fetching across all boards, each entry also includes boardID and boardName.

Examples:
  - "List all categories" -> no params needed
  - "Show categories for board abc123" -> { boardID: "abc123" }
  - "Next page of categories" -> { boardID: "abc123", skip: 50 }`,
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {
    boardID: z.string().optional().describe('Board ID to filter categories by. If omitted, returns categories across all boards.'),
    limit: z.number().optional().describe('Max categories to return (default 50)'),
    skip: z.number().optional().describe('Number of categories to skip for pagination (default 0)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { boardID, limit, skip } = params;

    if (boardID) {
      logger.info('Fetching categories', { boardID, limit, skip });

      const { categories, hasMore } = await client.listCategories(boardID, limit, skip);

      // Compact response
      const compact = categories.map((category) => ({
        id: category.id,
        name: category.name,
        postCount: category.postCount,
        parentID: category.parentID,
      }));

      logger.info(`Fetched ${categories.length} categories`);
      return { categories: compact, hasMore };
    }

    // No boardID: aggregate categories across all boards
    logger.info('Fetching categories across all boards');

    const boards = await client.listBoards();
    const allCategories: {
      id: string;
      name: string;
      postCount: number;
      parentID?: string;
      boardID: string;
      boardName: string;
    }[] = [];
    let anyHasMore = false;

    for (const board of boards) {
      try {
        const { categories, hasMore } = await client.listCategories(board.id, limit, skip);
        if (hasMore) anyHasMore = true;
        for (const category of categories) {
          allCategories.push({
            id: category.id,
            name: category.name,
            postCount: category.postCount,
            parentID: category.parentID,
            boardID: board.id,
            boardName: board.name,
          });
        }
      } catch (error) {
        logger.warn(`Failed to fetch categories for board ${board.name}`, {
          boardID: board.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info(`Fetched ${allCategories.length} categories across ${boards.length} boards`);
    return { categories: allCategories, hasMore: anyHasMore };
  },
};

export const createCategory: MCPTool = {
  name: 'canny_create_category',
  title: 'Create Board Category',
  description: `Create a new category on a Canny board.

Adds a category to organize posts on the specified board. Supports nesting via parentID.

Args:
  - boardID (string, required): Board ID to create the category in
  - name (string, required): Name for the new category
  - subscribeAdmins (boolean, required): Whether to subscribe all admins to posts in this category
  - parentID (string, optional): Parent category ID to create a nested subcategory

Returns:
  JSON object with the created category's id, name, postCount, and parentID.

Examples:
  - "Create a Bug Reports category" -> { boardID: "abc123", name: "Bug Reports", subscribeAdmins: true }
  - "Add a subcategory under xyz789" -> { boardID: "abc123", name: "UI Bugs", subscribeAdmins: false, parentID: "xyz789" }`,
  readOnly: false,
  toolset: 'discovery',
  inputSchema: {
    boardID: z.string().describe('Board ID to create category in'),
    name: z.string().describe('Category name'),
    subscribeAdmins: z.boolean().describe('Whether to subscribe all admins to posts in this category'),
    parentID: z.string().optional().describe('Parent category ID for nested categories'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler: async (params, { client, cache, logger }) => {
    const { boardID, name, subscribeAdmins, parentID } = params;

    validateRequired(boardID, 'boardID');
    validateRequired(name, 'name');
    validateRequired(subscribeAdmins, 'subscribeAdmins');

    logger.info('Creating category', { boardID, name, subscribeAdmins });

    const category = await client.createCategory(boardID, name, subscribeAdmins, parentID);

    // Invalidate category cache for this board and aggregated cache
    const cacheKey = `categories:board:${boardID}`;
    cache.delete(cacheKey);
    cache.delete('categories:all');

    logger.info('Category created successfully', { categoryID: category.id });

    return {
      id: category.id,
      name: category.name,
      postCount: category.postCount,
      parentID: category.parentID,
    };
  },
};
