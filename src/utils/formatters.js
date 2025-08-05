import i18n from '@/i18n/i18n';

// Currency formatter
export const formatCurrency = (value, compact = false) => {
  if (value === null || value === undefined) return 'SAR 0';
  
  const formatter = new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact && Math.abs(value) >= 1000000 ? 'compact' : 'standard',
    compactDisplay: 'short'
  });
  
  return formatter.format(value);
};

// Percentage formatter
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0%';
  
  return `${value.toFixed(decimals)}%`;
};

// Number formatter
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0';
  
  const formatter = new Intl.NumberFormat('en-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return formatter.format(value);
};

// Compact number formatter
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined) return '0';
  
  const formatter = new Intl.NumberFormat('en-SA', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  });
  
  return formatter.format(value);
};

// Date formatter
export const formatDate = (date, format = 'PP') => {
  if (!date) return '';
  
  // Using native date formatting instead of date-fns for simplicity
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'PP':
      return dateObj.toLocaleDateString('en-SA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    case 'PPP':
      return dateObj.toLocaleDateString('en-SA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'PPp':
      return dateObj.toLocaleString('en-SA', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return dateObj.toLocaleDateString('en-SA');
  }
};

// Format change with arrow
export const formatChange = (value, previousValue) => {
  if (!previousValue || previousValue === 0) return { value: 0, percentage: 0, trend: 'neutral' };
  
  const change = value - previousValue;
  const percentage = (change / previousValue) * 100;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return {
    value: change,
    percentage,
    trend,
    formatted: `${trend === 'up' ? '+' : ''}${formatCurrency(change)} (${trend === 'up' ? '+' : ''}${formatPercentage(percentage)})`
  };
};