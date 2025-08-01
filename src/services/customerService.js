import { supabaseBanking, TABLES } from '@/lib/supabase';

// Mock data for fallback
const mockCustomers = [
  {
    customer_id: 'CUST001',
    first_name: 'Ahmed',
    middle_name: 'Mohammed',
    last_name: 'Al-Rashid',
    full_name: 'Ahmed Mohammed Al-Rashid',
    email: 'ahmed.rashid@email.com',
    phone: '+966501234567',
    segment: 'RETAIL',
    kyc_status: 'APPROVED',
    risk_category: 'LOW',
    annual_income: 75000,
    created_at: new Date().toISOString()
  },
  {
    customer_id: 'CUST002',
    first_name: 'Fatima',
    last_name: 'Al-Zahrani',
    full_name: 'Fatima Al-Zahrani',
    email: 'fatima.zahrani@email.com',
    phone: '+966502345678',
    segment: 'PREMIUM',
    kyc_status: 'APPROVED',
    risk_category: 'MEDIUM',
    annual_income: 120000,
    created_at: new Date().toISOString()
  },
  {
    customer_id: 'CUST003',
    first_name: 'Khalid',
    middle_name: 'Abdullah',
    last_name: 'Al-Otaibi',
    full_name: 'Khalid Abdullah Al-Otaibi',
    email: 'khalid.otaibi@email.com',
    phone: '+966503456789',
    segment: 'HNI',
    kyc_status: 'APPROVED',
    risk_category: 'LOW',
    annual_income: 500000,
    created_at: new Date().toISOString()
  }
];

// Simple API response formatter
function formatApiResponse(data, error = null, pagination = null) {
  if (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null
    };
  }
  
  const response = {
    success: true,
    data: data || null,
    error: null
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
}

export class CustomerService {
  /**
   * Get all customers with pagination and filtering
   */
  static async getCustomers(params = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        segment = '',
        kyc_status = '',
        risk_category = ''
      } = params;

      console.log('CustomerService.getCustomers called with params:', params);

      // Try to fetch from database first
      try {
        let query = supabaseBanking
          .from(TABLES.CUSTOMERS)
          .select('*', { count: 'exact' });

        // Apply search filter
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,customer_id.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }

        // Apply segment filter
        if (segment) {
          query = query.eq('customer_segment', segment);
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

        console.log('Executing customer query...');
        const { data, error, count } = await query;
        
        console.log('Customer query result:', { data: data?.length, error, count });

        if (error) {
          throw error;
        }

        const pagination = {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        };

        return formatApiResponse(data, null, pagination);
      } catch (dbError) {
        console.warn('Database query failed, falling back to mock data:', dbError);
        
        // Filter mock data based on search
        let filteredCustomers = [...mockCustomers];
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredCustomers = filteredCustomers.filter(customer => 
            customer.full_name.toLowerCase().includes(searchLower) ||
            customer.customer_id.toLowerCase().includes(searchLower) ||
            customer.email.toLowerCase().includes(searchLower)
          );
        }
        
        if (segment) {
          filteredCustomers = filteredCustomers.filter(customer => customer.customer_segment === segment);
        }
        
        if (kyc_status) {
          filteredCustomers = filteredCustomers.filter(customer => customer.kyc_status === kyc_status);
        }
        
        if (risk_category) {
          filteredCustomers = filteredCustomers.filter(customer => customer.risk_category === risk_category);
        }
        
        // Apply pagination to mock data
        const from = (page - 1) * limit;
        const to = from + limit;
        const paginatedCustomers = filteredCustomers.slice(from, to);
        
        const pagination = {
          page,
          limit,
          total: filteredCustomers.length,
          total_pages: Math.ceil(filteredCustomers.length / limit)
        };
        
        return formatApiResponse(paginatedCustomers, null, pagination);
      }
    } catch (error) {
      console.error('CustomerService.getCustomers error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId) {
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select(`
          *,
          customer_contacts(
            contact_type,
            contact_value
          ),
          customer_addresses(
            address_type,
            address_line1,
            address_line2,
            city,
            state,
            country_code,
            postal_code,
            is_primary
          ),
          customer_documents(
            document_type,
            document_number,
            issue_date,
            expiry_date,
            verification_status
          )
        `)
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

      const { data, error } = await supabaseBanking
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

      const { data, error } = await supabaseBanking
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
      const { data, error } = await supabaseBanking
        .from(TABLES.ACCOUNTS)
        .select(`
          *,
          account_types(
            type_name,
            type_code,
            account_category
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

      let query = supabaseBanking
        .from(TABLES.TRANSACTIONS)
        .select(`
          *,
          transaction_types(
            type_name,
            type_code,
            transaction_category
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
      const { data, error } = await supabaseBanking
        .from(TABLES.LOAN_ACCOUNTS)
        .select(`
          *,
          loan_applications(
            application_number,
            requested_amount,
            approved_amount,
            application_status
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
   * Get customer analytics
   */
  static async getCustomerAnalytics() {
    try {
      // Get segment distribution
      const { data: segmentData, error: segmentError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('segment')
        .not('segment', 'is', null);

      // Get KYC status distribution
      const { data: kycData, error: kycError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('kyc_status');

      // Get risk category distribution
      const { data: riskData, error: riskError } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('risk_category')
        .not('risk_category', 'is', null);

      if (segmentError || kycError || riskError) {
        throw segmentError || kycError || riskError;
      }

      // Process segment data
      const segmentCounts = segmentData.reduce((acc, customer) => {
        acc[customer.customer_segment] = (acc[customer.customer_segment] || 0) + 1;
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
      return formatApiResponse(null, error);
    }
  }

  /**
   * Add customer contact
   */
  static async addCustomerContact(customerId, contactData) {
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.CUSTOMER_CONTACTS)
        .insert([{
          customer_id: customerId,
          ...contactData
        }])
        .select()
        .single();

      return formatApiResponse(data, error);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Add customer address
   */
  static async addCustomerAddress(customerId, addressData) {
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.CUSTOMER_ADDRESSES)
        .insert([{
          customer_id: customerId,
          ...addressData
        }])
        .select()
        .single();

      return formatApiResponse(data, error);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }

  /**
   * Upload customer document
   */
  static async uploadCustomerDocument(customerId, documentData) {
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.CUSTOMER_DOCUMENTS)
        .insert([{
          customer_id: customerId,
          ...documentData
        }])
        .select()
        .single();

      return formatApiResponse(data, error);
    } catch (error) {
      return formatApiResponse(null, error);
    }
  }
}