/**
 * Tests for scope specificity selection in config resolver
 * 
 * Scope priority (most specific to least specific):
 * 1. user - User-specific configuration
 * 2. branch - Branch-specific configuration
 * 3. region - Region-specific configuration
 * 4. tenant - Tenant-wide configuration
 * 5. global - System-wide default configuration
 * 
 * When multiple scopes match, the resolver should prefer the most specific scope.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigResolver } from '../src/resolver.js';
import { getScopePriority, SCOPE_PRIORITY } from '../src/types.js';

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

describe('Scope Specificity Selection', () => {
  const tenantId = 'tenant-001';
  const userId = 'user-001';
  const branchId = 'branch-001';
  const regionId = 'region-001';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('scope priority constants', () => {
    it('should have correct priority order', () => {
      expect(SCOPE_PRIORITY).toEqual(['user', 'branch', 'region', 'tenant', 'global']);
    });

    it('should return correct priority values', () => {
      expect(getScopePriority('user')).toBe(0);
      expect(getScopePriority('branch')).toBe(1);
      expect(getScopePriority('region')).toBe(2);
      expect(getScopePriority('tenant')).toBe(3);
      expect(getScopePriority('global')).toBe(4);
    });

    it('should return high priority for unknown scope', () => {
      expect(getScopePriority('unknown')).toBe(5);
    });
  });

  describe('selecting most specific scope', () => {
    it('should prefer user scope over all others', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.theme',
          value_json: 'global-theme',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.theme',
          value_json: 'tenant-theme',
          value_type: 'string',
          scope: 'tenant',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '3',
          tenant_id: tenantId,
          key: 'feature.theme',
          value_json: 'branch-theme',
          value_type: 'string',
          scope: 'branch',
          scope_id: branchId,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '4',
          tenant_id: tenantId,
          key: 'feature.theme',
          value_json: 'user-theme',
          value_type: 'string',
          scope: 'user',
          scope_id: userId,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['feature.theme'],
        { userId, branchId }
      );

      expect(result.get('feature.theme').value).toBe('user-theme');
      expect(result.get('feature.theme').scope).toBe('user');
    });

    it('should prefer branch scope when no user scope exists', async () => {
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
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 200,
          value_type: 'number',
          scope: 'tenant',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '3',
          tenant_id: tenantId,
          key: 'feature.limit',
          value_json: 300,
          value_type: 'number',
          scope: 'branch',
          scope_id: branchId,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['feature.limit'],
        { userId, branchId }
      );

      expect(result.get('feature.limit').value).toBe(300);
      expect(result.get('feature.limit').scope).toBe('branch');
    });

    it('should prefer region scope when no branch or user scope exists', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.rate',
          value_json: 0.1,
          value_type: 'number',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.rate',
          value_json: 0.15,
          value_type: 'number',
          scope: 'region',
          scope_id: regionId,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['feature.rate'],
        { regionId }
      );

      expect(result.get('feature.rate').value).toBe(0.15);
      expect(result.get('feature.rate').scope).toBe('region');
    });

    it('should prefer tenant scope over global', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.enabled',
          value_json: false,
          value_type: 'boolean',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.enabled',
          value_json: true,
          value_type: 'boolean',
          scope: 'tenant',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(tenantId, ['feature.enabled']);

      expect(result.get('feature.enabled').value).toBe(true);
      expect(result.get('feature.enabled').scope).toBe('tenant');
    });

    it('should fallback to global when no specific scope matches', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.default',
          value_json: 'global-default',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['feature.default'],
        { userId, branchId, regionId }
      );

      expect(result.get('feature.default').value).toBe('global-default');
      expect(result.get('feature.default').scope).toBe('global');
    });
  });

  describe('scope_id matching', () => {
    it('should not match branch scope with wrong branch_id', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.config',
          value_json: 'global',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.config',
          value_json: 'other-branch',
          value_type: 'string',
          scope: 'branch',
          scope_id: 'branch-other', // Different branch
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['feature.config'],
        { branchId: 'branch-001' }
      );

      expect(result.get('feature.config').value).toBe('global');
      expect(result.get('feature.config').scope).toBe('global');
    });

    it('should not match user scope with wrong user_id', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.preference',
          value_json: 'default',
          value_type: 'string',
          scope: 'tenant',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.preference',
          value_json: 'other-user-pref',
          value_type: 'string',
          scope: 'user',
          scope_id: 'user-other', // Different user
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['feature.preference'],
        { userId: 'user-001' }
      );

      expect(result.get('feature.preference').value).toBe('default');
      expect(result.get('feature.preference').scope).toBe('tenant');
    });
  });

  describe('combined scope and effective dating', () => {
    it('should select most recent version of most specific scope', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.setting',
          value_json: 'global-old',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 2,
          effective_from: '2024-06-10T00:00:00Z', // More recent
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.setting',
          value_json: 'branch-v1',
          value_type: 'string',
          scope: 'branch',
          scope_id: branchId,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '3',
          tenant_id: tenantId,
          key: 'feature.setting',
          value_json: 'branch-v2',
          value_type: 'string',
          scope: 'branch',
          scope_id: branchId,
          status: 'PUBLISHED',
          version: 2,
          effective_from: '2024-06-05T00:00:00Z', // More recent branch version
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['feature.setting'],
        { branchId }
      );

      // Should select branch scope (more specific) with most recent version
      expect(result.get('feature.setting').value).toBe('branch-v2');
      expect(result.get('feature.setting').scope).toBe('branch');
      expect(result.get('feature.setting').version).toBe(2);
    });
  });

  describe('multiple keys with different scopes', () => {
    it('should resolve each key to its most specific scope independently', async () => {
      const mockData = [
        // Key A: has user scope
        {
          id: '1',
          tenant_id: tenantId,
          key: 'config.a',
          value_json: 'a-global',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'config.a',
          value_json: 'a-user',
          value_type: 'string',
          scope: 'user',
          scope_id: userId,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        // Key B: only has branch scope
        {
          id: '3',
          tenant_id: tenantId,
          key: 'config.b',
          value_json: 'b-global',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '4',
          tenant_id: tenantId,
          key: 'config.b',
          value_json: 'b-branch',
          value_type: 'string',
          scope: 'branch',
          scope_id: branchId,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        // Key C: only global scope
        {
          id: '5',
          tenant_id: tenantId,
          key: 'config.c',
          value_json: 'c-global',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['config.a', 'config.b', 'config.c'],
        { userId, branchId }
      );

      expect(result.get('config.a').value).toBe('a-user');
      expect(result.get('config.a').scope).toBe('user');

      expect(result.get('config.b').value).toBe('b-branch');
      expect(result.get('config.b').scope).toBe('branch');

      expect(result.get('config.c').value).toBe('c-global');
      expect(result.get('config.c').scope).toBe('global');
    });
  });

  describe('no context scope provided', () => {
    it('should only match global and tenant scopes when no context provided', async () => {
      const mockData = [
        {
          id: '1',
          tenant_id: tenantId,
          key: 'feature.setting',
          value_json: 'global-value',
          value_type: 'string',
          scope: 'global',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '2',
          tenant_id: tenantId,
          key: 'feature.setting',
          value_json: 'tenant-value',
          value_type: 'string',
          scope: 'tenant',
          scope_id: null,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        },
        {
          id: '3',
          tenant_id: tenantId,
          key: 'feature.setting',
          value_json: 'branch-value',
          value_type: 'string',
          scope: 'branch',
          scope_id: branchId,
          status: 'PUBLISHED',
          version: 1,
          effective_from: '2024-06-01T00:00:00Z',
          effective_to: null
        }
      ];

      const client = createMockClient(mockData);
      const resolver = new ConfigResolver(client);
      const result = await resolver.resolveConfig(
        tenantId,
        ['feature.setting'],
        {} // Empty context
      );

      // Should prefer tenant over global, but not match branch (no branchId in context)
      expect(result.get('feature.setting').value).toBe('tenant-value');
      expect(result.get('feature.setting').scope).toBe('tenant');
    });
  });
});
