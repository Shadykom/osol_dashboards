// This file now redirects to ModernLayout
import ModernLayout from './ModernLayout';

// Legacy Layout component - now uses ModernLayout
export function Layout(props) {
  console.warn('⚠️ Legacy Layout component is being used - redirecting to ModernLayout');
  return <ModernLayout {...props} />;
}

// Original imports kept for reference
/*
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export function LayoutOld({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { i18n } = useTranslation();
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Handle menu click - toggle sidebar state
  const handleMenuClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(true);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Handle mobile sidebar close
  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div 
      className="flex h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={cn(
          "transition-all duration-300 flex-shrink-0"
        )}>
          <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
        </div>
      )}
      
      {/* Mobile Sidebar - Always render Sheet to prevent remounting */}
      <Sheet open={isMobile && isMobileSidebarOpen} onOpenChange={(open) => {
        if (isMobile) {
          setIsMobileSidebarOpen(open);
        }
      }}>
        <SheetContent 
          side="left" 
          className="p-0 w-80 max-w-[85vw] border-0 overflow-hidden flex flex-col h-full bg-white dark:bg-gray-950"
        >
          <VisuallyHidden>
            <SheetHeader>
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Navigate through the application</SheetDescription>
            </SheetHeader>
          </VisuallyHidden>
          <div className="h-full overflow-hidden bg-white dark:bg-gray-950">
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={handleMobileSidebarClose}
              isMobileSheet={true}
              mobileOpen={isMobileSidebarOpen}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden"
      )}>
        <Header onMenuClick={handleMenuClick} />
        <main className={cn(
          "flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950",
          "transition-all duration-300"
        )}>
          <div className="min-h-full p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-[1920px] mx-auto">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
*/