-- سكريبت إدراج البيانات للوحة بيانات المتأخرات (نسخة محدثة)
-- Insert Data Script for Delinquency Dashboard (Fixed Version)

-- 1. إدراج بيانات المتأخرات الحالية من القروض النشطة
INSERT INTO kastle_banking.delinquencies (
    loan_account_id, 
    customer_id, 
    outstanding_amount, 
    days_past_due, 
    aging_bucket_id, 
    last_payment_date, 
    last_payment_amount, 
    next_due_date, 
    collection_status, 
    risk_rating
)
SELECT 
    la.loan_account_id,
    la.customer_id,
    -- حساب المبلغ المتأخر
    CASE 
        WHEN row_num % 10 = 0 THEN COALESCE(la.outstanding_principal, la.principal_amount * 0.3)
        WHEN row_num % 10 = 1 THEN COALESCE(la.outstanding_principal, la.principal_amount * 0.4) * 0.8
        WHEN row_num % 10 = 2 THEN COALESCE(la.outstanding_principal, la.principal_amount * 0.5) * 1.2
        WHEN row_num % 10 = 3 THEN COALESCE(la.outstanding_principal, la.principal_amount * 0.6) * 1.5
        WHEN row_num % 10 = 4 THEN COALESCE(la.outstanding_principal, la.principal_amount * 0.7) * 2.0
        WHEN row_num % 10 = 5 THEN COALESCE(la.outstanding_principal, la.principal_amount * 0.8) * 2.5
        WHEN row_num % 10 = 6 THEN COALESCE(la.outstanding_principal, la.principal_amount * 0.9) * 3.0
        ELSE COALESCE(la.outstanding_principal, la.principal_amount) * 1.1
    END as outstanding_amount,
    -- أيام التأخير
    CASE 
        WHEN row_num % 10 = 0 THEN 0
        WHEN row_num % 10 = 1 THEN 15 + (row_num % 15)
        WHEN row_num % 10 = 2 THEN 35 + (row_num % 25)
        WHEN row_num % 10 = 3 THEN 65 + (row_num % 25)
        WHEN row_num % 10 = 4 THEN 95 + (row_num % 85)
        WHEN row_num % 10 = 5 THEN 185 + (row_num % 180)
        WHEN row_num % 10 = 6 THEN 370 + (row_num % 100)
        ELSE 10 + (row_num % 20)
    END as days_past_due,
    -- فئة التقادم
    CASE 
        WHEN row_num % 10 = 0 THEN 1
        WHEN row_num % 10 = 1 THEN 2
        WHEN row_num % 10 = 2 THEN 3
        WHEN row_num % 10 = 3 THEN 4
        WHEN row_num % 10 = 4 THEN 5
        WHEN row_num % 10 = 5 THEN 6
        WHEN row_num % 10 = 6 THEN 7
        ELSE 2
    END as aging_bucket_id,
    CURRENT_DATE - ((10 + row_num % 60) || ' days')::INTERVAL as last_payment_date,
    COALESCE(la.emi_amount, la.principal_amount / NULLIF(la.tenure_months, 0), 5000) * (0.5 + (row_num % 10) * 0.1) as last_payment_amount,
    CURRENT_DATE + ((row_num % 30 - 15) || ' days')::INTERVAL as next_due_date,
    -- حالة التحصيل
    CASE 
        WHEN row_num % 10 = 0 THEN 'CURRENT'
        WHEN row_num % 10 = 1 THEN 'REMINDER_SENT'
        WHEN row_num % 10 = 2 THEN 'PHONE_CONTACT'
        WHEN row_num % 10 = 3 THEN 'FIELD_VISIT'
        WHEN row_num % 10 = 4 THEN 'LEGAL_NOTICE'
        WHEN row_num % 10 = 5 THEN 'LEGAL_PROCEEDINGS'
        WHEN row_num % 10 = 6 THEN 'WRITTEN_OFF'
        WHEN row_num % 10 = 7 THEN 'RESTRUCTURING'
        WHEN row_num % 10 = 8 THEN 'NEGOTIATION'
        ELSE 'UNDER_REVIEW'
    END as collection_status,
    -- تصنيف المخاطر
    CASE 
        WHEN row_num % 10 <= 1 THEN 'LOW'
        WHEN row_num % 10 <= 3 THEN 'MEDIUM'
        WHEN row_num % 10 <= 5 THEN 'HIGH'
        ELSE 'CRITICAL'
    END as risk_rating
FROM (
    SELECT 
        la.*,
        ROW_NUMBER() OVER (ORDER BY la.loan_account_id) as row_num
    FROM kastle_banking.loan_accounts la
    WHERE la.loan_status = 'ACTIVE'
    LIMIT 50
) la;

-- 2. إدراج بيانات تاريخية لملخص المحفظة (12 شهر)
DO $$
DECLARE
    i INTEGER;
    v_date DATE;
BEGIN
    FOR i IN 0..11 LOOP
        v_date := DATE_TRUNC('month', CURRENT_DATE - (i || ' months')::INTERVAL);
        
        INSERT INTO kastle_banking.portfolio_summary (
            snapshot_date,
            total_portfolio_value,
            total_delinquent_value,
            delinquency_rate,
            total_loans,
            delinquent_loans
        ) VALUES (
            v_date,
            (4500000 + i * 50000 + RANDOM() * 500000)::DECIMAL(15,2),
            (200000 + SIN(i) * 50000 + RANDOM() * 50000)::DECIMAL(15,2),
            (3.5 + SIN(i * 0.5) * 1.5 + RANDOM() * 2)::DECIMAL(5,2),
            (1000 + i * 20 + (RANDOM() * 100)::INTEGER),
            (60 + SIN(i) * 20 + (RANDOM() * 20)::INTEGER)
        );
    END LOOP;
END $$;

-- 3. إدراج معدلات التحصيل الشهرية
INSERT INTO kastle_banking.collection_rates (
    period_type,
    period_date,
    total_delinquent_amount,
    total_collected_amount,
    collection_rate,
    number_of_accounts,
    number_of_accounts_collected
)
SELECT 
    'MONTHLY' as period_type,
    ps.snapshot_date as period_date,
    ps.total_delinquent_value as total_delinquent_amount,
    (ps.total_delinquent_value * (0.5 + RANDOM() * 0.2))::DECIMAL(15,2) as total_collected_amount,
    (50 + RANDOM() * 20)::DECIMAL(5,2) as collection_rate,
    ps.delinquent_loans as number_of_accounts,
    (ps.delinquent_loans * (0.6 + RANDOM() * 0.3))::INTEGER as number_of_accounts_collected
FROM kastle_banking.portfolio_summary ps;

-- 4. إدراج معدلات التحصيل اليومية (30 يوم)
DO $$
DECLARE
    i INTEGER;
    v_date DATE;
BEGIN
    FOR i IN 0..29 LOOP
        v_date := CURRENT_DATE - (i || ' days')::INTERVAL;
        
        INSERT INTO kastle_banking.collection_rates (
            period_type,
            period_date,
            total_delinquent_amount,
            total_collected_amount,
            collection_rate,
            number_of_accounts,
            number_of_accounts_collected
        ) VALUES (
            'DAILY',
            v_date,
            (8000 + RANDOM() * 4000)::DECIMAL(15,2),
            (4000 + RANDOM() * 3000)::DECIMAL(15,2),
            (45 + RANDOM() * 25)::DECIMAL(5,2),
            (10 + (RANDOM() * 10)::INTEGER),
            (5 + (RANDOM() * 8)::INTEGER)
        );
    END LOOP;
END $$;

-- 5. إدراج معدلات التحصيل الأسبوعية (12 أسبوع)
DO $$
DECLARE
    i INTEGER;
    v_date DATE;
BEGIN
    FOR i IN 0..11 LOOP
        v_date := DATE_TRUNC('week', CURRENT_DATE - (i || ' weeks')::INTERVAL);
        
        INSERT INTO kastle_banking.collection_rates (
            period_type,
            period_date,
            total_delinquent_amount,
            total_collected_amount,
            collection_rate,
            number_of_accounts,
            number_of_accounts_collected
        ) VALUES (
            'WEEKLY',
            v_date,
            (40000 + RANDOM() * 20000)::DECIMAL(15,2),
            (25000 + RANDOM() * 15000)::DECIMAL(15,2),
            (55 + RANDOM() * 20)::DECIMAL(5,2),
            (50 + (RANDOM() * 30)::INTEGER),
            (30 + (RANDOM() * 20)::INTEGER)
        );
    END LOOP;
END $$;

-- 6. إدراج أداء التحصيل حسب الفروع
INSERT INTO kastle_banking.branch_collection_performance (
    branch_id,
    period_date,
    total_delinquent_amount,
    total_collected_amount,
    collection_rate,
    number_of_accounts
)
SELECT 
    b.branch_id,
    ps.snapshot_date as period_date,
    (ps.total_delinquent_value / b.branch_count * (0.8 + RANDOM() * 0.4))::DECIMAL(15,2) as total_delinquent_amount,
    (ps.total_delinquent_value / b.branch_count * (0.8 + RANDOM() * 0.4) * (0.5 + RANDOM() * 0.2))::DECIMAL(15,2) as total_collected_amount,
    (45 + RANDOM() * 30)::DECIMAL(5,2) as collection_rate,
    (ps.delinquent_loans / b.branch_count + (RANDOM() * 10)::INTEGER) as number_of_accounts
FROM kastle_banking.portfolio_summary ps
CROSS JOIN (
    SELECT 
        branch_id,
        COUNT(*) OVER() as branch_count
    FROM kastle_banking.branches
    WHERE is_active = true
    LIMIT 5
) b;

-- 7. إدراج تاريخ المتأخرات
INSERT INTO kastle_banking.delinquency_history (
    delinquency_id,
    snapshot_date,
    outstanding_amount,
    days_past_due,
    aging_bucket_id,
    collection_status
)
SELECT 
    d.id as delinquency_id,
    CURRENT_DATE - INTERVAL '30 days' as snapshot_date,
    d.outstanding_amount * 1.1 as outstanding_amount,
    GREATEST(0, d.days_past_due - 30) as days_past_due,
    CASE 
        WHEN d.days_past_due - 30 <= 0 THEN 1
        WHEN d.days_past_due - 30 <= 30 THEN 2
        WHEN d.days_past_due - 30 <= 60 THEN 3
        WHEN d.days_past_due - 30 <= 90 THEN 4
        WHEN d.days_past_due - 30 <= 180 THEN 5
        WHEN d.days_past_due - 30 <= 365 THEN 6
        ELSE 7
    END as aging_bucket_id,
    d.collection_status
FROM kastle_banking.delinquencies d;

-- إدراج تاريخ إضافي (قبل 60 يوم)
INSERT INTO kastle_banking.delinquency_history (
    delinquency_id,
    snapshot_date,
    outstanding_amount,
    days_past_due,
    aging_bucket_id,
    collection_status
)
SELECT 
    d.id as delinquency_id,
    CURRENT_DATE - INTERVAL '60 days' as snapshot_date,
    d.outstanding_amount * 1.2 as outstanding_amount,
    GREATEST(0, d.days_past_due - 60) as days_past_due,
    CASE 
        WHEN d.days_past_due - 60 <= 0 THEN 1
        WHEN d.days_past_due - 60 <= 30 THEN 2
        WHEN d.days_past_due - 60 <= 60 THEN 3
        WHEN d.days_past_due - 60 <= 90 THEN 4
        WHEN d.days_past_due - 60 <= 180 THEN 5
        WHEN d.days_past_due - 60 <= 365 THEN 6
        ELSE 7
    END as aging_bucket_id,
    'INITIAL_CONTACT' as collection_status
FROM kastle_banking.delinquencies d
WHERE d.days_past_due > 30;

-- 8. عرض ملخص البيانات المدرجة
SELECT 'تم إدراج البيانات بنجاح!' as message;

SELECT 
    'delinquencies' as table_name,
    COUNT(*) as records_inserted
FROM kastle_banking.delinquencies
UNION ALL
SELECT 
    'portfolio_summary',
    COUNT(*)
FROM kastle_banking.portfolio_summary
UNION ALL
SELECT 
    'collection_rates',
    COUNT(*)
FROM kastle_banking.collection_rates
UNION ALL
SELECT 
    'branch_collection_performance',
    COUNT(*)
FROM kastle_banking.branch_collection_performance
UNION ALL
SELECT 
    'delinquency_history',
    COUNT(*)
FROM kastle_banking.delinquency_history
ORDER BY table_name;

-- عرض توزيع المتأخرات
SELECT 
    ab.bucket_name,
    COUNT(d.id) as accounts,
    COALESCE(SUM(d.outstanding_amount), 0)::MONEY as total_amount
FROM kastle_banking.aging_buckets ab
LEFT JOIN kastle_banking.delinquencies d ON ab.id = d.aging_bucket_id
GROUP BY ab.id, ab.bucket_name, ab.display_order
ORDER BY ab.display_order;