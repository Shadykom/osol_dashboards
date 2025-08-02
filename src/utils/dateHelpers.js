// Date formatting utilities for PostgreSQL compatibility

/**
 * Format a date for PostgreSQL, ensuring timezone compatibility
 * PostgreSQL expects ISO 8601 format with timezone
 * @param {Date|string} date - The date to format
 * @returns {string} - ISO 8601 formatted date string
 */
export function formatDateForDB(date) {
  if (!date) return null;
  
  // If it's already a string, try to parse it
  if (typeof date === 'string') {
    // Check if it contains invalid timezone format like 'gmt+0300'
    if (date.toLowerCase().includes('gmt+') || date.toLowerCase().includes('gmt-')) {
      // Extract the offset and convert to proper format
      const match = date.match(/gmt([+-])(\d{2})(\d{2})?/i);
      if (match) {
        const sign = match[1];
        const hours = match[2];
        const minutes = match[3] || '00';
        // Replace the invalid format with a valid one
        date = date.replace(/gmt[+-]\d{2,4}/i, `${sign}${hours}:${minutes}`);
      }
    }
    date = new Date(date);
  }
  
  // Ensure we have a valid date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date provided:', date);
    return null;
  }
  
  // Return ISO string which includes timezone information
  return date.toISOString();
}

/**
 * Format a date range for database queries
 * @param {Object} dateRange - Object with from and to dates
 * @returns {Object} - Formatted date range
 */
export function formatDateRangeForDB(dateRange) {
  if (!dateRange) return null;
  
  return {
    startDate: formatDateForDB(dateRange.from || dateRange.startDate),
    endDate: formatDateForDB(dateRange.to || dateRange.endDate)
  };
}

/**
 * Ensure date is in UTC format
 * @param {Date|string} date - The date to convert
 * @returns {string} - UTC formatted date string
 */
export function toUTCString(date) {
  if (!date) return null;
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  return d.toISOString();
}