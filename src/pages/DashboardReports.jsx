// Dashboard reports page
//
// This component provides a UI for users to generate multi‑section reports
// across various time ranges.  It wires up report generation and export
// actions defined in the report generator utilities.  In this skeleton the
// underlying data fetching functions are placeholders – integrate them with
// your own services for real data.

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import {
  FileText,
  Download,
  Printer,
  Calendar as CalendarIcon,
  RefreshCw
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/reportGenerator.js';
import { useFilters } from '../contexts/FilterContext';

export const DashboardReports = () => {
  const { filters } = useFilters();
  const [reportType, setReportType] = useState('executive_summary');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'executive_summary', name: 'Executive Summary', sections: ['overview', 'kpis', 'trends'] },
    { id: 'operational_report', name: 'Operational Report', sections: ['transactions', 'accounts', 'performance'] },
    { id: 'financial_report', name: 'Financial Report', sections: ['revenue', 'loans', 'deposits'] },
    { id: 'risk_report', name: 'Risk & Compliance Report', sections: ['risk', 'compliance', 'incidents'] },
    { id: 'customer_report', name: 'Customer Analytics Report', sections: ['customers', 'segments', 'behavior'] },
    { id: 'custom_report', name: 'Custom Report', sections: [] }
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const report = reportTypes.find((r) => r.id === reportType);
      const data = {};
      // For each section call your service to fetch data
      for (const section of report.sections) {
        data[section] = await fetchSectionData(section, dateRange);
      }
      setReportData({
        type: report.name,
        dateRange,
        generatedAt: new Date().toISOString(),
        sections: data,
        filters // Include current filters in report
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionData = async (section, dateRange) => {
    // TODO: integrate with your services
    // This is a placeholder that returns mock data
    return {
      data: [],
      summary: {},
      metadata: {
        section,
        dateRange,
        generatedAt: new Date().toISOString()
      }
    };
  };

  const exportReport = async (format) => {
    if (!reportData) return;
    try {
      if (format === 'pdf') {
        await exportToPDF(reportData);
      } else if (format === 'excel') {
        await exportToExcel(reportData);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print Preview
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              {/* Placeholder calendar control */}
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to
                  ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                  : 'Select date range'}
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">&nbsp;</label>
              <Button className="w-full" onClick={generateReport} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" /> Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{reportData.type}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportReport('pdf')}>
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button variant="outline" onClick={() => exportReport('excel')}>
                  <Download className="mr-2 h-4 w-4" /> Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Placeholder for a report preview component */}
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground mb-2">
                Generated at: {new Date(reportData.generatedAt).toLocaleString()}
              </p>
              <pre className="overflow-auto">{JSON.stringify(reportData, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardReports;