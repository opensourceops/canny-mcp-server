/**
 * Post filtering tool using Canny's internal search endpoint.
 * Supports category, company, segment, tag, and date-range filtering.
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';

export const filterPosts: MCPTool = {
  name: 'canny_filter_posts',
  title: 'Filter Canny Posts by Category',
  description: `Filter posts using advanced criteria not available in the public API: category, company, segment, tag slugs, and date ranges.

Use canny_list_categories, canny_list_tags, canny_list_boards, or canny_list_companies first to discover URL slugs, then pass those slugs here.

Requires CANNY_SUBDOMAIN to be configured (auto-detected from CANNY_BASE_URL if *.canny.io).

Args:
  - boardURLNames (string[], optional): Board slugs, e.g. ["feature-request"]
  - categoryURLNames (string[], optional): Category slugs, e.g. ["continuous-integration"]
  - companyURLNames (string[], optional): Company slugs
  - tagURLNames (string[], optional): Tag slugs
  - segmentURLName (string, optional): User segment slug
  - status (string[], optional): Status values, e.g. ["open", "planned"]
  - postCreatedDateRange ([string, string], optional): Post creation date range [start, end] in ISO 8601
  - voteCreatedDateRange ([string, string], optional): Vote date range [start, end] in ISO 8601
  - sort (string, optional): Sort: "newest", "oldest", "score", "trendingScore", "statusChanged" (default: "newest")
  - page (number, optional): Page number, 1-indexed (default: 1). 10 posts per page.

Returns:
  JSON with posts array, hasNextPage boolean, page number, and totalFetched count.

Examples:
  - "Posts in CI category" -> categoryURLNames: ["continuous-integration"]
  - "Open bugs on feature-request board" -> boardURLNames: ["feature-request"], status: ["open"]
  - "Posts created in 2024" -> postCreatedDateRange: ["2024-01-01T00:00:00Z", "2024-12-31T23:59:59Z"]`,
  readOnly: true,
  toolset: 'discovery',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    boardURLNames: z.array(z.string()).optional().describe('Board slugs, e.g. ["feature-request"]'),
    categoryURLNames: z.array(z.string()).optional().describe('Category slugs, e.g. ["continuous-integration"]'),
    companyURLNames: z.array(z.string()).optional().describe('Company slugs'),
    tagURLNames: z.array(z.string()).optional().describe('Tag slugs'),
    segmentURLName: z.string().optional().describe('User segment slug'),
    status: z.array(z.string()).optional().describe('Status values, e.g. ["open", "planned"]'),
    postCreatedDateRange: z.tuple([z.string(), z.string()]).optional().describe('Post creation date range [start, end] in ISO 8601'),
    voteCreatedDateRange: z.tuple([z.string(), z.string()]).optional().describe('Vote date range [start, end] in ISO 8601'),
    sort: z.enum(['newest', 'oldest', 'score', 'trendingScore', 'statusChanged']).optional().describe('Sort order (default: "newest")'),
    page: z.number().int().min(1).max(10).optional().describe('Page number, 1-indexed (default: 1, max: 10). 10 posts per page.'),
  },
  handler: async (params, { client, config, logger }) => {
    const {
      boardURLNames,
      categoryURLNames,
      companyURLNames,
      tagURLNames,
      segmentURLName,
      status,
      postCreatedDateRange,
      voteCreatedDateRange,
      sort = 'newest',
      page = 1,
    } = params;

    const subdomain = config.canny.subdomain;
    if (!subdomain) {
      throw new Error(
        'CANNY_SUBDOMAIN is not configured. Set the CANNY_SUBDOMAIN environment variable ' +
        'or use a CANNY_BASE_URL matching https://<subdomain>.canny.io for auto-detection.'
      );
    }

    logger.info('Filtering posts via internal API', {
      subdomain,
      boardURLNames,
      categoryURLNames,
      status,
      page,
    });

    const response = await client.searchPosts(subdomain, {
      boardURLNames,
      categoryURLNames,
      companyURLNames,
      tagURLNames,
      segmentURLName,
      status,
      postCreatedDateRange,
      voteCreatedDateRange,
      sort,
      pages: page,
    });

    const PAGE_SIZE = 10;
    const startIndex = (page - 1) * PAGE_SIZE;
    const posts = response.posts.slice(startIndex, startIndex + PAGE_SIZE);

    logger.info(`Filtered ${posts.length} posts (page ${page})`);

    return {
      posts,
      hasNextPage: response.hasNextPage,
      page,
      totalFetched: response.posts.length,
    };
  },
};
