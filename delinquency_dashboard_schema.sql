-- جداول لوحة بيانات المتأخرات
-- Delinquency Dashboard Tables

-- جدول فئات التقادم
CREATE TABLE IF NOT EXISTS kastle_banking.aging_buckets (
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
CREATE TABLE IF NOT EXISTS kastle_banking.delinquencies (
    id SERIAL PRIMARY KEY,
    loan_account_id INTEGER REFERENCES kastle_banking.loan_accounts(id),
    customer_id INTEGER REFERENCES kastle_banking.customers(id),
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
CREATE TABLE IF NOT EXISTS kastle_banking.delinquency_history (
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
CREATE TABLE IF NOT EXISTS kastle_banking.collection_rates (
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
CREATE TABLE IF NOT EXISTS kastle_banking.portfolio_summary (
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
CREATE TABLE IF NOT EXISTS kastle_banking.branch_collection_performance (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES kastle_banking.branches(id),
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
('Over 365 Days', 366, NULL, 7, '#B71C1C');

-- إنشاء الفهارس
CREATE INDEX idx_delinquencies_customer_id ON kastle_banking.delinquencies(customer_id);
CREATE INDEX idx_delinquencies_loan_account_id ON kastle_banking.delinquencies(loan_account_id);
CREATE INDEX idx_delinquencies_days_past_due ON kastle_banking.delinquencies(days_past_due);
CREATE INDEX idx_delinquencies_aging_bucket_id ON kastle_banking.delinquencies(aging_bucket_id);
CREATE INDEX idx_delinquency_history_snapshot_date ON kastle_banking.delinquency_history(snapshot_date);
CREATE INDEX idx_collection_rates_period_date ON kastle_banking.collection_rates(period_date);
CREATE INDEX idx_portfolio_summary_snapshot_date ON kastle_banking.portfolio_summary(snapshot_date);

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
    SUM(d.outstanding_amount) as total_amount,
    ROUND(SUM(d.outstanding_amount) * 100.0 / NULLIF(SUM(SUM(d.outstanding_amount)) OVER (), 0), 2) as percentage
FROM kastle_banking.aging_buckets ab
LEFT JOIN kastle_banking.delinquencies d ON ab.id = d.aging_bucket_id
GROUP BY ab.id, ab.bucket_name, ab.display_order, ab.color_code
ORDER BY ab.display_order;

-- View لأكبر العملاء المتأخرين
CREATE OR REPLACE VIEW kastle_banking.top_delinquent_customers AS
SELECT 
    c.id as customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    c.customer_number,
    COUNT(DISTINCT d.loan_account_id) as delinquent_accounts,
    SUM(d.outstanding_amount) as total_outstanding,
    MAX(d.days_past_due) as max_days_past_due,
    STRING_AGG(DISTINCT d.collection_status, ', ') as collection_statuses
FROM kastle_banking.customers c
JOIN kastle_banking.delinquencies d ON c.id = d.customer_id
GROUP BY c.id, c.first_name, c.last_name, c.customer_number
ORDER BY total_outstanding DESC
LIMIT 20;