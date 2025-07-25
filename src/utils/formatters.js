/**
 * Utility functions for consistent formatting across the application
 * All formatting uses English (en-US) locale to ensure consistency
 */

/**
 * Format a number to English locale string
 * @param {number} value - The number to format
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} The formatted number string
 */
export function formatNumber(value, options = {}) {
  if (value === null || value === undefined) return '0';
  
  try {
    return new Intl.NumberFormat('en-US', options).format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(value);
  }
}

/**
 * Format currency in English locale
 * @param {number} value - The amount to format
 * @param {string} currency - The currency code (default: 'SAR')
 * @returns {string} The formatted currency string
 */
export function formatCurrency(value, currency = 'SAR') {
  if (value === null || value === undefined) return `${currency} 0`;
  
  try {
    if (currency === 'SAR') {
      // For SAR, use simple formatting without currency symbol from Intl
      return `SAR ${formatNumber(value)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${value}`;
  }
}

/**
 * Format a date to English locale string
 * @param {Date|string} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a time to English locale string
 * @param {Date|string} date - The date/time to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted time string
 */
export function formatTime(date, options = {}) {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      ...options
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
}

/**
 * Format a date and time to English locale string
 * @param {Date|string} date - The date/time to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted date and time string
 */
export function formatDateTime(date, options = {}) {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      ...options
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
}