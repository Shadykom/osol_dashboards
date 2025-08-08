import { supabase } from '../lib/supabase';

// Collection API endpoints
export const collectionApi = {
  // Get daily collection summary
  async getDailyCollectionSummary(date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_collection_summary')
        .select('*')
        .eq('summary_date', dateStr)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // If no data for today, return default structure
      return data || {
        total_due_today: 0,
        ptp_due_today: 0,
        field_visits_scheduled: 0,
        legal_cases_updates: 0,
        yesterday_collection: 0,
        yesterday_target: 0,
        yesterday_achievement: 0
      };
    } catch (error) {
      console.error('Error fetching daily collection summary:', error);
      throw error;
    }
  },

  // Get real-time collection tracking data
  async getRealtimeTracking() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get collector status
      const { data: collectors, error: collectorsError } = await supabase
        .from('collection_officers')
        .select('officer_id, officer_name, status, team_id, current_activity')
        .eq('is_active', true);
      
      if (collectorsError) throw collectorsError;
      
      // Get today's payments
      const { data: payments, error: paymentsError } = await supabase
        .from('collection_payments')
        .select('*')
        .gte('payment_date', today)
        .order('payment_date', { ascending: false })
        .limit(100);
      
      if (paymentsError) throw paymentsError;
      
      // Get active collection cases
      const { data: activeCases, error: casesError } = await supabase
        .from('collection_cases')
        .select('case_id, status, priority, assigned_to')
        .in('status', ['active', 'in_progress', 'pending']);
      
      if (casesError) throw casesError;
      
      // Calculate metrics
      const collectorsOnline = collectors.filter(c => c.status === 'online').length;
      const collectorsOffline = collectors.filter(c => c.status === 'offline').length;
      const collectorsOnBreak = collectors.filter(c => c.status === 'break').length;
      
      const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paymentsCount = payments.length;
      
      return {
        collectorsOnline,
        collectorsOffline,
        collectorsOnBreak,
        totalCollectors: collectors.length,
        realTimePayments: totalPayments,
        paymentsCount,
        failedAttempts: 0, // This would come from attempt logs
        contactSuccessRate: 0, // Calculate from contact logs
        ptpObtained: 0, // Count from PTP records
        ptpTarget: 0, // From targets table
        currentHourCollection: 0, // Filter payments by current hour
        lastHourCollection: 0, // Filter payments by last hour
        activeCalls: 0, // From call logs
        avgCallDuration: '0:00',
        recentPayments: payments.slice(0, 5).map(p => ({
          time: new Date(p.payment_date).toLocaleTimeString(),
          customer: p.customer_name || 'Unknown',
          amount: p.amount,
          method: p.payment_method || 'Unknown'
        })),
        criticalAlerts: [] // Would come from alerts table
      };
    } catch (error) {
      console.error('Error fetching realtime tracking:', error);
      throw error;
    }
  },

  // Get collector activity
  async getCollectorActivity() {
    try {
      const { data, error } = await supabase
        .from('collection_officers')
        .select(`
          officer_id,
          officer_name,
          status,
          current_activity,
          last_activity_time,
          team:collection_teams(team_name)
        `)
        .eq('is_active', true)
        .order('last_activity_time', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return data.map(officer => ({
        name: officer.officer_name,
        status: officer.status?.toUpperCase() || 'OFFLINE',
        duration: officer.last_activity_time ? 
          calculateDuration(new Date(officer.last_activity_time)) : '-',
        customer: officer.current_activity?.customer || '-',
        team: officer.team?.team_name || 'Unassigned'
      }));
    } catch (error) {
      console.error('Error fetching collector activity:', error);
      throw error;
    }
  },

  // Get hourly collection trend
  async getHourlyCollectionTrend() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      
      const { data, error } = await supabase
        .from('collection_payments')
        .select('payment_date, amount')
        .gte('payment_date', startOfDay.toISOString())
        .order('payment_date', { ascending: true });
      
      if (error) throw error;
      
      // Group by hour
      const hourlyData = {};
      data.forEach(payment => {
        const hour = new Date(payment.payment_date).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = {
            hour: hourKey,
            collected: 0,
            calls: 0,
            contacts: 0
          };
        }
        
        hourlyData[hourKey].collected += payment.amount || 0;
      });
      
      // Fill in missing hours
      const trend = [];
      for (let i = 8; i <= new Date().getHours(); i++) {
        const hourKey = `${i.toString().padStart(2, '0')}:00`;
        trend.push(hourlyData[hourKey] || {
          hour: hourKey,
          collected: 0,
          calls: 0,
          contacts: 0
        });
      }
      
      return trend;
    } catch (error) {
      console.error('Error fetching hourly trend:', error);
      throw error;
    }
  },

  // Get queue status
  async getQueueStatus() {
    try {
      const { data, error } = await supabase
        .from('collection_cases')
        .select('priority, status, assigned_to, created_at')
        .in('status', ['pending', 'active', 'in_progress']);
      
      if (error) throw error;
      
      // Group by priority
      const queues = {
        priority: { total: 0, assigned: 0, pending: 0, avgWait: '0:00' },
        normal: { total: 0, assigned: 0, pending: 0, avgWait: '0:00' },
        low: { total: 0, assigned: 0, pending: 0, avgWait: '0:00' }
      };
      
      data.forEach(caseItem => {
        const priority = caseItem.priority || 'normal';
        const queueKey = priority === 'high' ? 'priority' : priority;
        
        if (queues[queueKey]) {
          queues[queueKey].total++;
          if (caseItem.assigned_to) {
            queues[queueKey].assigned++;
          } else {
            queues[queueKey].pending++;
          }
        }
      });
      
      return queues;
    } catch (error) {
      console.error('Error fetching queue status:', error);
      throw error;
    }
  },

  // Get payment methods distribution
  async getPaymentMethodsDistribution() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('collection_payments')
        .select('payment_method, amount')
        .gte('payment_date', today);
      
      if (error) throw error;
      
      // Group by payment method
      const methods = {};
      data.forEach(payment => {
        const method = payment.payment_method || 'Unknown';
        if (!methods[method]) {
          methods[method] = { name: method, value: 0, count: 0 };
        }
        methods[method].value += payment.amount || 0;
        methods[method].count++;
      });
      
      return Object.values(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  },

  // Subscribe to real-time updates
  subscribeToUpdates(callbacks) {
    const subscriptions = [];
    
    // Subscribe to collection payments
    subscriptions.push(
      supabase
        .channel('collection_payments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collection_payments'
          },
          callbacks.onPaymentUpdate || (() => {})
        )
        .subscribe()
    );
    
    // Subscribe to collector status changes
    subscriptions.push(
      supabase
        .channel('collection_officers_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collection_officers'
          },
          callbacks.onCollectorUpdate || (() => {})
        )
        .subscribe()
    );
    
    // Subscribe to case updates
    subscriptions.push(
      supabase
        .channel('collection_cases_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collection_cases'
          },
          callbacks.onCaseUpdate || (() => {})
        )
        .subscribe()
    );
    
    // Return unsubscribe function
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }
};

// Helper function to calculate duration
function calculateDuration(startTime) {
  const now = new Date();
  const diff = now - startTime;
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default collectionApi;