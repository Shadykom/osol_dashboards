-- Fix branches and collection data
-- First, ensure branches exist before inserting collection data

-- Insert branches if they don't exist
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

-- Now insert collection teams if they don't exist
INSERT INTO kastle_banking.collection_teams (
    team_id,
    team_name,
    team_lead,
    branch_id,
    is_active
) VALUES
    (1, 'Team A', 'TL001', 'RYD_MAIN', true),
    (2, 'Team B', 'TL002', 'JEDDAH', true),
    (3, 'Team C', 'TL003', 'DAMMAM', true),
    (4, 'Team D', 'TL004', 'KHOBAR', true)
ON CONFLICT (team_id) DO NOTHING;

-- Insert sample data for current month
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

-- Also add some historical data for the previous month
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
    180000 + (RANDOM() * 280000)::NUMERIC(18,2),
    45000 + (RANDOM() * 140000)::NUMERIC(18,2),
    23 + (RANDOM() * 32)::NUMERIC(5,2),
    140 + (RANDOM() * 90)::INTEGER,
    45 + (RANDOM() * 45)::INTEGER,
    180 + (RANDOM() * 280)::INTEGER,
    90 + (RANDOM() * 140)::INTEGER,
    18 + (RANDOM() * 28)::INTEGER,
    13 + (RANDOM() * 18)::INTEGER,
    8 + (RANDOM() * 18)::INTEGER,
    4 + (RANDOM() * 9)::INTEGER,
    25 + (RANDOM() * 45)::INTEGER,
    140 + (RANDOM() * 45)::INTEGER,
    480000 + (RANDOM() * 950000)::NUMERIC(15,2),
    18 + (RANDOM() * 28)::INTEGER
FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
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