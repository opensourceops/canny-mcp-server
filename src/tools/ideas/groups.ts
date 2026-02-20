/**
 * Group tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';

export const listGroups: MCPTool = {
  name: 'canny_list_groups',
  title: 'List Groups',
  description: `List groups in Canny. Groups organize ideas into logical collections. Supports cursor-based pagination.

Args:
  - cursor (string, optional): Pagination cursor from a previous response
  - limit (number, optional): Max groups to return (default 50, max 100)

Returns:
  JSON object with a "groups" array (each containing id, name, description, urlName), "hasNextPage" boolean, and optional "cursor" for next page.

Examples:
  - "List all groups" -> no params needed
  - "Next page of groups" -> { cursor: "eyJhZnRlci..." }`,
  readOnly: true,
  toolset: 'ideas',
  inputSchema: {
    cursor: z.string().optional().describe('Pagination cursor from a previous response'),
    limit: z.number().optional().describe('Max groups to return (default 50, max 100)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { cursor, limit = 50 } = params;

    logger.info('Fetching groups', { cursor, limit });

    const { items, hasNextPage, cursor: nextCursor } = await client.listGroups({ cursor, limit });

    const compact = items.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      urlName: g.urlName,
    }));

    logger.info(`Fetched ${items.length} groups`);
    return { groups: compact, hasNextPage, ...(nextCursor && { cursor: nextCursor }) };
  },
};

export const getGroup: MCPTool = {
  name: 'canny_get_group',
  title: 'Get Group',
  description: `Retrieve a single Canny group by ID or URL name.

Args:
  - id (string, optional): Group ID
  - urlName (string, optional): Group URL name
  Note: At least one identifier must be provided.

Returns:
  JSON object with the group's id, name, description, and urlName.

Examples:
  - "Get group abc123" -> { id: "abc123" }
  - "Get feature-requests group" -> { urlName: "feature-requests" }`,
  readOnly: true,
  toolset: 'ideas',
  inputSchema: {
    id: z.string().optional().describe('Group ID'),
    urlName: z.string().optional().describe('Group URL name'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { id, urlName } = params;

    if (!id && !urlName) {
      throw new Error('Either id or urlName must be provided');
    }

    logger.info('Fetching group', { id, urlName });

    const group = await client.retrieveGroup({ id, urlName });

    logger.info('Group fetched successfully', { groupID: group.id });
    return group;
  },
};
