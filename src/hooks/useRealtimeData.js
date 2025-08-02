import { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseBanking, supabaseCollection } from '@/lib/supabase';

/**
 * Custom hook for real-time data updates
 * @param {string} table - Table name to subscribe to
 * @param {string} schema - Schema name (kastle_banking or kastle_collection)
 * @param {Function} onUpdate - Callback function when data updates
 * @param {Object} filters - Optional filters for subscription
 */
export const useRealtimeData = (table, schema = 'kastle_banking', onUpdate, filters = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  // Get the appropriate Supabase client
  const supabase = schema === 'kastle_collection' ? supabaseCollection : supabaseBanking;

  // Subscribe to real-time changes
  const subscribe = useCallback(() => {
    try {
      // Build the subscription
      let channel = supabase
        .channel(`${schema}_${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: schema,
            table: table,
            filter: filters.filter || undefined
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            setLastUpdate(new Date());
            
            // Call the update callback with the payload
            if (onUpdate) {
              onUpdate({
                eventType: payload.eventType,
                new: payload.new,
                old: payload.old,
                timestamp: new Date().toISOString()
              });
            }
          }
        );

      // Subscribe to connection state changes
      channel.on('system', {}, (payload) => {
        console.log('System event:', payload);
        if (payload.extension === 'postgres_changes') {
          setIsConnected(payload.status === 'ok');
        }
      });

      // Start the subscription
      channel.subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          setError('Failed to subscribe to real-time updates');
        }
      });

      subscriptionRef.current = channel;
    } catch (err) {
      console.error('Error setting up real-time subscription:', err);
      setError(err.message);
    }
  }, [table, schema, filters.filter, onUpdate, supabase]); // Use specific filter property

  // Unsubscribe from real-time changes
  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('Unsubscribing from real-time updates');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
      setIsConnected(false);
    }
  }, [supabase]);

  // Set up subscription on mount
  useEffect(() => {
    // Only subscribe if we have valid parameters
    if (!table || !schema) {
      console.warn('Missing required parameters for real-time subscription');
      return;
    }

    // Add a small delay to prevent immediate subscription on mount
    const timeoutId = setTimeout(() => {
      subscribe();
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      if (subscriptionRef.current) {
        console.log('Unsubscribing from real-time updates');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Reconnect function with exponential backoff
  const reconnect = useCallback(() => {
    unsubscribe();
    // Use exponential backoff to prevent rapid reconnection attempts
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;
    
    setTimeout(() => {
      subscribe();
    }, delay);
  }, [subscribe, unsubscribe]);

  // Add a ref to track reconnection attempts
  const reconnectAttempts = useRef(0);

  // Reset reconnection attempts on successful connection
  useEffect(() => {
    if (isConnected) {
      reconnectAttempts.current = 0;
    }
  }, [isConnected]);

  return {
    isConnected,
    lastUpdate,
    error,
    reconnect,
    unsubscribe
  };
};

/**
 * Hook for real-time collection metrics updates
 */
export const useRealtimeCollectionMetrics = (branchId, onUpdate) => {
  return useRealtimeData(
    'collection_cases',
    'kastle_banking',
    (payload) => {
      // Filter updates by branch if branchId is provided
      if (branchId && payload.new?.branch_id !== branchId && payload.old?.branch_id !== branchId) {
        return;
      }
      onUpdate(payload);
    },
    branchId ? { filter: `branch_id=eq.${branchId}` } : {}
  );
};

/**
 * Hook for real-time promise to pay updates
 */
export const useRealtimePromiseToPay = (specialistId, onUpdate) => {
  return useRealtimeData(
    'promise_to_pay',
    'kastle_banking',
    (payload) => {
      // Filter updates by specialist if specialistId is provided
      if (specialistId && payload.new?.officer_id !== specialistId && payload.old?.officer_id !== specialistId) {
        return;
      }
      onUpdate(payload);
    },
    specialistId ? { filter: `officer_id=eq.${specialistId}` } : {}
  );
};

/**
 * Hook for real-time communication attempts
 */
export const useRealtimeCommunication = (specialistId, onUpdate) => {
  return useRealtimeData(
    'collection_contact_attempts',
    'kastle_banking',
    (payload) => {
      // Filter updates by specialist if specialistId is provided
      if (specialistId && payload.new?.officer_id !== specialistId && payload.old?.officer_id !== specialistId) {
        return;
      }
      onUpdate(payload);
    },
    specialistId ? { filter: `officer_id=eq.${specialistId}` } : {}
  );
};

/**
 * Hook for real-time branch performance updates
 */
export const useRealtimeBranchPerformance = (branchId, onUpdate) => {
  return useRealtimeData(
    'branch_collection_performance',
    'kastle_banking',
    (payload) => {
      if (branchId && payload.new?.branch_id !== branchId && payload.old?.branch_id !== branchId) {
        return;
      }
      onUpdate(payload);
    },
    branchId ? { filter: `branch_id=eq.${branchId}` } : {}
  );
};

export default useRealtimeData;