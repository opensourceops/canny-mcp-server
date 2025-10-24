/**
 * Comment management tools
 */

import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';
import { resolvePostID } from '../../utils/url-parser.js';

export const listComments: MCPTool = {
  name: 'canny_list_comments',
  description: 'Get comments with skip-based pagination. Filter by post ID/URL, board, or author.',
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
      authorID: {
        type: 'string',
        description: 'Filter by author ID',
      },
      companyID: {
        type: 'string',
        description: 'Filter by company ID - returns comments from users linked to this company',
      },
      limit: {
        type: 'number',
        description: 'Number of comments to fetch (default: 10)',
      },
      skip: {
        type: 'number',
        description: 'Number of comments to skip',
      },
      compact: {
        type: 'boolean',
        description: 'Return compact format (default: true)',
      },
    },
    required: [],
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, authorID, companyID, limit = 10, skip = 0, compact = true } = params;

    // Resolve post ID from URL if needed (optional for this tool)
    let postID = providedPostID;
    if (url && !postID) {
      postID = await resolvePostID({ url, boardID, config, client, logger });
    }

    logger.info('Listing comments', { postID, boardID, companyID, limit, skip });

    const response = await client.listComments({
      postID,
      boardID,
      authorID,
      companyID,
      limit,
      skip,
    });

    const comments = compact
      ? ResponseTransformer.compactComments(response.comments)
      : response.comments;

    logger.info(`Found ${comments.length} comments`);

    return {
      comments,
      hasMore: response.hasMore,
      totalCount: skip + comments.length,
    };
  },
};

export const createComment: MCPTool = {
  name: 'canny_create_comment',
  description: 'Add comment to post. Accepts post ID or Canny URL.',
  readOnly: false,
  toolset: 'engagement',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Post ID to comment on',
      },
      url: {
        type: 'string',
        description: 'Canny post URL (alternative to postID)',
      },
      boardID: {
        type: 'string',
        description: 'Board ID (optional, helps resolve URL)',
      },
      authorEmail: {
        type: 'string',
        description: 'Author email (user created if needed)',
      },
      authorName: {
        type: 'string',
        description: 'Author name',
      },
      value: {
        type: 'string',
        description: 'Comment text',
      },
      internal: {
        type: 'boolean',
        description: 'Private/internal comment (default: false)',
      },
      imageURLs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of image URLs to attach to comment',
      },
      parentID: {
        type: 'string',
        description: 'Parent comment ID for threading',
      },
    },
    required: ['authorEmail', 'value'],
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, authorEmail, authorName, value, internal = false, imageURLs, parentID } = params;

    // Resolve post ID from URL if needed
    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(authorEmail, 'authorEmail');
    validateRequired(value, 'value');
    validateEmail(authorEmail);

    logger.info('Creating comment', { postID, authorEmail, internal });

    // Find or create user
    const user = await client.findOrCreateUser({
      email: authorEmail,
      ...(authorName && { name: authorName }),
    });

    // Create comment
    const comment = await client.createComment({
      postID,
      authorID: user.id,
      value,
      internal,
      ...(imageURLs && { imageURLs }),
      ...(parentID && { parentID }),
    });

    logger.info('Comment created successfully', { commentID: comment.id });

    return {
      id: comment.id,
      created: comment.created,
    };
  },
};

export const deleteComment: MCPTool = {
  name: 'canny_delete_comment',
  description: 'Remove comment from post',
  readOnly: false,
  toolset: 'engagement',
  inputSchema: {
    type: 'object',
    properties: {
      commentID: {
        type: 'string',
        description: 'Comment ID to delete',
      },
    },
    required: ['commentID'],
  },
  handler: async (params, { client, logger }) => {
    const { commentID } = params;

    validateRequired(commentID, 'commentID');

    logger.info('Deleting comment', { commentID });

    await client.deleteComment(commentID);

    logger.info('Comment deleted successfully');

    return { success: true };
  },
};
