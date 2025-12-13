/**
 * CMS Common Types
 * Multi-tenant foundation types for EPIC 1
 */

// ============================================================================
// Tenant Types
// ============================================================================

export interface Tenant {
  id: string; // UUID
  name: string;
  slug: string;
  status: TenantStatus;
  config: TenantConfig;
  createdAt: Date;
  updatedAt: Date;
}

export type TenantStatus = 'active' | 'suspended' | 'pending' | 'inactive';

export interface TenantConfig {
  features: FeatureFlags;
  branding?: TenantBranding;
  locale?: LocaleConfig;
  limits?: TenantLimits;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface LocaleConfig {
  defaultLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  dateFormat: string;
  currency: string;
}

export interface TenantLimits {
  maxUsers?: number;
  maxCases?: number;
  maxStorage?: number; // bytes
}

// ============================================================================
// User Types (RBAC Placeholder for EPIC 1)
// ============================================================================

export interface User {
  id: string; // UUID
  tenantId: string; // UUID - REQUIRED for multi-tenancy
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'super_admin'     // System-wide admin (SaaS only)
  | 'tenant_admin'    // Tenant administrator
  | 'manager'         // Collection manager
  | 'officer'         // Collection officer
  | 'supervisor'      // Team supervisor
  | 'readonly';       // Read-only access

export type UserStatus = 'active' | 'inactive' | 'pending' | 'locked';

// ============================================================================
// Request Context Types
// ============================================================================

export interface RequestContext {
  requestId: string;
  correlationId?: string;
  tenantId: string;
  userId?: string;
  userRole?: UserRole;
  permissions?: string[];
  timestamp: Date;
  source?: string;
}

export interface AuthPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  exp: number;
  iat: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string; // Only in development
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
}

export interface ReadyStatus extends HealthStatus {
  checks: {
    database: ComponentHealth;
    [key: string]: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'up' | 'down';
  latency?: number; // ms
  message?: string;
}

// ============================================================================
// Database Types
// ============================================================================

export interface BaseEntity {
  id: string; // UUID
  tenantId: string; // UUID - REQUIRED for all tenant tables
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditableEntity extends BaseEntity {
  createdBy: string; // User ID
  updatedBy: string; // User ID
}

// ============================================================================
// Environment Types
// ============================================================================

export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  env: Environment;
  port: number;
  host: string;
  logLevel: LogLevel;
  database: DatabaseConfig;
  defaultTenantForDev?: string;
}

export interface DatabaseConfig {
  url: string;
  poolMin: number;
  poolMax: number;
  ssl: boolean;
}

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
