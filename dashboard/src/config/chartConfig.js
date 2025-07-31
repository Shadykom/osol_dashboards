// Chart configuration helpers
//
// These functions wrap chart configuration definitions for different chart types
// supported by the dashboard.  When integrating with a charting library like
// Chart.js or Recharts you can convert these definitions to the library
// specific options.

import { formatValue } from '../utils/dataFormatters.js';

export const getChartConfig = (type, data, options = {}) => {
  const defaultColors = [
    '#E6B800',
    '#4A5568',
    '#68D391',
    '#63B3ED',
    '#F687B3',
    '#9F7AEA'
  ];

  switch (type) {
    case 'line':
      return {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: options.showLegend ?? true,
              position: 'bottom'
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = formatValue(context.parsed.y);
                  return `${label}: ${value}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: options.showGrid ?? true
              }
            },
            y: {
              grid: {
                display: options.showGrid ?? true
              },
              ticks: {
                callback: (value) => formatValue(value)
              }
            }
          },
          ...options
        }
      };

    case 'bar':
      return {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: options.showLegend ?? false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => formatValue(value)
              }
            }
          },
          ...options
        }
      };

    case 'pie':
    case 'donut':
      return {
        type: 'pie',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: type === 'donut' ? '50%' : 0,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                generateLabels: (chart) => {
                  const chartData = chart.data;
                  const total = chartData.datasets[0].data.reduce(
                    (a, b) => a + b,
                    0
                  );

                  return chartData.labels.map((label, i) => {
                    const value = chartData.datasets[0].data[i];
                    const percentage = ((value / total) * 100).toFixed(1);
                    return {
                      text: `${label} (${percentage}%)`,
                      fillStyle: chartData.datasets[0].backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = formatValue(context.parsed);
                  const total = context.dataset.data.reduce(
                    (a, b) => a + b,
                    0
                  );
                  const percentage = ((context.parsed / total) * 100).toFixed(
                    1
                  );
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          ...options
        }
      };

    case 'area':
      return {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: options.showLegend ?? true
            },
            filler: {
              propagate: false
            }
          },
          elements: {
            line: {
              tension: 0.4
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => formatValue(value)
              }
            }
          },
          fill: true,
          ...options
        }
      };

    default:
      return {
        type: type,
        data: data,
        options: options
      };
  }
};

export const getChartType = (key) => {
  const chartTypeMap = {
    byAccountType: 'pie',
    byBranch: 'bar',
    bySegment: 'donut',
    byProductCategory: 'pie',
    byStatus: 'bar',
    byAge: 'bar',
    trends: 'line',
    monthly: 'area'
  };
  return chartTypeMap[key] || 'bar';
};

export const getTrendChartType = (section, widgetId) => {
  if (section === 'overview' && widgetId === 'monthly_revenue') return 'area';
  if (section === 'banking' && widgetId === 'transaction_trends') return 'line';
  if (section === 'lending') return 'composed';
  return 'line';
};