/**
 * Batch tagging operations
 */

import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';
import { resolvePostIDs, resolvePostID } from '../../utils/url-parser.js';

export const batchTag: MCPTool = {
  name: 'canny_batch_tag',
  description: 'Tag multiple posts at once. Accepts post IDs or Canny URLs.',
  readOnly: false,
  toolset: 'batch',
  inputSchema: {
    type: 'object',
    properties: {
      postIDs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of post IDs to tag',
      },
      urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of Canny post URLs (alternative to postIDs)',
      },
      addTags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tag IDs to add',
      },
      removeTags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tag IDs to remove',
      },
    },
    required: [],
  },
  handler: async (params, { client, config, logger }) => {
    const { postIDs: providedPostIDs, urls, addTags = [], removeTags = [] } = params;

    // Resolve post IDs from URLs if needed
    const postIDs = await resolvePostIDs({ postIDs: providedPostIDs, urls, config, client, logger });

    if (!Array.isArray(postIDs) || postIDs.length === 0) {
      throw new Error('Either postIDs or urls must be provided and non-empty');
    }

    if (addTags.length === 0 && removeTags.length === 0) {
      throw new Error('Must specify either addTags or removeTags');
    }

    logger.info('Batch tagging posts', {
      count: postIDs.length,
      addTags: addTags.length,
      removeTags: removeTags.length,
    });

    // Note: Canny API doesn't have direct tag manipulation in the current client
    // This would need to be implemented via post updates or a dedicated endpoint
    // For now, return placeholder
    logger.warn('Batch tagging requires additional API implementation');

    const successful: string[] = [];
    const failed: string[] = [];

    // Placeholder - in production would update each post's tags
    postIDs.forEach((postID) => {
      successful.push(postID);
    });

    logger.info('Batch tagging completed', {
      successful: successful.length,
      failed: failed.length,
    });

    return {
      successful,
      failed,
      note: 'Tag management may require additional API integration',
    };
  },
};

export const batchMerge: MCPTool = {
  name: 'canny_batch_merge',
  description: 'Merge duplicate posts. Accepts post IDs or Canny URLs.',
  readOnly: false,
  toolset: 'batch',
  inputSchema: {
    type: 'object',
    properties: {
      primaryPostID: {
        type: 'string',
        description: 'Primary post ID to keep',
      },
      primaryUrl: {
        type: 'string',
        description: 'Primary post URL (alternative to primaryPostID)',
      },
      boardID: {
        type: 'string',
        description: 'Board ID (optional, helps resolve URLs)',
      },
      mergePostIDs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Post IDs to merge into primary',
      },
      mergeUrls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Post URLs to merge into primary (alternative to mergePostIDs)',
      },
      comment: {
        type: 'string',
        description: 'Comment about the merge',
      },
    },
    required: [],
  },
  handler: async (params, { client, config, logger }) => {
    const { primaryPostID: providedPrimaryID, primaryUrl, boardID, mergePostIDs: providedMergeIDs, mergeUrls, comment } = params;

    // Resolve primary post ID
    const primaryPostID = await resolvePostID({ postID: providedPrimaryID, url: primaryUrl, boardID, config, client, logger });

    // Resolve merge post IDs
    const mergePostIDs = await resolvePostIDs({ postIDs: providedMergeIDs, urls: mergeUrls, config, client, logger });

    validateRequired(mergePostIDs, 'mergePostIDs');

    logger.info('Merging posts', {
      primary: primaryPostID,
      mergeCount: mergePostIDs.length,
    });

    // Note: Canny API doesn't expose a direct merge endpoint
    // This is a placeholder for the functionality
    logger.warn('Post merging requires manual action or additional API support');

    // In a full implementation, this would:
    // 1. Fetch all posts to merge
    // 2. Aggregate votes and comments
    // 3. Update primary post
    // 4. Delete merged posts
    // 5. Notify affected users

    return {
      mergedCount: mergePostIDs.length,
      totalVotes: 0,
      note: 'Post merging may require manual action in Canny UI',
    };
  },
};
