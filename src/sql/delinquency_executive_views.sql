-- Views for Delinquency Executive Dashboard

-- Executive Delinquency Summary View
CREATE OR REPLACE VIEW executive_delinquency_summary AS
SELECT 
    CURRENT_DATE as snapshot_date,
    COALESCE(SUM(la.principal_amount), 0) as total_portfolio_value,
    COALESCE(SUM(CASE WHEN d.days_past_due > 0 THEN la.outstanding_balance ELSE 0 END), 0) as delinquent_amount,
    CASE 
        WHEN SUM(la.principal_amount) > 0 
        THEN (SUM(CASE WHEN d.days_past_due > 0 THEN la.outstanding_balance ELSE 0 END) / SUM(la.principal_amount)) * 100
        ELSE 0 
    END as delinquency_rate,
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
        AND t.transaction_type_id IN (SELECT type_id FROM kastle_banking.transaction_types WHERE type_name = 'LOAN_REPAYMENT')
        THEN t.transaction_amount 
        ELSE 0 
    END), 0) as collection_amount_mtd,
    CASE 
        WHEN SUM(CASE WHEN d.days_past_due > 0 THEN la.outstanding_balance ELSE 0 END) > 0
        THEN (SUM(CASE 
            WHEN DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
            AND t.transaction_type_id IN (SELECT type_id FROM kastle_banking.transaction_types WHERE type_name = 'LOAN_REPAYMENT')
            THEN t.transaction_amount 
            ELSE 0 
        END) / SUM(CASE WHEN d.days_past_due > 0 THEN la.outstanding_balance ELSE 0 END)) * 100
        ELSE 0
    END as recovery_rate,
    COUNT(DISTINCT CASE WHEN d.days_past_due > 0 THEN la.loan_account_id END) as active_cases,
    -- Previous period data for comparison (mock data for now)
    CASE 
        WHEN SUM(la.principal_amount) > 0 
        THEN (SUM(CASE WHEN d.days_past_due > 0 THEN la.outstanding_balance ELSE 0 END) / SUM(la.principal_amount)) * 100 * 1.1
        ELSE 0 
    END as prev_delinquency_rate,
    CASE 
        WHEN SUM(CASE WHEN d.days_past_due > 0 THEN la.outstanding_balance ELSE 0 END) > 0
        THEN (SUM(CASE 
            WHEN DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
            AND t.transaction_type_id IN (SELECT type_id FROM kastle_banking.transaction_types WHERE type_name = 'LOAN_REPAYMENT')
            THEN t.transaction_amount 
            ELSE 0 
        END) / SUM(CASE WHEN d.days_past_due > 0 THEN la.outstanding_balance ELSE 0 END)) * 100 * 0.95
        ELSE 0
    END as prev_recovery_rate,
    COALESCE(SUM(CASE 
        WHEN DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
        AND t.transaction_type_id IN (SELECT type_id FROM kastle_banking.transaction_types WHERE type_name = 'LOAN_REPAYMENT')
        THEN t.transaction_amount 
        ELSE 0 
    END), 0) * 0.9 as prev_collection_amount
FROM kastle_banking.loan_accounts la
LEFT JOIN kastle_banking.delinquencies d ON la.loan_account_id = d.loan_account_id
LEFT JOIN kastle_banking.accounts a ON la.customer_id = a.customer_id
LEFT JOIN kastle_banking.transactions t ON a.account_number = t.account_number
GROUP BY 1;

-- Aging Distribution View
CREATE OR REPLACE VIEW aging_distribution AS
WITH aging_buckets AS (
    SELECT 
        CASE 
            WHEN COALESCE(d.days_past_due, 0) = 0 THEN 'Current'
            WHEN d.days_past_due BETWEEN 1 AND 30 THEN '1-30 Days'
            WHEN d.days_past_due BETWEEN 31 AND 60 THEN '31-60 Days'
            WHEN d.days_past_due BETWEEN 61 AND 90 THEN '61-90 Days'
            WHEN d.days_past_due BETWEEN 91 AND 180 THEN '91-180 Days'
            WHEN d.days_past_due BETWEEN 181 AND 365 THEN '181-365 Days'
            ELSE 'Over 365 Days'
        END as bucket_name,
        CASE 
            WHEN COALESCE(d.days_past_due, 0) = 0 THEN 1
            WHEN d.days_past_due BETWEEN 1 AND 30 THEN 2
            WHEN d.days_past_due BETWEEN 31 AND 60 THEN 3
            WHEN d.days_past_due BETWEEN 61 AND 90 THEN 4
            WHEN d.days_past_due BETWEEN 91 AND 180 THEN 5
            WHEN d.days_past_due BETWEEN 181 AND 365 THEN 6
            ELSE 7
        END as display_order,
        COALESCE(la.outstanding_balance, 0) as outstanding_balance
    FROM kastle_banking.loan_accounts la
    LEFT JOIN kastle_banking.delinquencies d ON la.loan_account_id = d.loan_account_id
)
SELECT 
    bucket_name,
    display_order,
    COALESCE(SUM(outstanding_balance), 0) as amount,
    COUNT(*) as count,
    CASE 
        WHEN SUM(SUM(outstanding_balance)) OVER () > 0
        THEN (SUM(outstanding_balance) / SUM(SUM(outstanding_balance)) OVER ()) * 100
        ELSE 0
    END as percentage
FROM aging_buckets
GROUP BY bucket_name, display_order
ORDER BY display_order;

-- Collection Rates View
CREATE OR REPLACE VIEW collection_rates AS
WITH monthly_data AS (
    SELECT 
        DATE_TRUNC('month', t.transaction_date) as period_date,
        'MONTHLY' as period_type,
        SUM(CASE 
            WHEN t.transaction_type_id IN (SELECT type_id FROM kastle_banking.transaction_types WHERE type_name = 'LOAN_REPAYMENT')
            THEN t.transaction_amount 
            ELSE 0 
        END) as collection_amount,
        SUM(la.outstanding_balance) as total_outstanding
    FROM kastle_banking.transactions t
    JOIN kastle_banking.accounts a ON t.account_number = a.account_number
    JOIN kastle_banking.loan_accounts la ON a.customer_id = la.customer_id
    WHERE t.transaction_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY 1
)
SELECT 
    period_date,
    period_type,
    collection_amount,
    CASE 
        WHEN total_outstanding > 0 
        THEN (collection_amount / total_outstanding) * 100
        ELSE 0
    END as collection_rate,
    85 + RANDOM() * 10 as recovery_rate -- Mock recovery rate
FROM monthly_data;

-- Top Delinquent Customers View
CREATE OR REPLACE VIEW top_delinquent_customers AS
SELECT 
    c.customer_id,
    c.customer_name,
    COALESCE(d.outstanding_amount, la.outstanding_balance) as outstanding_amount,
    COALESCE(d.days_past_due, 0) as days_past_due,
    CASE 
        WHEN COALESCE(d.days_past_due, 0) = 0 THEN 'Current'
        WHEN d.days_past_due BETWEEN 1 AND 30 THEN '1-30 Days'
        WHEN d.days_past_due BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN d.days_past_due BETWEEN 61 AND 90 THEN '61-90 Days'
        WHEN d.days_past_due BETWEEN 91 AND 180 THEN '91-180 Days'
        WHEN d.days_past_due BETWEEN 181 AND 365 THEN '181-365 Days'
        ELSE 'Over 365 Days'
    END as aging_bucket
FROM kastle_banking.loan_accounts la
JOIN kastle_banking.customers c ON la.customer_id = c.customer_id
LEFT JOIN kastle_banking.delinquencies d ON la.loan_account_id = d.loan_account_id
WHERE COALESCE(d.days_past_due, 0) > 0
ORDER BY COALESCE(d.outstanding_amount, la.outstanding_balance) DESC
LIMIT 10;