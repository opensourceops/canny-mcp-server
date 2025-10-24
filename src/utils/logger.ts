/**
 * Structured logging utility
 */

import { LoggingConfig } from '../types/config.js';

export class Logger {
  constructor(private config: LoggingConfig) {}

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      this.log('info', message, args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      this.log('error', message, args);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }

  private log(level: string, message: string, args: any[]): void {
    const timestamp = new Date().toISOString();

    if (this.config.format === 'json') {
      const logEntry = {
        timestamp,
        level,
        message,
        ...(args.length > 0 && { data: args }),
      };

      if (this.config.console) {
        console.log(JSON.stringify(logEntry));
      }
    } else {
      const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
      const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedArgs}`;

      if (this.config.console) {
        console.log(logMessage);
      }
    }
  }
}
