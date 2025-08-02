import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Sparkles,
  Clock,
  Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';

const ComparisonControls = ({ onComparisonChange, className }) => {
  const { t } = useTranslation();
  const [comparisonType, setComparisonType] = useState('month-to-month');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(['all']);
  
  const comparisonOptions = [
    { 
      value: 'month-to-month', 
      label: t('collectionOverview.monthToMonth'), 
      icon: Calendar,
      description: t('collectionOverview.compareMonthlyPerformance')
    },
    { 
      value: 'quarter-to-quarter', 
      label: t('collectionOverview.quarterToQuarter'), 
      icon: CalendarDays,
      description: t('collectionOverview.compareQuarterlyTrends')
    },
    { 
      value: 'year-to-year', 
      label: t('collectionOverview.yearToYear'), 
      icon: CalendarRange,
      description: t('collectionOverview.compareAnnualGrowth')
    },
    { 
      value: 'week-to-week', 
      label: t('collectionOverview.weekToWeek'), 
      icon: Clock,
      description: t('collectionOverview.compareWeeklyChanges')
    },
    { 
      value: 'custom', 
      label: t('collectionOverview.customPeriod'), 
      icon: Target,
      description: t('collectionOverview.defineYourComparison')
    }
  ];

  const metricOptions = [
    { value: 'all', label: t('collectionOverview.allMetrics') },
    { value: 'revenue', label: t('collectionOverview.revenue') },
    { value: 'loans', label: t('collectionOverview.loans') },
    { value: 'deposits', label: t('collectionOverview.deposits') },
    { value: 'customers', label: t('collectionOverview.customers') },
    { value: 'npl', label: t('collectionOverview.nplRatio') },
    { value: 'risk', label: t('collectionOverview.riskScore') },
    { value: 'compliance', label: t('collectionOverview.compliance') }
  ];

  const handleComparisonChange = (type) => {
    setComparisonType(type);
    onComparisonChange({
      type,
      customRange: customDateRange,
      metrics: selectedMetrics
    });
  };

  const handleMetricToggle = (metric) => {
    let newMetrics;
    
    if (metric === 'all') {
      newMetrics = ['all'];
      setSelectedMetrics(['all']);
    } else {
      newMetrics = selectedMetrics.includes('all') 
        ? [metric]
        : selectedMetrics.includes(metric)
          ? selectedMetrics.filter(m => m !== metric)
          : [...selectedMetrics, metric];
      
      setSelectedMetrics(newMetrics.length === 0 ? ['all'] : newMetrics);
    }
    
    onComparisonChange({
      type: comparisonType,
      customRange: customDateRange,
      metrics: newMetrics.length === 0 ? ['all'] : newMetrics
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('collectionOverview.comparisonControls')}</h3>
                <p className="text-sm text-muted-foreground">{t('collectionOverview.analyzePerformance')}</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {t('collectionOverview.aiInsightsAvailable')}
            </Badge>
          </div>

          {/* Comparison Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">{t('collectionOverview.comparisonPeriod')}</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {comparisonOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = comparisonType === option.value;
                
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleComparisonChange(option.value)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50 bg-white dark:bg-gray-800"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="comparison-selector"
                        className="absolute inset-0 bg-primary/10 rounded-xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className="relative space-y-2">
                      <Icon className={cn(
                        "h-5 w-5 mx-auto",
                        isSelected ? "text-primary" : "text-gray-500"
                      )} />
                      <div className="text-xs font-medium">{option.label}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range */}
          {comparisonType === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <label className="text-sm font-medium">{t('collectionOverview.selectDateRange')}</label>
              <DatePickerWithRange
                date={customDateRange}
                onDateChange={(range) => {
                  setCustomDateRange(range);
                  handleComparisonChange('custom');
                }}
                className="w-full"
              />
            </motion.div>
          )}

          {/* Metric Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">{t('collectionOverview.metricsToCompare')}</label>
            <div className="flex flex-wrap gap-2">
              {metricOptions.map((metric) => (
                <Badge
                  key={metric.value}
                  variant={selectedMetrics.includes(metric.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => handleMetricToggle(metric.value)}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {metric.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                {t('collectionOverview.generateReport')}
              </Button>
              <Button variant="outline" size="sm">
                {t('collectionOverview.exportData')}
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {t('collectionOverview.moreOptions')}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>{t('collectionOverview.saveComparison')}</DropdownMenuItem>
                <DropdownMenuItem>{t('collectionOverview.loadPrevious')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{t('collectionOverview.scheduleReport')}</DropdownMenuItem>
                <DropdownMenuItem>{t('collectionOverview.shareDashboard')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ComparisonControls;