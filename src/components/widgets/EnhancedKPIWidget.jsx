// src/components/widgets/EnhancedKPIWidget.jsx
import { useWidgetData } from '@/hooks/useWidgetData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { formatNumber } from '@/utils/formatters';
import { ClientOnly } from '@/components/ui/ClientOnly';

export function EnhancedKPIWidget({ widgetId, config, onConfigure }) {
  const { data, loading, error, lastUpdated, refetch } = useWidgetData(widgetId, config);
  
  if (loading && !data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-4 w-[150px] mt-2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Error loading widget</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={refetch}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value) => {
    if (!value) return '0';
    
    switch (config.format) {
      case 'currency':
        return `${config.prefix || ''}${(value / 1000000).toFixed(1)}M${config.suffix || ''}`;
      case 'percent':
        return `${value.toFixed(config.decimals || 0)}%`;
      case 'compact':
        return new Intl.NumberFormat('en', { 
          notation: 'compact',
          maximumFractionDigits: 1 
        }).format(value);
      default:
        return `${config.prefix || ''}${formatNumber(value)}${config.suffix || ''}`;
    }
  };

  const value = data?.value || 0;
  const comparison = data?.comparison || { value: 0, change: 0 };
  const sparklineData = data?.sparkline || [];
  const trend = comparison.change >= 0 ? 'up' : 'down';

  return (
    <Card className="h-full relative group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{config.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={refetch}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {config.subtitle && (
          <p className="text-xs text-muted-foreground">{config.subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold">{formatValue(value)}</div>
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </div>

          {config.showComparison && comparison && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{comparison.change > 0 ? '+' : ''}{comparison.change.toFixed(1)}%</span>
              <span className="text-muted-foreground">
                vs {config.comparisonType?.replace('_', ' ')}
              </span>
            </div>
          )}

          {config.showSparkline && sparklineData.length > 0 && (
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={config.colors?.primary || '#E6B800'} 
                    strokeWidth={2} 
                    dot={false} 
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      return (
                        <div className="bg-background border rounded px-2 py-1 text-xs">
                          {formatValue(payload[0].value)}
                        </div>
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Threshold indicators */}
          {config.thresholds?.map((threshold, index) => {
            const exceeded = threshold.operator === 'greater_than' 
              ? value > threshold.value 
              : value < threshold.value;
            
            if (!exceeded) return null;
            
            return (
              <div 
                key={index}
                className="text-xs px-2 py-1 rounded"
                style={{ 
                  backgroundColor: `${threshold.color}20`,
                  color: threshold.color 
                }}
              >
                {threshold.name}: {formatValue(threshold.value)}
              </div>
            );
          })}
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-3">
                          Updated <ClientOnly fallback="--:--:--">{new Date(lastUpdated).toLocaleTimeString('en-US')}</ClientOnly>
          </p>
        )}
      </CardContent>
    </Card>
  );
}