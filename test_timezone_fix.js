// Test script for timezone fix

import { formatDateForDB, formatDateRangeForDB } from './src/utils/dateHelpers.js';

console.log('Testing timezone fix...\n');

// Test cases
const testCases = [
  {
    input: '2024-01-15T10:30:00 gmt+0300',
    description: 'Date string with invalid gmt+0300 format'
  },
  {
    input: '2024-01-15T10:30:00 GMT+0300',
    description: 'Date string with uppercase GMT+0300'
  },
  {
    input: '2024-01-15T10:30:00 gmt-0500',
    description: 'Date string with negative offset'
  },
  {
    input: new Date('2024-01-15T10:30:00+03:00'),
    description: 'Valid Date object with timezone'
  },
  {
    input: '2024-01-15T10:30:00Z',
    description: 'Valid ISO string with Z timezone'
  }
];

console.log('Individual date tests:');
console.log('=====================');
testCases.forEach(test => {
  console.log(`\nInput: ${test.input}`);
  console.log(`Description: ${test.description}`);
  try {
    const result = formatDateForDB(test.input);
    console.log(`Output: ${result}`);
    console.log('✅ Success');
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
});

// Test date range formatting
console.log('\n\nDate range tests:');
console.log('=================');
const rangeTests = [
  {
    input: {
      from: '2024-01-01T00:00:00 gmt+0300',
      to: '2024-01-31T23:59:59 gmt+0300'
    },
    description: 'Date range with invalid timezone format'
  },
  {
    input: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    },
    description: 'Date range with Date objects'
  }
];

rangeTests.forEach(test => {
  console.log(`\nInput: ${JSON.stringify(test.input)}`);
  console.log(`Description: ${test.description}`);
  try {
    const result = formatDateRangeForDB(test.input);
    console.log(`Output: ${JSON.stringify(result, null, 2)}`);
    console.log('✅ Success');
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
});

console.log('\n\nTest completed!');