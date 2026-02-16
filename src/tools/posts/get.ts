/**
 * Get single post details
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateRequired } from '../../utils/validators.js';
import { parseCannyURL, isCannyURL } from '../../utils/url-parser.js';

export const getPost: MCPTool = {
  name: 'canny_get_post',
  title: 'Get Canny Post',
  description: `Retrieve a single Canny post with full details. Supports lookup by post ID, URL name, or full Canny URL. Optionally includes comments and votes.

Args:
  - postID (string, optional): Post ID to retrieve
  - url (string, optional): Full Canny post URL (e.g., "https://company.canny.io/board/p/feature-name")
  - urlName (string, optional): Post's unique URL name (alternative to postID)
  - boardID (string, optional): Board ID (required when using urlName)
  - includeComments (boolean, optional): Include comments (default: false)
  - commentLimit (number, optional): Max comments to include (default: 5)
  - includeVotes (boolean, optional): Include vote details (default: false)
  - fields (string[], optional): Specific fields to include in response

Returns:
  JSON with post object, and optionally comments array and votes summary.

Examples:
  - "Get post abc123" -> postID: "abc123"
  - "Show post details from URL" -> url: "https://company.canny.io/features/p/dark-mode"
  - "Get post with comments" -> postID: "abc123", includeComments: true`,
  readOnly: true,
  toolset: 'discovery',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    postID: z.string().optional().describe('Post ID to retrieve'),
    url: z.string().optional().describe('Full Canny post URL (e.g., https://company.canny.io/board/p/feature-name)'),
    urlName: z.string().optional().describe("Post's unique URL name (alternative to postID)"),
    boardID: z.string().optional().describe('Board ID (required when using urlName, optional with url)'),
    includeComments: z.boolean().optional().describe('Include comments (default: false)'),
    commentLimit: z.number().optional().describe('Maximum comments to include (default: 5)'),
    includeVotes: z.boolean().optional().describe('Include vote count (default: false)'),
    fields: z.array(z.string()).optional().describe('Select specific fields to include'),
  },
  handler: async (params, { client, config, logger }) => {
    const {
      postID,
      url,
      urlName: providedUrlName,
      boardID: providedBoardID,
      includeComments = false,
      commentLimit = 5,
      includeVotes = false,
      fields,
    } = params;

    let finalPostID = postID;
    let finalUrlName = providedUrlName;
    let finalBoardID = providedBoardID;

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

      // Use boardID from URL if not explicitly provided
      if (!finalBoardID && parsed.boardSlug) {
        // Try to resolve board slug to board ID from config
        const boardEntry = Object.entries(config.canny.workspace.boards).find(
          ([alias, id]) => alias === parsed.boardSlug
        );
        if (boardEntry) {
          finalBoardID = boardEntry[1];
          logger.info('Resolved board from URL', { boardSlug: parsed.boardSlug, boardID: finalBoardID });
        }
      }
    }

    // Validate that we have either postID or urlName
    if (!finalPostID && !finalUrlName) {
      throw new Error('Either postID, url, or urlName must be provided');
    }

    // Validate that boardID is provided when using urlName
    if (finalUrlName && !finalBoardID) {
      throw new Error('boardID is required when using urlName. Either provide boardID explicitly or use a board configured in your config.');
    }

    logger.info('Fetching post details', { postID: finalPostID, urlName: finalUrlName, boardID: finalBoardID });

    const post = await client.retrievePost({ id: finalPostID, urlName: finalUrlName, boardID: finalBoardID });

    // Transform to compact format
    const compactPost = ResponseTransformer.compactPost(
      post,
      fields || config.canny.defaults.defaultFields
    );

    const result: Record<string, unknown> = { post: compactPost };

    // Optionally include comments
    if (includeComments) {
      const commentsResponse = await client.listComments({
        postID: post.id,
        limit: commentLimit,
      });

      result.comments = ResponseTransformer.compactComments(
        commentsResponse.comments.slice(0, commentLimit)
      );
    }

    // Optionally include votes
    if (includeVotes) {
      const votesResponse = await client.listVotes({
        postID: post.id,
        limit: 10,
      });

      result.votes = {
        count: post.score,
        recent: ResponseTransformer.compactVotes(votesResponse.votes.slice(0, 5)),
      };
    }

    logger.info('Post details fetched successfully');
    return result;
  },
};
