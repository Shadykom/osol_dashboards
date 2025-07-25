-- إدراج بيانات تجريبية للمتأخرات
-- Sample Data for Delinquency Dashboard

-- إدراج بيانات المتأخرات الحالية
-- نحتاج أولاً للحصول على معرفات القروض والعملاء الموجودة
INSERT INTO kastle_banking.delinquencies (loan_account_id, customer_id, outstanding_amount, days_past_due, aging_bucket_id, last_payment_date, last_payment_amount, next_due_date, collection_status, risk_rating)
SELECT 
    la.loan_account_id,
    la.customer_id,
    la.outstanding_principal * CASE 
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
    la.emi_amount as last_payment_amount,
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

-- إدراج بيانات تاريخية للمتأخرات (آخر 12 شهر)
DO $$
DECLARE
    i INTEGER;
    snapshot_date DATE;
BEGIN
    FOR i IN 0..11 LOOP
        snapshot_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month' * i);
        
        -- إدراج بيانات ملخص المحفظة
        INSERT INTO kastle_banking.portfolio_summary (
            snapshot_date, 
            total_portfolio_value, 
            total_delinquent_value, 
            delinquency_rate, 
            total_loans, 
            delinquent_loans
        ) VALUES (
            snapshot_date,
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
            snapshot_date,
            250000.00 + (RANDOM() * 50000)::DECIMAL(15,2),
            150000.00 + (RANDOM() * 30000)::DECIMAL(15,2),
            55.0 + (RANDOM() * 15)::DECIMAL(5,2),
            80 + (RANDOM() * 20)::INTEGER,
            50 + (RANDOM() * 15)::INTEGER
        );
        
        -- إدراج بيانات أداء الفروع (نستخدم معرفات الفروع الموجودة)
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
            snapshot_date,
            80000.00 + (RANDOM() * 20000)::DECIMAL(15,2),
            50000.00 + (RANDOM() * 10000)::DECIMAL(15,2),
            55.0 + (RANDOM() * 15)::DECIMAL(5,2),
            25 + (RANDOM() * 10)::INTEGER
        FROM kastle_banking.branches b
        WHERE b.is_active = true
        LIMIT 3;
    END LOOP;
END $$;

-- إدراج بيانات تاريخ المتأخرات
INSERT INTO kastle_banking.delinquency_history (delinquency_id, snapshot_date, outstanding_amount, days_past_due, aging_bucket_id, collection_status)
SELECT 
    d.id,
    CURRENT_DATE - INTERVAL '30 days',
    d.outstanding_amount * 1.1,
    GREATEST(0, d.days_past_due - 30),
    CASE 
        WHEN d.days_past_due - 30 <= 0 THEN 1
        WHEN d.days_past_due - 30 <= 30 THEN 2
        WHEN d.days_past_due - 30 <= 60 THEN 3
        WHEN d.days_past_due - 30 <= 90 THEN 4
        WHEN d.days_past_due - 30 <= 180 THEN 5
        WHEN d.days_past_due - 30 <= 365 THEN 6
        ELSE 7
    END,
    d.collection_status
FROM kastle_banking.delinquencies d;

-- إدراج معدلات تحصيل يومية لآخر 30 يوم
DO $$
DECLARE
    i INTEGER;
    daily_date DATE;
BEGIN
    FOR i IN 0..29 LOOP
        daily_date := CURRENT_DATE - INTERVAL '1 day' * i;
        
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
            daily_date,
            8000.00 + (RANDOM() * 2000)::DECIMAL(15,2),
            5000.00 + (RANDOM() * 1500)::DECIMAL(15,2),
            55.0 + (RANDOM() * 20)::DECIMAL(5,2),
            15 + (RANDOM() * 5)::INTEGER,
            10 + (RANDOM() * 3)::INTEGER
        );
    END LOOP;
END $$;