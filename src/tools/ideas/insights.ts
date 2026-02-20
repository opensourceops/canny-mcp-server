/**
 * Insight tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateRequired } from '../../utils/validators.js';

export const listInsights: MCPTool = {
  name: 'canny_list_insights',
  title: 'List Insights',
  description: `List insights in Canny. Insights are qualitative feedback snippets linked to ideas. Supports cursor-based pagination.

Args:
  - cursor (string, optional): Pagination cursor from a previous response
  - ideaID (string, optional): Filter insights by idea ID
  - limit (number, optional): Max insights to return (default 50, max 100)

Returns:
  JSON with "insights" array (compact), "hasNextPage" boolean, and optional "cursor".

Examples:
  - "List all insights" -> no params needed
  - "Show insights for idea abc123" -> { ideaID: "abc123" }
  - "Next page" -> { cursor: "eyJhZnRlci..." }`,
  readOnly: true,
  toolset: 'ideas',
  inputSchema: {
    cursor: z.string().optional().describe('Pagination cursor from a previous response'),
    ideaID: z.string().optional().describe('Filter insights by idea ID'),
    limit: z.number().optional().describe('Max insights to return (default 50, max 100)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { cursor, ideaID, limit = 50 } = params;

    logger.info('Fetching insights', { cursor, ideaID, limit });

    const { items, hasNextPage, cursor: nextCursor } = await client.listInsights({
      cursor,
      ideaID,
      limit,
    });

    const compact = items.map((insight) => ({
      id: insight.id,
      value: ResponseTransformer.truncate(
        ResponseTransformer.stripHtml(insight.value || ''),
        200
      ),
      ideaID: insight.ideaID,
      priority: insight.priority,
      authorName: insight.author?.name,
      companyName: insight.company?.name,
      created: insight.created,
    }));

    logger.info(`Fetched ${items.length} insights`);
    return { insights: compact, hasNextPage, ...(nextCursor && { cursor: nextCursor }) };
  },
};

export const getInsight: MCPTool = {
  name: 'canny_get_insight',
  title: 'Get Insight',
  description: `Retrieve a single Canny insight by ID.

Args:
  - id (string, required): Insight ID

Returns:
  JSON with the full insight object including author, company, priority, source, and linked users.

Examples:
  - "Get insight abc123" -> { id: "abc123" }`,
  readOnly: true,
  toolset: 'ideas',
  inputSchema: {
    id: z.string().describe('Insight ID'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { id } = params;

    validateRequired(id, 'id');

    logger.info('Fetching insight', { id });

    const insight = await client.retrieveInsight(id);

    logger.info('Insight fetched successfully', { insightID: insight.id });

    return {
      id: insight.id,
      value: insight.value,
      ideaID: insight.ideaID,
      priority: insight.priority,
      author: insight.author ? { id: insight.author.id, name: insight.author.name, email: insight.author.email } : null,
      company: insight.company,
      source: insight.source,
      url: insight.url,
      users: insight.users?.map((u) => ({ id: u.id, name: u.name, email: u.email })) || [],
      created: insight.created,
    };
  },
};
