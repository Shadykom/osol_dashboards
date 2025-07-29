#!/usr/bin/env node

// Script to check if kastle_banking schema is exposed in Supabase

const SUPABASE_URL = 'https://bzlenegoilnswsbanxgb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE';

async function checkSchemaAccess() {
  console.log('🔍 Checking kastle_banking schema access...\n');

  try {
    // Test query to kastle_banking.customers
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/customers?select=customer_id&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept-Profile': 'kastle_banking',
          'Content-Profile': 'kastle_banking'
        }
      }
    );

    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ kastle_banking schema is properly exposed!');
      console.log('Response:', responseText);
    } else {
      console.error('❌ Error accessing kastle_banking schema');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
      
      if (responseText.includes('relation') && responseText.includes('does not exist')) {
        console.error('\n⚠️  SCHEMA NOT EXPOSED!');
        console.error('Please follow these steps:');
        console.error('1. Go to: https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api');
        console.error('2. Find "Exposed schemas" section');
        console.error('3. Add "kastle_banking" to the list');
        console.error('4. Click Save');
      }
    }
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
  }
}

checkSchemaAccess();