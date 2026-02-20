/**
 * Idea tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';

export const listIdeas: MCPTool = {
  name: 'canny_list_ideas',
  title: 'List Ideas',
  description: `List ideas in Canny with optional filtering, search, and sorting. Supports cursor-based pagination.

Ideas are the core feedback unit in Canny, organized by groups and statuses.

Args:
  - cursor (string, optional): Pagination cursor from a previous response
  - limit (number, optional): Max ideas to return (default 50, max 100)
  - parentID (string, optional): Filter by parent idea ID (for child ideas)
  - search (string, optional): Full-text search query
  - sort (object, optional): Sort by { field: string, direction: "asc"|"desc" }. Default: { field: "_id", direction: "desc" }
  - filters (array, optional): Array of filter objects, each with { resource: "ideaDefaultField", condition: string, value: { fieldID: string, value: any } }. Conditions include: "is", "isNot", "contains", "isEmpty", "isNotEmpty", "greaterThan", "lessThan", "isOneOf", "isNotOneOf", etc. Field IDs: "author", "category", "created", "description", "group", "owner", "status", "statusChanged", "themes", "title", "type"
  - filtersOperator (string, optional): "all" (AND) or "any" (OR). Default: "all"

Returns:
  JSON with "ideas" array (compact), "hasNextPage" boolean, and optional "cursor".

Examples:
  - "List recent ideas" -> no params needed
  - "Search for dark mode ideas" -> { search: "dark mode" }
  - "Filter by status" -> { filters: [{ resource: "ideaDefaultField", condition: "is", value: { fieldID: "status", value: "open" } }] }`,
  readOnly: true,
  toolset: 'ideas',
  inputSchema: {
    cursor: z.string().optional().describe('Pagination cursor from a previous response'),
    limit: z.number().optional().describe('Max ideas to return (default 50, max 100)'),
    parentID: z.string().optional().describe('Filter by parent idea ID'),
    search: z.string().optional().describe('Full-text search query'),
    sort: z.object({
      field: z.string().describe('Field to sort by'),
      direction: z.enum(['asc', 'desc']).describe('Sort direction'),
    }).optional().describe('Sort order'),
    filters: z.array(z.object({
      resource: z.string().describe('Filter resource type (e.g., "ideaDefaultField")'),
      condition: z.string().describe('Filter condition (e.g., "is", "contains", "isEmpty")'),
      value: z.object({
        fieldID: z.string().describe('Field ID to filter on'),
        value: z.unknown().describe('Filter value'),
      }).describe('Filter value object'),
    })).optional().describe('Array of filter objects'),
    filtersOperator: z.enum(['all', 'any']).optional().describe('"all" (AND) or "any" (OR)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { cursor, limit = 50, parentID, search, sort, filters, filtersOperator } = params;

    const filtering = filters ? { filters, filtersOperator: filtersOperator || 'all' } : undefined;

    logger.info('Fetching ideas', { cursor, limit, parentID, search, sort, hasFilters: !!filtering });

    const { items, hasNextPage, cursor: nextCursor } = await client.listIdeas({
      cursor,
      filtering,
      limit,
      parentID,
      search,
      sort,
    });

    const compact = items.map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: ResponseTransformer.truncate(
        ResponseTransformer.stripHtml(idea.description || ''),
        200
      ),
      status: { name: idea.status?.name, type: idea.status?.type },
      authorName: idea.author?.name,
      groupName: idea.group?.name,
      childCount: idea.childCount,
      created: idea.created,
    }));

    logger.info(`Fetched ${items.length} ideas`);
    return { ideas: compact, hasNextPage, ...(nextCursor && { cursor: nextCursor }) };
  },
};

export const getIdea: MCPTool = {
  name: 'canny_get_idea',
  title: 'Get Idea',
  description: `Retrieve a single Canny idea by ID or URL name.

Args:
  - id (string, optional): Idea ID
  - urlName (string, optional): Idea URL name
  Note: At least one identifier must be provided.

Returns:
  JSON with the full idea object including author, group, owner, parent, status, and source.

Examples:
  - "Get idea abc123" -> { id: "abc123" }
  - "Get idea by URL name" -> { urlName: "dark-mode-support" }`,
  readOnly: true,
  toolset: 'ideas',
  inputSchema: {
    id: z.string().optional().describe('Idea ID'),
    urlName: z.string().optional().describe('Idea URL name'),
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

    logger.info('Fetching idea', { id, urlName });

    const idea = await client.retrieveIdea({ id, urlName });

    logger.info('Idea fetched successfully', { ideaID: idea.id });

    return {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      status: idea.status,
      author: idea.author ? { id: idea.author.id, name: idea.author.name, email: idea.author.email } : null,
      group: idea.group ? { id: idea.group.id, name: idea.group.name, urlName: idea.group.urlName } : null,
      owner: idea.owner ? { id: idea.owner.id, name: idea.owner.name } : null,
      parent: idea.parent,
      source: idea.source,
      childCount: idea.childCount,
      created: idea.created,
      updatedAt: idea.updatedAt,
      urlName: idea.urlName,
    };
  },
};
