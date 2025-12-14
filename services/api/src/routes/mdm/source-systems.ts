/**
 * Source Systems Routes
 * EPIC 5 - MDM Source Systems CRUD
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant, transactionWithTenant } from '../../db/index.js';
import { logAuditEvent } from '../../services/audit.js';

interface SourceSystem {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface CreateSourceSystemBody {
  code: string;
  name: string;
  description?: string;
  config_json?: Record<string, unknown>;
}

interface UpdateSourceSystemBody {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'deprecated';
  config_json?: Record<string, unknown>;
}

export async function sourceSystemRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /mdm/sources
   * List all source systems for the tenant
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { status } = request.query as { status?: string };
    
    let sql = `
      SELECT id, tenant_id, code, name, description, status, config_json, created_at, updated_at
      FROM mdm.source_systems
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    
    sql += ' ORDER BY code';
    
    const result = await queryWithTenant<SourceSystem>(request.tenantId, sql, params);
    
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
   * GET /mdm/sources/:id
   * Get a single source system by ID
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    const sql = `
      SELECT id, tenant_id, code, name, description, status, config_json, created_at, updated_at
      FROM mdm.source_systems
      WHERE id = $1
    `;
    
    const result = await queryWithTenant<SourceSystem>(request.tenantId, sql, [id]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Source system not found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * POST /mdm/sources
   * Create a new source system
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateSourceSystemBody;
    const { code, name, description, config_json } = body;
    
    if (!code || !name) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'code and name are required' },
      });
    }
    
    const sql = `
      INSERT INTO mdm.source_systems (tenant_id, code, name, description, config_json, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, tenant_id, code, name, description, status, config_json, created_at, updated_at
    `;
    
    const params = [
      request.tenantId,
      code.toUpperCase(),
      name,
      description || null,
      JSON.stringify(config_json || {}),
      request.userId || null,
    ];
    
    try {
      const result = await queryWithTenant<SourceSystem>(request.tenantId, sql, params);
      const newSourceSystem = result.rows[0];
      
      // Audit event
      await logAuditEvent(request.tenantId, {
        action: 'CREATE',
        resourceType: 'source_system',
        resourceId: newSourceSystem.id,
        newValues: newSourceSystem,
        userId: request.userId,
        requestId: request.requestId,
      });
      
      return reply.status(201).send({
        success: true,
        data: newSourceSystem,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        return reply.status(409).send({
          success: false,
          error: { code: 'DUPLICATE', message: `Source system with code '${code}' already exists` },
        });
      }
      throw error;
    }
  });

  /**
   * PATCH /mdm/sources/:id
   * Update a source system
   */
  fastify.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateSourceSystemBody;
    
    // Get current values
    const currentResult = await queryWithTenant<SourceSystem>(
      request.tenantId,
      'SELECT * FROM mdm.source_systems WHERE id = $1',
      [id]
    );
    
    if (currentResult.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Source system not found' },
      });
    }
    
    const current = currentResult.rows[0];
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;
    
    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(body.description);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(body.status);
    }
    if (body.config_json !== undefined) {
      updates.push(`config_json = $${paramIndex++}`);
      params.push(JSON.stringify(body.config_json));
    }
    
    if (updates.length === 0) {
      return reply.send({ success: true, data: current });
    }
    
    updates.push(`updated_by = $${paramIndex++}`);
    params.push(request.userId || null);
    
    params.push(id);
    
    const sql = `
      UPDATE mdm.source_systems
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, tenant_id, code, name, description, status, config_json, created_at, updated_at
    `;
    
    const result = await queryWithTenant<SourceSystem>(request.tenantId, sql, params);
    const updated = result.rows[0];
    
    // Audit event
    await logAuditEvent(request.tenantId, {
      action: 'UPDATE',
      resourceType: 'source_system',
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
   * DELETE /mdm/sources/:id
   * Soft delete a source system (set status to deprecated)
   */
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    const sql = `
      UPDATE mdm.source_systems
      SET status = 'deprecated', updated_by = $2
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [id, request.userId || null]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Source system not found' },
      });
    }
    
    // Audit event
    await logAuditEvent(request.tenantId, {
      action: 'DELETE',
      resourceType: 'source_system',
      resourceId: id,
      userId: request.userId,
      requestId: request.requestId,
    });
    
    return reply.status(204).send();
  });
}
