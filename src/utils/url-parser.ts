/**
 * Canny URL parsing utilities
 */

import { CannyMCPConfig } from '../types/config.js';

export interface ParsedCannyURL {
  urlName?: string;
  boardSlug?: string;
  commentID?: string;
  isValid: boolean;
}

/**
 * Parse a Canny URL to extract urlName, board information, and optional comment ID
 *
 * Supports formats:
 * - https://company.canny.io/board/p/url-name
 * - https://ideas.company.com/path/to/p/url-name
 * - https://ideas.company.com/admin/feedback/board/p/url-name?boards=board-name
 * - https://company.canny.io/board/p/url-name#comment-abc123
 */
export function parseCannyURL(url: string): ParsedCannyURL {
  try {
    const urlObj = new URL(url);

    // Extract urlName from path (after /p/)
    const pathMatch = urlObj.pathname.match(/\/p\/([^/?#]+)/);
    if (!pathMatch) {
      return { isValid: false };
    }

    const urlName = pathMatch[1];

    // Try to extract board slug from path (before /p/)
    // Pattern: /board-name/p/url-name or /path/board-name/p/url-name
    const boardMatch = urlObj.pathname.match(/\/([^/]+)\/p\//);
    const boardSlug = boardMatch ? boardMatch[1] : undefined;

    // Also check query params for board info
    const boardsParam = urlObj.searchParams.get('boards');

    // Extract comment ID from hash fragment (#comment-abc123)
    const hashMatch = urlObj.hash.match(/#comment-([^&]+)/);
    const commentID = hashMatch ? hashMatch[1] : undefined;

    return {
      urlName,
      boardSlug: boardsParam || boardSlug,
      commentID,
      isValid: true,
    };
  } catch (error) {
    return { isValid: false };
  }
}

/**
 * Check if a string looks like a Canny URL
 */
export function isCannyURL(input: string): boolean {
  return input.includes('/p/') && (input.startsWith('http://') || input.startsWith('https://'));
}

/**
 * Resolve postID from various inputs: direct ID, URL, or urlName
 * Returns the postID to use for API calls
 */
export async function resolvePostID(params: {
  postID?: string;
  url?: string;
  urlName?: string;
  boardID?: string;
  config: CannyMCPConfig;
  client: Pick<import('../api/client.js').CannyClient, 'retrievePost'>;
  logger: Pick<import('../types/mcp.js').Logger, 'debug'>;
}): Promise<string> {
  const { postID, url, urlName, boardID, config, client, logger } = params;

  // If postID provided directly, use it
  if (postID) {
    return postID;
  }

  let finalUrlName = urlName;
  let finalBoardID = boardID;

  // Parse URL if provided
  if (url) {
    if (!isCannyURL(url)) {
      throw new Error('Invalid Canny URL format. Expected format: https://domain.com/.../p/url-name');
    }

    const parsed = parseCannyURL(url);
    if (!parsed.isValid) {
      throw new Error('Could not parse Canny URL. Make sure it contains /p/ in the path.');
    }

    finalUrlName = parsed.urlName;

    // Try to resolve board slug to board ID from config
    if (!finalBoardID && parsed.boardSlug) {
      const boardEntry = Object.entries(config.canny.workspace.boards).find(
        ([alias]) => alias === parsed.boardSlug
      );
      if (boardEntry) {
        finalBoardID = boardEntry[1];
        logger.debug('Resolved board from URL', { boardSlug: parsed.boardSlug, boardID: finalBoardID });
      }
    }
  }

  // If we have urlName, fetch the post to get its ID
  if (finalUrlName) {
    if (!finalBoardID) {
      throw new Error('boardID is required when using urlName or URL. Either provide boardID explicitly or configure boards in your config.');
    }

    logger.debug('Fetching post by urlName', { urlName: finalUrlName, boardID: finalBoardID });

    const post = await client.retrievePost({ urlName: finalUrlName, boardID: finalBoardID });
    return post.id;
  }

  throw new Error('Either postID, url, or urlName must be provided');
}

/**
 * Resolve multiple post IDs from URLs or direct IDs
 */
export async function resolvePostIDs(params: {
  postIDs?: string[];
  urls?: string[];
  config: CannyMCPConfig;
  client: Pick<import('../api/client.js').CannyClient, 'retrievePost'>;
  logger: Pick<import('../types/mcp.js').Logger, 'debug'>;
}): Promise<string[]> {
  const { postIDs, urls, config, client, logger } = params;

  const resolvedIDs: string[] = [];

  // Add direct post IDs
  if (postIDs) {
    resolvedIDs.push(...postIDs);
  }

  // Resolve URLs to post IDs
  if (urls && urls.length > 0) {
    for (const url of urls) {
      const id = await resolvePostID({ url, config, client, logger });
      resolvedIDs.push(id);
    }
  }

  return resolvedIDs;
}
