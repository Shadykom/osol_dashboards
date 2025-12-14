/**
 * Ingestion Service
 * EPIC 5 - Core ingestion logic with idempotency, DQ rules, and audit
 */

import crypto from 'crypto';
import { transactionWithTenant, queryWithTenant } from '../db/index.js';
import { logIntegrationAuditEvent } from './audit.js';
import type { PoolClient } from 'pg';

// Types
export interface IngestionRequest {
  dataset: 'PARTY' | 'CONTRACT' | 'CHARGE';
  sourceSystemCode: string;
  mode?: 'FILE' | 'MANUAL' | 'API' | 'DB';
  data: Record<string, unknown>[];
  mapping?: MappingTemplate;
  fileName?: string;
  fileSize?: number;
}

export interface MappingTemplate {
  externalRefField: string;
  partyTypeField?: string;
  partyTypeMapping?: Record<string, string>;
  nameFields?: {
    primary: string;
    primaryAr?: string;
    firstName?: string;
    lastName?: string;
  };
  identifierFields?: Array<{
    field: string;
    type: string;
    typeField?: string;
  }>;
  contactFields?: Array<{
    field: string;
    type: string;
    isPrimary?: boolean;
  }>;
  attributeFields?: string[];
  // Contract-specific
  partyRefField?: string;
  productCodeField?: string;
  contractNumberField?: string;
  securedFlagField?: string;
  statusField?: string;
  statusMapping?: Record<string, string>;
  dateFields?: {
    startDate?: string;
    endDate?: string;
  };
  contractKeyFields?: string[];
}

export interface IngestionResult {
  runId: string;
  status: 'success' | 'partial' | 'failed';
  stats: {
    totalReceived: number;
    totalProcessed: number;
    totalInserted: number;
    totalUpdated: number;
    totalSkipped: number;
    totalFailed: number;
  };
  dqIssuesCount: number;
  errors: Array<{ index: number; externalRef: string; error: string }>;
}

export interface DQRule {
  code: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  check: (record: Record<string, unknown>, mapping: MappingTemplate) => string | null;
}

// Data Quality Rules for PARTY
const PARTY_DQ_RULES: DQRule[] = [
  {
    code: 'MISSING_PRIMARY_ID',
    name: 'Missing Primary Identifier',
    severity: 'critical',
    check: (record, mapping) => {
      if (!mapping.identifierFields || mapping.identifierFields.length === 0) {
        return null;
      }
      const hasIdentifier = mapping.identifierFields.some(idField => {
        const value = record[idField.field];
        return value && String(value).trim().length > 0;
      });
      return hasIdentifier ? null : 'No valid identifier found';
    },
  },
  {
    code: 'MISSING_NAME',
    name: 'Missing Name',
    severity: 'critical',
    check: (record, mapping) => {
      if (!mapping.nameFields) return null;
      const name = record[mapping.nameFields.primary];
      if (!name || String(name).trim().length === 0) {
        return 'Primary name is missing or empty';
      }
      return null;
    },
  },
  {
    code: 'INVALID_PHONE',
    name: 'Invalid Phone Format',
    severity: 'medium',
    check: (record, mapping) => {
      if (!mapping.contactFields) return null;
      const phoneField = mapping.contactFields.find(c => 
        c.type === 'PHONE' || c.type === 'MOBILE'
      );
      if (!phoneField) return null;
      const phone = record[phoneField.field];
      if (!phone) return null;
      
      // Basic phone validation: should be digits, spaces, +, -, ()
      const phoneStr = String(phone);
      const cleanPhone = phoneStr.replace(/[\s\-\(\)\+]/g, '');
      if (cleanPhone.length > 0 && (!/^\d+$/.test(cleanPhone) || cleanPhone.length < 7)) {
        return `Invalid phone format: ${phoneStr}`;
      }
      return null;
    },
  },
];

// Contract DQ Rules
const CONTRACT_DQ_RULES: DQRule[] = [
  {
    code: 'MISSING_CONTRACT_NUMBER',
    name: 'Missing Contract Number',
    severity: 'critical',
    check: (record, mapping) => {
      if (!mapping.contractNumberField) return null;
      const contractNum = record[mapping.contractNumberField];
      if (!contractNum || String(contractNum).trim().length === 0) {
        return 'Contract number is missing';
      }
      return null;
    },
  },
  {
    code: 'INVALID_DATE_RANGE',
    name: 'Invalid Date Range',
    severity: 'high',
    check: (record, mapping) => {
      if (!mapping.dateFields) return null;
      const { startDate, endDate } = mapping.dateFields;
      if (!startDate || !endDate) return null;
      
      const start = record[startDate];
      const end = record[endDate];
      if (!start || !end) return null;
      
      const startDt = new Date(String(start));
      const endDt = new Date(String(end));
      
      if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
        return 'Invalid date format';
      }
      
      if (startDt > endDt) {
        return 'Start date is after end date';
      }
      return null;
    },
  },
];

/**
 * Calculate SHA256 hash of a payload
 */
function calculatePayloadHash(payload: Record<string, unknown>): string {
  const normalized = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Run DQ checks on a record
 */
function runDQChecks(
  record: Record<string, unknown>,
  mapping: MappingTemplate,
  entityType: 'PARTY' | 'CONTRACT'
): Array<{ ruleCode: string; ruleName: string; severity: string; message: string }> {
  const rules = entityType === 'PARTY' ? PARTY_DQ_RULES : CONTRACT_DQ_RULES;
  const issues: Array<{ ruleCode: string; ruleName: string; severity: string; message: string }> = [];

  for (const rule of rules) {
    const message = rule.check(record, mapping);
    if (message) {
      issues.push({
        ruleCode: rule.code,
        ruleName: rule.name,
        severity: rule.severity,
        message,
      });
    }
  }

  return issues;
}

/**
 * Get or create source system
 */
async function getSourceSystem(
  client: PoolClient,
  tenantId: string,
  code: string
): Promise<{ id: string; code: string } | null> {
  const result = await client.query(
    'SELECT id, code FROM mdm.source_systems WHERE tenant_id = $1 AND code = $2',
    [tenantId, code.toUpperCase()]
  );
  return result.rows[0] || null;
}

/**
 * Get default mapping template for dataset/source
 */
async function getDefaultMapping(
  client: PoolClient,
  tenantId: string,
  sourceSystemId: string,
  dataset: string
): Promise<MappingTemplate | null> {
  const result = await client.query(
    `SELECT mapping_json FROM integration.mapping_templates 
     WHERE tenant_id = $1 AND source_system_id = $2 AND dataset = $3 AND is_default = true AND status = 'active'
     ORDER BY version DESC LIMIT 1`,
    [tenantId, sourceSystemId, dataset]
  );
  return result.rows[0]?.mapping_json || null;
}

/**
 * Create an ingestion run record
 */
async function createIngestionRun(
  client: PoolClient,
  tenantId: string,
  params: {
    sourceSystemId: string;
    mode: string;
    dataset: string;
    fileName?: string;
    fileSize?: number;
    triggeredBy?: string;
  }
): Promise<string> {
  const result = await client.query(
    `INSERT INTO integration.ingestion_runs 
     (tenant_id, source_system_id, mode, dataset, file_name, file_size_bytes, triggered_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'running')
     RETURNING id`,
    [
      tenantId,
      params.sourceSystemId,
      params.mode,
      params.dataset,
      params.fileName || null,
      params.fileSize || null,
      params.triggeredBy || null,
    ]
  );
  return result.rows[0].id;
}

/**
 * Process a single party record
 */
async function processPartyRecord(
  client: PoolClient,
  tenantId: string,
  sourceSystemId: string,
  runId: string,
  record: Record<string, unknown>,
  mapping: MappingTemplate
): Promise<{ outcome: 'INSERTED' | 'UPDATED' | 'SKIPPED' | 'FAILED'; partyId?: string; dqIssues: any[]; error?: string }> {
  const externalRef = String(record[mapping.externalRefField] || '');
  
  if (!externalRef) {
    return { outcome: 'FAILED', dqIssues: [], error: 'Missing external reference' };
  }

  const payloadHash = calculatePayloadHash(record);
  const dqIssues = runDQChecks(record, mapping, 'PARTY');

  // Check for existing mapping
  const existingMap = await client.query(
    `SELECT id, party_id, payload_hash FROM mdm.party_source_map 
     WHERE tenant_id = $1 AND source_system_id = $2 AND external_party_ref = $3`,
    [tenantId, sourceSystemId, externalRef]
  );

  // Idempotency check
  if (existingMap.rows.length > 0 && existingMap.rows[0].payload_hash === payloadHash) {
    // Same hash - skip
    await client.query(
      `UPDATE mdm.party_source_map SET last_seen_at = NOW() WHERE id = $1`,
      [existingMap.rows[0].id]
    );
    
    await client.query(
      `INSERT INTO integration.ingestion_items 
       (tenant_id, run_id, external_ref, entity_type, entity_id, outcome, payload_hash, dq_issues_json)
       VALUES ($1, $2, $3, 'PARTY', $4, 'SKIPPED', $5, $6)`,
      [tenantId, runId, externalRef, existingMap.rows[0].party_id, payloadHash, JSON.stringify(dqIssues)]
    );
    
    return { outcome: 'SKIPPED', partyId: existingMap.rows[0].party_id, dqIssues };
  }

  // Extract party data
  const partyType = mapping.partyTypeField 
    ? (mapping.partyTypeMapping?.[record[mapping.partyTypeField] as string] || 'PERSON')
    : 'PERSON';
    
  const primaryName = mapping.nameFields 
    ? String(record[mapping.nameFields.primary] || '')
    : externalRef;
    
  const primaryNameAr = mapping.nameFields?.primaryAr 
    ? String(record[mapping.nameFields.primaryAr] || '')
    : null;

  // Build identifiers
  const identifiers: Array<{ type: string; value: string }> = [];
  if (mapping.identifierFields) {
    for (const idField of mapping.identifierFields) {
      const value = record[idField.field];
      if (value) {
        const type = idField.typeField 
          ? String(record[idField.typeField] || idField.type)
          : idField.type;
        identifiers.push({ type, value: String(value) });
      }
    }
  }

  // Build attributes
  const attributes: Record<string, unknown> = {};
  if (mapping.attributeFields) {
    for (const field of mapping.attributeFields) {
      if (record[field] !== undefined) {
        attributes[field] = record[field];
      }
    }
  }

  let partyId: string;
  let outcome: 'INSERTED' | 'UPDATED';

  if (existingMap.rows.length > 0) {
    // Update existing party
    partyId = existingMap.rows[0].party_id;
    
    await client.query(
      `UPDATE mdm.party_golden SET 
       primary_name = $2, primary_name_ar = $3, identifiers_json = $4, attributes_json = $5
       WHERE party_id = $1`,
      [partyId, primaryName, primaryNameAr, JSON.stringify(identifiers), JSON.stringify(attributes)]
    );
    
    await client.query(
      `UPDATE mdm.party_source_map SET payload_hash = $2, last_seen_at = NOW() WHERE id = $1`,
      [existingMap.rows[0].id, payloadHash]
    );
    
    outcome = 'UPDATED';
  } else {
    // Create new party
    const partyResult = await client.query(
      `INSERT INTO mdm.party_golden 
       (tenant_id, party_type, primary_name, primary_name_ar, identifiers_json, attributes_json)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING party_id`,
      [tenantId, partyType, primaryName, primaryNameAr, JSON.stringify(identifiers), JSON.stringify(attributes)]
    );
    partyId = partyResult.rows[0].party_id;
    
    // Create source map
    await client.query(
      `INSERT INTO mdm.party_source_map 
       (tenant_id, source_system_id, external_party_ref, party_id, payload_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, sourceSystemId, externalRef, partyId, payloadHash]
    );
    
    outcome = 'INSERTED';
  }

  // Store source record
  await client.query(
    `INSERT INTO mdm.party_source_record 
     (tenant_id, source_system_id, external_party_ref, payload_json, payload_hash, ingestion_run_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tenantId, sourceSystemId, externalRef, JSON.stringify(record), payloadHash, runId]
  );

  // Process contacts
  if (mapping.contactFields) {
    for (const contactField of mapping.contactFields) {
      const value = record[contactField.field];
      if (value) {
        await client.query(
          `INSERT INTO mdm.party_contacts 
           (tenant_id, party_id, contact_type, value, is_primary, source_system_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [tenantId, partyId, contactField.type, String(value), contactField.isPrimary || false, sourceSystemId]
        );
      }
    }
  }

  // Create DQ issues
  for (const issue of dqIssues) {
    await client.query(
      `INSERT INTO mdm.data_quality_issues 
       (tenant_id, entity_type, entity_id, severity, rule_code, rule_name, message)
       VALUES ($1, 'PARTY', $2, $3, $4, $5, $6)`,
      [tenantId, partyId, issue.severity, issue.ruleCode, issue.ruleName, issue.message]
    );
  }

  // Record ingestion item
  await client.query(
    `INSERT INTO integration.ingestion_items 
     (tenant_id, run_id, external_ref, entity_type, entity_id, outcome, payload_hash, dq_issues_json)
     VALUES ($1, $2, $3, 'PARTY', $4, $5, $6, $7)`,
    [tenantId, runId, externalRef, partyId, outcome, payloadHash, JSON.stringify(dqIssues)]
  );

  return { outcome, partyId, dqIssues };
}

/**
 * Process a single contract record
 */
async function processContractRecord(
  client: PoolClient,
  tenantId: string,
  sourceSystemId: string,
  runId: string,
  record: Record<string, unknown>,
  mapping: MappingTemplate
): Promise<{ outcome: 'INSERTED' | 'UPDATED' | 'SKIPPED' | 'FAILED'; contractId?: string; dqIssues: any[]; error?: string }> {
  const externalRef = String(record[mapping.externalRefField] || '');
  
  if (!externalRef) {
    return { outcome: 'FAILED', dqIssues: [], error: 'Missing external reference' };
  }

  const payloadHash = calculatePayloadHash(record);
  const dqIssues = runDQChecks(record, mapping, 'CONTRACT');

  // Check for existing mapping
  const existingMap = await client.query(
    `SELECT id, contract_id, payload_hash FROM mdm.contract_source_map 
     WHERE tenant_id = $1 AND source_system_id = $2 AND external_contract_ref = $3`,
    [tenantId, sourceSystemId, externalRef]
  );

  // Idempotency check
  if (existingMap.rows.length > 0 && existingMap.rows[0].payload_hash === payloadHash) {
    await client.query(
      `UPDATE mdm.contract_source_map SET last_seen_at = NOW() WHERE id = $1`,
      [existingMap.rows[0].id]
    );
    
    await client.query(
      `INSERT INTO integration.ingestion_items 
       (tenant_id, run_id, external_ref, entity_type, entity_id, outcome, payload_hash, dq_issues_json)
       VALUES ($1, $2, $3, 'CONTRACT', $4, 'SKIPPED', $5, $6)`,
      [tenantId, runId, externalRef, existingMap.rows[0].contract_id, payloadHash, JSON.stringify(dqIssues)]
    );
    
    return { outcome: 'SKIPPED', contractId: existingMap.rows[0].contract_id, dqIssues };
  }

  // Find party by external ref
  let partyId: string | null = null;
  if (mapping.partyRefField) {
    const partyRef = String(record[mapping.partyRefField] || '');
    if (partyRef) {
      const partyResult = await client.query(
        `SELECT party_id FROM mdm.party_source_map 
         WHERE tenant_id = $1 AND source_system_id = $2 AND external_party_ref = $3`,
        [tenantId, sourceSystemId, partyRef]
      );
      partyId = partyResult.rows[0]?.party_id || null;
    }
  }

  if (!partyId) {
    dqIssues.push({
      ruleCode: 'ORPHAN_CONTRACT',
      ruleName: 'Orphan Contract',
      severity: 'critical',
      message: 'No matching party found for contract',
    });
  }

  // Extract contract data
  const productCode = mapping.productCodeField ? String(record[mapping.productCodeField] || '') : null;
  const contractNumber = mapping.contractNumberField ? String(record[mapping.contractNumberField] || '') : null;
  const securedFlag = mapping.securedFlagField ? Boolean(record[mapping.securedFlagField]) : false;
  
  let status = 'active';
  if (mapping.statusField) {
    const rawStatus = String(record[mapping.statusField] || 'active');
    status = mapping.statusMapping?.[rawStatus] || rawStatus.toLowerCase();
  }

  const startDate = mapping.dateFields?.startDate ? record[mapping.dateFields.startDate] : null;
  const endDate = mapping.dateFields?.endDate ? record[mapping.dateFields.endDate] : null;

  // Build contract keys
  const contractKeys: Record<string, unknown> = {};
  if (mapping.contractKeyFields) {
    for (const field of mapping.contractKeyFields) {
      if (record[field] !== undefined) {
        contractKeys[field] = record[field];
      }
    }
  }

  // Build attributes
  const attributes: Record<string, unknown> = {};
  if (mapping.attributeFields) {
    for (const field of mapping.attributeFields) {
      if (record[field] !== undefined) {
        attributes[field] = record[field];
      }
    }
  }

  let contractId: string;
  let outcome: 'INSERTED' | 'UPDATED';

  // If no party found, we still create the contract but with a placeholder party (or skip)
  if (!partyId) {
    // Create a placeholder party
    const placeholderResult = await client.query(
      `INSERT INTO mdm.party_golden 
       (tenant_id, party_type, primary_name, identifiers_json, status)
       VALUES ($1, 'PERSON', $2, '[]', 'inactive')
       RETURNING party_id`,
      [tenantId, `Unknown Party - ${externalRef}`]
    );
    partyId = placeholderResult.rows[0].party_id;
  }

  if (existingMap.rows.length > 0) {
    // Update existing contract
    contractId = existingMap.rows[0].contract_id;
    
    await client.query(
      `UPDATE mdm.contract_golden SET 
       product_code = $2, contract_number = $3, secured_flag = $4, status = $5,
       contract_keys_json = $6, attributes_json = $7, start_date = $8, end_date = $9
       WHERE contract_id = $1`,
      [contractId, productCode, contractNumber, securedFlag, status, 
       JSON.stringify(contractKeys), JSON.stringify(attributes), startDate, endDate]
    );
    
    await client.query(
      `UPDATE mdm.contract_source_map SET payload_hash = $2, last_seen_at = NOW() WHERE id = $1`,
      [existingMap.rows[0].id, payloadHash]
    );
    
    outcome = 'UPDATED';
  } else {
    // Create new contract
    const contractResult = await client.query(
      `INSERT INTO mdm.contract_golden 
       (tenant_id, party_id, product_code, contract_number, secured_flag, status, 
        contract_keys_json, attributes_json, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING contract_id`,
      [tenantId, partyId, productCode, contractNumber, securedFlag, status,
       JSON.stringify(contractKeys), JSON.stringify(attributes), startDate, endDate]
    );
    contractId = contractResult.rows[0].contract_id;
    
    // Create source map
    await client.query(
      `INSERT INTO mdm.contract_source_map 
       (tenant_id, source_system_id, external_contract_ref, contract_id, payload_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, sourceSystemId, externalRef, contractId, payloadHash]
    );
    
    outcome = 'INSERTED';
  }

  // Create DQ issues
  for (const issue of dqIssues) {
    await client.query(
      `INSERT INTO mdm.data_quality_issues 
       (tenant_id, entity_type, entity_id, severity, rule_code, rule_name, message)
       VALUES ($1, 'CONTRACT', $2, $3, $4, $5, $6)`,
      [tenantId, contractId, issue.severity, issue.ruleCode, issue.ruleName, issue.message]
    );
  }

  // Record ingestion item
  await client.query(
    `INSERT INTO integration.ingestion_items 
     (tenant_id, run_id, external_ref, entity_type, entity_id, outcome, payload_hash, dq_issues_json)
     VALUES ($1, $2, $3, 'CONTRACT', $4, $5, $6, $7)`,
    [tenantId, runId, externalRef, contractId, outcome, payloadHash, JSON.stringify(dqIssues)]
  );

  return { outcome, contractId, dqIssues };
}

/**
 * Main ingestion function
 */
export async function runIngestion(
  tenantId: string,
  request: IngestionRequest,
  userId?: string
): Promise<IngestionResult> {
  const stats = {
    totalReceived: request.data.length,
    totalProcessed: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    totalFailed: 0,
  };
  const errors: Array<{ index: number; externalRef: string; error: string }> = [];
  let dqIssuesCount = 0;
  let runId = '';

  try {
    const result = await transactionWithTenant(tenantId, async (client) => {
      // Get source system
      const sourceSystem = await getSourceSystem(client, tenantId, request.sourceSystemCode);
      if (!sourceSystem) {
        throw new Error(`Source system '${request.sourceSystemCode}' not found`);
      }

      // Get mapping
      let mapping = request.mapping;
      if (!mapping) {
        mapping = await getDefaultMapping(client, tenantId, sourceSystem.id, request.dataset);
      }
      if (!mapping) {
        throw new Error(`No mapping template found for dataset '${request.dataset}' and source '${request.sourceSystemCode}'`);
      }

      // Create run record
      runId = await createIngestionRun(client, tenantId, {
        sourceSystemId: sourceSystem.id,
        mode: request.mode || 'API',
        dataset: request.dataset,
        fileName: request.fileName,
        fileSize: request.fileSize,
        triggeredBy: userId,
      });

      // Audit: ingestion started
      await logIntegrationAuditEvent(tenantId, {
        action: 'INGESTION_START',
        runId,
        dataset: request.dataset,
        sourceSystem: request.sourceSystemCode,
        userId,
      });

      // Process each record
      for (let i = 0; i < request.data.length; i++) {
        const record = request.data[i];
        
        try {
          let result;
          
          if (request.dataset === 'PARTY') {
            result = await processPartyRecord(client, tenantId, sourceSystem.id, runId, record, mapping);
          } else if (request.dataset === 'CONTRACT') {
            result = await processContractRecord(client, tenantId, sourceSystem.id, runId, record, mapping);
          } else {
            throw new Error(`Unsupported dataset: ${request.dataset}`);
          }

          stats.totalProcessed++;
          dqIssuesCount += result.dqIssues.length;

          switch (result.outcome) {
            case 'INSERTED':
              stats.totalInserted++;
              break;
            case 'UPDATED':
              stats.totalUpdated++;
              break;
            case 'SKIPPED':
              stats.totalSkipped++;
              break;
            case 'FAILED':
              stats.totalFailed++;
              errors.push({
                index: i,
                externalRef: String(record[mapping.externalRefField] || ''),
                error: result.error || 'Unknown error',
              });
              break;
          }
        } catch (error: any) {
          stats.totalFailed++;
          errors.push({
            index: i,
            externalRef: String(record[mapping.externalRefField] || ''),
            error: error.message,
          });
        }
      }

      // Update run status and stats
      const finalStatus = stats.totalFailed === stats.totalReceived 
        ? 'failed' 
        : stats.totalFailed > 0 
          ? 'partial' 
          : 'success';

      await client.query(
        `UPDATE integration.ingestion_runs 
         SET status = $2, ended_at = NOW(), stats_json = $3
         WHERE id = $1`,
        [runId, finalStatus, JSON.stringify({
          total_received: stats.totalReceived,
          total_processed: stats.totalProcessed,
          total_inserted: stats.totalInserted,
          total_updated: stats.totalUpdated,
          total_skipped: stats.totalSkipped,
          total_failed: stats.totalFailed,
        })]
      );

      // Create reconciliation summary
      await client.query('SELECT integration.create_reconciliation_summary($1)', [runId]);

      // Update data freshness
      await client.query('SELECT integration.update_data_freshness($1, $2)', [runId, stats.totalProcessed]);

      return finalStatus;
    });

    // Audit: ingestion completed
    await logIntegrationAuditEvent(tenantId, {
      action: 'INGESTION_COMPLETE',
      runId,
      dataset: request.dataset,
      sourceSystem: request.sourceSystemCode,
      stats,
      userId,
    });

    return {
      runId,
      status: result as 'success' | 'partial' | 'failed',
      stats,
      dqIssuesCount,
      errors,
    };
  } catch (error: any) {
    // Audit: ingestion failed
    await logIntegrationAuditEvent(tenantId, {
      action: 'INGESTION_FAILED',
      runId,
      dataset: request.dataset,
      sourceSystem: request.sourceSystemCode,
      errorMessage: error.message,
      userId,
    });

    throw error;
  }
}

/**
 * Get integration method from config
 */
export async function getIntegrationMethod(
  tenantId: string,
  dataset: string
): Promise<string> {
  const result = await queryWithTenant<{ value: unknown }>(
    tenantId,
    `SELECT value FROM tenant_config WHERE tenant_id = $1 AND key = $2`,
    [tenantId, `integration.method.${dataset}`]
  );
  
  if (result.rows.length > 0) {
    const value = result.rows[0].value;
    return typeof value === 'string' ? value : String(value).replace(/"/g, '');
  }
  
  return 'FILE'; // Default
}
