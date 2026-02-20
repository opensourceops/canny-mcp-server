/**
 * Opportunity tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';

export const listOpportunities: MCPTool = {
  name: 'canny_list_opportunities',
  title: 'List Opportunities',
  description: `List Salesforce opportunities linked to Canny. Supports skip-based pagination.

Opportunities connect Canny feedback to revenue data from Salesforce, showing which deals are tied to specific ideas and posts.

Args:
  - limit (number, optional): Max opportunities to return (default 10)
  - skip (number, optional): Number of opportunities to skip for pagination (default 0)

Returns:
  JSON with "opportunities" array (each containing id, name, value, won, closed, postIDs, ideaIDs) and "hasMore" boolean.

Examples:
  - "List opportunities" -> no params needed
  - "Next page" -> { skip: 10 }`,
  readOnly: true,
  toolset: 'ideas',
  inputSchema: {
    limit: z.number().optional().describe('Max opportunities to return (default 10)'),
    skip: z.number().optional().describe('Number of opportunities to skip for pagination (default 0)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { limit = 10, skip = 0 } = params;

    logger.info('Fetching opportunities', { limit, skip });

    const { opportunities, hasMore } = await client.listOpportunities({ limit, skip });

    const compact = opportunities.map((opp) => ({
      id: opp.id,
      name: opp.name,
      value: opp.value,
      won: opp.won,
      closed: opp.closed,
      postIDs: opp.postIDs,
      ideaIDs: opp.ideaIDs,
    }));

    logger.info(`Fetched ${opportunities.length} opportunities`);
    return { opportunities: compact, hasMore };
  },
};
