/**
 * Party Routes
 * EPIC 5 - MDM Party Golden Records
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';

interface PartyGolden {
  party_id: string;
  tenant_id: string;
  party_type: string;
  primary_name: string;
  primary_name_ar: string | null;
  identifiers_json: unknown[];
  attributes_json: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PartyContact {
  id: string;
  party_id: string;
  contact_type: string;
  value: string;
  is_primary: boolean;
  is_verified: boolean;
  source_system_id: string | null;
  effective_at: string;
}

interface PartySourceMap {
  id: string;
  source_system_id: string;
  source_system_code: string;
  source_system_name: string;
  external_party_ref: string;
  payload_hash: string;
  confidence_score: number;
  match_method: string | null;
  effective_at: string;
  last_seen_at: string;
}

interface DataQualityIssue {
  id: string;
  severity: string;
  rule_code: string;
  rule_name: string | null;
  message: string;
  status: string;
  created_at: string;
}

export async function partyRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /mdm/parties
   * Search and list parties
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { 
      search, 
      party_type, 
      status, 
      identifier,
      limit = 50, 
      offset = 0 
    } = request.query as { 
      search?: string; 
      party_type?: string;
      status?: string;
      identifier?: string;
      limit?: number;
      offset?: number;
    };
    
    let sql = `
      SELECT 
        pg.party_id, pg.tenant_id, pg.party_type, pg.primary_name, pg.primary_name_ar,
        pg.identifiers_json, pg.attributes_json, pg.status, pg.created_at, pg.updated_at,
        (SELECT COUNT(*) FROM mdm.data_quality_issues dq 
         WHERE dq.entity_id = pg.party_id AND dq.entity_type = 'PARTY' AND dq.status = 'open') as dq_issue_count,
        (SELECT COUNT(*) FROM mdm.party_source_map psm WHERE psm.party_id = pg.party_id) as source_count
      FROM mdm.party_golden pg
      WHERE pg.status != 'deleted'
    `;
    const params: unknown[] = [];
    
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (pg.primary_name ILIKE $${params.length} OR pg.primary_name_ar ILIKE $${params.length})`;
    }
    
    if (party_type) {
      params.push(party_type.toUpperCase());
      sql += ` AND pg.party_type = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      sql += ` AND pg.status = $${params.length}`;
    }
    
    if (identifier) {
      params.push(`%${identifier}%`);
      sql += ` AND pg.identifiers_json::text ILIKE $${params.length}`;
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await queryWithTenant<{ total: number }>(request.tenantId, countSql, params);
    const total = countResult.rows[0]?.total || 0;
    
    // Add pagination
    sql += ` ORDER BY pg.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await queryWithTenant<PartyGolden & { dq_issue_count: number; source_count: number }>(
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
   * GET /mdm/parties/:party_id
   * Get a single party with full details (golden record + contacts + DQ issues)
   */
  fastify.get('/:party_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { party_id } = request.params as { party_id: string };
    
    // Get party golden record
    const partySql = `
      SELECT party_id, tenant_id, party_type, primary_name, primary_name_ar,
             identifiers_json, attributes_json, status, merge_target_id, created_at, updated_at
      FROM mdm.party_golden
      WHERE party_id = $1
    `;
    
    const partyResult = await queryWithTenant<PartyGolden>(request.tenantId, partySql, [party_id]);
    
    if (partyResult.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Party not found' },
      });
    }
    
    const party = partyResult.rows[0];
    
    // Get contacts
    const contactsSql = `
      SELECT id, party_id, contact_type, value, is_primary, is_verified, 
             source_system_id, extra_json, effective_at, created_at
      FROM mdm.party_contacts
      WHERE party_id = $1
      ORDER BY is_primary DESC, contact_type, effective_at DESC
    `;
    
    const contactsResult = await queryWithTenant<PartyContact>(request.tenantId, contactsSql, [party_id]);
    
    // Get DQ issues
    const dqSql = `
      SELECT id, severity, rule_code, rule_name, message, details_json, status, created_at
      FROM mdm.data_quality_issues
      WHERE entity_type = 'PARTY' AND entity_id = $1
      ORDER BY 
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
        created_at DESC
    `;
    
    const dqResult = await queryWithTenant<DataQualityIssue>(request.tenantId, dqSql, [party_id]);
    
    return reply.send({
      success: true,
      data: {
        ...party,
        contacts: contactsResult.rows,
        dq_issues: dqResult.rows,
      },
    });
  });

  /**
   * GET /mdm/parties/:party_id/sources
   * Get all source mappings for a party (traceability)
   */
  fastify.get('/:party_id/sources', async (request: FastifyRequest, reply: FastifyReply) => {
    const { party_id } = request.params as { party_id: string };
    
    const sql = `
      SELECT 
        psm.id, psm.source_system_id, ss.code as source_system_code, ss.name as source_system_name,
        psm.external_party_ref, psm.payload_hash, psm.confidence_score, psm.match_method,
        psm.effective_at, psm.last_seen_at,
        (SELECT payload_json FROM mdm.party_source_record psr 
         WHERE psr.source_system_id = psm.source_system_id 
         AND psr.external_party_ref = psm.external_party_ref
         ORDER BY psr.ingested_at DESC LIMIT 1) as latest_payload
      FROM mdm.party_source_map psm
      JOIN mdm.source_systems ss ON ss.id = psm.source_system_id
      WHERE psm.party_id = $1
      ORDER BY psm.last_seen_at DESC
    `;
    
    const result = await queryWithTenant<PartySourceMap & { latest_payload: unknown }>(
      request.tenantId, sql, [party_id]
    );
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        count: result.rowCount,
      },
    });
  });

  /**
   * GET /mdm/parties/:party_id/contracts
   * Get all contracts for a party
   */
  fastify.get('/:party_id/contracts', async (request: FastifyRequest, reply: FastifyReply) => {
    const { party_id } = request.params as { party_id: string };
    
    const sql = `
      SELECT 
        cg.contract_id, cg.product_code, cg.contract_number, cg.secured_flag,
        cg.status, cg.contract_keys_json, cg.attributes_json,
        cg.start_date, cg.end_date, cg.created_at, cg.updated_at
      FROM mdm.contract_golden cg
      WHERE cg.party_id = $1
      ORDER BY cg.created_at DESC
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [party_id]);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        count: result.rowCount,
      },
    });
  });

  /**
   * GET /mdm/parties/:party_id/history
   * Get source record history for a party
   */
  fastify.get('/:party_id/history', async (request: FastifyRequest, reply: FastifyReply) => {
    const { party_id } = request.params as { party_id: string };
    const { limit = 20 } = request.query as { limit?: number };
    
    const sql = `
      SELECT 
        psr.id, psr.source_system_id, ss.code as source_system_code,
        psr.external_party_ref, psr.payload_json, psr.payload_hash,
        psr.ingestion_run_id, psr.ingested_at
      FROM mdm.party_source_record psr
      JOIN mdm.source_systems ss ON ss.id = psr.source_system_id
      JOIN mdm.party_source_map psm ON psm.source_system_id = psr.source_system_id 
        AND psm.external_party_ref = psr.external_party_ref
      WHERE psm.party_id = $1
      ORDER BY psr.ingested_at DESC
      LIMIT $2
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [party_id, limit]);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        count: result.rowCount,
      },
    });
  });

  /**
   * PATCH /mdm/parties/:party_id
   * Update party golden record (manual corrections)
   */
  fastify.patch('/:party_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { party_id } = request.params as { party_id: string };
    const body = request.body as {
      primary_name?: string;
      primary_name_ar?: string;
      attributes_json?: Record<string, unknown>;
      status?: string;
    };
    
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;
    
    if (body.primary_name !== undefined) {
      updates.push(`primary_name = $${paramIndex++}`);
      params.push(body.primary_name);
    }
    if (body.primary_name_ar !== undefined) {
      updates.push(`primary_name_ar = $${paramIndex++}`);
      params.push(body.primary_name_ar);
    }
    if (body.attributes_json !== undefined) {
      updates.push(`attributes_json = $${paramIndex++}`);
      params.push(JSON.stringify(body.attributes_json));
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(body.status);
    }
    
    if (updates.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
      });
    }
    
    updates.push(`updated_by = $${paramIndex++}`);
    params.push(request.userId || null);
    
    params.push(party_id);
    
    const sql = `
      UPDATE mdm.party_golden
      SET ${updates.join(', ')}
      WHERE party_id = $${paramIndex}
      RETURNING party_id, tenant_id, party_type, primary_name, primary_name_ar,
                identifiers_json, attributes_json, status, created_at, updated_at
    `;
    
    const result = await queryWithTenant<PartyGolden>(request.tenantId, sql, params);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Party not found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });
}
