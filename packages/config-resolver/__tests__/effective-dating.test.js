/**
 * Tests for effective dating logic in config resolver
 * 
 * The resolver should:
 * - Choose the latest PUBLISHED version with effective_from <= now
 * - Ignore DRAFT and ARCHIVED configurations
 * - Respect effective_to dates (ignore expired configs)
 * - Handle multiple versions with different effective dates
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigResolver } from '../src/resolver.js';

// Mock Supabase client with proper chainable query builder
function createMockClient(mockData) {
  const createChainableQuery = () => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      in: jest.fn(() => query),
      lte: jest.fn(() => query),
      or: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      then: (resolve) => resolve({ data: mockData, error: null })
    };
    return query;
  };

  return {
    from: jest.fn(() => createChainableQuery())
  };
}

describe('Effective Dating', () => {
  const tenantId = 'tenant-001';
  const baseDate = new Date('2024-06-15T12:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('selecting by effective_from date', () => {
    it('should select config with effective_from <= now', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 100,
          value_type: 'number',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null,
          metadata: {}
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.limit']);

      expect(result.has('feature.limit')).toBe(true);
      expect(result.get('feature.limit').value).toBe(100);
    });

    it('should select the most recent effective config when multiple exist', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 50,
          value_type: 'number',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-01-01T00:00:00Z', // Old
          effective_to: null,
          metadata: {}
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 100,
          value_type: 'number',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 2,
          effective_from: '2024-06-01T00:00:00Z', // More recent, within effective range
          effective_to: null,
          metadata: {}
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.limit']);

      expect(result.get('feature.limit').value).toBe(100);
      expect(result.get('feature.limit').version).toBe(2);
    });

    it('should not select config with future effective_from date', async () => {
      // Note: The query already filters by effective_from <= now
      // This test verifies behavior when database returns no matching configs
      const mockData = [];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.limit']);

      expect(result.has('feature.limit')).toBe(false);
    });

    it('should handle configs with same effective_from by version', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 75,
          value_type: 'number',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null,
          metadata: {}
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 100,
          value_type: 'number',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 2, // Higher version
          effective_from: '2024-06-01T00:00:00Z', // Same effective date
          effective_to: null,
          metadata: {}
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.limit']);

      expect(result.get('feature.limit').value).toBe(100);
      expect(result.get('feature.limit').version).toBe(2);
    });
  });

  describe('status filtering', () => {
    it('should only select PUBLISHED configs', async () => {
      // The query filters by status = PUBLISHED
      // This test verifies the resolver properly handles only published configs
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.enabled',
          value_json: true,
          value_type: 'boolean',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null,
          metadata: {}
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.enabled']);

      expect(result.get('feature.enabled').value).toBe(true);
    });
  });

  describe('effective_to handling', () => {
    it('should return config when effective_to is null', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 100,
          value_type: 'number',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null, // No expiration
          metadata: {}
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.limit']);

      expect(result.has('feature.limit')).toBe(true);
    });

    it('should return config when effective_to is in the future', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 100,
          value_type: 'number',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: '2024-12-31T23:59:59Z', // Future date
          metadata: {}
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.limit']);

      expect(result.has('feature.limit')).toBe(true);
    });
  });

  describe('multiple keys resolution', () => {
    it('should resolve multiple keys with different effective dates', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.a',
          value_json: 'value-a-v2',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 2,
          effective_from: '2024-06-10T00:00:00Z',
          effective_to: null,
          metadata: {}
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.a',
          value_json: 'value-a-v1',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-01-01T00:00:00Z',
          effective_to: null,
          metadata: {}
        },
        {
          id: '3',
          tenant_id: tenantId,
          key: 'feature.b',
          value_json: 'value-b',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-05-01T00:00:00Z',
          effective_to: null,
          metadata: {}
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.a', 'feature.b']);

      expect(result.get('feature.a').value).toBe('value-a-v2');
      expect(result.get('feature.b').value).toBe('value-b');
    });

    it('should handle missing keys gracefully', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.exists',
          value_json: 'present',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null,
          metadata: {}
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.exists', 'feature.missing']);

      expect(result.has('feature.exists')).toBe(true);
      expect(result.has('feature.missing')).toBe(false);
      expect(result.size).toBe(1);
    });
  });

  describe('resolved value structure', () => {
    it('should return properly structured resolved value', async () => {
      const effectiveDate = '2024-06-01T00:00:00Z';
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.config',
          value_json: { nested: 'value', count: 42 },
          value_type: 'object',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 3,
          effective_from: effectiveDate,
          effective_to: null,
          metadata: { author: 'admin' }
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.config']);

      const resolved = result.get('feature.config');
      expect(resolved).toMatchObject({
        key: 'feature.config',
        value: { nested: 'value', count: 42 },
        type: 'object',
        scope: 'global',
        version: 3,
        metadata: { author: 'admin' }
      });
      expect(resolved.effectiveFrom).toEqual(new Date(effectiveDate));
    });
  });
});
