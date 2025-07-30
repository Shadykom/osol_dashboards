// Banking Services Data Validation Utility
// Ensures data consistency across banking dashboard components

/**
 * Validates that account types distribution equals total accounts
 * @param {number} totalAccounts - Total account count
 * @param {Object} accountTypes - Account types distribution object
 * @returns {boolean} - Whether the data is consistent
 */
export function validateAccountTypes(totalAccounts, accountTypes) {
  if (!accountTypes || typeof accountTypes !== 'object') {
    console.warn('Invalid account types data:', accountTypes);
    return false;
  }
  
  const typesTotal = Object.values(accountTypes).reduce((sum, count) => sum + count, 0);
  const isConsistent = typesTotal === totalAccounts;
  
  if (!isConsistent) {
    console.warn(`Account data inconsistency: Total accounts (${totalAccounts}) != Sum of types (${typesTotal})`);
    console.warn('Account types breakdown:', accountTypes);
  }
  
  return isConsistent;
}

/**
 * Validates banking KPIs consistency
 * @param {Object} bankingData - Banking data object
 * @returns {Object} - Validation result
 */
export function validateBankingKPIs(bankingData) {
  const warnings = [];
  const errors = [];
  
  if (!bankingData) {
    errors.push('Banking data is null or undefined');
    return { valid: false, errors, warnings };
  }
  
  const { totalAccounts, activeAccounts, totalDeposits, accountTypes } = bankingData;
  
  // Validate account numbers
  if (activeAccounts > totalAccounts) {
    errors.push(`Active accounts (${activeAccounts}) cannot exceed total accounts (${totalAccounts})`);
  }
  
  // Validate deposits
  if (totalDeposits < 0) {
    errors.push(`Total deposits cannot be negative: ${totalDeposits}`);
  }
  
  // Validate account types if provided
  if (accountTypes) {
    const typesTotal = Object.values(accountTypes).reduce((sum, count) => sum + count, 0);
    if (typesTotal !== totalAccounts) {
      warnings.push(`Account types sum (${typesTotal}) doesn't match total accounts (${totalAccounts})`);
    }
  }
  
  // Business logic validations
  if (totalAccounts === 0 && totalDeposits > 0) {
    warnings.push('Deposits exist but no accounts found - data inconsistency');
  }
  
  if (activeAccounts === 0 && totalDeposits > 0) {
    warnings.push('Deposits exist but no active accounts - possible data issue');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Ensures banking data consistency
 * @param {Object} bankingData - Banking data object
 * @returns {Object} - Validated banking data
 */
export function ensureBankingDataConsistency(bankingData) {
  if (!bankingData) return null;
  
  const { totalAccounts, activeAccounts, accountTypes, totalDeposits } = bankingData;
  
  // Ensure active accounts don't exceed total
  if (activeAccounts > totalAccounts) {
    console.warn(`Fixing: Active accounts (${activeAccounts}) > Total accounts (${totalAccounts})`);
    bankingData.activeAccounts = totalAccounts;
  }
  
  // Validate account types distribution
  if (accountTypes && Object.keys(accountTypes).length > 0) {
    const typesTotal = Object.values(accountTypes).reduce((sum, count) => sum + count, 0);
    if (typesTotal !== totalAccounts) {
      console.warn(`Account types inconsistency: Types sum (${typesTotal}) vs Total (${totalAccounts})`);
    }
  }
  
  return bankingData;
}

/**
 * Validates transaction data
 * @param {Object} transactionData - Transaction data
 * @returns {Object} - Validation result
 */
export function validateTransactionData(transactionData) {
  const warnings = [];
  const errors = [];
  
  if (!transactionData) {
    errors.push('Transaction data is null');
    return { valid: false, errors, warnings };
  }
  
  const { dailyCount, totalAmount, averageAmount } = transactionData;
  
  // Validate counts
  if (dailyCount < 0) {
    errors.push('Transaction count cannot be negative');
  }
  
  // Validate amounts
  if (totalAmount < 0) {
    errors.push('Total transaction amount cannot be negative');
  }
  
  // Validate average
  if (dailyCount > 0 && averageAmount === 0) {
    warnings.push('Transactions exist but average amount is zero');
  }
  
  if (dailyCount === 0 && totalAmount > 0) {
    errors.push('No transactions but total amount is positive');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Logs banking data for debugging
 * @param {string} component - Component name
 * @param {Object} data - Data to log
 */
export function logBankingData(component, data) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🏦 Banking Data - ${component}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', data);
    
    // Validate if applicable
    if (data.totalAccounts !== undefined) {
      const validation = validateBankingKPIs(data);
      console.log('Validation result:', validation);
    }
    
    console.groupEnd();
  }
}

/**
 * Calculates banking metrics
 * @param {Object} rawData - Raw banking data
 * @returns {Object} - Calculated metrics
 */
export function calculateBankingMetrics(rawData) {
  if (!rawData) return {};
  
  const { accounts, transactions, deposits } = rawData;
  
  return {
    accountUtilization: accounts?.total > 0 
      ? ((accounts.active / accounts.total) * 100).toFixed(2) 
      : 0,
    averageDeposit: accounts?.active > 0 
      ? (deposits.total / accounts.active).toFixed(2) 
      : 0,
    transactionFrequency: transactions?.daily || 0,
    depositGrowth: deposits?.growth || 0
  };
}