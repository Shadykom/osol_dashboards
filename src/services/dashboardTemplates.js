// services/dashboardTemplates.js
export const DashboardTemplates = {
  executive: {
    id: 'executive',
    name: 'Executive Overview',
    description: 'High-level KPIs and strategic metrics for executives',
    icon: 'TrendingUp',
    category: 'Leadership',
    thumbnail: '/templates/executive-thumb.png',
    layout: {
      lg: [
        { i: 'revenue_kpi', x: 0, y: 0, w: 3, h: 2 },
        { i: 'customers_kpi', x: 3, y: 0, w: 3, h: 2 },
        { i: 'deposits_kpi', x: 6, y: 0, w: 3, h: 2 },
        { i: 'loans_kpi', x: 9, y: 0, w: 3, h: 2 },
        { i: 'revenue_trend', x: 0, y: 2, w: 6, h: 4 },
        { i: 'customer_segments', x: 6, y: 2, w: 6, h: 4 },
        { i: 'branch_performance', x: 0, y: 6, w: 8, h: 4 },
        { i: 'compliance_status', x: 8, y: 6, w: 4, h: 4 }
      ]
    },
    widgets: {
      revenue_kpi: {
        type: 'kpi',
        config: {
          title: 'Monthly Revenue',
          dataSource: 'revenue',
          metric: 'total_revenue',
          format: 'currency',
          showComparison: true,
          comparisonType: 'previous_month',
          showSparkline: true,
          thresholds: [
            { name: 'Target', value: 5000000, color: '#68D391', operator: 'greater_than' }
          ]
        }
      },
      customers_kpi: {
        type: 'kpi',
        config: {
          title: 'Total Customers',
          dataSource: 'customers',
          metric: 'total_count',
          format: 'compact',
          showComparison: true,
          comparisonType: 'previous_month',
          showTrend: true
        }
      },
      deposits_kpi: {
        type: 'kpi',
        config: {
          title: 'Total Deposits',
          dataSource: 'accounts',
          metric: 'total_deposits',
          format: 'currency',
          prefix: 'SAR ',
          showComparison: true,
          comparisonType: 'previous_year'
        }
      },
      loans_kpi: {
        type: 'kpi',
        config: {
          title: 'Loan Portfolio',
          dataSource: 'loans',
          metric: 'total_outstanding',
          format: 'currency',
          prefix: 'SAR ',
          showComparison: true,
          showSparkline: true
        }
      },
      revenue_trend: {
        type: 'chart',
        config: {
          title: 'Revenue Trend',
          subtitle: 'Monthly revenue over time',
          chartType: 'area',
          dataSource: 'revenue',
          timeRange: 'last_12_months',
          dimensions: ['month'],
          measures: ['revenue', 'target'],
          showLegend: true,
          showGrid: true,
          colors: {
            primary: '#E6B800',
            secondary: '#68D391'
          },
          chartOptions: {
            smooth: true,
            gradient: true
          }
        }
      },
      customer_segments: {
        type: 'chart',
        config: {
          title: 'Customer Segments',
          chartType: 'pie',
          dataSource: 'customers',
          dimensions: ['segment'],
          measures: ['count'],
          showLegend: true,
          chartOptions: {
            donut: true,
            labels: true,
            percentages: true
          }
        }
      },
      branch_performance: {
        type: 'chart',
        config: {
          title: 'Branch Performance Comparison',
          chartType: 'composed',
          dataSource: 'branches',
          dimensions: ['branch'],
          measures: ['revenue', 'customers', 'efficiency'],
          showLegend: true,
          chartOptions: {
            multiAxis: true
          }
        }
      },
      compliance_status: {
        type: 'gauge',
        config: {
          title: 'Compliance Score',
          dataSource: 'compliance',
          metric: 'overall_score',
          format: 'percent',
          thresholds: [
            { name: 'Critical', value: 60, color: '#FC8181', operator: 'less_than' },
            { name: 'Warning', value: 80, color: '#F6AD55', operator: 'less_than' },
            { name: 'Good', value: 90, color: '#68D391', operator: 'greater_than' }
          ]
        }
      }
    }
  },

  operations: {
    id: 'operations',
    name: 'Operations Dashboard',
    description: 'Real-time operational metrics and system monitoring',
    icon: 'Activity',
    category: 'Operations',
    thumbnail: '/templates/operations-thumb.png',
    layout: {
      lg: [
        { i: 'system_health', x: 0, y: 0, w: 12, h: 2 },
        { i: 'transaction_volume', x: 0, y: 2, w: 4, h: 3 },
        { i: 'response_time', x: 4, y: 2, w: 4, h: 3 },
        { i: 'error_rate', x: 8, y: 2, w: 4, h: 3 },
        { i: 'transaction_flow', x: 0, y: 5, w: 8, h: 5 },
        { i: 'alerts_feed', x: 8, y: 5, w: 4, h: 5 }
      ]
    },
    widgets: {
      system_health: {
        type: 'status_bar',
        config: {
          title: 'System Health Overview',
          dataSource: 'system_health',
          refreshInterval: 10,
          components: [
            { name: 'Core Banking', status: 'operational' },
            { name: 'Payment Gateway', status: 'operational' },
            { name: 'Mobile Banking', status: 'degraded' },
            { name: 'ATM Network', status: 'operational' }
          ]
        }
      },
      transaction_volume: {
        type: 'kpi',
        config: {
          title: 'Transaction Volume',
          subtitle: 'Last 24 hours',
          dataSource: 'transactions',
          metric: 'total_count',
          format: 'compact',
          refreshInterval: 30,
          showSparkline: true,
          sparklineType: 'realtime'
        }
      },
      response_time: {
        type: 'kpi',
        config: {
          title: 'Avg Response Time',
          dataSource: 'performance',
          metric: 'avg_response_time',
          format: 'number',
          suffix: 'ms',
          refreshInterval: 10,
          thresholds: [
            { name: 'Slow', value: 1000, color: '#FC8181', operator: 'greater_than' },
            { name: 'Normal', value: 500, color: '#F6AD55', operator: 'greater_than' }
          ]
        }
      },
      error_rate: {
        type: 'kpi',
        config: {
          title: 'Error Rate',
          dataSource: 'performance',
          metric: 'error_rate',
          format: 'percent',
          refreshInterval: 30,
          showTrend: true,
          thresholds: [
            { name: 'High', value: 5, color: '#FC8181', operator: 'greater_than' },
            { name: 'Medium', value: 2, color: '#F6AD55', operator: 'greater_than' }
          ]
        }
      },
      transaction_flow: {
        type: 'chart',
        config: {
          title: 'Real-time Transaction Flow',
          chartType: 'area',
          dataSource: 'transactions_realtime',
          timeRange: 'last_hour',
          refreshInterval: 5,
          dimensions: ['timestamp'],
          measures: ['count', 'volume'],
          chartOptions: {
            smooth: true,
            area: true,
            realtime: true,
            maxDataPoints: 60
          }
        }
      },
      alerts_feed: {
        type: 'activity_feed',
        config: {
          title: 'System Alerts',
          dataSource: 'alerts',
          refreshInterval: 10,
          maxItems: 10,
          filters: [
            { field: 'severity', operator: 'in', value: ['high', 'critical'] }
          ]
        }
      }
    }
  },

  analytics: {
    id: 'analytics',
    name: 'Analytics & Insights',
    description: 'Deep dive analytics with advanced visualizations',
    icon: 'BarChart3',
    category: 'Analytics',
    thumbnail: '/templates/analytics-thumb.png',
    layout: {
      lg: [
        { i: 'customer_cohort', x: 0, y: 0, w: 6, h: 4 },
        { i: 'revenue_forecast', x: 6, y: 0, w: 6, h: 4 },
        { i: 'product_performance', x: 0, y: 4, w: 8, h: 4 },
        { i: 'geo_distribution', x: 8, y: 4, w: 4, h: 4 },
        { i: 'correlation_matrix', x: 0, y: 8, w: 6, h: 4 },
        { i: 'trend_analysis', x: 6, y: 8, w: 6, h: 4 }
      ]
    },
    widgets: {
      customer_cohort: {
        type: 'chart',
        config: {
          title: 'Customer Cohort Analysis',
          chartType: 'heatmap',
          dataSource: 'customer_cohorts',
          dimensions: ['cohort_month', 'age_month'],
          measures: ['retention_rate'],
          colors: {
            gradient: ['#FEF3C7', '#F59E0B', '#DC2626']
          }
        }
      },
      revenue_forecast: {
        type: 'chart',
        config: {
          title: 'Revenue Forecast',
          subtitle: 'ML-based prediction',
          chartType: 'composed',
          dataSource: 'revenue_forecast',
          dimensions: ['month'],
          measures: ['actual', 'forecast', 'confidence_upper', 'confidence_lower'],
          chartOptions: {
            showConfidenceBands: true,
            forecastLine: 'dashed'
          }
        }
      },
      product_performance: {
        type: 'chart',
        config: {
          title: 'Product Performance Matrix',
          chartType: 'scatter',
          dataSource: 'products',
          dimensions: ['growth_rate', 'market_share'],
          measures: ['revenue'],
          chartOptions: {
            bubble: true,
            quadrants: true,
            labels: true
          }
        }
      },
      geo_distribution: {
        type: 'map',
        config: {
          title: 'Geographic Distribution',
          dataSource: 'customers_geo',
          mapType: 'saudi_arabia',
          metric: 'customer_density',
          showHeatmap: true
        }
      },
      correlation_matrix: {
        type: 'chart',
        config: {
          title: 'Metrics Correlation',
          chartType: 'correlation',
          dataSource: 'metrics_correlation',
          metrics: ['revenue', 'customers', 'transactions', 'satisfaction'],
          showValues: true
        }
      },
      trend_analysis: {
        type: 'chart',
        config: {
          title: 'Trend Analysis',
          chartType: 'line',
          dataSource: 'trends',
          dimensions: ['date'],
          measures: ['metric1', 'metric2', 'metric3'],
          chartOptions: {
            showTrendLine: true,
            showSeasonality: true,
            showAnomalies: true
          }
        }
      }
    }
  },

  risk: {
    id: 'risk',
    name: 'Risk Management',
    description: 'Risk monitoring and compliance tracking',
    icon: 'Shield',
    category: 'Risk & Compliance',
    thumbnail: '/templates/risk-thumb.png',
    layout: {
      lg: [
        { i: 'risk_score', x: 0, y: 0, w: 3, h: 3 },
        { i: 'exposure_summary', x: 3, y: 0, w: 3, h: 3 },
        { i: 'compliance_score', x: 6, y: 0, w: 3, h: 3 },
        { i: 'incidents_count', x: 9, y: 0, w: 3, h: 3 },
        { i: 'risk_heatmap', x: 0, y: 3, w: 6, h: 5 },
        { i: 'compliance_timeline', x: 6, y: 3, w: 6, h: 5 },
        { i: 'top_risks', x: 0, y: 8, w: 4, h: 4 },
        { i: 'mitigation_status', x: 4, y: 8, w: 4, h: 4 },
        { i: 'regulatory_updates', x: 8, y: 8, w: 4, h: 4 }
      ]
    },
    widgets: {
      // Risk widget configurations...
    }
  }
};

// Service to manage dashboard templates
export const DashboardTemplateService = {
  // Get all available templates
  getAllTemplates: () => {
    return Object.values(DashboardTemplates);
  },

  // Get template by ID
  getTemplate: (templateId) => {
    return DashboardTemplates[templateId];
  },

  // Get templates by category
  getTemplatesByCategory: (category) => {
    return Object.values(DashboardTemplates).filter(
      template => template.category === category
    );
  },

  // Apply template to dashboard
  applyTemplate: (templateId) => {
    const template = DashboardTemplates[templateId];
    if (!template) throw new Error('Template not found');

    // Convert template to dashboard configuration
    const widgets = new Map();
    const configs = new Map();

    Object.entries(template.widgets).forEach(([widgetId, widgetDef]) => {
      widgets.set(widgetId, {
        type: widgetDef.type,
        category: getWidgetCategory(widgetDef.type)
      });
      configs.set(widgetId, widgetDef.config);
    });

    return {
      layout: template.layout,
      widgets,
      configs,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        appliedAt: new Date().toISOString()
      }
    };
  },

  // Create custom template from current dashboard
  createCustomTemplate: (dashboardConfig) => {
    const template = {
      id: `custom_${Date.now()}`,
      name: dashboardConfig.name || 'Custom Template',
      description: 'User-created custom template',
      icon: 'Sparkles',
      category: 'Custom',
      thumbnail: null,
      layout: dashboardConfig.layout,
      widgets: {}
    };

    // Convert widgets and configs to template format
    dashboardConfig.widgets.forEach(([widgetId, widget]) => {
      const config = dashboardConfig.configs.get(widgetId);
      template.widgets[widgetId] = {
        type: widget.type,
        config: config || {}
      };
    });

    // Save to localStorage or backend
    const savedTemplates = JSON.parse(
      localStorage.getItem('customDashboardTemplates') || '[]'
    );
    savedTemplates.push(template);
    localStorage.setItem('customDashboardTemplates', JSON.stringify(savedTemplates));

    return template;
  },

  // Get widget category helper
  getWidgetCategory: (widgetType) => {
    const categoryMap = {
      kpi: 'metrics',
      chart: 'visualizations',
      table: 'data',
      map: 'geographic',
      gauge: 'metrics',
      status_bar: 'monitoring',
      activity_feed: 'monitoring'
    };
    return categoryMap[widgetType] || 'other';
  }
};

// Real-time data service for live updates
export const RealtimeDataService = {
  subscribers: new Map(),
  connections: new Map(),

  // Subscribe to real-time data
  subscribe: (widgetId, dataSource, callback, options = {}) => {
    const { refreshInterval = 30000, filters = [] } = options;
    
    // Create subscription
    const subscription = {
      widgetId,
      dataSource,
      callback,
      filters,
      refreshInterval,
      intervalId: null
    };

    // Start polling or WebSocket connection
    if (dataSource.includes('realtime')) {
      // Use WebSocket for real-time sources
      RealtimeDataService.connectWebSocket(subscription);
    } else {
      // Use polling for regular sources
      subscription.intervalId = setInterval(() => {
        RealtimeDataService.fetchData(subscription);
      }, refreshInterval);
      
      // Fetch initial data
      RealtimeDataService.fetchData(subscription);
    }

    // Store subscription
    RealtimeDataService.subscribers.set(widgetId, subscription);
    
    return () => RealtimeDataService.unsubscribe(widgetId);
  },

  // Unsubscribe from updates
  unsubscribe: (widgetId) => {
    const subscription = RealtimeDataService.subscribers.get(widgetId);
    if (!subscription) return;

    // Clear interval or close WebSocket
    if (subscription.intervalId) {
      clearInterval(subscription.intervalId);
    }
    if (subscription.ws) {
      subscription.ws.close();
    }

    RealtimeDataService.subscribers.delete(widgetId);
  },

  // Fetch data for subscription
  fetchData: async (subscription) => {
    try {
      const { dataSource, filters, callback } = subscription;
      
      // Simulate API call based on data source
      let data;
      switch (dataSource) {
        case 'transactions':
          data = await RealtimeDataService.getTransactionData(filters);
          break;
        case 'system_health':
          data = await RealtimeDataService.getSystemHealth();
          break;
        case 'performance':
          data = await RealtimeDataService.getPerformanceMetrics();
          break;
        default:
          data = await RealtimeDataService.getGenericData(dataSource, filters);
      }

      // Call the callback with new data
      callback(data);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      callback({ error: error.message });
    }
  },

  // WebSocket connection for true real-time data
  connectWebSocket: (subscription) => {
    const wsUrl = `wss://api.example.com/realtime/${subscription.dataSource}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected for', subscription.dataSource);
      // Send filters if any
      if (subscription.filters.length > 0) {
        ws.send(JSON.stringify({ 
          type: 'subscribe', 
          filters: subscription.filters 
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        subscription.callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Fallback to polling
      subscription.intervalId = setInterval(() => {
        RealtimeDataService.fetchData(subscription);
      }, subscription.refreshInterval);
    };

    ws.onclose = () => {
      console.log('WebSocket closed for', subscription.dataSource);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (RealtimeDataService.subscribers.has(subscription.widgetId)) {
          RealtimeDataService.connectWebSocket(subscription);
        }
      }, 5000);
    };

    subscription.ws = ws;
  },

  // Mock data generators
  getTransactionData: async (filters) => {
    // Simulate transaction data
    return {
      total_count: Math.floor(Math.random() * 1000) + 3000,
      total_volume: Math.floor(Math.random() * 1000000) + 5000000,
      avg_amount: Math.floor(Math.random() * 500) + 1000,
      success_rate: 95 + Math.random() * 4,
      timestamp: new Date().toISOString()
    };
  },

  getSystemHealth: async () => {
    // Simulate system health data
    const statuses = ['operational', 'degraded', 'down'];
    const components = ['Core Banking', 'Payment Gateway', 'Mobile Banking', 'ATM Network'];
    
    return {
      overall_status: 'operational',
      components: components.map(name => ({
        name,
        status: statuses[Math.floor(Math.random() * statuses.length * 0.3)], // Bias towards operational
        uptime: 99 + Math.random(),
        response_time: Math.floor(Math.random() * 200) + 100
      })),
      timestamp: new Date().toISOString()
    };
  },

  getPerformanceMetrics: async () => {
    // Simulate performance metrics
    return {
      avg_response_time: Math.floor(Math.random() * 500) + 200,
      error_rate: Math.random() * 5,
      requests_per_second: Math.floor(Math.random() * 1000) + 500,
      cpu_usage: Math.floor(Math.random() * 30) + 40,
      memory_usage: Math.floor(Math.random() * 20) + 60,
      timestamp: new Date().toISOString()
    };
  },

  getGenericData: async (dataSource, filters) => {
    // Generic data generator
    return {
      dataSource,
      filters,
      value: Math.floor(Math.random() * 10000),
      change: (Math.random() - 0.5) * 20,
      timestamp: new Date().toISOString()
    };
  }
};