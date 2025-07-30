import { supabaseBanking } from '@/lib/supabase';

export async function testDatabaseSchema() {
  console.log('Testing database schema...');
  
  try {
    // Test branches table structure
    console.log('\n=== Testing BRANCHES table ===');
    const { data: branchesTest, error: branchesError } = await supabaseBanking
      .from('branches')
      .select('*')
      .limit(1);
    
    if (branchesError) {
      console.error('Branches error:', branchesError);
    } else {
      console.log('Branches columns:', branchesTest.length > 0 ? Object.keys(branchesTest[0]) : 'No data');
    }
    
    // Test customers table structure
    console.log('\n=== Testing CUSTOMERS table ===');
    const { data: customersTest, error: customersError } = await supabaseBanking
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customersError) {
      console.error('Customers error:', customersError);
    } else {
      console.log('Customers columns:', customersTest.length > 0 ? Object.keys(customersTest[0]) : 'No data');
    }
    
    // Test customer_contacts table structure
    console.log('\n=== Testing CUSTOMER_CONTACTS table ===');
    const { data: contactsTest, error: contactsError } = await supabaseBanking
      .from('customer_contacts')
      .select('*')
      .limit(1);
    
    if (contactsError) {
      console.error('Customer contacts error:', contactsError);
    } else {
      console.log('Customer contacts columns:', contactsTest.length > 0 ? Object.keys(contactsTest[0]) : 'No data');
    }
    
    // Try to get table information from Supabase
    console.log('\n=== Fetching table definitions ===');
    const { data: tableInfo, error: tableError } = await supabaseBanking
      .rpc('get_table_columns', {
        schema_name: 'kastle_banking',
        table_names: ['branches', 'customers', 'customer_contacts']
      });
    
    if (tableError) {
      console.log('Could not fetch table definitions (RPC might not exist):', tableError.message);
    } else {
      console.log('Table definitions:', tableInfo);
    }
    
  } catch (error) {
    console.error('Schema test error:', error);
  }
}

// Function to get column information using information_schema
export async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabaseBanking
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'kastle_banking')
      .eq('table_name', tableName);
    
    if (error) {
      console.error(`Error fetching columns for ${tableName}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching columns for ${tableName}:`, error);
    return null;
  }
}