// Real-time updates hook
//
// Subscribes to Supabase real-time channels and invokes a callback whenever
// matching database events occur.  The provided filters are translated
// into a Supabase filter string.  Note that this code requires a
// supabase client instance to be configured separately.

import { useEffect, useRef } from 'react';
import { supabaseBanking } from '../lib/supabase';

export const useRealtimeUpdates = (table, callback, filters = {}) => {
  const subscriptionRef = useRef(null);

  useEffect(() => {
    const channel = supabaseBanking
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: buildFilter(filters)
        },
        (payload) => {
          console.log('Real-time update:', payload);
          callback(payload);
        }
      )
      .subscribe();
    subscriptionRef.current = channel;
    return () => {
      if (subscriptionRef.current) {
        supabaseBanking.removeChannel(subscriptionRef.current);
      }
    };
  }, [table, filters]);
};

const buildFilter = (filters) => {
  const filterParts = [];
  if (filters.branch && filters.branch !== 'all') {
    filterParts.push(`branch_id=eq.${filters.branch}`);
  }
  if (filters.status) {
    filterParts.push(`status=eq.${filters.status}`);
  }
  return filterParts.join('&');
};

// Usage helper for hooking up widget real-time events.  A simple mapping
// between widgets and their underlying tables allows generic subscription.
export const useWidgetRealtimeUpdates = (widget, onUpdate) => {
  const table = getTableForWidget(widget);
  useRealtimeUpdates(table, (payload) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      onUpdate();
    }
  });
};

// Placeholder mapping between widgets and database tables.  You should
// customise this to return the correct table for your widgets.
const getTableForWidget = (widget) => {
  // e.g. if (widget.section === 'overview' && widget.widget === 'totalAssets') return 'accounts';
  return 'accounts';
};