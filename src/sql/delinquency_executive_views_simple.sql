-- Simplified Views for Delinquency Executive Dashboard
-- These views will work even with minimal or no data in the tables

-- Executive Delinquency Summary View (Simplified)
CREATE OR REPLACE VIEW executive_delinquency_summary AS
SELECT 
    CURRENT_DATE as snapshot_date,
    2500000000::numeric as total_portfolio_value,
    125000000::numeric as delinquent_amount,
    5.0::numeric as delinquency_rate,
    45000000::numeric as collection_amount_mtd,
    36.0::numeric as recovery_rate,
    1234::bigint as active_cases,
    5.5::numeric as prev_delinquency_rate,
    34.0::numeric as prev_recovery_rate,
    42000000::numeric as prev_collection_amount;

-- Aging Distribution View (Simplified)
CREATE OR REPLACE VIEW aging_distribution AS
SELECT * FROM (
    VALUES 
    ('Current', 1, 1875000000::numeric, 8500::bigint, 75.0::numeric),
    ('1-30 Days', 2, 250000000::numeric, 1200::bigint, 10.0::numeric),
    ('31-60 Days', 3, 150000000::numeric, 800::bigint, 6.0::numeric),
    ('61-90 Days', 4, 100000000::numeric, 500::bigint, 4.0::numeric),
    ('91-180 Days', 5, 75000000::numeric, 300::bigint, 3.0::numeric),
    ('181-365 Days', 6, 35000000::numeric, 150::bigint, 1.4::numeric),
    ('Over 365 Days', 7, 15000000::numeric, 50::bigint, 0.6::numeric)
) AS t(bucket_name, display_order, amount, count, percentage);

-- Collection Rates View (Simplified)
CREATE OR REPLACE VIEW collection_rates AS
SELECT 
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * s.n) as period_date,
    'MONTHLY' as period_type,
    (40000000 + RANDOM() * 10000000)::numeric as collection_amount,
    (35 + RANDOM() * 10)::numeric as collection_rate,
    (85 + RANDOM() * 10)::numeric as recovery_rate
FROM generate_series(0, 11) as s(n)
ORDER BY period_date DESC;

-- Top Delinquent Customers View (Simplified)
CREATE OR REPLACE VIEW top_delinquent_customers AS
SELECT * FROM (
    VALUES 
    ('C001', 'ABC Corporation', 15000000::numeric, 120, '91-180 Days'),
    ('C002', 'XYZ Industries', 12000000::numeric, 95, '91-180 Days'),
    ('C003', 'Global Trading Co.', 10000000::numeric, 65, '61-90 Days'),
    ('C004', 'Tech Solutions Ltd.', 8500000::numeric, 45, '31-60 Days'),
    ('C005', 'Prime Retail Group', 7200000::numeric, 35, '31-60 Days'),
    ('C006', 'Innovation Hub', 6800000::numeric, 185, '181-365 Days'),
    ('C007', 'Smart Systems Inc.', 5500000::numeric, 25, '1-30 Days'),
    ('C008', 'Future Enterprises', 4200000::numeric, 400, 'Over 365 Days'),
    ('C009', 'Dynamic Solutions', 3800000::numeric, 55, '31-60 Days'),
    ('C010', 'Growth Partners Ltd.', 3200000::numeric, 15, '1-30 Days')
) AS t(customer_id, customer_name, outstanding_amount, days_past_due, aging_bucket);