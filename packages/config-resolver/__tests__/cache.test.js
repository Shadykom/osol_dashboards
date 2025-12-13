/**
 * Tests for request-scoped caching mechanism
 */

import { describe, it, expect } from '@jest/globals';
import { ConfigCache, createRequestCache, getOrCreateCache, CONFIG_CACHE_SYMBOL } from '../src/cache.js';

describe('ConfigCache', () => {
  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      const cache = new ConfigCache();
      const value = { value: 'test', type: 'string' };
      
      cache.set('tenant-1', 'key-1', {}, value);
      
      expect(cache.has('tenant-1', 'key-1', {})).toBe(true);
      expect(cache.get('tenant-1', 'key-1', {})).toEqual(value);
    });

    it('should differentiate by tenant', () => {
      const cache = new ConfigCache();
      
      cache.set('tenant-1', 'key-1', {}, 'value-1');
      cache.set('tenant-2', 'key-1', {}, 'value-2');
      
      expect(cache.get('tenant-1', 'key-1', {})).toBe('value-1');
      expect(cache.get('tenant-2', 'key-1', {})).toBe('value-2');
    });

    it('should differentiate by context scope', () => {
      const cache = new ConfigCache();
      
      cache.set('tenant-1', 'key-1', { userId: 'user-1' }, 'user-value');
      cache.set('tenant-1', 'key-1', { branchId: 'branch-1' }, 'branch-value');
      cache.set('tenant-1', 'key-1', {}, 'global-value');
      
      expect(cache.get('tenant-1', 'key-1', { userId: 'user-1' })).toBe('user-value');
      expect(cache.get('tenant-1', 'key-1', { branchId: 'branch-1' })).toBe('branch-value');
      expect(cache.get('tenant-1', 'key-1', {})).toBe('global-value');
    });

    it('should return undefined for missing keys', () => {
      const cache = new ConfigCache();
      
      expect(cache.has('tenant-1', 'missing', {})).toBe(false);
      expect(cache.get('tenant-1', 'missing', {})).toBeUndefined();
    });
  });

  describe('batch operations', () => {
    it('should get many values at once', () => {
      const cache = new ConfigCache();
      
      cache.set('tenant-1', 'key-1', {}, 'value-1');
      cache.set('tenant-1', 'key-2', {}, 'value-2');
      
      const { cached, missing } = cache.getMany('tenant-1', ['key-1', 'key-2', 'key-3'], {});
      
      expect(cached.get('key-1')).toBe('value-1');
      expect(cached.get('key-2')).toBe('value-2');
      expect(missing).toEqual(['key-3']);
    });

    it('should set many values at once', () => {
      const cache = new ConfigCache();
      
      const values = new Map([
        ['key-1', 'value-1'],
        ['key-2', 'value-2']
      ]);
      
      cache.setMany('tenant-1', values, {});
      
      expect(cache.get('tenant-1', 'key-1', {})).toBe('value-1');
      expect(cache.get('tenant-1', 'key-2', {})).toBe('value-2');
    });
  });

  describe('invalidation', () => {
    it('should not return values after invalidation', () => {
      const cache = new ConfigCache();
      
      cache.set('tenant-1', 'key-1', {}, 'value-1');
      expect(cache.get('tenant-1', 'key-1', {})).toBe('value-1');
      
      cache.invalidate();
      
      expect(cache.has('tenant-1', 'key-1', {})).toBe(false);
      expect(cache.get('tenant-1', 'key-1', {})).toBeUndefined();
    });

    it('should not store values after invalidation', () => {
      const cache = new ConfigCache();
      
      cache.invalidate();
      cache.set('tenant-1', 'key-1', {}, 'value-1');
      
      expect(cache.has('tenant-1', 'key-1', {})).toBe(false);
    });

    it('should clear without invalidating', () => {
      const cache = new ConfigCache();
      
      cache.set('tenant-1', 'key-1', {}, 'value-1');
      cache.clear();
      
      expect(cache.has('tenant-1', 'key-1', {})).toBe(false);
      
      // Should still accept new values after clear (unlike invalidate)
      cache.set('tenant-1', 'key-2', {}, 'value-2');
      expect(cache.get('tenant-1', 'key-2', {})).toBe('value-2');
    });
  });

  describe('statistics', () => {
    it('should return cache statistics', () => {
      const cache = new ConfigCache();
      
      cache.set('tenant-1', 'key-1', {}, 'value-1');
      cache.set('tenant-1', 'key-2', {}, 'value-2');
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.createdAt).toBeInstanceOf(Date);
      expect(stats.isInvalidated).toBe(false);
    });

    it('should report invalidated status', () => {
      const cache = new ConfigCache();
      
      cache.invalidate();
      
      expect(cache.getStats().isInvalidated).toBe(true);
    });
  });
});

describe('createRequestCache', () => {
  it('should create a new cache instance', () => {
    const cache1 = createRequestCache();
    const cache2 = createRequestCache();
    
    expect(cache1).toBeInstanceOf(ConfigCache);
    expect(cache2).toBeInstanceOf(ConfigCache);
    expect(cache1).not.toBe(cache2);
  });
});

describe('getOrCreateCache', () => {
  it('should create cache when no context provided', () => {
    const cache = getOrCreateCache();
    
    expect(cache).toBeInstanceOf(ConfigCache);
  });

  it('should create cache when context has no cache', () => {
    const context = {};
    const cache = getOrCreateCache(context);
    
    expect(cache).toBeInstanceOf(ConfigCache);
    expect(context[CONFIG_CACHE_SYMBOL]).toBe(cache);
  });

  it('should return existing cache from context', () => {
    const context = {};
    const cache1 = getOrCreateCache(context);
    const cache2 = getOrCreateCache(context);
    
    expect(cache1).toBe(cache2);
  });

  it('should isolate caches between different contexts', () => {
    const context1 = {};
    const context2 = {};
    
    const cache1 = getOrCreateCache(context1);
    const cache2 = getOrCreateCache(context2);
    
    cache1.set('tenant-1', 'key-1', {}, 'value-from-context-1');
    
    expect(cache1.get('tenant-1', 'key-1', {})).toBe('value-from-context-1');
    expect(cache2.get('tenant-1', 'key-1', {})).toBeUndefined();
  });
});

describe('Request-scoped consistency', () => {
  it('should maintain consistent values within a request context', () => {
    const requestContext = {};
    
    // First call sets the cache
    const cache1 = getOrCreateCache(requestContext);
    cache1.set('tenant-1', 'config-key', {}, { value: 'original', version: 1 });
    
    // Simulating another part of the same request getting the cache
    const cache2 = getOrCreateCache(requestContext);
    
    // Both should see the same value
    expect(cache1.get('tenant-1', 'config-key', {})).toEqual({ value: 'original', version: 1 });
    expect(cache2.get('tenant-1', 'config-key', {})).toEqual({ value: 'original', version: 1 });
    
    // They should be the same cache instance
    expect(cache1).toBe(cache2);
  });

  it('should isolate values between different request contexts', () => {
    const request1Context = {};
    const request2Context = {};
    
    const cache1 = getOrCreateCache(request1Context);
    const cache2 = getOrCreateCache(request2Context);
    
    cache1.set('tenant-1', 'config-key', {}, { value: 'request-1-value' });
    cache2.set('tenant-1', 'config-key', {}, { value: 'request-2-value' });
    
    expect(cache1.get('tenant-1', 'config-key', {})).toEqual({ value: 'request-1-value' });
    expect(cache2.get('tenant-1', 'config-key', {})).toEqual({ value: 'request-2-value' });
  });
});
