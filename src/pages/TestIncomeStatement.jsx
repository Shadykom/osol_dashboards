import React, { useState } from 'react';
import IncomeStatementReport from '@/components/reports/IncomeStatementReport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays } from 'date-fns';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import reportGenerator from '@/utils/reportGenerator';

const TestIncomeStatement = () => {
  // Sample data matching the values from the user's image
  const sampleReportData = {
    revenue: {
      interestIncome: 13373,
      feeIncome: 600,
      commissionIncome: 0,
      otherIncome: 279,
      totalRevenue: 13973
    },
    expenses: {
      personnelExpenses: 4891,
      administrativeExpenses: 3122,
      operatingExpenses: 2150,
      otherExpenses: 1200,
      totalExpenses: 11363
    },
    netIncome: 2610
  };

  const sampleDateRange = {
    from: subDays(new Date(), 30),
    to: new Date()
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const doc = reportGenerator.generateIncomeStatementPDF(sampleReportData, 'Income Statement Test');
      doc.save('OSOL_Income_Statement_Test.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Controls */}
      <div className="bg-white border-b shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Income Statement Report Test
              </h1>
              <p className="text-gray-600">
                Testing the enhanced OSOL-branded Income Statement report
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-[#E6B800] hover:bg-[#CC9900] text-white"
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isDownloading ? 'Generating...' : 'Download PDF'}
              </Button>
              <Button 
                variant="outline"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Data Info */}
      <div className="max-w-7xl mx-auto px-6 py-6 print:hidden">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Sample Data Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-[#E6B800] mb-2">Revenue Sources</h4>
                <ul className="space-y-1">
                  <li>Interest Income: SAR 13,373</li>
                  <li>Fee Income: SAR 600</li>
                  <li>Commission Income: SAR 0</li>
                  <li>Other Income: SAR 279</li>
                  <li className="font-semibold border-t pt-1">Total Revenue: SAR 13,973</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#E6B800] mb-2">Operating Expenses</h4>
                <ul className="space-y-1">
                  <li>Personnel Expenses: SAR 4,891</li>
                  <li>Administrative Expenses: SAR 3,122</li>
                  <li>Operating Expenses: SAR 2,150</li>
                  <li>Other Expenses: SAR 1,200</li>
                  <li className="font-semibold border-t pt-1">Total Expenses: SAR 11,363</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#E6B800] mb-2">Financial Summary</h4>
                <ul className="space-y-1">
                  <li className="font-semibold text-green-600">Net Income: SAR 2,610</li>
                  <li>Profit Margin: 18.67%</li>
                  <li>Report Period: {format(sampleDateRange.from, 'dd MMM yyyy')} - {format(sampleDateRange.to, 'dd MMM yyyy')}</li>
                  <li>Currency: Saudi Riyal (SAR)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Income Statement Report */}
      <IncomeStatementReport 
        reportData={sampleReportData}
        reportType="income_statement"
        dateRange={sampleDateRange}
      />
    </div>
  );
};

export default TestIncomeStatement;