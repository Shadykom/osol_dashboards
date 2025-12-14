/**
 * Data Quality Routes
 * EPIC 5 - MDM Data Quality Issues Management
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';

interface DataQualityIssue {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  severity: string;
  rule_code: string;
  rule_name: string | null;
  message: string;
  details_json: Record<string, unknown>;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DQSummary {
  entity_type: string;
  severity: string;
  count: number;
}

export async function dataQualityRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /mdm/data-quality/issues
   * List data quality issues with filters
   */
  fastify.get('/issues', async (request: FastifyRequest, reply: FastifyReply) => {
    const { 
      entity_type,
      entity_id,
      severity,
      rule_code,
      status = 'open',
      limit = 50, 
      offset = 0 
    } = request.query as { 
      entity_type?: string;
      entity_id?: string;
      severity?: string;
      rule_code?: string;
      status?: string;
      limit?: number;
      offset?: number;
    };
    
    let sql = `
      SELECT 
        dq.id, dq.tenant_id, dq.entity_type, dq.entity_id, dq.severity,
        dq.rule_code, dq.rule_name, dq.message, dq.details_json,
        dq.status, dq.resolved_at, dq.resolved_by, dq.created_at, dq.updated_at,
        CASE 
          WHEN dq.entity_type = 'PARTY' THEN (SELECT primary_name FROM mdm.party_golden WHERE party_id = dq.entity_id)
          WHEN dq.entity_type = 'CONTRACT' THEN (SELECT contract_number FROM mdm.contract_golden WHERE contract_id = dq.entity_id)
          ELSE NULL
        END as entity_name
      FROM mdm.data_quality_issues dq
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (entity_type) {
      params.push(entity_type.toUpperCase());
      sql += ` AND dq.entity_type = $${params.length}`;
    }
    
    if (entity_id) {
      params.push(entity_id);
      sql += ` AND dq.entity_id = $${params.length}`;
    }
    
    if (severity) {
      params.push(severity);
      sql += ` AND dq.severity = $${params.length}`;
    }
    
    if (rule_code) {
      params.push(rule_code);
      sql += ` AND dq.rule_code = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      sql += ` AND dq.status = $${params.length}`;
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await queryWithTenant<{ total: number }>(request.tenantId, countSql, params);
    const total = countResult.rows[0]?.total || 0;
    
    // Add sorting and pagination
    sql += ` ORDER BY 
      CASE dq.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
      dq.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await queryWithTenant<DataQualityIssue & { entity_name: string | null }>(
      request.tenantId, sql, params
    );
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        total,
        count: result.rowCount,
        limit: Number(limit),
        offset: Number(offset),
        requestId: request.requestId,
      },
    });
  });

  /**
   * GET /mdm/data-quality/summary
   * Get summary of DQ issues by entity type and severity
   */
  fastify.get('/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const { status = 'open' } = request.query as { status?: string };
    
    const sql = `
      SELECT 
        entity_type,
        severity,
        COUNT(*) as count
      FROM mdm.data_quality_issues
      WHERE status = $1
      GROUP BY entity_type, severity
      ORDER BY entity_type, 
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END
    `;
    
    const result = await queryWithTenant<DQSummary>(request.tenantId, sql, [status]);
    
    // Transform to nested structure
    const summary: Record<string, Record<string, number>> = {};
    let totalCount = 0;
    
    for (const row of result.rows) {
      if (!summary[row.entity_type]) {
        summary[row.entity_type] = {};
      }
      summary[row.entity_type][row.severity] = Number(row.count);
      totalCount += Number(row.count);
    }
    
    return reply.send({
      success: true,
      data: {
        byEntityType: summary,
        total: totalCount,
      },
    });
  });

  /**
   * GET /mdm/data-quality/rules
   * Get list of DQ rules (from reference data)
   */
  fastify.get('/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    const sql = `
      SELECT code, name_ar, name_en, extra_json
      FROM mdm.reference_data
      WHERE domain = 'DQ_RULE' AND status = 'active'
      ORDER BY sort_order, code
    `;
    
    const result = await queryWithTenant(request.tenantId, sql);
    
    return reply.send({
      success: true,
      data: result.rows,
    });
  });

  /**
   * GET /mdm/data-quality/issues/:id
   * Get a single DQ issue
   */
  fastify.get('/issues/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    const sql = `
      SELECT 
        dq.id, dq.tenant_id, dq.entity_type, dq.entity_id, dq.severity,
        dq.rule_code, dq.rule_name, dq.message, dq.details_json,
        dq.status, dq.resolved_at, dq.resolved_by, dq.created_at, dq.updated_at
      FROM mdm.data_quality_issues dq
      WHERE dq.id = $1
    `;
    
    const result = await queryWithTenant<DataQualityIssue>(request.tenantId, sql, [id]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'DQ issue not found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * PATCH /mdm/data-quality/issues/:id
   * Update DQ issue status (resolve, ignore, etc.)
   */
  fastify.patch('/issues/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      status?: 'open' | 'resolved' | 'ignored' | 'in_progress';
    };
    
    if (!body.status) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'status is required' },
      });
    }
    
    const resolvedAt = body.status === 'resolved' ? 'NOW()' : 'NULL';
    const resolvedBy = body.status === 'resolved' ? `'${request.userId}'` : 'NULL';
    
    const sql = `
      UPDATE mdm.data_quality_issues
      SET status = $1, 
          resolved_at = ${body.status === 'resolved' ? 'NOW()' : 'NULL'},
          resolved_by = ${body.status === 'resolved' ? '$3' : 'NULL'}
      WHERE id = $2
      RETURNING id, tenant_id, entity_type, entity_id, severity,
                rule_code, rule_name, message, details_json,
                status, resolved_at, resolved_by, created_at, updated_at
    `;
    
    const params = body.status === 'resolved' 
      ? [body.status, id, request.userId || null]
      : [body.status, id];
    
    const result = await queryWithTenant<DataQualityIssue>(request.tenantId, sql, params);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'DQ issue not found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * POST /mdm/data-quality/issues/bulk-resolve
   * Bulk resolve multiple DQ issues
   */
  fastify.post('/issues/bulk-resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    const { issue_ids, status = 'resolved' } = request.body as { 
      issue_ids: string[]; 
      status?: 'resolved' | 'ignored';
    };
    
    if (!issue_ids || !Array.isArray(issue_ids) || issue_ids.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'issue_ids array is required' },
      });
    }
    
    const sql = `
      UPDATE mdm.data_quality_issues
      SET status = $1,
          resolved_at = NOW(),
          resolved_by = $2
      WHERE id = ANY($3)
      RETURNING id
    `;
    
    const result = await queryWithTenant(
      request.tenantId, 
      sql, 
      [status, request.userId || null, issue_ids]
    );
    
    return reply.send({
      success: true,
      data: {
        updated: result.rowCount,
        ids: result.rows.map((r: any) => r.id),
      },
    });
  });
}
