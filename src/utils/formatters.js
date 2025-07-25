import i18n from '@/i18n/i18n';

export function formatNumber(number, options = {}) {
  // Always use English locale for numbers
  const locale = 'en-US';
  return new Intl.NumberFormat(locale, options).format(number);
}

export function formatCurrency(amount, currency = 'SAR') {
  // Always use English locale for numbers
  const locale = 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date, options = {}) {
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
}

export function formatTime(date, options = {}) {
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
}

export function formatPercentage(value, decimals = 1) {
  // Always use English locale for numbers
  const locale = 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}