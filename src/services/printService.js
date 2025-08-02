import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

class PrintService {
  /**
   * Generate PDF from HTML element
   */
  static async generatePDF(element, options = {}) {
    const {
      title = 'Report',
      orientation = 'portrait',
      format = 'a4',
      margin = 10,
      quality = 2,
      onProgress
    } = options;

    try {
      if (onProgress) onProgress(10, 'Preparing content...');

      // Create canvas from element
      const canvas = await html2canvas(element, {
        scale: quality,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Remove no-print elements from cloned document
          clonedDoc.querySelectorAll('.no-print').forEach(el => el.remove());
        }
      });

      if (onProgress) onProgress(40, 'Generating PDF...');

      // Initialize PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });

      // Calculate dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - (2 * margin);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add metadata
      pdf.setProperties({
        title,
        subject: `${title} - Generated on ${new Date().toLocaleDateString()}`,
        author: 'OSOL Banking System',
        keywords: 'report, banking, collection, osol',
        creator: 'OSOL Print Service'
      });

      // Add content
      let position = margin;
      const imgData = canvas.toDataURL('image/png');

      // Add header
      pdf.setFontSize(16);
      pdf.text(title, pageWidth / 2, position + 5, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(
        `Generated on: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        position + 12,
        { align: 'center' }
      );
      
      position += 20;

      if (onProgress) onProgress(60, 'Adding pages...');

      // Add image with pagination
      let heightLeft = imgHeight;
      let page = 1;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position - margin);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        page++;
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - (2 * margin));
      }

      if (onProgress) onProgress(80, 'Adding page numbers...');

      // Add page numbers and footers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Page number
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin - 20,
          pageHeight - margin,
          { align: 'right' }
        );
        
        // Footer
        pdf.text(
          'OSOL Banking System',
          margin,
          pageHeight - margin,
          { align: 'left' }
        );
      }

      if (onProgress) onProgress(100, 'Complete!');

      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Export data to Excel
   */
  static async exportToExcel(data, options = {}) {
    const {
      filename = 'report',
      sheetName = 'Data',
      headers = [],
      columnWidths = {},
      dateFormat = 'dd/mm/yyyy',
      rtl = false
    } = options;

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data
      let wsData = [];
      
      // Add title row
      if (options.title) {
        wsData.push([options.title]);
        wsData.push([]); // Empty row
      }
      
      // Add metadata
      if (options.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          wsData.push([key, value]);
        });
        wsData.push([]); // Empty row
      }
      
      // Add headers if provided
      if (headers.length > 0) {
        wsData.push(headers);
      }
      
      // Add data rows
      if (Array.isArray(data)) {
        data.forEach(row => {
          if (Array.isArray(row)) {
            wsData.push(row);
          } else if (typeof row === 'object') {
            // Convert object to array based on headers or keys
            const keys = headers.length > 0 ? headers : Object.keys(row);
            wsData.push(keys.map(key => row[key]));
          }
        });
      }
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      const colWidths = [];
      Object.entries(columnWidths).forEach(([col, width]) => {
        const colIndex = typeof col === 'string' ? 
          col.charCodeAt(0) - 'A'.charCodeAt(0) : col;
        colWidths[colIndex] = { wch: width };
      });
      ws['!cols'] = colWidths;
      
      // Set RTL if needed
      if (rtl) {
        ws['!dir'] = 'rtl';
      }
      
      // Apply styles
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = { c: C, r: R };
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          
          if (!ws[cellRef]) continue;
          
          // Style headers
          if (headers.length > 0 && R === (options.title ? 4 : 0)) {
            ws[cellRef].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'E6B800' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
          
          // Format dates
          if (ws[cellRef].t === 'd' || ws[cellRef].v instanceof Date) {
            ws[cellRef].z = dateFormat;
          }
          
          // Format numbers
          if (typeof ws[cellRef].v === 'number' && !isNaN(ws[cellRef].v)) {
            if (ws[cellRef].v % 1 !== 0) {
              ws[cellRef].z = '#,##0.00';
            } else {
              ws[cellRef].z = '#,##0';
            }
          }
        }
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Generate file
      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      });
      
      // Create blob and download
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Export data to CSV
   */
  static exportToCSV(data, options = {}) {
    const {
      filename = 'report',
      headers = [],
      delimiter = ',',
      lineBreak = '\n',
      quote = '"'
    } = options;

    try {
      let csv = '';
      
      // Add BOM for UTF-8
      csv = '\uFEFF';
      
      // Add headers
      if (headers.length > 0) {
        csv += headers.map(h => this.escapeCSV(h, delimiter, quote)).join(delimiter) + lineBreak;
      }
      
      // Add data rows
      data.forEach(row => {
        if (Array.isArray(row)) {
          csv += row.map(cell => this.escapeCSV(cell, delimiter, quote)).join(delimiter) + lineBreak;
        } else if (typeof row === 'object') {
          const keys = headers.length > 0 ? headers : Object.keys(row);
          csv += keys.map(key => this.escapeCSV(row[key], delimiter, quote)).join(delimiter) + lineBreak;
        }
      });
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Escape CSV cell value
   */
  static escapeCSV(cell, delimiter = ',', quote = '"') {
    if (cell == null) return '';
    
    const str = String(cell);
    
    // Check if escaping is needed
    if (str.includes(delimiter) || str.includes(quote) || str.includes('\n') || str.includes('\r')) {
      return quote + str.replace(new RegExp(quote, 'g'), quote + quote) + quote;
    }
    
    return str;
  }

  /**
   * Print specific element
   */
  static printElement(element, options = {}) {
    const {
      title = 'Print',
      styles = '',
      beforePrint,
      afterPrint
    } = options;

    // Create print window
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups for printing');
      return;
    }

    // Get all stylesheets
    const styleSheets = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    // Build print document
    const printDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${styleSheets}
          ${styles}
          
          @media print {
            body { margin: 20px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `;

    // Write content and print
    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    printWindow.onload = () => {
      if (beforePrint) beforePrint();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        
        if (afterPrint) afterPrint();
      }, 250);
    };
  }

  /**
   * Generate report summary
   */
  static generateReportSummary(data, options = {}) {
    const {
      title = 'Report Summary',
      sections = [],
      format = 'html' // html, text, markdown
    } = options;

    let summary = '';

    switch (format) {
      case 'html':
        summary = `<div class="report-summary">`;
        summary += `<h1>${title}</h1>`;
        summary += `<p>Generated on: ${new Date().toLocaleString()}</p>`;
        
        sections.forEach(section => {
          summary += `<div class="section">`;
          summary += `<h2>${section.title}</h2>`;
          
          if (section.metrics) {
            summary += `<div class="metrics">`;
            section.metrics.forEach(metric => {
              summary += `<div class="metric">`;
              summary += `<span class="label">${metric.label}:</span>`;
              summary += `<span class="value">${metric.value}</span>`;
              summary += `</div>`;
            });
            summary += `</div>`;
          }
          
          if (section.content) {
            summary += `<div class="content">${section.content}</div>`;
          }
          
          summary += `</div>`;
        });
        
        summary += `</div>`;
        break;

      case 'text':
        summary = `${title}\n`;
        summary += `${'='.repeat(title.length)}\n\n`;
        summary += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        sections.forEach(section => {
          summary += `${section.title}\n`;
          summary += `${'-'.repeat(section.title.length)}\n`;
          
          if (section.metrics) {
            section.metrics.forEach(metric => {
              summary += `${metric.label}: ${metric.value}\n`;
            });
          }
          
          if (section.content) {
            summary += `\n${section.content}\n`;
          }
          
          summary += '\n';
        });
        break;

      case 'markdown':
        summary = `# ${title}\n\n`;
        summary += `*Generated on: ${new Date().toLocaleString()}*\n\n`;
        
        sections.forEach(section => {
          summary += `## ${section.title}\n\n`;
          
          if (section.metrics) {
            summary += '| Metric | Value |\n';
            summary += '|--------|-------|\n';
            section.metrics.forEach(metric => {
              summary += `| ${metric.label} | ${metric.value} |\n`;
            });
            summary += '\n';
          }
          
          if (section.content) {
            summary += `${section.content}\n\n`;
          }
        });
        break;
    }

    return summary;
  }
}

export default PrintService;