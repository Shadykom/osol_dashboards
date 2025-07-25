// utils/dashboardUtils.js
import { toast } from 'sonner';

export const DashboardUtils = {
  // Generate unique widget ID
  generateWidgetId: (type) => {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Calculate optimal widget position
  calculateOptimalPosition: (layouts, newWidget) => {
    if (!layouts || layouts.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find the lowest available Y position
    let maxY = 0;
    layouts.forEach(item => {
      const bottomY = item.y + item.h;
      if (bottomY > maxY) maxY = bottomY;
    });

    // Try to find space in existing rows first
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x <= 12 - newWidget.w; x++) {
        if (DashboardUtils.canPlaceWidget(layouts, x, y, newWidget.w, newWidget.h)) {
          return { x, y };
        }
      }
    }

    // Place at the bottom if no space found
    return { x: 0, y: maxY };
  },

  // Check if widget can be placed at position
  canPlaceWidget: (layouts, x, y, w, h) => {
    const newArea = { x, y, w, h };
    
    return !layouts.some(item => {
      const existingArea = { 
        x: item.x, 
        y: item.y, 
        w: item.w, 
        h: item.h 
      };
      return DashboardUtils.doAreasOverlap(newArea, existingArea);
    });
  },

  // Check if two areas overlap
  doAreasOverlap: (area1, area2) => {
    return !(
      area1.x + area1.w <= area2.x ||
      area2.x + area2.w <= area1.x ||
      area1.y + area1.h <= area2.y ||
      area2.y + area2.h <= area1.y
    );
  },

  // Validate dashboard configuration
  validateDashboardConfig: (config) => {
    const errors = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('Dashboard name is required');
    }

    if (!config.layouts || Object.keys(config.layouts).length === 0) {
      errors.push('Dashboard must have at least one layout');
    }

    if (!config.widgets || config.widgets.size === 0) {
      errors.push('Dashboard must have at least one widget');
    }

    // Validate widget configurations
    config.widgets.forEach((widget, widgetId) => {
      const widgetConfig = config.configs?.get(widgetId);
      if (!widgetConfig?.title) {
        errors.push(`Widget ${widgetId} must have a title`);
      }
      if (!widgetConfig?.dataSource) {
        errors.push(`Widget ${widgetId} must have a data source`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Export dashboard configuration
  exportDashboard: (dashboardConfig) => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      dashboard: {
        name: dashboardConfig.name,
        description: dashboardConfig.description,
        theme: dashboardConfig.theme,
        settings: dashboardConfig.settings,
        layouts: dashboardConfig.layouts,
        widgets: Array.from(dashboardConfig.widgets.entries()),
        configs: Array.from(dashboardConfig.configs.entries())
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${dashboardConfig.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Dashboard exported successfully');
  },

  // Import dashboard configuration
  importDashboard: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // Validate import data
          if (!importData.version || !importData.dashboard) {
            throw new Error('Invalid dashboard file format');
          }

          // Convert arrays back to Maps
          const dashboard = {
            ...importData.dashboard,
            widgets: new Map(importData.dashboard.widgets),
            configs: new Map(importData.dashboard.configs)
          };

          resolve(dashboard);
        } catch (error) {
          reject(new Error(`Failed to import dashboard: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  },

  // Clone dashboard configuration
  cloneDashboard: (dashboardConfig, newName) => {
    return {
      ...dashboardConfig,
      name: newName || `${dashboardConfig.name} (Copy)`,
      id: DashboardUtils.generateWidgetId('dashboard'),
      widgets: new Map(dashboardConfig.widgets),
      configs: new Map(dashboardConfig.configs),
      layouts: JSON.parse(JSON.stringify(dashboardConfig.layouts))
    };
  },

  // Optimize layout to remove gaps
  optimizeLayout: (layout) => {
    // Sort by Y then X
    const sorted = [...layout].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });

    // Compact vertically
    const optimized = [];
    sorted.forEach(item => {
      let newY = 0;
      
      // Find the lowest Y position where this item can fit
      for (let y = 0; y <= 100; y++) {
        const canPlace = !optimized.some(existing => {
          return DashboardUtils.doAreasOverlap(
            { x: item.x, y, w: item.w, h: item.h },
            { x: existing.x, y: existing.y, w: existing.w, h: existing.h }
          );
        });
        
        if (canPlace) {
          newY = y;
          break;
        }
      }

      optimized.push({
        ...item,
        y: newY
      });
    });

    return optimized;
  }
};

// hooks/useDashboardState.js
import { useState, useCallback, useEffect } from 'react';
import { DashboardService } from '@/services/dashboardService';

export function useDashboardState(initialConfig = null) {
  const [dashboardId, setDashboardId] = useState(initialConfig?.id || null);
  const [dashboardName, setDashboardName] = useState(initialConfig?.name || 'My Dashboard');
  const [layouts, setLayouts] = useState(initialConfig?.layouts || {});
  const [widgets, setWidgets] = useState(new Map(initialConfig?.widgets || []));
  const [widgetConfigs, setWidgetConfigs] = useState(new Map(initialConfig?.configs || []));
  const [theme, setTheme] = useState(initialConfig?.theme || 'default');
  const [settings, setSettings] = useState(initialConfig?.settings || {
    autoRefresh: true,
    refreshInterval: 30000,
    showGridLines: true,
    compactMode: false
  });
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Mark dashboard as dirty when changes occur
  useEffect(() => {
    setIsDirty(true);
  }, [layouts, widgets, widgetConfigs, dashboardName, theme, settings]);

  // Add widget
  const addWidget = useCallback((widgetType, widgetDefinition) => {
    const widgetId = DashboardUtils.generateWidgetId(widgetType);
    const position = DashboardUtils.calculateOptimalPosition(
      layouts.lg || [],
      widgetDefinition.defaultSize
    );

    const newLayout = {
      i: widgetId,
      x: position.x,
      y: position.y,
      ...widgetDefinition.defaultSize,
      minW: widgetDefinition.minW,
      minH: widgetDefinition.minH
    };

    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg || []), newLayout]
    }));

    setWidgets(prev => {
      const newMap = new Map(prev);
      newMap.set(widgetId, {
        type: widgetType,
        category: widgetDefinition.category
      });
      return newMap;
    });

    // Set default configuration
    if (widgetDefinition.defaultConfig) {
      setWidgetConfigs(prev => {
        const newMap = new Map(prev);
        newMap.set(widgetId, widgetDefinition.defaultConfig);
        return newMap;
      });
    }

    return widgetId;
  }, [layouts]);

  // Remove widget
  const removeWidget = useCallback((widgetId) => {
    setLayouts(prev => ({
      ...prev,
      lg: prev.lg?.filter(item => item.i !== widgetId) || []
    }));

    setWidgets(prev => {
      const newMap = new Map(prev);
      newMap.delete(widgetId);
      return newMap;
    });

    setWidgetConfigs(prev => {
      const newMap = new Map(prev);
      newMap.delete(widgetId);
      return newMap;
    });
  }, []);

  // Update widget configuration
  const updateWidgetConfig = useCallback((widgetId, config) => {
    setWidgetConfigs(prev => {
      const newMap = new Map(prev);
      newMap.set(widgetId, config);
      return newMap;
    });
  }, []);

  // Save dashboard
  const saveDashboard = useCallback(async () => {
    const dashboardConfig = {
      id: dashboardId,
      name: dashboardName,
      layouts,
      widgets: Array.from(widgets.entries()),
      configs: Array.from(widgetConfigs.entries()),
      theme,
      settings
    };

    try {
      // Validate before saving
      const validation = DashboardUtils.validateDashboardConfig(dashboardConfig);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Save to backend or localStorage
      if (dashboardId) {
        await DashboardService.updateDashboard(dashboardId, dashboardConfig);
      } else {
        const newDashboard = await DashboardService.createDashboard(dashboardConfig);
        setDashboardId(newDashboard.id);
      }

      setIsDirty(false);
      setLastSaved(new Date());
      
      return { success: true };
    } catch (error) {
      console.error('Error saving dashboard:', error);
      return { success: false, error: error.message };
    }
  }, [dashboardId, dashboardName, layouts, widgets, widgetConfigs, theme, settings]);

  // Load dashboard
  const loadDashboard = useCallback(async (id) => {
    try {
      const dashboard = await DashboardService.getDashboard(id);
      
      setDashboardId(dashboard.id);
      setDashboardName(dashboard.name);
      setLayouts(dashboard.layouts);
      setWidgets(new Map(dashboard.widgets));
      setWidgetConfigs(new Map(dashboard.configs));
      setTheme(dashboard.theme);
      setSettings(dashboard.settings);
      setIsDirty(false);
      setLastSaved(dashboard.lastModified);
      
      return { success: true };
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Optimize layout
  const optimizeLayout = useCallback(() => {
    setLayouts(prev => ({
      ...prev,
      lg: DashboardUtils.optimizeLayout(prev.lg || [])
    }));
  }, []);

  return {
    // State
    dashboardId,
    dashboardName,
    layouts,
    widgets,
    widgetConfigs,
    theme,
    settings,
    isDirty,
    lastSaved,
    
    // Actions
    setDashboardName,
    setLayouts,
    setTheme,
    setSettings,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    saveDashboard,
    loadDashboard,
    optimizeLayout
  };
}

// hooks/useWidgetResize.js

export function useWidgetResize(widgetId, onResize) {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeStop = useCallback((e, { size }) => {
    setIsResizing(false);
    setDimensions({ width: size.width, height: size.height });
    onResize?.(widgetId, size);
  }, [widgetId, onResize]);

  return {
    isResizing,
    dimensions,
    handleResizeStart,
    handleResizeStop
  };
}

// hooks/useDashboardShortcuts.js

export function useDashboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onDelete,
  onDuplicate,
  onToggleEditMode,
  isEditMode
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        onRedo?.();
      }

      // Delete: Remove selected widget (only in edit mode)
      if (e.key === 'Delete' && isEditMode) {
        e.preventDefault();
        onDelete?.();
      }

      // Ctrl/Cmd + D: Duplicate selected widget
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && isEditMode) {
        e.preventDefault();
        onDuplicate?.();
      }

      // Ctrl/Cmd + E: Toggle edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        onToggleEditMode?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onUndo, onRedo, onDelete, onDuplicate, onToggleEditMode, isEditMode]);
}

// hooks/useDashboardTour.js
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useDashboardTour() {
  const [tourDriver, setTourDriver] = useState(null);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const seen = localStorage.getItem('dashboard-tour-completed');
    setHasSeenTour(!!seen);

    // Initialize tour driver
    const driverInstance = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: [
        {
          element: '[data-tour="dashboard-header"]',
          popover: {
            title: 'Welcome to Custom Dashboards!',
            description: 'Create personalized dashboards with drag-and-drop widgets.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '[data-tour="edit-mode-toggle"]',
          popover: {
            title: 'Edit Mode',
            description: 'Toggle edit mode to add, remove, and rearrange widgets.',
            side: 'bottom'
          }
        },
        {
          element: '[data-tour="add-widget-button"]',
          popover: {
            title: 'Add Widgets',
            description: 'Click here to browse and add widgets to your dashboard.',
            side: 'bottom'
          }
        },
        {
          element: '[data-tour="widget-example"]',
          popover: {
            title: 'Interactive Widgets',
            description: 'Each widget can be configured, resized, and moved. Hover to see actions.',
            side: 'top'
          }
        },
        {
          element: '[data-tour="share-button"]',
          popover: {
            title: 'Share Your Dashboard',
            description: 'Share your dashboard with team members or generate public links.',
            side: 'bottom'
          }
        },
        {
          element: '[data-tour="save-button"]',
          popover: {
            title: 'Save Your Work',
            description: 'Don\'t forget to save your dashboard configuration!',
            side: 'bottom'
          }
        }
      ],
      onDestroyed: () => {
        // Mark tour as completed
        localStorage.setItem('dashboard-tour-completed', 'true');
        setHasSeenTour(true);
      }
    });

    setTourDriver(driverInstance);

    return () => {
      driverInstance.destroy();
    };
  }, []);

  const startTour = () => {
    tourDriver?.drive();
  };

  const resetTour = () => {
    localStorage.removeItem('dashboard-tour-completed');
    setHasSeenTour(false);
  };

  return {
    startTour,
    resetTour,
    hasSeenTour
  };
}