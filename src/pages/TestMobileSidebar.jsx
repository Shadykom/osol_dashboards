import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Menu, Smartphone, Monitor, Check, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function TestMobileSidebar() {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [testResults, setTestResults] = React.useState({
    mediaQuery: null,
    menuButtonVisible: null,
    sidebarExists: null,
    touchEvents: null
  });

  React.useEffect(() => {
    // Test media query
    setTestResults(prev => ({
      ...prev,
      mediaQuery: isMobile !== undefined
    }));

    // Test menu button visibility
    const menuButton = document.querySelector('button[aria-label="Open menu"], button[aria-label="Toggle sidebar"]');
    setTestResults(prev => ({
      ...prev,
      menuButtonVisible: !!menuButton
    }));

    // Test sidebar existence
    const sidebar = document.querySelector('.mobile-sidebar');
    setTestResults(prev => ({
      ...prev,
      sidebarExists: !!sidebar
    }));

    // Test touch events
    setTestResults(prev => ({
      ...prev,
      touchEvents: 'ontouchstart' in window
    }));
  }, [isMobile]);

  const TestItem = ({ label, status }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <span className="text-sm font-medium">{label}</span>
      {status === null ? (
        <span className="text-gray-400">Testing...</span>
      ) : status ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-red-500" />
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Menu className="h-5 w-5" />
            Mobile Sidebar Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {isMobile ? (
              <>
                <Smartphone className="h-6 w-6 text-blue-500" />
                <span className="font-medium">Mobile View Detected</span>
              </>
            ) : (
              <>
                <Monitor className="h-6 w-6 text-gray-500" />
                <span className="font-medium">Desktop View Detected</span>
              </>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold mb-2">System Checks:</h3>
            <TestItem label="Media Query Working" status={testResults.mediaQuery} />
            <TestItem label="Menu Button Visible" status={testResults.menuButtonVisible} />
            <TestItem label="Sidebar Component Exists" status={testResults.sidebarExists} />
            <TestItem label="Touch Events Available" status={testResults.touchEvents} />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>On mobile, look for the menu button (☰) in the header</li>
              <li>Tap the menu button to open the sidebar</li>
              <li>The sidebar should slide in from the left</li>
              <li>Tap outside the sidebar to close it</li>
              <li>Check console for any error messages</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                const menuButton = document.querySelector('button[aria-label="Open menu"], button[aria-label="Toggle sidebar"]');
                if (menuButton) {
                  menuButton.click();
                }
              }}
              className="w-full"
            >
              Trigger Menu Button Click
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload Page
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            <p>Window width: {window.innerWidth}px</p>
            <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}