/**
 * CMS Error Handling Module
 * Standardized error types and handling utilities
 */

import type { ApiError } from '../types/index.js';

// ============================================================================
// Base Error Classes
// ============================================================================

export abstract class CMSError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly details?: Record<string, unknown>;
  readonly timestamp: Date;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  toApiError(includeStack = false): ApiError {
    const error: ApiError = {
      code: this.code,
      message: this.message,
      details: this.details,
    };

    if (includeStack && this.stack) {
      error.stack = this.stack;
    }

    return error;
  }
}

// ============================================================================
// HTTP Error Classes
// ============================================================================

export class BadRequestError extends CMSError {
  readonly code = 'BAD_REQUEST';
  readonly statusCode = 400;
}

export class UnauthorizedError extends CMSError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class ForbiddenError extends CMSError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message = 'Access denied', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class NotFoundError extends CMSError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, { resource, id });
  }
}

export class ConflictError extends CMSError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;
}

export class ValidationError extends CMSError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 422;

  constructor(message: string, validationErrors?: Record<string, string[]>) {
    super(message, { validationErrors });
  }
}

export class RateLimitError extends CMSError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(retryAfter?: number) {
    super('Too many requests', { retryAfter });
  }
}

export class InternalServerError extends CMSError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = 500;

  constructor(message = 'An unexpected error occurred') {
    super(message);
  }
}

export class ServiceUnavailableError extends CMSError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly statusCode = 503;

  constructor(message = 'Service temporarily unavailable') {
    super(message);
  }
}

// ============================================================================
// Domain-Specific Error Classes
// ============================================================================

export class TenantNotFoundError extends CMSError {
  readonly code = 'TENANT_NOT_FOUND';
  readonly statusCode = 404;

  constructor(tenantId?: string) {
    super(
      tenantId 
        ? `Tenant '${tenantId}' not found`
        : 'Tenant not specified',
      { tenantId }
    );
  }
}

export class TenantRequiredError extends CMSError {
  readonly code = 'TENANT_REQUIRED';
  readonly statusCode = 400;

  constructor() {
    super('Tenant ID is required for this operation');
  }
}

export class TenantSuspendedError extends CMSError {
  readonly code = 'TENANT_SUSPENDED';
  readonly statusCode = 403;

  constructor(tenantId: string) {
    super(`Tenant '${tenantId}' is suspended`, { tenantId });
  }
}

export class DatabaseError extends CMSError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(message: string, originalError?: Error) {
    super(message, { 
      originalError: originalError?.message 
    });
  }
}

export class ConfigurationError extends CMSError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 500;

  constructor(message: string, configKey?: string) {
    super(message, { configKey });
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

export function isCMSError(error: unknown): error is CMSError {
  return error instanceof CMSError;
}

export function isHttpError(error: unknown): error is CMSError {
  return error instanceof CMSError && typeof error.statusCode === 'number';
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

export function normalizeError(error: unknown): CMSError {
  if (error instanceof CMSError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message);
  }

  if (typeof error === 'string') {
    return new InternalServerError(error);
  }

  return new InternalServerError('An unknown error occurred');
}

export function getHttpStatusCode(error: unknown): number {
  if (error instanceof CMSError) {
    return error.statusCode;
  }
  return 500;
}

export function formatErrorForResponse(
  error: unknown,
  includeStack = false
): ApiError {
  const cmsError = normalizeError(error);
  return cmsError.toApiError(includeStack);
}

// ============================================================================
// Async Error Wrapper
// ============================================================================

export type AsyncHandler<T = void> = () => Promise<T>;

export async function tryCatch<T>(
  fn: AsyncHandler<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof CMSError) {
      throw error;
    }
    throw new InternalServerError(
      errorMessage || (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}
