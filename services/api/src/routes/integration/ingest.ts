/**
 * Ingestion Routes
 * EPIC 5 - Data Ingestion Endpoint
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { runIngestion, getIntegrationMethod } from '../../services/ingestion.js';
import { queryWithTenant } from '../../db/index.js';

interface IngestBody {
  dataset: 'PARTY' | 'CONTRACT' | 'CHARGE';
  source_system_code: string;
  mode?: 'FILE' | 'MANUAL' | 'API';
  data?: Record<string, unknown>[];
  mapping?: Record<string, unknown>;
}

export async function ingestRoutes(fastify: FastifyInstance): Promise<void> {
  // Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max
    },
  });

  /**
   * POST /integration/ingest
   * Main ingestion endpoint - handles FILE, MANUAL, and API modes
   */
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const contentType = request.headers['content-type'] || '';
    
    let dataset: 'PARTY' | 'CONTRACT' | 'CHARGE';
    let sourceSystemCode: string;
    let mode: 'FILE' | 'MANUAL' | 'API';
    let data: Record<string, unknown>[] = [];
    let mapping: Record<string, unknown> | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;

    if (contentType.includes('multipart/form-data')) {
      // FILE mode - handle file upload
      const parts = request.parts();
      
      for await (const part of parts) {
        if (part.type === 'file') {
          fileName = part.filename;
          const buffer = await part.toBuffer();
          fileSize = buffer.length;
          
          // Parse file based on extension
          const ext = fileName.toLowerCase().split('.').pop();
          
          if (ext === 'csv') {
            const content = buffer.toString('utf-8');
            data = csvParse(content, {
              columns: true,
              skip_empty_lines: true,
              trim: true,
            });
          } else if (ext === 'xlsx' || ext === 'xls') {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(worksheet);
          } else {
            return reply.status(400).send({
              success: false,
              error: { code: 'INVALID_FILE', message: `Unsupported file format: ${ext}` },
            });
          }
        } else if (part.type === 'field') {
          const value = part.value as string;
          switch (part.fieldname) {
            case 'dataset':
              dataset = value as 'PARTY' | 'CONTRACT' | 'CHARGE';
              break;
            case 'source_system_code':
              sourceSystemCode = value;
              break;
            case 'mapping':
              try {
                mapping = JSON.parse(value);
              } catch (e) {
                return reply.status(400).send({
                  success: false,
                  error: { code: 'INVALID_MAPPING', message: 'Invalid mapping JSON' },
                });
              }
              break;
          }
        }
      }
      
      mode = 'FILE';
    } else {
      // JSON body - MANUAL or API mode
      const body = request.body as IngestBody;
      dataset = body.dataset;
      sourceSystemCode = body.source_system_code;
      data = body.data || [];
      mapping = body.mapping;
      
      // Determine mode from config or request
      if (body.mode) {
        mode = body.mode;
      } else {
        const configuredMode = await getIntegrationMethod(request.tenantId, dataset);
        mode = configuredMode as 'FILE' | 'MANUAL' | 'API';
      }
    }

    // Validation
    if (!dataset) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'dataset is required' },
      });
    }

    if (!sourceSystemCode) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'source_system_code is required' },
      });
    }

    if (!data || data.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No data provided' },
      });
    }

    try {
      const result = await runIngestion(
        request.tenantId,
        {
          dataset,
          sourceSystemCode,
          mode,
          data,
          mapping: mapping as any,
          fileName,
          fileSize,
        },
        request.userId
      );

      const httpStatus = result.status === 'failed' ? 422 : result.status === 'partial' ? 207 : 200;

      return reply.status(httpStatus).send({
        success: result.status !== 'failed',
        data: {
          run_id: result.runId,
          status: result.status,
          stats: result.stats,
          dq_issues_count: result.dqIssuesCount,
        },
        errors: result.errors.length > 0 ? result.errors.slice(0, 100) : undefined,
        meta: {
          requestId: request.requestId,
        },
      });
    } catch (error: any) {
      request.log.error({ error }, 'Ingestion failed');
      
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INGESTION_ERROR',
          message: error.message,
        },
      });
    }
  });

  /**
   * GET /integration/ingest/method
   * Get configured integration method for a dataset
   */
  fastify.get('/method', async (request: FastifyRequest, reply: FastifyReply) => {
    const { dataset } = request.query as { dataset?: string };
    
    if (!dataset) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'dataset query parameter is required' },
      });
    }

    const method = await getIntegrationMethod(request.tenantId, dataset.toUpperCase());
    
    return reply.send({
      success: true,
      data: {
        dataset: dataset.toUpperCase(),
        method,
      },
    });
  });

  /**
   * GET /integration/ingest/webhook-info
   * Get webhook endpoint info for API mode
   */
  fastify.get('/webhook-info', async (request: FastifyRequest, reply: FastifyReply) => {
    const { dataset, source_system_code } = request.query as { dataset?: string; source_system_code?: string };

    // Get or generate webhook endpoint info
    const baseUrl = `${request.protocol}://${request.hostname}`;
    
    const webhookInfo = {
      endpoint: `${baseUrl}/api/v1/integration/ingest`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': request.tenantId,
        'Authorization': 'Bearer <your-api-token>',
      },
      samplePayload: {
        dataset: dataset || 'PARTY',
        source_system_code: source_system_code || 'LMS',
        mode: 'API',
        data: [
          {
            customer_id: 'CUST001',
            full_name: 'John Doe',
            national_id: '1234567890',
            mobile: '+966501234567',
            email: 'john@example.com',
          },
        ],
      },
    };

    return reply.send({
      success: true,
      data: webhookInfo,
    });
  });

  /**
   * POST /integration/ingest/validate
   * Validate data without ingesting (dry run)
   */
  fastify.post('/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as IngestBody;
    
    if (!body.dataset || !body.data || body.data.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'dataset and data are required' },
      });
    }

    // Get mapping
    let mapping = body.mapping;
    if (!mapping && body.source_system_code) {
      const mappingResult = await queryWithTenant(
        request.tenantId,
        `SELECT mt.mapping_json FROM integration.mapping_templates mt
         JOIN mdm.source_systems ss ON ss.id = mt.source_system_id
         WHERE mt.tenant_id = $1 AND ss.code = $2 AND mt.dataset = $3 AND mt.is_default = true`,
        [request.tenantId, body.source_system_code, body.dataset]
      );
      mapping = mappingResult.rows[0]?.mapping_json;
    }

    if (!mapping) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_MAPPING', message: 'No mapping template found. Provide mapping or ensure default exists.' },
      });
    }

    // Validate each record
    const validationResults: Array<{
      index: number;
      externalRef: string;
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }> = [];

    const externalRefField = (mapping as any).externalRefField || 'id';

    for (let i = 0; i < body.data.length; i++) {
      const record = body.data[i];
      const externalRef = String(record[externalRefField] || '');
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check external ref
      if (!externalRef) {
        errors.push(`Missing external reference field: ${externalRefField}`);
      }

      // Check required fields based on dataset
      if (body.dataset === 'PARTY') {
        const nameField = (mapping as any).nameFields?.primary;
        if (nameField && !record[nameField]) {
          errors.push(`Missing required name field: ${nameField}`);
        }

        // Check at least one identifier
        const identifierFields = (mapping as any).identifierFields || [];
        const hasIdentifier = identifierFields.some((f: any) => record[f.field]);
        if (!hasIdentifier && identifierFields.length > 0) {
          warnings.push('No identifier provided');
        }
      }

      if (body.dataset === 'CONTRACT') {
        const partyRefField = (mapping as any).partyRefField;
        if (partyRefField && !record[partyRefField]) {
          errors.push(`Missing party reference field: ${partyRefField}`);
        }
      }

      validationResults.push({
        index: i,
        externalRef,
        isValid: errors.length === 0,
        errors,
        warnings,
      });
    }

    const validCount = validationResults.filter(r => r.isValid).length;
    const invalidCount = validationResults.filter(r => !r.isValid).length;

    return reply.send({
      success: true,
      data: {
        totalRecords: body.data.length,
        validRecords: validCount,
        invalidRecords: invalidCount,
        results: validationResults,
      },
    });
  });
}
