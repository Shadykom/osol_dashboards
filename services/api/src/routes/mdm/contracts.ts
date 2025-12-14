/**
 * Contract Routes
 * EPIC 5 - MDM Contract Golden Records
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';

interface ContractGolden {
  contract_id: string;
  tenant_id: string;
  party_id: string;
  product_code: string | null;
  contract_number: string | null;
  secured_flag: boolean;
  status: string;
  contract_keys_json: Record<string, unknown>;
  attributes_json: Record<string, unknown>;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export async function contractRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /mdm/contracts
   * Search and list contracts
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { 
      search, 
      party_id,
      product_code,
      status, 
      secured,
      limit = 50, 
      offset = 0 
    } = request.query as { 
      search?: string; 
      party_id?: string;
      product_code?: string;
      status?: string;
      secured?: string;
      limit?: number;
      offset?: number;
    };
    
    let sql = `
      SELECT 
        cg.contract_id, cg.tenant_id, cg.party_id, cg.product_code, cg.contract_number,
        cg.secured_flag, cg.status, cg.contract_keys_json, cg.attributes_json,
        cg.start_date, cg.end_date, cg.created_at, cg.updated_at,
        pg.primary_name as party_name, pg.party_type,
        (SELECT COUNT(*) FROM mdm.data_quality_issues dq 
         WHERE dq.entity_id = cg.contract_id AND dq.entity_type = 'CONTRACT' AND dq.status = 'open') as dq_issue_count
      FROM mdm.contract_golden cg
      JOIN mdm.party_golden pg ON pg.party_id = cg.party_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (cg.contract_number ILIKE $${params.length} OR pg.primary_name ILIKE $${params.length})`;
    }
    
    if (party_id) {
      params.push(party_id);
      sql += ` AND cg.party_id = $${params.length}`;
    }
    
    if (product_code) {
      params.push(product_code);
      sql += ` AND cg.product_code = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      sql += ` AND cg.status = $${params.length}`;
    }
    
    if (secured !== undefined) {
      params.push(secured === 'true');
      sql += ` AND cg.secured_flag = $${params.length}`;
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await queryWithTenant<{ total: number }>(request.tenantId, countSql, params);
    const total = countResult.rows[0]?.total || 0;
    
    // Add pagination
    sql += ` ORDER BY cg.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await queryWithTenant<ContractGolden & { party_name: string; party_type: string; dq_issue_count: number }>(
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
   * GET /mdm/contracts/:contract_id
   * Get a single contract with full details
   */
  fastify.get('/:contract_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { contract_id } = request.params as { contract_id: string };
    
    // Get contract golden record
    const contractSql = `
      SELECT 
        cg.contract_id, cg.tenant_id, cg.party_id, cg.product_code, cg.contract_number,
        cg.secured_flag, cg.status, cg.contract_keys_json, cg.attributes_json,
        cg.start_date, cg.end_date, cg.created_at, cg.updated_at,
        pg.primary_name as party_name, pg.party_type, pg.identifiers_json as party_identifiers
      FROM mdm.contract_golden cg
      JOIN mdm.party_golden pg ON pg.party_id = cg.party_id
      WHERE cg.contract_id = $1
    `;
    
    const contractResult = await queryWithTenant<ContractGolden & { party_name: string; party_type: string; party_identifiers: unknown[] }>(
      request.tenantId, contractSql, [contract_id]
    );
    
    if (contractResult.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Contract not found' },
      });
    }
    
    const contract = contractResult.rows[0];
    
    // Get source mappings
    const sourcesSql = `
      SELECT 
        csm.id, csm.source_system_id, ss.code as source_system_code, ss.name as source_system_name,
        csm.external_contract_ref, csm.payload_hash, csm.last_seen_at, csm.created_at
      FROM mdm.contract_source_map csm
      JOIN mdm.source_systems ss ON ss.id = csm.source_system_id
      WHERE csm.contract_id = $1
      ORDER BY csm.last_seen_at DESC
    `;
    
    const sourcesResult = await queryWithTenant(request.tenantId, sourcesSql, [contract_id]);
    
    // Get charges
    const chargesSql = `
      SELECT 
        cc.id, cc.charge_type_code, cc.amount, cc.currency, cc.applied_date,
        cc.description, cc.status, cc.external_ref, cc.created_at,
        ss.code as source_system_code
      FROM mdm.contract_charges cc
      LEFT JOIN mdm.source_systems ss ON ss.id = cc.source_system_id
      WHERE cc.contract_id = $1
      ORDER BY cc.applied_date DESC
    `;
    
    const chargesResult = await queryWithTenant(request.tenantId, chargesSql, [contract_id]);
    
    // Get DQ issues
    const dqSql = `
      SELECT id, severity, rule_code, rule_name, message, details_json, status, created_at
      FROM mdm.data_quality_issues
      WHERE entity_type = 'CONTRACT' AND entity_id = $1
      ORDER BY 
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END,
        created_at DESC
    `;
    
    const dqResult = await queryWithTenant(request.tenantId, dqSql, [contract_id]);
    
    return reply.send({
      success: true,
      data: {
        ...contract,
        sources: sourcesResult.rows,
        charges: chargesResult.rows,
        dq_issues: dqResult.rows,
      },
    });
  });

  /**
   * GET /mdm/contracts/:contract_id/sources
   * Get all source mappings for a contract
   */
  fastify.get('/:contract_id/sources', async (request: FastifyRequest, reply: FastifyReply) => {
    const { contract_id } = request.params as { contract_id: string };
    
    const sql = `
      SELECT 
        csm.id, csm.source_system_id, ss.code as source_system_code, ss.name as source_system_name,
        csm.external_contract_ref, csm.payload_hash, csm.last_seen_at, csm.created_at
      FROM mdm.contract_source_map csm
      JOIN mdm.source_systems ss ON ss.id = csm.source_system_id
      WHERE csm.contract_id = $1
      ORDER BY csm.last_seen_at DESC
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [contract_id]);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        count: result.rowCount,
      },
    });
  });

  /**
   * PATCH /mdm/contracts/:contract_id
   * Update contract golden record
   */
  fastify.patch('/:contract_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { contract_id } = request.params as { contract_id: string };
    const body = request.body as {
      product_code?: string;
      secured_flag?: boolean;
      status?: string;
      attributes_json?: Record<string, unknown>;
      start_date?: string;
      end_date?: string;
    };
    
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;
    
    if (body.product_code !== undefined) {
      updates.push(`product_code = $${paramIndex++}`);
      params.push(body.product_code);
    }
    if (body.secured_flag !== undefined) {
      updates.push(`secured_flag = $${paramIndex++}`);
      params.push(body.secured_flag);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(body.status);
    }
    if (body.attributes_json !== undefined) {
      updates.push(`attributes_json = $${paramIndex++}`);
      params.push(JSON.stringify(body.attributes_json));
    }
    if (body.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      params.push(body.start_date);
    }
    if (body.end_date !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      params.push(body.end_date);
    }
    
    if (updates.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
      });
    }
    
    updates.push(`updated_by = $${paramIndex++}`);
    params.push(request.userId || null);
    
    params.push(contract_id);
    
    const sql = `
      UPDATE mdm.contract_golden
      SET ${updates.join(', ')}
      WHERE contract_id = $${paramIndex}
      RETURNING contract_id, tenant_id, party_id, product_code, contract_number,
                secured_flag, status, contract_keys_json, attributes_json,
                start_date, end_date, created_at, updated_at
    `;
    
    const result = await queryWithTenant<ContractGolden>(request.tenantId, sql, params);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Contract not found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });
}
