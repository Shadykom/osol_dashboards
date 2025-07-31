import React from 'react';
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity, 
  Briefcase,
  TrendingUp,
  BarChart3,
  Target
} from 'lucide-react';
import ModernDashboardCard from '../components/dashboard/ModernDashboardCard';

const DashboardCardsDemo = () => {
  const dashboardCards = [
    {
      title: 'Total Revenue',
      value: 2500000,
      currency: 'SAR',
      trend: 'up',
      trendValue: 12.5,
      icon: <DollarSign className="h-5 w-5" />,
      cardType: 'revenue',
      color: 'yellow'
    },
    {
      title: 'Total Customers',
      value: 15234,
      currency: '',
      trend: 'up',
      trendValue: 8.2,
      icon: <Users className="h-5 w-5" />,
      cardType: 'customers',
      color: 'blue'
    },
    {
      title: 'Active Accounts',
      value: 8456,
      currency: '',
      trend: 'up',
      trendValue: 5.3,
      icon: <CreditCard className="h-5 w-5" />,
      cardType: 'accounts',
      color: 'green'
    },
    {
      title: 'Daily Transactions',
      value: 3421,
      currency: '',
      trend: 'down',
      trendValue: 2.1,
      icon: <Activity className="h-5 w-5" />,
      cardType: 'transactions',
      color: 'purple'
    },
    {
      title: 'Loan Portfolio',
      value: 18500000,
      currency: 'SAR',
      trend: 'up',
      trendValue: 15.7,
      icon: <Briefcase className="h-5 w-5" />,
      cardType: 'loans',
      color: 'orange'
    },
    {
      title: 'Performance Score',
      value: 85,
      currency: '',
      trend: 'up',
      trendValue: 3.2,
      icon: <Target className="h-5 w-5" />,
      cardType: 'performance',
      color: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Click on any card below to see the modern detail page with advanced analytics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
            <ModernDashboardCard
              key={index}
              title={card.title}
              value={card.value}
              currency={card.currency}
              trend={card.trend}
              trendValue={card.trendValue}
              icon={card.icon}
              cardType={card.cardType}
              color={card.color}
            />
          ))}
        </div>

        <div className="mt-12 p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Features of the Modern Detail Page</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Advanced Analytics
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Interactive charts with multiple visualization types</li>
                <li>• Real-time data updates</li>
                <li>• Trend analysis and predictive insights</li>
                <li>• Performance metrics and KPIs</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Modern UI/UX Design
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Glassmorphism effects and smooth animations</li>
                <li>• Responsive design for all devices</li>
                <li>• Dark mode support</li>
                <li>• Intuitive navigation and interactions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCardsDemo;