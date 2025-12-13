-- Migration: Create config_values table for @osol/config-resolver
-- Run this script in your Supabase SQL Editor

-- Create the config_values table in the kastle_banking schema
CREATE TABLE IF NOT EXISTS kastle_banking.config_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant identification
  tenant_id UUID NOT NULL,
  
  -- Configuration key (e.g., 'feature.enabled', 'ui.theme', 'limits.maxItems')
  key VARCHAR(255) NOT NULL,
  
  -- The configuration value stored as JSONB
  value_json JSONB NOT NULL,
  
  -- Type hint for the value ('string', 'number', 'boolean', 'object', 'array')
  value_type VARCHAR(50) DEFAULT 'string',
  
  -- Scope level for this configuration
  -- Determines specificity: user > branch > region > tenant > global
  scope VARCHAR(50) NOT NULL DEFAULT 'global',
  
  -- Scope identifier (e.g., user_id, branch_id, region_id)
  -- NULL for 'global' and 'tenant' scopes
  scope_id VARCHAR(255),
  
  -- Configuration status
  -- DRAFT: Not yet active
  -- PUBLISHED: Active and can be resolved
  -- ARCHIVED: No longer active
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  
  -- Version number for this configuration
  version INTEGER NOT NULL DEFAULT 1,
  
  -- When this configuration becomes effective
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- When this configuration expires (NULL = never expires)
  effective_to TIMESTAMPTZ,
  
  -- Additional metadata (JSON)
  metadata JSONB DEFAULT '{}',
  
  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT valid_scope CHECK (scope IN ('global', 'tenant', 'region', 'branch', 'user')),
  CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  CONSTRAINT valid_value_type CHECK (value_type IN ('string', 'number', 'boolean', 'object', 'array'))
);

-- Add comments for documentation
COMMENT ON TABLE kastle_banking.config_values IS 'Stores tenant configuration values with effective dating and scope-based resolution';
COMMENT ON COLUMN kastle_banking.config_values.scope IS 'Scope hierarchy: user > branch > region > tenant > global (more specific scopes override less specific)';
COMMENT ON COLUMN kastle_banking.config_values.effective_from IS 'Configuration becomes active at this time';
COMMENT ON COLUMN kastle_banking.config_values.effective_to IS 'Configuration expires at this time (NULL = never expires)';

-- Create indexes for efficient querying
-- Primary lookup index: tenant + key + status + effective dates
CREATE INDEX IF NOT EXISTS idx_config_values_lookup 
  ON kastle_banking.config_values(tenant_id, key, status, effective_from);

-- Scope-based filtering
CREATE INDEX IF NOT EXISTS idx_config_values_scope 
  ON kastle_banking.config_values(scope, scope_id);

-- Effective date range queries
CREATE INDEX IF NOT EXISTS idx_config_values_effective_range 
  ON kastle_banking.config_values(effective_from, effective_to);

-- Composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_config_values_resolution
  ON kastle_banking.config_values(tenant_id, key, status, effective_from, scope);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION kastle_banking.update_config_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_config_values_updated_at ON kastle_banking.config_values;
CREATE TRIGGER trigger_config_values_updated_at
  BEFORE UPDATE ON kastle_banking.config_values
  FOR EACH ROW
  EXECUTE FUNCTION kastle_banking.update_config_values_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE kastle_banking.config_values ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read configs for their tenant
CREATE POLICY config_values_tenant_isolation ON kastle_banking.config_values
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM kastle_banking.auth_user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON kastle_banking.config_values TO authenticated;
GRANT INSERT, UPDATE, DELETE ON kastle_banking.config_values TO authenticated;

-- ============================================================================
-- Sample data (optional - remove in production)
-- ============================================================================

-- Uncomment to insert sample configurations:
/*
-- Global default configuration
INSERT INTO kastle_banking.config_values (tenant_id, key, value_json, value_type, scope, status, effective_from)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'ui.theme', '"default"', 'string', 'global', 'PUBLISHED', NOW()),
  ('00000000-0000-0000-0000-000000000001', 'feature.darkMode', 'true', 'boolean', 'global', 'PUBLISHED', NOW()),
  ('00000000-0000-0000-0000-000000000001', 'limits.maxItemsPerPage', '50', 'number', 'global', 'PUBLISHED', NOW()),
  ('00000000-0000-0000-0000-000000000001', 'app.settings', '{"language": "en", "timezone": "UTC"}', 'object', 'tenant', 'PUBLISHED', NOW());

-- Branch-specific override
INSERT INTO kastle_banking.config_values (tenant_id, key, value_json, value_type, scope, scope_id, status, effective_from)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'limits.maxItemsPerPage', '100', 'number', 'branch', 'branch-001', 'PUBLISHED', NOW());
*/
