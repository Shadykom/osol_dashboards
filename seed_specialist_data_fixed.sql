-- Seed data for Officer Performance Metrics with correct column names
-- This script matches the actual table structure in kastle_banking schema

-- Insert officer performance metrics for OFF007
INSERT INTO kastle_banking.officer_performance_metrics (
    officer_id,
    metric_date,
    calls_made,
    calls_answered,
    promises_made,
    promises_kept,
    amount_collected,
    cases_resolved,
    avg_call_duration,
    customer_satisfaction_score,
    contacts_successful,
    ptps_obtained,
    ptps_kept,
    ptps_kept_rate,
    accounts_worked,
    talk_time_minutes,
    quality_score
) VALUES
-- Current month data (July 2025)
('OFF007', '2025-07-29', 330, 250, 65, 58, 195000.00, 48, 125, 4.5, 250, 65, 58, 89.23, 148, 620, 96.50),
('OFF007', '2025-07-28', 325, 245, 62, 56, 190000.00, 46, 120, 4.4, 245, 62, 56, 90.32, 145, 610, 96.00),
('OFF007', '2025-07-26', 320, 240, 60, 53, 185000.00, 45, 118, 4.3, 240, 60, 53, 88.33, 142, 600, 95.50),
('OFF007', '2025-07-25', 298, 218, 51, 42, 168000.00, 40, 112, 4.2, 218, 51, 42, 82.35, 136, 555, 92.00),
('OFF007', '2025-07-24', 315, 235, 58, 51, 180000.00, 44, 115, 4.4, 235, 58, 51, 87.93, 140, 590, 95.00),
('OFF007', '2025-07-23', 308, 228, 54, 46, 172000.00, 42, 113, 4.3, 228, 54, 46, 85.19, 138, 575, 93.25),
('OFF007', '2025-07-22', 310, 230, 55, 48, 175000.00, 43, 114, 4.4, 230, 55, 48, 87.27, 138, 580, 94.50),
('OFF007', '2025-07-19', 305, 225, 52, 45, 170000.00, 41, 112, 4.3, 225, 52, 45, 86.54, 135, 570, 94.00),
('OFF007', '2025-07-18', 285, 208, 47, 38, 158000.00, 38, 110, 4.1, 208, 47, 38, 80.85, 128, 535, 91.50),
('OFF007', '2025-07-17', 300, 220, 50, 43, 165000.00, 40, 112, 4.3, 220, 50, 43, 86.00, 132, 560, 93.50),
('OFF007', '2025-07-16', 295, 215, 48, 40, 160000.00, 39, 111, 4.2, 215, 48, 40, 83.33, 130, 550, 92.75),
('OFF007', '2025-07-15', 290, 210, 46, 38, 155000.00, 38, 110, 4.2, 210, 46, 38, 82.61, 128, 540, 92.00),
('OFF007', '2025-07-12', 285, 205, 45, 36, 150000.00, 37, 108, 4.0, 205, 45, 36, 80.00, 125, 530, 89.75),
('OFF007', '2025-07-11', 265, 190, 39, 30, 138000.00, 35, 105, 3.9, 190, 39, 30, 76.92, 118, 500, 88.50),
('OFF007', '2025-07-10', 280, 200, 42, 33, 145000.00, 36, 107, 4.1, 200, 42, 33, 78.57, 122, 520, 91.00),
('OFF007', '2025-07-09', 275, 198, 41, 32, 142000.00, 35, 106, 4.0, 198, 41, 32, 78.05, 120, 515, 90.50),
('OFF007', '2025-07-08', 270, 195, 40, 31, 140000.00, 35, 105, 4.0, 195, 40, 31, 77.50, 118, 510, 90.25),
('OFF007', '2025-07-05', 235, 170, 30, 24, 115000.00, 30, 100, 3.8, 170, 30, 24, 80.00, 105, 450, 88.00),
('OFF007', '2025-07-04', 260, 185, 38, 29, 132000.00, 33, 103, 3.9, 185, 38, 29, 76.32, 115, 490, 87.75),
('OFF007', '2025-07-03', 245, 175, 32, 25, 118000.00, 31, 101, 3.8, 175, 32, 25, 78.13, 108, 470, 89.00),
('OFF007', '2025-07-02', 250, 180, 35, 26, 125000.00, 32, 102, 3.9, 180, 35, 26, 74.29, 110, 480, 88.50),
('OFF007', '2025-07-01', 235, 170, 30, 22, 115000.00, 30, 100, 3.7, 170, 30, 22, 73.33, 105, 450, 87.00),

-- Previous month data (June 2025)
('OFF007', '2025-06-28', 250, 180, 35, 27, 120000.00, 32, 102, 3.8, 180, 35, 27, 77.14, 115, 480, 88.00),
('OFF007', '2025-06-24', 240, 170, 32, 24, 115000.00, 31, 100, 3.7, 170, 32, 24, 75.00, 110, 460, 87.00),
('OFF007', '2025-06-17', 230, 165, 30, 22, 110000.00, 30, 98, 3.6, 165, 30, 22, 73.33, 105, 440, 86.00),
('OFF007', '2025-06-10', 220, 160, 28, 20, 105000.00, 28, 95, 3.5, 160, 28, 20, 71.43, 100, 420, 85.00),
('OFF007', '2025-06-03', 210, 150, 25, 17, 95000.00, 26, 92, 3.4, 150, 25, 17, 68.00, 95, 400, 84.00),

-- May 2025 data
('OFF007', '2025-05-27', 235, 168, 30, 22, 108000.00, 30, 98, 3.6, 168, 30, 22, 73.33, 108, 450, 86.50),
('OFF007', '2025-05-20', 225, 162, 28, 20, 102000.00, 28, 96, 3.5, 162, 28, 20, 71.43, 102, 430, 85.50),
('OFF007', '2025-05-13', 215, 155, 26, 18, 98000.00, 26, 94, 3.4, 155, 26, 18, 69.23, 98, 410, 84.00),
('OFF007', '2025-05-06', 210, 150, 25, 17, 95000.00, 25, 92, 3.3, 150, 25, 17, 68.00, 95, 400, 83.00)

ON CONFLICT (officer_id, metric_date) 
DO UPDATE SET
    calls_made = EXCLUDED.calls_made,
    calls_answered = EXCLUDED.calls_answered,
    promises_made = EXCLUDED.promises_made,
    promises_kept = EXCLUDED.promises_kept,
    amount_collected = EXCLUDED.amount_collected,
    cases_resolved = EXCLUDED.cases_resolved,
    avg_call_duration = EXCLUDED.avg_call_duration,
    customer_satisfaction_score = EXCLUDED.customer_satisfaction_score,
    contacts_successful = EXCLUDED.contacts_successful,
    ptps_obtained = EXCLUDED.ptps_obtained,
    ptps_kept = EXCLUDED.ptps_kept,
    ptps_kept_rate = EXCLUDED.ptps_kept_rate,
    accounts_worked = EXCLUDED.accounts_worked,
    talk_time_minutes = EXCLUDED.talk_time_minutes,
    quality_score = EXCLUDED.quality_score;

-- Insert data for other officers for comparison
INSERT INTO kastle_banking.officer_performance_metrics (
    officer_id,
    metric_date,
    calls_made,
    calls_answered,
    promises_made,
    promises_kept,
    amount_collected,
    cases_resolved,
    avg_call_duration,
    customer_satisfaction_score,
    contacts_successful,
    ptps_obtained,
    ptps_kept,
    ptps_kept_rate,
    accounts_worked,
    talk_time_minutes,
    quality_score
) VALUES
-- Data for OFF001
('OFF001', '2025-07-29', 290, 210, 55, 45, 175000.00, 42, 115, 4.2, 210, 55, 45, 81.82, 135, 550, 88.00),
('OFF001', '2025-07-28', 285, 205, 52, 42, 170000.00, 40, 112, 4.1, 205, 52, 42, 80.77, 132, 540, 87.50),
('OFF001', '2025-07-26', 280, 200, 50, 39, 165000.00, 38, 110, 4.0, 200, 50, 39, 78.00, 130, 530, 89.00),

-- Data for OFF002
('OFF002', '2025-07-29', 340, 260, 70, 64, 210000.00, 55, 130, 4.7, 260, 70, 64, 91.43, 150, 650, 94.00),
('OFF002', '2025-07-28', 335, 255, 68, 61, 205000.00, 53, 128, 4.6, 255, 68, 61, 89.71, 148, 640, 93.50),
('OFF002', '2025-07-26', 330, 250, 65, 58, 200000.00, 51, 126, 4.5, 250, 65, 58, 89.23, 145, 630, 92.00),

-- Data for OFF003
('OFF003', '2025-07-29', 270, 190, 48, 36, 160000.00, 38, 108, 3.8, 190, 48, 36, 75.00, 125, 510, 82.00),
('OFF003', '2025-07-28', 265, 185, 45, 33, 155000.00, 36, 106, 3.7, 185, 45, 33, 73.33, 122, 500, 81.50),
('OFF003', '2025-07-26', 260, 180, 42, 30, 150000.00, 34, 104, 3.6, 180, 42, 30, 71.43, 120, 490, 83.00)

ON CONFLICT (officer_id, metric_date) DO NOTHING;

-- Verify the data was inserted
SELECT 
    officer_id,
    metric_date,
    calls_made,
    calls_answered,
    promises_made,
    promises_kept,
    ptps_kept_rate,
    amount_collected,
    quality_score
FROM kastle_banking.officer_performance_metrics
WHERE officer_id = 'OFF007'
ORDER BY metric_date DESC
LIMIT 5;

-- Show summary statistics
SELECT 
    officer_id,
    COUNT(*) as days_recorded,
    AVG(calls_made) as avg_calls,
    AVG(calls_answered) as avg_answered,
    AVG(ptps_kept_rate) as avg_kept_rate,
    SUM(amount_collected) as total_collected,
    AVG(quality_score) as avg_quality
FROM kastle_banking.officer_performance_metrics
WHERE metric_date >= '2025-07-01'
GROUP BY officer_id
ORDER BY avg_quality DESC;