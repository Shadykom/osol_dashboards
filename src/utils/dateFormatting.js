/**
 * Safe date formatting utilities that prevent hydration errors
 * These functions ensure consistent date formatting between server and client
 */

/**
 * Format a date to a locale string safely
 * @param {Date|string} date - The date to format
 * @param {string} locale - The locale to use (default: 'en-US')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted date string
 */
export function safeFormatDate(date, locale = 'en-US', options = {}) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a time to a locale string safely
 * @param {Date|string} date - The date/time to format
 * @param {string} locale - The locale to use (default: 'en-US')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted time string
 */
export function safeFormatTime(date, locale = 'en-US', options = {}) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString(locale, options);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
}

/**
 * Format a number to a locale string safely
 * @param {number} number - The number to format
 * @param {string} locale - The locale to use (default: 'en-US')
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} The formatted number string
 */
export function safeFormatNumber(number, locale = 'en-US', options = {}) {
  try {
    return number.toLocaleString(locale, options);
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(number);
  }
}