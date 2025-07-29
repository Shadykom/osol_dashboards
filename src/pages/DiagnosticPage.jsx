import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabaseBanking, supabaseCollection } from '@/lib/supabase';

// Immediate diagnostic logging
console.log('🔍 DiagnosticPage loaded');
console.log('Environment variables:');
console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('- Key preview:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

export default function DiagnosticPage() {
  const [testResults, setTestResults] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const results = {};

    // Check environment variables
    results.env = {
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length,
      keyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY 
        ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-10)}`
        : 'NOT SET'
    };

    // Check localStorage
    results.localStorage = {
      'osol-auth': localStorage.getItem('osol-auth') ? 'Present' : 'Not found',
      'demo_session': localStorage.getItem('demo_session') ? 'Present' : 'Not found',
      'demo_user': localStorage.getItem('demo_user') ? 'Present' : 'Not found'
    };

    // Test direct fetch
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/customers?select=*&limit=1`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );
      results.directFetch = {
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      };
    } catch (error) {
      results.directFetch = { error: error.message };
    }

    // Test supabase client (public schema - deprecated)
    try {
      const { data, error } = await supabaseBanking
        .from('customers')
        .select('*')
        .limit(1);
      
      results.supabaseClient = {
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0,
        note: 'Using kastle_banking schema'
      };
    } catch (error) {
      results.supabaseClient = { error: error.message };
    }

    // Test supabaseBanking client
    try {
      const { data, error } = await supabaseBanking
        .from('customers')
        .select('*')
        .limit(1);
      
      results.supabaseBanking = {
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0
      };
    } catch (error) {
      results.supabaseBanking = { error: error.message };
    }

    // Test supabaseCollection client
    try {
      const { data, error } = await supabaseCollection
        .from('collection_officers')
        .select('*')
        .limit(1);
      
      results.supabaseCollection = {
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0
      };
    } catch (error) {
      results.supabaseCollection = { error: error.message };
    }

    setTestResults(results);
    setLoading(false);
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running...' : 'Run Diagnostics'}
            </Button>
            <Button onClick={clearLocalStorage} variant="destructive">
              Clear Local Storage & Reload
            </Button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-4 mt-6">
              {Object.entries(testResults).map(([key, value]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="text-lg">{key}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}