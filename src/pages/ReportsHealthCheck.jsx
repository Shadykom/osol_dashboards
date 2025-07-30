import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Database,
  FileText,
  AlertTriangle
} from 'lucide-react';
import comprehensiveReportService from '@/services/comprehensiveReportService';
import { CollectionService } from '@/services/collectionService';
import reportService from '@/services/reportService';
import specialistReportService from '@/services/specialistReportService';
import { supabaseBanking, supabaseCollection, TABLES } from '@/lib/supabase';

const ReportsHealthCheck = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState('pending');

  const reportTests = [
    {
      id: 'database_connection',
      name: 'Database Connection',
      description: 'Check if Supabase is properly configured',
      test: async () => {
        try {
          const { data, error } = await supabaseBanking
            .from(TABLES.CUSTOMERS)
            .select('customer_id')
            .limit(1);
          
          if (error) throw error;
          return { success: true, message: 'Database connected successfully' };
        } catch (error) {
          return { success: false, message: `Database connection failed: ${error.message}` };
        }
      }
    },
    {
      id: 'collection_tables',
      name: 'Collection Tables',
      description: 'Check if collection tables exist',
      test: async () => {
        try {
          const tables = ['collection_cases', 'daily_collection_summary', 'collection_officers', 'collection_buckets'];
          const results = [];
          
          for (const table of tables) {
            const { error } = await supabaseCollection
              .from(table)
              .select('*')
              .limit(1);
            
            if (error) {
              results.push(`❌ ${table}: ${error.message}`);
            } else {
              results.push(`✅ ${table}: OK`);
            }
          }
          
          const hasErrors = results.some(r => r.includes('❌'));
          return { 
            success: !hasErrors, 
            message: results.join('\n'),
            details: results
          };
        } catch (error) {
          return { success: false, message: `Table check failed: ${error.message}` };
        }
      }
    },
    {
      id: 'financial_reports',
      name: 'Financial Reports',
      description: 'Test financial report generation',
      test: async () => {
        try {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          
          const result = await comprehensiveReportService.getFinancialReportData(
            'income_statement',
            { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
          );
          
          if (!result) throw new Error('No data returned');
          return { success: true, message: 'Financial reports working correctly' };
        } catch (error) {
          return { success: false, message: `Financial reports error: ${error.message}` };
        }
      }
    },
    {
      id: 'collection_reports',
      name: 'Collection Reports',
      description: 'Test collection report generation',
      test: async () => {
        try {
          const result = await CollectionService.generateCollectionReport('summary');
          
          if (!result.success) throw new Error(result.error?.message || 'Unknown error');
          return { success: true, message: 'Collection reports working correctly' };
        } catch (error) {
          return { success: false, message: `Collection reports error: ${error.message}` };
        }
      }
    },
    {
      id: 'collection_analytics',
      name: 'Collection Analytics',
      description: 'Test collection analytics data',
      test: async () => {
        try {
          const result = await CollectionService.getCollectionAnalytics('monthly');
          
          if (!result.success) throw new Error(result.error?.message || 'Unknown error');
          return { success: true, message: 'Collection analytics working correctly' };
        } catch (error) {
          return { success: false, message: `Collection analytics error: ${error.message}` };
        }
      }
    },
    {
      id: 'officer_performance',
      name: 'Officer Performance',
      description: 'Test officer performance reports',
      test: async () => {
        try {
          const result = await CollectionService.getOfficersPerformance('monthly');
          
          if (!result.success) throw new Error(result.error?.message || 'Unknown error');
          return { success: true, message: 'Officer performance reports working correctly' };
        } catch (error) {
          return { success: false, message: `Officer performance error: ${error.message}` };
        }
      }
    },
    {
      id: 'specialist_reports',
      name: 'Specialist Reports',
      description: 'Test specialist report service',
      test: async () => {
        try {
          // Test with a dummy specialist ID
          const result = await specialistReportService.getSpecialistReport(1, {});
          
          if (!result.success) throw new Error(result.error?.message || 'Unknown error');
          return { success: true, message: 'Specialist reports working correctly' };
        } catch (error) {
          return { success: false, message: `Specialist reports error: ${error.message}` };
        }
      }
    },
    {
      id: 'report_schedules',
      name: 'Report Schedules',
      description: 'Check if report_schedules table exists',
      test: async () => {
        try {
          const { error } = await supabaseBanking
            .from('report_schedules')
            .select('*')
            .limit(1);
          
          if (error) throw error;
          return { success: true, message: 'Report schedules table exists' };
        } catch (error) {
          return { success: false, message: `Report schedules error: ${error.message}` };
        }
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults({});
    const results = {};
    let allSuccess = true;

    for (const test of reportTests) {
      results[test.id] = { status: 'running' };
      setTestResults({ ...results });

      try {
        const result = await test.test();
        results[test.id] = {
          status: result.success ? 'success' : 'error',
          message: result.message,
          details: result.details
        };
        if (!result.success) allSuccess = false;
      } catch (error) {
        results[test.id] = {
          status: 'error',
          message: error.message
        };
        allSuccess = false;
      }

      setTestResults({ ...results });
    }

    setOverallStatus(allSuccess ? 'success' : 'error');
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports Health Check</h1>
          <p className="text-gray-600 mt-1">Verify all report functionalities and database connections</p>
        </div>
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      {overallStatus !== 'pending' && (
        <Alert className={overallStatus === 'success' ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription className="flex items-center gap-2">
            {overallStatus === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                All reports are functioning correctly!
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                Some reports have issues. Please check the details below.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {reportTests.map((test) => {
          const result = testResults[test.id] || { status: 'pending' };
          
          return (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <p className="text-sm text-gray-600">{test.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              </CardHeader>
              {result.message && (
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {result.message}
                  </pre>
                  {result.details && (
                    <div className="mt-2 space-y-1">
                      {result.details.map((detail, idx) => (
                        <div key={idx} className="text-sm">
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {overallStatus === 'error' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Fix Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700 mb-3">
              To fix the database issues, run the following command in your terminal:
            </p>
            <pre className="bg-white p-3 rounded border border-orange-200 text-sm">
              ./run_reports_fix_unified.sh
            </pre>
            <p className="text-sm text-orange-700 mt-3">
              This will create all missing tables and fix schema issues.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsHealthCheck;