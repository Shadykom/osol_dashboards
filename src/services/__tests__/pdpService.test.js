/**
 * =====================================================
 * EPIC 3: PDP Service Unit Tests
 * =====================================================
 * 
 * Comprehensive tests for the Policy Decision Point service.
 * Tests cover:
 * - Request validation
 * - Rule evaluation (max attempts, time windows, cooling periods, consent)
 * - Decision logic (ALLOW, BLOCK, APPROVAL_REQUIRED)
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PDPService, DECISIONS, REASON_CODES, RULE_TYPES } from '../pdpService';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                or: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
                  }))
                }))
              }))
            }))
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [{ attempt_count: 0, last_attempt_at: null }], error: null }))
  }
}));

describe('PDPService', () => {
  let pdpService;
  
  beforeEach(() => {
    pdpService = new PDPService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =====================================================
  // Request Validation Tests
  // =====================================================
  
  describe('Request Validation', () => {
    it('should throw error when tenant_id is missing', async () => {
      const request = {
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001'
      };
      
      const result = await pdpService.evaluateDecision(request);
      expect(result.decision).toBe(DECISIONS.BLOCK);
      expect(result.reason_code).toBe('EVALUATION_ERROR');
    });

    it('should throw error when customer_type is invalid', async () => {
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'INVALID',
        action_type: 'CALL',
        customer_id: 'CUST001'
      };
      
      const result = await pdpService.evaluateDecision(request);
      expect(result.decision).toBe(DECISIONS.BLOCK);
      expect(result.reason_code).toBe('EVALUATION_ERROR');
    });

    it('should throw error when customer_id is missing', async () => {
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL'
      };
      
      const result = await pdpService.evaluateDecision(request);
      expect(result.decision).toBe(DECISIONS.BLOCK);
      expect(result.reason_code).toBe('EVALUATION_ERROR');
    });

    it('should accept valid request with all required fields', () => {
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001'
      };
      
      expect(() => pdpService.validateRequest(request)).not.toThrow();
    });
  });

  // =====================================================
  // Max Attempts Rule Tests
  // =====================================================
  
  describe('Max Attempts Rule', () => {
    it('should ALLOW when attempts are below limit', async () => {
      const rule = {
        type: RULE_TYPES.MAX_ATTEMPTS,
        max_attempts: 10,
        window: '7d',
        on_violation: 'BLOCK'
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001'
      };
      
      const contactHistory = {
        window: '7d',
        attempts: 5,
        last_attempt_at: new Date(Date.now() - 86400000).toISOString()
      };
      
      const result = await pdpService.evaluateMaxAttemptsRule(rule, request, contactHistory);
      expect(result.passed).toBe(true);
    });

    it('should BLOCK when max attempts exceeded', async () => {
      const rule = {
        type: RULE_TYPES.MAX_ATTEMPTS,
        max_attempts: 10,
        window: '7d',
        on_violation: 'BLOCK'
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001'
      };
      
      const contactHistory = {
        window: '7d',
        attempts: 10,
        last_attempt_at: new Date(Date.now() - 3600000).toISOString()
      };
      
      const result = await pdpService.evaluateMaxAttemptsRule(rule, request, contactHistory);
      expect(result.passed).toBe(false);
      expect(result.reason_code).toBe(REASON_CODES.MAX_ATTEMPTS_EXCEEDED);
    });

    it('should return APPROVAL_REQUIRED when configured', async () => {
      const rule = {
        type: RULE_TYPES.MAX_ATTEMPTS,
        max_attempts: 10,
        window: '7d',
        on_violation: 'APPROVAL_REQUIRED'
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001'
      };
      
      const contactHistory = {
        window: '7d',
        attempts: 15,
        last_attempt_at: new Date().toISOString()
      };
      
      const result = await pdpService.evaluateMaxAttemptsRule(rule, request, contactHistory);
      expect(result.passed).toBe(false);
      expect(result.required_evidence).toContain('manager_approval');
    });

    it('should skip rule if action_type does not match', async () => {
      const rule = {
        type: RULE_TYPES.MAX_ATTEMPTS,
        max_attempts: 10,
        window: '7d',
        action_types: ['CALL', 'SMS'],
        on_violation: 'BLOCK'
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'EMAIL',
        customer_id: 'CUST001'
      };
      
      const contactHistory = {
        window: '7d',
        attempts: 15,
        last_attempt_at: new Date().toISOString()
      };
      
      const result = await pdpService.evaluateMaxAttemptsRule(rule, request, contactHistory);
      expect(result.passed).toBe(true);
    });
  });

  // =====================================================
  // Time Window Rule Tests
  // =====================================================
  
  describe('Time Window Rule', () => {
    it('should ALLOW when within allowed time window', () => {
      const rule = {
        type: RULE_TYPES.TIME_WINDOW,
        allowed_windows: [
          {
            days: [0, 1, 2, 3, 4],  // Sun-Thu
            start_time: '09:00',
            end_time: '18:00'
          }
        ],
        timezone: 'UTC'
      };
      
      // Mock a Monday at 10:00 AM UTC
      const mondayMorning = new Date('2024-01-08T10:00:00Z');
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        timestamp: mondayMorning.toISOString()
      };
      
      const result = pdpService.evaluateTimeWindowRule(rule, request);
      expect(result.passed).toBe(true);
    });

    it('should BLOCK when outside allowed time window', () => {
      const rule = {
        type: RULE_TYPES.TIME_WINDOW,
        allowed_windows: [
          {
            days: [0, 1, 2, 3, 4],
            start_time: '09:00',
            end_time: '18:00'
          }
        ],
        timezone: 'UTC'
      };
      
      // Mock a Monday at 22:00 (10 PM) UTC
      const mondayNight = new Date('2024-01-08T22:00:00Z');
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        timestamp: mondayNight.toISOString()
      };
      
      const result = pdpService.evaluateTimeWindowRule(rule, request);
      expect(result.passed).toBe(false);
      expect(result.reason_code).toBe(REASON_CODES.OUTSIDE_TIME_WINDOW);
    });

    it('should BLOCK on weekend when only weekdays allowed', () => {
      const rule = {
        type: RULE_TYPES.TIME_WINDOW,
        allowed_windows: [
          {
            days: [1, 2, 3, 4, 5],  // Mon-Fri
            start_time: '09:00',
            end_time: '18:00'
          }
        ],
        timezone: 'UTC'
      };
      
      // Saturday at 10:00 AM UTC
      const saturdayMorning = new Date('2024-01-13T10:00:00Z');
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        timestamp: saturdayMorning.toISOString()
      };
      
      const result = pdpService.evaluateTimeWindowRule(rule, request);
      expect(result.passed).toBe(false);
    });

    it('should handle multiple time windows', () => {
      const rule = {
        type: RULE_TYPES.TIME_WINDOW,
        allowed_windows: [
          {
            days: [0, 1, 2, 3, 4],
            start_time: '09:00',
            end_time: '12:00'
          },
          {
            days: [0, 1, 2, 3, 4],
            start_time: '14:00',
            end_time: '18:00'
          }
        ],
        timezone: 'UTC'
      };
      
      // Monday at 15:00 (3 PM) - should be allowed in second window
      const mondayAfternoon = new Date('2024-01-08T15:00:00Z');
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        timestamp: mondayAfternoon.toISOString()
      };
      
      const result = pdpService.evaluateTimeWindowRule(rule, request);
      expect(result.passed).toBe(true);
    });

    it('should BLOCK during lunch break between windows', () => {
      const rule = {
        type: RULE_TYPES.TIME_WINDOW,
        allowed_windows: [
          {
            days: [0, 1, 2, 3, 4],
            start_time: '09:00',
            end_time: '12:00'
          },
          {
            days: [0, 1, 2, 3, 4],
            start_time: '14:00',
            end_time: '18:00'
          }
        ],
        timezone: 'UTC'
      };
      
      // Monday at 13:00 (1 PM) - lunch break
      const mondayLunch = new Date('2024-01-08T13:00:00Z');
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        timestamp: mondayLunch.toISOString()
      };
      
      const result = pdpService.evaluateTimeWindowRule(rule, request);
      expect(result.passed).toBe(false);
    });
  });

  // =====================================================
  // Cooling Period Rule Tests
  // =====================================================
  
  describe('Cooling Period Rule', () => {
    it('should ALLOW when cooling period has elapsed', async () => {
      const rule = {
        type: RULE_TYPES.COOLING_PERIOD,
        cooling_period: '24h'
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        timestamp: new Date().toISOString()
      };
      
      const contactHistory = {
        last_attempt_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()  // 25 hours ago
      };
      
      const result = await pdpService.evaluateCoolingPeriodRule(rule, request, contactHistory);
      expect(result.passed).toBe(true);
    });

    it('should BLOCK when cooling period is still active', async () => {
      const rule = {
        type: RULE_TYPES.COOLING_PERIOD,
        cooling_period: '24h'
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        timestamp: new Date().toISOString()
      };
      
      const contactHistory = {
        last_attempt_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()  // 12 hours ago
      };
      
      const result = await pdpService.evaluateCoolingPeriodRule(rule, request, contactHistory);
      expect(result.passed).toBe(false);
      expect(result.reason_code).toBe(REASON_CODES.COOLING_PERIOD_ACTIVE);
      expect(result.cooling_period_until).toBeDefined();
    });

    it('should ALLOW when no previous attempts exist', async () => {
      const rule = {
        type: RULE_TYPES.COOLING_PERIOD,
        cooling_period: '24h'
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001'
      };
      
      const contactHistory = {
        last_attempt_at: null
      };
      
      const result = await pdpService.evaluateCoolingPeriodRule(rule, request, contactHistory);
      expect(result.passed).toBe(true);
    });
  });

  // =====================================================
  // Consent Rule Tests
  // =====================================================
  
  describe('Consent Rule', () => {
    it('should ALLOW when consent is given for required channel', () => {
      const rule = {
        type: RULE_TYPES.CONSENT_CHECK,
        channels_requiring_consent: ['WHATSAPP', 'EMAIL']
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'WHATSAPP',
        channel: 'WHATSAPP',
        customer_id: 'CUST001',
        consent_status: 'GIVEN'
      };
      
      const result = pdpService.evaluateConsentRule(rule, request);
      expect(result.passed).toBe(true);
    });

    it('should BLOCK when consent is not given for required channel', () => {
      const rule = {
        type: RULE_TYPES.CONSENT_CHECK,
        channels_requiring_consent: ['WHATSAPP', 'EMAIL']
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'WHATSAPP',
        channel: 'WHATSAPP',
        customer_id: 'CUST001',
        consent_status: 'NOT_GIVEN'
      };
      
      const result = pdpService.evaluateConsentRule(rule, request);
      expect(result.passed).toBe(false);
      expect(result.reason_code).toBe(REASON_CODES.CONSENT_REQUIRED);
    });

    it('should BLOCK when consent is withdrawn', () => {
      const rule = {
        type: RULE_TYPES.CONSENT_CHECK,
        channels_requiring_consent: ['WHATSAPP', 'EMAIL']
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'EMAIL',
        channel: 'EMAIL',
        customer_id: 'CUST001',
        consent_status: 'WITHDRAWN'
      };
      
      const result = pdpService.evaluateConsentRule(rule, request);
      expect(result.passed).toBe(false);
    });

    it('should ALLOW for channels not requiring consent', () => {
      const rule = {
        type: RULE_TYPES.CONSENT_CHECK,
        channels_requiring_consent: ['WHATSAPP', 'EMAIL']
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        channel: 'CALL',
        customer_id: 'CUST001',
        consent_status: null  // No consent info
      };
      
      const result = pdpService.evaluateConsentRule(rule, request);
      expect(result.passed).toBe(true);
    });
  });

  // =====================================================
  // Channel Restriction Rule Tests
  // =====================================================
  
  describe('Channel Restriction Rule', () => {
    it('should BLOCK when channel is in blocked list', () => {
      const rule = {
        type: RULE_TYPES.CHANNEL_RESTRICTION,
        blocked_channels: ['SMS', 'WHATSAPP', 'IVR']
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'CORP',
        action_type: 'SMS',
        channel: 'SMS',
        customer_id: 'CUST001'
      };
      
      const result = pdpService.evaluateChannelRestrictionRule(rule, request);
      expect(result.passed).toBe(false);
      expect(result.reason_code).toBe(REASON_CODES.CHANNEL_BLOCKED);
    });

    it('should ALLOW when channel is in allowed list', () => {
      const rule = {
        type: RULE_TYPES.CHANNEL_RESTRICTION,
        allowed_channels: ['CALL', 'EMAIL']
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'CORP',
        action_type: 'CALL',
        channel: 'CALL',
        customer_id: 'CUST001'
      };
      
      const result = pdpService.evaluateChannelRestrictionRule(rule, request);
      expect(result.passed).toBe(true);
    });

    it('should BLOCK when channel is not in allowed list', () => {
      const rule = {
        type: RULE_TYPES.CHANNEL_RESTRICTION,
        allowed_channels: ['CALL', 'EMAIL']
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'CORP',
        action_type: 'SMS',
        channel: 'SMS',
        customer_id: 'CUST001'
      };
      
      const result = pdpService.evaluateChannelRestrictionRule(rule, request);
      expect(result.passed).toBe(false);
    });
  });

  // =====================================================
  // Bucket Rule Tests
  // =====================================================
  
  describe('Bucket Rule', () => {
    it('should BLOCK for current bucket with no allowed contact', () => {
      const rule = {
        type: RULE_TYPES.BUCKET_RULE,
        bucket_restrictions: {
          'CURRENT': {
            blocked: true,
            reason: 'No collection activity for current accounts'
          }
        }
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        bucket: 'CURRENT'
      };
      
      const result = pdpService.evaluateBucketRule(rule, request);
      expect(result.passed).toBe(false);
      expect(result.reason_code).toBe(REASON_CODES.BUCKET_RESTRICTED);
    });

    it('should ALLOW when action is in bucket allowed actions', () => {
      const rule = {
        type: RULE_TYPES.BUCKET_RULE,
        bucket_restrictions: {
          '1-30': {
            allowed_actions: ['SMS', 'EMAIL', 'IVR']
          }
        }
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'SMS',
        customer_id: 'CUST001',
        bucket: '1-30'
      };
      
      const result = pdpService.evaluateBucketRule(rule, request);
      expect(result.passed).toBe(true);
    });

    it('should BLOCK when action is not in bucket allowed actions', () => {
      const rule = {
        type: RULE_TYPES.BUCKET_RULE,
        bucket_restrictions: {
          '1-30': {
            allowed_actions: ['SMS', 'EMAIL', 'IVR']
          }
        }
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        bucket: '1-30'
      };
      
      const result = pdpService.evaluateBucketRule(rule, request);
      expect(result.passed).toBe(false);
      expect(result.reason_code).toBe(REASON_CODES.BUCKET_RESTRICTED);
    });

    it('should ALLOW when bucket has no restrictions', () => {
      const rule = {
        type: RULE_TYPES.BUCKET_RULE,
        bucket_restrictions: {
          '1-30': {
            allowed_actions: ['SMS', 'EMAIL']
          }
        }
      };
      
      const request = {
        tenant_id: '00000000-0000-0000-0000-000000000001',
        customer_type: 'RETAIL',
        action_type: 'CALL',
        customer_id: 'CUST001',
        bucket: '91+'  // Not in restrictions
      };
      
      const result = pdpService.evaluateBucketRule(rule, request);
      expect(result.passed).toBe(true);
    });
  });

  // =====================================================
  // Time Interval Parsing Tests
  // =====================================================
  
  describe('Time Interval Parsing', () => {
    it('should parse hours correctly', () => {
      const ms = pdpService.parseTimeInterval('24h');
      expect(ms).toBe(24 * 60 * 60 * 1000);
    });

    it('should parse days correctly', () => {
      const ms = pdpService.parseTimeInterval('7d');
      expect(ms).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should parse weeks correctly', () => {
      const ms = pdpService.parseTimeInterval('2w');
      expect(ms).toBe(2 * 7 * 24 * 60 * 60 * 1000);
    });

    it('should throw error for invalid interval format', () => {
      expect(() => pdpService.parseTimeInterval('invalid')).toThrow('Invalid time interval');
    });
  });

  // =====================================================
  // Response Creation Tests
  // =====================================================
  
  describe('Response Creation', () => {
    it('should create proper ALLOW response', () => {
      const response = pdpService.createResponse({
        decision: DECISIONS.ALLOW,
        reason_code: REASON_CODES.POLICY_COMPLIANT,
        reason_details: ['All rules passed'],
        policy_profile_id: 'profile-123',
        policy_version_id: 'version-456'
      });
      
      expect(response.decision).toBe(DECISIONS.ALLOW);
      expect(response.reason_code).toBe(REASON_CODES.POLICY_COMPLIANT);
      expect(response.policy_profile_id).toBe('profile-123');
      expect(response.policy_version_id).toBe('version-456');
    });

    it('should create proper BLOCK response with details', () => {
      const response = pdpService.createResponse({
        decision: DECISIONS.BLOCK,
        reason_code: REASON_CODES.MAX_ATTEMPTS_EXCEEDED,
        reason_details: ['Maximum 10 attempts per 7d exceeded'],
        policy_profile_id: 'profile-123',
        policy_version_id: 'version-456',
        max_attempts: 10,
        window: '7d'
      });
      
      expect(response.decision).toBe(DECISIONS.BLOCK);
      expect(response.max_attempts).toBe(10);
      expect(response.window).toBe('7d');
    });

    it('should include cooling_period_until in BLOCK response', () => {
      const coolingUntil = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      
      const response = pdpService.createResponse({
        decision: DECISIONS.BLOCK,
        reason_code: REASON_CODES.COOLING_PERIOD_ACTIVE,
        reason_details: ['Cooling period active'],
        policy_profile_id: 'profile-123',
        policy_version_id: 'version-456',
        cooling_period_until: coolingUntil
      });
      
      expect(response.cooling_period_until).toBe(coolingUntil);
    });

    it('should include required_evidence for APPROVAL_REQUIRED', () => {
      const response = pdpService.createResponse({
        decision: DECISIONS.APPROVAL_REQUIRED,
        reason_code: REASON_CODES.LIMIT_APPROACHING,
        reason_details: ['Approaching limit'],
        policy_profile_id: 'profile-123',
        policy_version_id: 'version-456',
        required_evidence: ['manager_approval', 'justification']
      });
      
      expect(response.decision).toBe(DECISIONS.APPROVAL_REQUIRED);
      expect(response.required_evidence).toContain('manager_approval');
      expect(response.required_evidence).toContain('justification');
    });
  });
});

// =====================================================
// Integration-style Tests (with mocked DB)
// =====================================================

describe('PDP Integration Tests', () => {
  let pdpService;
  
  beforeEach(() => {
    pdpService = new PDPService();
  });

  it('should return NO_POLICY_FOUND when no policy exists', async () => {
    // The mock returns empty data
    const request = {
      tenant_id: '00000000-0000-0000-0000-000000000099',
      customer_type: 'RETAIL',
      action_type: 'CALL',
      customer_id: 'CUST001',
      channel: 'PHONE'
    };
    
    const result = await pdpService.evaluateDecision(request);
    
    expect(result.decision).toBe(DECISIONS.ALLOW);
    expect(result.reason_code).toBe(REASON_CODES.NO_POLICY_FOUND);
  });

  it('should handle database errors gracefully', async () => {
    // Force an error by providing invalid data
    const request = {
      tenant_id: null,  // This will fail validation
      customer_type: 'RETAIL',
      action_type: 'CALL',
      customer_id: 'CUST001'
    };
    
    const result = await pdpService.evaluateDecision(request);
    
    expect(result.decision).toBe(DECISIONS.BLOCK);
    expect(result.reason_code).toBe('EVALUATION_ERROR');
  });
});
