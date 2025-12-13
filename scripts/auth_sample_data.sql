-- =====================================================
-- OSOL Authentication System Sample Data
-- Version: 1.0.0
-- 
-- !! IMPORTANT !!
-- DO NOT RUN THIS FILE DIRECTLY.
-- Instead, run: auth_complete_setup.sql
-- That file contains BOTH schema creation AND sample data.
-- =====================================================
-- If you still want to run this file separately,
-- you MUST run auth_schema.sql FIRST.
-- =====================================================

-- =====================================================
-- Insert default roles
-- =====================================================
INSERT INTO public.roles (name, display_name, description, is_system_role) VALUES
    ('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
    ('admin', 'Administrator', 'Administrative access to manage users and settings', true),
    ('manager', 'Manager', 'Management access to view reports and manage team', true),
    ('supervisor', 'Supervisor', 'Supervisory access to monitor team performance', true),
    ('officer', 'Collection Officer', 'Field officer with access to collection operations', true),
    ('specialist', 'Collection Specialist', 'Specialist with advanced collection features', true),
    ('analyst', 'Data Analyst', 'Access to reports and analytics', true),
    ('viewer', 'Viewer', 'Read-only access to dashboards and reports', true)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    is_system_role = EXCLUDED.is_system_role;

-- =====================================================
-- Insert permissions
-- =====================================================
INSERT INTO public.permissions (resource, action, description) VALUES
    -- User management permissions
    ('user', 'create', 'Create new users'),
    ('user', 'read', 'View user profiles'),
    ('user', 'update', 'Update user information'),
    ('user', 'delete', 'Delete users'),
    ('user', 'manage_roles', 'Assign or remove user roles'),
    -- Role management permissions
    ('role', 'create', 'Create new roles'),
    ('role', 'read', 'View roles'),
    ('role', 'update', 'Update role information'),
    ('role', 'delete', 'Delete roles'),
    ('role', 'manage_permissions', 'Manage role permissions'),
    -- Dashboard permissions
    ('dashboard', 'create', 'Create new dashboards'),
    ('dashboard', 'read', 'View dashboards'),
    ('dashboard', 'update', 'Update dashboard configurations'),
    ('dashboard', 'delete', 'Delete dashboards'),
    ('dashboard', 'share', 'Share dashboards with other users'),
    -- Report permissions
    ('report', 'view_executive', 'View executive reports'),
    ('report', 'view_operational', 'View operational reports'),
    ('report', 'view_collection', 'View collection reports'),
    ('report', 'view_compliance', 'View compliance reports'),
    ('report', 'export', 'Export reports'),
    ('report', 'schedule', 'Schedule automated reports'),
    -- Collection permissions
    ('collection', 'view_cases', 'View collection cases'),
    ('collection', 'update_cases', 'Update collection case status'),
    ('collection', 'assign_cases', 'Assign cases to officers'),
    ('collection', 'close_cases', 'Close collection cases'),
    -- Analytics permissions
    ('analytics', 'view_basic', 'View basic analytics'),
    ('analytics', 'view_advanced', 'View advanced analytics'),
    ('analytics', 'create_custom', 'Create custom analytics'),
    -- System permissions
    ('system', 'view_logs', 'View system logs'),
    ('system', 'manage_settings', 'Manage system settings'),
    ('system', 'backup', 'Create system backups'),
    ('system', 'restore', 'Restore from backups')
ON CONFLICT (resource, action) DO UPDATE SET
    description = EXCLUDED.description;

-- =====================================================
-- Assign permissions to roles
-- =====================================================

-- Clear existing role permissions first
DELETE FROM public.role_permissions;

-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin';

-- Admin gets most permissions except system critical ones
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin' 
  AND p.resource != 'system';

-- Manager permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'manager' 
  AND (
    (p.resource = 'user' AND p.action IN ('read', 'update')) OR
    (p.resource = 'dashboard' AND p.action IN ('create', 'read', 'update', 'share')) OR
    (p.resource = 'report' AND p.action != 'schedule') OR
    (p.resource = 'collection' AND p.action IN ('view_cases', 'assign_cases')) OR
    (p.resource = 'analytics' AND p.action IN ('view_basic', 'view_advanced'))
  );

-- Supervisor permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'supervisor' 
  AND (
    (p.resource = 'user' AND p.action = 'read') OR
    (p.resource = 'dashboard' AND p.action IN ('read', 'update')) OR
    (p.resource = 'report' AND p.action IN ('view_operational', 'view_collection')) OR
    (p.resource = 'collection' AND p.action IN ('view_cases', 'update_cases')) OR
    (p.resource = 'analytics' AND p.action = 'view_basic')
  );

-- Officer permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'officer' 
  AND (
    (p.resource = 'dashboard' AND p.action = 'read') OR
    (p.resource = 'report' AND p.action = 'view_collection') OR
    (p.resource = 'collection' AND p.action IN ('view_cases', 'update_cases'))
  );

-- Specialist permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'specialist' 
  AND (
    (p.resource = 'dashboard' AND p.action IN ('read', 'update')) OR
    (p.resource = 'report' AND p.action IN ('view_collection', 'export')) OR
    (p.resource = 'collection' AND p.action IN ('view_cases', 'update_cases', 'close_cases')) OR
    (p.resource = 'analytics' AND p.action IN ('view_basic', 'view_advanced'))
  );

-- Analyst permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'analyst' 
  AND (
    (p.resource = 'dashboard' AND p.action IN ('create', 'read', 'update')) OR
    (p.resource = 'report' AND p.action IN ('view_executive', 'view_operational', 'view_collection', 'export')) OR
    (p.resource = 'analytics' AND p.action IN ('view_basic', 'view_advanced', 'create_custom'))
  );

-- Viewer permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'viewer' 
  AND p.action IN ('read', 'view_basic', 'view_cases');

-- =====================================================
-- Insert sample users (passwords are hashed versions of 'Password123!')
-- In production, use proper password hashing like bcrypt
-- =====================================================
INSERT INTO public.users (email, password_hash, full_name, phone_number, department, position, employee_id, is_active, is_verified) VALUES
    ('admin@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Ahmed Al-Rashid', '+966501234567', 'IT', 'System Administrator', 'EMP001', true, true),
    ('manager@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Fatima Al-Zahrani', '+966502345678', 'Collections', 'Collections Manager', 'EMP002', true, true),
    ('supervisor1@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Mohammed Al-Qahtani', '+966503456789', 'Collections', 'Team Supervisor', 'EMP003', true, true),
    ('supervisor2@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Sara Al-Mutairi', '+966504567890', 'Collections', 'Team Supervisor', 'EMP004', true, true),
    ('officer1@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Khalid Al-Dosari', '+966505678901', 'Collections', 'Collection Officer', 'EMP005', true, true),
    ('officer2@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Nora Al-Harbi', '+966506789012', 'Collections', 'Collection Officer', 'EMP006', true, true),
    ('specialist@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Abdulaziz Al-Otaibi', '+966507890123', 'Collections', 'Collection Specialist', 'EMP007', true, true),
    ('analyst@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Maryam Al-Shehri', '+966508901234', 'Analytics', 'Data Analyst', 'EMP008', true, true),
    ('viewer@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Hassan Al-Ghamdi', '+966509012345', 'Operations', 'Operations Staff', 'EMP009', true, true)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    is_active = EXCLUDED.is_active,
    is_verified = EXCLUDED.is_verified;

-- =====================================================
-- Assign roles to users
-- =====================================================
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, (SELECT id FROM public.users WHERE email = 'admin@osol.sa' LIMIT 1)
FROM public.users u
CROSS JOIN public.roles r
WHERE 
  (u.email = 'admin@osol.sa' AND r.name = 'admin') OR
  (u.email = 'manager@osol.sa' AND r.name = 'manager') OR
  (u.email = 'supervisor1@osol.sa' AND r.name = 'supervisor') OR
  (u.email = 'supervisor2@osol.sa' AND r.name = 'supervisor') OR
  (u.email = 'officer1@osol.sa' AND r.name = 'officer') OR
  (u.email = 'officer2@osol.sa' AND r.name = 'officer') OR
  (u.email = 'specialist@osol.sa' AND r.name = 'specialist') OR
  (u.email = 'analyst@osol.sa' AND r.name = 'analyst') OR
  (u.email = 'viewer@osol.sa' AND r.name = 'viewer')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- =====================================================
-- Insert dashboard templates
-- =====================================================
INSERT INTO public.dashboard_templates (name, description, category, layout_config, widgets_config, is_default, created_by) VALUES
    ('Executive Overview', 'High-level executive dashboard for management', 'executive', 
     '{"layout": "grid", "columns": 12, "rows": 8, "gap": 16}'::jsonb,
     '[{"type": "kpi", "position": {"x": 0, "y": 0, "w": 3, "h": 2}}, {"type": "chart", "position": {"x": 3, "y": 0, "w": 6, "h": 4}}, {"type": "table", "position": {"x": 9, "y": 0, "w": 3, "h": 4}}]'::jsonb,
     true, (SELECT id FROM public.users WHERE email = 'admin@osol.sa' LIMIT 1)),

    ('Collection Performance', 'Collection team performance dashboard', 'collection',
     '{"layout": "grid", "columns": 12, "rows": 10, "gap": 16}'::jsonb,
     '[{"type": "metrics", "position": {"x": 0, "y": 0, "w": 12, "h": 2}}, {"type": "heatmap", "position": {"x": 0, "y": 2, "w": 6, "h": 4}}, {"type": "timeline", "position": {"x": 6, "y": 2, "w": 6, "h": 4}}]'::jsonb,
     false, (SELECT id FROM public.users WHERE email = 'admin@osol.sa' LIMIT 1)),

    ('Analytics Dashboard', 'Data analytics and insights dashboard', 'analytics',
     '{"layout": "flex", "direction": "column", "gap": 20}'::jsonb,
     '[{"type": "filter", "position": {"order": 0}}, {"type": "charts", "position": {"order": 1}}, {"type": "insights", "position": {"order": 2}}]'::jsonb,
     false, (SELECT id FROM public.users WHERE email = 'admin@osol.sa' LIMIT 1))
ON CONFLICT DO NOTHING;

-- =====================================================
-- Insert user preferences
-- =====================================================
INSERT INTO public.user_preferences (user_id, preference_key, preference_value, category) VALUES
    ((SELECT id FROM public.users WHERE email = 'admin@osol.sa'), 'theme', '"dark"'::jsonb, 'appearance'),
    ((SELECT id FROM public.users WHERE email = 'admin@osol.sa'), 'language', '"ar"'::jsonb, 'localization'),
    ((SELECT id FROM public.users WHERE email = 'admin@osol.sa'), 'notifications', '{"email": true, "sms": false, "push": true}'::jsonb, 'notifications'),
    ((SELECT id FROM public.users WHERE email = 'manager@osol.sa'), 'theme', '"light"'::jsonb, 'appearance'),
    ((SELECT id FROM public.users WHERE email = 'manager@osol.sa'), 'language', '"en"'::jsonb, 'localization'),
    ((SELECT id FROM public.users WHERE email = 'manager@osol.sa'), 'date_format', '"DD/MM/YYYY"'::jsonb, 'localization')
ON CONFLICT (user_id, preference_key) DO UPDATE SET
    preference_value = EXCLUDED.preference_value,
    category = EXCLUDED.category;

-- =====================================================
-- Insert user dashboards
-- =====================================================
INSERT INTO public.user_dashboards (user_id, name, description, template_id, layout_config, is_default) VALUES
    ((SELECT id FROM public.users WHERE email = 'admin@osol.sa'), 'My Executive Dashboard', 'Customized executive overview', 
     (SELECT id FROM public.dashboard_templates WHERE name = 'Executive Overview' LIMIT 1),
     '{"layout": "grid", "columns": 12, "rows": 8, "gap": 16, "theme": "dark"}'::jsonb, true),

    ((SELECT id FROM public.users WHERE email = 'manager@osol.sa'), 'Team Performance', 'Collection team performance tracking',
     (SELECT id FROM public.dashboard_templates WHERE name = 'Collection Performance' LIMIT 1),
     '{"layout": "grid", "columns": 12, "rows": 10, "gap": 16, "theme": "light"}'::jsonb, true)
ON CONFLICT (user_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    layout_config = EXCLUDED.layout_config;

-- =====================================================
-- Insert dashboard widgets for admin user
-- =====================================================
INSERT INTO public.user_dashboard_widgets (dashboard_id, widget_type, widget_config, position_config, order_index) 
SELECT 
    d.id,
    w.widget_type,
    w.widget_config::jsonb,
    w.position_config::jsonb,
    w.order_index
FROM public.user_dashboards d
CROSS JOIN (
    VALUES 
        ('revenue_kpi', '{"title": "Total Revenue", "metric": "revenue", "period": "month", "comparison": "previous_month"}', '{"x": 0, "y": 0, "w": 3, "h": 2}', 1),
        ('collection_rate', '{"title": "Collection Rate", "metric": "collection_rate", "target": 85, "format": "percentage"}', '{"x": 3, "y": 0, "w": 3, "h": 2}', 2),
        ('trend_chart', '{"title": "Collection Trend", "type": "line", "metrics": ["collected", "target"], "period": "last_12_months"}', '{"x": 0, "y": 2, "w": 6, "h": 4}', 3)
) AS w(widget_type, widget_config, position_config, order_index)
WHERE d.name = 'My Executive Dashboard'
ON CONFLICT DO NOTHING;

-- =====================================================
-- Verification
-- =====================================================
DO $$
DECLARE
    role_count INTEGER;
    user_count INTEGER;
    perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO role_count FROM public.roles;
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO perm_count FROM public.permissions;
    
    RAISE NOTICE 'Auth sample data loaded successfully:';
    RAISE NOTICE '  - Roles: %', role_count;
    RAISE NOTICE '  - Users: %', user_count;
    RAISE NOTICE '  - Permissions: %', perm_count;
END $$;
