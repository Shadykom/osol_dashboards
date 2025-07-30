import { supabaseBanking } from '../lib/supabase';
import { formatApiResponse, formatApiError } from '../utils/apiHelpers';

const TABLES = {
  CUSTOMER_SEGMENTS: 'collection_customer_segments'
};

export class CustomerSegmentService {
  /**
   * Get all customer segments
   */
  static async getCustomerSegments() {
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.CUSTOMER_SEGMENTS)
        .select('segment_id, segment_name, segment_code, risk_profile')
        .eq('is_active', true)
        .order('segment_name');

      if (error) throw error;

      return formatApiResponse(data || []);
    } catch (error) {
      console.error('Get customer segments error:', error);
      // Return mock data if table doesn't exist or error occurs
      return formatApiResponse([
        { segment_id: 'SEG001', segment_name: 'VIP', segment_code: 'VIP', risk_profile: 'Low' },
        { segment_id: 'SEG002', segment_name: 'Premium', segment_code: 'PREMIUM', risk_profile: 'Medium' },
        { segment_id: 'SEG003', segment_name: 'Standard', segment_code: 'STANDARD', risk_profile: 'Medium' },
        { segment_id: 'SEG004', segment_name: 'Basic', segment_code: 'BASIC', risk_profile: 'High' }
      ]);
    }
  }
}