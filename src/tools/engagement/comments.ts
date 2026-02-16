/**
 * Comment management tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';
import { resolvePostID } from '../../utils/url-parser.js';

export const listComments: MCPTool = {
  name: 'canny_list_comments',
  title: 'List Post Comments',
  description: `List comments on Canny posts with skip-based pagination. Supports filtering by post, board, author, or company.

Args:
  - postID (string, optional): Filter by post ID
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Filter by board ID
  - authorID (string, optional): Filter by author ID
  - companyID (string, optional): Filter by company ID - returns comments from users linked to this company
  - limit (number, optional): Number of comments to fetch (default: 10)
  - skip (number, optional): Number of comments to skip for pagination (default: 0)
  - compact (boolean, optional): Return compact format (default: true)

Returns:
  JSON with comments array, hasMore boolean, and totalCount.

Examples:
  - "Show comments on post abc123" -> postID: "abc123"
  - "Get comments from https://company.canny.io/board/p/my-post" -> url: "https://company.canny.io/board/p/my-post"
  - "List all comments on board xyz" -> boardID: "xyz"`,
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
    authorID: z.string().optional().describe('Filter by author ID'),
    companyID: z.string().optional().describe('Filter by company ID - returns comments from users linked to this company'),
    limit: z.number().optional().describe('Number of comments to fetch (default: 10)'),
    skip: z.number().optional().describe('Number of comments to skip'),
    compact: z.boolean().optional().describe('Return compact format (default: true)'),
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
  title: 'Create Comment',
  description: `Create a new comment on a Canny post. The post can be identified by ID or URL. The author is resolved by email and created if they don't exist.

Args:
  - postID (string, optional): Post ID to comment on
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Board ID, helps resolve URL
  - authorEmail (string, required): Author email address (user created if not found)
  - authorName (string, optional): Author display name
  - value (string, required): Comment text content
  - internal (boolean, optional): Mark as private/internal comment (default: false)
  - imageURLs (string[], optional): Array of image URLs to attach
  - parentID (string, optional): Parent comment ID for threaded replies

Returns:
  JSON with the created comment id and created timestamp.

Examples:
  - "Add a comment to post abc123" -> postID: "abc123", authorEmail: "user@example.com", value: "Great idea!"
  - "Reply to comment xyz" -> postID: "abc123", authorEmail: "user@example.com", value: "Thanks!", parentID: "xyz"`,
  readOnly: false,
  toolset: 'engagement',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID to comment on'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    authorEmail: z.string().describe('Author email (user created if needed)'),
    authorName: z.string().optional().describe('Author name'),
    value: z.string().describe('Comment text'),
    internal: z.boolean().optional().describe('Private/internal comment (default: false)'),
    imageURLs: z.array(z.string()).optional().describe('Array of image URLs to attach to comment'),
    parentID: z.string().optional().describe('Parent comment ID for threading'),
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
  title: 'Delete Comment',
  description: `Permanently delete a comment from a Canny post. This action is destructive and cannot be undone.

Args:
  - commentID (string, required): The ID of the comment to delete

Returns:
  JSON with success boolean.

Examples:
  - "Delete comment abc123" -> commentID: "abc123"`,
  readOnly: false,
  toolset: 'engagement',
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    commentID: z.string().describe('Comment ID to delete'),
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
