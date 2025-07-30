import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export function useDataRefresh(refreshFunction, dependencies = [], options = {}) {
  const {
    refreshOnMount = true,
    refreshInterval = null,
    showNotification = true,
    notificationMessage = 'Data refreshed successfully'
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const hasMounted = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      if (refreshFunction) {
        await refreshFunction();
      }
      
      setLastRefreshed(new Date());
      
      if (showNotification) {
        toast.success(notificationMessage);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFunction, showNotification, notificationMessage]);

  // Refresh on mount
  useEffect(() => {
    if (refreshOnMount && !hasMounted.current) {
      hasMounted.current = true;
      refresh();
    }
  }, [refresh, refreshOnMount]);

  // Refresh on dependencies change (but not on mount)
  useEffect(() => {
    if (hasMounted.current && dependencies.length > 0) {
      refresh();
    }
  }, dependencies);

  // Set up interval refresh if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refresh]);

  return {
    refresh,
    isRefreshing,
    lastRefreshed
  };
}