/**
 * Configuration loader with environment variable expansion
 */

import * as fs from 'fs';
import * as path from 'path';
import { CannyMCPConfig } from '../types/config.js';

/**
 * Extract subdomain from a Canny base URL (e.g., "https://foo.canny.io/api/v1" -> "foo").
 */
export function extractSubdomain(baseUrl: string): string | undefined {
  const match = baseUrl.match(/^https?:\/\/([^.]+)\.canny\.io/);
  return match ? match[1] : undefined;
}

export class ConfigLoader {
  /**
   * Load configuration with environment variable expansion.
   *
   * Resolution order:
   * 1. If configPath is provided and file doesn't exist -> throw
   * 2. If configPath is provided and file exists -> load file, apply env overrides
   * 3. If no configPath and default config/default.json exists -> load file, apply env overrides
   * 4. If no configPath and no default file -> build entirely from env vars
   */
  static load(configPath?: string): CannyMCPConfig {
    const defaultPath = path.join(process.cwd(), 'config', 'default.json');
    const finalPath = configPath || defaultPath;

    if (configPath && !fs.existsSync(finalPath)) {
      throw new Error(`Configuration file not found: ${finalPath}`);
    }

    if (fs.existsSync(finalPath)) {
      const rawConfig = fs.readFileSync(finalPath, 'utf-8');
      const expandedConfig = this.expandEnvVars(rawConfig);
      const config = JSON.parse(expandedConfig) as CannyMCPConfig;
      this.applyEnvOverrides(config);
      this.validate(config);
      return config;
    }

    // No config file found — build from environment variables
    const config = this.buildFromEnv();
    this.validate(config);
    return config;
  }

  /**
   * Build a complete configuration from environment variables,
   * falling back to getDefault() values.
   */
  static buildFromEnv(): CannyMCPConfig {
    const config = this.getDefault();

    const apiKey = process.env.CANNY_API_KEY;
    if (!apiKey) {
      throw new Error(
        'CANNY_API_KEY environment variable is required when no config file is present'
      );
    }
    config.canny.apiKey = apiKey;

    if (process.env.CANNY_BASE_URL !== undefined) {
      config.canny.baseUrl = process.env.CANNY_BASE_URL;
    }
    // Resolve subdomain: CANNY_SUBDOMAIN env > auto-detect from base URL
    if (process.env.CANNY_SUBDOMAIN !== undefined) {
      config.canny.subdomain = process.env.CANNY_SUBDOMAIN;
    } else {
      config.canny.subdomain = extractSubdomain(config.canny.baseUrl);
    }
    if (process.env.CANNY_DEFAULT_BOARD !== undefined) {
      config.canny.workspace.defaultBoardId = process.env.CANNY_DEFAULT_BOARD;
    }
    if (process.env.CANNY_WORKSPACE_NAME !== undefined) {
      config.canny.workspace.name = process.env.CANNY_WORKSPACE_NAME;
    }
    if (process.env.CANNY_CUSTOM_STATUSES !== undefined) {
      config.canny.workspace.customStatuses = process.env.CANNY_CUSTOM_STATUSES
        .split(',')
        .map((s) => s.trim());
    }
    if (process.env.CANNY_JIRA_ENABLED !== undefined) {
      config.canny.jira.enabled = process.env.CANNY_JIRA_ENABLED === 'true';
    }
    if (process.env.CANNY_JIRA_PROJECT_KEY !== undefined) {
      config.canny.jira.projectKey = process.env.CANNY_JIRA_PROJECT_KEY;
    }
    if (process.env.CANNY_PAGINATION_LIMIT !== undefined) {
      config.canny.defaults.pagination.limit = this.parseIntEnv('CANNY_PAGINATION_LIMIT', 10);
    }
    if (process.env.CANNY_PAGINATION_MAX !== undefined) {
      config.canny.defaults.pagination.maxTotal = this.parseIntEnv('CANNY_PAGINATION_MAX', 50);
    }
    if (process.env.CANNY_COMPACT_MODE !== undefined) {
      config.canny.defaults.compactMode = process.env.CANNY_COMPACT_MODE === 'true';
    }
    if (process.env.CANNY_CACHE_ENABLED !== undefined) {
      config.canny.cache.enabled = process.env.CANNY_CACHE_ENABLED === 'true';
    }
    if (process.env.CANNY_CACHE_MAX_SIZE !== undefined) {
      config.canny.cache.maxSize = this.parseIntEnv('CANNY_CACHE_MAX_SIZE', 100);
    }
    if (process.env.CANNY_RATE_LIMIT_REQUESTS !== undefined) {
      config.canny.rateLimit.requests = this.parseIntEnv('CANNY_RATE_LIMIT_REQUESTS', 100);
    }
    if (process.env.CANNY_RATE_LIMIT_WINDOW !== undefined) {
      config.canny.rateLimit.window = this.parseIntEnv('CANNY_RATE_LIMIT_WINDOW', 60000);
    }
    if (process.env.SERVER_TRANSPORT !== undefined) {
      config.server.transport = process.env.SERVER_TRANSPORT as 'stdio' | 'http' | 'both';
    }
    if (process.env.CANNY_TOOL_MODE !== undefined) {
      config.server.toolMode = process.env.CANNY_TOOL_MODE;
    }
    if (process.env.SERVER_HTTP_PORT !== undefined || process.env.SERVER_HTTP_HOST !== undefined) {
      if (!config.server.http) {
        config.server.http = { port: 3000, host: '0.0.0.0' };
      }
      if (process.env.SERVER_HTTP_PORT !== undefined) {
        config.server.http.port = this.parseIntEnv('SERVER_HTTP_PORT', 3000);
      }
      if (process.env.SERVER_HTTP_HOST !== undefined) {
        config.server.http.host = process.env.SERVER_HTTP_HOST;
      }
    }
    if (process.env.LOG_LEVEL !== undefined) {
      config.logging.level = process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
    }
    if (process.env.LOG_FORMAT !== undefined) {
      config.logging.format = process.env.LOG_FORMAT as 'json' | 'pretty';
    }

    return config;
  }

  /**
   * Apply environment variable overrides on top of a file-loaded config.
   */
  static applyEnvOverrides(config: CannyMCPConfig): void {
    if (process.env.CANNY_API_KEY !== undefined) {
      config.canny.apiKey = process.env.CANNY_API_KEY;
    }
    if (process.env.CANNY_BASE_URL !== undefined) {
      config.canny.baseUrl = process.env.CANNY_BASE_URL;
    }
    // Resolve subdomain: CANNY_SUBDOMAIN env > auto-detect from base URL
    if (process.env.CANNY_SUBDOMAIN !== undefined) {
      config.canny.subdomain = process.env.CANNY_SUBDOMAIN;
    } else if (!config.canny.subdomain) {
      config.canny.subdomain = extractSubdomain(config.canny.baseUrl);
    }
    if (process.env.CANNY_DEFAULT_BOARD !== undefined) {
      config.canny.workspace.defaultBoardId = process.env.CANNY_DEFAULT_BOARD;
    }
    if (process.env.CANNY_WORKSPACE_NAME !== undefined) {
      config.canny.workspace.name = process.env.CANNY_WORKSPACE_NAME;
    }
    if (process.env.CANNY_CUSTOM_STATUSES !== undefined) {
      config.canny.workspace.customStatuses = process.env.CANNY_CUSTOM_STATUSES
        .split(',')
        .map((s) => s.trim());
    }
    if (process.env.CANNY_JIRA_ENABLED !== undefined) {
      config.canny.jira.enabled = process.env.CANNY_JIRA_ENABLED === 'true';
    }
    if (process.env.CANNY_JIRA_PROJECT_KEY !== undefined) {
      config.canny.jira.projectKey = process.env.CANNY_JIRA_PROJECT_KEY;
    }
    if (process.env.CANNY_PAGINATION_LIMIT !== undefined) {
      config.canny.defaults.pagination.limit = this.parseIntEnv('CANNY_PAGINATION_LIMIT', config.canny.defaults.pagination.limit);
    }
    if (process.env.CANNY_PAGINATION_MAX !== undefined) {
      config.canny.defaults.pagination.maxTotal = this.parseIntEnv('CANNY_PAGINATION_MAX', config.canny.defaults.pagination.maxTotal);
    }
    if (process.env.CANNY_COMPACT_MODE !== undefined) {
      config.canny.defaults.compactMode = process.env.CANNY_COMPACT_MODE === 'true';
    }
    if (process.env.CANNY_CACHE_ENABLED !== undefined) {
      config.canny.cache.enabled = process.env.CANNY_CACHE_ENABLED === 'true';
    }
    if (process.env.CANNY_CACHE_MAX_SIZE !== undefined) {
      config.canny.cache.maxSize = this.parseIntEnv('CANNY_CACHE_MAX_SIZE', config.canny.cache.maxSize);
    }
    if (process.env.CANNY_RATE_LIMIT_REQUESTS !== undefined) {
      config.canny.rateLimit.requests = this.parseIntEnv('CANNY_RATE_LIMIT_REQUESTS', config.canny.rateLimit.requests);
    }
    if (process.env.CANNY_RATE_LIMIT_WINDOW !== undefined) {
      config.canny.rateLimit.window = this.parseIntEnv('CANNY_RATE_LIMIT_WINDOW', config.canny.rateLimit.window);
    }
    if (process.env.SERVER_TRANSPORT !== undefined) {
      config.server.transport = process.env.SERVER_TRANSPORT as 'stdio' | 'http' | 'both';
    }
    if (process.env.CANNY_TOOL_MODE !== undefined) {
      config.server.toolMode = process.env.CANNY_TOOL_MODE;
    }
    if (process.env.SERVER_HTTP_PORT !== undefined) {
      if (!config.server.http) {
        config.server.http = { port: 3000, host: '0.0.0.0' };
      }
      config.server.http.port = this.parseIntEnv('SERVER_HTTP_PORT', config.server.http.port);
    }
    if (process.env.SERVER_HTTP_HOST !== undefined) {
      if (!config.server.http) {
        config.server.http = { port: 3000, host: '0.0.0.0' };
      }
      config.server.http.host = process.env.SERVER_HTTP_HOST;
    }
    if (process.env.LOG_LEVEL !== undefined) {
      config.logging.level = process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error';
    }
    if (process.env.LOG_FORMAT !== undefined) {
      config.logging.format = process.env.LOG_FORMAT as 'json' | 'pretty';
    }
  }

  /**
   * Expand environment variables in config
   * ${VAR_NAME} -> process.env.VAR_NAME
   * ${VAR_NAME:default} -> process.env.VAR_NAME || 'default'
   */
  private static expandEnvVars(config: string): string {
    return config.replace(/\$\{([^}]+)\}/g, (_, expression) => {
      // Check if there's a default value specified with :
      const parts = expression.split(':');
      const varName = parts[0];
      const defaultValue = parts.slice(1).join(':'); // Allow : in default value

      const value = process.env[varName];

      if (value !== undefined) {
        return value;
      }

      if (defaultValue !== undefined && defaultValue !== '') {
        return defaultValue;
      }

      throw new Error(`Environment variable not set: ${varName}`);
    });
  }

  /**
   * Parse an integer from an environment variable with a fallback default.
   */
  private static parseIntEnv(name: string, defaultValue: number): number {
    const raw = process.env[name];
    if (raw === undefined) return defaultValue;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Validate configuration
   */
  private static validate(config: CannyMCPConfig): void {
    if (!config.canny?.apiKey) {
      throw new Error('Canny API key is required (CANNY_API_KEY)');
    }

    if (config.canny.apiKey === '${CANNY_API_KEY}') {
      throw new Error('CANNY_API_KEY environment variable not set');
    }

    // Validate prioritization weights sum to 1.0
    const weights = config.canny.prioritization?.weights;
    if (weights) {
      const sum = weights.votes + weights.revenue + weights.strategicFit;
      if (Math.abs(sum - 1.0) > 0.01) {
        throw new Error(
          `Prioritization weights must sum to 1.0, got ${sum.toFixed(2)}`
        );
      }
    }

    // Ensure at least default statuses exist
    if (!config.canny.workspace.customStatuses.includes('open')) {
      config.canny.workspace.customStatuses.push('open');
    }

    if (!config.canny.workspace.customStatuses.includes('complete')) {
      config.canny.workspace.customStatuses.push('complete');
    }
  }

  /**
   * Get default configuration
   */
  static getDefault(): CannyMCPConfig {
    return {
      canny: {
        apiKey: '',
        baseUrl: 'https://canny.io/api/v1',
        workspace: {
          name: 'Default',
          customStatuses: ['open', 'under review', 'planned', 'in progress', 'complete', 'closed'],
          customFields: {},
          boards: {},
          tags: {},
        },
        prioritization: {
          framework: 'RICE',
          weights: {
            votes: 0.3,
            revenue: 0.4,
            strategicFit: 0.3,
          },
          highRevenueThreshold: 50000,
        },
        jira: {
          enabled: false,
        },
        defaults: {
          pagination: {
            limit: 10,
            maxTotal: 50,
          },
          compactMode: true,
          defaultFields: ['id', 'title', 'status', 'score', 'url'],
          includeComments: false,
          commentLimit: 5,
        },
        cache: {
          enabled: true,
          ttl: {
            boards: 3600,
            tags: 3600,
            users: 86400,
            posts: 300,
            comments: 180,
          },
          maxSize: 100,
        },
        rateLimit: {
          requests: 100,
          window: 60000,
          retryAfter: 5000,
          maxRetries: 3,
        },
      },
      server: {
        transport: 'stdio',
      },
      logging: {
        level: 'info',
        format: 'json',
        console: true,
      },
    };
  }
}
