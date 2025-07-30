import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
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
    yPosition = 45; // Adjusted for new header height

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
    // Add OSOL branded header background
    pdf.setFillColor(230, 184, 0); // OSOL Golden Yellow (#E6B800)
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Add logo - since we can't embed images directly in jsPDF without base64,
    // we'll create a styled text logo
    pdf.setFillColor(255, 255, 255);
    pdf.rect(10, 8, 35, 20, 'F');
    pdf.setFillColor(230, 184, 0);
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('OSOL', 27.5, 20, { align: 'center' });
    
    // Add title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, pageWidth / 2, 20, { align: 'center' });

    // Add date
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 10, 20, { align: 'right' });

    // Add subtitle line
    pdf.setFontSize(8);
    pdf.text('OSOL Financial Services - Professional Banking Report', pageWidth / 2, 28, { align: 'center' });
    
    // Reset text color for content
    pdf.setTextColor(0, 0, 0);
  }

  /**
   * Add PDF Footer
   */
  addPDFFooter(pdf, pageHeight) {
    const pageCount = pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Add footer background
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, pageHeight - 20, pdf.internal.pageSize.width, 20, 'F');
      
      // Add footer content
      pdf.setFontSize(10);
      pdf.setTextColor(74, 85, 104); // OSOL Secondary color
      pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
      pdf.text('© 2025 OSOL Financial Services - Confidential', 10, pageHeight - 10);
      
      // Add OSOL branding
      pdf.setFillColor(230, 184, 0);
      pdf.rect(pdf.internal.pageSize.width - 40, pageHeight - 15, 30, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('OSOL', pdf.internal.pageSize.width - 25, pageHeight - 10, { align: 'center' });
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
    pdf.setTextColor(230, 184, 0); // OSOL Golden
    pdf.text('Revenue', 10, y);
    pdf.setTextColor(0, 0, 0);
    y += 10;

    // Handle revenue object properly
    const revenueData = [];
    if (data.revenue && typeof data.revenue === 'object') {
      if (data.revenue.transactionFees !== undefined) {
        revenueData.push(['Transaction Fees', this.formatCurrency(data.revenue.transactionFees)]);
      }
      if (data.revenue.interestIncome !== undefined) {
        revenueData.push(['Interest Income', this.formatCurrency(data.revenue.interestIncome)]);
      }
      if (data.revenue.otherIncome !== undefined) {
        revenueData.push(['Other Income', this.formatCurrency(data.revenue.otherIncome)]);
      }
      
      // Calculate total revenue
      const totalRevenue = (data.revenue.transactionFees || 0) + 
                          (data.revenue.interestIncome || 0) + 
                          (data.revenue.otherIncome || 0);
      revenueData.push(['Total Revenue', this.formatCurrency(totalRevenue)]);
    }

    autoTable(pdf, {
      startY: y,
      head: [['Item', 'Amount (SAR)']],
      body: revenueData,
      theme: 'striped',
      headStyles: { 
        fillColor: [230, 184, 0], // OSOL Golden
        textColor: [255, 255, 255]
      },
      alternateRowStyles: { fillColor: [252, 248, 227] }, // Light golden
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 },
      footStyles: { 
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      }
    });

    y = pdf.lastAutoTable.finalY + 15;

    // Expenses Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(230, 184, 0); // OSOL Golden
    pdf.text('Expenses', 10, y);
    pdf.setTextColor(0, 0, 0);
    y += 10;

    // Handle expenses object properly
    const expensesData = [];
    if (data.expenses && typeof data.expenses === 'object') {
      if (data.expenses.operatingExpenses !== undefined) {
        expensesData.push(['Operating Expenses', this.formatCurrency(data.expenses.operatingExpenses)]);
      }
      if (data.expenses.personnelCosts !== undefined) {
        expensesData.push(['Personnel Costs', this.formatCurrency(data.expenses.personnelCosts)]);
      }
      if (data.expenses.provisions !== undefined) {
        expensesData.push(['Provisions', this.formatCurrency(data.expenses.provisions)]);
      }
      if (data.expenses.provisionForLosses !== undefined) {
        expensesData.push(['Provision for Losses', this.formatCurrency(data.expenses.provisionForLosses)]);
      }
      if (data.expenses.otherExpenses !== undefined) {
        expensesData.push(['Other Expenses', this.formatCurrency(data.expenses.otherExpenses)]);
      }
      
      // Calculate total expenses
      const totalExpenses = (data.expenses.operatingExpenses || 0) + 
                           (data.expenses.personnelCosts || 0) + 
                           (data.expenses.provisions || 0) +
                           (data.expenses.provisionForLosses || 0) +
                           (data.expenses.otherExpenses || 0);
      expensesData.push(['Total Expenses', this.formatCurrency(totalExpenses)]);
    }

    autoTable(pdf, {
      startY: y,
      head: [['Item', 'Amount (SAR)']],
      body: expensesData,
      theme: 'striped',
      headStyles: { 
        fillColor: [230, 184, 0], // OSOL Golden
        textColor: [255, 255, 255]
      },
      alternateRowStyles: { fillColor: [252, 248, 227] }, // Light golden
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 },
      footStyles: { 
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      }
    });

    y = pdf.lastAutoTable.finalY + 15;

    // Net Income
    pdf.setFillColor(230, 184, 0, 0.1); // Light OSOL Golden
    pdf.rect(10, y - 5, pdf.internal.pageSize.width - 20, 20, 'F');
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(74, 85, 104); // OSOL Secondary
    pdf.text('Net Income', 15, y + 5);
    
    // Calculate net income if not provided
    let netIncome = data.netIncome;
    if (netIncome === undefined && data.revenue && data.expenses) {
      const totalRevenue = (data.revenue.transactionFees || 0) + 
                          (data.revenue.interestIncome || 0) + 
                          (data.revenue.otherIncome || 0);
      const totalExpenses = (data.expenses.operatingExpenses || 0) + 
                           (data.expenses.personnelCosts || 0) + 
                           (data.expenses.provisions || 0) +
                           (data.expenses.provisionForLosses || 0) +
                           (data.expenses.otherExpenses || 0);
      netIncome = totalRevenue - totalExpenses;
    }
    
    // Set color based on profit/loss
    if (netIncome >= 0) {
      pdf.setTextColor(72, 187, 120); // Green for profit
    } else {
      pdf.setTextColor(245, 101, 101); // Red for loss
    }
    pdf.text(this.formatCurrency(netIncome), pdf.internal.pageSize.width - 15, y + 5, { align: 'right' });

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

    autoTable(pdf, {
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

    autoTable(pdf, {
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

    autoTable(pdf, {
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

    autoTable(pdf, {
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

    autoTable(pdf, {
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

    autoTable(pdf, {
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

    autoTable(pdf, {
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