import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { DatabaseIcon, RefreshCw, CheckCircle, AlertCircle, Info } from '@/utils/icons';
import { seedDashboardData, checkDataExists } from '@/utils/seedDashboardData';

export function DataSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState(null);
  const [dataStats, setDataStats] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkExistingData();
  }, []);

  const checkExistingData = async () => {
    const stats = await checkDataExists();
    setDataStats(stats);
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedingStatus(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await seedDashboardData();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setSeedingStatus({
          type: 'success',
          message: 'Data seeded successfully! All dashboard components should now display sample data.'
        });
        // Refresh data stats
        await checkExistingData();
      } else {
        setSeedingStatus({
          type: 'error',
          message: `Failed to seed data: ${result.error}`
        });
      }
    } catch (error) {
      setSeedingStatus({
        type: 'error',
        message: `Error seeding data: ${error.message}`
      });
    } finally {
      setIsSeeding(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const hasData = dataStats && (
    dataStats.customers > 0 || 
    dataStats.accounts > 0 || 
    dataStats.loans > 0 || 
    dataStats.transactions > 0
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5" />
          Dashboard Data Seeder
        </CardTitle>
        <CardDescription>
          Populate the database with sample data for all dashboard components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dataStats && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold">Current Database Status:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Customers: {dataStats.customers}</li>
                  <li>• Accounts: {dataStats.accounts}</li>
                  <li>• Loans: {dataStats.loans}</li>
                  <li>• Transactions: {dataStats.transactions}</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!hasData && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No data found in the database. Click the button below to seed sample data.
            </AlertDescription>
          </Alert>
        )}

        {isSeeding && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Seeding data...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {seedingStatus && (
          <Alert variant={seedingStatus.type === 'success' ? 'default' : 'destructive'}>
            {seedingStatus.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{seedingStatus.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="flex items-center gap-2"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <DatabaseIcon className="h-4 w-4" />
                {hasData ? 'Add More Sample Data' : 'Seed Sample Data'}
              </>
            )}
          </Button>
          
          {hasData && (
            <Button
              onClick={checkExistingData}
              variant="outline"
              disabled={isSeeding}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Stats
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p>This will populate the database with:</p>
          <ul className="mt-1 ml-4 space-y-1">
            <li>• 200+ Customers with realistic Saudi names</li>
            <li>• 300+ Bank accounts</li>
            <li>• 100+ Loan accounts with various statuses</li>
            <li>• 1000+ Transactions</li>
            <li>• Collection cases and delinquency data</li>
            <li>• All reference data (branches, products, etc.)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}