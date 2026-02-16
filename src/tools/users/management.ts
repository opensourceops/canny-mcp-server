/**
 * User management tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';

export const findOrCreateUser: MCPTool = {
  name: 'canny_find_or_create_user',
  title: 'Find or Create User',
  description: `Find an existing Canny user by email or create a new one if not found.

Idempotent lookup-or-create that returns a stable user ID for downstream operations. Results are cached for 24 hours.

Args:
  - email (string, required): User email address
  - name (string): Display name for the user
  - userID (string): Custom external user identifier
  - avatarURL (string): URL to the user's avatar image
  - companies (array): Company associations with optional metadata (created, id, monthlySpend, name)
  - customFields (object): Key-value pairs for custom user fields

Returns:
  JSON with id (string) and isNew (boolean) indicating whether the user was just created.

Examples:
  - "Look up user jane@example.com" -> email: "jane@example.com"
  - "Create user with company" -> email, name, and companies array`,
  readOnly: false,
  toolset: 'users',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    email: z.string().describe('User email'),
    name: z.string().optional().describe('User name'),
    userID: z.string().optional().describe('Custom user identifier'),
    avatarURL: z.string().optional().describe('User avatar URL'),
    companies: z.array(z.object({
      created: z.string().optional(),
      id: z.string().optional(),
      monthlySpend: z.number().optional(),
      name: z.string().optional(),
    })).optional().describe('Company associations with optional metadata (created, id, monthlySpend, name)'),
    customFields: z.record(z.string(), z.unknown()).optional().describe('Custom user fields'),
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
  title: 'Get User Details',
  description: `Retrieve full profile details for a Canny user.

Looks up a user by any one of their identifiers and returns profile information including associated companies.

Args:
  - id (string): Canny internal user ID
  - email (string): User email address
  - userID (string): Custom external user identifier
  Note: At least one identifier must be provided.

Returns:
  JSON with user object containing id, email, name, created date, and companies list.

Examples:
  - "Get user by email" -> email: "jane@example.com"
  - "Get user by Canny ID" -> id: "5f4b3c..."`,
  readOnly: true,
  toolset: 'users',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    id: z.string().optional().describe('Canny user ID'),
    email: z.string().optional().describe('User email address'),
    userID: z.string().optional().describe('Custom user identifier'),
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
