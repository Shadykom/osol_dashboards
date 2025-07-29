-- Simple seed data script for Officer Performance Metrics
-- Run this to quickly add test data for OFF007

-- Insert officer performance metrics for OFF007
INSERT INTO kastle_banking.officer_performance_metrics (
    officer_id,
    metric_date,
    accounts_assigned,
    accounts_worked,
    calls_made,
    talk_time_minutes,
    contacts_successful,
    amount_collected,
    ptps_obtained,
    ptps_kept_rate,
    average_collection_days,
    customer_complaints,
    quality_score
) VALUES
-- Current month data (July 2025)
('OFF007', '2025-07-29', 155, 148, 330, 620, 250, 195000.00, 65, 90.00, 20.5, 0, 96.50),
('OFF007', '2025-07-28', 152, 145, 325, 610, 245, 190000.00, 62, 89.00, 20.0, 0, 96.00),
('OFF007', '2025-07-26', 150, 142, 320, 600, 240, 185000.00, 60, 88.00, 19.5, 0, 95.50),
('OFF007', '2025-07-25', 144, 136, 298, 555, 218, 168000.00, 51, 82.50, 17.7, 0, 92.00),
('OFF007', '2025-07-24', 148, 140, 315, 590, 235, 180000.00, 58, 87.00, 19.0, 0, 95.00),
('OFF007', '2025-07-23', 146, 138, 308, 575, 228, 172000.00, 54, 85.50, 18.2, 1, 93.25),
('OFF007', '2025-07-22', 145, 138, 310, 580, 230, 175000.00, 55, 86.00, 18.5, 0, 94.50),
('OFF007', '2025-07-19', 142, 135, 305, 570, 225, 170000.00, 52, 85.00, 18.0, 0, 94.00),
('OFF007', '2025-07-18', 136, 128, 285, 535, 208, 158000.00, 47, 81.00, 16.9, 0, 91.50),
('OFF007', '2025-07-17', 140, 132, 300, 560, 220, 165000.00, 50, 84.00, 17.8, 0, 93.50),
('OFF007', '2025-07-16', 138, 130, 295, 550, 215, 160000.00, 48, 83.00, 17.5, 1, 92.75),
('OFF007', '2025-07-15', 135, 128, 290, 540, 210, 155000.00, 46, 82.00, 17.2, 0, 92.00),
('OFF007', '2025-07-12', 132, 125, 285, 530, 205, 150000.00, 45, 80.00, 16.8, 1, 89.75),
('OFF007', '2025-07-11', 126, 118, 265, 500, 190, 138000.00, 39, 76.00, 15.5, 0, 88.50),
('OFF007', '2025-07-10', 130, 122, 280, 520, 200, 145000.00, 42, 79.00, 16.5, 0, 91.00),
('OFF007', '2025-07-09', 128, 120, 275, 515, 198, 142000.00, 41, 78.50, 15.9, 0, 90.50),
('OFF007', '2025-07-08', 125, 118, 270, 510, 195, 140000.00, 40, 77.50, 15.8, 0, 90.25),
('OFF007', '2025-07-05', 115, 105, 235, 450, 170, 115000.00, 30, 80.00, 14.5, 1, 88.00),
('OFF007', '2025-07-04', 122, 115, 260, 490, 185, 132000.00, 38, 76.50, 16.2, 0, 87.75),
('OFF007', '2025-07-03', 118, 108, 245, 470, 175, 118000.00, 32, 78.00, 14.8, 0, 89.00),
('OFF007', '2025-07-02', 120, 110, 250, 480, 180, 125000.00, 35, 75.00, 15.5, 1, 88.50),
('OFF007', '2025-07-01', 115, 105, 235, 450, 170, 115000.00, 30, 73.00, 14.5, 0, 87.00),

-- Previous month data (June 2025)
('OFF007', '2025-06-28', 125, 115, 250, 480, 180, 120000.00, 35, 77.00, 15.5, 1, 88.00),
('OFF007', '2025-06-24', 120, 110, 240, 460, 170, 115000.00, 32, 75.00, 15.0, 0, 87.00),
('OFF007', '2025-06-17', 115, 105, 230, 440, 165, 110000.00, 30, 73.00, 14.5, 0, 86.00),
('OFF007', '2025-06-10', 110, 100, 220, 420, 160, 105000.00, 28, 71.00, 14.0, 1, 85.00),
('OFF007', '2025-06-03', 105, 95, 210, 400, 150, 95000.00, 25, 68.00, 13.5, 0, 84.00)

ON CONFLICT (officer_id, metric_date) 
DO UPDATE SET
    accounts_assigned = EXCLUDED.accounts_assigned,
    accounts_worked = EXCLUDED.accounts_worked,
    calls_made = EXCLUDED.calls_made,
    talk_time_minutes = EXCLUDED.talk_time_minutes,
    contacts_successful = EXCLUDED.contacts_successful,
    amount_collected = EXCLUDED.amount_collected,
    ptps_obtained = EXCLUDED.ptps_obtained,
    ptps_kept_rate = EXCLUDED.ptps_kept_rate,
    average_collection_days = EXCLUDED.average_collection_days,
    customer_complaints = EXCLUDED.customer_complaints,
    quality_score = EXCLUDED.quality_score;

-- Verify the data
SELECT 
    officer_id,
    metric_date,
    calls_made,
    contacts_successful,
    amount_collected,
    ptps_obtained,
    ptps_kept_rate,
    quality_score
FROM kastle_banking.officer_performance_metrics
WHERE officer_id = 'OFF007'
ORDER BY metric_date DESC
LIMIT 5;