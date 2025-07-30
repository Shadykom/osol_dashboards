/**
 * API Helper Functions
 * Standardized response formatting for API calls
 */

/**
 * Format successful API response
 * @param {any} data - Response data
 * @param {Error|null} error - Error object if any
 * @param {Object|null} pagination - Pagination info if applicable
 * @returns {Object} Formatted response
 */
export function formatApiResponse(data, error = null, pagination = null) {
  const response = {
    success: !error,
    data,
    error: error ? error.message : null
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
}

/**
 * Format API error response
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
export function formatApiError(error) {
  return {
    success: false,
    data: null,
    error: error.message || 'An unknown error occurred'
  };
}