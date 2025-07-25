import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export function Layout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className={cn(
          "flex-1 overflow-auto bg-gray-50/50 p-6",
          "transition-all duration-300"
        )}>
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}