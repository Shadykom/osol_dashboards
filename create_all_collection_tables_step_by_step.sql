-- Create All Collection Dashboard Tables Step by Step
-- This script creates each table individually with proper error handling

-- Step 1: Ensure schema exists and set permissions
\echo 'Step 1: Setting up schema and permissions...'
CREATE SCHEMA IF NOT EXISTS kastle_banking;
GRANT USAGE ON SCHEMA kastle_banking TO authenticated, anon, service_role;
GRANT CREATE ON SCHEMA kastle_banking TO authenticated;

-- Step 2: Create remediation_actions table
\echo 'Step 2: Creating remediation_actions table...'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'remediation_actions') THEN
        CREATE TABLE kastle_banking.remediation_actions (
            action_id SERIAL PRIMARY KEY,
            case_id INTEGER,
            action_type VARCHAR(50) NOT NULL,
            action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            action_status VARCHAR(50) DEFAULT 'PENDING',
            original_amount DECIMAL(15,2),
            proposed_amount DECIMAL(15,2),
            approved_amount DECIMAL(15,2),
            approved_by VARCHAR(50),
            approved_date TIMESTAMP,
            notes TEXT,
            created_by VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created remediation_actions table';
    ELSE
        RAISE NOTICE 'remediation_actions table already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating remediation_actions: %', SQLERRM;
END $$;

-- Step 3: Create portfolio_metrics table
\echo 'Step 3: Creating portfolio_metrics table...'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'portfolio_metrics') THEN
        CREATE TABLE kastle_banking.portfolio_metrics (
            metric_id SERIAL PRIMARY KEY,
            metric_date DATE NOT NULL,
            total_portfolio_value DECIMAL(15,2),
            total_overdue_amount DECIMAL(15,2),
            npl_ratio DECIMAL(5,2),
            collection_rate DECIMAL(5,2),
            bucket_30_60_amount DECIMAL(15,2),
            bucket_30_60_count INTEGER,
            bucket_60_90_amount DECIMAL(15,2),
            bucket_60_90_count INTEGER,
            bucket_90_180_amount DECIMAL(15,2),
            bucket_90_180_count INTEGER,
            bucket_180_360_amount DECIMAL(15,2),
            bucket_180_360_count INTEGER,
            bucket_360_plus_amount DECIMAL(15,2),
            bucket_360_plus_count INTEGER,
            total_restructured_count INTEGER,
            total_restructured_amount DECIMAL(15,2),
            total_settlements_count INTEGER,
            total_settlements_amount DECIMAL(15,2),
            total_legal_referrals_count INTEGER,
            total_legal_referrals_amount DECIMAL(15,2),
            total_write_offs_count INTEGER,
            total_write_offs_amount DECIMAL(15,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created portfolio_metrics table';
    ELSE
        RAISE NOTICE 'portfolio_metrics table already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating portfolio_metrics: %', SQLERRM;
END $$;

-- Step 4: Create product_performance table
\echo 'Step 4: Creating product_performance table...'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'product_performance') THEN
        CREATE TABLE kastle_banking.product_performance (
            performance_id SERIAL PRIMARY KEY,
            product_type VARCHAR(50) NOT NULL,
            performance_date DATE NOT NULL,
            total_portfolio_value DECIMAL(15,2),
            total_overdue_amount DECIMAL(15,2),
            npl_ratio DECIMAL(5,2),
            collection_amount DECIMAL(15,2),
            collection_rate DECIMAL(5,2),
            bucket_distribution JSONB,
            remediation_success_rate DECIMAL(5,2),
            average_days_to_resolve INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(product_type, performance_date)
        );
        RAISE NOTICE 'Created product_performance table';
    ELSE
        RAISE NOTICE 'product_performance table already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating product_performance: %', SQLERRM;
END $$;

-- Step 5: Create collection_targets table
\echo 'Step 5: Creating collection_targets table...'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_targets') THEN
        CREATE TABLE kastle_banking.collection_targets (
            target_id SERIAL PRIMARY KEY,
            target_type VARCHAR(50) NOT NULL,
            target_reference VARCHAR(50) NOT NULL,
            target_month DATE NOT NULL,
            target_amount DECIMAL(15,2) NOT NULL,
            target_npl_ratio DECIMAL(5,2),
            target_collection_rate DECIMAL(5,2),
            created_by VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(target_type, target_reference, target_month)
        );
        RAISE NOTICE 'Created collection_targets table';
    ELSE
        RAISE NOTICE 'collection_targets table already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating collection_targets: %', SQLERRM;
END $$;

-- Step 6: Create recommended_actions table
\echo 'Step 6: Creating recommended_actions table...'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'recommended_actions') THEN
        CREATE TABLE kastle_banking.recommended_actions (
            recommendation_id SERIAL PRIMARY KEY,
            case_id INTEGER,
            action_type VARCHAR(100) NOT NULL,
            action_description TEXT,
            priority VARCHAR(20) DEFAULT 'MEDIUM',
            due_date DATE,
            is_completed BOOLEAN DEFAULT FALSE,
            completed_date TIMESTAMP,
            completed_by VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created recommended_actions table';
    ELSE
        RAISE NOTICE 'recommended_actions table already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating recommended_actions: %', SQLERRM;
END $$;

-- Step 7: Create promise_to_pay table
\echo 'Step 7: Creating promise_to_pay table...'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'promise_to_pay') THEN
        CREATE TABLE kastle_banking.promise_to_pay (
            ptp_id SERIAL PRIMARY KEY,
            case_id INTEGER,
            promised_amount DECIMAL(15,2) NOT NULL,
            promise_date DATE NOT NULL,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_by VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            kept_amount DECIMAL(15,2),
            kept_date DATE,
            broken_reason VARCHAR(200)
        );
        RAISE NOTICE 'Created promise_to_pay table';
    ELSE
        RAISE NOTICE 'promise_to_pay table already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating promise_to_pay: %', SQLERRM;
END $$;

-- Step 8: Create collection_interactions table
\echo 'Step 8: Creating collection_interactions table...'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_interactions') THEN
        CREATE TABLE kastle_banking.collection_interactions (
            interaction_id SERIAL PRIMARY KEY,
            case_id INTEGER,
            officer_id VARCHAR(50),
            interaction_type VARCHAR(50) NOT NULL,
            interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            channel VARCHAR(50),
            outcome VARCHAR(50),
            notes TEXT,
            next_action VARCHAR(100),
            next_action_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created collection_interactions table';
    ELSE
        RAISE NOTICE 'collection_interactions table already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating collection_interactions: %', SQLERRM;
END $$;

-- Step 9: Grant permissions on all tables
\echo 'Step 9: Granting permissions...'
DO $$
BEGIN
    -- Grant permissions on tables
    GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
    GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon;
    
    -- Grant permissions on sequences
    GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;
    
    RAISE NOTICE 'Permissions granted successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error granting permissions: %', SQLERRM;
END $$;

-- Step 10: Disable RLS for testing
\echo 'Step 10: Disabling RLS for testing...'
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking' 
        AND tablename IN ('remediation_actions', 'portfolio_metrics', 'product_performance', 
                         'collection_targets', 'recommended_actions', 'promise_to_pay', 
                         'collection_interactions', 'user_roles', 'collection_cases')
    LOOP
        EXECUTE format('ALTER TABLE kastle_banking.%I DISABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Disabled RLS for %', tbl.tablename;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error disabling RLS: %', SQLERRM;
END $$;

-- Step 11: Add sample data
\echo 'Step 11: Adding sample data...'
DO $$
BEGIN
    -- Insert sample portfolio metrics
    INSERT INTO kastle_banking.portfolio_metrics (
        metric_date, 
        total_portfolio_value, 
        total_overdue_amount, 
        npl_ratio, 
        collection_rate,
        bucket_30_60_amount, bucket_30_60_count,
        bucket_60_90_amount, bucket_60_90_count,
        bucket_90_180_amount, bucket_90_180_count,
        bucket_180_360_amount, bucket_180_360_count,
        bucket_360_plus_amount, bucket_360_plus_count
    )
    SELECT 
        date_trunc('month', CURRENT_DATE - (n || ' months')::interval)::date,
        1000000000 - (n * 10000000),
        50000000 + (n * 1000000),
        4.5 + (n * 0.1),
        75 - (n * 2),
        10000000, 100,
        8000000, 80,
        15000000, 120,
        12000000, 90,
        5000000, 30
    FROM generate_series(0, 5) n
    ON CONFLICT DO NOTHING;
    
    -- Insert sample collection targets
    INSERT INTO kastle_banking.collection_targets (
        target_type, 
        target_reference, 
        target_month, 
        target_amount, 
        target_npl_ratio, 
        target_collection_rate
    )
    VALUES 
        ('COMPANY', 'COMPANY', date_trunc('month', CURRENT_DATE)::date, 100000000, 4.0, 80.0)
    ON CONFLICT (target_type, target_reference, target_month) DO NOTHING;
    
    RAISE NOTICE 'Sample data inserted successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inserting sample data: %', SQLERRM;
END $$;

-- Step 12: Verify all tables were created
\echo 'Step 12: Verifying tables...'
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✓ Created'
        ELSE '✗ Missing'
    END as status
FROM (
    VALUES 
        ('remediation_actions'),
        ('portfolio_metrics'),
        ('product_performance'),
        ('collection_targets'),
        ('recommended_actions'),
        ('promise_to_pay'),
        ('collection_interactions')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables ist 
    ON ist.table_name = required_tables.table_name 
    AND ist.table_schema = 'kastle_banking'
ORDER BY required_tables.table_name;

\echo 'Setup complete!'