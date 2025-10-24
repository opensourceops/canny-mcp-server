/**
 * Resource registry - exports all MCP resources
 */

import { MCPResource } from '../types/mcp.js';
import { boardSummary } from './boards.js';
import { statusOverview } from './status.js';
import { jiraLinkStatus } from './jira.js';

export const ALL_RESOURCES: MCPResource[] = [
  boardSummary,
  statusOverview,
  jiraLinkStatus,
];

export function getResourceByUri(uri: string): MCPResource | undefined {
  return ALL_RESOURCES.find((resource) => resource.uri === uri);
}

export function getAllResourceUris(): string[] {
  return ALL_RESOURCES.map((resource) => resource.uri);
}
