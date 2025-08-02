import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Printer, FileDown, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function PrintView({ 
  children, 
  title = 'تقرير',
  orientation = 'portrait',
  className = '',
  onBeforePrint,
  onAfterPrint
}) {
  const { t, i18n } = useTranslation();
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef(null);
  const isRTL = i18n.language === 'ar';

  // Handle print
  const handlePrint = async () => {
    if (onBeforePrint) await onBeforePrint();
    
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-10000px';
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument || printFrame.contentWindow.document;
    
    // Copy styles from parent document
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          console.warn('Could not access stylesheet', e);
          return '';
        }
      })
      .join('\n');

    // Build print HTML
    const printHTML = `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${i18n.language}">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          ${styles}
          
          /* Print-specific styles */
          @media print {
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Arial', 'Tahoma', sans-serif;
            }
            
            .no-print {
              display: none !important;
            }
            
            .page-break {
              page-break-after: always;
            }
            
            table {
              page-break-inside: avoid;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            thead {
              display: table-header-group;
            }
            
            tfoot {
              display: table-footer-group;
            }
            
            /* Ensure charts and images print properly */
            svg, img {
              max-width: 100% !important;
              height: auto !important;
            }
            
            /* Header and footer */
            @page {
              margin: 2cm;
              size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
              
              @top-center {
                content: "${title}";
                font-size: 14pt;
                font-weight: bold;
              }
              
              @bottom-right {
                content: "صفحة " counter(page) " من " counter(pages);
                font-size: 10pt;
              }
              
              @bottom-left {
                content: "${new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}";
                font-size: 10pt;
              }
            }
          }
          
          /* RTL adjustments */
          ${isRTL ? `
            body {
              direction: rtl;
              text-align: right;
            }
            
            table {
              direction: rtl;
            }
            
            .text-left {
              text-align: right !important;
            }
            
            .text-right {
              text-align: left !important;
            }
          ` : ''}
        </style>
      </head>
      <body>
        <div class="print-header" style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin-bottom: 10px;">${title}</h1>
          <p style="color: #666; font-size: 14px;">
            ${t('common.printDate')}: ${new Date().toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
          </p>
        </div>
        ${printRef.current ? printRef.current.innerHTML : ''}
      </body>
      </html>
    `;

    printDocument.open();
    printDocument.write(printHTML);
    printDocument.close();

    // Wait for content to load
    await new Promise(resolve => {
      printFrame.onload = resolve;
      setTimeout(resolve, 1000); // Fallback timeout
    });

    // Trigger print
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(printFrame);
      if (onAfterPrint) onAfterPrint();
    }, 1000);
  };

  // Generate PDF
  const generatePDF = async () => {
    if (!printRef.current) return;
    
    setGenerating(true);
    
    try {
      // Create canvas from the content
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: printRef.current.scrollWidth,
        windowHeight: printRef.current.scrollHeight
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Add title and metadata
      pdf.setProperties({
        title: title,
        subject: `${title} - ${new Date().toLocaleDateString()}`,
        author: 'OSOL Banking System',
        keywords: 'report, banking, collection',
        creator: 'OSOL'
      });

      // Add pages
      let position = 10;
      const imgData = canvas.toDataURL('image/png');

      // Add header on first page
      pdf.setFontSize(16);
      pdf.text(title, imgWidth / 2, position, { align: 'center' });
      position += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(
        `${t('common.generatedOn')}: ${new Date().toLocaleString(isRTL ? 'ar-SA' : 'en-US')}`,
        imgWidth / 2,
        position,
        { align: 'center' }
      );
      position += 15;

      // Add content
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Add page numbers
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text(
          `${i} / ${pageCount}`,
          imgWidth - 20,
          pageHeight - 10,
          { align: 'right' }
        );
      }

      // Save the PDF
      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Print/Export Buttons */}
      <div className="flex gap-2 no-print">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(true)}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          {t('common.print')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={generatePDF}
          disabled={generating}
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {t('common.exportPDF')}
        </Button>
      </div>

      {/* Print Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('common.printPreview')}</DialogTitle>
            <DialogDescription>
              {t('common.printPreviewDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            {/* Preview Content */}
            <div className="overflow-auto max-h-[60vh] border rounded-lg p-8 bg-white">
              <div ref={printRef} className={className}>
                {children}
              </div>
            </div>

            {/* Print Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => {
                  handlePrint();
                  setShowPreview(false);
                }}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                {t('common.print')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Print-friendly table component
export function PrintTable({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse print-table">
        {children}
      </table>
    </div>
  );
}

// Page break component
export function PageBreak() {
  return <div className="page-break" style={{ pageBreakAfter: 'always' }} />;
}

// Print section component
export function PrintSection({ title, children, className = '' }) {
  return (
    <div className={`print-section mb-8 ${className}`}>
      {title && (
        <h2 className="text-xl font-bold mb-4 print-section-title">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}