// Dashboard Data Validation Utility
// Ensures data consistency across all dashboard components

/**
 * Validates that customer segments total equals total customers
 * @param {number} totalCustomers - Total customer count
 * @param {Object} segments - Customer segments object
 * @returns {boolean} - Whether the data is consistent
 */
export function validateCustomerSegments(totalCustomers, segments) {
  if (!segments || typeof segments !== 'object') {
    console.warn('Invalid segments data:', segments);
    return false;
  }
  
  const segmentTotal = Object.values(segments).reduce((sum, count) => sum + count, 0);
  const isConsistent = segmentTotal === totalCustomers;
  
  if (!isConsistent) {
    console.warn(`Data inconsistency detected: Total customers (${totalCustomers}) != Sum of segments (${segmentTotal})`);
    console.warn('Segments breakdown:', segments);
  }
  
  return isConsistent;
}

/**
 * Ensures customer data consistency and fixes if needed
 * @param {Object} customerData - Customer data object
 * @returns {Object} - Validated and potentially fixed customer data
 */
export function ensureCustomerDataConsistency(customerData) {
  if (!customerData) return null;
  
  const { totalCustomers, segments } = customerData;
  
  // If no segments data, return as is
  if (!segments || Object.keys(segments).length === 0) {
    return customerData;
  }
  
  // Calculate segment total
  const segmentTotal = Object.values(segments).reduce((sum, count) => sum + count, 0);
  
  // If totals don't match, log warning but keep the data
  if (segmentTotal !== totalCustomers) {
    console.warn(`Customer data inconsistency: Total (${totalCustomers}) vs Segments sum (${segmentTotal})`);
    
    // You could choose to fix it here, but for now just log
    // Option 1: Trust totalCustomers
    // Option 2: Trust segments sum
    // For now, we'll trust the totalCustomers from the direct count query
  }
  
  return customerData;
}

/**
 * Validates dashboard KPI data
 * @param {Object} kpiData - KPI data object
 * @returns {Object} - Validation result with any warnings
 */
export function validateDashboardKPIs(kpiData) {
  const warnings = [];
  const errors = [];
  
  if (!kpiData) {
    errors.push('KPI data is null or undefined');
    return { valid: false, errors, warnings };
  }
  
  // Check for required fields
  const requiredFields = ['totalCustomers', 'totalAccounts', 'totalDeposits', 'totalLoans'];
  for (const field of requiredFields) {
    if (kpiData[field] === undefined || kpiData[field] === null) {
      warnings.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate numeric values
  for (const [key, value] of Object.entries(kpiData)) {
    if (typeof value === 'number' && value < 0) {
      errors.push(`Invalid negative value for ${key}: ${value}`);
    }
  }
  
  // Business logic validations
  if (kpiData.totalAccounts > 0 && kpiData.totalCustomers === 0) {
    warnings.push('Accounts exist but no customers found - data inconsistency');
  }
  
  if (kpiData.totalDeposits > 0 && kpiData.totalAccounts === 0) {
    warnings.push('Deposits exist but no accounts found - data inconsistency');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Logs dashboard data for debugging
 * @param {string} component - Component name
 * @param {Object} data - Data to log
 */
export function logDashboardData(component, data) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`📊 Dashboard Data - ${component}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', data);
    
    // Log specific validations
    if (data.totalCustomers !== undefined && data.segments) {
      const isConsistent = validateCustomerSegments(data.totalCustomers, data.segments);
      console.log('Customer data consistent:', isConsistent);
    }
    
    console.groupEnd();
  }
}

/**
 * Formats and validates chart data
 * @param {Array} data - Raw chart data
 * @param {string} chartType - Type of chart (pie, bar, etc.)
 * @returns {Array} - Formatted and validated chart data
 */
export function validateChartData(data, chartType) {
  if (!Array.isArray(data)) {
    console.warn('Chart data is not an array:', data);
    return [];
  }
  
  if (data.length === 0) {
    console.warn('Chart data is empty');
    return [];
  }
  
  // Validate based on chart type
  switch (chartType) {
    case 'pie':
      // Ensure all pie slices have required fields
      return data.map((item, index) => ({
        ...item,
        value: item.value || 0,
        name: item.name || `Segment ${index + 1}`,
        fill: item.fill || '#8884d8'
      }));
      
    case 'bar':
    case 'line':
      // Ensure all data points have numeric values
      return data.filter(item => {
        const hasValidValue = typeof item.value === 'number' || typeof item.amount === 'number';
        if (!hasValidValue) {
          console.warn('Invalid chart data item:', item);
        }
        return hasValidValue;
      });
      
    default:
      return data;
  }
}