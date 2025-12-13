/**
 * CMS Request Context Module
 * Async local storage for request-scoped context
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { RequestContext, UserRole } from '../types/index.js';

// ============================================================================
// Async Local Storage Instance
// ============================================================================

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

// ============================================================================
// Context Management
// ============================================================================

/**
 * Run a function within a request context
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Run an async function within a request context
 */
export async function runWithContextAsync<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Get the current request context
 */
export function getContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Get the current request context, throwing if not available
 */
export function getRequiredContext(): RequestContext {
  const context = asyncLocalStorage.getStore();
  if (!context) {
    throw new Error('Request context not available');
  }
  return context;
}

// ============================================================================
// Context Accessors
// ============================================================================

/**
 * Get the current tenant ID
 */
export function getCurrentTenantId(): string | undefined {
  return getContext()?.tenantId;
}

/**
 * Get the current tenant ID, throwing if not available
 */
export function getRequiredTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new Error('Tenant ID not available in current context');
  }
  return tenantId;
}

/**
 * Get the current user ID
 */
export function getCurrentUserId(): string | undefined {
  return getContext()?.userId;
}

/**
 * Get the current request ID
 */
export function getRequestId(): string | undefined {
  return getContext()?.requestId;
}

/**
 * Get the current user role
 */
export function getCurrentUserRole(): UserRole | undefined {
  return getContext()?.userRole;
}

/**
 * Get current user permissions
 */
export function getCurrentPermissions(): string[] {
  return getContext()?.permissions || [];
}

// ============================================================================
// Context Factory
// ============================================================================

export interface CreateContextOptions {
  tenantId: string;
  userId?: string;
  userRole?: UserRole;
  permissions?: string[];
  requestId?: string;
  correlationId?: string;
  source?: string;
}

/**
 * Create a new request context
 */
export function createContext(options: CreateContextOptions): RequestContext {
  return {
    requestId: options.requestId || randomUUID(),
    correlationId: options.correlationId,
    tenantId: options.tenantId,
    userId: options.userId,
    userRole: options.userRole,
    permissions: options.permissions || [],
    timestamp: new Date(),
    source: options.source,
  };
}

/**
 * Create a minimal context for background jobs/tasks
 */
export function createBackgroundContext(
  tenantId: string,
  source = 'background-job'
): RequestContext {
  return {
    requestId: randomUUID(),
    tenantId,
    timestamp: new Date(),
    source,
  };
}

// ============================================================================
// Context Utilities
// ============================================================================

/**
 * Clone and modify the current context
 */
export function withContext(
  updates: Partial<Omit<RequestContext, 'requestId' | 'timestamp'>>
): RequestContext {
  const current = getContext();
  if (!current) {
    throw new Error('No current context to modify');
  }
  return {
    ...current,
    ...updates,
  };
}

/**
 * Check if running within a request context
 */
export function hasContext(): boolean {
  return asyncLocalStorage.getStore() !== undefined;
}

/**
 * Extract context headers for downstream service calls
 */
export function getContextHeaders(): Record<string, string> {
  const context = getContext();
  if (!context) {
    return {};
  }

  const headers: Record<string, string> = {
    'x-request-id': context.requestId,
  };

  if (context.correlationId) {
    headers['x-correlation-id'] = context.correlationId;
  }

  if (context.tenantId) {
    headers['x-tenant-id'] = context.tenantId;
  }

  return headers;
}
