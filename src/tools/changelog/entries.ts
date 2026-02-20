/**
 * Changelog entry tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';

export const createChangelogEntry: MCPTool = {
  name: 'canny_create_changelog_entry',
  title: 'Create Changelog Entry',
  description: `Create a new changelog entry in Canny to communicate product updates to users.

Args:
  - title (string, required): Title of the changelog entry
  - details (string, required): Markdown content for the changelog entry body
  - type (string, optional): Entry type - "new", "improved", or "fixed"
  - published (boolean, optional): Whether to publish immediately (default: false, creates as draft)
  - publishedOn (string, optional): Publication date in ISO 8601 format (e.g., "2025-01-15")
  - postIDs (string[], optional): Array of Canny post IDs to link to this entry
  - labelIDs (string[], optional): Array of label IDs to assign
  - notify (boolean, optional): Whether to notify subscribers (default: false)

Returns:
  JSON object with the created entry's id, title, url, and status.

Examples:
  - "Create a changelog entry" -> { title: "Dark Mode", details: "We added dark mode..." }
  - "Publish a bug fix entry" -> { title: "Bug Fix", details: "Fixed...", type: "fixed", published: true }
  - "Create entry linked to posts" -> { title: "New Feature", details: "...", postIDs: ["abc123"] }`,
  readOnly: false,
  toolset: 'changelog',
  inputSchema: {
    title: z.string().describe('Title of the changelog entry'),
    details: z.string().describe('Markdown content for the changelog entry body'),
    type: z.string().optional().describe('Entry type: "new", "improved", or "fixed"'),
    published: z.boolean().optional().describe('Whether to publish immediately (default: false)'),
    publishedOn: z.string().optional().describe('Publication date in ISO 8601 format'),
    postIDs: z.array(z.string()).optional().describe('Array of Canny post IDs to link'),
    labelIDs: z.array(z.string()).optional().describe('Array of label IDs to assign'),
    notify: z.boolean().optional().describe('Whether to notify subscribers (default: false)'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { title, details, type, published, publishedOn, postIDs, labelIDs, notify } = params;

    validateRequired(title, 'title');
    validateRequired(details, 'details');

    logger.info('Creating changelog entry', { title, type, published });

    const entry = await client.createChangelogEntry({
      title,
      details,
      ...(type && { type }),
      ...(published !== undefined && { published }),
      ...(publishedOn && { publishedOn }),
      ...(postIDs && { postIDs }),
      ...(labelIDs && { labelIDs }),
      ...(notify !== undefined && { notify }),
    });

    logger.info('Changelog entry created successfully', { entryID: entry.id });

    return {
      id: entry.id,
      title: entry.title,
      url: entry.url,
      status: entry.status,
    };
  },
};

export const listChangelogEntries: MCPTool = {
  name: 'canny_list_changelog_entries',
  title: 'List Changelog Entries',
  description: `List changelog entries in Canny. Supports pagination via limit/skip and optional filtering by label or type.

Args:
  - labelIDs (string[], optional): Filter entries by label IDs
  - type (string, optional): Filter by entry type - "new", "improved", or "fixed"
  - limit (number, optional): Max entries to return (default 10)
  - skip (number, optional): Number of entries to skip for pagination (default 0)

Returns:
  JSON object with an "entries" array (each containing id, title, status, publishedAt, types, url) and "hasMore" boolean.

Examples:
  - "List recent changelog entries" -> no params needed
  - "Show only bug fix entries" -> { type: "fixed" }
  - "Next page of entries" -> { skip: 10 }`,
  readOnly: true,
  toolset: 'changelog',
  inputSchema: {
    labelIDs: z.array(z.string()).optional().describe('Filter entries by label IDs'),
    type: z.string().optional().describe('Filter by entry type: "new", "improved", or "fixed"'),
    limit: z.number().optional().describe('Max entries to return (default 10)'),
    skip: z.number().optional().describe('Number of entries to skip for pagination (default 0)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (params, { client, logger }) => {
    const { labelIDs, type, limit = 10, skip = 0 } = params;

    logger.info('Fetching changelog entries', { labelIDs, type, limit, skip });

    const { entries, hasMore } = await client.listChangelogEntries({
      ...(labelIDs && { labelIDs }),
      ...(type && { type }),
      limit,
      skip,
    });

    // Compact response
    const compact = entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      status: entry.status,
      publishedAt: entry.publishedAt,
      types: entry.types,
      url: entry.url,
    }));

    logger.info(`Fetched ${entries.length} changelog entries`);
    return { entries: compact, hasMore };
  },
};
