// src/services/widgetService.js
import { DashboardService } from './dashboardService';
import { WIDGET_CATALOG } from '@/constants/widgetCatalog';

export const WidgetService = {
  // Get available widgets for a category
  getWidgetsByCategory: async (category) => {
    // This would typically fetch from your backend
    return WIDGET_CATALOG[category]?.widgets || {};
  },

  // Save widget configuration
  saveWidgetConfig: async (widgetId, config) => {
    try {
      // Save to backend
      const response = await fetch(`/api/widgets/${widgetId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving widget config:', error);
      // Fallback to localStorage
      const configs = JSON.parse(localStorage.getItem('widgetConfigs') || '{}');
      configs[widgetId] = config;
      localStorage.setItem('widgetConfigs', JSON.stringify(configs));
      return config;
    }
  },

  // Load widget configuration
  loadWidgetConfig: async (widgetId) => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}/config`);
      return await response.json();
    } catch (error) {
      // Fallback to localStorage
      const configs = JSON.parse(localStorage.getItem('widgetConfigs') || '{}');
      return configs[widgetId] || null;
    }
  },

  // Execute widget query
  executeWidgetQuery: async (config) => {
    const { dataSource, metric, filters, timeRange, aggregation, customQuery } = config;

    if (customQuery) {
      // Execute custom query
      return await DashboardService.executeCustomQuery(customQuery);
    }

    // Build and execute standard query
    const query = {
      source: dataSource,
      metric,
      filters,
      timeRange,
      aggregation
    };

    return await DashboardService.getWidgetData(query);
  }
};