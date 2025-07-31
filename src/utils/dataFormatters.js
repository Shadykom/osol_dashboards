// Data formatting utilities
//
// These helper functions centralise number and date formatting used across
// widgets, charts and exports.  They mirror the logic in the provided
// documentation and attempt to infer sensible default formats (currency,
// percentages, abbreviations) based on the input value.

export const formatValue = (value, type = 'auto') => {
  if (value === null || value === undefined) return 'N/A';

  if (type === 'auto') {
    if (typeof value === 'number') {
      if (value >= 1_000_000) {
        return formatCurrency(value);
      } else if (value < 100 && value % 1 !== 0) {
        return `${value.toFixed(2)}%`;
      } else {
        return formatNumber(value);
      }
    }
    return value;
  }

  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'number':
      return formatNumber(value);
    case 'percent':
      return `${value.toFixed(2)}%`;
    case 'date':
      return formatDate(value);
    default:
      return value;
  }
};

export const formatTitle = (key) => {
  return key
    .split(/(?=[A-Z])|_/)
    .map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

export const formatCurrency = (value, currency = 'SAR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatNumber = (value) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};