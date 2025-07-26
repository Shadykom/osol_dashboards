-- Create view for specialist loan portfolio
CREATE OR REPLACE VIEW v_specialist_loan_portfolio AS
SELECT 
    cc.case_id,
    cc.loan_account_number,
    cc.customer_id,
    cc.officer_id,
    cc.loan_amount,
    cc.outstanding_balance,
    cc.overdue_amount as due_amount,
    cc.overdue_days,
    cc.delinquency_bucket,
    cc.priority_level,
    cc.loan_status,
    cc.product_type,
    cc.last_payment_date,
    cc.last_payment_amount,
    cc.created_at,
    cc.updated_at,
    c.full_name as customer_name,
    c.national_id,
    c.mobile_number,
    (cc.loan_amount - cc.outstanding_balance) as paid_amount,
    ci.interaction_datetime as last_contact_date
FROM collection_cases cc
LEFT JOIN customers c ON cc.customer_id = c.customer_id
LEFT JOIN LATERAL (
    SELECT interaction_datetime 
    FROM collection_interactions 
    WHERE case_id = cc.case_id 
    ORDER BY interaction_datetime DESC 
    LIMIT 1
) ci ON true;

-- Create table for officer performance summary
CREATE TABLE IF NOT EXISTS officer_performance_summary (
    summary_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_ptps INTEGER DEFAULT 0,
    ptps_kept INTEGER DEFAULT 0,
    collection_amount DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    contact_rate DECIMAL(5,2) DEFAULT 0,
    ptp_keep_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(officer_id, summary_date)
);

-- Create function to update officer performance summary
CREATE OR REPLACE FUNCTION update_officer_performance_summary()
RETURNS void AS $$
BEGIN
    INSERT INTO officer_performance_summary (
        officer_id,
        summary_date,
        total_cases,
        total_calls,
        total_messages,
        total_ptps,
        ptps_kept,
        collection_amount,
        collection_rate,
        contact_rate,
        ptp_keep_rate
    )
    SELECT 
        co.officer_id,
        CURRENT_DATE as summary_date,
        COUNT(DISTINCT cc.case_id) as total_cases,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'CALL' THEN ci.interaction_id END) as total_calls,
        COUNT(DISTINCT CASE WHEN ci.interaction_type IN ('SMS', 'EMAIL') THEN ci.interaction_id END) as total_messages,
        COUNT(DISTINCT ptp.ptp_id) as total_ptps,
        COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END) as ptps_kept,
        COALESCE(SUM(p.payment_amount), 0) as collection_amount,
        CASE 
            WHEN SUM(cc.overdue_amount) > 0 
            THEN (SUM(p.payment_amount) / SUM(cc.overdue_amount) * 100)
            ELSE 0 
        END as collection_rate,
        CASE 
            WHEN COUNT(DISTINCT ci.case_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ci.response_received = true THEN ci.case_id END)::DECIMAL / COUNT(DISTINCT ci.case_id) * 100)
            ELSE 0 
        END as contact_rate,
        CASE 
            WHEN COUNT(DISTINCT ptp.ptp_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END)::DECIMAL / COUNT(DISTINCT ptp.ptp_id) * 100)
            ELSE 0 
        END as ptp_keep_rate
    FROM collection_officers co
    LEFT JOIN collection_cases cc ON cc.officer_id = co.officer_id
    LEFT JOIN collection_interactions ci ON ci.officer_id = co.officer_id 
        AND DATE(ci.interaction_datetime) = CURRENT_DATE
    LEFT JOIN promise_to_pay ptp ON ptp.officer_id = co.officer_id 
        AND DATE(ptp.created_at) = CURRENT_DATE
    LEFT JOIN payments p ON p.case_id = cc.case_id 
        AND DATE(p.payment_date) = CURRENT_DATE
    WHERE co.status = 'ACTIVE'
    GROUP BY co.officer_id
    ON CONFLICT (officer_id, summary_date) 
    DO UPDATE SET
        total_cases = EXCLUDED.total_cases,
        total_calls = EXCLUDED.total_calls,
        total_messages = EXCLUDED.total_messages,
        total_ptps = EXCLUDED.total_ptps,
        ptps_kept = EXCLUDED.ptps_kept,
        collection_amount = EXCLUDED.collection_amount,
        collection_rate = EXCLUDED.collection_rate,
        contact_rate = EXCLUDED.contact_rate,
        ptp_keep_rate = EXCLUDED.ptp_keep_rate,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to update performance summary daily (if using pg_cron)
-- SELECT cron.schedule('update-officer-performance', '0 1 * * *', 'SELECT update_officer_performance_summary();');

-- Insert sample data for testing
INSERT INTO officer_performance_summary (
    officer_id,
    summary_date,
    total_cases,
    total_calls,
    total_messages,
    total_ptps,
    ptps_kept,
    collection_amount,
    collection_rate,
    contact_rate,
    ptp_keep_rate
)
SELECT 
    officer_id,
    CURRENT_DATE,
    FLOOR(RANDOM() * 50 + 10),
    FLOOR(RANDOM() * 100 + 20),
    FLOOR(RANDOM() * 50 + 10),
    FLOOR(RANDOM() * 20 + 5),
    FLOOR(RANDOM() * 15 + 2),
    FLOOR(RANDOM() * 500000 + 100000),
    FLOOR(RANDOM() * 30 + 50),
    FLOOR(RANDOM() * 40 + 40),
    FLOOR(RANDOM() * 30 + 60)
FROM collection_officers
WHERE status = 'ACTIVE'
ON CONFLICT (officer_id, summary_date) DO NOTHING;