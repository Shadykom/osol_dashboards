import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Eye, BarChart3, PieChart, Activity, ArrowRight } from 'lucide-react';

const TestDashboardDetailNew = () => {
  const testRoutes = [
    {
      path: '/dashboard/detail-new/overview/total_assets',
      title: 'Total Assets Overview',
      description: 'Redesigned total assets detail page with modern UI/UX',
      category: 'Overview',
      icon: Eye
    },
    {
      path: '/dashboard/detail-new/lending/loan_portfolio',
      title: 'Loan Portfolio',
      description: 'Loan portfolio breakdown and analysis',
      category: 'Lending',
      icon: BarChart3
    },
    {
      path: '/dashboard/detail-new/deposits/account_balances',
      title: 'Account Balances',
      description: 'Account balances and deposit analysis',
      category: 'Deposits',
      icon: PieChart
    },
    {
      path: '/dashboard/detail-new/transactions/volume',
      title: 'Transaction Volume',
      description: 'Transaction volume trends and patterns',
      category: 'Transactions',
      icon: Activity
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Detail New - Test Page</h1>
        <p className="text-muted-foreground">
          Test the redesigned dashboard detail pages with modern UI/UX components
        </p>
      </div>

      {/* Main Test Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Featured: Total Assets Redesign</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Experience the newly redesigned total assets page with enhanced breakdown analysis
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              ✨ New Design
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold">Total Assets Overview</h3>
              <p className="text-sm text-muted-foreground">
                • Modern stat cards with enhanced visualizations<br/>
                • Improved breakdown analysis with interactive charts<br/>
                • Better data loading states and error handling<br/>
                • Responsive design with consistent spacing
              </p>
            </div>
            <Link to="/dashboard/detail-new/overview/total_assets">
              <Button size="lg" className="gap-2">
                View Total Assets
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Test Routes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {testRoutes.map((route, index) => {
          const IconComponent = route.icon;
          return (
            <Card key={index} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{route.title}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {route.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {route.description}
                </p>
                <Link to={route.path}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Test Route
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">✅ Completed Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Enhanced breakdown analysis with better error handling</li>
                <li>• Modern UI components with consistent design system</li>
                <li>• Improved data visualization with custom color support</li>
                <li>• Responsive layout with proper spacing and typography</li>
                <li>• Loading states and error boundaries</li>
                <li>• Interactive charts with better accessibility</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎨 Design Improvements</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Gradient overlays and enhanced visual hierarchy</li>
                <li>• Better color scheme with theme support</li>
                <li>• Improved spacing and layout consistency</li>
                <li>• Enhanced stat cards with trend indicators</li>
                <li>• Professional data tables with sorting/filtering</li>
                <li>• Modern badge system for status indicators</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div className="flex justify-center space-x-4 pt-4">
        <Link to="/dashboard">
          <Button variant="outline">
            ← Back to Dashboard
          </Button>
        </Link>
        <Link to="/test-dashboard">
          <Button variant="outline">
            Test Dashboard Routes
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TestDashboardDetailNew;