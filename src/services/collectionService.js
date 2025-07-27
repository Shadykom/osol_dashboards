import { 
  supabaseCollection, 
  TABLES, 
  getClientForTable
} from '@/lib/supabase';

// Simple API response formatter
function formatApiResponse(data, error = null, pagination = null) {
  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || null
      },
      pagination: null
    };
  }

  return {
    success: true,
    data,
    error: null,
    pagination
  };
}

export class CollectionService {
  /**
   * Get collection cases with filtering and pagination
   */
  static async getCases(filters = {}, pagination = { page: 1, limit: 20 }) {
    try {
      let query = supabaseCollection
        .from(TABLES.COLLECTION_CASES)
        .select('*');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const paginationInfo = {
        page: pagination.page,
        limit: pagination.limit,
        total: count,
        totalPages: Math.ceil(count / pagination.limit)
      };

      return formatApiResponse(data || [], null, paginationInfo);
    } catch (error) {
      console.error('Collection cases error:', error);
      return formatApiResponse(null, error);
    }
  }

  /**
   * Get collection analytics
   */
  static async getAnalytics() {
    try {
      return formatApiResponse({
        totalCases: 0,
        activeCases: 0,
        resolvedCases: 0,
        totalAmount: 0,
        recoveredAmount: 0,
        recoveryRate: 0
      });
    } catch (error) {
      console.error('Collection analytics error:', error);
      return formatApiResponse(null, error);
    }
  }
}

