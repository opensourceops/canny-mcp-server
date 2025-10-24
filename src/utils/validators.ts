/**
 * Input validation utilities
 */

import { ValidationError } from './errors.js';

export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`Invalid email address: ${email}`);
  }
}

export function validateOneOf(value: any, options: any[], fieldName: string): void {
  if (!options.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${options.join(', ')}. Got: ${value}`
    );
  }
}

export function validateStatus(status: string, validStatuses: string[]): void {
  if (!validStatuses.includes(status)) {
    throw new ValidationError(
      `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
    );
  }
}

export function validateLimit(limit: number, max: number = 100): void {
  if (limit < 1 || limit > max) {
    throw new ValidationError(`Limit must be between 1 and ${max}`);
  }
}

export function validateBoardAlias(
  alias: string,
  boardMappings: Record<string, string>
): string {
  const boardId = boardMappings[alias];
  if (!boardId) {
    throw new ValidationError(
      `Unknown board alias: ${alias}. Valid aliases: ${Object.keys(boardMappings).join(', ')}`
    );
  }
  return boardId;
}
