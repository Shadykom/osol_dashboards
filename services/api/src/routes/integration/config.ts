/**
 * Integration Config Routes
 * EPIC 5 - Integration configuration management
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';
import { logAuditEvent } from '../../services/audit.js';

interface IntegrationConfig {
  key: string;
  value: unknown;
  description?: string;
}

const INTEGRATION_CONFIG_KEYS = [
  'integration.method.PARTY',
  'integration.method.CONTRACT',
  'integration.method.CHARGE',
  'integration.dq.enabled',
  'integration.dq.failOnCritical',
  'integration.audit.enabled',
  'mdm.matching.autoMergeThreshold',
  'mdm.matching.reviewThreshold',
];

const VALID_METHODS = ['FILE', 'MANUAL', 'API', 'DB'];

export async function configRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /integration/config
   * Get all integration configuration
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const sql = `
      SELECT key, value, description
      FROM tenant_config
      WHERE tenant_id = $1 AND key LIKE 'integration.%' OR key LIKE 'mdm.%'
      ORDER BY key
    `;
    
    const result = await queryWithTenant<IntegrationConfig>(request.tenantId, sql, [request.tenantId]);
    
    // Transform to object
    const config: Record<string, unknown> = {};
    for (const row of result.rows) {
      config[row.key] = row.value;
    }
    
    return reply.send({
      success: true,
      data: config,
      meta: {
        availableKeys: INTEGRATION_CONFIG_KEYS,
        validMethods: VALID_METHODS,
      },
    });
  });

  /**
   * GET /integration/config/methods
   * Get integration methods for all datasets
   */
  fastify.get('/methods', async (request: FastifyRequest, reply: FastifyReply) => {
    const sql = `
      SELECT key, value
      FROM tenant_config
      WHERE tenant_id = $1 AND key LIKE 'integration.method.%'
    `;
    
    const result = await queryWithTenant<IntegrationConfig>(request.tenantId, sql, [request.tenantId]);
    
    const methods: Record<string, string> = {};
    for (const row of result.rows) {
      const dataset = row.key.replace('integration.method.', '');
      methods[dataset] = typeof row.value === 'string' ? row.value : String(row.value).replace(/"/g, '');
    }
    
    // Add defaults for missing datasets
    for (const dataset of ['PARTY', 'CONTRACT', 'CHARGE']) {
      if (!methods[dataset]) {
        methods[dataset] = 'FILE';
      }
    }
    
    return reply.send({
      success: true,
      data: {
        methods,
        availableMethods: VALID_METHODS,
      },
    });
  });

  /**
   * PUT /integration/config/methods
   * Update integration methods for datasets
   */
  fastify.put('/methods', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { methods: Record<string, string> };
    
    if (!body.methods || typeof body.methods !== 'object') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'methods object is required' },
      });
    }
    
    const updated: string[] = [];
    const errors: string[] = [];
    
    for (const [dataset, method] of Object.entries(body.methods)) {
      if (!VALID_METHODS.includes(method)) {
        errors.push(`Invalid method '${method}' for dataset '${dataset}'. Valid: ${VALID_METHODS.join(', ')}`);
        continue;
      }
      
      const key = `integration.method.${dataset.toUpperCase()}`;
      
      const sql = `
        INSERT INTO tenant_config (tenant_id, key, value, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id, key) DO UPDATE SET value = $3
      `;
      
      await queryWithTenant(request.tenantId, sql, [
        request.tenantId,
        key,
        JSON.stringify(method),
        `Integration method for ${dataset} dataset`,
      ]);
      
      updated.push(dataset);
    }
    
    // Audit
    await logAuditEvent(request.tenantId, {
      action: 'CONFIG_UPDATE',
      resourceType: 'integration_config',
      metadata: { methods: body.methods },
      userId: request.userId,
      requestId: request.requestId,
    });
    
    if (errors.length > 0) {
      return reply.status(400).send({
        success: false,
        data: { updated },
        errors,
      });
    }
    
    return reply.send({
      success: true,
      data: { updated },
    });
  });

  /**
   * GET /integration/config/:key
   * Get a specific config value
   */
  fastify.get('/:key', async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as { key: string };
    
    const sql = `
      SELECT key, value, description
      FROM tenant_config
      WHERE tenant_id = $1 AND key = $2
    `;
    
    const result = await queryWithTenant<IntegrationConfig>(request.tenantId, sql, [request.tenantId, key]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: `Config key '${key}' not found` },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * PUT /integration/config/:key
   * Set a specific config value
   */
  fastify.put('/:key', async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as { key: string };
    const { value, description } = request.body as { value: unknown; description?: string };
    
    if (value === undefined) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'value is required' },
      });
    }
    
    // Validate method values
    if (key.startsWith('integration.method.')) {
      const method = typeof value === 'string' ? value : String(value);
      if (!VALID_METHODS.includes(method)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid method. Valid: ${VALID_METHODS.join(', ')}` },
        });
      }
    }
    
    const sql = `
      INSERT INTO tenant_config (tenant_id, key, value, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, key) DO UPDATE SET value = $3, description = COALESCE($4, tenant_config.description)
      RETURNING key, value, description
    `;
    
    const result = await queryWithTenant<IntegrationConfig>(request.tenantId, sql, [
      request.tenantId,
      key,
      JSON.stringify(value),
      description,
    ]);
    
    // Audit
    await logAuditEvent(request.tenantId, {
      action: 'CONFIG_UPDATE',
      resourceType: 'integration_config',
      metadata: { key, value },
      userId: request.userId,
      requestId: request.requestId,
    });
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * DELETE /integration/config/:key
   * Delete a config key (reset to default)
   */
  fastify.delete('/:key', async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as { key: string };
    
    const sql = `
      DELETE FROM tenant_config
      WHERE tenant_id = $1 AND key = $2
      RETURNING key
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [request.tenantId, key]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: `Config key '${key}' not found` },
      });
    }
    
    // Audit
    await logAuditEvent(request.tenantId, {
      action: 'CONFIG_DELETE',
      resourceType: 'integration_config',
      metadata: { key },
      userId: request.userId,
      requestId: request.requestId,
    });
    
    return reply.status(204).send();
  });
}
