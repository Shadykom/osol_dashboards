import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const useDashboardCustomization = () => {
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user dashboards
  const loadDashboards = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_dashboards')
        .select(`
          *,
          template:dashboard_templates(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;

      setDashboards(data || []);

      // Set default dashboard
      const defaultDashboard = data?.find(d => d.is_default) || data?.[0];
      if (defaultDashboard) {
        await loadDashboardWidgets(defaultDashboard.id);
        setCurrentDashboard(defaultDashboard);
      }
    } catch (err) {
      console.error('Error loading dashboards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load dashboard templates
  const loadTemplates = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('dashboard_templates')
        .select('*')
        .eq('is_public', true)
        .order('name');

      if (fetchError) throw fetchError;

      setTemplates(data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  }, []);

  // Load widgets for a specific dashboard
  const loadDashboardWidgets = async (dashboardId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_dashboard_widgets')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .eq('is_visible', true)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      console.error('Error loading dashboard widgets:', err);
      return [];
    }
  };

  // Create a new dashboard
  const createDashboard = async (dashboardData) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error: createError } = await supabase
        .from('user_dashboards')
        .insert({
          user_id: user.id,
          name: dashboardData.name,
          description: dashboardData.description,
          template_id: dashboardData.templateId,
          layout_config: dashboardData.layoutConfig || {},
          is_default: dashboardData.isDefault || false,
          order_index: dashboards.length
        })
        .select()
        .single();

      if (createError) throw createError;

      // If template is provided, copy widgets from template
      if (dashboardData.templateId) {
        const template = templates.find(t => t.id === dashboardData.templateId);
        if (template && template.widgets_config) {
          const widgetInserts = template.widgets_config.map((widget, index) => ({
            dashboard_id: data.id,
            widget_type: widget.type,
            widget_config: widget.config || {},
            position_config: widget.position || {},
            order_index: index
          }));

          await supabase
            .from('user_dashboard_widgets')
            .insert(widgetInserts);
        }
      }

      // Reload dashboards
      await loadDashboards();

      return { success: true, dashboard: data };
    } catch (err) {
      console.error('Error creating dashboard:', err);
      return { success: false, error: err.message };
    }
  };

  // Update dashboard
  const updateDashboard = async (dashboardId, updates) => {
    try {
      const { error: updateError } = await supabase
        .from('user_dashboards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', dashboardId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setDashboards(prev => prev.map(d => 
        d.id === dashboardId ? { ...d, ...updates } : d
      ));

      if (currentDashboard?.id === dashboardId) {
        setCurrentDashboard(prev => ({ ...prev, ...updates }));
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating dashboard:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete dashboard
  const deleteDashboard = async (dashboardId) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_dashboards')
        .update({ is_active: false })
        .eq('id', dashboardId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Reload dashboards
      await loadDashboards();

      return { success: true };
    } catch (err) {
      console.error('Error deleting dashboard:', err);
      return { success: false, error: err.message };
    }
  };

  // Add widget to dashboard
  const addWidget = async (dashboardId, widgetData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('user_dashboard_widgets')
        .insert({
          dashboard_id: dashboardId,
          widget_type: widgetData.type,
          widget_config: widgetData.config || {},
          position_config: widgetData.position || {},
          order_index: widgetData.orderIndex || 0
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { success: true, widget: data };
    } catch (err) {
      console.error('Error adding widget:', err);
      return { success: false, error: err.message };
    }
  };

  // Update widget
  const updateWidget = async (widgetId, updates) => {
    try {
      const { error: updateError } = await supabase
        .from('user_dashboard_widgets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', widgetId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      console.error('Error updating widget:', err);
      return { success: false, error: err.message };
    }
  };

  // Remove widget
  const removeWidget = async (widgetId) => {
    try {
      const { error: updateError } = await supabase
        .from('user_dashboard_widgets')
        .update({ is_visible: false })
        .eq('id', widgetId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      console.error('Error removing widget:', err);
      return { success: false, error: err.message };
    }
  };

  // Reorder widgets
  const reorderWidgets = async (dashboardId, widgetOrder) => {
    try {
      const updates = widgetOrder.map((widgetId, index) => ({
        id: widgetId,
        order_index: index
      }));

      const { error: updateError } = await supabase
        .from('user_dashboard_widgets')
        .upsert(updates);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      console.error('Error reordering widgets:', err);
      return { success: false, error: err.message };
    }
  };

  // Switch to a different dashboard
  const switchDashboard = async (dashboardId) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (dashboard) {
      const widgets = await loadDashboardWidgets(dashboardId);
      setCurrentDashboard({ ...dashboard, widgets });
    }
  };

  // Create dashboard from template
  const createFromTemplate = async (templateId, customName) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return { success: false, error: 'Template not found' };

    return createDashboard({
      name: customName || `${template.name} - Copy`,
      description: template.description,
      templateId: templateId,
      layoutConfig: template.layout_config
    });
  };

  // Export dashboard configuration
  const exportDashboard = (dashboardId) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return null;

    const exportData = {
      name: dashboard.name,
      description: dashboard.description,
      layoutConfig: dashboard.layout_config,
      widgets: dashboard.widgets || []
    };

    return JSON.stringify(exportData, null, 2);
  };

  // Import dashboard configuration
  const importDashboard = async (jsonConfig) => {
    try {
      const config = JSON.parse(jsonConfig);
      
      const result = await createDashboard({
        name: config.name || 'Imported Dashboard',
        description: config.description,
        layoutConfig: config.layoutConfig
      });

      if (result.success && config.widgets) {
        // Add widgets
        for (const widget of config.widgets) {
          await addWidget(result.dashboard.id, widget);
        }
      }

      return result;
    } catch (err) {
      console.error('Error importing dashboard:', err);
      return { success: false, error: 'Invalid dashboard configuration' };
    }
  };

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadDashboards();
      loadTemplates();
    }
  }, [user, loadDashboards, loadTemplates]);

  return {
    dashboards,
    templates,
    currentDashboard,
    loading,
    error,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    switchDashboard,
    createFromTemplate,
    addWidget,
    updateWidget,
    removeWidget,
    reorderWidgets,
    exportDashboard,
    importDashboard,
    reloadDashboards: loadDashboards
  };
};

export default useDashboardCustomization;