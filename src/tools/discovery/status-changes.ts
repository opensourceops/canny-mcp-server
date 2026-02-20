/**
 * Status change discovery tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';

export const listStatusChanges: MCPTool = {
  name: 'canny_list_status_changes',
  title: 'List Status Changes',
  description: `List status changes in Canny for auditing and history. Supports pagination via limit/skip.

Returns a chronological record of post status changes including who changed the status and any associated comment.

Args:
  - boardID (string, optional): Board ID to filter status changes by
  - limit (number, optional): Max status changes to return (default 10)
  - skip (number, optional): Number of status changes to skip for pagination (default 0)

Returns:
  JSON object with a "statusChanges" array (each containing id, postID, postTitle, status, changerName, created, comment) and "hasMore" boolean.

Examples:
  - "Show recent status changes" -> no params needed
  - "Status changes for board abc123" -> { boardID: "abc123" }
  - "Next page of status changes" -> { skip: 10 }`,
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {
    boardID: z.string().optional().describe('Board ID to filter status changes by'),
    limit: z.number().optional().describe('Max status changes to return (default 10)'),
    skip: z.number().optional().describe('Number of status changes to skip for pagination (default 0)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { boardID, limit = 10, skip = 0 } = params;

    logger.info('Fetching status changes', { boardID, limit, skip });

    const { statusChanges, hasMore } = await client.listStatusChanges({
      boardID,
      limit,
      skip,
    });

    // Compact response
    const compact = statusChanges.map((sc) => ({
      id: sc.id,
      postID: sc.post?.id,
      postTitle: sc.post?.title,
      status: sc.status,
      changerName: sc.changer?.name,
      created: sc.created,
      comment: sc.changeComment?.value,
    }));

    logger.info(`Fetched ${statusChanges.length} status changes`);
    return { statusChanges: compact, hasMore };
  },
};
