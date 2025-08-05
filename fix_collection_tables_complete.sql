-- Complete Collection Tables Setup
-- This script ensures all collection-related tables exist with the correct structure

-- First, create the countries table if it doesn't exist (needed for branches foreign key)
CREATE TABLE IF NOT EXISTS kastle_banking.countries (
    country_code CHARACTER VARYING(3) NOT NULL PRIMARY KEY,
    country_name CHARACTER VARYING(100) NOT NULL
);

-- Insert some countries if they don't exist
INSERT INTO kastle_banking.countries (country_code, country_name) 
VALUES ('SAU', 'Saudi Arabia')
ON CONFLICT (country_code) DO NOTHING;

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION kastle_banking.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create branches table
CREATE TABLE IF NOT EXISTS kastle_banking.branches (
    branch_id CHARACTER VARYING(10) NOT NULL,
    branch_name CHARACTER VARYING(100) NOT NULL,
    branch_type CHARACTER VARYING(20) NULL,
    address TEXT NULL,
    city CHARACTER VARYING(50) NULL,
    state CHARACTER VARYING(50) NULL,
    country_code CHARACTER VARYING(3) NULL,
    postal_code CHARACTER VARYING(20) NULL,
    phone CHARACTER VARYING(20) NULL,
    email CHARACTER VARYING(100) NULL,
    manager_id CHARACTER VARYING(20) NULL,
    opening_date DATE NULL,
    is_active BOOLEAN NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    branch_code CHARACTER VARYING NOT NULL,
    status CHARACTER VARYING NULL DEFAULT 'ACTIVE'::CHARACTER VARYING,
    CONSTRAINT branches_pkey PRIMARY KEY (branch_id),
    CONSTRAINT branches_branch_code_key UNIQUE (branch_code),
    CONSTRAINT branches_country_code_fkey FOREIGN KEY (country_code) REFERENCES kastle_banking.countries (country_code),
    CONSTRAINT branches_branch_type_check CHECK (
        (branch_type)::TEXT = ANY (
            ARRAY[
                ('HEAD_OFFICE'::CHARACTER VARYING)::TEXT,
                ('MAIN'::CHARACTER VARYING)::TEXT,
                ('SUB'::CHARACTER VARYING)::TEXT,
                ('RURAL'::CHARACTER VARYING)::TEXT,
                ('URBAN'::CHARACTER VARYING)::TEXT
            ]
        )
    ),
    CONSTRAINT branches_status_check CHECK (
        (status)::TEXT = ANY (
            (
                ARRAY[
                    'ACTIVE'::CHARACTER VARYING,
                    'INACTIVE'::CHARACTER VARYING,
                    'CLOSED'::CHARACTER VARYING
                ]
            )::TEXT[]
        )
    )
);

-- Create index for branches
CREATE INDEX IF NOT EXISTS idx_branches_branch_code ON kastle_banking.branches USING btree (branch_code);

-- Create trigger for branches
DROP TRIGGER IF EXISTS update_branches_updated_at ON kastle_banking.branches;
CREATE TRIGGER update_branches_updated_at 
BEFORE UPDATE ON kastle_banking.branches 
FOR EACH ROW
EXECUTE FUNCTION kastle_banking.update_updated_at_column();

-- Insert branches
INSERT INTO kastle_banking.branches (
    branch_id,
    branch_code,
    branch_name,
    branch_type,
    address,
    city,
    state,
    country_code,
    postal_code,
    phone,
    email,
    opening_date,
    is_active,
    status
) VALUES 
    ('RYD_MAIN', 'RYD001', 'Riyadh Main Branch', 'MAIN', 'King Fahd Road, Al Olaya', 'Riyadh', 'Riyadh Province', 'SAU', '11433', '+966-11-123-4567', 'riyadh.main@osoulbank.sa', '2010-01-15', true, 'ACTIVE'),
    ('JEDDAH', 'JED001', 'Jeddah Branch', 'URBAN', 'Tahlia Street, Al Andalus', 'Jeddah', 'Makkah Province', 'SAU', '21491', '+966-12-234-5678', 'jeddah@osoulbank.sa', '2011-03-20', true, 'ACTIVE'),
    ('DAMMAM', 'DMM001', 'Dammam Branch', 'URBAN', 'King Saud Street, Al Shati', 'Dammam', 'Eastern Province', 'SAU', '31433', '+966-13-345-6789', 'dammam@osoulbank.sa', '2012-06-10', true, 'ACTIVE'),
    ('KHOBAR', 'KHB001', 'Khobar Branch', 'SUB', 'Prince Turki Street, Al Khobar North', 'Khobar', 'Eastern Province', 'SAU', '31952', '+966-13-456-7890', 'khobar@osoulbank.sa', '2013-09-05', true, 'ACTIVE'),
    ('MAKKAH', 'MKH001', 'Makkah Branch', 'URBAN', 'Ibrahim Al Khalil Street', 'Makkah', 'Makkah Province', 'SAU', '24231', '+966-12-567-8901', 'makkah@osoulbank.sa', '2014-01-20', true, 'ACTIVE'),
    ('MADINAH', 'MDN001', 'Madinah Branch', 'URBAN', 'King Abdul Aziz Road', 'Madinah', 'Madinah Province', 'SAU', '42311', '+966-14-678-9012', 'madinah@osoulbank.sa', '2014-11-15', true, 'ACTIVE')
ON CONFLICT (branch_id) DO NOTHING;

-- Create collection_teams table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id SERIAL NOT NULL,
    team_name CHARACTER VARYING(100) NOT NULL,
    team_type CHARACTER VARYING(50) NULL,
    team_lead_id CHARACTER VARYING(20) NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    branch_id TEXT NULL,
    is_active TEXT NULL,
    CONSTRAINT collection_teams_pkey PRIMARY KEY (team_id)
);

-- Insert collection teams
INSERT INTO kastle_banking.collection_teams (
    team_id,
    team_name,
    team_lead_id,
    branch_id,
    is_active
) VALUES
    (1, 'Team A', 'TL001', 'RYD_MAIN', 'true'),
    (2, 'Team B', 'TL002', 'JEDDAH', 'true'),
    (3, 'Team C', 'TL003', 'DAMMAM', 'true'),
    (4, 'Team D', 'TL004', 'KHOBAR', 'true')
ON CONFLICT (team_id) DO NOTHING;

-- Create collection_officers table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_officers (
    officer_id CHARACTER VARYING(20) NOT NULL,
    officer_name CHARACTER VARYING(100) NOT NULL,
    officer_type CHARACTER VARYING(50) NULL,
    team_id INTEGER NULL,
    contact_number CHARACTER VARYING(20) NULL,
    email CHARACTER VARYING(100) NULL,
    status CHARACTER VARYING(20) NULL DEFAULT 'ACTIVE'::CHARACTER VARYING,
    language_skills TEXT NULL,
    collection_limit NUMERIC(18, 2) NULL,
    commission_rate NUMERIC(5, 2) NULL,
    joining_date DATE NULL,
    last_active TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT collection_officers_pkey PRIMARY KEY (officer_id),
    CONSTRAINT collection_officers_team_id_fkey FOREIGN KEY (team_id) REFERENCES kastle_banking.collection_teams (team_id),
    CONSTRAINT fk_officer_team FOREIGN KEY (team_id) REFERENCES kastle_banking.collection_teams (team_id) ON DELETE SET NULL
);

-- Create index for collection_officers
CREATE INDEX IF NOT EXISTS idx_collection_officers_team_id ON kastle_banking.collection_officers USING btree (team_id);

-- Insert some sample officers
INSERT INTO kastle_banking.collection_officers (
    officer_id,
    officer_name,
    officer_type,
    team_id,
    contact_number,
    email,
    status,
    joining_date
) VALUES
    ('OFF001', 'Ahmed Al-Rashid', 'SENIOR', 1, '+966-50-123-4567', 'ahmed.rashid@osoulbank.sa', 'ACTIVE', '2020-01-15'),
    ('OFF002', 'Fatima Al-Zahrani', 'SENIOR', 2, '+966-50-234-5678', 'fatima.zahrani@osoulbank.sa', 'ACTIVE', '2019-06-20'),
    ('OFF003', 'Mohammed Al-Qahtani', 'JUNIOR', 3, '+966-50-345-6789', 'mohammed.qahtani@osoulbank.sa', 'ACTIVE', '2021-03-10'),
    ('OFF004', 'Sara Al-Otaibi', 'SENIOR', 4, '+966-50-456-7890', 'sara.otaibi@osoulbank.sa', 'ACTIVE', '2018-11-05')
ON CONFLICT (officer_id) DO NOTHING;

-- Create collection_interactions table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_interactions (
    interaction_id SERIAL NOT NULL,
    case_id INTEGER NULL,
    customer_id CHARACTER VARYING(20) NULL,
    interaction_type CHARACTER VARYING(30) NULL,
    interaction_direction CHARACTER VARYING(10) NULL,
    officer_id CHARACTER VARYING(20) NULL,
    contact_number CHARACTER VARYING(20) NULL,
    interaction_status CHARACTER VARYING(30) NULL,
    duration_seconds INTEGER NULL,
    outcome CHARACTER VARYING(50) NULL,
    promise_to_pay BOOLEAN NULL DEFAULT FALSE,
    ptp_amount NUMERIC(18, 2) NULL,
    ptp_date DATE NULL,
    notes TEXT NULL,
    recording_reference CHARACTER VARYING(100) NULL,
    interaction_datetime TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT collection_interactions_pkey PRIMARY KEY (interaction_id),
    CONSTRAINT collection_interactions_case_id_fkey FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases (case_id),
    CONSTRAINT collection_interactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers (customer_id),
    CONSTRAINT fk_collection_interactions_case_id FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases (case_id),
    CONSTRAINT collection_interactions_interaction_direction_check CHECK (
        (interaction_direction)::TEXT = ANY (
            ARRAY[
                ('INBOUND'::CHARACTER VARYING)::TEXT,
                ('OUTBOUND'::CHARACTER VARYING)::TEXT
            ]
        )
    ),
    CONSTRAINT collection_interactions_interaction_type_check CHECK (
        (interaction_type)::TEXT = ANY (
            ARRAY[
                ('CALL'::CHARACTER VARYING)::TEXT,
                ('SMS'::CHARACTER VARYING)::TEXT,
                ('EMAIL'::CHARACTER VARYING)::TEXT,
                ('LETTER'::CHARACTER VARYING)::TEXT,
                ('VISIT'::CHARACTER VARYING)::TEXT,
                ('LEGAL_NOTICE'::CHARACTER VARYING)::TEXT,
                ('WHATSAPP'::CHARACTER VARYING)::TEXT,
                ('IVR'::CHARACTER VARYING)::TEXT
            ]
        )
    )
);

-- Create indexes for collection_interactions
CREATE INDEX IF NOT EXISTS idx_interactions_case ON kastle_banking.collection_interactions USING btree (case_id);
CREATE INDEX IF NOT EXISTS idx_interactions_customer_date ON kastle_banking.collection_interactions USING btree (customer_id, interaction_datetime);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_officer_date ON kastle_banking.collection_interactions USING btree (officer_id, interaction_datetime);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_case ON kastle_banking.collection_interactions USING btree (case_id);

-- Create promise_to_pay table
CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES kastle_banking.collection_cases(case_id),
    ptp_amount NUMERIC(18,2) NOT NULL,
    ptp_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'KEPT', 'BROKEN', 'CANCELLED')),
    created_by VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    kept_amount NUMERIC(18,2),
    kept_date DATE,
    notes TEXT
);

-- Create indexes for promise_to_pay
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case ON kastle_banking.promise_to_pay(case_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_status ON kastle_banking.promise_to_pay(status);

-- Now insert daily collection summary data
INSERT INTO kastle_banking.daily_collection_summary (
    summary_date,
    branch_id,
    total_due_amount,
    total_collected,
    collection_rate,
    accounts_due,
    accounts_collected,
    calls_made,
    contacts_successful,
    ptps_obtained,
    ptps_kept,
    field_visits_done,
    legal_notices_sent,
    digital_payments,
    total_cases,
    total_outstanding,
    ptps_created
)
SELECT 
    date_series.date::DATE,
    branch.branch_id,
    200000 + (RANDOM() * 300000)::NUMERIC(18,2),
    50000 + (RANDOM() * 150000)::NUMERIC(18,2),
    25 + (RANDOM() * 35)::NUMERIC(5,2),
    150 + (RANDOM() * 100)::INTEGER,
    50 + (RANDOM() * 50)::INTEGER,
    200 + (RANDOM() * 300)::INTEGER,
    100 + (RANDOM() * 150)::INTEGER,
    20 + (RANDOM() * 30)::INTEGER,
    15 + (RANDOM() * 20)::INTEGER,
    10 + (RANDOM() * 20)::INTEGER,
    5 + (RANDOM() * 10)::INTEGER,
    30 + (RANDOM() * 50)::INTEGER,
    150 + (RANDOM() * 50)::INTEGER,
    500000 + (RANDOM() * 1000000)::NUMERIC(15,2),
    20 + (RANDOM() * 30)::INTEGER
FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE),
    CURRENT_DATE,
    '1 day'::INTERVAL
) AS date_series(date)
CROSS JOIN (
    SELECT branch_id FROM kastle_banking.branches WHERE is_active = true LIMIT 4
) AS branch
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.daily_collection_summary 
    WHERE summary_date = date_series.date::DATE 
    AND branch_id = branch.branch_id
);

-- Grant permissions
GRANT ALL ON kastle_banking.collection_interactions TO authenticated;
GRANT ALL ON kastle_banking.collection_officers TO authenticated;
GRANT ALL ON kastle_banking.collection_teams TO authenticated;
GRANT ALL ON kastle_banking.promise_to_pay TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.collection_interactions_interaction_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.collection_teams_team_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.promise_to_pay_ptp_id_seq TO authenticated;

-- Enable RLS
ALTER TABLE kastle_banking.collection_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.promise_to_pay ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all access for authenticated users" ON kastle_banking.collection_interactions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON kastle_banking.collection_officers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON kastle_banking.collection_teams
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON kastle_banking.promise_to_pay
    FOR ALL USING (true) WITH CHECK (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';