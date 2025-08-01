import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Printer, X, Maximize2, Minimize2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
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
  const [showThumbnails, setShowThumbnails] = useState(false);
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

  const handleZoomChange = (value) => {
    setScale(value[0]);
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

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handlePageInput = (e) => {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageJump = (page) => {
    setCurrentPage(page);
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

  // Generate page thumbnails for quick navigation
  const generatePageButtons = () => {
    const buttons = [];
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <Button
          key="1"
          variant={currentPage === 1 ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handlePageJump(1)}
        >
          1
        </Button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots1" className="px-1">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handlePageJump(i)}
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots2" className="px-1">...</span>);
      }
      buttons.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handlePageJump(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={containerRef}
        className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden flex flex-col"
      >
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {reportName || 'Report Preview'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Preview and interact with the generated report
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Zoom Controls with Slider */}
              <div className="flex items-center gap-2 border rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[scale]}
                    onValueChange={handleZoomChange}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 min-w-[60px]"
                    onClick={handleZoomReset}
                  >
                    {Math.round(scale * 100)}%
                  </Button>
                </div>
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

        {/* Enhanced Footer with Page Navigation */}
        <div className="px-4 py-3 border-t flex items-center justify-between flex-shrink-0 bg-background">
          <div className="flex items-center gap-2">
            {/* First/Previous Page Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleFirstPage}
              disabled={currentPage <= 1}
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {generatePageButtons()}
            </div>

            {/* Next/Last Page Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleLastPage}
              disabled={currentPage >= totalPages}
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>

            {/* Page Input */}
            <div className="flex items-center gap-1 ml-4">
              <span className="text-sm text-muted-foreground">Page</span>
              <input
                type="number"
                value={currentPage}
                onChange={handlePageInput}
                className="w-12 text-center border rounded px-1 py-0.5 text-sm"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-muted-foreground">of {totalPages}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {reportName}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;