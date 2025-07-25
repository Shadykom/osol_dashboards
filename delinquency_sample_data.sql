-- إدراج بيانات تجريبية للمتأخرات
-- Sample Data for Delinquency Dashboard

-- إدراج بيانات المتأخرات الحالية
INSERT INTO kastle_banking.delinquencies (loan_account_id, customer_id, outstanding_amount, days_past_due, aging_bucket_id, last_payment_date, last_payment_amount, next_due_date, collection_status, risk_rating) VALUES
-- Current (0 days)
(1, 1, 5000.00, 0, 1, CURRENT_DATE - INTERVAL '5 days', 1000.00, CURRENT_DATE + INTERVAL '25 days', 'CURRENT', 'LOW'),
(2, 2, 8000.00, 0, 1, CURRENT_DATE - INTERVAL '10 days', 2000.00, CURRENT_DATE + INTERVAL '20 days', 'CURRENT', 'LOW'),

-- 1-30 Days
(3, 3, 12000.00, 15, 2, CURRENT_DATE - INTERVAL '45 days', 500.00, CURRENT_DATE - INTERVAL '15 days', 'REMINDER_SENT', 'MEDIUM'),
(4, 4, 25000.00, 25, 2, CURRENT_DATE - INTERVAL '55 days', 1500.00, CURRENT_DATE - INTERVAL '25 days', 'PHONE_CONTACT', 'MEDIUM'),
(5, 5, 18000.00, 20, 2, CURRENT_DATE - INTERVAL '50 days', 800.00, CURRENT_DATE - INTERVAL '20 days', 'REMINDER_SENT', 'MEDIUM'),

-- 31-60 Days
(6, 6, 35000.00, 45, 3, CURRENT_DATE - INTERVAL '75 days', 2000.00, CURRENT_DATE - INTERVAL '45 days', 'FIELD_VISIT', 'MEDIUM'),
(7, 7, 42000.00, 55, 3, CURRENT_DATE - INTERVAL '85 days', 1000.00, CURRENT_DATE - INTERVAL '55 days', 'NEGOTIATION', 'HIGH'),
(8, 8, 28000.00, 50, 3, CURRENT_DATE - INTERVAL '80 days', 1200.00, CURRENT_DATE - INTERVAL '50 days', 'FIELD_VISIT', 'MEDIUM'),

-- 61-90 Days
(9, 9, 55000.00, 75, 4, CURRENT_DATE - INTERVAL '105 days', 3000.00, CURRENT_DATE - INTERVAL '75 days', 'LEGAL_NOTICE', 'HIGH'),
(10, 10, 68000.00, 85, 4, CURRENT_DATE - INTERVAL '115 days', 2500.00, CURRENT_DATE - INTERVAL '85 days', 'RESTRUCTURING', 'HIGH'),
(11, 11, 45000.00, 80, 4, CURRENT_DATE - INTERVAL '110 days', 1800.00, CURRENT_DATE - INTERVAL '80 days', 'LEGAL_NOTICE', 'HIGH'),

-- 91-180 Days
(12, 12, 85000.00, 120, 5, CURRENT_DATE - INTERVAL '150 days', 4000.00, CURRENT_DATE - INTERVAL '120 days', 'LEGAL_PROCEEDINGS', 'CRITICAL'),
(13, 13, 95000.00, 150, 5, CURRENT_DATE - INTERVAL '180 days', 3500.00, CURRENT_DATE - INTERVAL '150 days', 'LEGAL_PROCEEDINGS', 'CRITICAL'),
(14, 14, 72000.00, 135, 5, CURRENT_DATE - INTERVAL '165 days', 2800.00, CURRENT_DATE - INTERVAL '135 days', 'LEGAL_PROCEEDINGS', 'CRITICAL'),

-- 181-365 Days
(15, 15, 120000.00, 250, 6, CURRENT_DATE - INTERVAL '280 days', 5000.00, CURRENT_DATE - INTERVAL '250 days', 'WRITE_OFF_PENDING', 'CRITICAL'),
(16, 16, 150000.00, 300, 6, CURRENT_DATE - INTERVAL '330 days', 6000.00, CURRENT_DATE - INTERVAL '300 days', 'WRITE_OFF_PENDING', 'CRITICAL'),

-- Over 365 Days
(17, 17, 200000.00, 400, 7, CURRENT_DATE - INTERVAL '430 days', 8000.00, CURRENT_DATE - INTERVAL '400 days', 'WRITTEN_OFF', 'CRITICAL'),
(18, 18, 180000.00, 450, 7, CURRENT_DATE - INTERVAL '480 days', 7000.00, CURRENT_DATE - INTERVAL '450 days', 'WRITTEN_OFF', 'CRITICAL');

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
        
        -- إدراج بيانات أداء الفروع
        FOR j IN 1..3 LOOP
            INSERT INTO kastle_banking.branch_collection_performance (
                branch_id,
                period_date,
                total_delinquent_amount,
                total_collected_amount,
                collection_rate,
                number_of_accounts
            ) VALUES (
                j,
                snapshot_date,
                80000.00 + (RANDOM() * 20000)::DECIMAL(15,2),
                50000.00 + (RANDOM() * 10000)::DECIMAL(15,2),
                55.0 + (RANDOM() * 15)::DECIMAL(5,2),
                25 + (RANDOM() * 10)::INTEGER
            );
        END LOOP;
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