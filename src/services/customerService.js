import { supabase, TABLES, formatApiResponse, isSupabaseConfigured } from '@/lib/supabase';
import { MockCustomerService } from './mockCustomerService';

export class CustomerService {
  /**
   * Get all customers with pagination and filtering
   */
  static async getCustomers(params = {}) {
    if (!isSupabaseConfigured) {
      return MockCustomerService.getCustomers(params);
    }

    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        segment = '',
        kyc_status = '',
        risk_category = ''
      } = params;

      let query = supabase
        .from(TABLES.CUSTOMERS)
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,customer_id.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      // Apply segment filter
      if (segment) {
        query = query.eq('segment', segment);
      }

      // Apply KYC status filter
      if (kyc_status) {
        query = query.eq('kyc_status', kyc_status);
      }

      // Apply risk category filter
      if (risk_category) {
        query = query.eq('risk_category', risk_category);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      const pagination = {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      };

      return formatApiResponse(data, error, pagination);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('*')
        .eq('customer_id', customerId)
        .single();

      return formatApiResponse(data, error);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Create new customer
   */
  static async createCustomer(customerData) {
    try {
      // Generate customer ID if not provided
      if (!customerData.customer_id) {
        const timestamp = Date.now().toString().slice(-6);
        customerData.customer_id = `CUST${timestamp}`;
      }

      // Set full name if not provided
      if (!customerData.full_name && customerData.first_name && customerData.last_name) {
        customerData.full_name = `${customerData.first_name} ${customerData.middle_name || ''} ${customerData.last_name}`.trim();
      }

      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .insert([customerData])
        .select()
        .single();

      return formatApiResponse(data, error);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(customerId, updates) {
    try {
      // Update full name if name fields are being updated
      if (updates.first_name || updates.last_name || updates.middle_name) {
        const { data: currentCustomer } = await this.getCustomer(customerId);
        if (currentCustomer) {
          const firstName = updates.first_name || currentCustomer.first_name;
          const middleName = updates.middle_name || currentCustomer.middle_name || '';
          const lastName = updates.last_name || currentCustomer.last_name;
          updates.full_name = `${firstName} ${middleName} ${lastName}`.trim();
        }
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(TABLES.CUSTOMERS)
        .update(updates)
        .eq('customer_id', customerId)
        .select()
        .single();

      return formatApiResponse(data, error);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get customer accounts
   */
  static async getCustomerAccounts(customerId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.ACCOUNTS)
        .select(`
          *,
          account_types:account_type_id (
            type_name,
            description
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      return formatApiResponse(data, error);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get customer transactions
   */
  static async getCustomerTransactions(customerId, params = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        from_date = null,
        to_date = null
      } = params;

      // First get customer accounts
      const accountsResponse = await this.getCustomerAccounts(customerId);
      if (!accountsResponse.success || !accountsResponse.data?.length) {
        return formatApiResponse([], null, { page, limit, total: 0, total_pages: 0 });
      }

      const accountNumbers = accountsResponse.data.map(account => account.account_number);

      let query = supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          *,
          transaction_types:transaction_type_id (
            type_name,
            description
          )
        `, { count: 'exact' })
        .in('account_number', accountNumbers);

      // Apply date filters
      if (from_date) {
        query = query.gte('transaction_date', from_date);
      }
      if (to_date) {
        query = query.lte('transaction_date', to_date);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by transaction date
      query = query.order('transaction_date', { ascending: false });

      const { data, error, count } = await query;

      const pagination = {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      };

      return formatApiResponse(data, error, pagination);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get customer loans
   */
  static async getCustomerLoans(customerId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.LOAN_ACCOUNTS)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      return formatApiResponse(data, error);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get customer analytics
   */
  static async getCustomerAnalytics() {
    if (!isSupabaseConfigured) {
      return MockCustomerService.getCustomerAnalytics();
    }

    try {
      // Get segment distribution
      const { data: segmentData, error: segmentError } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('segment')
        .not('segment', 'is', null);

      // Get KYC status distribution
      const { data: kycData, error: kycError } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('kyc_status');

      // Get risk category distribution
      const { data: riskData, error: riskError } = await supabase
        .from(TABLES.CUSTOMERS)
        .select('risk_category')
        .not('risk_category', 'is', null);

      if (segmentError || kycError || riskError) {
        throw segmentError || kycError || riskError;
      }

      // Process segment data
      const segmentCounts = segmentData.reduce((acc, customer) => {
        acc[customer.segment] = (acc[customer.segment] || 0) + 1;
        return acc;
      }, {});

      const totalCustomers = segmentData.length;
      const by_segment = Object.entries(segmentCounts).map(([segment, count]) => ({
        segment,
        count,
        percentage: ((count / totalCustomers) * 100).toFixed(1)
      }));

      // Process KYC data
      const kycCounts = kycData.reduce((acc, customer) => {
        acc[customer.kyc_status] = (acc[customer.kyc_status] || 0) + 1;
        return acc;
      }, {});

      const kyc_status = Object.entries(kycCounts).map(([status, count]) => ({
        status,
        count,
        percentage: ((count / kycData.length) * 100).toFixed(1)
      }));

      // Process risk data
      const riskCounts = riskData.reduce((acc, customer) => {
        acc[customer.risk_category] = (acc[customer.risk_category] || 0) + 1;
        return acc;
      }, {});

      const by_risk_category = Object.entries(riskCounts).map(([category, count]) => ({
        category,
        count,
        percentage: ((count / riskData.length) * 100).toFixed(1)
      }));

      const analytics = {
        by_segment,
        kyc_status,
        by_risk_category,
        total_customers: totalCustomers
      };

      return formatApiResponse(analytics);
    } catch (error) {
      console.error('Error fetching customer analytics, falling back to mock data:', error);
      return MockCustomerService.getCustomerAnalytics();
    }
  }
}

