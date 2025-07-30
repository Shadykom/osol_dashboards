// Test Dashboard Data Consistency
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { validateCustomerSegments, validateDashboardKPIs } from './dashboardValidation';

/**
 * Test dashboard data consistency
 */
export async function testDashboardConsistency() {
  console.log('🔍 Testing Dashboard Data Consistency...\n');
  
  try {
    // 1. Test Total Customers
    console.log('1️⃣ Testing Total Customers Count:');
    const { count: totalCustomers, error: totalError } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('❌ Error fetching total customers:', totalError);
    } else {
      console.log(`✅ Total customers: ${totalCustomers}`);
    }
    
    // 2. Test Customer Segments
    console.log('\n2️⃣ Testing Customer Segments:');
    const { data: customers, error: segmentError } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('customer_type, customer_segment, customer_type_id');
    
    if (segmentError) {
      console.error('❌ Error fetching customer segments:', segmentError);
    } else {
      // Count by segment
      const segments = customers.reduce((acc, customer) => {
        const segment = customer.customer_segment || 
                      customer.customer_type || 
                      (customer.customer_type_id ? `Type ${customer.customer_type_id}` : 'Standard');
        acc[segment] = (acc[segment] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Customer segments breakdown:');
      Object.entries(segments).forEach(([segment, count]) => {
        console.log(`  - ${segment}: ${count} customers`);
      });
      
      // Validate consistency
      const segmentTotal = Object.values(segments).reduce((sum, count) => sum + count, 0);
      console.log(`\n📊 Segment total: ${segmentTotal}`);
      console.log(`📊 Direct total: ${totalCustomers}`);
      
      if (segmentTotal === totalCustomers) {
        console.log('✅ Customer data is CONSISTENT!');
      } else {
        console.error(`❌ Data INCONSISTENCY detected! Difference: ${Math.abs(segmentTotal - totalCustomers)}`);
      }
    }
    
    // 3. Test Active Customers
    console.log('\n3️⃣ Testing Active Customers:');
    const { data: activeAccounts, error: activeError } = await supabaseBanking
      .from(TABLES.ACCOUNTS)
      .select('customer_id')
      .eq('account_status', 'ACTIVE');
    
    if (activeError) {
      console.error('❌ Error fetching active accounts:', activeError);
    } else {
      const uniqueActiveCustomers = new Set(activeAccounts.map(a => a.customer_id)).size;
      console.log(`✅ Active customers (with active accounts): ${uniqueActiveCustomers}`);
      console.log(`📊 Active customer percentage: ${((uniqueActiveCustomers / totalCustomers) * 100).toFixed(2)}%`);
    }
    
    // 4. Test KPI Data
    console.log('\n4️⃣ Testing Dashboard KPIs:');
    const kpiData = {
      totalCustomers,
      totalAccounts: activeAccounts?.length || 0,
      totalDeposits: 1000000, // Mock value
      totalLoans: 500000 // Mock value
    };
    
    const validation = validateDashboardKPIs(kpiData);
    if (validation.valid) {
      console.log('✅ KPI data is valid');
    } else {
      console.error('❌ KPI validation errors:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ KPI validation warnings:', validation.warnings);
    }
    
    // 5. Summary
    console.log('\n📋 SUMMARY:');
    console.log('===========');
    console.log(`Total Customers: ${totalCustomers}`);
    console.log(`Customer Segments: ${Object.keys(segments || {}).length} types`);
    console.log(`Active Customers: ${uniqueActiveCustomers}`);
    console.log(`Data Consistency: ${segmentTotal === totalCustomers ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      totalCustomers,
      segments,
      activeCustomers: uniqueActiveCustomers,
      isConsistent: segmentTotal === totalCustomers
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testDashboardConsistency = testDashboardConsistency;
}