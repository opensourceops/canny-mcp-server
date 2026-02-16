/**
 * E2E tests for readonly tools via the MCP protocol
 *
 * Uses InMemoryTransport + Client from the SDK to exercise the full server
 * with CANNY_TOOL_MODE=readonly against the live Canny API.
 *
 * Skipped when CANNY_API_KEY is not set.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CannyMCPServer } from '../../src/server';
import { ConfigLoader } from '../../src/config/loader';

const HAS_API_KEY = !!process.env.CANNY_API_KEY;

const READONLY_TOOL_NAMES = [
  'canny_get_post',
  'canny_get_user_details',
  'canny_list_boards',
  'canny_list_categories',
  'canny_list_comments',
  'canny_list_companies',
  'canny_list_posts',
  'canny_list_tags',
  'canny_list_votes',
].sort();

const WRITE_TOOL_NAMES = [
  'canny_add_vote',
  'canny_batch_update_status',
  'canny_change_category',
  'canny_create_category',
  'canny_create_comment',
  'canny_create_post',
  'canny_delete_comment',
  'canny_find_or_create_user',
  'canny_link_company',
  'canny_link_jira_issue',
  'canny_remove_vote',
  'canny_unlink_jira_issue',
  'canny_update_post',
  'canny_update_post_status',
].sort();

// Helper to call a tool and parse the JSON result
async function callToolAndParse(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as Array<{ type: string; text: string }>;
  expect(content).toHaveLength(1);
  expect(content[0].type).toBe('text');
  const parsed = JSON.parse(content[0].text);
  if (result.isError) {
    throw new Error(`Tool ${name} returned error: ${JSON.stringify(parsed)}`);
  }
  return parsed;
}

const describeE2E = HAS_API_KEY ? describe : describe.skip;

describeE2E('E2E: Readonly Tools via MCP Protocol', () => {
  let client: Client;
  let server: CannyMCPServer;
  let savedToolMode: string | undefined;

  beforeAll(async () => {
    // Save and set env
    savedToolMode = process.env.CANNY_TOOL_MODE;
    process.env.CANNY_TOOL_MODE = 'readonly';

    const config = ConfigLoader.buildFromEnv();
    server = new CannyMCPServer(config);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: 'test-client', version: '1.0.0' });

    await server.connectTransport(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await server.stop();

    // Restore env
    if (savedToolMode !== undefined) {
      process.env.CANNY_TOOL_MODE = savedToolMode;
    } else {
      delete process.env.CANNY_TOOL_MODE;
    }
  });

  // ──────────────────────────────────────────────────────
  // Section 1: tools/list verification
  // ──────────────────────────────────────────────────────

  describe('tools/list verification', () => {
    let tools: Awaited<ReturnType<typeof client.listTools>>['tools'];

    beforeAll(async () => {
      const result = await client.listTools();
      tools = result.tools;
    });

    test('returns exactly 9 tools', () => {
      expect(tools).toHaveLength(9);
    });

    test('contains all expected readonly tool names', () => {
      const names = tools.map((t) => t.name).sort();
      expect(names).toEqual(READONLY_TOOL_NAMES);
    });

    test('does NOT contain any write tool names', () => {
      const names = new Set(tools.map((t) => t.name));
      for (const writeName of WRITE_TOOL_NAMES) {
        expect(names.has(writeName)).toBe(false);
      }
    });

    test('each tool has readOnlyHint: true in annotations', () => {
      for (const tool of tools) {
        expect(tool.annotations).toBeDefined();
        expect(tool.annotations!.readOnlyHint).toBe(true);
      }
    });

    test('each tool has a non-empty description', () => {
      for (const tool of tools) {
        expect(tool.description).toBeDefined();
        expect(tool.description!.length).toBeGreaterThan(0);
      }
    });

    test('each tool inputSchema has type "object"', () => {
      for (const tool of tools) {
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  // ──────────────────────────────────────────────────────
  // Section 2: Call each readonly tool
  // ──────────────────────────────────────────────────────

  // Shared state discovered across tests
  let discoveredBoardID: string;
  let discoveredPostID: string;

  describe('canny_list_boards', () => {
    test('returns non-empty boards array', async () => {
      const result = await callToolAndParse(client, 'canny_list_boards');
      expect(Array.isArray(result.boards)).toBe(true);
      expect(result.boards.length).toBeGreaterThan(0);

      const board = result.boards[0];
      expect(board).toHaveProperty('id');
      expect(board).toHaveProperty('name');
      expect(board).toHaveProperty('postCount');
      expect(board).toHaveProperty('url');

      discoveredBoardID = board.id;
    }, 30000);
  });

  describe('canny_list_tags', () => {
    test('returns tags and hasMore', async () => {
      const result = await callToolAndParse(client, 'canny_list_tags');
      expect(Array.isArray(result.tags)).toBe(true);
      expect(typeof result.hasMore).toBe('boolean');
    }, 30000);

    test('filters by boardID', async () => {
      const result = await callToolAndParse(client, 'canny_list_tags', {
        boardID: discoveredBoardID,
      });
      expect(Array.isArray(result.tags)).toBe(true);
    }, 30000);

    test('supports limit and skip pagination', async () => {
      const result = await callToolAndParse(client, 'canny_list_tags', {
        limit: 2,
        skip: 0,
      });
      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags.length).toBeLessThanOrEqual(2);
    }, 30000);
  });

  describe('canny_list_categories', () => {
    test('returns categories with boardID filter', async () => {
      const result = await callToolAndParse(client, 'canny_list_categories', {
        boardID: discoveredBoardID,
      });
      expect(Array.isArray(result.categories)).toBe(true);
      expect(typeof result.hasMore).toBe('boolean');
    }, 30000);

    test('returns categories across all boards when no boardID', async () => {
      const result = await callToolAndParse(client, 'canny_list_categories');
      expect(Array.isArray(result.categories)).toBe(true);
      // Aggregation path: entries include boardID and boardName
      if (result.categories.length > 0) {
        expect(result.categories[0]).toHaveProperty('boardID');
        expect(result.categories[0]).toHaveProperty('boardName');
      }
    }, 30000);
  });

  describe('canny_list_posts', () => {
    test('returns posts with limit', async () => {
      const result = await callToolAndParse(client, 'canny_list_posts', {
        limit: 3,
      });
      expect(Array.isArray(result.posts)).toBe(true);
      expect(result.posts.length).toBeGreaterThan(0);
      expect(result.posts.length).toBeLessThanOrEqual(3);

      discoveredPostID = result.posts[0].id;
    }, 30000);

    test('filters by boardID', async () => {
      const result = await callToolAndParse(client, 'canny_list_posts', {
        boardID: discoveredBoardID,
        limit: 3,
      });
      expect(Array.isArray(result.posts)).toBe(true);
    }, 30000);

    test('supports search with sort=relevance', async () => {
      const result = await callToolAndParse(client, 'canny_list_posts', {
        search: 'test',
        sort: 'relevance',
        limit: 3,
      });
      expect(Array.isArray(result.posts)).toBe(true);
    }, 30000);

    test('filters by status=open', async () => {
      const result = await callToolAndParse(client, 'canny_list_posts', {
        status: 'open',
        limit: 3,
      });
      expect(Array.isArray(result.posts)).toBe(true);
    }, 30000);

    test('skip pagination returns different pages', async () => {
      const page1 = await callToolAndParse(client, 'canny_list_posts', {
        skip: 0,
        limit: 2,
      });
      expect(Array.isArray(page1.posts)).toBe(true);

      if (page1.hasMore) {
        const page2 = await callToolAndParse(client, 'canny_list_posts', {
          skip: 2,
          limit: 2,
        });
        expect(Array.isArray(page2.posts)).toBe(true);

        // Pages should have different post IDs
        const page1Ids = new Set(page1.posts.map((p: { id: string }) => p.id));
        for (const post of page2.posts) {
          expect(page1Ids.has(post.id)).toBe(false);
        }
      }
    }, 30000);
  });

  describe('canny_get_post', () => {
    test('retrieves post by postID', async () => {
      const result = await callToolAndParse(client, 'canny_get_post', {
        postID: discoveredPostID,
      });
      expect(result.post).toBeDefined();
      expect(result.post.id).toBe(discoveredPostID);
    }, 30000);

    test('retrieves post with includeComments', async () => {
      const result = await callToolAndParse(client, 'canny_get_post', {
        postID: discoveredPostID,
        includeComments: true,
      });
      expect(result.post).toBeDefined();
      // Comments may or may not exist, but the field should be present
      expect(result).toHaveProperty('comments');
    }, 30000);

    test('retrieves post with includeVotes', async () => {
      const result = await callToolAndParse(client, 'canny_get_post', {
        postID: discoveredPostID,
        includeVotes: true,
      });
      expect(result.post).toBeDefined();
      expect(result).toHaveProperty('votes');
    }, 30000);

    test('returns error when no identifier provided', async () => {
      const rawResult = await client.callTool({ name: 'canny_get_post', arguments: {} });
      expect(rawResult.isError).toBe(true);
    }, 30000);
  });

  describe('canny_list_comments', () => {
    test('lists comments by postID', async () => {
      const result = await callToolAndParse(client, 'canny_list_comments', {
        postID: discoveredPostID,
      });
      expect(Array.isArray(result.comments)).toBe(true);
      expect(typeof result.hasMore).toBe('boolean');
    }, 30000);

    test('lists comments by boardID', async () => {
      const result = await callToolAndParse(client, 'canny_list_comments', {
        boardID: discoveredBoardID,
      });
      expect(Array.isArray(result.comments)).toBe(true);
    }, 30000);

    test('supports skip-based pagination', async () => {
      const page1 = await callToolAndParse(client, 'canny_list_comments', {
        boardID: discoveredBoardID,
        limit: 2,
        skip: 0,
      });
      expect(Array.isArray(page1.comments)).toBe(true);

      if (page1.hasMore) {
        const page2 = await callToolAndParse(client, 'canny_list_comments', {
          boardID: discoveredBoardID,
          limit: 2,
          skip: 2,
        });
        expect(Array.isArray(page2.comments)).toBe(true);
      }
    }, 30000);
  });

  describe('canny_list_votes', () => {
    test('lists votes by postID', async () => {
      const result = await callToolAndParse(client, 'canny_list_votes', {
        postID: discoveredPostID,
      });
      expect(Array.isArray(result.votes)).toBe(true);
      expect(typeof result.hasMore).toBe('boolean');
    }, 30000);

    test('lists votes by boardID', async () => {
      const result = await callToolAndParse(client, 'canny_list_votes', {
        boardID: discoveredBoardID,
      });
      expect(Array.isArray(result.votes)).toBe(true);
    }, 30000);

    test('supports skip-based pagination', async () => {
      const page1 = await callToolAndParse(client, 'canny_list_votes', {
        boardID: discoveredBoardID,
        skip: 0,
        limit: 2,
      });
      expect(Array.isArray(page1.votes)).toBe(true);

      if (page1.hasMore) {
        const page2 = await callToolAndParse(client, 'canny_list_votes', {
          boardID: discoveredBoardID,
          skip: 2,
          limit: 2,
        });
        expect(Array.isArray(page2.votes)).toBe(true);
      }
    }, 30000);
  });

  describe('canny_get_user_details', () => {
    test('retrieves user by email from post data', async () => {
      // Get a post in non-compact mode to discover an author email
      const postsResult = await callToolAndParse(client, 'canny_list_posts', {
        limit: 1,
        compact: false,
      });

      const post = postsResult.posts[0];
      const email = post?.author?.email;

      if (email) {
        const result = await callToolAndParse(client, 'canny_get_user_details', {
          email,
        });
        expect(result.user).toBeDefined();
        expect(result.user.email).toBe(email);
      } else {
        // If no email is available from post data, skip gracefully
        console.warn('No author email found in post data; skipping email lookup test');
      }
    }, 30000);

    test('returns error when no identifier provided', async () => {
      const rawResult = await client.callTool({
        name: 'canny_get_user_details',
        arguments: {},
      });
      expect(rawResult.isError).toBe(true);
    }, 30000);
  });

  describe('canny_list_companies', () => {
    test('returns companies with default params', async () => {
      const result = await callToolAndParse(client, 'canny_list_companies');
      expect(Array.isArray(result.companies)).toBe(true);
      expect(typeof result.hasMore).toBe('boolean');
    }, 30000);

    test('supports limit and skip', async () => {
      const result = await callToolAndParse(client, 'canny_list_companies', {
        limit: 2,
        skip: 0,
      });
      expect(Array.isArray(result.companies)).toBe(true);
      expect(result.companies.length).toBeLessThanOrEqual(2);
    }, 30000);
  });

  // ──────────────────────────────────────────────────────
  // Section 3: Chained workflow
  // ──────────────────────────────────────────────────────

  describe('chained workflow', () => {
    test(
      'boards -> posts -> post details -> comments -> votes -> tags -> categories',
      async () => {
        // 1. List boards
        const boardsResult = await callToolAndParse(client, 'canny_list_boards');
        expect(boardsResult.boards.length).toBeGreaterThan(0);
        const boardID = boardsResult.boards[0].id;

        // 2. List posts on that board
        const postsResult = await callToolAndParse(client, 'canny_list_posts', {
          boardID,
          limit: 3,
        });
        expect(postsResult.posts.length).toBeGreaterThan(0);
        const postID = postsResult.posts[0].id;

        // 3. Get post details with comments and votes
        const postDetail = await callToolAndParse(client, 'canny_get_post', {
          postID,
          includeComments: true,
          includeVotes: true,
        });
        expect(postDetail.post).toBeDefined();
        expect(postDetail.post.id).toBe(postID);

        // 4. List comments for the post
        const commentsResult = await callToolAndParse(client, 'canny_list_comments', {
          postID,
        });
        expect(Array.isArray(commentsResult.comments)).toBe(true);

        // 5. List votes for the post
        const votesResult = await callToolAndParse(client, 'canny_list_votes', {
          postID,
        });
        expect(Array.isArray(votesResult.votes)).toBe(true);

        // 6. List tags for the board
        const tagsResult = await callToolAndParse(client, 'canny_list_tags', {
          boardID,
        });
        expect(Array.isArray(tagsResult.tags)).toBe(true);

        // 7. List categories for the board
        const categoriesResult = await callToolAndParse(client, 'canny_list_categories', {
          boardID,
        });
        expect(Array.isArray(categoriesResult.categories)).toBe(true);
      },
      60000
    );
  });

  // ──────────────────────────────────────────────────────
  // Section 4: Negative test — write tool not registered
  // ──────────────────────────────────────────────────────

  describe('write tools are not registered', () => {
    test('calling canny_create_post rejects', async () => {
      await expect(
        client.callTool({
          name: 'canny_create_post',
          arguments: {
            title: 'Should fail',
            details: 'This tool is not registered',
            boardID: 'fake',
          },
        })
      ).rejects.toThrow();
    }, 30000);
  });
});
