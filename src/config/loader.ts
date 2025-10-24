/**
 * Configuration loader with environment variable expansion
 */

import * as fs from 'fs';
import * as path from 'path';
import { CannyMCPConfig } from '../types/config.js';

export class ConfigLoader {
  /**
   * Load configuration with environment variable expansion
   */
  static load(configPath?: string): CannyMCPConfig {
    const defaultPath = path.join(process.cwd(), 'config', 'default.json');
    const finalPath = configPath || defaultPath;

    if (!fs.existsSync(finalPath)) {
      throw new Error(`Configuration file not found: ${finalPath}`);
    }

    const rawConfig = fs.readFileSync(finalPath, 'utf-8');
    const expandedConfig = this.expandEnvVars(rawConfig);
    const config = JSON.parse(expandedConfig) as CannyMCPConfig;

    this.validate(config);

    return config;
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
