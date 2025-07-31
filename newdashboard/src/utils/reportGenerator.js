// Report generation utilities
//
// This module exposes helper functions for exporting dashboard data to PDF,
// Excel and CSV formats.  It uses jsPDF and xlsx for PDF/Excel exports
// respectively, mirroring the implementation described in the provided
// documentation.  Note that these functions depend on browser APIs for
// creating download links and are meant to run in a client‑side context.

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatTitle, formatValue } from './dataFormatters.js';

export const exportToPDF = async (data) => {
  const doc = new jsPDF();

  // Add header
  doc.setFontSize(20);
  doc.text(data.metadata.title, 20, 20);

  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
  doc.text(`Filters: ${JSON.stringify(data.metadata.filters)}`, 20, 40);

  let yPosition = 60;

  // Add overview section
  if (data.overview) {
    doc.setFontSize(16);
    doc.text('Overview', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    Object.entries(data.overview).forEach(([key, value]) => {
      doc.text(
        `${formatTitle(key)}: ${formatValue(value)}`,
        30,
        yPosition
      );
      yPosition += 7;
    });
    yPosition += 10;
  }

  // Add breakdown charts
  if (data.breakdown) {
    doc.addPage();
    yPosition = 20;
    doc.setFontSize(16);
    doc.text('Breakdown Analysis', 20, yPosition);
    yPosition += 20;

    Object.entries(data.breakdown).forEach(([key, breakdownData]) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(14);
      doc.text(formatTitle(key), 20, yPosition);
      yPosition += 10;

      // Convert breakdown data to table format
      const tableData = Object.entries(breakdownData).map(
        ([item, value]) => [
          item,
          formatValue(value.balance || value.count || value)
        ]
      );
      doc.autoTable({
        startY: yPosition,
        head: [['Item', 'Value']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 }
      });
      yPosition = doc.lastAutoTable.finalY + 20;
    });
  }

  // Save the PDF
  doc.save(`${data.metadata.widgetId}_report_${Date.now()}.pdf`);
};

export const exportToExcel = async (data) => {
  const workbook = XLSX.utils.book_new();

  // Overview sheet
  if (data.overview) {
    const overviewData = Object.entries(data.overview).map(
      ([key, value]) => ({
        Metric: formatTitle(key),
        Value: formatValue(value)
      })
    );
    const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
  }

  // Breakdown sheets
  if (data.breakdown) {
    Object.entries(data.breakdown).forEach(([key, breakdownData]) => {
      const sheetData = Object.entries(breakdownData).map(([item, value]) => {
        if (typeof value === 'object') {
          return {
            Item: item,
            ...value
          };
        }
        return {
          Item: item,
          Value: value
        };
      });
      const sheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, sheet, formatTitle(key));
    });
  }

  // Trends sheet
  if (data.trends) {
    const trendsSheet = XLSX.utils.json_to_sheet(data.trends);
    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends');
  }

  // Raw data sheet
  if (data.raw) {
    const rawDataSheet = XLSX.utils.json_to_sheet(
      Array.isArray(data.raw) ? data.raw : data.raw.accounts || []
    );
    XLSX.utils.book_append_sheet(workbook, rawDataSheet, 'Raw Data');
  }

  XLSX.writeFile(
    workbook,
    `${data.metadata.widgetId}_report_${Date.now()}.xlsx`
  );
};

// Simple CSV export helper for raw arrays.  Note: this is a minimal
// implementation which expects `data` to be an array of objects.  Each
// property becomes a column and a header row is inserted automatically.
export const exportToCSV = async (data) => {
  if (!data || !Array.isArray(data)) return;
  const keys = Object.keys(data[0] || {});
  const csv = [keys.join(','), ...data.map((row) => keys.map((k) => row[k]).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `data_export_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};