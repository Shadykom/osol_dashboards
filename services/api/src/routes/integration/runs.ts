/**
 * Ingestion Runs Routes
 * EPIC 5 - View and manage ingestion runs
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';

interface IngestionRun {
  id: string;
  tenant_id: string;
  source_system_id: string;
  source_system_code: string;
  source_system_name: string;
  mode: string;
  dataset: string;
  file_name: string | null;
  file_size_bytes: number | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  stats_json: Record<string, unknown>;
  error_message: string | null;
  triggered_by: string | null;
}

interface IngestionItem {
  id: string;
  run_id: string;
  external_ref: string;
  entity_type: string;
  entity_id: string | null;
  outcome: string;
  payload_hash: string;
  error_message: string | null;
  dq_issues_json: unknown[];
  processed_at: string;
}

interface ReconciliationSummary {
  id: string;
  run_id: string;
  total_received: number;
  total_inserted: number;
  total_updated: number;
  total_skipped: number;
  total_failed: number;
  dq_issues_count: number;
  reconciled_at: string;
}

export async function runsRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /integration/runs
   * List ingestion runs with filters
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { 
      dataset,
      status,
      source_system,
      mode,
      from_date,
      to_date,
      limit = 50, 
      offset = 0 
    } = request.query as { 
      dataset?: string;
      status?: string;
      source_system?: string;
      mode?: string;
      from_date?: string;
      to_date?: string;
      limit?: number;
      offset?: number;
    };
    
    let sql = `
      SELECT 
        ir.id, ir.tenant_id, ir.source_system_id,
        ss.code as source_system_code, ss.name as source_system_name,
        ir.mode, ir.dataset, ir.file_name, ir.file_size_bytes,
        ir.started_at, ir.ended_at, ir.status, ir.stats_json, ir.error_message, ir.triggered_by
      FROM integration.ingestion_runs ir
      JOIN mdm.source_systems ss ON ss.id = ir.source_system_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (dataset) {
      params.push(dataset.toUpperCase());
      sql += ` AND ir.dataset = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      sql += ` AND ir.status = $${params.length}`;
    }
    
    if (source_system) {
      params.push(source_system.toUpperCase());
      sql += ` AND ss.code = $${params.length}`;
    }
    
    if (mode) {
      params.push(mode.toUpperCase());
      sql += ` AND ir.mode = $${params.length}`;
    }
    
    if (from_date) {
      params.push(from_date);
      sql += ` AND ir.started_at >= $${params.length}`;
    }
    
    if (to_date) {
      params.push(to_date);
      sql += ` AND ir.started_at <= $${params.length}`;
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await queryWithTenant<{ total: number }>(request.tenantId, countSql, params);
    const total = countResult.rows[0]?.total || 0;
    
    // Add pagination
    sql += ` ORDER BY ir.started_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await queryWithTenant<IngestionRun>(request.tenantId, sql, params);
    
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
   * GET /integration/runs/:run_id
   * Get a single run with reconciliation summary
   */
  fastify.get('/:run_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { run_id } = request.params as { run_id: string };
    
    // Get run
    const runSql = `
      SELECT 
        ir.id, ir.tenant_id, ir.source_system_id,
        ss.code as source_system_code, ss.name as source_system_name,
        ir.mode, ir.dataset, ir.file_name, ir.file_size_bytes,
        ir.started_at, ir.ended_at, ir.status, ir.stats_json, ir.error_message, ir.triggered_by,
        ir.checksum
      FROM integration.ingestion_runs ir
      JOIN mdm.source_systems ss ON ss.id = ir.source_system_id
      WHERE ir.id = $1
    `;
    
    const runResult = await queryWithTenant<IngestionRun>(request.tenantId, runSql, [run_id]);
    
    if (runResult.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Ingestion run not found' },
      });
    }
    
    // Get reconciliation summary
    const reconcileSql = `
      SELECT id, run_id, total_received, total_inserted, total_updated, 
             total_skipped, total_failed, dq_issues_count, reconciled_at
      FROM integration.reconciliation_summary
      WHERE run_id = $1
    `;
    
    const reconcileResult = await queryWithTenant<ReconciliationSummary>(request.tenantId, reconcileSql, [run_id]);
    
    // Get outcome breakdown
    const breakdownSql = `
      SELECT outcome, COUNT(*) as count
      FROM integration.ingestion_items
      WHERE run_id = $1
      GROUP BY outcome
    `;
    
    const breakdownResult = await queryWithTenant<{ outcome: string; count: number }>(
      request.tenantId, breakdownSql, [run_id]
    );
    
    const outcomeBreakdown = breakdownResult.rows.reduce((acc, row) => {
      acc[row.outcome] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);
    
    return reply.send({
      success: true,
      data: {
        run: runResult.rows[0],
        reconciliation: reconcileResult.rows[0] || null,
        outcomeBreakdown,
      },
    });
  });

  /**
   * GET /integration/runs/:run_id/items
   * Get items for a run
   */
  fastify.get('/:run_id/items', async (request: FastifyRequest, reply: FastifyReply) => {
    const { run_id } = request.params as { run_id: string };
    const { 
      outcome,
      has_errors,
      limit = 100, 
      offset = 0 
    } = request.query as { 
      outcome?: string;
      has_errors?: string;
      limit?: number;
      offset?: number;
    };
    
    let sql = `
      SELECT 
        id, run_id, external_ref, entity_type, entity_id, outcome,
        payload_hash, error_message, error_details_json, dq_issues_json, processed_at
      FROM integration.ingestion_items
      WHERE run_id = $1
    `;
    const params: unknown[] = [run_id];
    
    if (outcome) {
      params.push(outcome.toUpperCase());
      sql += ` AND outcome = $${params.length}`;
    }
    
    if (has_errors === 'true') {
      sql += ` AND (error_message IS NOT NULL OR jsonb_array_length(dq_issues_json) > 0)`;
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await queryWithTenant<{ total: number }>(request.tenantId, countSql, params);
    const total = countResult.rows[0]?.total || 0;
    
    // Add pagination
    sql += ` ORDER BY processed_at LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await queryWithTenant<IngestionItem>(request.tenantId, sql, params);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        total,
        count: result.rowCount,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  });

  /**
   * GET /integration/runs/:run_id/errors
   * Get only error items for a run
   */
  fastify.get('/:run_id/errors', async (request: FastifyRequest, reply: FastifyReply) => {
    const { run_id } = request.params as { run_id: string };
    
    const sql = `
      SELECT 
        id, external_ref, entity_type, outcome, error_message, 
        error_details_json, dq_issues_json, processed_at
      FROM integration.ingestion_items
      WHERE run_id = $1 AND (outcome = 'FAILED' OR error_message IS NOT NULL)
      ORDER BY processed_at
    `;
    
    const result = await queryWithTenant<IngestionItem>(request.tenantId, sql, [run_id]);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        count: result.rowCount,
      },
    });
  });

  /**
   * GET /integration/runs/:run_id/errors/csv
   * Download errors as CSV
   */
  fastify.get('/:run_id/errors/csv', async (request: FastifyRequest, reply: FastifyReply) => {
    const { run_id } = request.params as { run_id: string };
    
    const sql = `
      SELECT 
        external_ref, entity_type, outcome, error_message, 
        dq_issues_json::text as dq_issues, processed_at
      FROM integration.ingestion_items
      WHERE run_id = $1 AND (outcome = 'FAILED' OR error_message IS NOT NULL)
      ORDER BY processed_at
    `;
    
    const result = await queryWithTenant<{
      external_ref: string;
      entity_type: string;
      outcome: string;
      error_message: string;
      dq_issues: string;
      processed_at: string;
    }>(request.tenantId, sql, [run_id]);
    
    // Generate CSV
    const headers = ['External Ref', 'Entity Type', 'Outcome', 'Error Message', 'DQ Issues', 'Processed At'];
    const rows = result.rows.map(row => [
      row.external_ref,
      row.entity_type,
      row.outcome,
      row.error_message || '',
      row.dq_issues || '[]',
      row.processed_at,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    
    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="errors-${run_id}.csv"`)
      .send(csvContent);
  });

  /**
   * GET /integration/runs/stats
   * Get aggregated stats across runs
   */
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const { days = 30 } = request.query as { days?: number };
    
    const sql = `
      SELECT 
        dataset,
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
        COUNT(*) FILTER (WHERE status = 'partial') as partial_runs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
        SUM((stats_json->>'total_received')::int) as total_records,
        SUM((stats_json->>'total_inserted')::int) as total_inserted,
        SUM((stats_json->>'total_updated')::int) as total_updated,
        SUM((stats_json->>'total_skipped')::int) as total_skipped,
        SUM((stats_json->>'total_failed')::int) as total_failed
      FROM integration.ingestion_runs
      WHERE started_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY dataset
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [days]);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        periodDays: days,
      },
    });
  });
}
