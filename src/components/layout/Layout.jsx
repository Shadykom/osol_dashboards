import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';

export function Layout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [children]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80 max-w-[85vw]">
            <Sidebar isCollapsed={false} setIsCollapsed={() => setIsMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => isMobile ? setIsMobileSidebarOpen(true) : setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className={cn(
          "flex-1 overflow-auto bg-gray-50/50 p-4 lg:p-6",
          "transition-all duration-300",
          "w-full"
        )}>
          <div className="h-full w-full max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}