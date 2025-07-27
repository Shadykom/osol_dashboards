-- إنشاء جداول لوحة بيانات المتأخرات مع التحقق من الوجود
-- Delinquency Dashboard Schema - Fixed Version

-- التحقق من وجود schema
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- جدول فئات التقادم
DROP TABLE IF EXISTS kastle_banking.aging_buckets CASCADE;
CREATE TABLE kastle_banking.aging_buckets (
    id SERIAL PRIMARY KEY,
    bucket_name VARCHAR(100) NOT NULL,
    min_days INTEGER NOT NULL,
    max_days INTEGER,
    display_order INTEGER NOT NULL,
    color_code VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول المتأخرات
DROP TABLE IF EXISTS kastle_banking.delinquencies CASCADE;
CREATE TABLE kastle_banking.delinquencies (
    id SERIAL PRIMARY KEY,
    loan_account_id INTEGER REFERENCES kastle_banking.loan_accounts(loan_account_id),
    customer_id VARCHAR(20) REFERENCES kastle_banking.customers(customer_id),
    outstanding_amount DECIMAL(15,2) NOT NULL,
    days_past_due INTEGER NOT NULL,
    aging_bucket_id INTEGER REFERENCES kastle_banking.aging_buckets(id),
    last_payment_date DATE,
    last_payment_amount DECIMAL(15,2),
    next_due_date DATE,
    collection_status VARCHAR(50),
    risk_rating VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول تاريخ المتأخرات
DROP TABLE IF EXISTS kastle_banking.delinquency_history CASCADE;
CREATE TABLE kastle_banking.delinquency_history (
    id SERIAL PRIMARY KEY,
    delinquency_id INTEGER REFERENCES kastle_banking.delinquencies(id),
    snapshot_date DATE NOT NULL,
    outstanding_amount DECIMAL(15,2) NOT NULL,
    days_past_due INTEGER NOT NULL,
    aging_bucket_id INTEGER REFERENCES kastle_banking.aging_buckets(id),
    collection_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول معدلات التحصيل
DROP TABLE IF EXISTS kastle_banking.collection_rates CASCADE;
CREATE TABLE kastle_banking.collection_rates (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'
    period_date DATE NOT NULL,
    total_delinquent_amount DECIMAL(15,2) NOT NULL,
    total_collected_amount DECIMAL(15,2) NOT NULL,
    collection_rate DECIMAL(5,2) NOT NULL,
    number_of_accounts INTEGER NOT NULL,
    number_of_accounts_collected INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول ملخص المحفظة
DROP TABLE IF EXISTS kastle_banking.portfolio_summary CASCADE;
CREATE TABLE kastle_banking.portfolio_summary (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    total_portfolio_value DECIMAL(15,2) NOT NULL,
    total_delinquent_value DECIMAL(15,2) NOT NULL,
    delinquency_rate DECIMAL(5,2) NOT NULL,
    total_loans INTEGER NOT NULL,
    delinquent_loans INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- جدول أداء التحصيل حسب الفرع
DROP TABLE IF EXISTS kastle_banking.branch_collection_performance CASCADE;
CREATE TABLE kastle_banking.branch_collection_performance (
    id SERIAL PRIMARY KEY,
    branch_id VARCHAR(10) REFERENCES kastle_banking.branches(branch_id),
    period_date DATE NOT NULL,
    total_delinquent_amount DECIMAL(15,2) NOT NULL,
    total_collected_amount DECIMAL(15,2) NOT NULL,
    collection_rate DECIMAL(5,2) NOT NULL,
    number_of_accounts INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إدراج فئات التقادم الافتراضية
INSERT INTO kastle_banking.aging_buckets (bucket_name, min_days, max_days, display_order, color_code) VALUES
('Current', 0, 0, 1, '#4CAF50'),
('1-30 Days', 1, 30, 2, '#8BC34A'),
('31-60 Days', 31, 60, 3, '#FFC107'),
('61-90 Days', 61, 90, 4, '#FF9800'),
('91-180 Days', 91, 180, 5, '#FF5722'),
('181-365 Days', 181, 365, 6, '#F44336'),
('Over 365 Days', 366, NULL, 7, '#B71C1C')
ON CONFLICT DO NOTHING;

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_delinquencies_customer_id ON kastle_banking.delinquencies(customer_id);
CREATE INDEX IF NOT EXISTS idx_delinquencies_loan_account_id ON kastle_banking.delinquencies(loan_account_id);
CREATE INDEX IF NOT EXISTS idx_delinquencies_days_past_due ON kastle_banking.delinquencies(days_past_due);
CREATE INDEX IF NOT EXISTS idx_delinquencies_aging_bucket_id ON kastle_banking.delinquencies(aging_bucket_id);
CREATE INDEX IF NOT EXISTS idx_delinquency_history_snapshot_date ON kastle_banking.delinquency_history(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_collection_rates_period_date ON kastle_banking.collection_rates(period_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_summary_snapshot_date ON kastle_banking.portfolio_summary(snapshot_date);

-- إنشاء Views للتقارير
CREATE OR REPLACE VIEW kastle_banking.executive_delinquency_summary AS
SELECT 
    ps.snapshot_date,
    ps.total_portfolio_value,
    ps.total_delinquent_value,
    ps.delinquency_rate,
    ps.total_loans,
    ps.delinquent_loans,
    cr.collection_rate as monthly_collection_rate,
    LAG(ps.delinquency_rate, 1) OVER (ORDER BY ps.snapshot_date) as prev_month_delinquency_rate,
    LAG(ps.delinquency_rate, 3) OVER (ORDER BY ps.snapshot_date) as prev_quarter_delinquency_rate,
    LAG(ps.delinquency_rate, 12) OVER (ORDER BY ps.snapshot_date) as prev_year_delinquency_rate
FROM kastle_banking.portfolio_summary ps
LEFT JOIN kastle_banking.collection_rates cr 
    ON ps.snapshot_date = cr.period_date 
    AND cr.period_type = 'MONTHLY'
ORDER BY ps.snapshot_date DESC;

-- View لتوزيع المتأخرات حسب فئات التقادم
CREATE OR REPLACE VIEW kastle_banking.aging_distribution AS
SELECT 
    ab.bucket_name,
    ab.display_order,
    ab.color_code,
    COUNT(d.id) as account_count,
    COALESCE(SUM(d.outstanding_amount), 0) as total_amount,
    ROUND(COALESCE(SUM(d.outstanding_amount), 0) * 100.0 / NULLIF(SUM(SUM(d.outstanding_amount)) OVER (), 0), 2) as percentage
FROM kastle_banking.aging_buckets ab
LEFT JOIN kastle_banking.delinquencies d ON ab.id = d.aging_bucket_id
GROUP BY ab.id, ab.bucket_name, ab.display_order, ab.color_code
ORDER BY ab.display_order;

-- View لأكبر العملاء المتأخرين
CREATE OR REPLACE VIEW kastle_banking.top_delinquent_customers AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name,
    c.customer_id as customer_number,
    COUNT(DISTINCT d.loan_account_id) as delinquent_accounts,
    SUM(d.outstanding_amount) as total_outstanding,
    MAX(d.days_past_due) as max_days_past_due,
    STRING_AGG(DISTINCT d.collection_status, ', ') as collection_statuses
FROM kastle_banking.customers c
JOIN kastle_banking.delinquencies d ON c.customer_id = d.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
ORDER BY total_outstanding DESC
LIMIT 20;

-- إدراج بيانات تجريبية إذا لم توجد بيانات
DO $$
BEGIN
    -- التحقق من وجود بيانات في جدول المتأخرات
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.delinquencies LIMIT 1) THEN
        -- إدراج بيانات المتأخرات من القروض النشطة
        INSERT INTO kastle_banking.delinquencies (loan_account_id, customer_id, outstanding_amount, days_past_due, aging_bucket_id, last_payment_date, last_payment_amount, next_due_date, collection_status, risk_rating)
        SELECT 
            la.loan_account_id,
            la.customer_id,
            COALESCE(la.outstanding_principal, la.principal_amount * 0.5) * CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 0 THEN 1.0
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 1 THEN 0.8
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 2 THEN 1.2
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 3 THEN 1.5
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 4 THEN 2.0
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 5 THEN 2.5
                ELSE 3.0
            END as outstanding_amount,
            CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 0 THEN 0
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 1 THEN 20
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 2 THEN 45
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 3 THEN 75
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 4 THEN 120
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 5 THEN 250
                ELSE 400
            END as days_past_due,
            CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 0 THEN 1
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 1 THEN 2
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 2 THEN 3
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 3 THEN 4
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 4 THEN 5
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 5 THEN 6
                ELSE 7
            END as aging_bucket_id,
            CURRENT_DATE - INTERVAL '30 days' as last_payment_date,
            COALESCE(la.emi_amount, la.principal_amount / la.tenure_months) as last_payment_amount,
            CURRENT_DATE - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 30) as next_due_date,
            CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 0 THEN 'CURRENT'
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 1 THEN 'REMINDER_SENT'
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 2 THEN 'FIELD_VISIT'
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 3 THEN 'LEGAL_NOTICE'
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 4 THEN 'LEGAL_PROCEEDINGS'
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 = 5 THEN 'WRITE_OFF_PENDING'
                ELSE 'WRITTEN_OFF'
            END as collection_status,
            CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 <= 1 THEN 'LOW'
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 <= 3 THEN 'MEDIUM'
                WHEN ROW_NUMBER() OVER (ORDER BY la.loan_account_id) % 7 <= 4 THEN 'HIGH'
                ELSE 'CRITICAL'
            END as risk_rating
        FROM kastle_banking.loan_accounts la
        WHERE la.loan_status = 'ACTIVE'
        LIMIT 20;
    END IF;

    -- إدراج بيانات تاريخية للمحفظة
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.portfolio_summary LIMIT 1) THEN
        FOR i IN 0..11 LOOP
            INSERT INTO kastle_banking.portfolio_summary (
                snapshot_date, 
                total_portfolio_value, 
                total_delinquent_value, 
                delinquency_rate, 
                total_loans, 
                delinquent_loans
            ) VALUES (
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * i),
                5000000.00 + (RANDOM() * 1000000)::DECIMAL(15,2),
                250000.00 + (RANDOM() * 50000)::DECIMAL(15,2),
                4.5 + (RANDOM() * 2)::DECIMAL(5,2),
                1200 + (RANDOM() * 100)::INTEGER,
                80 + (RANDOM() * 20)::INTEGER
            );
            
            -- إدراج بيانات معدلات التحصيل
            INSERT INTO kastle_banking.collection_rates (
                period_type,
                period_date,
                total_delinquent_amount,
                total_collected_amount,
                collection_rate,
                number_of_accounts,
                number_of_accounts_collected
            ) VALUES (
                'MONTHLY',
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * i),
                250000.00 + (RANDOM() * 50000)::DECIMAL(15,2),
                150000.00 + (RANDOM() * 30000)::DECIMAL(15,2),
                55.0 + (RANDOM() * 15)::DECIMAL(5,2),
                80 + (RANDOM() * 20)::INTEGER,
                50 + (RANDOM() * 15)::INTEGER
            );
        END LOOP;
    END IF;
END $$;