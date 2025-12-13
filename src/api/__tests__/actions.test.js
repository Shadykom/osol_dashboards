/**
 * =====================================================
 * Tests for Actions API
 * =====================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the middleware
vi.mock('@/middleware/pdpEnforcement', () => ({
  enforceContactAction: vi.fn(),
  checkApprovalStatus: vi.fn(),
  executeApprovedAction: vi.fn(),
  createPDPEnforcer: vi.fn()
}));

// Mock pdpService
vi.mock('@/services/pdpService', () => ({
  pdpService: {
    recordContactAttempt: vi.fn()
  }
}));

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ 
                data: [], 
                error: null,
                count: 0 
              }))
            }))
          })),
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'approval-123', 
              workflow_status: 'PENDING',
              metadata: {}
            }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'approval-123', workflow_status: 'APPROVED' },
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

import { 
  initiateContactAction,
  getPendingActionApprovals,
  approveAction,
  rejectAction,
  getApprovalDetails,
  initiateBulkContactActions
} from '../actions';
import { enforceContactAction, executeApprovedAction } from '@/middleware/pdpEnforcement';
import { pdpService } from '@/services/pdpService';

describe('Actions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initiateContactAction', () => {
    it('should return 400 if tenant_id is missing', async () => {
      const result = await initiateContactAction({
        customer_id: 'CUST001',
        action_type: 'CALL'
      });

      expect(result.status).toBe(400);
      expect(result.error).toBe('tenant_id is required');
    });

    it('should return 400 if customer_id is missing', async () => {
      const result = await initiateContactAction({
        tenant_id: 'tenant-1',
        action_type: 'CALL'
      });

      expect(result.status).toBe(400);
      expect(result.error).toBe('customer_id is required');
    });

    it('should return 400 if both channel and action_type are missing', async () => {
      const result = await initiateContactAction({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001'
      });

      expect(result.status).toBe(400);
      expect(result.error).toBe('channel or action_type is required');
    });

    it('should return 200 when action is allowed', async () => {
      enforceContactAction.mockResolvedValue({
        proceed: true,
        decision: 'ALLOW',
        pdpDecision: {
          decision: 'ALLOW',
          policy_profile_id: 'profile-1',
          policy_version_id: 'version-1'
        }
      });

      pdpService.recordContactAttempt.mockResolvedValue();

      const result = await initiateContactAction({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001',
        action_type: 'CALL',
        channel: 'CALL'
      });

      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('INITIATED');
      expect(result.data.customer_id).toBe('CUST001');
      expect(result.data.action_type).toBe('CALL');
    });

    it('should return 403 when action is blocked', async () => {
      enforceContactAction.mockResolvedValue({
        proceed: false,
        decision: 'BLOCK',
        response: {
          success: false,
          status: 403,
          error: 'Action blocked by policy',
          reason_code: 'MAX_ATTEMPTS_EXCEEDED',
          reason_details: ['Maximum attempts exceeded']
        }
      });

      const result = await initiateContactAction({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001',
        action_type: 'CALL'
      });

      expect(result.status).toBe(403);
      expect(result.error).toBe('Action blocked by policy');
      expect(result.reason_code).toBe('MAX_ATTEMPTS_EXCEEDED');
    });

    it('should return 202 when approval is required', async () => {
      enforceContactAction.mockResolvedValue({
        proceed: false,
        decision: 'APPROVAL_REQUIRED',
        response: {
          success: true,
          status: 202,
          message: 'Action requires approval',
          approval_id: 'approval-123',
          reason_code: 'LIMIT_APPROACHING',
          required_evidence: ['manager_approval']
        }
      });

      const result = await initiateContactAction({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001',
        action_type: 'CALL'
      });

      expect(result.status).toBe(202);
      expect(result.approval_id).toBe('approval-123');
      expect(result.message).toBe('Action requires approval');
    });

    it('should record contact attempt after successful action', async () => {
      enforceContactAction.mockResolvedValue({
        proceed: true,
        decision: 'ALLOW',
        pdpDecision: { decision: 'ALLOW' }
      });

      await initiateContactAction({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001',
        action_type: 'SMS',
        channel: 'SMS'
      });

      expect(pdpService.recordContactAttempt).toHaveBeenCalledWith(
        'tenant-1',
        'CUST001',
        'SMS',
        'SMS',
        'INITIATED',
        expect.any(Object)
      );
    });
  });

  describe('getPendingActionApprovals', () => {
    it('should return 400 if tenant_id is missing', async () => {
      const result = await getPendingActionApprovals({});

      expect(result.status).toBe(400);
      expect(result.error).toBe('tenant_id is required');
    });

    it('should return pending approvals', async () => {
      const result = await getPendingActionApprovals({
        tenant_id: 'tenant-1'
      });

      expect(result.status).toBe(200);
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('approveAction', () => {
    it('should return 400 if approval_id is missing', async () => {
      const result = await approveAction(null, {});

      expect(result.status).toBe(400);
      expect(result.error).toBe('approval_id is required');
    });

    it('should return 400 if approved_by is missing', async () => {
      const result = await approveAction('approval-123', {});

      expect(result.status).toBe(400);
      expect(result.error).toBe('approved_by is required');
    });
  });

  describe('rejectAction', () => {
    it('should return 400 if approval_id is missing', async () => {
      const result = await rejectAction(null, {});

      expect(result.status).toBe(400);
      expect(result.error).toBe('approval_id is required');
    });

    it('should return 400 if rejected_by is missing', async () => {
      const result = await rejectAction('approval-123', {});

      expect(result.status).toBe(400);
      expect(result.error).toBe('rejected_by is required');
    });

    it('should return 400 if comments are missing', async () => {
      const result = await rejectAction('approval-123', {
        rejected_by: 'user-1'
      });

      expect(result.status).toBe(400);
      expect(result.error).toBe('comments are required when rejecting');
    });
  });

  describe('getApprovalDetails', () => {
    it('should return 400 if approval_id is missing', async () => {
      const result = await getApprovalDetails(null);

      expect(result.status).toBe(400);
      expect(result.error).toBe('approval_id is required');
    });
  });

  describe('initiateBulkContactActions', () => {
    it('should return 400 if tenant_id is missing', async () => {
      const result = await initiateBulkContactActions({
        actions: []
      });

      expect(result.status).toBe(400);
      expect(result.error).toBe('tenant_id is required');
    });

    it('should return 400 if actions array is empty', async () => {
      const result = await initiateBulkContactActions({
        tenant_id: 'tenant-1',
        actions: []
      });

      expect(result.status).toBe(400);
      expect(result.error).toBe('actions array is required and must not be empty');
    });

    it('should process multiple actions and return summary', async () => {
      // First action allowed, second blocked
      enforceContactAction
        .mockResolvedValueOnce({
          proceed: true,
          decision: 'ALLOW',
          pdpDecision: { decision: 'ALLOW' }
        })
        .mockResolvedValueOnce({
          proceed: false,
          decision: 'BLOCK',
          response: {
            status: 403,
            error: 'Blocked',
            reason_code: 'MAX_ATTEMPTS_EXCEEDED'
          }
        });

      pdpService.recordContactAttempt.mockResolvedValue();

      const result = await initiateBulkContactActions({
        tenant_id: 'tenant-1',
        actions: [
          { customer_id: 'CUST001', action_type: 'CALL' },
          { customer_id: 'CUST002', action_type: 'SMS' }
        ]
      });

      expect(result.status).toBe(200);
      expect(result.data.summary.total).toBe(2);
      expect(result.data.summary.allowed).toBe(1);
      expect(result.data.summary.blocked).toBe(1);
    });
  });
});

describe('PDP Decision Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enforce PDP on all contact actions', async () => {
    enforceContactAction.mockResolvedValue({
      proceed: true,
      decision: 'ALLOW',
      pdpDecision: { decision: 'ALLOW' }
    });

    await initiateContactAction({
      tenant_id: 'tenant-1',
      customer_id: 'CUST001',
      action_type: 'CALL'
    });

    expect(enforceContactAction).toHaveBeenCalledTimes(1);
    expect(enforceContactAction).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: 'tenant-1',
        customer_id: 'CUST001',
        action_type: 'CALL'
      }),
      expect.any(Object)
    );
  });

  it('should not execute action when blocked', async () => {
    enforceContactAction.mockResolvedValue({
      proceed: false,
      decision: 'BLOCK',
      response: { status: 403, error: 'Blocked' }
    });

    const result = await initiateContactAction({
      tenant_id: 'tenant-1',
      customer_id: 'CUST001',
      action_type: 'CALL'
    });

    // recordContactAttempt should NOT be called when blocked
    expect(pdpService.recordContactAttempt).not.toHaveBeenCalled();
    expect(result.status).toBe(403);
  });
});
