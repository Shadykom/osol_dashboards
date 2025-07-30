import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { supabase, supabaseBanking, checkSchemaAccess } from '@/lib/supabase';

const DatabaseDiagnostic = () => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({
    envVars: { status: 'pending', message: '' },
    connection: { status: 'pending', message: '' },
    schemaAccess: { status: 'pending', message: '' },
    tables: { status: 'pending', message: '', data: [] }
  });

  const runDiagnostics = async () => {
    setLoading(true);
    const newResults = { ...results };

    // 1. Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')) {
      newResults.envVars = {
        status: 'success',
        message: 'Environment variables are properly configured',
        data: {
          url: supabaseUrl,
          keyPreview: `${supabaseKey.substring(0, 20)}...${supabaseKey.slice(-10)}`
        }
      };
    } else {
      newResults.envVars = {
        status: 'error',
        message: 'Environment variables are missing or invalid'
      };
    }

    // 2. Test basic connection
    try {
      const { data, error } = await supabase.from('auth.users').select('count').limit(1);
      if (error && error.message.includes('auth.users')) {
        // This is expected if auth schema is not exposed
        newResults.connection = {
          status: 'warning',
          message: 'Basic connection works but auth schema not exposed (this is okay)'
        };
      } else if (error) {
        newResults.connection = {
          status: 'error',
          message: `Connection failed: ${error.message}`
        };
      } else {
        newResults.connection = {
          status: 'success',
          message: 'Successfully connected to Supabase'
        };
      }
    } catch (err) {
      newResults.connection = {
        status: 'error',
        message: `Connection error: ${err.message}`
      };
    }

    // 3. Check kastle_banking schema access
    try {
      const schemaAccessible = await checkSchemaAccess();
      if (schemaAccessible) {
        newResults.schemaAccess = {
          status: 'success',
          message: 'kastle_banking schema is properly exposed'
        };
      } else {
        newResults.schemaAccess = {
          status: 'error',
          message: 'kastle_banking schema is NOT exposed in API settings'
        };
      }
    } catch (err) {
      newResults.schemaAccess = {
        status: 'error',
        message: `Schema check error: ${err.message}`
      };
    }

    // 4. Test specific tables
    const tablesToTest = [
      { name: 'customers', schema: 'kastle_banking' },
      { name: 'collection_officers', schema: 'kastle_banking' },
      { name: 'collection_cases', schema: 'kastle_banking' }
    ];

    const tableResults = [];
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabaseBanking
          .from(table.name)
          .select('*')
          .limit(1);
        
        tableResults.push({
          table: table.name,
          schema: table.schema,
          status: error ? 'error' : 'success',
          message: error ? error.message : 'Table accessible',
          hasData: data && data.length > 0
        });
      } catch (err) {
        tableResults.push({
          table: table.name,
          schema: table.schema,
          status: 'error',
          message: err.message
        });
      }
    }

    newResults.tables = {
      status: tableResults.every(t => t.status === 'success') ? 'success' : 
              tableResults.some(t => t.status === 'success') ? 'warning' : 'error',
      message: `${tableResults.filter(t => t.status === 'success').length}/${tableResults.length} tables accessible`,
      data: tableResults
    };

    setResults(newResults);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      pending: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Connection Diagnostic</h1>
          <p className="text-muted-foreground mt-2">
            Verify your Supabase connection and schema configuration
          </p>
        </div>
        <Button onClick={runDiagnostics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Re-run Diagnostics
        </Button>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(results).map(([key, result]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {getStatusIcon(result.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Results */}
      <div className="space-y-4">
        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Environment Variables
              {getStatusBadge(results.envVars.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{results.envVars.message}</p>
            {results.envVars.data && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-mono">VITE_SUPABASE_URL</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    {results.envVars.data.url}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-mono">VITE_SUPABASE_ANON_KEY</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    {results.envVars.data.keyPreview}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schema Access */}
        <Card className={results.schemaAccess.status === 'error' ? 'border-red-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Schema Access
              {getStatusBadge(results.schemaAccess.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{results.schemaAccess.message}</p>
            
            {results.schemaAccess.status === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-4">
                    <p className="font-semibold">To fix this issue, follow these steps:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>
                        Go to your Supabase Dashboard:
                        <Button
                          variant="link"
                          className="ml-2 p-0 h-auto"
                          onClick={() => window.open('https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api', '_blank')}
                        >
                          Open Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </li>
                      <li>Navigate to Settings → API</li>
                      <li>Find the "Exposed schemas" section</li>
                      <li>
                        Add <code className="bg-gray-100 px-1 py-0.5 rounded">kastle_banking</code> to the list
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard('kastle_banking')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </li>
                      <li>Click Save</li>
                      <li>Wait a few seconds and re-run diagnostics</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Table Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Table Access
              {getStatusBadge(results.tables.status)}
            </CardTitle>
            <CardDescription>{results.tables.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.tables.data?.map((table, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(table.status)}
                    <span className="font-mono text-sm">{table.schema}.{table.table}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {table.hasData && (
                      <Badge variant="outline" className="text-xs">Has Data</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">{table.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Connection String Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Connection String (Reference Only)</CardTitle>
            <CardDescription>
              This is for direct database access tools, not needed for the web application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-muted rounded font-mono text-sm">
              <span className="text-muted-foreground">
                postgresql://postgres:[PASSWORD]@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseDiagnostic;