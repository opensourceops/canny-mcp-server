/**
 * Unit tests for LRU Cache
 */

import { Cache } from '../../../src/utils/cache';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache(3); // Max size of 3 for testing
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1', 60);

      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should handle different data types', () => {
      const largeCache = new Cache(10); // Use larger cache for this test

      largeCache.set('string', 'hello', 60);
      largeCache.set('number', 42, 60);
      largeCache.set('object', { foo: 'bar' }, 60);
      largeCache.set('array', [1, 2, 3], 60);
      largeCache.set('boolean', true, 60);

      expect(largeCache.get('string')).toBe('hello');
      expect(largeCache.get('number')).toBe(42);
      expect(largeCache.get('object')).toEqual({ foo: 'bar' });
      expect(largeCache.get('array')).toEqual([1, 2, 3]);
      expect(largeCache.get('boolean')).toBe(true);
    });
  });

  describe('expiration', () => {
    it('should return null for expired entries', async () => {
      cache.set('key1', 'value1', 0.1); // 0.1 seconds TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.get('key1')).toBeNull();
    });

    it('should not return expired entries', async () => {
      cache.set('key1', 'value1', 0.1);
      cache.set('key2', 'value2', 60);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should remove expired entries on get', async () => {
      cache.set('key1', 'value1', 0.1);

      expect(cache.size()).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 150));

      cache.get('key1'); // Should trigger cleanup

      expect(cache.size()).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when at capacity', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);
      cache.set('key3', 'value3', 60);

      expect(cache.size()).toBe(3);

      // Adding 4th item should evict key1 (oldest)
      cache.set('key4', 'value4', 60);

      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update LRU order on get', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);
      cache.set('key3', 'value3', 60);

      // Access key1 to make it most recent
      cache.get('key1');

      // Add key4, should evict key2 (now oldest)
      cache.set('key4', 'value4', 60);

      expect(cache.get('key1')).toBe('value1'); // Still exists
      expect(cache.get('key2')).toBeNull(); // Evicted
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should handle updating existing keys', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);
      cache.set('key3', 'value3', 60);

      // Update key1
      cache.set('key1', 'updated-value1', 60);

      expect(cache.size()).toBe(3);
      expect(cache.get('key1')).toBe('updated-value1');
    });
  });

  describe('delete', () => {
    it('should delete specific key', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);

      cache.delete('key1');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    it('should handle deleting non-existent key', () => {
      expect(() => cache.delete('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);
      cache.set('key3', 'value3', 60);

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', 'value1', 60);

      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cache.set('key1', 'value1', 0.1);

      expect(cache.has('key1')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.has('key1')).toBe(false);
    });

    it('should clean up expired keys', async () => {
      cache.set('key1', 'value1', 0.1);

      expect(cache.size()).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 150));

      cache.has('key1');

      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1', 60);
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2', 60);
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle cache with maxSize 1', () => {
      const smallCache = new Cache(1);

      smallCache.set('key1', 'value1', 60);
      expect(smallCache.size()).toBe(1);

      smallCache.set('key2', 'value2', 60);
      expect(smallCache.size()).toBe(1);
      expect(smallCache.get('key1')).toBeNull();
      expect(smallCache.get('key2')).toBe('value2');
    });

    it('should handle very large TTL values', () => {
      cache.set('key1', 'value1', 31536000); // 1 year in seconds

      expect(cache.get('key1')).toBe('value1');
    });

    it('should handle zero TTL', async () => {
      cache.set('key1', 'value1', 0);

      // Should expire immediately
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(cache.get('key1')).toBeNull();
    });
  });
});
