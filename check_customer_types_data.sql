-- Check for data issues before adding foreign key constraint

-- 1. Check if customer_types table has any data
SELECT COUNT(*) as customer_types_count FROM kastle_banking.customer_types;

-- 2. List all customer types
SELECT * FROM kastle_banking.customer_types ORDER BY type_id;

-- 3. Check for any customers with invalid customer_type_id values
-- (values that don't exist in customer_types table)
SELECT DISTINCT c.customer_type_id, COUNT(*) as customer_count
FROM kastle_banking.customers c
LEFT JOIN kastle_banking.customer_types ct ON c.customer_type_id = ct.type_id
WHERE c.customer_type_id IS NOT NULL 
  AND ct.type_id IS NULL
GROUP BY c.customer_type_id;

-- 4. If there are invalid customer_type_id values, you might need to:
-- Option A: Insert missing customer types
-- INSERT INTO kastle_banking.customer_types (type_code, type_name, description) 
-- VALUES ('UNKNOWN', 'Unknown', 'Unknown customer type');

-- Option B: Update invalid customer_type_id to NULL or a valid value
-- UPDATE kastle_banking.customers 
-- SET customer_type_id = NULL 
-- WHERE customer_type_id NOT IN (SELECT type_id FROM kastle_banking.customer_types);

-- 5. Count customers by type
SELECT 
    ct.type_name,
    COUNT(c.customer_id) as customer_count
FROM kastle_banking.customer_types ct
LEFT JOIN kastle_banking.customers c ON ct.type_id = c.customer_type_id
GROUP BY ct.type_id, ct.type_name
ORDER BY customer_count DESC;