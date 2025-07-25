// src/services/mockCustomerService.js
import { mockData } from '@/lib/supabaseConfig';
import { formatApiResponse } from '@/lib/supabase';

export class MockCustomerService {
  /**
   * Get customer analytics (mock data)
   */
  static async getCustomerAnalytics() {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return formatApiResponse(mockData.customerAnalytics);
  }

  /**
   * Get customers list (mock data)
   */
  static async getCustomers(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockCustomers = [
      {
        customer_id: 'CUST001',
        customer_name: 'Ahmed Al-Rashid',
        email: 'ahmed.rashid@email.com',
        phone: '+966501234567',
        customer_type: 'Premium',
        kyc_status: 'Verified',
        risk_category: 'Low Risk',
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        customer_id: 'CUST002',
        customer_name: 'Fatima Al-Zahra',
        email: 'fatima.zahra@email.com',
        phone: '+966502345678',
        customer_type: 'Gold',
        kyc_status: 'Verified',
        risk_category: 'Low Risk',
        created_at: '2024-01-20T14:15:00Z'
      },
      {
        customer_id: 'CUST003',
        customer_name: 'Mohammed Al-Saud',
        email: 'mohammed.saud@email.com',
        phone: '+966503456789',
        customer_type: 'Silver',
        kyc_status: 'Pending',
        risk_category: 'Medium Risk',
        created_at: '2024-01-25T09:45:00Z'
      }
    ];
    
    return formatApiResponse(mockCustomers);
  }
}

