-- Create dashboard persistence tables if they don't exist
-- This script ensures user dashboard customizations are properly saved in the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create dashboard_templates table if not exists
CREATE TABLE IF NOT EXISTS public.dashboard_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout_config JSONB NOT NULL DEFAULT '{}',
    widgets_config JSONB NOT NULL DEFAULT '[]',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_dashboards table if not exists
CREATE TABLE IF NOT EXISTS public.user_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES public.dashboard_templates(id) ON DELETE SET NULL,
    layout_config JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_dashboard_widgets table if not exists
CREATE TABLE IF NOT EXISTS public.user_dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID NOT NULL REFERENCES public.user_dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    widget_config JSONB NOT NULL DEFAULT '{}',
    position_config JSONB NOT NULL DEFAULT '{}',
    is_visible BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_preferences table if not exists (for general settings)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    preferences JSONB NOT NULL DEFAULT '{}',
    theme VARCHAR(50) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    dashboard_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_dashboards_user_id ON public.user_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboards_is_active ON public.user_dashboards(is_active);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_widgets_dashboard_id ON public.user_dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_widgets_is_visible ON public.user_dashboard_widgets(is_visible);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_dashboard_templates_updated_at ON public.dashboard_templates;
CREATE TRIGGER update_dashboard_templates_updated_at BEFORE UPDATE ON public.dashboard_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_dashboards_updated_at ON public.user_dashboards;
CREATE TRIGGER update_user_dashboards_updated_at BEFORE UPDATE ON public.user_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_dashboard_widgets_updated_at ON public.user_dashboard_widgets;
CREATE TRIGGER update_user_dashboard_widgets_updated_at BEFORE UPDATE ON public.user_dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_dashboards
DROP POLICY IF EXISTS "Users can view their own dashboards" ON public.user_dashboards;
CREATE POLICY "Users can view their own dashboards" ON public.user_dashboards
    FOR SELECT USING (true);  -- Allow all authenticated users to read for now

DROP POLICY IF EXISTS "Users can insert their own dashboards" ON public.user_dashboards;
CREATE POLICY "Users can insert their own dashboards" ON public.user_dashboards
    FOR INSERT WITH CHECK (true);  -- Allow all authenticated users to insert

DROP POLICY IF EXISTS "Users can update their own dashboards" ON public.user_dashboards;
CREATE POLICY "Users can update their own dashboards" ON public.user_dashboards
    FOR UPDATE USING (true);  -- Allow all authenticated users to update

DROP POLICY IF EXISTS "Users can delete their own dashboards" ON public.user_dashboards;
CREATE POLICY "Users can delete their own dashboards" ON public.user_dashboards
    FOR DELETE USING (true);  -- Allow all authenticated users to delete

-- Create RLS policies for user_dashboard_widgets
DROP POLICY IF EXISTS "Users can manage their dashboard widgets" ON public.user_dashboard_widgets;
CREATE POLICY "Users can manage their dashboard widgets" ON public.user_dashboard_widgets
    FOR ALL USING (true);  -- Allow all authenticated users full access

-- Create RLS policies for user_preferences
DROP POLICY IF EXISTS "Users can manage their preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their preferences" ON public.user_preferences
    FOR ALL USING (true);  -- Allow all authenticated users full access

-- Insert default dashboard templates if they don't exist
INSERT INTO public.dashboard_templates (name, description, layout_config, widgets_config, is_public)
VALUES 
    ('Executive Overview', 'High-level executive dashboard with key metrics', 
     '{"columns": 12, "rowHeight": 100, "gap": 16}',
     '[{"type": "revenue_kpi", "config": {"title": "Revenue"}, "position": {"x": 0, "y": 0, "w": 3, "h": 2}}]',
     true),
    ('Collection Dashboard', 'Detailed collection metrics and performance', 
     '{"columns": 12, "rowHeight": 100, "gap": 16}',
     '[{"type": "collection_rate", "config": {"title": "Collection Rate"}, "position": {"x": 0, "y": 0, "w": 4, "h": 2}}]',
     true),
    ('Branch Performance', 'Branch-wise performance metrics', 
     '{"columns": 12, "rowHeight": 100, "gap": 16}',
     '[{"type": "branch_chart", "config": {"title": "Branch Performance"}, "position": {"x": 0, "y": 0, "w": 6, "h": 4}}]',
     true)
ON CONFLICT DO NOTHING;

-- Grant permissions (for Supabase)
GRANT ALL ON public.dashboard_templates TO authenticated;
GRANT ALL ON public.user_dashboards TO authenticated;
GRANT ALL ON public.user_dashboard_widgets TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.user_dashboards IS 'Stores user-specific dashboard configurations that persist across sessions';
COMMENT ON TABLE public.user_dashboard_widgets IS 'Stores widget configurations for each user dashboard';
COMMENT ON TABLE public.user_preferences IS 'Stores general user preferences including dashboard settings';