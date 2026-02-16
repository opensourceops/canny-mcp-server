/**
 * Batch status update operations
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { validateRequired, validateStatus } from '../../utils/validators.js';
import { resolvePostIDs } from '../../utils/url-parser.js';

export const batchUpdateStatus: MCPTool = {
  name: 'canny_batch_update_status',
  title: 'Batch Update Post Status',
  description: `Update the status of multiple Canny posts in a single batch operation.

Processes status changes concurrently across many posts, reporting per-post success or failure. Accepts either post IDs or Canny URLs.

Args:
  - changerID (string, required): ID of the admin performing the status change
  - status (string, required): New status to apply to all posts (e.g., "open", "under review", "planned", "in progress", "complete", "closed")
  - postIDs (string[]): Array of Canny post IDs to update
  - urls (string[]): Array of Canny post URLs (alternative to postIDs)
  - comment (string): Comment to attach to each status change
  - notifyVoters (boolean): Whether to notify voters of the change (default: false)
  Note: Provide either postIDs or urls (at least one, non-empty).

Returns:
  JSON with successful (string[]) and failed (string[]) arrays of post IDs.

Examples:
  - "Mark three posts as complete" -> changerID, status: "complete", postIDs: ["id1", "id2", "id3"]
  - "Close posts by URL with comment" -> changerID, status: "closed", urls: [...], comment: "Shipped in v2.1"`,
  readOnly: false,
  toolset: 'batch',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    changerID: z.string().describe('ID of admin changing the status'),
    status: z.string().describe('New status for all posts'),
    postIDs: z.array(z.string()).optional().describe('Array of post IDs to update'),
    urls: z.array(z.string()).optional().describe('Array of Canny post URLs (alternative to postIDs)'),
    comment: z.string().optional().describe('Optional comment for status change'),
    notifyVoters: z.boolean().optional().describe('Notify voters (default: false for batch)'),
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
