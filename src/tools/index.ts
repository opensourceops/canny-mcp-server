/**
 * Tool registry - exports all MCP tools
 */

import { MCPTool } from '../types/mcp.js';

// Discovery tools
import { listBoards } from './discovery/boards.js';
import { listTags } from './discovery/tags.js';
import { listCategories, createCategory } from './discovery/categories.js';

// Post tools
import { listPosts } from './posts/list.js';
import { getPost } from './posts/get.js';
import { createPost, updatePost, updatePostStatus, changeCategory } from './posts/crud.js';

// Engagement tools
import { listComments, createComment, deleteComment } from './engagement/comments.js';
import { listVotes, addVote, removeVote } from './engagement/votes.js';

// User tools
import { findOrCreateUser, getUserDetails } from './users/management.js';
import { listCompanies, linkCompany } from './users/companies.js';

// Jira tools
import { linkJiraIssue, unlinkJiraIssue } from './jira/link.js';

// Batch tools
import { batchUpdateStatus } from './batch/status.js';
import { batchTag, batchMerge } from './batch/tags.js';

export const ALL_TOOLS: MCPTool[] = [
  // Discovery & List (5 read-only tools)
  listBoards,
  listTags,
  listCategories,
  listPosts,
  getPost,

  // Posts Management (5 write tools)
  createPost,
  updatePost,
  updatePostStatus,
  changeCategory,
  createCategory,

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

  // Batch Operations (3 write tools)
  batchUpdateStatus,
  batchTag,
  batchMerge,
];

// Total: 25 tools (9 read-only, 16 write)

export function getToolByName(name: string): MCPTool | undefined {
  return ALL_TOOLS.find((tool) => tool.name === name);
}

export function getAllToolNames(): string[] {
  return ALL_TOOLS.map((tool) => tool.name);
}
