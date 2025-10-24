/**
 * Configuration Type Definitions
 */

export interface PromptArgument {
  name: string;
  description?: string;
  required: boolean;
}

export interface PromptConfig {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  template: string;
}

export interface CannyMCPConfig {
  canny: CannyConfig;
  server: ServerConfig;
  logging: LoggingConfig;
  prompts?: PromptConfig[]; // Optional custom prompts
}

export interface CannyConfig {
  apiKey: string;
  baseUrl: string;
  workspace: WorkspaceConfig;
  prioritization: PrioritizationConfig;
  jira: JiraConfig;
  defaults: DefaultsConfig;
  cache: CacheConfig;
  rateLimit: RateLimitConfig;
}

export interface WorkspaceConfig {
  name: string;
  defaultBoardId?: string;
  customStatuses: string[];
  customFields: Record<string, CustomFieldDefinition>;
  boards: Record<string, string>;
  tags: Record<string, string>;
}

export interface CustomFieldDefinition {
  type: 'string' | 'number' | 'boolean';
  values?: string[];
  required?: boolean;
  description?: string;
}

export interface PrioritizationConfig {
  framework: 'RICE' | 'ICE' | 'CUSTOM';
  weights: {
    votes: number;
    revenue: number;
    strategicFit: number;
  };
  riceConfig?: {
    reachMultiplier: number;
    impactScale: number;
    confidenceScale: number;
  };
  highRevenueThreshold: number;
  quickWinThreshold?: {
    votes: number;
    effort: string;
  };
}

export interface JiraConfig {
  enabled: boolean;
  projectKey?: string;
  issueTypes?: Record<string, string>;
  fieldMappings?: Record<string, string>;
  statusSync?: {
    enabled: boolean;
    mappings: Record<string, string>;
  };
}

export interface DefaultsConfig {
  pagination: {
    limit: number;
    maxTotal: number;
  };
  compactMode: boolean;
  defaultFields: string[];
  includeComments: boolean;
  commentLimit: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: {
    boards: number;
    tags: number;
    users: number;
    posts: number;
    comments: number;
  };
  maxSize: number;
}

export interface RateLimitConfig {
  requests: number;
  window: number;
  retryAfter: number;
  maxRetries: number;
}

// Toolset categories
export type ToolsetName =
  | 'discovery'      // Discovery & List tools
  | 'posts'          // Posts Management tools
  | 'engagement'     // Engagement tools
  | 'users'          // Users & Companies tools
  | 'jira'           // Jira Integration tools
  | 'batch';         // Batch Operations tools

export type ToolMode =
  | 'all'            // All tools enabled
  | 'readonly'       // Only read-only tools (default)
  | string           // Comma-separated toolsets: "discovery,posts,engagement"
  | boolean;         // Backward compatibility: true = readonly, false = all

export interface ServerConfig {
  transport: 'stdio' | 'http' | 'both';
  readOnlyMode?: boolean; // Deprecated: Use toolMode instead
  toolMode?: ToolMode; // Default: 'readonly'. Options: 'all', 'readonly', or comma-separated toolsets
  http?: {
    port: number;
    host: string;
    cors?: {
      enabled: boolean;
      origins: string[];
    };
  };
  stdio?: {
    command: string;
    args: string[];
  };
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'pretty';
  file?: string;
  console: boolean;
}
