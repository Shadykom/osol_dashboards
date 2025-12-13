/**
 * EPIC 4: Audit, Evidence, Lineage
 * Common Package - Exports all utilities for audit, evidence, and lineage
 */

// Audit Emitter
export { default as auditEmitter, AuditEmitter } from './auditEmitter.js';
export {
  AuditEventTypes,
  SecurityEventTypes,
  Severity,
  EntityTypes,
  TraceTypes
} from './auditEmitter.js';

// Lineage Emitter
export { default as lineageEmitter, LineageEmitter } from './lineageEmitter.js';
export {
  DecisionResults,
  LinkTypes,
  TraceStatus
} from './lineageEmitter.js';

// Evidence utilities
export { default as evidenceUtils, EvidenceUtils } from './evidenceUtils.js';
export { EvidenceActions } from './evidenceUtils.js';

// Re-export as namespaces
import auditEmitter, {
  AuditEventTypes,
  SecurityEventTypes,
  Severity,
  EntityTypes,
  TraceTypes,
  AuditEmitter
} from './auditEmitter.js';

import lineageEmitter, {
  DecisionResults,
  LinkTypes,
  TraceStatus,
  LineageEmitter
} from './lineageEmitter.js';

import evidenceUtils, {
  EvidenceActions,
  EvidenceUtils
} from './evidenceUtils.js';

export const audit = {
  emitter: auditEmitter,
  AuditEmitter,
  eventTypes: AuditEventTypes,
  securityEventTypes: SecurityEventTypes,
  severity: Severity,
  entityTypes: EntityTypes,
  traceTypes: TraceTypes
};

export const lineage = {
  emitter: lineageEmitter,
  LineageEmitter,
  decisionResults: DecisionResults,
  linkTypes: LinkTypes,
  traceStatus: TraceStatus
};

export const evidence = {
  utils: evidenceUtils,
  EvidenceUtils,
  actions: EvidenceActions
};

/**
 * Initialize all audit system components with a single config
 * @param {Object} config - Configuration object
 * @param {Object} config.supabaseClient - Supabase client instance
 * @param {string} config.tenantId - Default tenant ID
 * @param {string} config.source - Default source identifier
 * @returns {Object} - Initialized components
 */
export function initAuditSystem(config) {
  const { supabaseClient, tenantId, source } = config;
  
  if (supabaseClient) {
    auditEmitter.setClient(supabaseClient);
    lineageEmitter.setClient(supabaseClient);
    evidenceUtils.setClient(supabaseClient);
  }
  
  if (tenantId) {
    auditEmitter.setTenantId(tenantId);
    lineageEmitter.setTenantId(tenantId);
    evidenceUtils.setTenantId(tenantId);
  }
  
  if (source) {
    auditEmitter.setSource(source);
  }
  
  return {
    auditEmitter,
    lineageEmitter,
    evidenceUtils
  };
}

// Default export
export default {
  auditEmitter,
  lineageEmitter,
  evidenceUtils,
  initAuditSystem,
  // Constants
  AuditEventTypes,
  SecurityEventTypes,
  Severity,
  EntityTypes,
  TraceTypes,
  DecisionResults,
  LinkTypes,
  TraceStatus,
  EvidenceActions
};
