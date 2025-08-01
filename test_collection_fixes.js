#!/usr/bin/env node

import { CollectionService } from './src/services/collectionService.js';

console.log('Testing Collection Service Fixes...\n');

async function testCollectionCases() {
  console.log('🔍 Testing Collection Cases Query...');
  try {
    const result = await CollectionService.getCollectionCases({
      page: 1,
      limit: 5
    });
    
    if (result.success) {
      console.log('✅ Collection Cases Query: SUCCESS');
      console.log(`   Found ${result.data?.length || 0} cases`);
    } else {
      console.log('❌ Collection Cases Query: FAILED');
      console.log('   Error:', result.error?.message);
      console.log('   Details:', result.error?.details);
    }
  } catch (error) {
    console.log('❌ Collection Cases Query: EXCEPTION');
    console.log('   Error:', error.message);
  }
}

async function testOfficerPerformance() {
  console.log('\n🔍 Testing Officer Performance Query...');
  try {
    const result = await CollectionService.getCollectionPerformance('monthly', {});
    
    if (result.success) {
      console.log('✅ Officer Performance Query: SUCCESS');
      console.log(`   Found ${result.data?.topOfficers?.length || 0} top officers`);
    } else {
      console.log('❌ Officer Performance Query: FAILED');
      console.log('   Error:', result.error?.message);
      console.log('   Details:', result.error?.details);
    }
  } catch (error) {
    console.log('❌ Officer Performance Query: EXCEPTION');
    console.log('   Error:', error.message);
  }
}

async function testCollectionOverview() {
  console.log('\n🔍 Testing Collection Overview Query...');
  try {
    const result = await CollectionService.getCollectionOverview({});
    
    if (result.success) {
      console.log('✅ Collection Overview Query: SUCCESS');
      console.log(`   Total cases: ${result.data?.totalCases || 0}`);
    } else {
      console.log('❌ Collection Overview Query: FAILED');
      console.log('   Error:', result.error?.message);
      console.log('   Details:', result.error?.details);
    }
  } catch (error) {
    console.log('❌ Collection Overview Query: EXCEPTION');
    console.log('   Error:', error.message);
  }
}

async function runTests() {
  console.log('Starting Collection Service Tests...\n');
  
  await testCollectionCases();
  await testOfficerPerformance();
  await testCollectionOverview();
  
  console.log('\n📊 Test Results Summary:');
  console.log('All major collection queries have been tested.');
  console.log('Check the results above for specific issues.');
  console.log('\nIf tests are still failing, the database schema may need to be updated.');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}