import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, Line, ResponsiveContainer, Tooltip
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const formatNumber = (value, decimals = 0) => {
  if (value == null) return '-';
  if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
  return new Intl.NumberFormat().format(value);
};

const formatCurrency = (value, currency = 'SAR') => {
  if (value == null) return '-';
  return `${currency} ${formatNumber(value, 2)}`;
};

const formatPercentage = (value, decimals = 1) => {
  if (value == null) return '-';
  return `${value.toFixed(decimals)}%`;
};

export function EnhancedMetricCard({ 
  title, 
  value, 
  previousValue, 
  icon: Icon,
  trend,
  format = 'number',
  target,
  description,
  onClick,
  onExport,
  onViewDetails,
  className,
  color = 'primary',
  showProgress = false,
  showTrend = true,
  size = 'default'
}) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : null;
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const targetProgress = target ? (value / target) * 100 : null;
  
  const formatValue = (val) => {
    switch (format) {
      case 'currency': return formatCurrency(val);
      case 'percentage': return formatPercentage(val);
      default: return formatNumber(val);
    }
  };

  const getChangeIcon = () => {
    if (isNeutral) return Minus;
    return isPositive ? TrendingUp : TrendingDown;
  };

  const getChangeColor = () => {
    if (isNeutral) return 'text-gray-500';
    return isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getCardColor = () => {
    const colors = {
      primary: 'border-l-primary',
      success: 'border-l-green-500',
      warning: 'border-l-yellow-500',
      danger: 'border-l-red-500',
      info: 'border-l-blue-500'
    };
    return colors[color] || colors.primary;
  };

  const ChangeIcon = getChangeIcon();

  const cardContent = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-lg border-l-4 h-full",
          getCardColor(),
          size === 'compact' && "p-2",
          className
        )}
        onClick={onClick}
      >
        <CardHeader className={cn(
          "pb-2",
          size === 'compact' && "p-3"
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className={cn(
                    "p-2 rounded-lg",
                    `bg-${color}/10`
                  )}>
                    <Icon className={cn(
                      "text-muted-foreground",
                      size === 'compact' ? "h-4 w-4" : "h-5 w-5"
                    )} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className={cn(
                    "font-medium text-muted-foreground",
                    size === 'compact' ? "text-xs" : "text-sm"
                  )}>
                    {title}
                  </h3>
                  {description && size !== 'compact' && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {(onExport || onViewDetails) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewDetails && (
                    <DropdownMenuItem onClick={onViewDetails}>
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onExport && (
                    <DropdownMenuItem onClick={onExport}>
                      Export Data
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className={cn(
          size === 'compact' && "p-3 pt-0"
        )}>
          <div className="space-y-3">
            {/* Main Value */}
            <div className="flex items-baseline gap-2">
              <div className={cn(
                "font-bold",
                size === 'compact' ? "text-xl" : "text-2xl"
              )}>
                {formatValue(value)}
              </div>
              {target && (
                <span className="text-xs text-muted-foreground">
                  / {formatValue(target)}
                </span>
              )}
            </div>
            
            {/* Change Indicator */}
            {previousValue != null && showTrend && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant={isPositive ? "success" : isNeutral ? "secondary" : "destructive"} 
                  className="text-xs gap-1"
                >
                  <ChangeIcon className="h-3 w-3" />
                  {Math.abs(change).toFixed(1)}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  vs {formatValue(previousValue)}
                </span>
              </div>
            )}
            
            {/* Progress Bar */}
            {showProgress && targetProgress != null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{targetProgress.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={targetProgress} 
                  className="h-2"
                  indicatorClassName={cn(
                    targetProgress >= 100 && "bg-green-500",
                    targetProgress >= 75 && targetProgress < 100 && "bg-blue-500",
                    targetProgress >= 50 && targetProgress < 75 && "bg-yellow-500",
                    targetProgress < 50 && "bg-red-500"
                  )}
                />
              </div>
            )}
            
            {/* Sparkline Chart */}
            {trend && trend.length > 0 && size !== 'compact' && (
              <div className="h-12 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border rounded px-2 py-1">
                            <p className="text-xs font-medium">
                              {formatValue(payload[0].value)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={isPositive ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Additional Info */}
            {(change !== null || target) && size !== 'compact' && (
              <div className="pt-2 border-t space-y-1">
                {change !== null && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Change</span>
                    <span className={cn("font-medium", getChangeColor())}>
                      {isPositive && '+'}{change.toFixed(1)}%
                    </span>
                  </div>
                )}
                {target && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium">
                      {formatValue(target)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return cardContent;
}