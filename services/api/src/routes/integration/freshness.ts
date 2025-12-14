/**
 * Data Freshness Routes
 * EPIC 5 - Data freshness monitoring
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';

interface DataFreshness {
  id: string;
  tenant_id: string;
  source_system_id: string;
  source_system_code: string;
  source_system_name: string;
  dataset: string;
  last_success_at: string | null;
  last_run_id: string | null;
  last_status: string | null;
  record_count: number;
  average_run_duration_ms: number | null;
  notes: string | null;
  updated_at: string;
}

export async function freshnessRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /integration/freshness
   * Get data freshness overview for all datasets
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { dataset, source_system } = request.query as { 
      dataset?: string;
      source_system?: string;
    };
    
    let sql = `
      SELECT 
        df.id, df.tenant_id, df.source_system_id,
        ss.code as source_system_code, ss.name as source_system_name,
        df.dataset, df.last_success_at, df.last_run_id, df.last_status,
        df.record_count, df.average_run_duration_ms, df.notes, df.updated_at,
        CASE 
          WHEN df.last_success_at IS NULL THEN 'never'
          WHEN df.last_success_at < NOW() - INTERVAL '24 hours' THEN 'stale'
          WHEN df.last_success_at < NOW() - INTERVAL '1 hour' THEN 'aging'
          ELSE 'fresh'
        END as freshness_status,
        EXTRACT(EPOCH FROM (NOW() - df.last_success_at))::integer as seconds_since_success
      FROM integration.data_freshness df
      JOIN mdm.source_systems ss ON ss.id = df.source_system_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (dataset) {
      params.push(dataset.toUpperCase());
      sql += ` AND df.dataset = $${params.length}`;
    }
    
    if (source_system) {
      params.push(source_system.toUpperCase());
      sql += ` AND ss.code = $${params.length}`;
    }
    
    sql += ' ORDER BY df.dataset, ss.code';
    
    const result = await queryWithTenant<DataFreshness & { freshness_status: string; seconds_since_success: number }>(
      request.tenantId, sql, params
    );
    
    // Calculate overall health
    const totalDatasets = result.rowCount;
    const freshCount = result.rows.filter(r => r.freshness_status === 'fresh').length;
    const staleCount = result.rows.filter(r => r.freshness_status === 'stale' || r.freshness_status === 'never').length;
    
    const overallHealth = totalDatasets === 0 
      ? 'unknown'
      : staleCount === 0 
        ? 'healthy'
        : staleCount < totalDatasets / 2 
          ? 'degraded'
          : 'critical';
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        count: result.rowCount,
        overallHealth,
        summary: {
          total: totalDatasets,
          fresh: freshCount,
          aging: result.rows.filter(r => r.freshness_status === 'aging').length,
          stale: result.rows.filter(r => r.freshness_status === 'stale').length,
          never: result.rows.filter(r => r.freshness_status === 'never').length,
        },
        requestId: request.requestId,
      },
    });
  });

  /**
   * GET /integration/freshness/:dataset
   * Get freshness for a specific dataset across all sources
   */
  fastify.get('/:dataset', async (request: FastifyRequest, reply: FastifyReply) => {
    const { dataset } = request.params as { dataset: string };
    
    const sql = `
      SELECT 
        df.id, df.source_system_id,
        ss.code as source_system_code, ss.name as source_system_name,
        df.last_success_at, df.last_run_id, df.last_status,
        df.record_count, df.average_run_duration_ms, df.notes, df.updated_at,
        ir.stats_json as last_run_stats,
        EXTRACT(EPOCH FROM (NOW() - df.last_success_at))::integer as seconds_since_success
      FROM integration.data_freshness df
      JOIN mdm.source_systems ss ON ss.id = df.source_system_id
      LEFT JOIN integration.ingestion_runs ir ON ir.id = df.last_run_id
      WHERE df.dataset = $1
      ORDER BY ss.code
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [dataset.toUpperCase()]);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        dataset: dataset.toUpperCase(),
        count: result.rowCount,
      },
    });
  });

  /**
   * GET /integration/freshness/timeline
   * Get freshness timeline (recent runs)
   */
  fastify.get('/timeline', async (request: FastifyRequest, reply: FastifyReply) => {
    const { days = 7, dataset, source_system } = request.query as { 
      days?: number;
      dataset?: string;
      source_system?: string;
    };
    
    let sql = `
      SELECT 
        DATE(ir.started_at) as date,
        ir.dataset,
        ss.code as source_system_code,
        COUNT(*) as run_count,
        COUNT(*) FILTER (WHERE ir.status = 'success') as success_count,
        COUNT(*) FILTER (WHERE ir.status = 'partial') as partial_count,
        COUNT(*) FILTER (WHERE ir.status = 'failed') as failed_count,
        SUM((ir.stats_json->>'total_received')::int) as total_records
      FROM integration.ingestion_runs ir
      JOIN mdm.source_systems ss ON ss.id = ir.source_system_id
      WHERE ir.started_at >= NOW() - INTERVAL '1 day' * $1
    `;
    const params: unknown[] = [days];
    
    if (dataset) {
      params.push(dataset.toUpperCase());
      sql += ` AND ir.dataset = $${params.length}`;
    }
    
    if (source_system) {
      params.push(source_system.toUpperCase());
      sql += ` AND ss.code = $${params.length}`;
    }
    
    sql += ' GROUP BY DATE(ir.started_at), ir.dataset, ss.code ORDER BY date DESC, ir.dataset, ss.code';
    
    const result = await queryWithTenant(request.tenantId, sql, params);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        days,
        count: result.rowCount,
      },
    });
  });

  /**
   * POST /integration/freshness/:dataset/:source_system/notes
   * Add notes to a freshness record
   */
  fastify.post('/:dataset/:source_system/notes', async (request: FastifyRequest, reply: FastifyReply) => {
    const { dataset, source_system } = request.params as { dataset: string; source_system: string };
    const { notes } = request.body as { notes: string };
    
    const sql = `
      UPDATE integration.data_freshness df
      SET notes = $3
      FROM mdm.source_systems ss
      WHERE df.source_system_id = ss.id
        AND df.dataset = $1
        AND ss.code = $2
        AND df.tenant_id = ss.tenant_id
      RETURNING df.id
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [dataset.toUpperCase(), source_system.toUpperCase(), notes]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Freshness record not found' },
      });
    }
    
    return reply.send({
      success: true,
      message: 'Notes updated',
    });
  });
}
