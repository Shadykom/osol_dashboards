import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default preferences
  const defaultPreferences = {
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'SAR',
    notifications: {
      email: true,
      sms: false,
      push: true,
      desktop: true
    },
    dashboard: {
      defaultView: 'grid',
      refreshInterval: 30000, // 30 seconds
      showWelcomeMessage: true,
      compactMode: false
    },
    reports: {
      defaultExportFormat: 'pdf',
      includeCharts: true,
      includeRawData: false,
      pageSize: 'A4'
    },
    accessibility: {
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: false,
      screenReaderMode: false
    }
  };

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(defaultPreferences);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('preference_key, preference_value, category')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Merge fetched preferences with defaults
      const userPrefs = { ...defaultPreferences };
      
      data?.forEach(({ preference_key, preference_value, category }) => {
        if (category && preference_key.includes('.')) {
          // Handle nested preferences
          const [mainKey, subKey] = preference_key.split('.');
          if (!userPrefs[category]) userPrefs[category] = {};
          if (!userPrefs[category][mainKey]) userPrefs[category][mainKey] = {};
          userPrefs[category][mainKey][subKey] = preference_value;
        } else if (category && userPrefs[category]) {
          // Handle categorized preferences
          userPrefs[category][preference_key] = preference_value;
        } else {
          // Handle top-level preferences
          userPrefs[preference_key] = preference_value;
        }
      });

      setPreferences(userPrefs);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err.message);
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save a single preference
  const savePreference = async (key, value, category = 'general') => {
    if (!user) return;

    try {
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preference_key: key,
          preference_value: value,
          category
        }, {
          onConflict: 'user_id,preference_key'
        });

      if (upsertError) throw upsertError;

      // Update local state
      setPreferences(prev => {
        const updated = { ...prev };
        if (category && category !== 'general') {
          if (!updated[category]) updated[category] = {};
          updated[category][key] = value;
        } else {
          updated[key] = value;
        }
        return updated;
      });

      return { success: true };
    } catch (err) {
      console.error('Error saving preference:', err);
      return { success: false, error: err.message };
    }
  };

  // Save multiple preferences at once
  const savePreferences = async (prefsToSave) => {
    if (!user) return;

    try {
      const upsertData = Object.entries(prefsToSave).map(([key, { value, category }]) => ({
        user_id: user.id,
        preference_key: key,
        preference_value: value,
        category: category || 'general'
      }));

      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert(upsertData, {
          onConflict: 'user_id,preference_key'
        });

      if (upsertError) throw upsertError;

      // Reload preferences to ensure consistency
      await loadPreferences();

      return { success: true };
    } catch (err) {
      console.error('Error saving preferences:', err);
      return { success: false, error: err.message };
    }
  };

  // Get a specific preference value
  const getPreference = (key, category = null) => {
    if (category && preferences[category]) {
      return preferences[category][key];
    }
    return preferences[key];
  };

  // Reset preferences to defaults
  const resetPreferences = async (category = null) => {
    if (!user) return;

    try {
      if (category) {
        // Reset specific category
        const keysToReset = Object.keys(defaultPreferences[category] || {});
        const deleteQuery = supabase
          .from('user_preferences')
          .delete()
          .eq('user_id', user.id)
          .eq('category', category);

        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;

        setPreferences(prev => ({
          ...prev,
          [category]: defaultPreferences[category] || {}
        }));
      } else {
        // Reset all preferences
        const { error: deleteError } = await supabase
          .from('user_preferences')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        setPreferences(defaultPreferences);
      }

      return { success: true };
    } catch (err) {
      console.error('Error resetting preferences:', err);
      return { success: false, error: err.message };
    }
  };

  // Apply theme preference
  const applyTheme = useCallback(() => {
    const theme = preferences.theme || 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'dark' ? '#1f2937' : '#ffffff';
    }
  }, [preferences.theme]);

  // Apply accessibility preferences
  const applyAccessibility = useCallback(() => {
    const { accessibility = {} } = preferences;
    
    // High contrast
    document.documentElement.classList.toggle('high-contrast', accessibility.highContrast);
    
    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    document.documentElement.style.fontSize = fontSizeMap[accessibility.fontSize] || '16px';
    
    // Reduced motion
    document.documentElement.classList.toggle('reduce-motion', accessibility.reducedMotion);
  }, [preferences.accessibility]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Apply theme and accessibility preferences when they change
  useEffect(() => {
    applyTheme();
    applyAccessibility();
  }, [applyTheme, applyAccessibility]);

  return {
    preferences,
    loading,
    error,
    savePreference,
    savePreferences,
    getPreference,
    resetPreferences,
    reloadPreferences: loadPreferences
  };
};

export default useUserPreferences;