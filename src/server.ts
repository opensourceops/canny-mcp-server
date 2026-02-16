/**
 * MCP Server implementation for Canny
 * Uses McpServer with registerTool/registerResource/registerPrompt (modern SDK API)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { z } from 'zod';

import { CannyMCPConfig } from './types/config.js';
import { ToolContext } from './types/mcp.js';

/** Maximum character length for tool responses to prevent excessive token usage */
const RESPONSE_CHARACTER_LIMIT = 50_000;
import { CannyClient } from './api/client.js';
import { Cache } from './utils/cache.js';
import { Logger } from './utils/logger.js';
import { ALL_TOOLS } from './tools/index.js';
import { ALL_RESOURCES } from './resources/index.js';
import { loadPrompts } from './prompts/index.js';
import { MCPPrompt } from './types/mcp.js';

export class CannyMCPServer {
  private server: McpServer;
  private client: CannyClient;
  private cache: Cache;
  private logger: Logger;
  private context: ToolContext;
  private prompts: MCPPrompt[];

  constructor(private config: CannyMCPConfig) {
    this.logger = new Logger(config.logging);
    this.client = new CannyClient(config.canny, this.logger);
    this.cache = new Cache(config.canny.cache.maxSize);

    // Load prompts (built-in + custom from config)
    this.prompts = loadPrompts(config.prompts);

    this.context = {
      config,
      client: this.client,
      cache: this.cache,
      logger: this.logger,
    };

    this.server = new McpServer(
      {
        name: 'canny-mcp-server',
        version: '1.2.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.registerTools();
    this.registerResources();
    this.registerPrompts();

    this.logger.info('Canny MCP Server initialized', {
      prompts: this.prompts.length,
      builtIn: 5,
      custom: (config.prompts || []).length,
    });
  }

  private getAvailableTools() {
    // Determine tool mode (with backward compatibility)
    const toolMode = this.config.server.toolMode !== undefined
      ? this.config.server.toolMode
      : 'readonly'; // Default to readonly

    if (toolMode === 'readonly' || toolMode === true) {
      return ALL_TOOLS.filter((tool) => tool.readOnly);
    }

    if (toolMode === 'all' || toolMode === false) {
      return ALL_TOOLS;
    }

    if (typeof toolMode === 'string' && toolMode !== 'all' && toolMode !== 'readonly') {
      const selectedToolsets = toolMode.split(',').map(t => t.trim());
      return ALL_TOOLS.filter((tool) => selectedToolsets.includes(tool.toolset));
    }

    return ALL_TOOLS;
  }

  private registerTools(): void {
    const availableTools = this.getAvailableTools();

    this.logger.debug(`Registering ${availableTools.length} tools`);

    for (const tool of availableTools) {
      const context = this.context;

      this.server.registerTool(
        tool.name,
        {
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
        },
        async (args: Record<string, unknown>) => {
          context.logger.info('Tool called', { name: tool.name, args });

          try {
            const result = await tool.handler(args, context);

            context.logger.debug('Tool completed successfully', { name: tool.name });

            let text = JSON.stringify(result, null, 2);

            if (text.length > RESPONSE_CHARACTER_LIMIT) {
              text = text.slice(0, RESPONSE_CHARACTER_LIMIT) +
                `\n... [truncated at ${RESPONSE_CHARACTER_LIMIT} chars]`;
            }

            return {
              content: [
                {
                  type: 'text' as const,
                  text,
                },
              ],
            };
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const code = (error as { code?: string }).code || 'TOOL_ERROR';

            context.logger.error('Tool execution failed', {
              name: tool.name,
              error: message,
            });

            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({ error: message, code }, null, 2),
                },
              ],
              isError: true,
            };
          }
        }
      );
    }
  }

  private registerResources(): void {
    this.logger.debug('Registering resources');

    for (const resource of ALL_RESOURCES) {
      const context = this.context;

      this.server.registerResource(
        resource.name,
        resource.uri,
        {
          description: resource.description,
          mimeType: resource.mimeType,
        },
        async () => {
          context.logger.info('Resource requested', { uri: resource.uri });

          try {
            const result = await resource.handler(context);

            context.logger.debug('Resource fetched successfully', { uri: resource.uri });

            return {
              contents: [
                {
                  uri: resource.uri,
                  mimeType: result.mimeType,
                  text: result.text,
                },
              ],
            };
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            context.logger.error('Resource fetch failed', {
              uri: resource.uri,
              error: message,
            });
            throw error;
          }
        }
      );
    }
  }

  private registerPrompts(): void {
    this.logger.debug('Registering prompts');

    for (const prompt of this.prompts) {
      // Build Zod args schema from prompt arguments
      const argsSchema: Record<string, z.ZodType> = {};
      if (prompt.arguments) {
        for (const arg of prompt.arguments) {
          argsSchema[arg.name] = arg.required
            ? z.string().describe(arg.description)
            : z.string().optional().describe(arg.description);
        }
      }

      const hasArgs = Object.keys(argsSchema).length > 0;

      if (hasArgs) {
        this.server.registerPrompt(
          prompt.name,
          {
            description: prompt.description,
            argsSchema,
          },
          (args) => {
            const stringArgs = args as Record<string, string>;
            const templateText =
              typeof prompt.template === 'function'
                ? prompt.template(stringArgs || {})
                : prompt.template;

            return {
              messages: [
                {
                  role: 'user' as const,
                  content: {
                    type: 'text' as const,
                    text: templateText,
                  },
                },
              ],
            };
          }
        );
      } else {
        this.server.registerPrompt(
          prompt.name,
          {
            description: prompt.description,
          },
          () => {
            const templateText =
              typeof prompt.template === 'function'
                ? prompt.template({})
                : prompt.template;

            return {
              messages: [
                {
                  role: 'user' as const,
                  content: {
                    type: 'text' as const,
                    text: templateText,
                  },
                },
              ],
            };
          }
        );
      }
    }
  }

  async connectTransport(transport: Transport): Promise<void> {
    await this.server.connect(transport);
    this.logger.info('Canny MCP Server connected', {
      tools: this.getAvailableTools().length,
      resources: ALL_RESOURCES.length,
      prompts: this.prompts.length,
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.connectTransport(transport);

    this.logger.info('Canny MCP Server started', {
      transport: 'stdio',
    });
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.logger.info('Canny MCP Server stopped');
  }
}
