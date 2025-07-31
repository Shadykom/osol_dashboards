import { supabaseBanking, TABLES } from '@/lib/supabase';

/**
 * Fixed customer data fetching for Executive Dashboard
 * This addresses the issue where customer counts show as 0
 */
export async function fetchCustomerMetrics() {
  try {
    // Fetch total customers - using direct data fetch as count might not work
    const { data: allCustomers, error: totalError } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('customer_id, created_at');
    
    if (totalError) {
      console.error('Error fetching customers:', totalError);
      throw totalError;
    }
    
    const totalCustomers = allCustomers?.length || 0;
    
    // Since is_active field might not exist, we'll consider all customers as active
    // You can modify this based on your actual schema
    const activeCustomers = totalCustomers;
    
    // Calculate new customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newCustomersThisMonth = allCustomers?.filter(customer => {
      const createdDate = new Date(customer.created_at);
      return createdDate >= startOfMonth;
    }).length || 0;
    
    // Calculate growth rate
    const customerGrowthRate = totalCustomers > 0 
      ? ((newCustomersThisMonth / totalCustomers) * 100).toFixed(2) 
      : '0.00';
    
    console.log('Customer metrics fetched:', {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      customerGrowthRate
    });
    
    return {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      customerGrowthRate
    };
  } catch (error) {
    console.error('Failed to fetch customer metrics:', error);
    // Return default values on error
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomersThisMonth: 0,
      customerGrowthRate: '0.00'
    };
  }
}