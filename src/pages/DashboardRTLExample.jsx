import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  PageWrapper, 
  PageSection, 
  PageGrid, 
  PageCard 
} from '@/components/layout/PageWrapper';
import { RTLFlex, RTLText, RTLIcon, useRTLClasses } from '@/components/ui/rtl-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  CreditCard,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Stat Card Component with RTL support
const StatCard = ({ title, value, change, icon: Icon, trend }) => {
  const { isRTL } = useRTLClasses();
  const isPositive = trend === 'up';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <RTLFlex className="justify-between items-start" responsive={false}>
          <div>
            <p className={cn(
              "text-sm font-medium text-muted-foreground",
              isRTL ? "text-right" : "text-left"
            )}>
              {title}
            </p>
            <p className={cn(
              "text-2xl font-bold mt-1",
              isRTL ? "text-right" : "text-left"
            )}>
              {value}
            </p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </RTLFlex>
      </CardHeader>
      <CardContent>
        <RTLFlex className="items-center gap-2" responsive={false}>
          {isPositive ? (
            <ArrowUp className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-600" />
          )}
          <span className={cn(
            "text-sm font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {change}
          </span>
          <span className="text-sm text-muted-foreground">
            {isRTL ? "مقارنة بالشهر الماضي" : "vs last month"}
          </span>
        </RTLFlex>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const DashboardRTLExample = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isRTL, isMobile } = useRTLClasses();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sample data
  const stats = [
    {
      title: t('dashboard.totalCustomers'),
      value: '125,432',
      change: '+12.5%',
      icon: Users,
      trend: 'up'
    },
    {
      title: t('dashboard.totalDeposits'),
      value: 'SAR 2.4B',
      change: '+8.3%',
      icon: DollarSign,
      trend: 'up'
    },
    {
      title: t('dashboard.activeAccounts'),
      value: '98,765',
      change: '-2.1%',
      icon: CreditCard,
      trend: 'down'
    },
    {
      title: t('dashboard.totalLoans'),
      value: 'SAR 1.8B',
      change: '+15.7%',
      icon: TrendingUp,
      trend: 'up'
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  // Page Actions
  const pageActions = (
    <>
      <Button
        variant="outline"
        size={isMobile ? "sm" : "default"}
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn(
          "w-4 h-4",
          isRTL ? "ml-2" : "mr-2",
          isRefreshing && "animate-spin"
        )} />
        {t('common.refresh')}
      </Button>
      <Button
        variant="outline"
        size={isMobile ? "sm" : "default"}
      >
        <Filter className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
        {t('common.filter')}
      </Button>
      <Button
        size={isMobile ? "sm" : "default"}
      >
        <Download className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
        {t('common.export')}
      </Button>
    </>
  );

  return (
    <PageWrapper
      title={t('dashboard.title')}
      subtitle={t('dashboard.welcomeBack')}
      actions={pageActions}
    >
      {/* Key Metrics Section */}
      <PageSection
        title={t('dashboard.keyMetrics')}
        description={t('dashboard.keyMetricsDesc')}
      >
        <PageGrid cols={1} smCols={2} lgCols={4} gap={4}>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </PageGrid>
      </PageSection>

      {/* Recent Activity Section */}
      <PageSection
        title={t('dashboard.recentActivity')}
        actions={
          <Button variant="ghost" size="sm">
            {t('common.viewAll')}
          </Button>
        }
      >
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={cn(
                "flex items-center justify-between",
                "p-4 rounded-lg border",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                "transition-colors cursor-pointer"
              )}
            >
              <RTLFlex className="items-center gap-3" responsive={false}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className={cn(
                    "font-medium",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    {isRTL ? `عميل جديد #${item}` : `New Customer #${item}`}
                  </p>
                  <p className={cn(
                    "text-sm text-muted-foreground",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    {isRTL ? "منذ 5 دقائق" : "5 minutes ago"}
                  </p>
                </div>
              </RTLFlex>
              <Button variant="ghost" size="sm">
                {t('common.viewDetails')}
              </Button>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Quick Actions Grid */}
      <PageSection title={t('dashboard.quickActions')}>
        <PageGrid cols={2} smCols={3} mdCols={4} gap={3}>
          {[
            { label: t('navigation.addCustomer'), icon: Users, path: '/customers/new' },
            { label: t('navigation.openAccount'), icon: CreditCard, path: '/accounts/new' },
            { label: t('navigation.newLoan'), icon: DollarSign, path: '/loans/new' },
            { label: t('navigation.reports'), icon: TrendingUp, path: '/reports' },
          ].map((action, index) => (
            <PageCard
              key={index}
              title={action.label}
              icon={action.icon}
              hoverable
              onClick={() => navigate(action.path)}
              className="text-center cursor-pointer"
            >
              <div className="mt-2">
                <Button variant="link" size="sm" className="p-0">
                  {t('common.goTo')} →
                </Button>
              </div>
            </PageCard>
          ))}
        </PageGrid>
      </PageSection>
    </PageWrapper>
  );
};

export default DashboardRTLExample;