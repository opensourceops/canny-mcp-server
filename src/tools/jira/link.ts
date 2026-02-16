/**
 * Jira integration tools
 */

import { z } from 'zod';
import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';
import { resolvePostID } from '../../utils/url-parser.js';

export const linkJiraIssue: MCPTool = {
  name: 'canny_link_jira_issue',
  title: 'Link Jira Issue',
  description: `Link an existing Jira issue to a Canny post.

Creates a connection between a Jira issue and a Canny post. If Jira status sync is enabled, the post status is automatically set to "in progress" and a comment is added.

Args:
  - issueKey (string, required): Jira issue key (e.g., "PROJ-123")
  - postID (string): Canny post ID
  - url (string): Canny post URL (alternative to postID)
  - boardID (string): Board ID to help resolve URL
  - changerID (string): Admin user ID (required if status sync is enabled)
  Note: Provide either postID or url to identify the post.

Returns:
  JSON with success boolean.

Examples:
  - "Link PROJ-123 to post" -> issueKey: "PROJ-123", postID: "6..."
  - "Link issue to post by URL" -> issueKey: "PROJ-456", url: "https://your-co.canny.io/..."`,
  readOnly: false,
  toolset: 'jira',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    issueKey: z.string().describe('Jira issue key (e.g., "PROJ-123")'),
    postID: z.string().optional().describe('Post ID'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
    changerID: z.string().optional().describe('ID of admin linking the issue (required if status sync is enabled)'),
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, issueKey, changerID } = params;

    // Resolve post ID from URL if needed
    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(issueKey, 'issueKey');

    // Validate issue key format if pattern configured
    if (config.canny.jira.enabled && config.canny.jira.projectKey) {
      const pattern = new RegExp(`^${config.canny.jira.projectKey}-\\d+$`);
      if (!pattern.test(issueKey)) {
        throw new Error(
          `Invalid Jira issue key format. Expected: ${config.canny.jira.projectKey}-XXX`
        );
      }
    }

    logger.info('Linking Jira issue to post', { postID, issueKey });

    await client.linkJiraIssue(postID, issueKey);

    // Optionally update post status if sync enabled
    if (config.canny.jira.statusSync?.enabled) {
      if (!changerID) {
        throw new Error('changerID is required when status sync is enabled');
      }

      const newStatus = 'in progress'; // Default status on link
      logger.debug('Updating post status due to Jira link', { newStatus });

      await client.changePostStatus({
        postID,
        changerID,
        status: newStatus,
        commentValue: `Linked to Jira issue ${issueKey}`,
        shouldNotifyVoters: false,
      });
    }

    logger.info('Jira issue linked successfully');

    return { success: true };
  },
};

export const unlinkJiraIssue: MCPTool = {
  name: 'canny_unlink_jira_issue',
  title: 'Unlink Jira Issue',
  description: `Remove a Jira issue link from a Canny post.

Disconnects a previously linked Jira issue from a Canny post. This is a destructive operation that cannot be undone without re-linking.

Args:
  - issueKey (string, required): Jira issue key to unlink
  - postID (string): Canny post ID
  - url (string): Canny post URL (alternative to postID)
  - boardID (string): Board ID to help resolve URL
  Note: Provide either postID or url to identify the post.

Returns:
  JSON with success boolean.

Examples:
  - "Unlink PROJ-123 from post" -> issueKey: "PROJ-123", postID: "6..."
  - "Remove Jira link by URL" -> issueKey: "PROJ-456", url: "https://your-co.canny.io/..."`,
  readOnly: false,
  toolset: 'jira',
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  inputSchema: {
    issueKey: z.string().describe('Jira issue key'),
    postID: z.string().optional().describe('Post ID'),
    url: z.string().optional().describe('Canny post URL (alternative to postID)'),
    boardID: z.string().optional().describe('Board ID (optional, helps resolve URL)'),
  },
  handler: async (params, { client, config, logger }) => {
    const { postID: providedPostID, url, boardID, issueKey } = params;

    // Resolve post ID from URL if needed
    const postID = await resolvePostID({ postID: providedPostID, url, boardID, config, client, logger });

    validateRequired(issueKey, 'issueKey');

    logger.info('Unlinking Jira issue from post', { postID, issueKey });

    await client.unlinkJiraIssue(postID, issueKey);

    logger.info('Jira issue unlinked successfully');

    return { success: true };
  },
};
