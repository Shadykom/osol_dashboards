import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Printer, X, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

const PDFViewer = ({ 
  isOpen, 
  onClose, 
  pdfDoc, 
  reportName, 
  onDownload, 
  onPrint 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (pdfDoc && pdfDoc.output) {
      try {
        // Convert PDF to blob URL
        const pdfBlob = pdfDoc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        
        // Get total pages from jsPDF
        const pages = pdfDoc.internal.getNumberOfPages();
        setTotalPages(pages);
        setCurrentPage(1);
        
        return () => {
          // Cleanup blob URL
          if (url) {
            URL.revokeObjectURL(url);
          }
        };
      } catch (error) {
        console.error('Error creating PDF URL:', error);
        toast.error('Failed to load PDF preview');
      }
    }
  }, [pdfDoc]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageInput = (e) => {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handlePrint = () => {
    if (pdfDoc) {
      onPrint();
    }
  };

  const handleDownload = () => {
    if (pdfDoc) {
      onDownload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={containerRef}
        className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden flex flex-col"
      >
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {reportName || 'Report Preview'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 min-w-[60px]"
                  onClick={handleZoomReset}
                >
                  {Math.round(scale * 100)}%
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomIn}
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Page Navigation */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePreviousPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 px-2">
                  <input
                    type="number"
                    value={currentPage}
                    onChange={handlePageInput}
                    className="w-12 text-center border rounded px-1 py-0.5 text-sm"
                    min={1}
                    max={totalPages}
                  />
                  <span className="text-sm text-muted-foreground">/ {totalPages}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrint}
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDownload}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClose}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div 
            className="mx-auto bg-white shadow-lg"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease-in-out',
              width: 'fit-content'
            }}
          >
            {pdfUrl ? (
              <iframe
                ref={iframeRef}
                src={`${pdfUrl}#page=${currentPage}`}
                className="w-[800px] h-[1100px]"
                style={{
                  border: 'none',
                  display: 'block'
                }}
                title="PDF Preview"
              />
            ) : (
              <div className="w-[800px] h-[1100px] flex items-center justify-center text-muted-foreground">
                <p>Loading PDF...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t flex items-center justify-between text-sm text-muted-foreground flex-shrink-0">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div>
            {reportName}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;