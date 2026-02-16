#!/usr/bin/env node
/**
 * Canny MCP Server - Main Entry Point
 */

import * as dotenv from 'dotenv';
import { CannyMCPServer } from './server.js';
import { ConfigLoader } from './config/loader.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Load configuration
    const configPath = process.env.CANNY_CONFIG_PATH;
    const config = ConfigLoader.load(configPath);

    // Create and start server
    const server = new CannyMCPServer(config);
    await server.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      console.error('Shutting down Canny MCP Server...');
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep process alive
    process.stdin.resume();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to start Canny MCP Server:', message);
    process.exit(1);
  }
}

main();
