import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LayoutDashboard, 
  Settings, 
  Save, 
  Download,
  Share,
  Palette,
  Plus,
  Grid3X3
} from 'lucide-react';

import { KPIWidget } from '@/components/widgets/KPIWidget';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Activity
} from 'lucide-react';

const DASHBOARD_TEMPLATES = {
  executive: {
    name: 'Executive Dashboard',
    description: 'High-level KPIs and strategic metrics',
    badge: 'Popular'
  },
  operations: {
    name: 'Operations Dashboard',
    description: 'Operational metrics and daily monitoring',
    badge: 'Recommended'
  },
  analytics: {
    name: 'Analytics Dashboard',
    description: 'Deep dive analytics and reporting',
    badge: 'Advanced'
  },
  custom: {
    name: 'Custom Dashboard',
    description: 'Build your own dashboard from scratch',
    badge: 'Flexible'
  }
};

export function CustomDashboard() {
  const [selectedTemplate, setSelectedTemplate] = useState('executive');
  const [dashboardName, setDashboardName] = useState('My Dashboard');
  const [lastSaved, setLastSaved] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSaveDashboard = () => {
    const config = {
      template: selectedTemplate,
      name: dashboardName,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('osol_dashboard_config', JSON.stringify(config));
    setLastSaved(new Date());
    console.log('Dashboard saved successfully');
  };

  const handleExportDashboard = () => {
    console.log('Exporting dashboard...');
  };

  const handleShareDashboard = () => {
    console.log('Generating share link...');
  };

  // Mock data for charts
  const mockChartData = [
    { date: '2025-01-20', count: 1200 },
    { date: '2025-01-21', count: 1350 },
    { date: '2025-01-22', count: 1100 },
    { date: '2025-01-23', count: 1450 },
    { date: '2025-01-24', count: 1600 }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Dashboard</h1>
          <p className="text-muted-foreground">
            Create and customize your personalized dashboard with drag-and-drop widgets
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleShareDashboard}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDashboard}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={handleSaveDashboard}>
            <Save className="mr-2 h-4 w-4" />
            Save Dashboard
          </Button>
        </div>
      </div>

      {/* Dashboard Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Dashboard Configuration
              </CardTitle>
              <CardDescription>
                Choose a template or create a custom layout
              </CardDescription>
            </div>
            
            {lastSaved && (
              <Badge variant="outline" className="text-green-600">
                Saved {lastSaved.toLocaleTimeString()}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dashboard Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DASHBOARD_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center justify-between w-full">
                        <span>{template.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {template.badge}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {DASHBOARD_TEMPLATES[selectedTemplate]?.description}
              </p>
            </div>

            {/* Dashboard Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dashboard Name</label>
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter dashboard name"
              />
            </div>

            {/* Edit Mode Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Edit Mode</label>
              <Button 
                variant={isEditMode ? "default" : "outline"} 
                className="w-full justify-start"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Grid3X3 className="mr-2 h-4 w-4" />
                {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
              </Button>
              <p className="text-xs text-muted-foreground">
                {isEditMode ? 'Click to exit edit mode' : 'Enable drag & drop editing'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Controls */}
      {isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle>Widget Controls</CardTitle>
            <CardDescription>Add and configure widgets for your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add KPI Widget
              </Button>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Chart Widget
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configure Layout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Dashboard Widgets */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Dashboard Preview</h2>
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPIWidget
            id="customers_kpi"
            title="Total Customers"
            value={12847}
            change="+12.5%"
            trend="up"
            description="Active customers"
            icon={Users}
          />
          
          <KPIWidget
            id="accounts_kpi"
            title="Total Accounts"
            value={18293}
            change="+8.2%"
            trend="up"
            description="All account types"
            icon={CreditCard}
          />
          
          <KPIWidget
            id="revenue_kpi"
            title="Monthly Revenue"
            value="SAR 45.2M"
            change="+18.7%"
            trend="up"
            description="This month's revenue"
            icon={DollarSign}
          />
          
          <KPIWidget
            id="transactions_kpi"
            title="Daily Transactions"
            value={8547}
            change="-2.4%"
            trend="down"
            description="Today's transactions"
            icon={Activity}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartWidget
            id="transaction_trend"
            title="Transaction Trend"
            description="Daily transaction volume"
            data={mockChartData}
            chartType="line"
            xAxisKey="date"
            yAxisKey="count"
            height={300}
          />
          
          <ChartWidget
            id="revenue_chart"
            title="Revenue Growth"
            description="Monthly revenue trend"
            data={mockChartData}
            chartType="area"
            xAxisKey="date"
            yAxisKey="count"
            height={300}
          />
        </div>
      </div>

      {/* Help Section */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium">Dashboard Customization Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <strong>Templates:</strong> Choose from pre-built dashboard templates for different use cases
              </div>
              <div>
                <strong>Edit Mode:</strong> Enable edit mode to add, remove, and configure widgets
              </div>
              <div>
                <strong>Save & Share:</strong> Save your custom layouts and share them with team members
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

