import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTranslation } from 'react-i18next';

export function Layout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { i18n } = useTranslation();


  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [children]);

  // Handle menu click - toggle sidebar state
  const handleMenuClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(true);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <div 
      className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950"
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={cn(
          "transition-all duration-300"
        )}>
          <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
        </div>
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent 
            side="left" 
            className="p-0 w-80 max-w-[85vw] border-0"
          >
            <Sidebar isCollapsed={false} setIsCollapsed={() => setIsMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      
      <div className={cn(
        "flex-1 flex flex-col min-w-0"
      )}>
        <Header onMenuClick={handleMenuClick} />
        <main className={cn(
          "flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-6 lg:p-8",
          "transition-all duration-300"
        )}>
          <div className="h-full w-full max-w-[1920px] mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-full p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}