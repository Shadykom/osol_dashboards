import { BaseWidget } from './BaseWidget';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function KPIWidget({
  id,
  title,
  value,
  change,
  trend = 'up',
  description,
  icon: Icon,
  isLoading = false,
  error = null,
  clickable = true,
  ...props
}) {
  const navigate = useNavigate();
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000000) {
        return `${(val / 1000000000).toFixed(1)}B`;
      }
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const handleClick = () => {
    if (clickable && id) {
      // Extract the type from the widget ID (e.g., 'customers', 'accounts', etc.)
      const widgetType = id.split('_')[0];
      navigate(`/dashboard/detail/${widgetType}/${id}`);
    }
  };

  return (
    <BaseWidget
      id={id}
      title={title}
      isLoading={isLoading}
      error={error}
      className={cn("h-32", clickable && "cursor-pointer hover:shadow-lg transition-shadow")}
      onClick={handleClick}
      {...props}
    >
      <div className="space-y-3">
        {/* Main Value */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">
            {formatValue(value)}
          </div>
          {Icon && (
            <Icon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Description and Change */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{description}</span>
          
          {change && (
            <div className="flex items-center space-x-1">
              {trend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={cn(
                "text-xs font-medium",
                trend === 'up' ? 'text-green-500' : 'text-red-500'
              )}>
                {change}
              </span>
            </div>
          )}
        </div>
      </div>
    </BaseWidget>
  );
}

