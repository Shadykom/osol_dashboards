// Utility functions for number formatting
// Always formats numbers in English (Western Arabic numerals) regardless of locale

/**
 * Format a number with English numerals
 * @param {number} value - The number to format
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, options = {}) => {
  if (value == null || isNaN(value)) return '';
  
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  });
  
  return formatter.format(value);
};

/**
 * Format currency with English numerals
 * @param {number} value - The amount to format
 * @param {string} currency - Currency code (default: SAR)
 * @param {object} options - Additional Intl.NumberFormat options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'SAR', options = {}) => {
  if (value == null || isNaN(value)) return '';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  });
  
  return formatter.format(value);
};

/**
 * Format percentage with English numerals
 * @param {number} value - The percentage value (0-100)
 * @param {object} options - Additional Intl.NumberFormat options
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value, options = {}) => {
  if (value == null || isNaN(value)) return '';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  });
  
  // If value is already a percentage (0-100), divide by 100
  const percentValue = value > 1 ? value / 100 : value;
  
  return formatter.format(percentValue);
};

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted abbreviated number
 */
export const formatCompactNumber = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '';
  
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return formatter.format(value);
};

/**
 * Parse a localized number string back to a number
 * @param {string} value - The localized number string
 * @returns {number} Parsed number
 */
export const parseLocalizedNumber = (value) => {
  if (!value) return 0;
  
  // Remove any non-numeric characters except decimal point and minus sign
  const cleanValue = value.toString()
    .replace(/[^\d.-]/g, '')
    .replace(/,/g, '');
  
  return parseFloat(cleanValue) || 0;
};

/**
 * Format date with consistent format
 * @param {Date|string} date - The date to format
 * @param {string} locale - The locale to use (default: current i18n locale)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = 'en-US') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Use English format for dates to maintain consistency
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

/**
 * Format date and time with consistent format
 * @param {Date|string} date - The date to format
 * @param {string} locale - The locale to use (default: current i18n locale)
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, locale = 'en-US') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Use English format for dates to maintain consistency
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
};