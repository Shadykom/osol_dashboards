-- Seed data for Officer Performance Metrics and Related Tables
-- This script inserts sample data for testing the Specialist Report functionality

-- First, ensure we're using the correct schema
SET search_path TO kastle_banking, kastle_collection, public;

-- Insert sample data for officer_performance_metrics
-- Data for the last 6 months for officer OFF007
INSERT INTO officer_performance_metrics (
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
-- July 2025 data
('OFF007', '2025-07-01', 120, 110, 250, 480, 180, 125000.00, 35, 75.00, 15.5, 1, 88.50),
('OFF007', '2025-07-02', 118, 108, 245, 470, 175, 118000.00, 32, 78.00, 14.8, 0, 89.00),
('OFF007', '2025-07-03', 122, 115, 260, 490, 185, 132000.00, 38, 76.50, 16.2, 0, 87.75),
('OFF007', '2025-07-04', 115, 105, 235, 450, 170, 115000.00, 30, 80.00, 14.5, 1, 88.00),
('OFF007', '2025-07-05', 125, 118, 270, 510, 195, 140000.00, 40, 77.50, 15.8, 0, 90.25),
('OFF007', '2025-07-08', 130, 122, 280, 520, 200, 145000.00, 42, 79.00, 16.5, 0, 91.00),
('OFF007', '2025-07-09', 128, 120, 275, 515, 198, 142000.00, 41, 78.50, 15.9, 0, 90.50),
('OFF007', '2025-07-10', 132, 125, 285, 530, 205, 150000.00, 45, 80.00, 16.8, 1, 89.75),
('OFF007', '2025-07-11', 126, 118, 265, 500, 190, 138000.00, 39, 76.00, 15.5, 0, 88.50),
('OFF007', '2025-07-12', 135, 128, 290, 540, 210, 155000.00, 46, 82.00, 17.2, 0, 92.00),
('OFF007', '2025-07-15', 140, 132, 300, 560, 220, 165000.00, 50, 84.00, 17.8, 0, 93.50),
('OFF007', '2025-07-16', 138, 130, 295, 550, 215, 160000.00, 48, 83.00, 17.5, 1, 92.75),
('OFF007', '2025-07-17', 142, 135, 305, 570, 225, 170000.00, 52, 85.00, 18.0, 0, 94.00),
('OFF007', '2025-07-18', 136, 128, 285, 535, 208, 158000.00, 47, 81.00, 16.9, 0, 91.50),
('OFF007', '2025-07-19', 145, 138, 310, 580, 230, 175000.00, 55, 86.00, 18.5, 0, 94.50),
('OFF007', '2025-07-22', 148, 140, 315, 590, 235, 180000.00, 58, 87.00, 19.0, 0, 95.00),
('OFF007', '2025-07-23', 146, 138, 308, 575, 228, 172000.00, 54, 85.50, 18.2, 1, 93.25),
('OFF007', '2025-07-24', 150, 142, 320, 600, 240, 185000.00, 60, 88.00, 19.5, 0, 95.50),
('OFF007', '2025-07-25', 144, 136, 298, 555, 218, 168000.00, 51, 82.50, 17.7, 0, 92.00),
('OFF007', '2025-07-26', 152, 145, 325, 610, 245, 190000.00, 62, 89.00, 20.0, 0, 96.00),
('OFF007', '2025-07-29', 155, 148, 330, 620, 250, 195000.00, 65, 90.00, 20.5, 0, 96.50),

-- June 2025 data (summary - few entries)
('OFF007', '2025-06-03', 110, 100, 220, 420, 160, 105000.00, 28, 71.00, 14.0, 1, 85.00),
('OFF007', '2025-06-10', 115, 105, 230, 440, 165, 110000.00, 30, 73.00, 14.5, 0, 86.00),
('OFF007', '2025-06-17', 120, 110, 240, 460, 170, 115000.00, 32, 75.00, 15.0, 0, 87.00),
('OFF007', '2025-06-24', 125, 115, 250, 480, 180, 120000.00, 35, 77.00, 15.5, 1, 88.00),

-- May 2025 data (summary - few entries)
('OFF007', '2025-05-06', 105, 95, 210, 400, 150, 95000.00, 25, 68.00, 13.5, 1, 83.00),
('OFF007', '2025-05-13', 108, 98, 215, 410, 155, 98000.00, 26, 69.00, 13.8, 0, 84.00),
('OFF007', '2025-05-20', 112, 102, 225, 430, 162, 102000.00, 28, 71.00, 14.2, 0, 85.50),
('OFF007', '2025-05-27', 118, 108, 235, 450, 168, 108000.00, 30, 73.00, 14.8, 1, 86.50);

-- Insert sample collection_interactions for OFF007
INSERT INTO collection_interactions (
    case_id,
    officer_id,
    interaction_type,
    interaction_datetime,
    interaction_direction,
    interaction_channel,
    interaction_status,
    duration_seconds,
    outcome,
    promise_to_pay,
    ptp_amount,
    ptp_date,
    notes
) VALUES
-- Recent interactions for today
(10, 'OFF007', 'CALL', '2025-07-29 09:15:00', 'OUTBOUND', 'PHONE', 'ANSWERED', 180, 'SUCCESSFUL', true, 15000.00, '2025-08-05', 'Customer agreed to pay next week'),
(10, 'OFF007', 'SMS', '2025-07-29 10:30:00', 'OUTBOUND', 'SMS', 'DELIVERED', 0, 'SENT', false, NULL, NULL, 'Payment reminder sent'),
(11, 'OFF007', 'CALL', '2025-07-29 11:00:00', 'OUTBOUND', 'PHONE', 'NO_ANSWER', 45, 'UNSUCCESSFUL', false, NULL, NULL, 'No answer, will try again'),
(12, 'OFF007', 'WHATSAPP', '2025-07-29 14:00:00', 'OUTBOUND', 'WHATSAPP', 'DELIVERED', 0, 'SENT', false, NULL, NULL, 'Account statement sent'),
(13, 'OFF007', 'CALL', '2025-07-29 15:30:00', 'OUTBOUND', 'PHONE', 'ANSWERED', 240, 'SUCCESSFUL', true, 25000.00, '2025-08-10', 'Customer requested payment plan'),

-- Yesterday's interactions
(14, 'OFF007', 'CALL', '2025-07-28 09:00:00', 'OUTBOUND', 'PHONE', 'ANSWERED', 150, 'SUCCESSFUL', false, NULL, NULL, 'Customer disputed charges'),
(15, 'OFF007', 'EMAIL', '2025-07-28 10:15:00', 'OUTBOUND', 'EMAIL', 'SENT', 0, 'SENT', false, NULL, NULL, 'Detailed statement sent'),
(16, 'OFF007', 'CALL', '2025-07-28 14:30:00', 'INBOUND', 'PHONE', 'ANSWERED', 300, 'SUCCESSFUL', true, 50000.00, '2025-08-01', 'Customer called to arrange payment'),

-- Last week's interactions
(17, 'OFF007', 'CALL', '2025-07-22 10:00:00', 'OUTBOUND', 'PHONE', 'ANSWERED', 200, 'SUCCESSFUL', true, 30000.00, '2025-07-25', 'Promise kept - payment received'),
(18, 'OFF007', 'SMS', '2025-07-23 11:30:00', 'OUTBOUND', 'SMS', 'DELIVERED', 0, 'SENT', false, NULL, NULL, 'Thank you message for payment'),
(19, 'OFF007', 'CALL', '2025-07-24 09:45:00', 'OUTBOUND', 'PHONE', 'BUSY', 10, 'UNSUCCESSFUL', false, NULL, NULL, 'Line busy'),
(20, 'OFF007', 'WHATSAPP', '2025-07-25 14:20:00', 'OUTBOUND', 'WHATSAPP', 'READ', 0, 'SUCCESSFUL', false, NULL, NULL, 'Payment confirmation sent');

-- Insert sample promise_to_pay records for OFF007
INSERT INTO promise_to_pay (
    case_id,
    officer_id,
    ptp_date,
    ptp_amount,
    status,
    actual_payment_date,
    actual_payment_amount,
    created_at
) VALUES
-- Active promises
(10, 'OFF007', '2025-08-05', 15000.00, 'PENDING', NULL, NULL, '2025-07-29 09:15:00'),
(13, 'OFF007', '2025-08-10', 25000.00, 'PENDING', NULL, NULL, '2025-07-29 15:30:00'),
(16, 'OFF007', '2025-08-01', 50000.00, 'PENDING', NULL, NULL, '2025-07-28 14:30:00'),

-- Kept promises
(17, 'OFF007', '2025-07-25', 30000.00, 'KEPT', '2025-07-25', 30000.00, '2025-07-22 10:00:00'),
(21, 'OFF007', '2025-07-20', 20000.00, 'KEPT', '2025-07-20', 20000.00, '2025-07-15 11:00:00'),
(22, 'OFF007', '2025-07-15', 35000.00, 'KEPT', '2025-07-15', 35000.00, '2025-07-10 13:00:00'),

-- Broken promises
(23, 'OFF007', '2025-07-18', 15000.00, 'BROKEN', NULL, NULL, '2025-07-12 10:00:00'),
(24, 'OFF007', '2025-07-10', 10000.00, 'BROKEN', NULL, NULL, '2025-07-05 14:00:00'),

-- Partial payments
(25, 'OFF007', '2025-07-22', 40000.00, 'PARTIAL', '2025-07-22', 25000.00, '2025-07-18 09:00:00');

-- Update collection_cases to have some assigned to OFF007
UPDATE collection_cases 
SET assigned_to = 'OFF007',
    assignment_date = '2025-07-01',
    last_contact_date = '2025-07-29',
    next_action_date = '2025-07-30'
WHERE case_id IN (10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20);

-- Insert sample data for other officers to compare performance
INSERT INTO officer_performance_metrics (
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
-- Data for OFF001
('OFF001', '2025-07-29', 145, 135, 290, 550, 210, 175000.00, 55, 82.00, 18.5, 2, 88.00),
('OFF001', '2025-07-28', 142, 132, 285, 540, 205, 170000.00, 52, 80.00, 18.0, 1, 87.50),
('OFF001', '2025-07-26', 140, 130, 280, 530, 200, 165000.00, 50, 78.00, 17.5, 0, 89.00),

-- Data for OFF002
('OFF002', '2025-07-29', 160, 150, 340, 650, 260, 210000.00, 70, 91.00, 22.0, 0, 94.00),
('OFF002', '2025-07-28', 158, 148, 335, 640, 255, 205000.00, 68, 90.00, 21.5, 0, 93.50),
('OFF002', '2025-07-26', 155, 145, 330, 630, 250, 200000.00, 65, 89.00, 21.0, 1, 92.00),

-- Data for OFF003
('OFF003', '2025-07-29', 135, 125, 270, 510, 190, 160000.00, 48, 75.00, 17.0, 3, 82.00),
('OFF003', '2025-07-28', 132, 122, 265, 500, 185, 155000.00, 45, 73.00, 16.5, 2, 81.50),
('OFF003', '2025-07-26', 130, 120, 260, 490, 180, 150000.00, 42, 71.00, 16.0, 1, 83.00);

-- Create a summary view for easy reporting
CREATE OR REPLACE VIEW officer_performance_summary AS
SELECT 
    o.officer_id,
    o.officer_name,
    o.officer_type,
    t.team_name,
    COALESCE(AVG(pm.calls_made), 0) as avg_calls_per_day,
    COALESCE(AVG(pm.contacts_successful), 0) as avg_successful_contacts,
    COALESCE(AVG(pm.amount_collected), 0) as avg_daily_collection,
    COALESCE(AVG(pm.ptps_obtained), 0) as avg_ptps_per_day,
    COALESCE(AVG(pm.ptps_kept_rate), 0) as avg_ptp_kept_rate,
    COALESCE(AVG(pm.quality_score), 0) as avg_quality_score,
    COUNT(DISTINCT pm.metric_date) as days_worked
FROM collection_officers o
LEFT JOIN collection_teams t ON o.team_id = t.team_id
LEFT JOIN officer_performance_metrics pm ON o.officer_id = pm.officer_id
    AND pm.metric_date >= CURRENT_DATE - INTERVAL '30 days'
WHERE o.status = 'ACTIVE'
GROUP BY o.officer_id, o.officer_name, o.officer_type, t.team_name;

-- Grant permissions
GRANT SELECT ON officer_performance_summary TO anon, authenticated;

-- Verify the data was inserted
SELECT 
    'Officer Performance Metrics' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT officer_id) as unique_officers
FROM officer_performance_metrics
WHERE metric_date >= '2025-05-01'

UNION ALL

SELECT 
    'Collection Interactions' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT officer_id) as unique_officers
FROM collection_interactions
WHERE officer_id = 'OFF007'

UNION ALL

SELECT 
    'Promise to Pay' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT officer_id) as unique_officers
FROM promise_to_pay
WHERE officer_id = 'OFF007';

-- Display sample data for OFF007
SELECT 
    officer_id,
    metric_date,
    calls_made,
    contacts_successful,
    amount_collected,
    ptps_obtained,
    ptps_kept_rate,
    quality_score
FROM officer_performance_metrics
WHERE officer_id = 'OFF007'
ORDER BY metric_date DESC
LIMIT 10;