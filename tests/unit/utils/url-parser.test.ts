/**
 * Unit tests for URL parsing utilities
 */

import { parseCannyURL, isCannyURL } from '../../../src/utils/url-parser';

describe('URL Parser', () => {
  describe('isCannyURL', () => {
    it('should identify valid Canny URLs', () => {
      expect(isCannyURL('https://company.canny.io/board/p/feature-name')).toBe(true);
      expect(isCannyURL('https://ideas.harness.io/admin/feedback/feature-request/p/my-feature')).toBe(true);
      expect(isCannyURL('http://localhost/board/p/test')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isCannyURL('https://company.canny.io/board/feature-name')).toBe(false);
      expect(isCannyURL('not-a-url')).toBe(false);
      expect(isCannyURL('company.canny.io/p/feature')).toBe(false);
    });
  });

  describe('parseCannyURL', () => {
    it('should parse standard Canny URL format', () => {
      const result = parseCannyURL('https://company.canny.io/feature-requests/p/add-dark-mode');

      expect(result.isValid).toBe(true);
      expect(result.urlName).toBe('add-dark-mode');
      expect(result.boardSlug).toBe('feature-requests');
    });

    it('should parse custom domain URL', () => {
      const result = parseCannyURL(
        'https://ideas.harness.io/admin/feedback/feature-request/p/harness-api-to-retrieve-logged-in-user-details-user-name-and-email-at-least'
      );

      expect(result.isValid).toBe(true);
      expect(result.urlName).toBe('harness-api-to-retrieve-logged-in-user-details-user-name-and-email-at-least');
      expect(result.boardSlug).toBe('feature-request');
    });

    it('should parse URL with query parameters', () => {
      const result = parseCannyURL(
        'https://ideas.harness.io/admin/feedback/feature-request/p/my-feature?boards=feature-request&post-created=last-month'
      );

      expect(result.isValid).toBe(true);
      expect(result.urlName).toBe('my-feature');
      expect(result.boardSlug).toBe('feature-request'); // Should prefer query param
    });

    it('should handle URL with admin path', () => {
      const result = parseCannyURL('https://ideas.company.com/admin/board/p/feature-name');

      expect(result.isValid).toBe(true);
      expect(result.urlName).toBe('feature-name');
      expect(result.boardSlug).toBe('board');
    });

    it('should handle URL with hash fragment', () => {
      const result = parseCannyURL('https://company.canny.io/board/p/feature-name#comment-123');

      expect(result.isValid).toBe(true);
      expect(result.urlName).toBe('feature-name');
      expect(result.boardSlug).toBe('board');
    });

    it('should return invalid for URLs without /p/ path', () => {
      const result = parseCannyURL('https://company.canny.io/board/feature-name');

      expect(result.isValid).toBe(false);
      expect(result.urlName).toBeUndefined();
    });

    it('should return invalid for malformed URLs', () => {
      const result = parseCannyURL('not-a-url');

      expect(result.isValid).toBe(false);
    });

    it('should handle urlName with special characters', () => {
      const result = parseCannyURL('https://company.canny.io/board/p/feature-with-many-words-and-numbers-123');

      expect(result.isValid).toBe(true);
      expect(result.urlName).toBe('feature-with-many-words-and-numbers-123');
    });

    it('should extract urlName even without board in path', () => {
      const result = parseCannyURL('https://company.canny.io/p/feature-name');

      expect(result.isValid).toBe(true);
      expect(result.urlName).toBe('feature-name');
    });

    it('should extract comment ID from hash fragment', () => {
      const result = parseCannyURL('https://company.canny.io/board/p/feature-name#comment-abc123');

      expect(result.isValid).toBe(true);
      expect(result.urlName).toBe('feature-name');
      expect(result.commentID).toBe('abc123');
    });

    it('should handle URL without comment ID', () => {
      const result = parseCannyURL('https://company.canny.io/board/p/feature-name');

      expect(result.isValid).toBe(true);
      expect(result.commentID).toBeUndefined();
    });
  });
});
