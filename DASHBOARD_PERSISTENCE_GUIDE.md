# Dashboard Persistence Feature Guide

## Overview
The dashboard customization persistence feature ensures that all user dashboard customizations are saved to the database and persist across sign-out/sign-in sessions. This replaces the previous localStorage-based approach which was browser-specific and lost data on sign-out.

## Problem Solved
Previously, dashboard customizations were saved to browser localStorage, which meant:
- Customizations were lost when users signed out
- Settings were browser-specific, not following users across devices
- No centralized backup of user preferences
- Limited ability to share or manage dashboard configurations

## Solution Implementation

### Database Schema
The following tables store dashboard customizations:

1. **dashboard_templates** - Stores reusable dashboard templates
   - id (UUID, primary key)
   - name (template name)
   - description (template description)
   - layout_config (JSON configuration)
   - widgets_config (JSON array of widget configurations)
   - is_public (visibility flag)

2. **user_dashboards** - Stores user-specific dashboard configurations
   - id (UUID, primary key)
   - user_id (references users table)
   - name (dashboard name)
   - description (dashboard description)
   - template_id (optional reference to template)
   - layout_config (JSON configuration including filters, template, etc.)
   - is_default (default dashboard flag)
   - is_active (soft delete flag)
   - order_index (for ordering multiple dashboards)

3. **user_dashboard_widgets** - Stores individual widget configurations
   - id (UUID, primary key)
   - dashboard_id (references user_dashboards)
   - widget_type (type of widget)
   - widget_config (JSON widget-specific configuration)
   - position_config (JSON position/size configuration)
   - is_visible (visibility flag)
   - order_index (widget ordering)

4. **user_preferences** - Stores general user preferences
   - id (UUID, primary key)
   - user_id (references users table)
   - preferences (JSON general preferences)
   - theme (user theme preference)
   - language (user language preference)
   - dashboard_settings (JSON dashboard-specific settings)

### Key Components

#### 1. useDashboardCustomization Hook (`/src/hooks/useDashboardCustomization.js`)
This custom React hook manages all dashboard persistence operations:
- Loads user dashboards from database on mount
- Provides functions to create, update, delete dashboards
- Manages widget operations (add, update, remove, reorder)
- Handles dashboard templates
- Supports import/export of dashboard configurations

#### 2. Updated Dashboard Components
- **Dashboard.jsx** - Main dashboard now uses the persistence hook instead of localStorage
- **CustomDashboard.jsx** - Custom dashboard builder uses database persistence
- Both components automatically save/load configurations from the database

### Setup Instructions

1. **Run the Database Setup Script**
   ```bash
   # Set your database credentials
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=osol_db
   export DB_USER=postgres
   export DB_PASSWORD=your_password

   # Run the setup script
   ./setup_dashboard_persistence.sh
   ```

2. **Verify Tables Were Created**
   The script will automatically verify that the tables were created successfully.

3. **Test the Feature**
   - Sign in to the application
   - Navigate to /dashboards
   - Customize your dashboard (add/remove widgets, change layout, etc.)
   - Click the Save button to persist changes
   - Sign out and sign back in
   - Your customizations should be preserved

### How It Works

1. **On User Sign In:**
   - The `useDashboardCustomization` hook loads all user dashboards from the database
   - The default dashboard (or first available) is set as current
   - Dashboard widgets are loaded and displayed

2. **When Customizing:**
   - Changes are tracked in component state
   - The Save button triggers database updates
   - Widgets are added/removed/updated in the database
   - Dashboard configuration is updated with current settings

3. **On Sign Out:**
   - No action needed - all changes are already in the database
   - localStorage is no longer used for dashboard data

4. **On Sign In (Different Device/Browser):**
   - Dashboard customizations are loaded from the database
   - User sees the same configuration across all devices

### API Functions

The `useDashboardCustomization` hook provides these functions:

```javascript
// Create a new dashboard
createDashboard({ name, description, templateId, layoutConfig })

// Update existing dashboard
updateDashboard(dashboardId, updates)

// Delete dashboard (soft delete)
deleteDashboard(dashboardId)

// Switch between dashboards
switchDashboard(dashboardId)

// Widget operations
addWidget(dashboardId, widgetData)
updateWidget(widgetId, updates)
removeWidget(widgetId)
reorderWidgets(dashboardId, widgetOrder)

// Template operations
createFromTemplate(templateId, customName)

// Import/Export
exportDashboard(dashboardId)
importDashboard(jsonConfig)
```

### Benefits

1. **Persistence Across Sessions** - Customizations are never lost
2. **Cross-Device Sync** - Same dashboard on all devices
3. **Multiple Dashboards** - Users can create and manage multiple dashboard configurations
4. **Templates** - Admins can create templates for users to start from
5. **Backup & Recovery** - Database backups include dashboard configurations
6. **Sharing** - Future feature: share dashboards between users
7. **Analytics** - Track which widgets and layouts are most popular

### Migration from localStorage

For existing users with localStorage data:
1. The system will detect localStorage configurations on first load
2. These will be automatically migrated to the database
3. localStorage will be cleared after successful migration

### Troubleshooting

**Issue: Dashboards not saving**
- Check database connectivity
- Verify tables exist: `SELECT * FROM user_dashboards WHERE user_id = 'your_user_id';`
- Check browser console for errors

**Issue: Widgets not appearing after sign in**
- Verify widgets are saved: `SELECT * FROM user_dashboard_widgets WHERE dashboard_id = 'dashboard_id';`
- Check if RLS policies are correctly configured

**Issue: Cannot create new dashboards**
- Check user permissions in the database
- Verify user_id is being passed correctly

### Future Enhancements

1. **Dashboard Sharing** - Share dashboards with other users/teams
2. **Dashboard Versioning** - Track changes and allow rollback
3. **Dashboard Analytics** - Track usage patterns
4. **Advanced Templates** - Role-based default templates
5. **Export to PDF/Image** - Save dashboard snapshots
6. **Scheduled Reports** - Email dashboard summaries

## Conclusion

The dashboard persistence feature provides a robust, scalable solution for managing user dashboard customizations. By moving from localStorage to database storage, we ensure data persistence, enable cross-device synchronization, and lay the foundation for advanced dashboard management features.