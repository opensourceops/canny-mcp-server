/**
 * Post CRUD operations
 */

import { MCPTool } from '../../types/mcp.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';
import { resolvePostID } from '../../utils/url-parser.js';

export const createPost: MCPTool = {
  name: 'canny_create_post',
  description: 'Create new post with auto-user creation',
  readOnly: false,
  toolset: 'posts',
  inputSchema: {
    type: 'object',
    properties: {
      boardID: {
        type: 'string',
        description: 'Board ID to create post in',
      },
      title: {
        type: 'string',
        description: 'Post title',
      },
      details: {
        type: 'string',
        description: 'Post details/description',
      },
      authorEmail: {
        type: 'string',
        description: 'Author email (user will be created if needed)',
      },
      authorName: {
        type: 'string',
        description: 'Author name',
      },
      categoryID: {
        type: 'string',
        description: 'Category ID',
      },
      customFields: {
        type: 'object',
        description: 'Custom fields for the post',
      },
      eta: {
        type: 'string',
        description: 'ETA in ISO 8601 format (e.g., "2024-12-31")',
      },
      etaPublic: {
        type: 'boolean',
        description: 'Whether the ETA is public',
      },
      imageURLs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of image URLs to attach to post',
      },
      ownerID: {
        type: 'string',
        description: 'Admin user ID to assign as post owner',
      },
      byID: {
        type: 'string',
        description: 'Admin ID creating on behalf of user',
      },
    },
    required: ['boardID', 'title', 'authorEmail'],
  },
  handler: async (params, { client, config, logger }) => {
    const {
      boardID,
      title,
      details,
      authorEmail,
      authorName,
      categoryID,
      customFields,
      eta,
      etaPublic,
      imageURLs,
      ownerID,
      byID,
    } = params;

    validateRequired(boardID, 'boardID');
    validateRequired(title, 'title');
    validateRequired(authorEmail, 'authorEmail');
    validateEmail(authorEmail);

    logger.info('Creating post', { boardID, title, authorEmail });

    // Find or create user
    const user = await client.findOrCreateUser({
      email: authorEmail,
      ...(authorName && { name: authorName }),
    });

    logger.debug('User resolved', { userID: user.id });

    // Create post
    const post = await client.createPost({
      boardID,
      title,
      authorID: user.id,
      ...(details && { details }),
      ...(categoryID && { categoryID }),
      ...(customFields && { customFields }),
      ...(eta && { eta }),
      ...(etaPublic !== undefined && { etaPublic }),
      ...(imageURLs && { imageURLs }),
      ...(ownerID && { ownerID }),
      ...(byID && { byID }),
    });

    logger.info('Post created successfully', { postID: post.id });

    return {
      id: post.id,
      url: post.url,
    };
  },
};

export const updatePostStatus: MCPTool = {
  name: 'canny_update_post_status',
  description: 'Change post status with notifications. Accepts post ID or Canny URL.',
  readOnly: false,
  toolset: 'posts',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Post ID to update',
      },
      url: {
        type: 'string',
        description: 'Canny post URL (alternative to postID)',
      },
      boardID: {
        type: 'string',
        description: 'Board ID (optional, helps resolve URL)',
      },
      changerID: {
        type: 'string',
        description: 'ID of admin changing the status',
      },
      status: {
        type: 'string',
        description: 'New status',
      },
      comment: {
        type: 'string',
        description: 'Optional status change comment',
      },
      notifyVoters: {
        type: 'boolean',
        description: 'Notify users who voted (default: true)',
      },
    },
    required: ['changerID', 'status'],
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, changerID, status, comment, notifyVoters = true } = params;

    // Resolve post ID from URL if needed
    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(changerID, 'changerID');
    validateRequired(status, 'status');

    // Validate status
    if (!config.canny.workspace.customStatuses.includes(status)) {
      throw new Error(
        `Invalid status. Valid statuses: ${config.canny.workspace.customStatuses.join(', ')}`
      );
    }

    logger.info('Updating post status', { postID, changerID, status });

    await client.changePostStatus({
      postID,
      changerID,
      status,
      ...(comment && { commentValue: comment }),
      shouldNotifyVoters: notifyVoters,
    });

    logger.info('Post status updated successfully');

    return { success: true };
  },
};

export const updatePost: MCPTool = {
  name: 'canny_update_post',
  description: 'Update post details (title, description, ETA, images, custom fields). Accepts post ID or Canny URL.',
  readOnly: false,
  toolset: 'posts',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Post ID to update',
      },
      url: {
        type: 'string',
        description: 'Canny post URL (alternative to postID)',
      },
      boardID: {
        type: 'string',
        description: 'Board ID (optional, helps resolve URL)',
      },
      title: {
        type: 'string',
        description: 'New post title',
      },
      details: {
        type: 'string',
        description: 'New post details/description',
      },
      eta: {
        type: 'string',
        description: 'ETA in ISO 8601 format (e.g., "2024-12-31")',
      },
      etaPublic: {
        type: 'boolean',
        description: 'Whether the ETA is public',
      },
      imageURLs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of image URLs to attach to post',
      },
      customFields: {
        type: 'object',
        description: 'Custom fields for the post',
      },
    },
    required: [],
  },
  handler: async (params, { client, config, logger }) => {
    const {
      postID: providedPostID,
      url,
      boardID,
      title,
      details,
      eta,
      etaPublic,
      imageURLs,
      customFields
    } = params;

    // Resolve post ID from URL if needed
    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    // At least one field must be provided to update
    if (!title && !details && !eta && etaPublic === undefined && !imageURLs && !customFields) {
      throw new Error('At least one field must be provided to update');
    }

    logger.info('Updating post', { postID });

    await client.updatePost({
      postID,
      ...(title && { title }),
      ...(details && { details }),
      ...(eta && { eta }),
      ...(etaPublic !== undefined && { etaPublic }),
      ...(imageURLs && { imageURLs }),
      ...(customFields && { customFields }),
    });

    logger.info('Post updated successfully');

    return { success: true };
  },
};

export const changeCategory: MCPTool = {
  name: 'canny_change_category',
  description: 'Move post to different category. Accepts post ID or Canny URL.',
  readOnly: false,
  toolset: 'posts',
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
      categoryID: {
        type: 'string',
        description: 'New category ID',
      },
    },
    required: ['categoryID'],
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, categoryID } = params;

    // Resolve post ID from URL if needed
    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(categoryID, 'categoryID');

    logger.info('Changing post category', { postID, categoryID });

    await client.changePostCategory(postID, categoryID);

    logger.info('Post category changed successfully');

    return { success: true };
  },
};
