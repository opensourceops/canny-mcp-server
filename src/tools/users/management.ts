/**
 * User management tools
 */

import { MCPTool } from '../../types/mcp.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';

export const findOrCreateUser: MCPTool = {
  name: 'canny_find_or_create_user',
  description: 'Get or create user ID for operations',
  readOnly: false,
  toolset: 'users',
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'User email',
      },
      name: {
        type: 'string',
        description: 'User name',
      },
      userID: {
        type: 'string',
        description: 'Custom user identifier',
      },
      avatarURL: {
        type: 'string',
        description: 'User avatar URL',
      },
      companies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            created: {
              type: 'string',
              description: 'Company creation date in ISO 8601',
            },
            id: {
              type: 'string',
              description: 'Company ID',
            },
            monthlySpend: {
              type: 'number',
              description: 'Monthly spend/MRR',
            },
            name: {
              type: 'string',
              description: 'Company name',
            },
          },
        },
        description: 'Company associations with optional metadata (created, id, monthlySpend, name)',
      },
      customFields: {
        type: 'object',
        description: 'Custom user fields',
      },
    },
    required: ['email'],
  },
  handler: async (params, { client, cache, logger }) => {
    const { email, name, userID, avatarURL, companies, customFields } = params;

    validateRequired(email, 'email');
    validateEmail(email);

    logger.info('Finding or creating user', { email });

    // Check cache
    const cacheKey = `user:${email}`;
    const cached = cache.get<{ id: string }>(cacheKey);
    if (cached) {
      logger.debug('Returning cached user ID');
      return { ...cached, isNew: false };
    }

    const user = await client.findOrCreateUser({
      email,
      ...(name && { name }),
      ...(userID && { userID }),
      ...(avatarURL && { avatarURL }),
      ...(companies && { companies }),
      ...(customFields && { customFields }),
    });

    const result = {
      id: user.id,
      isNew: !user.created || new Date(user.created).getTime() > Date.now() - 5000,
    };

    // Cache for 24 hours
    cache.set(cacheKey, { id: user.id }, 86400);

    logger.info('User resolved', { userID: user.id, isNew: result.isNew });

    return result;
  },
};

export const getUserDetails: MCPTool = {
  name: 'canny_get_user_details',
  description: 'Get full user information by ID, email, or custom userID',
  readOnly: true,
  toolset: 'users',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Canny user ID',
      },
      email: {
        type: 'string',
        description: 'User email address',
      },
      userID: {
        type: 'string',
        description: 'Custom user identifier',
      },
    },
    required: [],
  },
  handler: async (params, { client, logger }) => {
    const { id, email, userID } = params;

    // At least one lookup method must be provided
    if (!id && !email && !userID) {
      throw new Error('At least one of id, email, or userID must be provided');
    }

    logger.info('Fetching user details', { id, email, userID });

    const user = await client.retrieveUser({
      ...(id && { id }),
      ...(email && { email }),
      ...(userID && { userID }),
    });

    logger.info('User details fetched');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created: user.created,
        companies: user.companies?.map((c) => c.name) || [],
      },
    };
  },
};
