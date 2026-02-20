/**
 * Post CRUD operations
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';
import { resolvePostID } from '../../utils/url-parser.js';

export const createPost: MCPTool = {
  name: 'canny_create_post',
  title: 'Create Canny Post',
  description: `Create a new post in Canny. Automatically creates the author user if they don't exist.

Args:
  - boardID (string): Board ID to create the post in
  - title (string): Post title
  - details (string, optional): Post body/description
  - authorEmail (string): Author email (user created automatically if needed)
  - authorName (string, optional): Author display name
  - categoryID (string, optional): Category ID to assign
  - customFields (object, optional): Custom field key-value pairs
  - eta (string, optional): ETA in ISO 8601 format (e.g., "2024-12-31")
  - etaPublic (boolean, optional): Whether the ETA is publicly visible
  - imageURLs (string[], optional): Image URLs to attach
  - ownerID (string, optional): Admin user ID to assign as owner
  - byID (string, optional): Admin ID creating on behalf of user

Returns:
  JSON with the created post's id and url.

Examples:
  - "Create a feature request" -> boardID, title, authorEmail required
  - "Create post with ETA" -> include eta: "2025-06-30", etaPublic: true`,
  readOnly: false,
  toolset: 'posts',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  inputSchema: {
    boardID: z.string().describe('Board ID to create post in'),
    title: z.string().describe('Post title'),
    details: z.string().optional().describe('Post details/description'),
    authorEmail: z.string().describe('Author email (user will be created if needed)'),
    authorName: z.string().optional().describe('Author name'),
    categoryID: z.string().optional().describe('Category ID'),
    customFields: z.record(z.string(), z.unknown()).optional().describe('Custom fields for the post'),
    eta: z.string().optional().describe('ETA in ISO 8601 format (e.g., "2024-12-31")'),
    etaPublic: z.boolean().optional().describe('Whether the ETA is public'),
    imageURLs: z.array(z.string()).optional().describe('Array of image URLs to attach to post'),
    ownerID: z.string().optional().describe('Admin user ID to assign as post owner'),
    byID: z.string().optional().describe('Admin ID creating on behalf of user'),
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
  title: 'Update Post Status',
  description: `Change the status of a Canny post with optional voter notifications. Accepts post ID or Canny URL.

Args:
  - postID (string, optional): Post ID to update
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Board ID (helps resolve URL)
  - changerID (string): ID of the admin changing the status
  - status (string): New status value (must match configured statuses)
  - comment (string, optional): Comment to include with the status change
  - notifyVoters (boolean, optional): Notify users who voted on the post (default: true)

Returns:
  JSON with success boolean.

Examples:
  - "Mark post as complete" -> postID, changerID, status: "complete"
  - "Close post from URL" -> url: "https://...", changerID, status: "closed"`,
  readOnly: false,
  toolset: 'posts',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID to update'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    changerID: z.string().describe('ID of admin changing the status'),
    status: z.string().describe('New status'),
    comment: z.string().optional().describe('Optional status change comment'),
    notifyVoters: z.boolean().optional().describe('Notify users who voted (default: true)'),
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
  title: 'Update Post Details',
  description: `Update the details of an existing Canny post. Accepts post ID or Canny URL. At least one field must be provided.

Args:
  - postID (string, optional): Post ID to update
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Board ID (helps resolve URL)
  - title (string, optional): New post title
  - details (string, optional): New post body/description
  - eta (string, optional): ETA in ISO 8601 format (e.g., "2024-12-31")
  - etaPublic (boolean, optional): Whether the ETA is publicly visible
  - imageURLs (string[], optional): Image URLs to attach
  - customFields (object, optional): Custom field key-value pairs

Returns:
  JSON with success boolean.

Examples:
  - "Update post title" -> postID: "abc123", title: "New Title"
  - "Set ETA on post" -> postID: "abc123", eta: "2025-06-30", etaPublic: true`,
  readOnly: false,
  toolset: 'posts',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID to update'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    title: z.string().optional().describe('New post title'),
    details: z.string().optional().describe('New post details/description'),
    eta: z.string().optional().describe('ETA in ISO 8601 format (e.g., "2024-12-31")'),
    etaPublic: z.boolean().optional().describe('Whether the ETA is public'),
    imageURLs: z.array(z.string()).optional().describe('Array of image URLs to attach to post'),
    customFields: z.record(z.string(), z.unknown()).optional().describe('Custom fields for the post'),
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
  title: 'Change Post Category',
  description: `Move a Canny post to a different category. Accepts post ID or Canny URL.

Args:
  - postID (string, optional): Post ID to update
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Board ID (helps resolve URL)
  - categoryID (string): Target category ID

Returns:
  JSON with success boolean.

Examples:
  - "Move post to a new category" -> postID: "abc123", categoryID: "cat456"
  - "Recategorize post from URL" -> url: "https://...", categoryID: "cat456"`,
  readOnly: false,
  toolset: 'posts',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    categoryID: z.string().describe('New category ID'),
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

export const addPostTag: MCPTool = {
  name: 'canny_add_post_tag',
  title: 'Add Tag to Post',
  description: `Add a tag to a Canny post. Accepts post ID or Canny URL. Idempotent — adding a tag that already exists on the post has no effect.

Args:
  - postID (string, optional): Post ID to tag
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Board ID (helps resolve URL)
  - tagID (string, required): Tag ID to add to the post

Returns:
  JSON with success boolean.

Examples:
  - "Tag post as iOS" -> postID: "abc123", tagID: "tag456"
  - "Add tag to post from URL" -> url: "https://...", tagID: "tag456"`,
  readOnly: false,
  toolset: 'posts',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID to tag'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    tagID: z.string().describe('Tag ID to add to the post'),
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, tagID } = params;

    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(tagID, 'tagID');

    logger.info('Adding tag to post', { postID, tagID });

    await client.addPostTag(postID, tagID);

    logger.info('Tag added to post successfully');

    return { success: true };
  },
};

export const removePostTag: MCPTool = {
  name: 'canny_remove_post_tag',
  title: 'Remove Tag from Post',
  description: `Remove a tag from a Canny post. Accepts post ID or Canny URL. Idempotent — removing a tag that doesn't exist on the post has no effect.

Args:
  - postID (string, optional): Post ID to remove tag from
  - url (string, optional): Canny post URL (alternative to postID)
  - boardID (string, optional): Board ID (helps resolve URL)
  - tagID (string, required): Tag ID to remove from the post

Returns:
  JSON with success boolean.

Examples:
  - "Remove iOS tag from post" -> postID: "abc123", tagID: "tag456"
  - "Untag post from URL" -> url: "https://...", tagID: "tag456"`,
  readOnly: false,
  toolset: 'posts',
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID to remove tag from'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    tagID: z.string().describe('Tag ID to remove from the post'),
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, tagID } = params;

    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(tagID, 'tagID');

    logger.info('Removing tag from post', { postID, tagID });

    await client.removePostTag(postID, tagID);

    logger.info('Tag removed from post successfully');

    return { success: true };
  },
};
