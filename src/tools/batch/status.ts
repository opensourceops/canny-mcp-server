/**
 * Batch status update operations
 */

import { MCPTool } from '../../types/mcp.js';
import { validateRequired, validateStatus } from '../../utils/validators.js';
import { resolvePostIDs } from '../../utils/url-parser.js';

export const batchUpdateStatus: MCPTool = {
  name: 'canny_batch_update_status',
  description: 'Update multiple post statuses. Accepts post IDs or Canny URLs.',
  readOnly: false,
  toolset: 'batch',
  inputSchema: {
    type: 'object',
    properties: {
      postIDs: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of post IDs to update',
      },
      urls: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of Canny post URLs (alternative to postIDs)',
      },
      changerID: {
        type: 'string',
        description: 'ID of admin changing the status',
      },
      status: {
        type: 'string',
        description: 'New status for all posts',
      },
      comment: {
        type: 'string',
        description: 'Optional comment for status change',
      },
      notifyVoters: {
        type: 'boolean',
        description: 'Notify voters (default: false for batch)',
      },
    },
    required: ['changerID', 'status'],
  },
  handler: async (params, { client, config, logger }) => {
    const { postIDs: providedPostIDs, urls, changerID, status, comment, notifyVoters = false } = params;

    // Resolve post IDs from URLs if needed
    const postIDs = await resolvePostIDs({ postIDs: providedPostIDs, urls, config, client, logger });

    validateRequired(changerID, 'changerID');
    validateRequired(status, 'status');
    validateStatus(status, config.canny.workspace.customStatuses);

    if (!Array.isArray(postIDs) || postIDs.length === 0) {
      throw new Error('Either postIDs or urls must be provided and non-empty');
    }

    logger.info('Batch updating post statuses', {
      count: postIDs.length,
      changerID,
      status,
    });

    const results = await Promise.allSettled(
      postIDs.map((postID) =>
        client.changePostStatus({
          postID,
          changerID,
          status,
          ...(comment && { commentValue: comment }),
          shouldNotifyVoters: notifyVoters,
        })
      )
    );

    const successful: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(postIDs[index]);
      } else {
        failed.push(postIDs[index]);
        logger.error('Failed to update post', {
          postID: postIDs[index],
          error: result.reason?.message,
        });
      }
    });

    logger.info('Batch update completed', {
      successful: successful.length,
      failed: failed.length,
    });

    return { successful, failed };
  },
};
