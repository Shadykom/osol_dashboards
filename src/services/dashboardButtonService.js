// src/services/dashboardButtonService.js
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export class DashboardButtonService {
  /**
   * Export dashboard data in various formats
   */
  static async exportDashboard(data, format = 'excel', options = {}) {
    console.log('DashboardButtonService.exportDashboard called');
    console.log('Format:', format);
    console.log('Data:', data);
    console.log('Options:', options);
    
    // Check if required dependencies are available
    if (!saveAs || !XLSX || !jsPDF || !html2canvas) {
      const missingDeps = [];
      if (!saveAs) missingDeps.push('file-saver');
      if (!XLSX) missingDeps.push('xlsx');
      if (!jsPDF) missingDeps.push('jspdf');
      if (!html2canvas) missingDeps.push('html2canvas');
      throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
    }
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `executive-dashboard-${timestamp}`;

      switch (format.toLowerCase()) {
        case 'excel':
          return await this.exportToExcel(data, filename, options);
        case 'pdf':
          return await this.exportToPDF(data, filename, options);
        case 'csv':
          return await this.exportToCSV(data, filename, options);
        case 'json':
          return await this.exportToJSON(data, filename, options);
        case 'image':
          return await this.exportToImage(options.elementId, filename);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export dashboard: ${error.message}`);
    }
  }

  /**
   * Export to Excel format
   */
  static async exportToExcel(data, filename, options = {}) {
    try {
      console.log('Starting Excel export...');
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Executive Dashboard Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [''],
        ['Key Performance Indicators'],
        ['Metric', 'Current', 'Previous', 'Change'],
        ['Total Revenue', data.revenue?.current || 0, data.revenue?.previous || 0, data.revenue?.change || '0%'],
        ['Active Loans', data.loans?.active || 0, data.loans?.previousActive || 0, data.loans?.change || '0%'],
        ['Total Deposits', data.deposits?.total || 0, data.deposits?.previousTotal || 0, data.deposits?.change || '0%'],
        ['NPL Ratio', `${data.npl?.ratio || 0}%`, `${data.npl?.previousRatio || 0}%`, data.npl?.change || '0%'],
        [''],
        ['Risk Scores'],
        ['Risk Type', 'Score'],
        ['Credit Risk', `${data.riskScores?.credit || 0}%`],
        ['Market Risk', `${data.riskScores?.market || 0}%`],
        ['Operational Risk', `${data.riskScores?.operational || 0}%`],
        ['Compliance Risk', `${data.riskScores?.compliance || 0}%`]
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'Executive Summary');

      // Revenue trend sheet
      if (data.revenueTrend && data.revenueTrend.length > 0) {
        const revenueData = [
          ['Revenue Trend Analysis'],
          ['Month', 'Current Period', 'Previous Period'],
          ...data.revenueTrend.map(item => [item.month, item.current, item.previous])
        ];
        const revenueWS = XLSX.utils.aoa_to_sheet(revenueData);
        XLSX.utils.book_append_sheet(workbook, revenueWS, 'Revenue Trend');
      }

      // Portfolio distribution sheet
      if (data.portfolio && data.portfolio.length > 0) {
        const portfolioData = [
          ['Portfolio Distribution'],
          ['Product Category', 'Percentage', 'Amount', 'Count', 'Growth'],
          ...data.portfolio.map(item => [item.name, `${item.value}%`, item.amount, item.count, item.growth])
        ];
        const portfolioWS = XLSX.utils.aoa_to_sheet(portfolioData);
        XLSX.utils.book_append_sheet(workbook, portfolioWS, 'Portfolio');
      }

      // Recent transactions sheet
      if (data.recentTransactions && data.recentTransactions.length > 0) {
        const transactionData = [
          ['Recent Transactions'],
          ['Customer', 'Type', 'Amount', 'Status', 'Date', 'Description'],
          ...data.recentTransactions.map(tx => [
            tx.customer_name,
            tx.type,
            tx.amount,
            tx.status,
            new Date(tx.date).toLocaleDateString(),
            tx.description
          ])
        ];
        const transactionWS = XLSX.utils.aoa_to_sheet(transactionData);
        XLSX.utils.book_append_sheet(workbook, transactionWS, 'Transactions');
      }

      // Write file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${filename}.xlsx`);

      console.log('Excel export completed successfully.');
      return { success: true, message: 'Excel report exported successfully' };
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error(`Failed to export to Excel: ${error.message}`);
    }
  }

  /**
   * Export to PDF format
   */
  static async exportToPDF(data, filename, options = {}) {
    try {
      console.log('Starting PDF export...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('Executive Dashboard Report', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;

      // KPIs Section
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Key Performance Indicators', 20, yPosition);
      yPosition += 10;

      const kpiData = [
        ['Metric', 'Current', 'Previous', 'Change'],
        ['Revenue', this.formatCurrency(data.revenue?.current), this.formatCurrency(data.revenue?.previous), data.revenue?.change || '0%'],
        ['Active Loans', (data.loans?.active || 0).toLocaleString(), (data.loans?.previousActive || 0).toLocaleString(), data.loans?.change || '0%'],
        ['Deposits', this.formatCurrency(data.deposits?.total), this.formatCurrency(data.deposits?.previousTotal), data.deposits?.change || '0%'],
        ['NPL Ratio', `${data.npl?.ratio || 0}%`, `${data.npl?.previousRatio || 0}%`, data.npl?.change || '0%']
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [kpiData[0]],
        body: kpiData.slice(1),
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [67, 56, 202] }
      });

      yPosition = pdf.lastAutoTable.finalY + 15;

      // Risk Assessment Section
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Risk Assessment', 20, yPosition);
      yPosition += 10;

      const riskData = [
        ['Risk Type', 'Score', 'Status'],
        ['Credit Risk', `${data.riskScores?.credit || 0}%`, this.getRiskStatus(data.riskScores?.credit)],
        ['Market Risk', `${data.riskScores?.market || 0}%`, this.getRiskStatus(data.riskScores?.market)],
        ['Operational Risk', `${data.riskScores?.operational || 0}%`, this.getRiskStatus(data.riskScores?.operational)],
        ['Compliance Risk', `${data.riskScores?.compliance || 0}%`, this.getRiskStatus(data.riskScores?.compliance)]
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [riskData[0]],
        body: riskData.slice(1),
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [239, 68, 68] }
      });

      // Portfolio Section
      if (data.portfolio && data.portfolio.length > 0) {
        yPosition = pdf.lastAutoTable.finalY + 15;
        
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('Portfolio Distribution', 20, yPosition);
        yPosition += 10;

        const portfolioTableData = [
          ['Product Category', 'Percentage', 'Amount', 'Growth'],
          ...data.portfolio.map(item => [
            item.name,
            `${item.value}%`,
            this.formatCurrency(item.amount),
            item.growth
          ])
        ];

        autoTable(pdf, {
          startY: yPosition,
          head: [portfolioTableData[0]],
          body: portfolioTableData.slice(1),
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [16, 185, 129] }
        });
      }

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
        pdf.text('Confidential - Executive Dashboard Report', 20, pageHeight - 10);
      }

      pdf.save(`${filename}.pdf`);
      console.log('PDF export completed successfully.');
      return { success: true, message: 'PDF report exported successfully' };
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error(`Failed to export to PDF: ${error.message}`);
    }
  }

  /**
   * Export to CSV format
   */
  static async exportToCSV(data, filename, options = {}) {
    try {
      console.log('Starting CSV export...');
      const csvContent = [];
      
      // Header
      csvContent.push('Executive Dashboard Report');
      csvContent.push(`Generated on: ${new Date().toLocaleDateString()}`);
      csvContent.push('');

      // KPIs
      csvContent.push('Key Performance Indicators');
      csvContent.push('Metric,Current,Previous,Change');
      csvContent.push(`Revenue,${data.revenue?.current || 0},${data.revenue?.previous || 0},${data.revenue?.change || '0%'}`);
      csvContent.push(`Active Loans,${data.loans?.active || 0},${data.loans?.previousActive || 0},${data.loans?.change || '0%'}`);
      csvContent.push(`Deposits,${data.deposits?.total || 0},${data.deposits?.previousTotal || 0},${data.deposits?.change || '0%'}`);
      csvContent.push(`NPL Ratio,${data.npl?.ratio || 0}%,${data.npl?.previousRatio || 0}%,${data.npl?.change || '0%'}`);
      csvContent.push('');

      // Risk Scores
      csvContent.push('Risk Assessment');
      csvContent.push('Risk Type,Score');
      csvContent.push(`Credit Risk,${data.riskScores?.credit || 0}%`);
      csvContent.push(`Market Risk,${data.riskScores?.market || 0}%`);
      csvContent.push(`Operational Risk,${data.riskScores?.operational || 0}%`);
      csvContent.push(`Compliance Risk,${data.riskScores?.compliance || 0}%`);

      const csvString = csvContent.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
      console.log('CSV export completed successfully.');
      return { success: true, message: 'CSV report exported successfully' };
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  /**
   * Export to JSON format
   */
  static async exportToJSON(data, filename, options = {}) {
    try {
      console.log('Starting JSON export...');
      const exportData = {
        metadata: {
          title: 'Executive Dashboard Report',
          generatedOn: new Date().toISOString(),
          version: '1.0'
        },
        data: data
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);
      console.log('JSON export completed successfully.');
      return { success: true, message: 'JSON data exported successfully' };
    } catch (error) {
      console.error('JSON export error:', error);
      throw new Error(`Failed to export to JSON: ${error.message}`);
    }
  }

  /**
   * Export dashboard as image
   */
  static async exportToImage(elementId, filename) {
    try {
      console.log('Starting image export...');
      const element = document.getElementById(elementId) || document.querySelector('.dashboard-container');
      
      if (!element) {
        throw new Error('Dashboard element not found');
      }

      const canvas = await html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });

      canvas.toBlob((blob) => {
        saveAs(blob, `${filename}.png`);
      });
      console.log('Image export completed successfully.');
      return { success: true, message: 'Dashboard image exported successfully' };
    } catch (error) {
      console.error('Image export error:', error);
      throw new Error('Failed to export dashboard as image');
    }
  }

  /**
   * Share dashboard functionality
   */
  static async shareDashboard(data, method = 'link', options = {}) {
    try {
      switch (method.toLowerCase()) {
        case 'link':
          return await this.shareViaLink(data, options);
        case 'email':
          return await this.shareViaEmail(data, options);
        case 'copy':
          return await this.copyToClipboard(data, options);
        default:
          throw new Error(`Unsupported share method: ${method}`);
      }
    } catch (error) {
      console.error('Share error:', error);
      throw new Error(`Failed to share dashboard: ${error.message}`);
    }
  }

  /**
   * Share via link
   */
  static async shareViaLink(data, options = {}) {
    try {
      console.log('Starting link sharing...');
      const shareableLink = window.location.href;
      
      if (navigator.share) {
        // Use native sharing if available
        await navigator.share({
          title: 'Executive Dashboard',
          text: 'Check out this executive dashboard report',
          url: shareableLink
        });
        console.log('Dashboard shared successfully via native share.');
        return { success: true, message: 'Dashboard shared successfully' };
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(shareableLink);
        console.log('Dashboard link copied to clipboard via fallback.');
        return { success: true, message: 'Dashboard link copied to clipboard' };
      }
    } catch (error) {
      console.error('Link sharing error:', error);
      throw new Error(`Failed to share dashboard via link: ${error.message}`);
    }
  }

  /**
   * Share via email
   */
  static async shareViaEmail(data, options = {}) {
    try {
      console.log('Starting email sharing...');
      const subject = encodeURIComponent('Executive Dashboard Report');
      const body = encodeURIComponent(`
Please find the executive dashboard report with the following key metrics:

Revenue: ${this.formatCurrency(data.revenue?.current)} (${data.revenue?.change || '0%'} change)
Active Loans: ${(data.loans?.active || 0).toLocaleString()} (${data.loans?.change || '0%'} change)
Total Deposits: ${this.formatCurrency(data.deposits?.total)} (${data.deposits?.change || '0%'} change)
NPL Ratio: ${data.npl?.ratio || 0}% (${data.npl?.change || '0%'} change)

Access the full dashboard at: ${window.location.href}

Generated on: ${new Date().toLocaleDateString()}
    `);

    const mailtoLink = `mailto:${options.recipient || ''}?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
    console.log('Email client opened with dashboard data.');
    return { success: true, message: 'Email client opened with dashboard data' };
    } catch (error) {
      console.error('Email sharing error:', error);
      throw new Error(`Failed to share dashboard via email: ${error.message}`);
    }
  }

  /**
   * Copy data to clipboard
   */
  static async copyToClipboard(data, options = {}) {
    try {
      console.log('Starting clipboard copy...');
      const summary = `Executive Dashboard Summary
Generated: ${new Date().toLocaleDateString()}

Key Metrics:
• Revenue: ${this.formatCurrency(data.revenue?.current)} (${data.revenue?.change || '0%'})
• Active Loans: ${(data.loans?.active || 0).toLocaleString()} (${data.loans?.change || '0%'})
• Deposits: ${this.formatCurrency(data.deposits?.total)} (${data.deposits?.change || '0%'})
• NPL Ratio: ${data.npl?.ratio || 0}% (${data.npl?.change || '0%'})

Risk Scores:
• Credit: ${data.riskScores?.credit || 0}%
• Market: ${data.riskScores?.market || 0}%
• Operational: ${data.riskScores?.operational || 0}%
• Compliance: ${data.riskScores?.compliance || 0}%`;

    await navigator.clipboard.writeText(summary);
    console.log('Dashboard summary copied to clipboard.');
    return { success: true, message: 'Dashboard summary copied to clipboard' };
    } catch (error) {
      console.error('Clipboard copy error:', error);
      throw new Error(`Failed to copy dashboard summary to clipboard: ${error.message}`);
    }
  }

  /**
   * Dashboard customization settings
   */
  static getCustomizationOptions() {
    return {
      themes: [
        { id: 'default', name: 'Default', description: 'Standard blue theme' },
        { id: 'dark', name: 'Dark Mode', description: 'Dark theme for low light' },
        { id: 'corporate', name: 'Corporate', description: 'Professional gray theme' },
        { id: 'banking', name: 'Banking', description: 'Financial industry theme' }
      ],
      layouts: [
        { id: 'default', name: 'Default Layout', description: 'Standard 4-column grid' },
        { id: 'compact', name: 'Compact', description: 'Dense information display' },
        { id: 'executive', name: 'Executive', description: 'High-level overview focus' },
        { id: 'detailed', name: 'Detailed', description: 'Comprehensive metrics view' }
      ],
      widgets: [
        { id: 'revenue-kpi', name: 'Revenue KPI', enabled: true, order: 1 },
        { id: 'loans-kpi', name: 'Loans KPI', enabled: true, order: 2 },
        { id: 'deposits-kpi', name: 'Deposits KPI', enabled: true, order: 3 },
        { id: 'npl-kpi', name: 'NPL Ratio KPI', enabled: true, order: 4 },
        { id: 'revenue-chart', name: 'Revenue Trend Chart', enabled: true, order: 5 },
        { id: 'portfolio-chart', name: 'Portfolio Distribution', enabled: true, order: 6 },
        { id: 'risk-scores', name: 'Risk Assessment', enabled: true, order: 7 },
        { id: 'recent-transactions', name: 'Recent Transactions', enabled: true, order: 8 }
      ],
      refreshIntervals: [
        { id: 'manual', name: 'Manual Only', value: 0 },
        { id: '30s', name: '30 seconds', value: 30000 },
        { id: '1m', name: '1 minute', value: 60000 },
        { id: '5m', name: '5 minutes', value: 300000 },
        { id: '15m', name: '15 minutes', value: 900000 },
        { id: '30m', name: '30 minutes', value: 1800000 }
      ]
    };
  }

  /**
   * Save customization settings
   */
  static saveCustomizationSettings(settings) {
    try {
      localStorage.setItem('osol-dashboard-settings', JSON.stringify(settings));
      console.log('Dashboard settings saved successfully.');
      return { success: true, message: 'Dashboard settings saved successfully' };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return { success: false, message: 'Failed to save dashboard settings' };
    }
  }

  /**
   * Load customization settings
   */
  static loadCustomizationSettings() {
    try {
      const settings = localStorage.getItem('osol-dashboard-settings');
      console.log('Dashboard settings loaded.');
      return settings ? JSON.parse(settings) : this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  static getDefaultSettings() {
    return {
      theme: 'default',
      layout: 'default',
      refreshInterval: 300000, // 5 minutes
      widgets: this.getCustomizationOptions().widgets,
      dateFormat: 'MM/DD/YYYY',
      currency: 'SAR',
      timezone: 'Asia/Riyadh'
    };
  }

  /**
   * Generate detailed report
   */
  static async generateDetailedReport(data, options = {}) {
    console.log('DashboardButtonService.generateDetailedReport called');
    console.log('Data:', data);
    console.log('Options:', options);
    
    // Validate required dependencies
    if (!jsPDF || !XLSX) {
      throw new Error('Required dependencies for report generation are not available');
    }
    
    if (!data) {
      throw new Error('No data provided for report generation');
    }
    
    try {
      const reportData = {
        ...data,
        generatedAt: new Date().toISOString(),
        reportType: 'executive-detailed',
        options
      };

      // Create comprehensive report based on format
      switch (options.format || 'pdf') {
        case 'pdf':
          console.log('Generating detailed PDF report...');
          return await this.exportToPDF(reportData, `executive-detailed-report-${new Date().toISOString().split('T')[0]}`, options);
        case 'excel':
          console.log('Generating detailed Excel report...');
          return await this.exportToExcel(reportData, `executive-detailed-report-${new Date().toISOString().split('T')[0]}`, options);
        default:
          throw new Error(`Unsupported report format: ${options.format}`);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      throw new Error(`Failed to generate detailed report: ${error.message}`);
    }
  }

  // Helper methods
  static formatCurrency(amount, currency = 'SAR') {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  static getRiskStatus(score) {
    if (!score && score !== 0) return 'Unknown';
    if (score <= 20) return 'Low';
    if (score <= 50) return 'Medium';
    return 'High';
  }
}