/**
 * Audit Service
 * EPIC 5 - Audit logging for MDM and Integration operations
 */

import { queryWithTenant } from '../db/index.js';

interface AuditEventParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  tenantId: string,
  params: AuditEventParams
): Promise<string | null> {
  const {
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    metadata,
    userId,
    requestId,
    ipAddress,
    userAgent,
  } = params;

  try {
    // Try to use the existing audit_log table from EPIC 1
    const sql = `
      INSERT INTO audit_log (
        tenant_id, user_id, action, resource_type, resource_id,
        old_values, new_values, metadata, request_id, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const result = await queryWithTenant<{ id: string }>(tenantId, sql, [
      tenantId,
      userId || null,
      action,
      resourceType,
      resourceId || null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      metadata ? JSON.stringify(metadata) : '{}',
      requestId || null,
      ipAddress || null,
      userAgent || null,
    ]);

    return result.rows[0]?.id || null;
  } catch (error) {
    // If audit table doesn't exist or fails, log to console but don't fail the operation
    console.error('Failed to log audit event:', error);
    return null;
  }
}

/**
 * Log an integration audit event
 */
export async function logIntegrationAuditEvent(
  tenantId: string,
  params: {
    action: 'INGESTION_START' | 'INGESTION_COMPLETE' | 'INGESTION_FAILED' | 'MAPPING_UPDATE' | 'CONFIG_UPDATE';
    runId?: string;
    dataset?: string;
    sourceSystem?: string;
    stats?: Record<string, unknown>;
    errorMessage?: string;
    userId?: string;
    requestId?: string;
  }
): Promise<string | null> {
  const metadata = {
    run_id: params.runId,
    dataset: params.dataset,
    source_system: params.sourceSystem,
    stats: params.stats,
    error_message: params.errorMessage,
  };

  return logAuditEvent(tenantId, {
    action: params.action,
    resourceType: 'integration',
    resourceId: params.runId,
    metadata,
    userId: params.userId,
    requestId: params.requestId,
  });
}

/**
 * Get audit history for a resource
 */
export async function getAuditHistory(
  tenantId: string,
  resourceType: string,
  resourceId: string,
  limit: number = 50
): Promise<Record<string, unknown>[]> {
  try {
    const sql = `
      SELECT id, user_id, action, old_values, new_values, metadata, created_at
      FROM audit_log
      WHERE resource_type = $1 AND resource_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await queryWithTenant(tenantId, sql, [resourceType, resourceId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Failed to get audit history:', error);
    return [];
  }
}
