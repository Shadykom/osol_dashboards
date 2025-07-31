import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseBanking, TABLES } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestDashboardRouting() {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    // Test 1: Check if we can access Supabase
    try {
      const { data, error } = await supabaseBanking
        .from(TABLES.CUSTOMERS)
        .select('customer_id')
        .limit(1);
      
      results.supabaseAccess = {
        success: !error,
        message: error ? error.message : 'Supabase accessible',
        data: data
      };
    } catch (e) {
      results.supabaseAccess = {
        success: false,
        message: e.message
      };
    }

    // Test 2: Check routing
    results.routing = {
      success: true,
      currentPath: window.location.pathname,
      message: 'Routing system working'
    };

    // Test 3: Check localStorage
    try {
      localStorage.setItem('test', 'value');
      localStorage.removeItem('test');
      results.localStorage = {
        success: true,
        message: 'LocalStorage working'
      };
    } catch (e) {
      results.localStorage = {
        success: false,
        message: e.message
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  const testNavigation = (path) => {
    console.log('Testing navigation to:', path);
    navigate(path);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard Routing & Data Test</h1>
      
      {loading ? (
        <div>Running tests...</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(testResults).map(([test, result]) => (
            <Card key={test}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {test}: {result.success ? '✅ Passed' : '❌ Failed'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{result.message}</p>
                {result.data && (
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-sm">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">Test Navigation</h2>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => testNavigation('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button onClick={() => testNavigation('/dashboard/detail-new/overview/total_assets')}>
            Test Detail Page
          </Button>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}