/**
 * Middleware Unit Tests
 * 
 * Tests for request-id, auth, tenant-context, and RBAC middleware
 * 
 * Run with: node --test src/tests/middleware.test.js
 */

import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

// Mock Express request/response objects
function createMockReq(options = {}) {
  const headers = options.headers || {};
  return {
    get: (name) => headers[name.toLowerCase()],
    method: options.method || 'GET',
    path: options.path || '/',
    user: options.user || null,
    isAuthenticated: options.isAuthenticated || false,
    tenantId: options.tenantId || null,
    requestId: options.requestId || null,
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe('Request ID Middleware', () => {
  it('should generate a request ID if none provided', async () => {
    const { requestIdMiddleware } = await import('../middleware/request-id.js');
    
    const req = createMockReq();
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    requestIdMiddleware(req, res, next);
    
    assert.ok(req.requestId, 'Should set requestId on request');
    assert.ok(res.headers['x-request-id'], 'Should set x-request-id header on response');
    assert.strictEqual(req.requestId, res.headers['x-request-id'], 'Request and response IDs should match');
    assert.ok(nextCalled, 'Should call next()');
  });
  
  it('should use existing request ID from header', async () => {
    const { requestIdMiddleware } = await import('../middleware/request-id.js');
    
    const existingId = 'existing-request-id-123';
    const req = createMockReq({
      headers: { 'x-request-id': existingId }
    });
    const res = createMockRes();
    const next = () => {};
    
    requestIdMiddleware(req, res, next);
    
    assert.strictEqual(req.requestId, existingId, 'Should use existing request ID');
    assert.strictEqual(res.headers['x-request-id'], existingId, 'Should set same ID on response');
  });
});

describe('Auth Middleware', () => {
  it('should set stub user when no auth header', async () => {
    const { authMiddleware } = await import('../middleware/auth.js');
    
    const req = createMockReq();
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    authMiddleware(req, res, next);
    
    assert.ok(req.user, 'Should set user on request');
    assert.ok(req.isAuthenticated, 'Should mark as authenticated');
    assert.ok(nextCalled, 'Should call next()');
  });
  
  it('should use dev user ID from header', async () => {
    const { authMiddleware } = await import('../middleware/auth.js');
    
    const devUserId = 'custom-dev-user';
    const req = createMockReq({
      headers: { 'x-dev-user-id': devUserId }
    });
    const res = createMockRes();
    const next = () => {};
    
    authMiddleware(req, res, next);
    
    assert.strictEqual(req.user.id, devUserId, 'Should use dev user ID');
    assert.ok(req.isAuthenticated, 'Should be authenticated');
  });
  
  it('should handle Bearer token auth header', async () => {
    const { authMiddleware } = await import('../middleware/auth.js');
    
    const req = createMockReq({
      headers: { 'authorization': 'Bearer some-jwt-token' }
    });
    const res = createMockRes();
    const next = () => {};
    
    authMiddleware(req, res, next);
    
    assert.ok(req.user, 'Should set user');
    assert.ok(req.isAuthenticated, 'Should be authenticated');
  });
});

describe('Tenant Context Middleware', () => {
  it('should extract tenant ID from x-tenant-id header', async () => {
    const { tenantContextMiddleware } = await import('../middleware/tenant-context.js');
    
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const req = createMockReq({
      headers: { 'x-tenant-id': tenantId },
      requestId: 'test-request'
    });
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    tenantContextMiddleware(req, res, next);
    
    assert.strictEqual(req.tenantId, tenantId, 'Should set tenantId on request');
    assert.ok(nextCalled, 'Should call next()');
  });
  
  it('should extract tenant ID from user object', async () => {
    const { tenantContextMiddleware } = await import('../middleware/tenant-context.js');
    
    const tenantId = '22222222-2222-2222-2222-222222222222';
    const req = createMockReq({
      user: { tenantId },
      requestId: 'test-request'
    });
    const res = createMockRes();
    const next = () => {};
    
    tenantContextMiddleware(req, res, next);
    
    assert.strictEqual(req.tenantId, tenantId, 'Should get tenantId from user');
  });
  
  it('should prioritize x-tenant-id header over user object', async () => {
    const { tenantContextMiddleware } = await import('../middleware/tenant-context.js');
    
    const headerTenantId = '11111111-1111-1111-1111-111111111111';
    const userTenantId = '22222222-2222-2222-2222-222222222222';
    const req = createMockReq({
      headers: { 'x-tenant-id': headerTenantId },
      user: { tenantId: userTenantId },
      requestId: 'test-request'
    });
    const res = createMockRes();
    const next = () => {};
    
    tenantContextMiddleware(req, res, next);
    
    assert.strictEqual(req.tenantId, headerTenantId, 'Should prioritize header over user');
  });
});

describe('Require Tenant Middleware', () => {
  it('should return 400 when no tenant ID', async () => {
    const { requireTenant } = await import('../middleware/tenant-context.js');
    
    const req = createMockReq({ requestId: 'test-request' });
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    requireTenant(req, res, next);
    
    assert.strictEqual(res.statusCode, 400, 'Should return 400');
    assert.strictEqual(res.body.error, 'BadRequest', 'Should have error message');
    assert.ok(!nextCalled, 'Should not call next()');
  });
  
  it('should call next when tenant ID present', async () => {
    const { requireTenant } = await import('../middleware/tenant-context.js');
    
    const req = createMockReq({
      tenantId: '11111111-1111-1111-1111-111111111111',
      requestId: 'test-request'
    });
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    requireTenant(req, res, next);
    
    assert.ok(nextCalled, 'Should call next()');
  });
});

describe('RBAC Middleware', () => {
  it('should allow access with matching role', async () => {
    const { requireRole } = await import('../middleware/rbac.js');
    
    const req = createMockReq({
      isAuthenticated: true,
      user: { roles: ['ADMIN'] },
      requestId: 'test-request'
    });
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    const middleware = requireRole('ADMIN');
    middleware(req, res, next);
    
    assert.ok(nextCalled, 'Should call next() for ADMIN role');
  });
  
  it('should allow access with higher role', async () => {
    const { requireRole } = await import('../middleware/rbac.js');
    
    const req = createMockReq({
      isAuthenticated: true,
      user: { roles: ['SUPER_ADMIN'] },
      requestId: 'test-request'
    });
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    const middleware = requireRole('ADMIN');
    middleware(req, res, next);
    
    assert.ok(nextCalled, 'Should allow SUPER_ADMIN for ADMIN requirement');
  });
  
  it('should deny access with lower role', async () => {
    const { requireRole } = await import('../middleware/rbac.js');
    
    const req = createMockReq({
      isAuthenticated: true,
      user: { roles: ['USER'] },
      requestId: 'test-request'
    });
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    const middleware = requireRole('ADMIN');
    middleware(req, res, next);
    
    assert.strictEqual(res.statusCode, 403, 'Should return 403 Forbidden');
    assert.ok(!nextCalled, 'Should not call next()');
  });
  
  it('should allow dev bypass with x-dev-role header', async () => {
    const { requireRole } = await import('../middleware/rbac.js');
    
    const req = createMockReq({
      headers: { 'x-dev-role': 'ADMIN' },
      isAuthenticated: true,
      user: { roles: ['USER'] },
      requestId: 'test-request'
    });
    const res = createMockRes();
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    
    const middleware = requireRole('ADMIN');
    middleware(req, res, next);
    
    // In dev mode with devBypassEnabled, this should work
    assert.ok(nextCalled, 'Should allow dev bypass with x-dev-role header');
  });
});

describe('Tenant ID Validation', () => {
  it('should validate correct UUID format', async () => {
    const { validateTenantId } = await import('../middleware/tenant-context.js');
    
    assert.ok(validateTenantId('11111111-1111-1111-1111-111111111111'), 'Should accept valid UUID');
    assert.ok(validateTenantId('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'), 'Should accept another valid UUID');
  });
  
  it('should reject invalid UUID format', async () => {
    const { validateTenantId } = await import('../middleware/tenant-context.js');
    
    assert.ok(!validateTenantId('not-a-uuid'), 'Should reject invalid format');
    assert.ok(!validateTenantId(''), 'Should reject empty string');
    assert.ok(!validateTenantId(null), 'Should reject null');
    assert.ok(!validateTenantId(undefined), 'Should reject undefined');
    assert.ok(!validateTenantId('1111111-1111-1111-1111-111111111111'), 'Should reject short UUID');
  });
});
