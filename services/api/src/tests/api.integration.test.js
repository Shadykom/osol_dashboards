/**
 * API Integration Tests
 * 
 * Tests for the HTTP API endpoints with tenant context
 * 
 * Run with: node --test src/tests/api.integration.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { 
  TEST_TENANT_A, 
  TEST_TENANT_B, 
  fullTestSetup, 
  cleanupTestData 
} from './helpers/test-db.js';
import { shutdown } from '../db/pool.js';

// Simple HTTP client for testing
async function makeRequest(path, options = {}) {
  const port = process.env.PORT || 3001;
  const url = `http://localhost:${port}${path}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  const data = await response.json();
  return { status: response.status, data, headers: response.headers };
}

describe('API Integration Tests', () => {
  let server;
  
  before(async () => {
    console.log('\n=== Setting up test data and server ===\n');
    
    // Setup test data
    try {
      await fullTestSetup();
    } catch (error) {
      console.log('Test data setup skipped (may already exist or DB not configured):', error.message);
    }
    
    // Start the server
    const { server: appServer } = await import('../index.js');
    server = appServer;
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  after(async () => {
    console.log('\n=== Cleaning up ===\n');
    
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    
    try {
      await cleanupTestData();
    } catch (error) {
      console.log('Cleanup skipped:', error.message);
    }
    
    await shutdown();
  });
  
  describe('Health Endpoints', () => {
    it('GET /health should return healthy status', async () => {
      const { status, data } = await makeRequest('/health');
      
      assert.strictEqual(status, 200);
      assert.strictEqual(data.status, 'healthy');
      assert.ok(data.requestId, 'Should include requestId');
    });
    
    it('GET /health/live should return live status', async () => {
      const { status, data } = await makeRequest('/health/live');
      
      assert.strictEqual(status, 200);
      assert.strictEqual(data.status, 'live');
    });
  });
  
  describe('Tenant Endpoints', () => {
    it('GET /platform/tenants/me should require tenant context', async () => {
      const { status, data } = await makeRequest('/platform/tenants/me');
      
      assert.strictEqual(status, 400, 'Should return 400 without tenant context');
      assert.strictEqual(data.error, 'BadRequest');
    });
    
    it('GET /platform/tenants/me should return tenant info with x-tenant-id header', async () => {
      const { status, data } = await makeRequest('/platform/tenants/me', {
        headers: { 'x-tenant-id': TEST_TENANT_A }
      });
      
      assert.strictEqual(status, 200);
      assert.strictEqual(data.id, TEST_TENANT_A);
    });
  });
  
  describe('Org Units Endpoints (RBAC Protected)', () => {
    it('GET /platform/org-units/tree should require ADMIN role', async () => {
      const { status, data } = await makeRequest('/platform/org-units/tree', {
        headers: { 'x-tenant-id': TEST_TENANT_A }
      });
      
      // Without ADMIN role, should get 403
      assert.strictEqual(status, 403, 'Should require ADMIN role');
      assert.strictEqual(data.error, 'Forbidden');
    });
    
    it('GET /platform/org-units/tree should work with x-dev-role=ADMIN', async () => {
      const { status, data } = await makeRequest('/platform/org-units/tree', {
        headers: { 
          'x-tenant-id': TEST_TENANT_A,
          'x-dev-role': 'ADMIN'
        }
      });
      
      assert.strictEqual(status, 200);
      assert.ok(Array.isArray(data.tree), 'Should return tree array');
      assert.ok(Array.isArray(data.flatList), 'Should return flatList array');
    });
    
    it('should only return Tenant A org units when using Tenant A context', async () => {
      const { status, data } = await makeRequest('/platform/org-units/tree', {
        headers: { 
          'x-tenant-id': TEST_TENANT_A,
          'x-dev-role': 'ADMIN'
        }
      });
      
      assert.strictEqual(status, 200);
      
      // All org units should belong to Tenant A
      for (const unit of data.flatList) {
        assert.ok(
          unit.name.includes('Tenant A'),
          `All units should be Tenant A, got: ${unit.name}`
        );
      }
      
      // Should NOT include Tenant B data
      const hasTenantB = data.flatList.some(u => u.name.includes('Tenant B'));
      assert.ok(!hasTenantB, 'Should NOT include Tenant B org units');
    });
    
    it('should only return Tenant B org units when using Tenant B context', async () => {
      const { status, data } = await makeRequest('/platform/org-units/tree', {
        headers: { 
          'x-tenant-id': TEST_TENANT_B,
          'x-dev-role': 'ADMIN'
        }
      });
      
      assert.strictEqual(status, 200);
      
      // All org units should belong to Tenant B
      for (const unit of data.flatList) {
        assert.ok(
          unit.name.includes('Tenant B'),
          `All units should be Tenant B, got: ${unit.name}`
        );
      }
      
      // Should NOT include Tenant A data
      const hasTenantA = data.flatList.some(u => u.name.includes('Tenant A'));
      assert.ok(!hasTenantA, 'Should NOT include Tenant A org units');
    });
  });
  
  describe('Request ID Tracking', () => {
    it('should return request ID in response headers', async () => {
      const { headers } = await makeRequest('/health');
      
      const requestId = headers.get('x-request-id');
      assert.ok(requestId, 'Should return x-request-id header');
    });
    
    it('should use provided request ID', async () => {
      const customRequestId = 'custom-test-request-123';
      const { headers, data } = await makeRequest('/health', {
        headers: { 'x-request-id': customRequestId }
      });
      
      assert.strictEqual(headers.get('x-request-id'), customRequestId);
      assert.strictEqual(data.requestId, customRequestId);
    });
  });
  
  describe('404 Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const { status, data } = await makeRequest('/unknown/route');
      
      assert.strictEqual(status, 404);
      assert.strictEqual(data.error, 'NotFound');
      assert.ok(data.requestId, 'Should include requestId');
    });
  });
});
