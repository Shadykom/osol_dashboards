// src/components/widgets/KPIWidget.jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  X,
  Settings,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

export function KPIWidget({
  id,
  title,
  value,
  change,
  trend = 'up',
  description,
  icon: Icon,
  isLoading = false,
  onRemove,
  onConfigure,
  onRefresh,
  className,
  variant = 'default',
  showActions = true,
  animate = true
}) {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const variants = {
    default: {
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-border'
    },
    success: {
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    warning: {
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    danger: {
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800'
    }
  };

  const currentVariant = variants[variant] || variants.default;

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={cn("p-2 rounded-lg", currentVariant.bgColor)}>
              <Icon className={cn("h-4 w-4", currentVariant.iconColor)} />
            </div>
          )}
          {showActions && (onRemove || onConfigure || onRefresh) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Widget Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onRefresh && (
                  <DropdownMenuItem onClick={onRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </DropdownMenuItem>
                )}
                {onConfigure && (
                  <DropdownMenuItem onClick={onConfigure}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onRemove} className="text-destructive">
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {animate ? (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {value}
                </motion.span>
              ) : (
                value
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
            {change && (
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon className={cn(
                  "h-3 w-3",
                  isPositive ? "text-green-500" : "text-red-500"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-green-500" : "text-red-500"
                )}>
                  {change}
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </>
  );

  return (
    <Card className={cn(
      "relative overflow-hidden group transition-all duration-200 hover:shadow-md",
      currentVariant.borderColor,
      className
    )}>
      {animate ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {cardContent}
        </motion.div>
      ) : (
        cardContent
      )}
      
      {/* Decorative background element */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -mr-16 -mt-16",
        currentVariant.bgColor
      )} />
    </Card>
  );
}