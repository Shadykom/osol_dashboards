/**
 * Reference Data Routes
 * EPIC 5 - MDM Reference Data CRUD (Countries, Nationalities, Fee Types, etc.)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';
import { logAuditEvent } from '../../services/audit.js';

interface ReferenceData {
  id: string;
  tenant_id: string;
  domain: string;
  code: string;
  name_ar: string;
  name_en: string;
  extra_json: Record<string, unknown>;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CreateReferenceDataBody {
  domain: string;
  code: string;
  name_ar?: string;
  name_en?: string;
  extra_json?: Record<string, unknown>;
  sort_order?: number;
}

interface UpdateReferenceDataBody {
  name_ar?: string;
  name_en?: string;
  extra_json?: Record<string, unknown>;
  sort_order?: number;
  status?: 'active' | 'inactive';
}

export async function referenceDataRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /mdm/reference-data
   * List reference data, optionally filtered by domain
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { domain, status, search } = request.query as { 
      domain?: string; 
      status?: string;
      search?: string;
    };
    
    let sql = `
      SELECT id, tenant_id, domain, code, name_ar, name_en, extra_json, sort_order, status, created_at, updated_at
      FROM mdm.reference_data
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (domain) {
      params.push(domain.toUpperCase());
      sql += ` AND domain = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name_en ILIKE $${params.length} OR name_ar ILIKE $${params.length} OR code ILIKE $${params.length})`;
    }
    
    sql += ' ORDER BY domain, sort_order, code';
    
    const result = await queryWithTenant<ReferenceData>(request.tenantId, sql, params);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        count: result.rowCount,
        requestId: request.requestId,
      },
    });
  });

  /**
   * GET /mdm/reference-data/domains
   * List all unique domains
   */
  fastify.get('/domains', async (request: FastifyRequest, reply: FastifyReply) => {
    const sql = `
      SELECT DISTINCT domain, COUNT(*) as count
      FROM mdm.reference_data
      WHERE status = 'active'
      GROUP BY domain
      ORDER BY domain
    `;
    
    const result = await queryWithTenant<{ domain: string; count: number }>(request.tenantId, sql);
    
    return reply.send({
      success: true,
      data: result.rows,
    });
  });

  /**
   * GET /mdm/reference-data/:id
   * Get a single reference data item by ID
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    const sql = `
      SELECT id, tenant_id, domain, code, name_ar, name_en, extra_json, sort_order, status, created_at, updated_at
      FROM mdm.reference_data
      WHERE id = $1
    `;
    
    const result = await queryWithTenant<ReferenceData>(request.tenantId, sql, [id]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reference data not found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * POST /mdm/reference-data
   * Create new reference data
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateReferenceDataBody;
    const { domain, code, name_ar, name_en, extra_json, sort_order } = body;
    
    if (!domain || !code) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'domain and code are required' },
      });
    }
    
    const sql = `
      INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, tenant_id, domain, code, name_ar, name_en, extra_json, sort_order, status, created_at, updated_at
    `;
    
    const params = [
      request.tenantId,
      domain.toUpperCase(),
      code.toUpperCase(),
      name_ar || null,
      name_en || null,
      JSON.stringify(extra_json || {}),
      sort_order || 0,
      request.userId || null,
    ];
    
    try {
      const result = await queryWithTenant<ReferenceData>(request.tenantId, sql, params);
      const newItem = result.rows[0];
      
      // Audit event
      await logAuditEvent(request.tenantId, {
        action: 'CREATE',
        resourceType: 'reference_data',
        resourceId: newItem.id,
        newValues: newItem,
        userId: request.userId,
        requestId: request.requestId,
      });
      
      return reply.status(201).send({
        success: true,
        data: newItem,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        return reply.status(409).send({
          success: false,
          error: { code: 'DUPLICATE', message: `Reference data with code '${code}' already exists in domain '${domain}'` },
        });
      }
      throw error;
    }
  });

  /**
   * POST /mdm/reference-data/bulk
   * Bulk create reference data
   */
  fastify.post('/bulk', async (request: FastifyRequest, reply: FastifyReply) => {
    const { items } = request.body as { items: CreateReferenceDataBody[] };
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'items array is required' },
      });
    }
    
    const results: ReferenceData[] = [];
    const errors: { index: number; error: string }[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const sql = `
          INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (tenant_id, domain, code) DO UPDATE SET
            name_ar = EXCLUDED.name_ar,
            name_en = EXCLUDED.name_en,
            extra_json = EXCLUDED.extra_json,
            sort_order = EXCLUDED.sort_order,
            updated_by = EXCLUDED.created_by
          RETURNING id, tenant_id, domain, code, name_ar, name_en, extra_json, sort_order, status, created_at, updated_at
        `;
        
        const params = [
          request.tenantId,
          item.domain.toUpperCase(),
          item.code.toUpperCase(),
          item.name_ar || null,
          item.name_en || null,
          JSON.stringify(item.extra_json || {}),
          item.sort_order || 0,
          request.userId || null,
        ];
        
        const result = await queryWithTenant<ReferenceData>(request.tenantId, sql, params);
        results.push(result.rows[0]);
      } catch (error: any) {
        errors.push({ index: i, error: error.message });
      }
    }
    
    return reply.send({
      success: errors.length === 0,
      data: results,
      meta: {
        total: items.length,
        created: results.length,
        errors: errors.length,
        errorDetails: errors.length > 0 ? errors : undefined,
      },
    });
  });

  /**
   * PATCH /mdm/reference-data/:id
   * Update reference data
   */
  fastify.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateReferenceDataBody;
    
    // Get current values
    const currentResult = await queryWithTenant<ReferenceData>(
      request.tenantId,
      'SELECT * FROM mdm.reference_data WHERE id = $1',
      [id]
    );
    
    if (currentResult.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reference data not found' },
      });
    }
    
    const current = currentResult.rows[0];
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;
    
    if (body.name_ar !== undefined) {
      updates.push(`name_ar = $${paramIndex++}`);
      params.push(body.name_ar);
    }
    if (body.name_en !== undefined) {
      updates.push(`name_en = $${paramIndex++}`);
      params.push(body.name_en);
    }
    if (body.extra_json !== undefined) {
      updates.push(`extra_json = $${paramIndex++}`);
      params.push(JSON.stringify(body.extra_json));
    }
    if (body.sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      params.push(body.sort_order);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(body.status);
    }
    
    if (updates.length === 0) {
      return reply.send({ success: true, data: current });
    }
    
    updates.push(`updated_by = $${paramIndex++}`);
    params.push(request.userId || null);
    
    params.push(id);
    
    const sql = `
      UPDATE mdm.reference_data
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, tenant_id, domain, code, name_ar, name_en, extra_json, sort_order, status, created_at, updated_at
    `;
    
    const result = await queryWithTenant<ReferenceData>(request.tenantId, sql, params);
    const updated = result.rows[0];
    
    // Audit event
    await logAuditEvent(request.tenantId, {
      action: 'UPDATE',
      resourceType: 'reference_data',
      resourceId: id,
      oldValues: current,
      newValues: updated,
      userId: request.userId,
      requestId: request.requestId,
    });
    
    return reply.send({
      success: true,
      data: updated,
    });
  });

  /**
   * DELETE /mdm/reference-data/:id
   * Soft delete reference data (set status to inactive)
   */
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    const sql = `
      UPDATE mdm.reference_data
      SET status = 'inactive', updated_by = $2
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [id, request.userId || null]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Reference data not found' },
      });
    }
    
    // Audit event
    await logAuditEvent(request.tenantId, {
      action: 'DELETE',
      resourceType: 'reference_data',
      resourceId: id,
      userId: request.userId,
      requestId: request.requestId,
    });
    
    return reply.status(204).send();
  });
}
