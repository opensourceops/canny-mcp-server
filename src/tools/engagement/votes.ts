/**
 * Vote management tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';
import { resolvePostID } from '../../utils/url-parser.js';

export const listVotes: MCPTool = {
  name: 'canny_list_votes',
  title: 'List Votes',
  description: `List votes on Canny posts with skip-based pagination. Supports filtering by post, board, or user.

Args:
  - postID (string, optional): Filter by post ID
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Filter by board ID
  - userID (string, optional): Filter by user ID
  - limit (number, optional): Number of votes to fetch (default: 10)
  - skip (number, optional): Number of votes to skip for pagination (default: 0)

Returns:
  JSON with votes array and hasMore boolean for pagination.

Examples:
  - "Show votes on post abc123" -> postID: "abc123"
  - "Get votes from https://company.canny.io/board/p/my-post" -> url: "https://company.canny.io/board/p/my-post"
  - "List votes by user xyz" -> userID: "xyz"`,
  readOnly: true,
  toolset: 'engagement',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Filter by post ID'),
    url: z.string().optional().describe('Filter by Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Filter by board ID'),
    userID: z.string().optional().describe('Filter by user ID'),
    limit: z.number().optional().describe('Number of votes to fetch'),
    skip: z.number().int().min(0).optional().describe('Number of votes to skip for pagination (default: 0)'),
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, userID, limit = 10, skip = 0 } = params;

    // Resolve post ID from URL if needed (optional for this tool)
    let postID = providedPostID;
    if (url && !postID) {
      postID = await resolvePostID({ url, boardID, config, client, logger });
    }

    logger.info('Listing votes', { postID, boardID, limit });

    const response = await client.listVotes({
      postID,
      boardID,
      userID,
      limit,
      skip,
    });

    const votes = ResponseTransformer.compactVotes(response.votes);

    logger.info(`Found ${votes.length} votes`);

    return {
      votes,
      hasMore: response.hasMore,
    };
  },
};

export const addVote: MCPTool = {
  name: 'canny_add_vote',
  title: 'Add Vote',
  description: `Add a vote to a Canny post on behalf of a user. The post can be identified by ID or URL. The user is resolved by email and created if they don't exist. This operation is idempotent.

Args:
  - postID (string, optional): Post ID to vote on
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Board ID, helps resolve URL
  - userEmail (string, required): User email address (user created if not found)
  - userName (string, optional): User display name

Returns:
  JSON with success boolean.

Examples:
  - "Upvote post abc123 for user@example.com" -> postID: "abc123", userEmail: "user@example.com"
  - "Vote on https://company.canny.io/board/p/my-post for Jane" -> url: "https://company.canny.io/board/p/my-post", userEmail: "jane@example.com", userName: "Jane"`,
  readOnly: false,
  toolset: 'engagement',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID to vote on'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    userEmail: z.string().describe('User email (created if needed)'),
    userName: z.string().optional().describe('User name'),
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, userEmail, userName } = params;

    // Resolve post ID from URL if needed
    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(userEmail, 'userEmail');
    validateEmail(userEmail);

    logger.info('Adding vote', { postID, userEmail });

    // Find or create user
    const user = await client.findOrCreateUser({
      email: userEmail,
      ...(userName && { name: userName }),
    });

    // Create vote
    await client.createVote({
      postID,
      voterID: user.id,
    });

    logger.info('Vote added successfully');

    return { success: true };
  },
};

export const removeVote: MCPTool = {
  name: 'canny_remove_vote',
  title: 'Remove Vote',
  description: `Remove a user's vote from a Canny post. The post can be identified by ID or URL. This action is destructive but idempotent.

Args:
  - postID (string, optional): Post ID to remove vote from
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Board ID, helps resolve URL
  - userID (string, required): The ID of the user whose vote to remove

Returns:
  JSON with success boolean.

Examples:
  - "Remove vote from post abc123 for user xyz" -> postID: "abc123", userID: "xyz"`,
  readOnly: false,
  toolset: 'engagement',
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    userID: z.string().describe('User ID'),
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, userID } = params;

    // Resolve post ID from URL if needed
    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(userID, 'userID');

    logger.info('Removing vote', { postID, userID });

    await client.deleteVote(postID, userID);

    logger.info('Vote removed successfully');

    return { success: true };
  },
};
