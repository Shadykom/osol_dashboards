-- =====================================================
-- OSOL Authentication and Authorization System Schema
-- Version: 1.0.0
-- Description: Creates all necessary tables for user management,
-- roles, permissions, user preferences, and dashboard settings
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Drop existing objects in correct order (respecting FK dependencies)
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
-- Create users table
-- =====================================================
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

-- Add self-referential foreign keys after table creation
ALTER TABLE public.users 
    ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES public.users(id),
    ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES public.users(id);

-- =====================================================
-- Create roles table
-- =====================================================
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

-- =====================================================
-- Create permissions table
-- =====================================================
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- =====================================================
-- Create role_permissions table (many-to-many)
-- =====================================================
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- =====================================================
-- Create user_roles table (many-to-many)
-- =====================================================
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

-- =====================================================
-- Create user_role_permissions table (for custom permissions)
-- =====================================================
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

-- =====================================================
-- Create user_sessions table
-- =====================================================
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

-- =====================================================
-- Create user_preferences table
-- =====================================================
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

-- =====================================================
-- Create dashboard_templates table
-- =====================================================
CREATE TABLE public.dashboard_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
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

-- =====================================================
-- Create user_dashboards table
-- =====================================================
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

-- =====================================================
-- Create user_dashboard_widgets table
-- =====================================================
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
-- Create indexes for better performance
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
-- Create updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create triggers for updated_at
-- =====================================================
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_templates_updated_at ON public.dashboard_templates;
CREATE TRIGGER update_dashboard_templates_updated_at 
    BEFORE UPDATE ON public.dashboard_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_dashboards_updated_at ON public.user_dashboards;
CREATE TRIGGER update_user_dashboards_updated_at 
    BEFORE UPDATE ON public.user_dashboards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_dashboard_widgets_updated_at ON public.user_dashboard_widgets;
CREATE TRIGGER update_user_dashboard_widgets_updated_at 
    BEFORE UPDATE ON public.user_dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Create view for user permissions
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
    CASE 
        WHEN urp.granted IS NOT NULL THEN urp.granted
        ELSE true
    END as is_granted,
    COALESCE(urp.reason, 'Role-based permission') as grant_reason,
    COALESCE(urp.expires_at, ur.expires_at) as expires_at
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id AND ur.is_active = true
JOIN public.role_permissions rp ON ur.role_id = rp.role_id
JOIN public.permissions p ON rp.permission_id = p.id AND p.is_active = true
LEFT JOIN public.user_role_permissions urp ON u.id = urp.user_id AND p.id = urp.permission_id
WHERE u.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    AND (urp.expires_at IS NULL OR urp.expires_at > CURRENT_TIMESTAMP)

UNION

SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    p.id as permission_id,
    p.resource,
    p.action,
    p.description,
    urp.granted as is_granted,
    urp.reason as grant_reason,
    urp.expires_at
FROM public.users u
JOIN public.user_role_permissions urp ON u.id = urp.user_id
JOIN public.permissions p ON urp.permission_id = p.id AND p.is_active = true
WHERE u.is_active = true
    AND (urp.expires_at IS NULL OR urp.expires_at > CURRENT_TIMESTAMP)
    AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.user_id = u.id 
            AND rp.permission_id = p.id 
            AND ur.is_active = true
            AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
    );

-- =====================================================
-- Enable Row Level Security (RLS)
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

-- =====================================================
-- RLS Policies - Allow service_role full access
-- =====================================================

-- Users table policies
DROP POLICY IF EXISTS users_service_role_all ON public.users;
CREATE POLICY users_service_role_all ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS users_authenticated_select ON public.users;
CREATE POLICY users_authenticated_select ON public.users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS users_authenticated_update_own ON public.users;
CREATE POLICY users_authenticated_update_own ON public.users FOR UPDATE TO authenticated USING (id = auth.uid());

-- Roles table policies
DROP POLICY IF EXISTS roles_service_role_all ON public.roles;
CREATE POLICY roles_service_role_all ON public.roles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS roles_authenticated_select ON public.roles;
CREATE POLICY roles_authenticated_select ON public.roles FOR SELECT TO authenticated USING (true);

-- Permissions table policies
DROP POLICY IF EXISTS permissions_service_role_all ON public.permissions;
CREATE POLICY permissions_service_role_all ON public.permissions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS permissions_authenticated_select ON public.permissions;
CREATE POLICY permissions_authenticated_select ON public.permissions FOR SELECT TO authenticated USING (true);

-- Role_permissions table policies
DROP POLICY IF EXISTS role_permissions_service_role_all ON public.role_permissions;
CREATE POLICY role_permissions_service_role_all ON public.role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS role_permissions_authenticated_select ON public.role_permissions;
CREATE POLICY role_permissions_authenticated_select ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- User_roles table policies
DROP POLICY IF EXISTS user_roles_service_role_all ON public.user_roles;
CREATE POLICY user_roles_service_role_all ON public.user_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_roles_authenticated_select ON public.user_roles;
CREATE POLICY user_roles_authenticated_select ON public.user_roles FOR SELECT TO authenticated USING (true);

-- User_role_permissions table policies
DROP POLICY IF EXISTS user_role_permissions_service_role_all ON public.user_role_permissions;
CREATE POLICY user_role_permissions_service_role_all ON public.user_role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_role_permissions_authenticated_select ON public.user_role_permissions;
CREATE POLICY user_role_permissions_authenticated_select ON public.user_role_permissions FOR SELECT TO authenticated USING (true);

-- User_sessions table policies
DROP POLICY IF EXISTS user_sessions_service_role_all ON public.user_sessions;
CREATE POLICY user_sessions_service_role_all ON public.user_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_sessions_authenticated_own ON public.user_sessions;
CREATE POLICY user_sessions_authenticated_own ON public.user_sessions FOR ALL TO authenticated USING (user_id = auth.uid());

-- User_preferences table policies
DROP POLICY IF EXISTS user_preferences_service_role_all ON public.user_preferences;
CREATE POLICY user_preferences_service_role_all ON public.user_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_preferences_authenticated_own ON public.user_preferences;
CREATE POLICY user_preferences_authenticated_own ON public.user_preferences FOR ALL TO authenticated USING (user_id = auth.uid());

-- Dashboard_templates table policies
DROP POLICY IF EXISTS dashboard_templates_service_role_all ON public.dashboard_templates;
CREATE POLICY dashboard_templates_service_role_all ON public.dashboard_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS dashboard_templates_authenticated_select ON public.dashboard_templates;
CREATE POLICY dashboard_templates_authenticated_select ON public.dashboard_templates FOR SELECT TO authenticated USING (is_public = true OR created_by = auth.uid());

-- User_dashboards table policies
DROP POLICY IF EXISTS user_dashboards_service_role_all ON public.user_dashboards;
CREATE POLICY user_dashboards_service_role_all ON public.user_dashboards FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_dashboards_authenticated_own ON public.user_dashboards;
CREATE POLICY user_dashboards_authenticated_own ON public.user_dashboards FOR ALL TO authenticated USING (user_id = auth.uid());

-- User_dashboard_widgets table policies
DROP POLICY IF EXISTS user_dashboard_widgets_service_role_all ON public.user_dashboard_widgets;
CREATE POLICY user_dashboard_widgets_service_role_all ON public.user_dashboard_widgets FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS user_dashboard_widgets_authenticated_own ON public.user_dashboard_widgets;
CREATE POLICY user_dashboard_widgets_authenticated_own ON public.user_dashboard_widgets FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_dashboards WHERE id = dashboard_id AND user_id = auth.uid()));

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- =====================================================
-- Log completion
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Auth schema created successfully';
END $$;
