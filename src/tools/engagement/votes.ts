/**
 * Vote management tools
 */

import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';
import { resolvePostID } from '../../utils/url-parser.js';

export const listVotes: MCPTool = {
  name: 'canny_list_votes',
  description: 'Get vote details with cursor pagination. Filter by post ID/URL, board, or user.',
  readOnly: true,
  toolset: 'engagement',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Filter by post ID',
      },
      url: {
        type: 'string',
        description: 'Filter by Canny post URL (alternative to postID)',
      },
      boardID: {
        type: 'string',
        description: 'Filter by board ID',
      },
      userID: {
        type: 'string',
        description: 'Filter by user ID',
      },
      limit: {
        type: 'number',
        description: 'Number of votes to fetch',
      },
      cursor: {
        type: 'string',
        description: 'Pagination cursor',
      },
    },
    required: [],
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, userID, limit = 10, cursor } = params;

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
      cursor,
    });

    const votes = ResponseTransformer.compactVotes(response.votes);

    logger.info(`Found ${votes.length} votes`);

    return {
      votes,
      hasMore: response.hasMore,
      cursor: response.cursor,
    };
  },
};

export const addVote: MCPTool = {
  name: 'canny_add_vote',
  description: 'Vote on behalf of user. Accepts post ID or Canny URL.',
  readOnly: false,
  toolset: 'engagement',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Post ID to vote on',
      },
      url: {
        type: 'string',
        description: 'Canny post URL (alternative to postID)',
      },
      boardID: {
        type: 'string',
        description: 'Board ID (optional, helps resolve URL)',
      },
      userEmail: {
        type: 'string',
        description: 'User email (created if needed)',
      },
      userName: {
        type: 'string',
        description: 'User name',
      },
    },
    required: ['userEmail'],
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
  description: "Remove user's vote. Accepts post ID or Canny URL.",
  readOnly: false,
  toolset: 'engagement',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Post ID',
      },
      url: {
        type: 'string',
        description: 'Canny post URL (alternative to postID)',
      },
      boardID: {
        type: 'string',
        description: 'Board ID (optional, helps resolve URL)',
      },
      userID: {
        type: 'string',
        description: 'User ID',
      },
    },
    required: ['userID'],
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
