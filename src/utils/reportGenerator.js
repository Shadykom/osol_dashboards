// Report generation utilities
//
// This module exposes helper functions for exporting dashboard data to PDF,
// Excel and CSV formats.  It uses jsPDF and xlsx for PDF/Excel exports
// respectively, mirroring the implementation described in the provided
// documentation.  Note that these functions depend on browser APIs for
// creating download links and are meant to run in a client‑side context.

import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

class ReportGenerator {
  constructor() {
    this.doc = null;
    this.currentY = 20;
  }

  // Helper to format currency
  formatCurrency(value) {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  // Helper to format percentage
  formatPercentage(value) {
    return `${(value || 0).toFixed(2)}%`;
  }

  // Helper to format number
  formatNumber(value) {
    return new Intl.NumberFormat('en-SA').format(value || 0);
  }

  // Add header to PDF
  addHeader(doc, title, subtitle) {
    // Add logo placeholder
    doc.setFillColor(0, 123, 255);
    doc.rect(20, 10, 30, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('LOGO', 35, 17, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 60, 17);
    
    // Add subtitle
    if (subtitle) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, 60, 25);
    }
    
    // Add generation date
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, doc.internal.pageSize.width - 20, 17, { align: 'right' });
    
    // Add separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 30, doc.internal.pageSize.width - 20, 30);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    return 40; // Return Y position after header
  }

  // Add footer to PDF
  addFooter(doc, pageNumber) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${pageNumber}`, doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
  }

  // Generate Income Statement PDF
  generateIncomeStatementPDF(data, reportName) {
    const doc = new jsPDF();
    let currentY = this.addHeader(doc, reportName, 'Income Statement');
    
    if (!data || typeof data !== 'object') {
      doc.setFontSize(12);
      doc.text('No data available for this report', 20, currentY);
      return doc;
    }

    // Revenue Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Revenue', 20, currentY);
    currentY += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const revenueItems = [
      ['Interest Income', this.formatCurrency(data.revenue?.interestIncome)],
      ['Fee Income', this.formatCurrency(data.revenue?.feeIncome)],
      ['Commission Income', this.formatCurrency(data.revenue?.commissionIncome)],
      ['Other Income', this.formatCurrency(data.revenue?.otherIncome)],
      ['Total Revenue', this.formatCurrency(data.revenue?.totalRevenue)]
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Amount (SAR)']],
      body: revenueItems,
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = doc.previousAutoTable.finalY + 10;
    
    // Expenses Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Operating Expenses', 20, currentY);
    currentY += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const expenseItems = [
      ['Personnel Expenses', this.formatCurrency(data.expenses?.personnelExpenses)],
      ['Administrative Expenses', this.formatCurrency(data.expenses?.administrativeExpenses)],
      ['Technology Expenses', this.formatCurrency(data.expenses?.technologyExpenses)],
      ['Marketing Expenses', this.formatCurrency(data.expenses?.marketingExpenses)],
      ['Other Operating Expenses', this.formatCurrency(data.expenses?.otherExpenses)],
      ['Total Operating Expenses', this.formatCurrency(data.expenses?.totalExpenses)]
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Amount (SAR)']],
      body: expenseItems,
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = doc.previousAutoTable.finalY + 10;
    
    // Summary Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 20, currentY);
    currentY += 10;
    
    const summaryItems = [
      ['Operating Income', this.formatCurrency(data.summary?.operatingIncome)],
      ['Net Income Before Tax', this.formatCurrency(data.summary?.netIncomeBeforeTax)],
      ['Tax Expense', this.formatCurrency(data.summary?.taxExpense)],
      ['Net Income', this.formatCurrency(data.summary?.netIncome)]
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Amount (SAR)']],
      body: summaryItems,
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 20, right: 20 }
    });
    
    // Add metrics if available
    if (data.metrics) {
      currentY = doc.previousAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Key Metrics', 20, currentY);
      currentY += 10;
      
      const metricsItems = [
        ['Operating Margin', this.formatPercentage(data.metrics.operatingMargin)],
        ['Net Margin', this.formatPercentage(data.metrics.netMargin)],
        ['Revenue Growth', this.formatPercentage(data.metrics.revenueGrowth)],
        ['Expense Ratio', this.formatPercentage(data.metrics.expenseRatio)]
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [['Metric', 'Value']],
        body: metricsItems,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 20, right: 20 }
      });
    }
    
    this.addFooter(doc, 1);
    return doc;
  }

  // Generate Balance Sheet PDF
  generateBalanceSheetPDF(data, reportName) {
    const doc = new jsPDF();
    let currentY = this.addHeader(doc, reportName, 'Balance Sheet');
    
    if (!data || typeof data !== 'object') {
      doc.setFontSize(12);
      doc.text('No data available for this report', 20, currentY);
      return doc;
    }

    // Assets Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Assets', 20, currentY);
    currentY += 10;
    
    const assetItems = [
      ['Cash and Cash Equivalents', this.formatCurrency(data.assets?.cash)],
      ['Loans and Advances', this.formatCurrency(data.assets?.loans)],
      ['Investments', this.formatCurrency(data.assets?.investments)],
      ['Fixed Assets', this.formatCurrency(data.assets?.fixedAssets)],
      ['Other Assets', this.formatCurrency(data.assets?.otherAssets)],
      ['Total Assets', this.formatCurrency(data.assets?.totalAssets)]
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Amount (SAR)']],
      body: assetItems,
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = doc.previousAutoTable.finalY + 10;
    
    // Liabilities Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Liabilities', 20, currentY);
    currentY += 10;
    
    const liabilityItems = [
      ['Customer Deposits', this.formatCurrency(data.liabilities?.deposits)],
      ['Borrowings', this.formatCurrency(data.liabilities?.borrowings)],
      ['Other Liabilities', this.formatCurrency(data.liabilities?.otherLiabilities)],
      ['Total Liabilities', this.formatCurrency(data.liabilities?.totalLiabilities)]
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Amount (SAR)']],
      body: liabilityItems,
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = doc.previousAutoTable.finalY + 10;
    
    // Equity Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Equity', 20, currentY);
    currentY += 10;
    
    const equityItems = [
      ['Paid-in Capital', this.formatCurrency(data.equity?.paidInCapital)],
      ['Retained Earnings', this.formatCurrency(data.equity?.retainedEarnings)],
      ['Other Equity', this.formatCurrency(data.equity?.otherEquity)],
      ['Total Equity', this.formatCurrency(data.equity?.totalEquity)]
    ];
    
    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Amount (SAR)']],
      body: equityItems,
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 20, right: 20 }
    });
    
    this.addFooter(doc, 1);
    return doc;
  }

  // Generate Customer Report PDF
  generateCustomerReportPDF(data, reportName) {
    const doc = new jsPDF();
    let currentY = this.addHeader(doc, reportName, 'Customer Analysis Report');
    
    if (!data || typeof data !== 'object') {
      doc.setFontSize(12);
      doc.text('No data available for this report', 20, currentY);
      return doc;
    }

    // Overview Section
    if (data.overview) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Overview', 20, currentY);
      currentY += 10;
      
      const overviewItems = Object.entries(data.overview).map(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const formattedValue = typeof value === 'number' ? this.formatNumber(value) : value;
        return [formattedKey, formattedValue];
      });
      
      autoTable(doc, {
        startY: currentY,
        body: overviewItems,
        theme: 'plain',
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        margin: { left: 20, right: 20 }
      });
      
      currentY = doc.previousAutoTable.finalY + 10;
    }

    // Breakdown by Segment
    if (data.bySegment && Array.isArray(data.bySegment)) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Customer Segments', 20, currentY);
      currentY += 10;
      
      const segmentData = data.bySegment.map(segment => [
        segment.segment,
        this.formatNumber(segment.count),
        this.formatPercentage(segment.percentage)
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Segment', 'Count', 'Percentage']],
        body: segmentData,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] },
        margin: { left: 20, right: 20 }
      });
      
      currentY = doc.previousAutoTable.finalY + 10;
    }

    // Recent Customers
    if (data.recentCustomers && Array.isArray(data.recentCustomers)) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Recent Customers', 20, currentY);
      currentY += 10;
      
      const customerData = data.recentCustomers.slice(0, 10).map(customer => [
        customer.name || 'N/A',
        customer.email || 'N/A',
        customer.phone || 'N/A',
        format(new Date(customer.createdAt), 'dd/MM/yyyy')
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Name', 'Email', 'Phone', 'Join Date']],
        body: customerData,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] },
        margin: { left: 20, right: 20 }
      });
    }
    
    this.addFooter(doc, 1);
    return doc;
  }

  // Generate Risk Report PDF
  generateRiskReportPDF(data, reportName) {
    const doc = new jsPDF();
    let currentY = this.addHeader(doc, reportName, 'Risk Analysis Report');
    
    if (!data || typeof data !== 'object') {
      doc.setFontSize(12);
      doc.text('No data available for this report', 20, currentY);
      return doc;
    }

    // Overview Section
    if (data.overview) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Risk Overview', 20, currentY);
      currentY += 10;
      
      const overviewItems = [
        ['Total At Risk', this.formatCurrency(data.overview.totalAtRisk)],
        ['NPL Ratio', this.formatPercentage(data.overview.nplRatio)],
        ['Provision Coverage', this.formatPercentage(data.overview.provisionCoverage)],
        ['Risk Weighted Assets', this.formatCurrency(data.overview.riskWeightedAssets)]
      ];
      
      autoTable(doc, {
        startY: currentY,
        body: overviewItems,
        theme: 'plain',
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        margin: { left: 20, right: 20 }
      });
      
      currentY = doc.previousAutoTable.finalY + 10;
    }

    // Risk by Category
    if (data.byCategory && Array.isArray(data.byCategory)) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Risk by Category', 20, currentY);
      currentY += 10;
      
      const categoryData = data.byCategory.map(cat => [
        cat.category,
        this.formatCurrency(cat.exposure),
        this.formatPercentage(cat.percentage),
        cat.rating
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Exposure', 'Percentage', 'Rating']],
        body: categoryData,
        theme: 'striped',
        headStyles: { fillColor: [220, 53, 69] },
        margin: { left: 20, right: 20 }
      });
    }
    
    this.addFooter(doc, 1);
    return doc;
  }

  // Generic PDF generator for array data
  generateGenericPDF(data, reportType, reportName) {
    const doc = new jsPDF();
    let currentY = this.addHeader(doc, reportName, reportType);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      doc.setFontSize(12);
      doc.text('No data available for this report', 20, currentY);
      return doc;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(key => {
      const value = item[key];
      if (typeof value === 'number') {
        return this.formatNumber(value);
      }
      return String(value || '');
    }));
    
    autoTable(doc, {
      startY: currentY,
      head: [headers.map(h => h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] },
      margin: { left: 20, right: 20 }
    });
    
    this.addFooter(doc, 1);
    return doc;
  }

  // Main PDF generation method
  async generatePDF(data, reportType, reportName) {
    try {
      // Handle different report types
      switch (reportType) {
        case 'income_statement':
        case 'profit_loss':
          return this.generateIncomeStatementPDF(data, reportName);
        
        case 'balance_sheet':
          return this.generateBalanceSheetPDF(data, reportName);
        
        case 'customer_acquisition':
        case 'customer_retention':
        case 'customer_satisfaction':
          return this.generateCustomerReportPDF(data, reportName);
        
        case 'credit_risk':
        case 'market_risk':
        case 'operational_risk':
        case 'npl_analysis':
          return this.generateRiskReportPDF(data, reportName);
        
        default:
          // For other reports, check if data is an array or object
          if (Array.isArray(data)) {
            return this.generateGenericPDF(data, reportType, reportName);
          } else {
            // Convert object to array format for generic handling
            const dataArray = this.convertObjectToArray(data);
            return this.generateGenericPDF(dataArray, reportType, reportName);
          }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      const doc = new jsPDF();
      doc.text('Error generating report: ' + error.message, 20, 20);
      return doc;
    }
  }

  // Convert nested object to array format
  convertObjectToArray(obj) {
    const result = [];
    
    // If object has specific structure, extract it
    if (obj.data && Array.isArray(obj.data)) {
      return obj.data;
    }
    
    // If object has overview and details
    if (obj.overview && obj.details && Array.isArray(obj.details)) {
      return obj.details;
    }
    
    // Convert nested objects to flat array
    const flattenObject = (obj, prefix = '') => {
      const flattened = {};
      
      // Add validation to ensure obj is an object with keys
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return flattened;
      }
      
      Object.keys(obj).forEach(key => {
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          Object.assign(flattened, flattenObject(obj[key], prefix + key + '_'));
        } else {
          flattened[prefix + key] = obj[key];
        }
      });
      
      return flattened;
    };
    
    // If it's a single object with nested data, flatten it
    result.push(flattenObject(obj));
    return result;
  }

  // Generate Excel file
  async generateExcel(data, reportType, reportName) {
    try {
      const wb = XLSX.utils.book_new();
      
      // Add validation for data
      if (!data) {
        const ws = XLSX.utils.json_to_sheet([{ message: 'No data available' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
        return wb;
      }
      
      if (Array.isArray(data)) {
        // Direct array data
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
      } else if (typeof data === 'object') {
        // Object with multiple sections
        const keys = Object.keys(data);
        
        // Ensure keys is an array before using forEach
        if (Array.isArray(keys) && keys.length > 0) {
          keys.forEach(key => {
            if (Array.isArray(data[key])) {
              const ws = XLSX.utils.json_to_sheet(data[key]);
              XLSX.utils.book_append_sheet(wb, ws, key);
            } else if (typeof data[key] === 'object' && data[key] !== null) {
              // Convert object to array format
              const dataArray = [data[key]];
              const ws = XLSX.utils.json_to_sheet(dataArray);
              XLSX.utils.book_append_sheet(wb, ws, key);
            }
          });
        } else {
          // If no valid keys, create a single sheet with the data
          const ws = XLSX.utils.json_to_sheet([data]);
          XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
        }
      }
      
      return wb;
    } catch (error) {
      console.error('Error generating Excel:', error);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([{ error: 'Failed to generate report: ' + error.message }]);
      XLSX.utils.book_append_sheet(wb, ws, 'Error');
      return wb;
    }
  }

  // Save PDF
  savePDF(doc, filename) {
    if (doc && doc.save) {
      doc.save(`${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
    }
  }

  // Save Excel
  saveExcel(wb, filename) {
    if (wb) {
      XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
    }
  }

  // Get PDF blob for email attachment
  getPDFBlob(doc) {
    if (doc && doc.output) {
      return doc.output('blob');
    }
    return null;
  }

  // Get Excel blob for email attachment
  getExcelBlob(wb) {
    if (wb) {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    return null;
  }

  // Print report
  printReport(doc) {
    if (!doc) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the report');
      return;
    }
    
    // Get PDF as data URL
    const pdfDataUri = doc.output('datauristring');
    
    // Create HTML for print window
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Report</title>
        <style>
          body { margin: 0; padding: 0; }
          iframe { border: none; width: 100%; height: 100vh; }
        </style>
      </head>
      <body>
        <iframe src="${pdfDataUri}" onload="window.print(); window.onafterprint = function() { window.close(); }"></iframe>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// Create singleton instance
const reportGenerator = new ReportGenerator();

// Export methods
export default {
  generatePDF: reportGenerator.generatePDF.bind(reportGenerator),
  generateExcel: reportGenerator.generateExcel.bind(reportGenerator),
  savePDF: reportGenerator.savePDF.bind(reportGenerator),
  saveExcel: reportGenerator.saveExcel.bind(reportGenerator),
  getPDFBlob: reportGenerator.getPDFBlob.bind(reportGenerator),
  getExcelBlob: reportGenerator.getExcelBlob.bind(reportGenerator),
  printReport: reportGenerator.printReport.bind(reportGenerator)
};

// Also export individual functions for backward compatibility
export const exportToPDF = reportGenerator.generatePDF.bind(reportGenerator);
export const exportToExcel = reportGenerator.generateExcel.bind(reportGenerator);
export const exportToCSV = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(key => JSON.stringify(row[key] || '')).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};