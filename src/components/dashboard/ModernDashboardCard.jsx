import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const ModernDashboardCard = ({ 
  title, 
  value, 
  currency = '',
  trend, 
  trendValue, 
  icon, 
  cardType,
  color = 'blue',
  className
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/dashboard/modern-detail/${cardType}`);
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('en-US');
    }
    return val;
  };

  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/20',
    green: 'from-green-500/20 to-green-600/20 border-green-500/20',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/20',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/20',
    red: 'from-red-500/20 to-red-600/20 border-red-500/20',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Gradient background blur effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity",
        colorClasses[color]
      )} />
      
      {/* Main card */}
      <Card className={cn(
        "relative backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-0 shadow-xl transition-all duration-300",
        "hover:shadow-2xl",
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title || 'Untitled Card'}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">
                  {currency && `${currency} `}{formatValue(value)}
                </h3>
                {trend && trendValue && (
                  <div className="flex items-center gap-1">
                    {trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      trend === 'up' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {trendValue}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                vs last period
              </p>
            </div>
            {icon && (
              <div className={cn(
                "p-3 rounded-full bg-gradient-to-br",
                colorClasses[color]
              )}>
                {icon}
              </div>
            )}
          </div>
          
          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ModernDashboardCard;