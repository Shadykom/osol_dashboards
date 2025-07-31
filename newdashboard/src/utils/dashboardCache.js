// Dashboard cache implementation
//
// Provides a simple in-memory cache for widget data keyed by widgetId and
// serialised filters.  Cached entries expire after a configurable timeout.

class DashboardCache {
  constructor() {
    this.cache = new Map();
    // default expiry of 5 minutes (ms)
    this.cacheTimeout = 5 * 60 * 1000;
  }

  generateKey(widgetId, filters) {
    return `${widgetId}_${JSON.stringify(filters)}`;
  }

  set(widgetId, filters, data) {
    const key = this.generateKey(widgetId, filters);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(widgetId, filters) {
    const key = this.generateKey(widgetId, filters);
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  clearWidget(widgetId) {
    for (const [key] of this.cache) {
      if (key.startsWith(widgetId)) {
        this.cache.delete(key);
      }
    }
  }
}

export const dashboardCache = new DashboardCache();

// Hook for using cached data inside React components.  It attempts to read
// cached data before running the provided fetch function.  When the fetch
// function resolves the result is stored back into the cache.
import { useState, useEffect } from 'react';

export const useCachedData = (widgetId, filters, fetchFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const cached = dashboardCache.get(widgetId, filters);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await fetchFn(filters);
        dashboardCache.set(widgetId, filters, result);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [widgetId, filters, fetchFn]);

  const refresh = async () => {
    dashboardCache.clearWidget(widgetId);
    const result = await fetchFn(filters);
    dashboardCache.set(widgetId, filters, result);
    setData(result);
    return result;
  };

  return { data, loading, error, refresh };
};