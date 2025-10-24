/**
 * MCP-specific Type Definitions
 */

import { CannyMCPConfig, ToolsetName } from './config.js';
import { CannyClient } from '../api/client.js';
import { Cache } from '../utils/cache.js';

export interface ToolContext {
  config: CannyMCPConfig;
  client: CannyClient;
  cache: Cache;
  logger: Logger;
}

export interface ToolHandler<TInput = any, TOutput = any> {
  (params: TInput, context: ToolContext): Promise<TOutput>;
}

export interface MCPTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: ToolHandler<TInput, TOutput>;
  readOnly: boolean; // true = read-only (safe), false = writes/modifies data
  toolset: ToolsetName; // Which toolset category this tool belongs to
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  subscribable?: boolean;
  handler: (context: ToolContext) => Promise<{ text: string; mimeType: string }>;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  template: string | ((args: Record<string, any>) => string);
}

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface PaginationOptions {
  limit?: number;
  maxTotal?: number;
}

export type PaginationStrategy = 'cursor' | 'skip' | 'none';
