import { useEffect, useState, useCallback } from 'react';
import { supabaseBanking, supabaseCollection } from '@/lib/supabase';

/**
 * Custom hook for real-time data updates
 * @param {string} table - Table name to subscribe to
 * @param {string} schema - Schema name (kastle_banking or kastle_collection)
 * @param {Function} onUpdate - Callback function when data updates
 * @param {Object} filters - Optional filters for subscription
 */
export const useRealtimeData = (table, schema = 'kastle_banking', onUpdate, filters = {}) => {
  const [subscription, setSubscription] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

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

      setSubscription(channel);
    } catch (err) {
      console.error('Error setting up real-time subscription:', err);
      setError(err.message);
    }
  }, [table, schema, filters, onUpdate, supabase]);

  // Unsubscribe from real-time changes
  const unsubscribe = useCallback(() => {
    if (subscription) {
      console.log('Unsubscribing from real-time updates');
      supabase.removeChannel(subscription);
      setSubscription(null);
      setIsConnected(false);
    }
  }, [subscription, supabase]);

  // Set up subscription on mount
  useEffect(() => {
    subscribe();

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  // Reconnect function
  const reconnect = useCallback(() => {
    unsubscribe();
    setTimeout(() => {
      subscribe();
    }, 1000);
  }, [subscribe, unsubscribe]);

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