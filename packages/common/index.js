/**
 * EPIC 4: Audit, Evidence, Lineage
 * Common Package - Exports all utilities for audit, evidence, lineage, and SIEM
 */

// SIEM Forwarding Module
export { 
  emitSecurityEvent, 
  SecurityEventTypes as SIEMSecurityEventTypes, 
  SIEMConfig, 
  configureSIEM 
} from './siem/index.js';

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

import { 
  emitSecurityEvent, 
  configureSIEM, 
  SIEMConfig,
  SecurityEventTypes as SIEMSecurityEventTypes 
} from './siem/index.js';

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

export const siem = {
  emit: emitSecurityEvent,
  configure: configureSIEM,
  config: SIEMConfig,
  eventTypes: SIEMSecurityEventTypes
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
    configureSIEM(supabaseClient); // Also configure SIEM
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
    evidenceUtils,
    siem: { emit: emitSecurityEvent, configure: configureSIEM }
  };
}

// Default export
export default {
  auditEmitter,
  lineageEmitter,
  evidenceUtils,
  initAuditSystem,
  // SIEM
  siem,
  emitSecurityEvent,
  configureSIEM,
  // Constants
  AuditEventTypes,
  SecurityEventTypes,
  Severity,
  EntityTypes,
  TraceTypes,
  DecisionResults,
  LinkTypes,
  TraceStatus,
  EvidenceActions,
  SIEMSecurityEventTypes,
  SIEMConfig
};
