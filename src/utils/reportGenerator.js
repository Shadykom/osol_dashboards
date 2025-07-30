import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

class ReportGenerator {
  /**
   * Generate PDF Report
   */
  async generatePDF(reportData, reportType, reportTitle) {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // Add header
    this.addPDFHeader(pdf, reportTitle, pageWidth);
    yPosition = 60;

    // Add report content based on type
    switch (reportType) {
      case 'income_statement':
        yPosition = this.addIncomeStatementToPDF(pdf, reportData, yPosition);
        break;
      case 'balance_sheet':
        yPosition = this.addBalanceSheetToPDF(pdf, reportData, yPosition);
        break;
      case 'cash_flow':
        yPosition = this.addCashFlowToPDF(pdf, reportData, yPosition);
        break;
      case 'credit_risk':
        yPosition = this.addCreditRiskToPDF(pdf, reportData, yPosition);
        break;
      case 'customer_acquisition':
        yPosition = this.addCustomerAcquisitionToPDF(pdf, reportData, yPosition);
        break;
      default:
        yPosition = this.addGenericDataToPDF(pdf, reportData, yPosition);
    }

    // Add footer
    this.addPDFFooter(pdf, pageHeight);

    return pdf;
  }

  /**
   * Add PDF Header
   */
  addPDFHeader(pdf, title, pageWidth) {
    // Add logo placeholder
    pdf.setFillColor(0, 102, 204);
    pdf.rect(10, 10, 30, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('OSOL', 20, 20);

    // Add title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.text(title, pageWidth / 2, 20, { align: 'center' });

    // Add date
    pdf.setFontSize(10);
    pdf.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 10, 20, { align: 'right' });

    // Add line
    pdf.setDrawColor(0, 102, 204);
    pdf.setLineWidth(0.5);
    pdf.line(10, 30, pageWidth - 10, 30);
  }

  /**
   * Add PDF Footer
   */
  addPDFFooter(pdf, pageHeight) {
    const pageCount = pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
      pdf.text('Confidential - OSOL Banking System', 10, pageHeight - 10);
    }
  }

  /**
   * Add Income Statement to PDF
   */
  addIncomeStatementToPDF(pdf, data, startY) {
    let y = startY;

    // Period
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Period: ${format(new Date(data.period.startDate), 'dd/MM/yyyy')} - ${format(new Date(data.period.endDate), 'dd/MM/yyyy')}`, 10, y);
    y += 15;

    // Revenue Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Revenue', 10, y);
    y += 10;

    const revenueData = [
      ['Transaction Fees', this.formatCurrency(data.revenue.transactionFees)],
      ['Interest Income', this.formatCurrency(data.revenue.interestIncome)],
      ['Other Income', this.formatCurrency(data.revenue.otherIncome)],
      ['Total Revenue', this.formatCurrency(data.revenue.totalRevenue)]
    ];

    pdf.autoTable({
      startY: y,
      head: [['Item', 'Amount (SAR)']],
      body: revenueData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    y = pdf.lastAutoTable.finalY + 15;

    // Expenses Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Expenses', 10, y);
    y += 10;

    const expensesData = [
      ['Operating Expenses', this.formatCurrency(data.expenses.operatingExpenses)],
      ['Personnel Costs', this.formatCurrency(data.expenses.personnelCosts)],
      ['Provision for Losses', this.formatCurrency(data.expenses.provisionForLosses)],
      ['Other Expenses', this.formatCurrency(data.expenses.otherExpenses)],
      ['Total Expenses', this.formatCurrency(data.expenses.totalExpenses)]
    ];

    pdf.autoTable({
      startY: y,
      head: [['Item', 'Amount (SAR)']],
      body: expensesData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    y = pdf.lastAutoTable.finalY + 15;

    // Net Income
    pdf.setFillColor(240, 240, 240);
    pdf.rect(10, y - 5, pdf.internal.pageSize.width - 20, 20, 'F');
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Net Income', 15, y + 5);
    pdf.text(this.formatCurrency(data.netIncome), pdf.internal.pageSize.width - 15, y + 5, { align: 'right' });

    return y + 25;
  }

  /**
   * Add Balance Sheet to PDF
   */
  addBalanceSheetToPDF(pdf, data, startY) {
    let y = startY;

    // As of Date
    pdf.setFontSize(12);
    pdf.text(`As of: ${format(new Date(data.asOfDate), 'dd/MM/yyyy')}`, 10, y);
    y += 15;

    // Assets Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Assets', 10, y);
    y += 10;

    const assetsData = [
      ['Cash & Cash Equivalents', this.formatCurrency(data.assets.cash)],
      ['Loans & Advances', this.formatCurrency(data.assets.loans)],
      ['Investments', this.formatCurrency(data.assets.investments)],
      ['Fixed Assets', this.formatCurrency(data.assets.fixedAssets)],
      ['Other Assets', this.formatCurrency(data.assets.otherAssets)],
      ['Total Assets', this.formatCurrency(data.assets.totalAssets)]
    ];

    pdf.autoTable({
      startY: y,
      head: [['Item', 'Amount (SAR)']],
      body: assetsData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    y = pdf.lastAutoTable.finalY + 15;

    // Liabilities Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Liabilities', 10, y);
    y += 10;

    const liabilitiesData = [
      ['Customer Deposits', this.formatCurrency(data.liabilities.deposits)],
      ['Borrowings', this.formatCurrency(data.liabilities.borrowings)],
      ['Other Liabilities', this.formatCurrency(data.liabilities.otherLiabilities)],
      ['Total Liabilities', this.formatCurrency(data.liabilities.totalLiabilities)]
    ];

    pdf.autoTable({
      startY: y,
      head: [['Item', 'Amount (SAR)']],
      body: liabilitiesData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    y = pdf.lastAutoTable.finalY + 15;

    // Equity Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Equity', 10, y);
    y += 10;

    const equityData = [
      ['Paid-up Capital', this.formatCurrency(data.equity.paidUpCapital)],
      ['Reserves', this.formatCurrency(data.equity.reserves)],
      ['Retained Earnings', this.formatCurrency(data.equity.retainedEarnings)],
      ['Total Equity', this.formatCurrency(data.equity.totalEquity)]
    ];

    pdf.autoTable({
      startY: y,
      head: [['Item', 'Amount (SAR)']],
      body: equityData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    return pdf.lastAutoTable.finalY + 15;
  }

  /**
   * Add Cash Flow to PDF
   */
  addCashFlowToPDF(pdf, data, startY) {
    let y = startY;

    // Period
    pdf.setFontSize(12);
    pdf.text(`Period: ${format(new Date(data.period.startDate), 'dd/MM/yyyy')} - ${format(new Date(data.period.endDate), 'dd/MM/yyyy')}`, 10, y);
    y += 15;

    const cashFlowData = [
      ['Operating Activities', '', ''],
      ['Cash from Operations', this.formatCurrency(data.operatingActivities.cashFromOperations), ''],
      ['Interest Received', this.formatCurrency(data.operatingActivities.interestReceived), ''],
      ['Interest Paid', this.formatCurrency(data.operatingActivities.interestPaid), ''],
      ['Net Cash from Operating Activities', '', this.formatCurrency(data.operatingActivities.netOperating)],
      ['', '', ''],
      ['Investing Activities', '', ''],
      ['Purchase of Investments', this.formatCurrency(data.investingActivities.purchaseOfInvestments), ''],
      ['Sale of Investments', this.formatCurrency(data.investingActivities.saleOfInvestments), ''],
      ['Net Cash from Investing Activities', '', this.formatCurrency(data.investingActivities.netInvesting)],
      ['', '', ''],
      ['Financing Activities', '', ''],
      ['Proceeds from Borrowings', this.formatCurrency(data.financingActivities.proceedsFromBorrowings), ''],
      ['Repayment of Borrowings', this.formatCurrency(data.financingActivities.repaymentOfBorrowings), ''],
      ['Dividends Paid', this.formatCurrency(data.financingActivities.dividendsPaid), ''],
      ['Net Cash from Financing Activities', '', this.formatCurrency(data.financingActivities.netFinancing)],
      ['', '', ''],
      ['Net Change in Cash', '', this.formatCurrency(data.netCashFlow)],
      ['Opening Cash Balance', '', this.formatCurrency(data.openingBalance)],
      ['Closing Cash Balance', '', this.formatCurrency(data.closingBalance)]
    ];

    pdf.autoTable({
      startY: y,
      head: [['Item', 'Amount (SAR)', 'Total (SAR)']],
      body: cashFlowData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'normal' },
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });

    return pdf.lastAutoTable.finalY + 15;
  }

  /**
   * Add Credit Risk to PDF
   */
  addCreditRiskToPDF(pdf, data, startY) {
    let y = startY;

    // Key Metrics
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Key Risk Metrics', 10, y);
    y += 10;

    const metricsData = [
      ['Total Credit Exposure', this.formatCurrency(data.totalExposure)],
      ['Non-Performing Loans', this.formatCurrency(data.nplAmount)],
      ['NPL Ratio', `${data.nplRatio.toFixed(2)}%`],
      ['Provision Required', this.formatCurrency(data.provisionRequired)],
      ['Capital Adequacy Ratio', `${data.capitalAdequacyRatio}%`]
    ];

    pdf.autoTable({
      startY: y,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    y = pdf.lastAutoTable.finalY + 15;

    // Risk Distribution
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Risk Distribution', 10, y);
    y += 10;

    const riskData = [
      ['Low Risk', data.riskDistribution.low],
      ['Medium Risk', data.riskDistribution.medium],
      ['High Risk', data.riskDistribution.high],
      ['Critical Risk', data.riskDistribution.critical]
    ];

    pdf.autoTable({
      startY: y,
      head: [['Risk Category', 'Number of Accounts']],
      body: riskData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    y = pdf.lastAutoTable.finalY + 15;

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Recommendations', 10, y);
      y += 10;

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      data.recommendations.forEach((rec, index) => {
        pdf.text(`${index + 1}. ${rec}`, 15, y);
        y += 7;
      });
    }

    return y + 10;
  }

  /**
   * Add Customer Acquisition to PDF
   */
  addCustomerAcquisitionToPDF(pdf, data, startY) {
    let y = startY;

    // Period and Summary
    pdf.setFontSize(12);
    pdf.text(`Period: ${format(new Date(data.period.startDate), 'dd/MM/yyyy')} - ${format(new Date(data.period.endDate), 'dd/MM/yyyy')}`, 10, y);
    y += 10;
    pdf.text(`Total New Customers: ${data.totalNewCustomers}`, 10, y);
    y += 10;
    pdf.text(`Average Per Day: ${data.averagePerDay.toFixed(1)}`, 10, y);
    y += 10;
    pdf.text(`Growth Rate: ${data.growthRate}%`, 10, y);
    y += 15;

    // Acquisition by Segment
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Acquisition by Customer Segment', 10, y);
    y += 10;

    const segmentData = Object.entries(data.acquisitionBySegment).map(([segment, count]) => [segment, count]);

    pdf.autoTable({
      startY: y,
      head: [['Segment', 'New Customers']],
      body: segmentData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    return pdf.lastAutoTable.finalY + 15;
  }

  /**
   * Add Generic Data to PDF
   */
  addGenericDataToPDF(pdf, data, startY) {
    let y = startY;

    pdf.setFontSize(10);
    pdf.text(JSON.stringify(data, null, 2), 10, y);

    return y + 50;
  }

  /**
   * Generate Excel Report
   */
  async generateExcel(reportData, reportType, reportTitle) {
    const wb = XLSX.utils.book_new();

    // Add metadata
    wb.Props = {
      Title: reportTitle,
      Subject: `${reportType} Report`,
      Author: 'OSOL Banking System',
      CreatedDate: new Date()
    };

    // Add sheets based on report type
    switch (reportType) {
      case 'income_statement':
        this.addIncomeStatementToExcel(wb, reportData);
        break;
      case 'balance_sheet':
        this.addBalanceSheetToExcel(wb, reportData);
        break;
      case 'cash_flow':
        this.addCashFlowToExcel(wb, reportData);
        break;
      case 'credit_risk':
        this.addCreditRiskToExcel(wb, reportData);
        break;
      case 'customer_acquisition':
        this.addCustomerAcquisitionToExcel(wb, reportData);
        break;
      default:
        this.addGenericDataToExcel(wb, reportData, reportTitle);
    }

    return wb;
  }

  /**
   * Add Income Statement to Excel
   */
  addIncomeStatementToExcel(wb, data) {
    const wsData = [
      ['Income Statement'],
      [`Period: ${format(new Date(data.period.startDate), 'dd/MM/yyyy')} - ${format(new Date(data.period.endDate), 'dd/MM/yyyy')}`],
      [],
      ['Revenue', 'Amount (SAR)'],
      ['Transaction Fees', data.revenue.transactionFees],
      ['Interest Income', data.revenue.interestIncome],
      ['Other Income', data.revenue.otherIncome],
      ['Total Revenue', data.revenue.totalRevenue],
      [],
      ['Expenses', 'Amount (SAR)'],
      ['Operating Expenses', data.expenses.operatingExpenses],
      ['Personnel Costs', data.expenses.personnelCosts],
      ['Provision for Losses', data.expenses.provisionForLosses],
      ['Other Expenses', data.expenses.otherExpenses],
      ['Total Expenses', data.expenses.totalExpenses],
      [],
      ['Net Income', data.netIncome]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Style the worksheet
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
    
    // Add number formatting
    for (let i = 4; i <= 17; i++) {
      if (ws[`B${i}`]) {
        ws[`B${i}`].t = 'n';
        ws[`B${i}`].z = '#,##0.00';
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Income Statement');
  }

  /**
   * Add Balance Sheet to Excel
   */
  addBalanceSheetToExcel(wb, data) {
    const wsData = [
      ['Balance Sheet'],
      [`As of: ${format(new Date(data.asOfDate), 'dd/MM/yyyy')}`],
      [],
      ['Assets', 'Amount (SAR)'],
      ['Cash & Cash Equivalents', data.assets.cash],
      ['Loans & Advances', data.assets.loans],
      ['Investments', data.assets.investments],
      ['Fixed Assets', data.assets.fixedAssets],
      ['Other Assets', data.assets.otherAssets],
      ['Total Assets', data.assets.totalAssets],
      [],
      ['Liabilities', 'Amount (SAR)'],
      ['Customer Deposits', data.liabilities.deposits],
      ['Borrowings', data.liabilities.borrowings],
      ['Other Liabilities', data.liabilities.otherLiabilities],
      ['Total Liabilities', data.liabilities.totalLiabilities],
      [],
      ['Equity', 'Amount (SAR)'],
      ['Paid-up Capital', data.equity.paidUpCapital],
      ['Reserves', data.equity.reserves],
      ['Retained Earnings', data.equity.retainedEarnings],
      ['Total Equity', data.equity.totalEquity],
      [],
      ['Total Liabilities & Equity', data.liabilities.totalLiabilities + data.equity.totalEquity]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
  }

  /**
   * Add Cash Flow to Excel
   */
  addCashFlowToExcel(wb, data) {
    const wsData = [
      ['Cash Flow Statement'],
      [`Period: ${format(new Date(data.period.startDate), 'dd/MM/yyyy')} - ${format(new Date(data.period.endDate), 'dd/MM/yyyy')}`],
      [],
      ['Operating Activities', 'Amount (SAR)'],
      ['Cash from Operations', data.operatingActivities.cashFromOperations],
      ['Interest Received', data.operatingActivities.interestReceived],
      ['Interest Paid', data.operatingActivities.interestPaid],
      ['Net Cash from Operating Activities', data.operatingActivities.netOperating],
      [],
      ['Investing Activities', 'Amount (SAR)'],
      ['Purchase of Investments', data.investingActivities.purchaseOfInvestments],
      ['Sale of Investments', data.investingActivities.saleOfInvestments],
      ['Net Cash from Investing Activities', data.investingActivities.netInvesting],
      [],
      ['Financing Activities', 'Amount (SAR)'],
      ['Proceeds from Borrowings', data.financingActivities.proceedsFromBorrowings],
      ['Repayment of Borrowings', data.financingActivities.repaymentOfBorrowings],
      ['Dividends Paid', data.financingActivities.dividendsPaid],
      ['Net Cash from Financing Activities', data.financingActivities.netFinancing],
      [],
      ['Net Change in Cash', data.netCashFlow],
      ['Opening Cash Balance', data.openingBalance],
      ['Closing Cash Balance', data.closingBalance]
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Cash Flow');
  }

  /**
   * Add Credit Risk to Excel
   */
  addCreditRiskToExcel(wb, data) {
    // Main metrics sheet
    const metricsData = [
      ['Credit Risk Report'],
      [`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
      [],
      ['Key Risk Metrics'],
      ['Total Credit Exposure', data.totalExposure],
      ['Non-Performing Loans', data.nplAmount],
      ['NPL Ratio (%)', data.nplRatio],
      ['Provision Required', data.provisionRequired],
      ['Capital Adequacy Ratio (%)', data.capitalAdequacyRatio]
    ];

    const metricsWs = XLSX.utils.aoa_to_sheet(metricsData);
    metricsWs['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, metricsWs, 'Risk Metrics');

    // Risk distribution sheet
    const distData = [
      ['Risk Distribution'],
      [],
      ['Risk Category', 'Number of Accounts'],
      ['Low Risk', data.riskDistribution.low],
      ['Medium Risk', data.riskDistribution.medium],
      ['High Risk', data.riskDistribution.high],
      ['Critical Risk', data.riskDistribution.critical]
    ];

    const distWs = XLSX.utils.aoa_to_sheet(distData);
    distWs['!cols'] = [{ wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, distWs, 'Risk Distribution');

    // Recommendations sheet
    if (data.recommendations && data.recommendations.length > 0) {
      const recData = [
        ['Recommendations'],
        [],
        ...data.recommendations.map((rec, index) => [`${index + 1}. ${rec}`])
      ];

      const recWs = XLSX.utils.aoa_to_sheet(recData);
      recWs['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(wb, recWs, 'Recommendations');
    }
  }

  /**
   * Add Customer Acquisition to Excel
   */
  addCustomerAcquisitionToExcel(wb, data) {
    // Summary sheet
    const summaryData = [
      ['Customer Acquisition Report'],
      [`Period: ${format(new Date(data.period.startDate), 'dd/MM/yyyy')} - ${format(new Date(data.period.endDate), 'dd/MM/yyyy')}`],
      [],
      ['Summary'],
      ['Total New Customers', data.totalNewCustomers],
      ['Average Per Day', data.averagePerDay],
      ['Growth Rate (%)', data.growthRate]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Segment breakdown sheet
    const segmentData = [
      ['Acquisition by Segment'],
      [],
      ['Customer Segment', 'New Customers'],
      ...Object.entries(data.acquisitionBySegment).map(([segment, count]) => [segment, count])
    ];

    const segmentWs = XLSX.utils.aoa_to_sheet(segmentData);
    segmentWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, segmentWs, 'By Segment');

    // Daily trend sheet
    if (data.acquisitionByDate) {
      const dailyData = [
        ['Daily Acquisition Trend'],
        [],
        ['Date', 'New Customers'],
        ...Object.entries(data.acquisitionByDate).map(([date, count]) => [date, count])
      ];

      const dailyWs = XLSX.utils.aoa_to_sheet(dailyData);
      dailyWs['!cols'] = [{ wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, dailyWs, 'Daily Trend');
    }
  }

  /**
   * Add Generic Data to Excel
   */
  addGenericDataToExcel(wb, data, sheetName = 'Data') {
    const ws = XLSX.utils.json_to_sheet([data]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  /**
   * Format Currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  /**
   * Save PDF
   */
  savePDF(pdf, filename) {
    pdf.save(`${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
  }

  /**
   * Save Excel
   */
  saveExcel(wb, filename) {
    XLSX.writeFile(wb, `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
  }

  /**
   * Get PDF as Blob (for email attachment)
   */
  getPDFBlob(pdf) {
    return pdf.output('blob');
  }

  /**
   * Get Excel as Blob (for email attachment)
   */
  getExcelBlob(wb) {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

export default new ReportGenerator();