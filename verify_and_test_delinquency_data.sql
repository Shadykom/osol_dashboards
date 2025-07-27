-- سكريبت التحقق من البيانات واختبار لوحة بيانات المتأخرات
-- Verify and Test Delinquency Dashboard Data

-- 1. التحقق من عدد السجلات في كل جدول
SELECT '=== عدد السجلات في كل جدول ===' as section;

SELECT 
    'aging_buckets' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.aging_buckets
UNION ALL
SELECT 
    'delinquencies' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.delinquencies
UNION ALL
SELECT 
    'portfolio_summary' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.portfolio_summary
UNION ALL
SELECT 
    'collection_rates' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.collection_rates
UNION ALL
SELECT 
    'branch_collection_performance' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.branch_collection_performance
UNION ALL
SELECT 
    'delinquency_history' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.delinquency_history;

-- 2. التحقق من توزيع المتأخرات حسب فئات التقادم
SELECT '=== توزيع المتأخرات حسب فئات التقادم ===' as section;

SELECT 
    ab.bucket_name,
    ab.min_days || '-' || COALESCE(ab.max_days::TEXT, '+') as days_range,
    COUNT(d.id) as accounts,
    COALESCE(SUM(d.outstanding_amount), 0)::MONEY as total_amount,
    ROUND(COALESCE(SUM(d.outstanding_amount), 0) * 100.0 / 
          NULLIF(SUM(SUM(d.outstanding_amount)) OVER (), 0), 2) || '%' as percentage
FROM kastle_banking.aging_buckets ab
LEFT JOIN kastle_banking.delinquencies d ON ab.id = d.aging_bucket_id
GROUP BY ab.id, ab.bucket_name, ab.min_days, ab.max_days, ab.display_order
ORDER BY ab.display_order;

-- 3. التحقق من معدلات التحصيل
SELECT '=== معدلات التحصيل حسب الفترة ===' as section;

SELECT 
    period_type,
    COUNT(*) as periods,
    MIN(period_date) as first_date,
    MAX(period_date) as last_date,
    AVG(collection_rate)::DECIMAL(5,2) || '%' as avg_collection_rate,
    MIN(collection_rate)::DECIMAL(5,2) || '%' as min_rate,
    MAX(collection_rate)::DECIMAL(5,2) || '%' as max_rate
FROM kastle_banking.collection_rates
GROUP BY period_type
ORDER BY period_type;

-- 4. أداء الفروع
SELECT '=== أداء أفضل 5 فروع ===' as section;

SELECT 
    b.branch_name,
    COUNT(DISTINCT bcp.period_date) as reporting_periods,
    SUM(bcp.total_delinquent_amount)::MONEY as total_delinquent,
    SUM(bcp.total_collected_amount)::MONEY as total_collected,
    ROUND(AVG(bcp.collection_rate), 2) || '%' as avg_collection_rate,
    SUM(bcp.number_of_accounts) as total_accounts_handled
FROM kastle_banking.branch_collection_performance bcp
JOIN kastle_banking.branches b ON bcp.branch_id = b.branch_id
GROUP BY b.branch_id, b.branch_name
ORDER BY SUM(bcp.total_collected_amount) DESC
LIMIT 5;

-- 5. اتجاه المحفظة عبر الزمن
SELECT '=== اتجاه المحفظة الشهري ===' as section;

SELECT 
    TO_CHAR(snapshot_date, 'YYYY-MM') as month,
    total_portfolio_value::MONEY as portfolio_value,
    total_delinquent_value::MONEY as delinquent_value,
    delinquency_rate || '%' as delinquency_rate,
    total_loans,
    delinquent_loans,
    ROUND(delinquent_loans * 100.0 / NULLIF(total_loans, 0), 2) || '%' as delinquent_loans_pct
FROM kastle_banking.portfolio_summary
ORDER BY snapshot_date DESC
LIMIT 6;

-- 6. أكبر المتأخرين
SELECT '=== أكبر 10 عملاء متأخرين ===' as section;

SELECT 
    ROW_NUMBER() OVER (ORDER BY SUM(d.outstanding_amount) DESC) as rank,
    c.customer_id,
    c.first_name || ' ' || COALESCE(c.last_name, '') as customer_name,
    COUNT(DISTINCT d.loan_account_id) as delinquent_loans,
    SUM(d.outstanding_amount)::MONEY as total_outstanding,
    MAX(d.days_past_due) as max_days_overdue,
    STRING_AGG(DISTINCT d.risk_rating, ', ') as risk_ratings,
    STRING_AGG(DISTINCT d.collection_status, ', ') as collection_statuses
FROM kastle_banking.delinquencies d
JOIN kastle_banking.customers c ON d.customer_id = c.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
ORDER BY total_outstanding DESC
LIMIT 10;

-- 7. تحليل حالات التحصيل
SELECT '=== توزيع حالات التحصيل ===' as section;

SELECT 
    collection_status,
    COUNT(*) as accounts,
    SUM(outstanding_amount)::MONEY as total_amount,
    AVG(days_past_due)::INTEGER as avg_days_overdue,
    STRING_AGG(DISTINCT risk_rating, ', ') as risk_ratings
FROM kastle_banking.delinquencies
GROUP BY collection_status
ORDER BY COUNT(*) DESC;

-- 8. تحليل المخاطر
SELECT '=== توزيع المخاطر ===' as section;

SELECT 
    risk_rating,
    COUNT(*) as accounts,
    SUM(outstanding_amount)::MONEY as total_amount,
    AVG(days_past_due)::INTEGER as avg_days_overdue,
    MIN(days_past_due) as min_days,
    MAX(days_past_due) as max_days
FROM kastle_banking.delinquencies
GROUP BY risk_rating
ORDER BY 
    CASE risk_rating
        WHEN 'LOW' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'HIGH' THEN 3
        WHEN 'CRITICAL' THEN 4
    END;

-- 9. اختبار Views
SELECT '=== اختبار Executive Summary View ===' as section;

SELECT 
    snapshot_date,
    total_portfolio_value::MONEY as portfolio,
    total_delinquent_value::MONEY as delinquent,
    delinquency_rate || '%' as rate,
    monthly_collection_rate || '%' as collection_rate,
    COALESCE(prev_month_delinquency_rate || '%', 'N/A') as prev_month,
    COALESCE(prev_quarter_delinquency_rate || '%', 'N/A') as prev_quarter,
    COALESCE(prev_year_delinquency_rate || '%', 'N/A') as prev_year
FROM kastle_banking.executive_delinquency_summary
LIMIT 3;

-- 10. اختبار Aging Distribution View
SELECT '=== اختبار Aging Distribution View ===' as section;

SELECT * FROM kastle_banking.aging_distribution;

-- 11. اختبار Top Delinquent Customers View
SELECT '=== اختبار Top Delinquent Customers View ===' as section;

SELECT 
    customer_id,
    customer_name,
    delinquent_accounts,
    total_outstanding::MONEY,
    max_days_past_due,
    collection_statuses
FROM kastle_banking.top_delinquent_customers
LIMIT 5;

-- 12. إحصائيات عامة
SELECT '=== إحصائيات عامة ===' as section;

SELECT 
    (SELECT SUM(total_portfolio_value) FROM kastle_banking.portfolio_summary WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM kastle_banking.portfolio_summary))::MONEY as current_portfolio_value,
    (SELECT SUM(outstanding_amount) FROM kastle_banking.delinquencies)::MONEY as total_delinquent_amount,
    (SELECT COUNT(DISTINCT customer_id) FROM kastle_banking.delinquencies) as unique_delinquent_customers,
    (SELECT COUNT(DISTINCT loan_account_id) FROM kastle_banking.delinquencies) as delinquent_loans,
    (SELECT AVG(collection_rate) FROM kastle_banking.collection_rates WHERE period_type = 'MONTHLY')::DECIMAL(5,2) || '%' as avg_monthly_collection_rate,
    (SELECT COUNT(DISTINCT branch_id) FROM kastle_banking.branch_collection_performance) as reporting_branches;

-- 13. توصيات بناءً على البيانات
SELECT '=== توصيات تلقائية بناءً على البيانات ===' as section;

WITH risk_analysis AS (
    SELECT 
        COUNT(CASE WHEN aging_bucket_id = 4 THEN 1 END) as bucket_61_90,
        COUNT(CASE WHEN risk_rating = 'CRITICAL' THEN 1 END) as critical_accounts,
        AVG(CASE WHEN period_type = 'MONTHLY' THEN collection_rate END) as avg_collection_rate
    FROM kastle_banking.delinquencies d
    CROSS JOIN kastle_banking.collection_rates cr
    WHERE cr.period_date >= CURRENT_DATE - INTERVAL '3 months'
)
SELECT 
    CASE 
        WHEN bucket_61_90 > 10 THEN '⚠️ تحذير: ' || bucket_61_90 || ' حساب في فئة 61-90 يوم - يُنصح بالتدخل العاجل'
        ELSE '✅ عدد الحسابات في فئة 61-90 يوم ضمن الحدود المقبولة'
    END as recommendation_1,
    CASE 
        WHEN critical_accounts > 5 THEN '⚠️ تحذير: ' || critical_accounts || ' حساب بتصنيف مخاطر حرج - يُنصح بمراجعة السياسات'
        ELSE '✅ عدد الحسابات الحرجة ضمن الحدود المقبولة'
    END as recommendation_2,
    CASE 
        WHEN avg_collection_rate < 50 THEN '⚠️ معدل التحصيل ' || ROUND(avg_collection_rate, 2) || '% أقل من المستهدف - يُنصح بتعزيز فرق التحصيل'
        ELSE '✅ معدل التحصيل ' || ROUND(avg_collection_rate, 2) || '% جيد'
    END as recommendation_3
FROM risk_analysis;