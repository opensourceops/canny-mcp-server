/**
 * Get single post details
 */

import { MCPTool } from '../../types/mcp.js';
import { ResponseTransformer } from '../../api/transformer.js';
import { validateRequired } from '../../utils/validators.js';
import { parseCannyURL, isCannyURL } from '../../utils/url-parser.js';

export const getPost: MCPTool = {
  name: 'canny_get_post',
  description: 'Get single post with optional related data. Fetch by post ID, URL name, or paste a full Canny URL.',
  readOnly: true,
  toolset: 'discovery',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Post ID to retrieve',
      },
      url: {
        type: 'string',
        description: 'Full Canny post URL (e.g., https://company.canny.io/board/p/feature-name)',
      },
      urlName: {
        type: 'string',
        description: "Post's unique URL name (alternative to postID)",
      },
      boardID: {
        type: 'string',
        description: 'Board ID (required when using urlName, optional with url)',
      },
      includeComments: {
        type: 'boolean',
        description: 'Include comments (default: false)',
      },
      commentLimit: {
        type: 'number',
        description: 'Maximum comments to include (default: 5)',
      },
      includeVotes: {
        type: 'boolean',
        description: 'Include vote count (default: false)',
      },
      fields: {
        type: 'array',
        items: { type: 'string' },
        description: 'Select specific fields to include',
      },
    },
    required: [],
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

    const result: any = { post: compactPost };

    // Optionally include comments
    if (includeComments) {
      const commentsResponse = await client.listComments({
        postID,
        limit: commentLimit,
      });

      result.comments = ResponseTransformer.compactComments(
        commentsResponse.comments.slice(0, commentLimit)
      );
    }

    // Optionally include votes
    if (includeVotes) {
      const votesResponse = await client.listVotes({
        postID,
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
