// src/hooks/useWidgetData.js
import { useState, useEffect, useCallback } from 'react';
import { WidgetService } from '@/services/widgetService';

export function useWidgetData(widgetId, config, refreshInterval = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    if (!config || !config.dataSource) return;

    try {
      setLoading(true);
      const result = await WidgetService.executeWidgetQuery(config);
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching widget data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [widgetId, config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refreshInterval || refreshInterval === 'manual') return;

    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, lastUpdated, refetch: fetchData };
}