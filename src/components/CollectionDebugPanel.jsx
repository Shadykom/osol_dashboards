import React, { useState, useEffect } from 'react';
import { supabaseCollection } from '@/lib/supabase';

const CollectionDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({
    currentDate: new Date().toISOString().split('T')[0],
    lastDayOfMonth: '',
    queryDate: '',
    tableCheck: null,
    dataCount: null,
    sampleData: null,
    error: null
  });

  useEffect(() => {
    const runDebugChecks = async () => {
      try {
        // Calculate dates
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const queryDate = lastDay.toISOString().split('T')[0];
        
        setDebugInfo(prev => ({
          ...prev,
          lastDayOfMonth: lastDay.toISOString().split('T')[0],
          queryDate: queryDate
        }));

        // Check if tables exist
        const { data: tables, error: tablesError } = await supabaseCollection
          .from('collection_teams')
          .select('team_id')
          .limit(1);

        if (tablesError) {
          setDebugInfo(prev => ({ ...prev, error: tablesError.message }));
          return;
        }

        // Count records
        const { count: teamsCount } = await supabaseCollection
          .from('collection_teams')
          .select('*', { count: 'exact', head: true });

        const { count: officersCount } = await supabaseCollection
          .from('collection_officers')
          .select('*', { count: 'exact', head: true });

        const { count: performanceCount } = await supabaseCollection
          .from('officer_performance_summary')
          .select('*', { count: 'exact', head: true });

        setDebugInfo(prev => ({
          ...prev,
          dataCount: {
            teams: teamsCount || 0,
            officers: officersCount || 0,
            performance: performanceCount || 0
          }
        }));

        // Get sample performance data
        const { data: sampleData, error: sampleError } = await supabaseCollection
          .from('officer_performance_summary')
          .select(`
            *,
            collection_officers!officer_id (
              officer_name,
              officer_type,
              team_id,
              collection_teams (
                team_name
              )
            )
          `)
          .lte('summary_date', queryDate)
          .order('summary_date', { ascending: false })
          .limit(3);

        if (sampleError) {
          setDebugInfo(prev => ({ ...prev, error: sampleError.message }));
        } else {
          setDebugInfo(prev => ({ ...prev, sampleData }));
        }

      } catch (error) {
        setDebugInfo(prev => ({ ...prev, error: error.message }));
      }
    };

    runDebugChecks();
  }, []);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Information</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Current Date:</strong> {debugInfo.currentDate}
        </div>
        <div>
          <strong>Last Day of Month:</strong> {debugInfo.lastDayOfMonth}
        </div>
        <div>
          <strong>Query Date:</strong> {debugInfo.queryDate}
        </div>
        
        {debugInfo.dataCount && (
          <div>
            <strong>Data Counts:</strong>
            <ul className="ml-4">
              <li>Teams: {debugInfo.dataCount.teams}</li>
              <li>Officers: {debugInfo.dataCount.officers}</li>
              <li>Performance Records: {debugInfo.dataCount.performance}</li>
            </ul>
          </div>
        )}
        
        {debugInfo.error && (
          <div className="text-red-600">
            <strong>Error:</strong> {debugInfo.error}
          </div>
        )}
        
        {debugInfo.sampleData && (
          <div>
            <strong>Sample Data:</strong>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo.sampleData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDebugPanel;
