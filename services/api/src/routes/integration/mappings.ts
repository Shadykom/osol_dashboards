/**
 * Mapping Templates Routes
 * EPIC 5 - Configurable mapping templates management
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';
import { logAuditEvent } from '../../services/audit.js';

interface MappingTemplate {
  id: string;
  tenant_id: string;
  source_system_id: string;
  source_system_code: string;
  source_system_name: string;
  dataset: string;
  name: string;
  description: string | null;
  mapping_json: Record<string, unknown>;
  is_default: boolean;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface CreateMappingBody {
  source_system_code: string;
  dataset: string;
  name: string;
  description?: string;
  mapping_json: Record<string, unknown>;
  is_default?: boolean;
}

interface UpdateMappingBody {
  name?: string;
  description?: string;
  mapping_json?: Record<string, unknown>;
  is_default?: boolean;
  status?: 'active' | 'inactive' | 'draft';
}

export async function mappingRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /integration/mappings
   * List all mapping templates
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { dataset, source_system, status, is_default } = request.query as { 
      dataset?: string;
      source_system?: string;
      status?: string;
      is_default?: string;
    };
    
    let sql = `
      SELECT 
        mt.id, mt.tenant_id, mt.source_system_id,
        ss.code as source_system_code, ss.name as source_system_name,
        mt.dataset, mt.name, mt.description, mt.mapping_json,
        mt.is_default, mt.status, mt.version, mt.created_at, mt.updated_at
      FROM integration.mapping_templates mt
      JOIN mdm.source_systems ss ON ss.id = mt.source_system_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    
    if (dataset) {
      params.push(dataset.toUpperCase());
      sql += ` AND mt.dataset = $${params.length}`;
    }
    
    if (source_system) {
      params.push(source_system.toUpperCase());
      sql += ` AND ss.code = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      sql += ` AND mt.status = $${params.length}`;
    }
    
    if (is_default !== undefined) {
      params.push(is_default === 'true');
      sql += ` AND mt.is_default = $${params.length}`;
    }
    
    sql += ' ORDER BY mt.dataset, ss.code, mt.name, mt.version DESC';
    
    const result = await queryWithTenant<MappingTemplate>(request.tenantId, sql, params);
    
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
   * GET /integration/mappings/:id
   * Get a single mapping template
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    const sql = `
      SELECT 
        mt.id, mt.tenant_id, mt.source_system_id,
        ss.code as source_system_code, ss.name as source_system_name,
        mt.dataset, mt.name, mt.description, mt.mapping_json,
        mt.is_default, mt.status, mt.version, mt.created_at, mt.updated_at
      FROM integration.mapping_templates mt
      JOIN mdm.source_systems ss ON ss.id = mt.source_system_id
      WHERE mt.id = $1
    `;
    
    const result = await queryWithTenant<MappingTemplate>(request.tenantId, sql, [id]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Mapping template not found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * GET /integration/mappings/default/:dataset/:source_system
   * Get the default mapping for a dataset/source combination
   */
  fastify.get('/default/:dataset/:source_system', async (request: FastifyRequest, reply: FastifyReply) => {
    const { dataset, source_system } = request.params as { dataset: string; source_system: string };
    
    const sql = `
      SELECT 
        mt.id, mt.tenant_id, mt.source_system_id,
        ss.code as source_system_code, ss.name as source_system_name,
        mt.dataset, mt.name, mt.description, mt.mapping_json,
        mt.is_default, mt.status, mt.version, mt.created_at, mt.updated_at
      FROM integration.mapping_templates mt
      JOIN mdm.source_systems ss ON ss.id = mt.source_system_id
      WHERE mt.dataset = $1 AND ss.code = $2 AND mt.is_default = true AND mt.status = 'active'
      ORDER BY mt.version DESC
      LIMIT 1
    `;
    
    const result = await queryWithTenant<MappingTemplate>(request.tenantId, sql, [
      dataset.toUpperCase(), 
      source_system.toUpperCase()
    ]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No default mapping template found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * POST /integration/mappings
   * Create a new mapping template
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateMappingBody;
    const { source_system_code, dataset, name, description, mapping_json, is_default } = body;
    
    if (!source_system_code || !dataset || !name || !mapping_json) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'source_system_code, dataset, name, and mapping_json are required' },
      });
    }
    
    // Get source system ID
    const sourceResult = await queryWithTenant<{ id: string }>(
      request.tenantId,
      'SELECT id FROM mdm.source_systems WHERE code = $1',
      [source_system_code.toUpperCase()]
    );
    
    if (sourceResult.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: `Source system '${source_system_code}' not found` },
      });
    }
    
    const sourceSystemId = sourceResult.rows[0].id;
    
    // If setting as default, unset other defaults
    if (is_default) {
      await queryWithTenant(
        request.tenantId,
        `UPDATE integration.mapping_templates 
         SET is_default = false 
         WHERE source_system_id = $1 AND dataset = $2`,
        [sourceSystemId, dataset.toUpperCase()]
      );
    }
    
    // Create mapping
    const sql = `
      INSERT INTO integration.mapping_templates 
      (tenant_id, source_system_id, dataset, name, description, mapping_json, is_default, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, tenant_id, source_system_id, dataset, name, description, mapping_json,
                is_default, status, version, created_at, updated_at
    `;
    
    const result = await queryWithTenant<MappingTemplate>(request.tenantId, sql, [
      request.tenantId,
      sourceSystemId,
      dataset.toUpperCase(),
      name,
      description || null,
      JSON.stringify(mapping_json),
      is_default || false,
      request.userId || null,
    ]);
    
    const newMapping = result.rows[0];
    
    // Audit
    await logAuditEvent(request.tenantId, {
      action: 'CREATE',
      resourceType: 'mapping_template',
      resourceId: newMapping.id,
      newValues: newMapping,
      userId: request.userId,
      requestId: request.requestId,
    });
    
    return reply.status(201).send({
      success: true,
      data: newMapping,
    });
  });

  /**
   * PATCH /integration/mappings/:id
   * Update a mapping template
   */
  fastify.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateMappingBody;
    
    // Get current mapping
    const currentResult = await queryWithTenant<MappingTemplate>(
      request.tenantId,
      `SELECT mt.*, ss.code as source_system_code 
       FROM integration.mapping_templates mt
       JOIN mdm.source_systems ss ON ss.id = mt.source_system_id
       WHERE mt.id = $1`,
      [id]
    );
    
    if (currentResult.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Mapping template not found' },
      });
    }
    
    const current = currentResult.rows[0];
    
    // If setting as default, unset other defaults
    if (body.is_default && !current.is_default) {
      await queryWithTenant(
        request.tenantId,
        `UPDATE integration.mapping_templates 
         SET is_default = false 
         WHERE source_system_id = $1 AND dataset = $2 AND id != $3`,
        [current.source_system_id, current.dataset, id]
      );
    }
    
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
    if (body.mapping_json !== undefined) {
      updates.push(`mapping_json = $${paramIndex++}`);
      params.push(JSON.stringify(body.mapping_json));
    }
    if (body.is_default !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      params.push(body.is_default);
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
      UPDATE integration.mapping_templates
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, tenant_id, source_system_id, dataset, name, description, mapping_json,
                is_default, status, version, created_at, updated_at
    `;
    
    const result = await queryWithTenant<MappingTemplate>(request.tenantId, sql, params);
    const updated = result.rows[0];
    
    // Audit
    await logAuditEvent(request.tenantId, {
      action: 'UPDATE',
      resourceType: 'mapping_template',
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
   * DELETE /integration/mappings/:id
   * Soft delete a mapping template (set status to inactive)
   */
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    
    const sql = `
      UPDATE integration.mapping_templates
      SET status = 'inactive', is_default = false, updated_by = $2
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [id, request.userId || null]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Mapping template not found' },
      });
    }
    
    // Audit
    await logAuditEvent(request.tenantId, {
      action: 'DELETE',
      resourceType: 'mapping_template',
      resourceId: id,
      userId: request.userId,
      requestId: request.requestId,
    });
    
    return reply.status(204).send();
  });

  /**
   * POST /integration/mappings/:id/validate
   * Validate a mapping template against sample data
   */
  fastify.post('/:id/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { sample_data } = request.body as { sample_data: Record<string, unknown>[] };
    
    if (!sample_data || !Array.isArray(sample_data) || sample_data.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'sample_data array is required' },
      });
    }
    
    // Get mapping
    const mappingResult = await queryWithTenant<MappingTemplate>(
      request.tenantId,
      'SELECT mapping_json, dataset FROM integration.mapping_templates WHERE id = $1',
      [id]
    );
    
    if (mappingResult.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Mapping template not found' },
      });
    }
    
    const mapping = mappingResult.rows[0].mapping_json as any;
    const validationResults: Array<{
      index: number;
      fields: Record<string, { found: boolean; value: unknown }>;
    }> = [];
    
    for (let i = 0; i < sample_data.length; i++) {
      const record = sample_data[i];
      const fields: Record<string, { found: boolean; value: unknown }> = {};
      
      // Check external ref
      fields['externalRef'] = {
        found: mapping.externalRefField in record,
        value: record[mapping.externalRefField],
      };
      
      // Check name fields
      if (mapping.nameFields) {
        fields['primaryName'] = {
          found: mapping.nameFields.primary in record,
          value: record[mapping.nameFields.primary],
        };
      }
      
      // Check identifier fields
      if (mapping.identifierFields) {
        for (const idField of mapping.identifierFields) {
          fields[`identifier:${idField.type}`] = {
            found: idField.field in record,
            value: record[idField.field],
          };
        }
      }
      
      // Check contact fields
      if (mapping.contactFields) {
        for (const contactField of mapping.contactFields) {
          fields[`contact:${contactField.type}`] = {
            found: contactField.field in record,
            value: record[contactField.field],
          };
        }
      }
      
      validationResults.push({ index: i, fields });
    }
    
    return reply.send({
      success: true,
      data: {
        mapping_id: id,
        sample_count: sample_data.length,
        results: validationResults,
      },
    });
  });
}
