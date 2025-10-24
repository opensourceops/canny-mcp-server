/**
 * Jira integration tools
 */

import { MCPTool } from '../../types/mcp.js';
import { validateRequired } from '../../utils/validators.js';
import { resolvePostID } from '../../utils/url-parser.js';

export const linkJiraIssue: MCPTool = {
  name: 'canny_link_jira_issue',
  description: 'Link existing Jira issue to post. Accepts post ID or Canny URL.',
  readOnly: false,
  toolset: 'jira',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Post ID',
      },
      url: {
        type: 'string',
        description: 'Canny post URL (alternative to postID)',
      },
      boardID: {
        type: 'string',
        description: 'Board ID (optional, helps resolve URL)',
      },
      issueKey: {
        type: 'string',
        description: 'Jira issue key (e.g., "PROJ-123")',
      },
      changerID: {
        type: 'string',
        description: 'ID of admin linking the issue (required if status sync is enabled)',
      },
    },
    required: ['issueKey'],
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
  description: 'Remove Jira issue link from post. Accepts post ID or Canny URL.',
  readOnly: false,
  toolset: 'jira',
  inputSchema: {
    type: 'object',
    properties: {
      postID: {
        type: 'string',
        description: 'Post ID',
      },
      url: {
        type: 'string',
        description: 'Canny post URL (alternative to postID)',
      },
      boardID: {
        type: 'string',
        description: 'Board ID (optional, helps resolve URL)',
      },
      issueKey: {
        type: 'string',
        description: 'Jira issue key',
      },
    },
    required: ['issueKey'],
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
