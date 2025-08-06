-- Setup Daily Collection Dashboard Tables
-- This script creates the necessary tables for the Daily Collection Dashboard

-- 1. Daily Collection Summary Table
CREATE TABLE IF NOT EXISTS public.daily_collection_summary (
    id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL,
    total_due_today DECIMAL(15, 2) DEFAULT 0,
    ptp_due_today DECIMAL(15, 2) DEFAULT 0,
    field_visits_scheduled INTEGER DEFAULT 0,
    legal_cases_updates INTEGER DEFAULT 0,
    yesterday_collection DECIMAL(15, 2) DEFAULT 0,
    yesterday_target DECIMAL(15, 2) DEFAULT 0,
    yesterday_achievement DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(summary_date)
);

-- 2. Collection Officers Table
CREATE TABLE IF NOT EXISTS public.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    officer_name VARCHAR(255) NOT NULL,
    team_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'offline', -- online, offline, break, on_call
    is_active BOOLEAN DEFAULT true,
    current_activity JSONB,
    last_activity_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Collection Teams Table
CREATE TABLE IF NOT EXISTS public.collection_teams (
    team_id VARCHAR(50) PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    team_leader VARCHAR(50),
    branch_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Collection Payments Table
CREATE TABLE IF NOT EXISTS public.collection_payments (
    payment_id SERIAL PRIMARY KEY,
    case_id VARCHAR(50),
    customer_id VARCHAR(50),
    customer_name VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50), -- online, bank_transfer, field_collection, ivr, mobile_app
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    collector_id VARCHAR(50),
    collector_name VARCHAR(255),
    team_id VARCHAR(50),
    team_name VARCHAR(255),
    receipt_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Collection PTP (Promise to Pay) Table
CREATE TABLE IF NOT EXISTS public.collection_ptp (
    ptp_id SERIAL PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    customer_name VARCHAR(255),
    ptp_amount DECIMAL(15, 2) NOT NULL,
    ptp_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, fulfilled, broken, partial
    fulfilled_amount DECIMAL(15, 2) DEFAULT 0,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Field Visits Table
CREATE TABLE IF NOT EXISTS public.field_visits (
    visit_id SERIAL PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    customer_name VARCHAR(255),
    visit_date DATE NOT NULL,
    visit_time TIME,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    officer_id VARCHAR(50),
    officer_name VARCHAR(255),
    address TEXT,
    contact_number VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal', -- high, normal, low
    visit_result TEXT,
    amount_collected DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Legal Cases Table
CREATE TABLE IF NOT EXISTS public.legal_cases (
    legal_case_id SERIAL PRIMARY KEY,
    case_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    customer_name VARCHAR(255),
    case_status VARCHAR(50) DEFAULT 'active', -- active, pending, hearing_scheduled, closed, settled
    court_date DATE,
    lawyer_assigned VARCHAR(255),
    outstanding_amount DECIMAL(15, 2),
    last_update TEXT,
    next_action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_payments_date ON public.collection_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_collection_payments_case ON public.collection_payments(case_id);
CREATE INDEX IF NOT EXISTS idx_collection_ptp_date ON public.collection_ptp(ptp_date);
CREATE INDEX IF NOT EXISTS idx_collection_ptp_case ON public.collection_ptp(case_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_date ON public.field_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_field_visits_case ON public.field_visits(case_id);
CREATE INDEX IF NOT EXISTS idx_legal_cases_status ON public.legal_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_collection_officers_status ON public.collection_officers(status);

-- Add foreign key constraints
ALTER TABLE public.collection_officers 
    ADD CONSTRAINT fk_officer_team 
    FOREIGN KEY (team_id) 
    REFERENCES public.collection_teams(team_id);

ALTER TABLE public.collection_payments 
    ADD CONSTRAINT fk_payment_officer 
    FOREIGN KEY (collector_id) 
    REFERENCES public.collection_officers(officer_id);

-- Enable Row Level Security
ALTER TABLE public.daily_collection_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_ptp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all authenticated users for now)
CREATE POLICY "Allow all authenticated users" ON public.daily_collection_summary
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON public.collection_officers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON public.collection_teams
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON public.collection_payments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON public.collection_ptp
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON public.field_visits
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users" ON public.legal_cases
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.daily_collection_summary TO authenticated;
GRANT ALL ON public.collection_officers TO authenticated;
GRANT ALL ON public.collection_teams TO authenticated;
GRANT ALL ON public.collection_payments TO authenticated;
GRANT ALL ON public.collection_ptp TO authenticated;
GRANT ALL ON public.field_visits TO authenticated;
GRANT ALL ON public.legal_cases TO authenticated;

-- Insert sample data for testing
INSERT INTO public.collection_teams (team_id, team_name, team_leader) VALUES
    ('TEAM-A', 'Team Alpha', 'Mohammed Ali'),
    ('TEAM-B', 'Team Beta', 'Sara Ahmed'),
    ('TEAM-C', 'Team Charlie', 'Abdullah Hassan')
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_officers (officer_id, officer_name, team_id, status) VALUES
    ('OFF-001', 'Mohammed Ali', 'TEAM-A', 'online'),
    ('OFF-002', 'Sara Ahmed', 'TEAM-B', 'online'),
    ('OFF-003', 'Abdullah Hassan', 'TEAM-A', 'break'),
    ('OFF-004', 'Fatima Noor', 'TEAM-C', 'online'),
    ('OFF-005', 'Khalid Omar', 'TEAM-B', 'offline')
ON CONFLICT DO NOTHING;

-- Insert today's summary
INSERT INTO public.daily_collection_summary (
    summary_date,
    total_due_today,
    ptp_due_today,
    field_visits_scheduled,
    legal_cases_updates,
    yesterday_collection,
    yesterday_target,
    yesterday_achievement
) VALUES (
    CURRENT_DATE,
    15500000,
    8200000,
    145,
    23,
    12800000,
    14000000,
    91.4
) ON CONFLICT (summary_date) DO UPDATE SET
    total_due_today = EXCLUDED.total_due_today,
    ptp_due_today = EXCLUDED.ptp_due_today,
    field_visits_scheduled = EXCLUDED.field_visits_scheduled,
    legal_cases_updates = EXCLUDED.legal_cases_updates,
    yesterday_collection = EXCLUDED.yesterday_collection,
    yesterday_target = EXCLUDED.yesterday_target,
    yesterday_achievement = EXCLUDED.yesterday_achievement,
    updated_at = CURRENT_TIMESTAMP;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_daily_collection_summary_updated_at BEFORE UPDATE ON public.daily_collection_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_officers_updated_at BEFORE UPDATE ON public.collection_officers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_teams_updated_at BEFORE UPDATE ON public.collection_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_payments_updated_at BEFORE UPDATE ON public.collection_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collection_ptp_updated_at BEFORE UPDATE ON public.collection_ptp
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_visits_updated_at BEFORE UPDATE ON public.field_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_cases_updated_at BEFORE UPDATE ON public.legal_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();