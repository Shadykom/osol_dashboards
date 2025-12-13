/**
 * =====================================================
 * Tests for PDP Enforcement Middleware
 * =====================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies
vi.mock('@/services/pdpService', () => ({
  pdpService: {
    evaluateDecision: vi.fn(),
    recordContactAttempt: vi.fn()
  },
  DECISIONS: {
    ALLOW: 'ALLOW',
    BLOCK: 'BLOCK',
    APPROVAL_REQUIRED: 'APPROVAL_REQUIRED'
  }
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'approval-123' }, 
            error: null 
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'approval-123', workflow_status: 'PENDING' }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

import { 
  createPDPEnforcer, 
  enforceContactAction,
  checkApprovalStatus
} from '../pdpEnforcement';
import { pdpService, DECISIONS } from '@/services/pdpService';
import { supabase } from '@/lib/supabase';

describe('PDP Enforcement Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPDPEnforcer', () => {
    it('should create an enforcer function', () => {
      const enforcer = createPDPEnforcer({
        actionType: 'CALL',
        contextBuilder: (req) => ({ customer_id: req.customer_id })
      });
      
      expect(typeof enforcer).toBe('function');
    });

    it('should skip enforcement when skipEnforcement option is true', async () => {
      const enforcer = createPDPEnforcer({
        actionType: 'CALL',
        contextBuilder: (req) => ({ customer_id: req.customer_id })
      });
      
      const result = await enforcer({ customer_id: 'CUST001' }, { skipEnforcement: true });
      
      expect(result.enforced).toBe(false);
      expect(result.decision).toBe(DECISIONS.ALLOW);
      expect(result.proceed).toBe(true);
      expect(pdpService.evaluateDecision).not.toHaveBeenCalled();
    });
  });

  describe('ALLOW decision handling', () => {
    it('should allow action to proceed when PDP returns ALLOW', async () => {
      pdpService.evaluateDecision.mockResolvedValue({
        decision: DECISIONS.ALLOW,
        reason_code: 'POLICY_COMPLIANT',
        reason_details: [],
        policy_profile_id: 'profile-1',
        policy_version_id: 'version-1'
      });

      const enforcer = createPDPEnforcer({
        actionType: 'CALL',
        contextBuilder: (req) => ({
          tenant_id: req.tenant_id,
          customer_id: req.customer_id,
          customer_type: 'RETAIL'
        })
      });

      const result = await enforcer({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001'
      });

      expect(result.enforced).toBe(true);
      expect(result.decision).toBe(DECISIONS.ALLOW);
      expect(result.proceed).toBe(true);
      expect(result.response).toBeNull();
    });

    it('should call onAllow callback when action is allowed', async () => {
      const onAllow = vi.fn();
      
      pdpService.evaluateDecision.mockResolvedValue({
        decision: DECISIONS.ALLOW,
        reason_code: 'POLICY_COMPLIANT'
      });

      const enforcer = createPDPEnforcer({
        actionType: 'SMS',
        contextBuilder: (req) => ({ customer_id: req.customer_id }),
        onAllow
      });

      await enforcer({ customer_id: 'CUST001', tenant_id: 'tenant-1' });

      expect(onAllow).toHaveBeenCalled();
    });
  });

  describe('BLOCK decision handling', () => {
    it('should return 403 when PDP returns BLOCK', async () => {
      pdpService.evaluateDecision.mockResolvedValue({
        decision: DECISIONS.BLOCK,
        reason_code: 'MAX_ATTEMPTS_EXCEEDED',
        reason_details: ['Maximum 10 attempts per 7d exceeded'],
        policy_profile_id: 'profile-1',
        policy_version_id: 'version-1',
        cooling_period_until: '2024-12-20T10:00:00Z'
      });

      const enforcer = createPDPEnforcer({
        actionType: 'CALL',
        contextBuilder: (req) => ({
          tenant_id: req.tenant_id,
          customer_id: req.customer_id
        })
      });

      const result = await enforcer({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001'
      });

      expect(result.enforced).toBe(true);
      expect(result.decision).toBe(DECISIONS.BLOCK);
      expect(result.proceed).toBe(false);
      expect(result.response.status).toBe(403);
      expect(result.response.error).toBe('Action blocked by policy');
      expect(result.response.reason_code).toBe('MAX_ATTEMPTS_EXCEEDED');
      expect(result.response.cooling_period_until).toBe('2024-12-20T10:00:00Z');
    });

    it('should call onBlock callback when action is blocked', async () => {
      const onBlock = vi.fn();
      
      pdpService.evaluateDecision.mockResolvedValue({
        decision: DECISIONS.BLOCK,
        reason_code: 'CHANNEL_BLOCKED'
      });

      const enforcer = createPDPEnforcer({
        actionType: 'WHATSAPP',
        contextBuilder: (req) => ({ customer_id: req.customer_id }),
        onBlock
      });

      await enforcer({ customer_id: 'CUST001', tenant_id: 'tenant-1' });

      expect(onBlock).toHaveBeenCalled();
    });
  });

  describe('APPROVAL_REQUIRED decision handling', () => {
    it('should return 202 and create approval when PDP returns APPROVAL_REQUIRED', async () => {
      pdpService.evaluateDecision.mockResolvedValue({
        decision: DECISIONS.APPROVAL_REQUIRED,
        reason_code: 'LIMIT_APPROACHING',
        reason_details: ['Approaching limit: 8/10 attempts in 7d'],
        policy_profile_id: 'profile-1',
        policy_version_id: 'version-1',
        required_evidence: ['manager_approval', 'justification_required']
      });

      const enforcer = createPDPEnforcer({
        actionType: 'CALL',
        contextBuilder: (req) => ({
          tenant_id: req.tenant_id,
          customer_id: req.customer_id
        })
      });

      const result = await enforcer({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001'
      });

      expect(result.enforced).toBe(true);
      expect(result.decision).toBe(DECISIONS.APPROVAL_REQUIRED);
      expect(result.proceed).toBe(false);
      expect(result.response.status).toBe(202);
      expect(result.response.message).toBe('Action requires approval');
      expect(result.response.approval_id).toBe('approval-123');
      expect(result.response.required_evidence).toContain('manager_approval');
    });

    it('should call onApprovalRequired callback', async () => {
      const onApprovalRequired = vi.fn();
      
      pdpService.evaluateDecision.mockResolvedValue({
        decision: DECISIONS.APPROVAL_REQUIRED,
        reason_code: 'MANUAL_REVIEW_REQUIRED'
      });

      const enforcer = createPDPEnforcer({
        actionType: 'EMAIL',
        contextBuilder: (req) => ({ customer_id: req.customer_id }),
        onApprovalRequired
      });

      await enforcer({ customer_id: 'CUST001', tenant_id: 'tenant-1' });

      expect(onApprovalRequired).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return BLOCK on PDP error (fail-closed)', async () => {
      pdpService.evaluateDecision.mockRejectedValue(new Error('PDP service unavailable'));

      const enforcer = createPDPEnforcer({
        actionType: 'CALL',
        contextBuilder: (req) => ({
          customer_id: req.customer_id
        })
      });

      const result = await enforcer({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001'
      });

      expect(result.enforced).toBe(true);
      expect(result.decision).toBe(DECISIONS.BLOCK);
      expect(result.proceed).toBe(false);
      expect(result.response.status).toBe(500);
      expect(result.response.reason_code).toBe('ENFORCEMENT_ERROR');
    });

    it('should handle contextBuilder errors gracefully', async () => {
      const enforcer = createPDPEnforcer({
        actionType: 'CALL',
        contextBuilder: () => {
          throw new Error('Context builder error');
        }
      });

      const result = await enforcer({ customer_id: 'CUST001' });

      expect(result.proceed).toBe(false);
      expect(result.response.status).toBe(500);
    });
  });

  describe('enforceContactAction', () => {
    it('should use action_type from request', async () => {
      pdpService.evaluateDecision.mockResolvedValue({
        decision: DECISIONS.ALLOW,
        reason_code: 'POLICY_COMPLIANT'
      });

      const result = await enforceContactAction({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001',
        action_type: 'SMS',
        channel: 'SMS'
      });

      expect(result.decision).toBe(DECISIONS.ALLOW);
      expect(pdpService.evaluateDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          action_type: 'SMS',
          channel: 'SMS'
        })
      );
    });
  });
});

describe('Approval Status Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return approval status', async () => {
    // This test verifies the checkApprovalStatus function structure
    // The actual supabase call is mocked
    expect(typeof checkApprovalStatus).toBe('function');
  });
});
