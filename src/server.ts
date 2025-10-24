/**
 * MCP Server implementation for Canny
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { CannyMCPConfig } from './types/config.js';
import { ToolContext } from './types/mcp.js';
import { CannyClient } from './api/client.js';
import { Cache } from './utils/cache.js';
import { Logger } from './utils/logger.js';
import { ALL_TOOLS, getToolByName } from './tools/index.js';
import { ALL_RESOURCES, getResourceByUri } from './resources/index.js';
import { loadPrompts, getPromptByName } from './prompts/index.js';
import { MCPPrompt } from './types/mcp.js';

export class CannyMCPServer {
  private server: Server;
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

    this.server = new Server(
      {
        name: 'canny-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.logger.info('Canny MCP Server initialized', {
      prompts: this.prompts.length,
      builtIn: 5,
      custom: (config.prompts || []).length,
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing tools');

      // Determine tool mode (with backward compatibility)
      const toolMode = this.config.server.toolMode !== undefined
        ? this.config.server.toolMode
        : (this.config.server.readOnlyMode ? 'readonly' : 'readonly'); // Default to readonly

      // Filter tools based on toolMode
      let availableTools = ALL_TOOLS;

      if (toolMode === 'readonly' || toolMode === true) {
        // Only read-only tools
        availableTools = ALL_TOOLS.filter((tool) => tool.readOnly);
      } else if (toolMode === 'all' || toolMode === false) {
        // All tools
        availableTools = ALL_TOOLS;
      } else if (typeof toolMode === 'string' && toolMode !== 'all' && toolMode !== 'readonly') {
        // Comma-separated toolsets: "discovery,posts,engagement"
        const selectedToolsets = toolMode.split(',').map(t => t.trim());
        availableTools = ALL_TOOLS.filter((tool) => selectedToolsets.includes(tool.toolset));
      }

      this.logger.debug(`Available tools: ${availableTools.length} (toolMode: ${toolMode})`);

      return {
        tools: availableTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Call a tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.logger.info('Tool called', { name, args });

      const tool = getToolByName(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Determine tool mode (with backward compatibility)
      const toolMode = this.config.server.toolMode !== undefined
        ? this.config.server.toolMode
        : (this.config.server.readOnlyMode ? 'readonly' : 'readonly'); // Default to readonly

      // Safety check: prevent write operations in read-only mode
      const isReadOnlyMode = toolMode === 'readonly' || toolMode === true;

      if (isReadOnlyMode && !tool.readOnly) {
        this.logger.warn('Write operation blocked in read-only mode', { tool: name, toolMode });
        throw new Error(
          `Tool "${name}" is not available in read-only mode (toolMode: ${toolMode}). This is a write operation.`
        );
      }

      // Check if tool is in selected toolsets (for comma-separated toolset mode)
      if (typeof toolMode === 'string' && toolMode !== 'all' && toolMode !== 'readonly') {
        const selectedToolsets = toolMode.split(',').map(t => t.trim());
        if (!selectedToolsets.includes(tool.toolset)) {
          this.logger.warn('Tool not in selected toolsets', { tool: name, toolMode, toolset: tool.toolset });
          throw new Error(
            `Tool "${name}" is not available. Current toolMode: "${toolMode}". Tool belongs to toolset: "${tool.toolset}".`
          );
        }
      }

      try {
        const result = await tool.handler(args || {}, this.context);

        this.logger.debug('Tool completed successfully', { name });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        this.logger.error('Tool execution failed', {
          name,
          error: error.message,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: error.message,
                  code: error.code || 'TOOL_ERROR',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Listing resources');
      return {
        resources: ALL_RESOURCES.map((resource) => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        })),
      };
    });

    // Read a resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      this.logger.info('Resource requested', { uri });

      const resource = getResourceByUri(uri);
      if (!resource) {
        throw new Error(`Unknown resource: ${uri}`);
      }

      try {
        const result = await resource.handler(this.context);

        this.logger.debug('Resource fetched successfully', { uri });

        return {
          contents: [
            {
              uri: resource.uri,
              mimeType: result.mimeType,
              text: result.text,
            },
          ],
        };
      } catch (error: any) {
        this.logger.error('Resource fetch failed', {
          uri,
          error: error.message,
        });

        throw error;
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.debug('Listing prompts');
      return {
        prompts: this.prompts.map((prompt) => ({
          name: prompt.name,
          description: prompt.description,
          arguments: prompt.arguments || [],
        })),
      };
    });

    // Get a prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.logger.info('Prompt requested', { name, args });

      const prompt = getPromptByName(name, this.prompts);
      if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
      }

      const templateText =
        typeof prompt.template === 'function'
          ? prompt.template(args || {})
          : prompt.template;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: templateText,
            },
          },
        ],
      };
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    this.logger.info('Canny MCP Server started', {
      transport: 'stdio',
      tools: ALL_TOOLS.length,
      resources: ALL_RESOURCES.length,
      prompts: this.prompts.length,
    });
  }

  async stop(): Promise<void> {
    await this.server.close();
    this.logger.info('Canny MCP Server stopped');
  }
}
