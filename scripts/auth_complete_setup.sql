-- =====================================================
-- OSOL Authentication System - Complete Setup
-- Version: 1.0.0
-- Description: Creates schema AND inserts sample data in one file
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: DROP EXISTING OBJECTS
-- =====================================================
DROP VIEW IF EXISTS public.user_permissions_view CASCADE;
DROP TABLE IF EXISTS public.user_dashboard_widgets CASCADE;
DROP TABLE IF EXISTS public.user_dashboards CASCADE;
DROP TABLE IF EXISTS public.dashboard_templates CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.user_role_permissions CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================
-- PART 2: CREATE TABLES
-- =====================================================

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Create role_permissions table
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES public.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- Create user_role_permissions table
CREATE TABLE public.user_role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    reason TEXT,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES public.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, permission_id)
);

-- Create user_sessions table
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- Create dashboard_templates table
CREATE TABLE public.dashboard_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    layout_config JSONB NOT NULL,
    widgets_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_dashboards table
CREATE TABLE public.user_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES public.dashboard_templates(id),
    layout_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Create user_dashboard_widgets table
CREATE TABLE public.user_dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES public.user_dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    widget_config JSONB NOT NULL,
    position_config JSONB NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PART 3: CREATE INDEXES
-- =====================================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_employee_id ON public.users(employee_id);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON public.user_sessions(token_hash);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_dashboards_user_id ON public.user_dashboards(user_id);
CREATE INDEX idx_user_dashboard_widgets_dashboard_id ON public.user_dashboard_widgets(dashboard_id);

-- =====================================================
-- PART 4: CREATE TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_templates_updated_at BEFORE UPDATE ON public.dashboard_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_dashboards_updated_at BEFORE UPDATE ON public.user_dashboards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_dashboard_widgets_updated_at BEFORE UPDATE ON public.user_dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PART 5: GRANT PERMISSIONS (before RLS)
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- PART 6: INSERT SAMPLE DATA
-- =====================================================

-- Insert default roles
INSERT INTO public.roles (name, display_name, description, is_system_role) VALUES
    ('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
    ('admin', 'Administrator', 'Administrative access to manage users and settings', true),
    ('manager', 'Manager', 'Management access to view reports and manage team', true),
    ('supervisor', 'Supervisor', 'Supervisory access to monitor team performance', true),
    ('officer', 'Collection Officer', 'Field officer with access to collection operations', true),
    ('specialist', 'Collection Specialist', 'Specialist with advanced collection features', true),
    ('analyst', 'Data Analyst', 'Access to reports and analytics', true),
    ('viewer', 'Viewer', 'Read-only access to dashboards and reports', true);

-- Insert permissions
INSERT INTO public.permissions (resource, action, description) VALUES
    ('user', 'create', 'Create new users'),
    ('user', 'read', 'View user profiles'),
    ('user', 'update', 'Update user information'),
    ('user', 'delete', 'Delete users'),
    ('user', 'manage_roles', 'Assign or remove user roles'),
    ('role', 'create', 'Create new roles'),
    ('role', 'read', 'View roles'),
    ('role', 'update', 'Update role information'),
    ('role', 'delete', 'Delete roles'),
    ('role', 'manage_permissions', 'Manage role permissions'),
    ('dashboard', 'create', 'Create new dashboards'),
    ('dashboard', 'read', 'View dashboards'),
    ('dashboard', 'update', 'Update dashboard configurations'),
    ('dashboard', 'delete', 'Delete dashboards'),
    ('dashboard', 'share', 'Share dashboards with other users'),
    ('report', 'view_executive', 'View executive reports'),
    ('report', 'view_operational', 'View operational reports'),
    ('report', 'view_collection', 'View collection reports'),
    ('report', 'view_compliance', 'View compliance reports'),
    ('report', 'export', 'Export reports'),
    ('report', 'schedule', 'Schedule automated reports'),
    ('collection', 'view_cases', 'View collection cases'),
    ('collection', 'update_cases', 'Update collection case status'),
    ('collection', 'assign_cases', 'Assign cases to officers'),
    ('collection', 'close_cases', 'Close collection cases'),
    ('analytics', 'view_basic', 'View basic analytics'),
    ('analytics', 'view_advanced', 'View advanced analytics'),
    ('analytics', 'create_custom', 'Create custom analytics'),
    ('system', 'view_logs', 'View system logs'),
    ('system', 'manage_settings', 'Manage system settings'),
    ('system', 'backup', 'Create system backups'),
    ('system', 'restore', 'Restore from backups');

-- Assign permissions to roles: Super Admin gets all
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p WHERE r.name = 'super_admin';

-- Admin gets most permissions except system
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'admin' AND p.resource != 'system';

-- Manager permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'manager' AND (
    (p.resource = 'user' AND p.action IN ('read', 'update')) OR
    (p.resource = 'dashboard' AND p.action IN ('create', 'read', 'update', 'share')) OR
    (p.resource = 'report' AND p.action != 'schedule') OR
    (p.resource = 'collection' AND p.action IN ('view_cases', 'assign_cases')) OR
    (p.resource = 'analytics' AND p.action IN ('view_basic', 'view_advanced'))
);

-- Supervisor permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'supervisor' AND (
    (p.resource = 'user' AND p.action = 'read') OR
    (p.resource = 'dashboard' AND p.action IN ('read', 'update')) OR
    (p.resource = 'report' AND p.action IN ('view_operational', 'view_collection')) OR
    (p.resource = 'collection' AND p.action IN ('view_cases', 'update_cases')) OR
    (p.resource = 'analytics' AND p.action = 'view_basic')
);

-- Officer permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'officer' AND (
    (p.resource = 'dashboard' AND p.action = 'read') OR
    (p.resource = 'report' AND p.action = 'view_collection') OR
    (p.resource = 'collection' AND p.action IN ('view_cases', 'update_cases'))
);

-- Specialist permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'specialist' AND (
    (p.resource = 'dashboard' AND p.action IN ('read', 'update')) OR
    (p.resource = 'report' AND p.action IN ('view_collection', 'export')) OR
    (p.resource = 'collection' AND p.action IN ('view_cases', 'update_cases', 'close_cases')) OR
    (p.resource = 'analytics' AND p.action IN ('view_basic', 'view_advanced'))
);

-- Analyst permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'analyst' AND (
    (p.resource = 'dashboard' AND p.action IN ('create', 'read', 'update')) OR
    (p.resource = 'report' AND p.action IN ('view_executive', 'view_operational', 'view_collection', 'export')) OR
    (p.resource = 'analytics' AND p.action IN ('view_basic', 'view_advanced', 'create_custom'))
);

-- Viewer permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name = 'viewer' AND p.action IN ('read', 'view_basic', 'view_cases');

-- Insert sample users (password = 'Password123!')
INSERT INTO public.users (email, password_hash, full_name, phone_number, department, position, employee_id, is_active, is_verified) VALUES
    ('admin@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Ahmed Al-Rashid', '+966501234567', 'IT', 'System Administrator', 'EMP001', true, true),
    ('manager@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Fatima Al-Zahrani', '+966502345678', 'Collections', 'Collections Manager', 'EMP002', true, true),
    ('supervisor1@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Mohammed Al-Qahtani', '+966503456789', 'Collections', 'Team Supervisor', 'EMP003', true, true),
    ('supervisor2@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Sara Al-Mutairi', '+966504567890', 'Collections', 'Team Supervisor', 'EMP004', true, true),
    ('officer1@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Khalid Al-Dosari', '+966505678901', 'Collections', 'Collection Officer', 'EMP005', true, true),
    ('officer2@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Nora Al-Harbi', '+966506789012', 'Collections', 'Collection Officer', 'EMP006', true, true),
    ('specialist@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Abdulaziz Al-Otaibi', '+966507890123', 'Collections', 'Collection Specialist', 'EMP007', true, true),
    ('analyst@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Maryam Al-Shehri', '+966508901234', 'Analytics', 'Data Analyst', 'EMP008', true, true),
    ('viewer@osol.sa', '$2a$10$rBV2JDeWW3.vKyeQcM8fFO4777l.KgQ7x6Q5D1EZcKjZVqwYmYPSi', 'Hassan Al-Ghamdi', '+966509012345', 'Operations', 'Operations Staff', 'EMP009', true, true);

-- Assign roles to users
INSERT INTO public.user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, (SELECT id FROM public.users WHERE email = 'admin@osol.sa')
FROM public.users u, public.roles r
WHERE 
    (u.email = 'admin@osol.sa' AND r.name = 'admin') OR
    (u.email = 'manager@osol.sa' AND r.name = 'manager') OR
    (u.email = 'supervisor1@osol.sa' AND r.name = 'supervisor') OR
    (u.email = 'supervisor2@osol.sa' AND r.name = 'supervisor') OR
    (u.email = 'officer1@osol.sa' AND r.name = 'officer') OR
    (u.email = 'officer2@osol.sa' AND r.name = 'officer') OR
    (u.email = 'specialist@osol.sa' AND r.name = 'specialist') OR
    (u.email = 'analyst@osol.sa' AND r.name = 'analyst') OR
    (u.email = 'viewer@osol.sa' AND r.name = 'viewer');

-- Insert dashboard templates
INSERT INTO public.dashboard_templates (name, description, category, layout_config, widgets_config, is_default, created_by) VALUES
    ('Executive Overview', 'High-level executive dashboard for management', 'executive', 
     '{"layout": "grid", "columns": 12, "rows": 8, "gap": 16}'::jsonb,
     '[{"type": "kpi", "position": {"x": 0, "y": 0, "w": 3, "h": 2}}]'::jsonb,
     true, (SELECT id FROM public.users WHERE email = 'admin@osol.sa')),
    ('Collection Performance', 'Collection team performance dashboard', 'collection',
     '{"layout": "grid", "columns": 12, "rows": 10, "gap": 16}'::jsonb,
     '[{"type": "metrics", "position": {"x": 0, "y": 0, "w": 12, "h": 2}}]'::jsonb,
     false, (SELECT id FROM public.users WHERE email = 'admin@osol.sa')),
    ('Analytics Dashboard', 'Data analytics and insights dashboard', 'analytics',
     '{"layout": "flex", "direction": "column", "gap": 20}'::jsonb,
     '[{"type": "filter", "position": {"order": 0}}]'::jsonb,
     false, (SELECT id FROM public.users WHERE email = 'admin@osol.sa'));

-- Insert user preferences
INSERT INTO public.user_preferences (user_id, preference_key, preference_value, category) VALUES
    ((SELECT id FROM public.users WHERE email = 'admin@osol.sa'), 'theme', '"dark"'::jsonb, 'appearance'),
    ((SELECT id FROM public.users WHERE email = 'admin@osol.sa'), 'language', '"ar"'::jsonb, 'localization'),
    ((SELECT id FROM public.users WHERE email = 'manager@osol.sa'), 'theme', '"light"'::jsonb, 'appearance'),
    ((SELECT id FROM public.users WHERE email = 'manager@osol.sa'), 'language', '"en"'::jsonb, 'localization');

-- Insert user dashboards
INSERT INTO public.user_dashboards (user_id, name, description, template_id, layout_config, is_default) VALUES
    ((SELECT id FROM public.users WHERE email = 'admin@osol.sa'), 'My Executive Dashboard', 'Customized executive overview', 
     (SELECT id FROM public.dashboard_templates WHERE name = 'Executive Overview'),
     '{"layout": "grid", "columns": 12, "rows": 8, "gap": 16, "theme": "dark"}'::jsonb, true),
    ((SELECT id FROM public.users WHERE email = 'manager@osol.sa'), 'Team Performance', 'Collection team performance tracking',
     (SELECT id FROM public.dashboard_templates WHERE name = 'Collection Performance'),
     '{"layout": "grid", "columns": 12, "rows": 10, "gap": 16, "theme": "light"}'::jsonb, true);

-- Insert dashboard widgets
INSERT INTO public.user_dashboard_widgets (dashboard_id, widget_type, widget_config, position_config, order_index) VALUES
    ((SELECT id FROM public.user_dashboards WHERE name = 'My Executive Dashboard'), 'revenue_kpi',
     '{"title": "Total Revenue", "metric": "revenue", "period": "month"}'::jsonb,
     '{"x": 0, "y": 0, "w": 3, "h": 2}'::jsonb, 1),
    ((SELECT id FROM public.user_dashboards WHERE name = 'My Executive Dashboard'), 'collection_rate',
     '{"title": "Collection Rate", "metric": "collection_rate", "target": 85}'::jsonb,
     '{"x": 3, "y": 0, "w": 3, "h": 2}'::jsonb, 2);

-- =====================================================
-- PART 7: ENABLE RLS (after data is inserted)
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - service_role bypass (full access)
CREATE POLICY users_service_all ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY roles_service_all ON public.roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY permissions_service_all ON public.permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY role_permissions_service_all ON public.role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY user_roles_service_all ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY user_role_permissions_service_all ON public.user_role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY user_sessions_service_all ON public.user_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY user_preferences_service_all ON public.user_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY dashboard_templates_service_all ON public.dashboard_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY user_dashboards_service_all ON public.user_dashboards FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY user_dashboard_widgets_service_all ON public.user_dashboard_widgets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- RLS Policies - authenticated/anon access
CREATE POLICY users_select ON public.users FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY roles_select ON public.roles FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY permissions_select ON public.permissions FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY role_permissions_select ON public.role_permissions FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY dashboard_templates_select ON public.dashboard_templates FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY user_preferences_own ON public.user_preferences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY user_dashboards_own ON public.user_dashboards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY user_dashboard_widgets_own ON public.user_dashboard_widgets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- PART 8: CREATE VIEW
-- =====================================================
CREATE OR REPLACE VIEW public.user_permissions_view AS
SELECT DISTINCT
    u.id as user_id,
    u.email,
    u.full_name,
    p.id as permission_id,
    p.resource,
    p.action,
    p.description,
    true as is_granted,
    'Role-based permission' as grant_reason,
    ur.expires_at
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id AND ur.is_active = true
JOIN public.role_permissions rp ON ur.role_id = rp.role_id
JOIN public.permissions p ON rp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = true;

-- =====================================================
-- DONE
-- =====================================================
DO $$
DECLARE
    v_roles INTEGER;
    v_users INTEGER;
    v_perms INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_roles FROM public.roles;
    SELECT COUNT(*) INTO v_users FROM public.users;
    SELECT COUNT(*) INTO v_perms FROM public.permissions;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auth system setup completed successfully!';
    RAISE NOTICE '  Roles: %', v_roles;
    RAISE NOTICE '  Users: %', v_users;
    RAISE NOTICE '  Permissions: %', v_perms;
    RAISE NOTICE '========================================';
END $$;
