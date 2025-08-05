-- Complete Collection Setup - Execute in Order
-- This script ensures all dependencies are created in the correct order

-- Step 1: Create countries table if needed
CREATE TABLE IF NOT EXISTS kastle_banking.countries (
    country_code CHARACTER VARYING(3) NOT NULL PRIMARY KEY,
    country_name CHARACTER VARYING(100) NOT NULL
);

INSERT INTO kastle_banking.countries (country_code, country_name) 
VALUES ('SAU', 'Saudi Arabia')
ON CONFLICT (country_code) DO NOTHING;

-- Step 2: Create update function if needed
CREATE OR REPLACE FUNCTION kastle_banking.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Ensure branches table exists and has data
DO $$ 
BEGIN
    -- First check if branches exist
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.branches WHERE branch_id IN ('RYD_MAIN', 'JEDDAH', 'DAMMAM', 'KHOBAR')) THEN
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
            ('KHOBAR', 'KHB001', 'Khobar Branch', 'SUB', 'Prince Turki Street, Al Khobar North', 'Khobar', 'Eastern Province', 'SAU', '31952', '+966-13-456-7890', 'khobar@osoulbank.sa', '2013-09-05', true, 'ACTIVE')
        ON CONFLICT (branch_id) DO NOTHING;
        
        RAISE NOTICE 'Branches inserted successfully';
    ELSE
        RAISE NOTICE 'Branches already exist';
    END IF;
END $$;

-- Step 4: Verify branches exist
DO $$ 
DECLARE
    branch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO branch_count FROM kastle_banking.branches WHERE branch_id = 'RYD_MAIN';
    IF branch_count = 0 THEN
        RAISE EXCEPTION 'Branch RYD_MAIN not found. Please check branches table.';
    END IF;
END $$;

-- Step 5: Create collection teams if needed
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

-- Step 6: Insert teams
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

-- Step 7: Create and populate collection officers
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

-- Step 8: Now insert daily collection summary data
-- First, let's check what branch_ids actually exist
DO $$ 
DECLARE
    branch_record RECORD;
    date_record RECORD;
BEGIN
    RAISE NOTICE 'Available branches:';
    FOR branch_record IN SELECT branch_id, branch_name FROM kastle_banking.branches WHERE is_active = true LOOP
        RAISE NOTICE 'Branch: % - %', branch_record.branch_id, branch_record.branch_name;
    END LOOP;
    
    -- Insert data for each date and the first active branch
    FOR date_record IN 
        SELECT date_series.date::DATE as summary_date
        FROM generate_series(
            DATE_TRUNC('month', CURRENT_DATE),
            CURRENT_DATE,
            '1 day'::INTERVAL
        ) AS date_series(date)
    LOOP
        -- Check if record exists for this date
        IF NOT EXISTS (
            SELECT 1 FROM kastle_banking.daily_collection_summary 
            WHERE summary_date = date_record.summary_date
        ) THEN
            -- Get the first active branch
            SELECT branch_id INTO branch_record 
            FROM kastle_banking.branches 
            WHERE is_active = true 
            ORDER BY branch_id 
            LIMIT 1;
            
            IF branch_record.branch_id IS NOT NULL THEN
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
                ) VALUES (
                    date_record.summary_date,
                    branch_record.branch_id,
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
                );
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Daily collection summary data inserted successfully';
END $$;

-- Step 9: Create other collection tables
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

CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER,
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

-- Step 10: Grant permissions
GRANT ALL ON kastle_banking.collection_interactions TO authenticated;
GRANT ALL ON kastle_banking.collection_officers TO authenticated;
GRANT ALL ON kastle_banking.collection_teams TO authenticated;
GRANT ALL ON kastle_banking.promise_to_pay TO authenticated;
GRANT ALL ON kastle_banking.daily_collection_summary TO authenticated;

-- Grant sequence permissions
DO $$ 
BEGIN
    -- Grant permissions only if sequences exist
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'collection_interactions_interaction_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE kastle_banking.collection_interactions_interaction_id_seq TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'collection_teams_team_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE kastle_banking.collection_teams_team_id_seq TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'promise_to_pay_ptp_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE kastle_banking.promise_to_pay_ptp_id_seq TO authenticated;
    END IF;
END $$;

-- Step 11: Display summary
SELECT 
    'Branches' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.branches
UNION ALL
SELECT 
    'Collection Teams' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.collection_teams
UNION ALL
SELECT 
    'Daily Collection Summary' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.daily_collection_summary
WHERE summary_date >= DATE_TRUNC('month', CURRENT_DATE);

-- Show which branches have data
SELECT 
    b.branch_id,
    b.branch_name,
    COUNT(dcs.summary_id) as summary_records
FROM kastle_banking.branches b
LEFT JOIN kastle_banking.daily_collection_summary dcs ON b.branch_id = dcs.branch_id
GROUP BY b.branch_id, b.branch_name
ORDER BY b.branch_id;