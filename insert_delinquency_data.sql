-- سكريبت إدراج البيانات للوحة بيانات المتأخرات
-- Insert Data Script for Delinquency Dashboard

-- تنظيف البيانات القديمة (اختياري)
-- TRUNCATE TABLE kastle_banking.delinquency_history CASCADE;
-- TRUNCATE TABLE kastle_banking.delinquencies CASCADE;
-- TRUNCATE TABLE kastle_banking.branch_collection_performance CASCADE;
-- TRUNCATE TABLE kastle_banking.collection_rates CASCADE;
-- TRUNCATE TABLE kastle_banking.portfolio_summary CASCADE;

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
    -- حساب المبلغ المتأخر بناءً على نمط توزيع
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
        WHEN row_num % 10 = 0 THEN 1 -- Current
        WHEN row_num % 10 = 1 THEN 2 -- 1-30 Days
        WHEN row_num % 10 = 2 THEN 3 -- 31-60 Days
        WHEN row_num % 10 = 3 THEN 4 -- 61-90 Days
        WHEN row_num % 10 = 4 THEN 5 -- 91-180 Days
        WHEN row_num % 10 = 5 THEN 6 -- 181-365 Days
        WHEN row_num % 10 = 6 THEN 7 -- Over 365 Days
        ELSE 2
    END as aging_bucket_id,
    -- تاريخ آخر دفعة
    CURRENT_DATE - INTERVAL '1 day' * (10 + row_num % 60) as last_payment_date,
    -- مبلغ آخر دفعة
    COALESCE(la.emi_amount, la.principal_amount / NULLIF(la.tenure_months, 0), 5000) * (0.5 + (row_num % 10) * 0.1) as last_payment_amount,
    -- تاريخ الاستحقاق التالي
    CURRENT_DATE + INTERVAL '1 day' * (row_num % 30 - 15) as next_due_date,
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

-- 2. إدراج بيانات تاريخية لملخص المحفظة (آخر 12 شهر)
INSERT INTO kastle_banking.portfolio_summary (
    snapshot_date,
    total_portfolio_value,
    total_delinquent_value,
    delinquency_rate,
    total_loans,
    delinquent_loans
)
SELECT 
    DATE_TRUNC('month', CURRENT_DATE - (gs.month_offset || ' months')::INTERVAL) as snapshot_date,
    -- إجمالي قيمة المحفظة (متزايد بمرور الوقت)
    (4500000 + gs.month_offset * 50000 + RANDOM() * 500000)::DECIMAL(15,2) as total_portfolio_value,
    -- إجمالي المتأخرات (متغير)
    (200000 + SIN(gs.month_offset) * 50000 + RANDOM() * 50000)::DECIMAL(15,2) as total_delinquent_value,
    -- نسبة المتأخرات (بين 3% و 7%)
    (3.5 + SIN(gs.month_offset * 0.5) * 1.5 + RANDOM() * 2)::DECIMAL(5,2) as delinquency_rate,
    -- إجمالي القروض
    (1000 + gs.month_offset * 20 + (RANDOM() * 100)::INTEGER) as total_loans,
    -- القروض المتأخرة
    (60 + SIN(gs.month_offset) * 20 + (RANDOM() * 20)::INTEGER) as delinquent_loans
FROM generate_series(0, 11) as gs(month_offset);

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
    -- المبلغ المحصل (50-70% من المتأخرات)
    (ps.total_delinquent_value * (0.5 + RANDOM() * 0.2))::DECIMAL(15,2) as total_collected_amount,
    -- معدل التحصيل
    (50 + RANDOM() * 20)::DECIMAL(5,2) as collection_rate,
    ps.delinquent_loans as number_of_accounts,
    -- عدد الحسابات المحصلة
    (ps.delinquent_loans * (0.6 + RANDOM() * 0.3))::INTEGER as number_of_accounts_collected
FROM kastle_banking.portfolio_summary ps;

-- 4. إدراج معدلات التحصيل اليومية (آخر 30 يوم)
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
    'DAILY' as period_type,
    CURRENT_DATE - (gs.day_offset || ' days')::INTERVAL as period_date,
    -- المتأخرات اليومية (أصغر من الشهرية)
    (8000 + RANDOM() * 4000)::DECIMAL(15,2) as total_delinquent_amount,
    -- المبلغ المحصل يومياً
    (4000 + RANDOM() * 3000)::DECIMAL(15,2) as total_collected_amount,
    -- معدل التحصيل اليومي
    (45 + RANDOM() * 25)::DECIMAL(5,2) as collection_rate,
    -- عدد الحسابات
    (10 + (RANDOM() * 10)::INTEGER) as number_of_accounts,
    -- الحسابات المحصلة
    (5 + (RANDOM() * 8)::INTEGER) as number_of_accounts_collected
FROM generate_series(0, 29) as gs(day_offset);

-- 5. إدراج معدلات التحصيل الأسبوعية (آخر 12 أسبوع)
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
    'WEEKLY' as period_type,
    DATE_TRUNC('week', CURRENT_DATE - (gs.week_offset || ' weeks')::INTERVAL) as period_date,
    (40000 + RANDOM() * 20000)::DECIMAL(15,2) as total_delinquent_amount,
    (25000 + RANDOM() * 15000)::DECIMAL(15,2) as total_collected_amount,
    (55 + RANDOM() * 20)::DECIMAL(5,2) as collection_rate,
    (50 + (RANDOM() * 30)::INTEGER) as number_of_accounts,
    (30 + (RANDOM() * 20)::INTEGER) as number_of_accounts_collected
FROM generate_series(0, 11) as gs(week_offset);

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
    -- توزيع المتأخرات على الفروع
    (ps.total_delinquent_value / branch_count * (0.8 + RANDOM() * 0.4))::DECIMAL(15,2) as total_delinquent_amount,
    -- المبلغ المحصل لكل فرع
    (ps.total_delinquent_value / branch_count * (0.8 + RANDOM() * 0.4) * (0.5 + RANDOM() * 0.2))::DECIMAL(15,2) as total_collected_amount,
    -- معدل التحصيل للفرع
    (45 + RANDOM() * 30)::DECIMAL(5,2) as collection_rate,
    -- عدد الحسابات في الفرع
    (ps.delinquent_loans / branch_count + (RANDOM() * 10)::INTEGER) as number_of_accounts
FROM kastle_banking.portfolio_summary ps
CROSS JOIN (
    SELECT branch_id, COUNT(*) OVER() as branch_count
    FROM kastle_banking.branches
    WHERE is_active = true
    LIMIT 5
) b;

-- 7. إدراج تاريخ المتأخرات (تتبع التغييرات)
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
    -- حساب فئة التقادم قبل 30 يوم
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

-- 8. إحصائيات البيانات المدرجة
DO $$
DECLARE
    v_delinquencies_count INTEGER;
    v_portfolio_count INTEGER;
    v_collection_rates_count INTEGER;
    v_branch_performance_count INTEGER;
    v_history_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_delinquencies_count FROM kastle_banking.delinquencies;
    SELECT COUNT(*) INTO v_portfolio_count FROM kastle_banking.portfolio_summary;
    SELECT COUNT(*) INTO v_collection_rates_count FROM kastle_banking.collection_rates;
    SELECT COUNT(*) INTO v_branch_performance_count FROM kastle_banking.branch_collection_performance;
    SELECT COUNT(*) INTO v_history_count FROM kastle_banking.delinquency_history;
    
    RAISE NOTICE 'تم إدراج البيانات بنجاح:';
    RAISE NOTICE '- المتأخرات: % سجل', v_delinquencies_count;
    RAISE NOTICE '- ملخص المحفظة: % سجل', v_portfolio_count;
    RAISE NOTICE '- معدلات التحصيل: % سجل', v_collection_rates_count;
    RAISE NOTICE '- أداء الفروع: % سجل', v_branch_performance_count;
    RAISE NOTICE '- تاريخ المتأخرات: % سجل', v_history_count;
END $$;

-- 9. عرض ملخص البيانات
SELECT 'ملخص البيانات المدرجة:' as title;

SELECT 
    'المتأخرات حسب فئة التقادم' as metric,
    ab.bucket_name,
    COUNT(d.id) as count,
    COALESCE(SUM(d.outstanding_amount), 0)::MONEY as total_amount
FROM kastle_banking.aging_buckets ab
LEFT JOIN kastle_banking.delinquencies d ON ab.id = d.aging_bucket_id
GROUP BY ab.id, ab.bucket_name, ab.display_order
ORDER BY ab.display_order;

SELECT 
    'معدلات التحصيل حسب النوع' as metric,
    period_type,
    COUNT(*) as records,
    AVG(collection_rate)::DECIMAL(5,2) as avg_collection_rate
FROM kastle_banking.collection_rates
GROUP BY period_type;

SELECT 
    'أداء الفروع' as metric,
    b.branch_name,
    COUNT(bcp.id) as periods,
    AVG(bcp.collection_rate)::DECIMAL(5,2) as avg_collection_rate,
    SUM(bcp.total_collected_amount)::MONEY as total_collected
FROM kastle_banking.branch_collection_performance bcp
JOIN kastle_banking.branches b ON bcp.branch_id = b.branch_id
GROUP BY b.branch_id, b.branch_name
ORDER BY total_collected DESC
LIMIT 10;