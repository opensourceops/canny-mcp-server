/**
 * Category management tools
 */

import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';

export const listCategories: MCPTool = {
  name: 'canny_list_categories',
  description: 'Get board categories',
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {
    type: 'object',
    properties: {
      boardID: {
        type: 'string',
        description: 'Board ID to fetch categories for',
      },
    },
    required: ['boardID'],
  },
  handler: async (params, { client, cache, logger }) => {
    const { boardID } = params;

    validateRequired(boardID, 'boardID');
    logger.info('Fetching categories', { boardID });

    // Check cache
    const cacheKey = `categories:board:${boardID}`;
    const cached = cache.get<{ categories: any[] }>(cacheKey);
    if (cached) {
      logger.debug('Returning cached categories');
      return cached;
    }

    const categories = await client.listCategories(boardID);

    // Compact response
    const compact = categories.map((category) => ({
      id: category.id,
      name: category.name,
      postCount: category.postCount,
      parentID: category.parentID,
    }));

    const result = { categories: compact };

    // Cache for 1 hour
    cache.set(cacheKey, result, 3600);

    logger.info(`Fetched ${categories.length} categories`);
    return result;
  },
};

export const createCategory: MCPTool = {
  name: 'canny_create_category',
  description: 'Create a new category on a board',
  readOnly: false,
  toolset: 'discovery',
  inputSchema: {
    type: 'object',
    properties: {
      boardID: {
        type: 'string',
        description: 'Board ID to create category in',
      },
      name: {
        type: 'string',
        description: 'Category name',
      },
      subscribeAdmins: {
        type: 'boolean',
        description: 'Whether to subscribe all admins to posts in this category',
      },
      parentID: {
        type: 'string',
        description: 'Parent category ID for nested categories (optional)',
      },
    },
    required: ['boardID', 'name', 'subscribeAdmins'],
  },
  handler: async (params, { client, cache, logger }) => {
    const { boardID, name, subscribeAdmins, parentID } = params;

    validateRequired(boardID, 'boardID');
    validateRequired(name, 'name');
    validateRequired(subscribeAdmins, 'subscribeAdmins');

    logger.info('Creating category', { boardID, name, subscribeAdmins });

    const category = await client.createCategory(boardID, name, subscribeAdmins, parentID);

    // Invalidate category cache for this board
    const cacheKey = `categories:board:${boardID}`;
    cache.delete(cacheKey);

    logger.info('Category created successfully', { categoryID: category.id });

    return {
      id: category.id,
      name: category.name,
      postCount: category.postCount,
      parentID: category.parentID,
    };
  },
};
