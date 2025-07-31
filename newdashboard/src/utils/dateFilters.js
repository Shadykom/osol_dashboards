// Date filter utilities
//
// This file is ported directly from the provided documentation.  It exposes
// helper functions for computing ISO date ranges for common preset ranges
// (today, yesterday, last_7_days, etc.), calculating the previous period for
// comparison, and computing a percentage change between two values.  These
// helpers are used by the dashboard services to build SQL queries and
// calculate KPI deltas.

export const getDateFilter = (dateRange) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (dateRange) {
    case 'today':
      return {
        start: today.toISOString(),
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };

    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday.toISOString(),
        end: today.toISOString()
      };
    }

    case 'last_7_days':
      return {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: now.toISOString()
      };

    case 'last_30_days':
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: now.toISOString()
      };

    case 'last_quarter': {
      const quarterStart = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3 - 3,
        1
      );
      const quarterEnd = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        0
      );
      return {
        start: quarterStart.toISOString(),
        end: quarterEnd.toISOString()
      };
    }

    case 'last_year':
      return {
        start: new Date(now.getFullYear() - 1, 0, 1).toISOString(),
        end: new Date(now.getFullYear() - 1, 11, 31).toISOString()
      };

    case 'custom':
      // Placeholder for custom ranges – consumers should override this with
      // actual values before calling getDateFilter.
      return {
        start: new Date().toISOString(),
        end: new Date().toISOString()
      };

    default:
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: now.toISOString()
      };
  }
};

export const getPreviousPeriodData = async (filters) => {
  const currentPeriod = getDateFilter(filters.dateRange);
  const currentStart = new Date(currentPeriod.start);
  const currentEnd = new Date(currentPeriod.end);
  const periodLength = currentEnd - currentStart;

  const previousStart = new Date(currentStart.getTime() - periodLength);
  const previousEnd = new Date(currentEnd.getTime() - periodLength);

  return {
    start: previousStart.toISOString(),
    end: previousEnd.toISOString()
  };
};

export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return (((current - previous) / previous) * 100).toFixed(2);
};