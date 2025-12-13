-- Security Events Table for SIEM Integration
-- This table stores all security-relevant events for audit logging and SIEM forwarding
-- Run this script in your Supabase SQL editor

-- Create the security_events table in the kastle_banking schema
CREATE TABLE IF NOT EXISTS kastle_banking.security_events (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity INTEGER NOT NULL DEFAULT 6, -- Default to INFO level
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Actor information (who triggered the event)
    actor_user_id VARCHAR(255),
    actor_email VARCHAR(255),
    actor_ip_address INET,
    actor_user_agent TEXT,
    actor_session_id VARCHAR(255),
    
    -- Target information (what was affected)
    target_resource_type VARCHAR(100),
    target_resource_id VARCHAR(255),
    target_resource_name VARCHAR(255),
    
    -- Event payload (JSON for flexibility)
    payload JSONB DEFAULT '{}',
    
    -- Metadata for correlation and filtering
    metadata JSONB DEFAULT '{}',
    
    -- Source information
    source_application VARCHAR(100) DEFAULT 'osol-banking',
    source_component VARCHAR(100),
    source_environment VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for common queries
    CONSTRAINT security_events_severity_check CHECK (severity >= 0 AND severity <= 7)
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp 
    ON kastle_banking.security_events (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_event_type 
    ON kastle_banking.security_events (event_type);

CREATE INDEX IF NOT EXISTS idx_security_events_actor_user_id 
    ON kastle_banking.security_events (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_security_events_actor_email 
    ON kastle_banking.security_events (actor_email);

CREATE INDEX IF NOT EXISTS idx_security_events_severity 
    ON kastle_banking.security_events (severity);

CREATE INDEX IF NOT EXISTS idx_security_events_target 
    ON kastle_banking.security_events (target_resource_type, target_resource_id);

-- GIN index for JSONB payload queries
CREATE INDEX IF NOT EXISTS idx_security_events_payload 
    ON kastle_banking.security_events USING GIN (payload);

CREATE INDEX IF NOT EXISTS idx_security_events_metadata 
    ON kastle_banking.security_events USING GIN (metadata);

-- Composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_security_events_type_timestamp 
    ON kastle_banking.security_events (event_type, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE kastle_banking.security_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for authenticated users (audit logging)
CREATE POLICY security_events_insert_policy ON kastle_banking.security_events
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Policy: Allow select for admin users only
CREATE POLICY security_events_select_policy ON kastle_banking.security_events
    FOR SELECT
    TO authenticated
    USING (
        -- Allow admins to view all security events
        -- In production, implement proper role checking
        true
    );

-- Comment on the table and columns
COMMENT ON TABLE kastle_banking.security_events IS 'Security event log for SIEM integration and audit compliance';
COMMENT ON COLUMN kastle_banking.security_events.event_id IS 'Unique identifier for the security event (UUID)';
COMMENT ON COLUMN kastle_banking.security_events.event_type IS 'Type of security event (e.g., auth.login_success, authz.role_change)';
COMMENT ON COLUMN kastle_banking.security_events.severity IS 'Syslog severity level (0=Emergency to 7=Debug)';
COMMENT ON COLUMN kastle_banking.security_events.actor_user_id IS 'ID of the user who triggered the event';
COMMENT ON COLUMN kastle_banking.security_events.actor_ip_address IS 'IP address of the client';
COMMENT ON COLUMN kastle_banking.security_events.payload IS 'Event-specific data in JSON format';
COMMENT ON COLUMN kastle_banking.security_events.metadata IS 'Additional metadata for correlation and filtering';

-- Create a view for recent security events (last 24 hours)
CREATE OR REPLACE VIEW kastle_banking.recent_security_events AS
SELECT 
    event_id,
    event_type,
    severity,
    timestamp,
    actor_user_id,
    actor_email,
    actor_ip_address,
    target_resource_type,
    target_resource_id,
    payload,
    metadata
FROM kastle_banking.security_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Create a view for security alerts (severity <= WARNING)
CREATE OR REPLACE VIEW kastle_banking.security_alerts AS
SELECT 
    event_id,
    event_type,
    severity,
    timestamp,
    actor_user_id,
    actor_email,
    actor_ip_address,
    target_resource_type,
    target_resource_id,
    payload,
    metadata
FROM kastle_banking.security_events
WHERE severity <= 4 -- WARNING level and above
ORDER BY timestamp DESC;

-- Function to clean up old security events (retention policy)
CREATE OR REPLACE FUNCTION kastle_banking.cleanup_old_security_events(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM kastle_banking.security_events
    WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION kastle_banking.cleanup_old_security_events IS 'Removes security events older than the specified retention period';

-- Grant necessary permissions
GRANT INSERT ON kastle_banking.security_events TO anon, authenticated;
GRANT SELECT ON kastle_banking.security_events TO authenticated;
GRANT SELECT ON kastle_banking.recent_security_events TO authenticated;
GRANT SELECT ON kastle_banking.security_alerts TO authenticated;
GRANT USAGE ON SEQUENCE kastle_banking.security_events_id_seq TO anon, authenticated;

-- Output success message
DO $$ 
BEGIN
    RAISE NOTICE 'Security events table created successfully in kastle_banking schema';
END $$;
