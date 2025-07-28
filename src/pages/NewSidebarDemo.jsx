import { NewLayout } from '@/components/layout/NewLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  CheckCircle, 
  AlertCircle,
  Info,
  Zap,
  Star
} from 'lucide-react';

export function NewSidebarDemo() {
  return (
    <NewLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              New Mobile-First Sidebar
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A completely redesigned sidebar that works perfectly on all devices with 
            clean code, better performance, and excellent mobile experience.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge className="bg-green-500 text-white">✅ Mobile Ready</Badge>
            <Badge className="bg-blue-500 text-white">🚀 Performance Optimized</Badge>
            <Badge className="bg-purple-500 text-white">♿ Accessible</Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Mobile First */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Mobile First</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Built with mobile as the primary focus, ensuring perfect touch interactions and responsive design.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Touch-optimized interactions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Smooth slide animations</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Proper overlay handling</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clean Code */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Clean Architecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Modular, maintainable code structure with clear separation of concerns.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Component-based design</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Minimal CSS conflicts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Easy to maintain</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">High Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Optimized for fast rendering and smooth interactions across all devices.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Hardware acceleration</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Minimal re-renders</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Optimized animations</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Device Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tablet className="h-5 w-5" />
              Cross-Device Compatibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Mobile */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold">Mobile Devices</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Perfect touch experience with slide-out navigation and overlay support.
                </p>
                <div className="flex justify-center">
                  <Badge className="bg-green-500 text-white">Fully Supported</Badge>
                </div>
              </div>

              {/* Tablet */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                  <Tablet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">Tablet Devices</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Adaptive layout that works in both portrait and landscape orientations.
                </p>
                <div className="flex justify-center">
                  <Badge className="bg-blue-500 text-white">Optimized</Badge>
                </div>
              </div>

              {/* Desktop */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold">Desktop</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Collapsible sidebar with hover tooltips and keyboard navigation support.
                </p>
                <div className="flex justify-center">
                  <Badge className="bg-purple-500 text-white">Enhanced</Badge>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              How to Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Mobile Testing */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Testing
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Open developer tools and switch to mobile view</li>
                  <li>Click the menu button in the header</li>
                  <li>Sidebar should slide in smoothly from the left</li>
                  <li>Try navigating to different pages</li>
                  <li>Sidebar should close automatically after navigation</li>
                  <li>Test touch scrolling within the sidebar</li>
                </ol>
              </div>

              {/* Desktop Testing */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop Testing
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Resize browser window to desktop size</li>
                  <li>Sidebar should appear as a persistent left panel</li>
                  <li>Click the collapse button to minimize sidebar</li>
                  <li>Icons should remain visible with tooltips on hover</li>
                  <li>Test keyboard navigation with Tab key</li>
                  <li>Try the search functionality</li>
                </ol>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Features Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Key Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">No More White Screen Issues</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Eliminated the mobile white screen problem with proper component structure and CSS.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Simplified CSS</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Removed complex mobile-specific CSS fixes and replaced with clean, maintainable styles.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Better Performance</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Optimized rendering with proper React patterns and reduced re-renders.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Enhanced Accessibility</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Proper focus management, ARIA labels, and keyboard navigation support.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">RTL Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Built-in right-to-left language support without additional complexity.
                  </p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="text-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Star className="h-4 w-4 mr-2" />
            Ready to Deploy
          </Button>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The new sidebar is ready for production use!
          </p>
        </div>

      </div>
    </NewLayout>
  );
}