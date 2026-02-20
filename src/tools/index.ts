/**
 * Tool registry - exports all MCP tools
 */

import { MCPTool } from '../types/mcp.js';

// Discovery tools
import { listBoards } from './discovery/boards.js';
import { listTags, createTag } from './discovery/tags.js';
import { listStatusChanges } from './discovery/status-changes.js';
import { listCategories, createCategory } from './discovery/categories.js';

// Post tools
import { listPosts } from './posts/list.js';
import { filterPosts } from './posts/search.js';
import { getPost } from './posts/get.js';
import { createPost, updatePost, updatePostStatus, changeCategory, addPostTag, removePostTag } from './posts/crud.js';

// Engagement tools
import { listComments, createComment, deleteComment } from './engagement/comments.js';
import { listVotes, addVote, removeVote } from './engagement/votes.js';

// User tools
import { findOrCreateUser, getUserDetails } from './users/management.js';
import { listCompanies, linkCompany } from './users/companies.js';

// Jira tools
import { linkJiraIssue, unlinkJiraIssue } from './jira/link.js';

// Changelog tools
import { createChangelogEntry, listChangelogEntries } from './changelog/entries.js';

// Ideas ecosystem tools
import { listGroups, getGroup } from './ideas/groups.js';
import { listIdeas, getIdea } from './ideas/ideas.js';
import { listInsights, getInsight } from './ideas/insights.js';
import { listOpportunities } from './ideas/opportunities.js';

// Batch tools
import { batchUpdateStatus } from './batch/status.js';

export const ALL_TOOLS: MCPTool[] = [
  // Discovery & List (8 read-only + 2 write tools)
  listBoards,
  listTags,
  createTag,
  listCategories,
  listPosts,
  filterPosts,
  getPost,
  listStatusChanges,

  // Posts Management (7 write tools)
  createPost,
  updatePost,
  updatePostStatus,
  changeCategory,
  createCategory,
  addPostTag,
  removePostTag,

  // Engagement (6 tools: 2 read-only, 4 write)
  listComments,
  createComment,
  deleteComment,
  listVotes,
  addVote,
  removeVote,

  // Users (4 tools: 2 read-only, 2 write)
  findOrCreateUser,
  getUserDetails,
  listCompanies,
  linkCompany,

  // Jira Integration (2 write tools)
  linkJiraIssue,
  unlinkJiraIssue,

  // Changelog (2 tools: 1 read-only, 1 write)
  createChangelogEntry,
  listChangelogEntries,

  // Ideas ecosystem (7 tools: all read-only)
  listGroups,
  getGroup,
  listIdeas,
  getIdea,
  listInsights,
  getInsight,
  listOpportunities,

  // Batch Operations (1 write tool)
  batchUpdateStatus,
];

// Total: 37 tools (19 read-only, 18 write)

export function getToolByName(name: string): MCPTool | undefined {
  return ALL_TOOLS.find((tool) => tool.name === name);
}

export function getAllToolNames(): string[] {
  return ALL_TOOLS.map((tool) => tool.name);
}
