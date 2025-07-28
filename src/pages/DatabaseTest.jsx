// src/pages/DatabaseTest.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, DatabaseIcon } from '@/utils/icons';
import { 
  supabase, 
  supabaseBanking, 
  supabaseCollection, 
  TABLES
} from '@/lib/supabase';

export function DatabaseTest() {
  const [status, setStatus] = useState('checking');
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkDatabase = async () => {
    setLoading(true);
    setError(null);
    setStatus('checking');
    
    const testResults = {
      environment: {
        url: import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
        key: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
        bankingClient: supabaseBanking ? '✅ Initialized' : '❌ Not initialized',
        collectionClient: supabaseCollection ? '✅ Initialized' : '❌ Not initialized'
      },
      bankingTables: {},
      collectionTables: {}
    };

    // Test basic connection
    const connectionTest = {
      success: supabase !== null,
      banking: supabaseBanking !== null,
      collection: supabaseCollection !== null
    };
    testResults.connection = {
      overall: connectionTest.success ? '✅ Connected' : '❌ Failed',
      banking: connectionTest.banking ? '✅ Connected' : '❌ Failed',
      collection: connectionTest.collection ? '✅ Connected' : '❌ Failed'
    };
    
    if (!connectionTest.success) {
      setError(connectionTest.error);
      setStatus('error');
      setResults(testResults);
      setLoading(false);
      return;
    }

    // Test banking schema tables
    const bankingTablesToTest = [
      { name: 'Customers', table: TABLES.CUSTOMERS },
      { name: 'Accounts', table: TABLES.ACCOUNTS },
      { name: 'Transactions', table: TABLES.TRANSACTIONS },
      { name: 'Branches', table: TABLES.BRANCHES },
      { name: 'Loan Accounts', table: TABLES.LOAN_ACCOUNTS },
      { name: 'Collection Cases', table: TABLES.COLLECTION_CASES },
      { name: 'Collection Buckets', table: TABLES.COLLECTION_BUCKETS }
    ];

    for (const { name, table } of bankingTablesToTest) {
      try {
        const { count, error } = await supabaseBanking
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          testResults.bankingTables[name] = `❌ Error: ${error.message}`;
        } else {
          testResults.bankingTables[name] = `✅ OK (${count || 0} records)`;
        }
      } catch (err) {
        testResults.bankingTables[name] = `❌ Error: ${err.message}`;
      }
    }

    // Test collection schema tables
    const collectionTablesToTest = [
      { name: 'Collection Officers', table: TABLES.COLLECTION_OFFICERS },
      { name: 'Collection Teams', table: TABLES.COLLECTION_TEAMS },
      { name: 'Collection Interactions', table: TABLES.COLLECTION_INTERACTIONS },
      { name: 'Promise to Pay', table: TABLES.PROMISE_TO_PAY },
      { name: 'Field Visits', table: TABLES.FIELD_VISITS },
      { name: 'Legal Cases', table: TABLES.LEGAL_CASES },
      { name: 'Daily Summary', table: TABLES.DAILY_COLLECTION_SUMMARY }
    ];

    for (const { name, table } of collectionTablesToTest) {
      try {
        const { count, error } = await supabaseCollection
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          testResults.collectionTables[name] = `❌ Error: ${error.message}`;
        } else {
          testResults.collectionTables[name] = `✅ OK (${count || 0} records)`;
        }
      } catch (err) {
        testResults.collectionTables[name] = `❌ Error: ${err.message}`;
      }
    }

    // Determine overall status
    const allBankingPassed = Object.values(testResults.bankingTables).every(result => result.includes('✅'));
    const allCollectionPassed = Object.values(testResults.collectionTables).every(result => result.includes('✅'));
    
    if (allBankingPassed && allCollectionPassed) {
      setStatus('success');
    } else if (allBankingPassed || allCollectionPassed) {
      setStatus('warning');
    } else {
      setStatus('error');
    }
    
    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <DatabaseIcon className="h-8 w-8 text-gray-500 animate-pulse" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">All Systems Operational</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Partial Connection</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Connection Failed</Badge>;
      default:
        return <Badge>Checking...</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <CardTitle>Database Connection Test</CardTitle>
                <CardDescription>
                  Verify your Supabase connection and schema access
                </CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connection Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Environment Variables */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Environment Configuration</h3>
              <div className="space-y-1">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">VITE_SUPABASE_URL</span>
                  <span className="text-sm font-mono">{results.environment?.url}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">VITE_SUPABASE_ANON_KEY</span>
                  <span className="text-sm font-mono">{results.environment?.key}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Banking Client</span>
                  <span className="text-sm font-mono">{results.environment?.bankingClient}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Collection Client</span>
                  <span className="text-sm font-mono">{results.environment?.collectionClient}</span>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            {results.connection && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Schema Connection Status</h3>
                <div className="space-y-1">
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Overall Connection</span>
                    <span className="text-sm font-mono">{results.connection.overall}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Banking Schema (kastle_banking)</span>
                    <span className="text-sm font-mono">{results.connection.banking}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Collection Schema (kastle_collection)</span>
                    <span className="text-sm font-mono">{results.connection.collection}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Schema Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Banking Schema Tables */}
              {Object.keys(results.bankingTables || {}).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Banking Schema Tables</h3>
                  <div className="space-y-1 bg-gray-50 p-3 rounded-md">
                    {Object.entries(results.bankingTables).map(([table, result]) => (
                      <div key={table} className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">{table}</span>
                        <span className="text-sm font-mono">{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Schema Tables */}
              {Object.keys(results.collectionTables || {}).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Collection Schema Tables</h3>
                  <div className="space-y-1 bg-gray-50 p-3 rounded-md">
                    {Object.entries(results.collectionTables).map(([table, result]) => (
                      <div key={table} className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">{table}</span>
                        <span className="text-sm font-mono">{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Connection Details */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Connection Details</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600 mb-1">Supabase URL:</p>
                <code className="text-xs break-all">
                  {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
                </code>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={checkDatabase} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Retest Connection
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              >
                Open Supabase Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold">Schema Configuration:</h4>
              <p className="text-gray-600 ml-4">
                Your database uses two schemas:
                <br />• <code className="bg-gray-100 px-1">kastle_banking</code> - Banking and core tables
                <br />• <code className="bg-gray-100 px-1">kastle_collection</code> - Collection management tables
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold">If connection fails:</h4>
              <ol className="list-decimal list-inside ml-4 text-gray-600">
                <li>Verify your Supabase project is active</li>
                <li>Check that the anon key hasn't been regenerated</li>
                <li>Ensure RLS (Row Level Security) is properly configured or disabled</li>
                <li>Verify schema permissions are granted to the anon role</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold">Grant schema access (run in SQL editor):</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`-- Grant access to schemas
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;

-- Grant access to all tables in schemas
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;

-- Grant access to sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated;`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DatabaseTest;