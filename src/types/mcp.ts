/**
 * MCP-specific Type Definitions
 */

import type { z } from 'zod';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { CannyMCPConfig, ToolsetName } from './config.js';
import { CannyClient } from '../api/client.js';
import { Cache } from '../utils/cache.js';

export interface ToolContext {
  config: CannyMCPConfig;
  client: CannyClient;
  cache: Cache;
  logger: Logger;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ToolHandler<TInput = Record<string, any>, TOutput = unknown> {
  (params: TInput, context: ToolContext): Promise<TOutput>;
}

export interface MCPTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
  handler: ToolHandler;
  readOnly: boolean;
  toolset: ToolsetName;
  annotations: ToolAnnotations;
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
  template: string | ((args: Record<string, string>) => string);
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface PaginationOptions {
  limit?: number;
  maxTotal?: number;
}

export type PaginationStrategy = 'cursor' | 'skip' | 'none';
