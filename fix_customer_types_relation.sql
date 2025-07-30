-- Fix missing foreign key relationship between customers and customer_types tables
-- This script adds the missing constraint that's causing the Supabase query error

-- Add foreign key constraint from customers.customer_type_id to customer_types.type_id
ALTER TABLE kastle_banking.customers
ADD CONSTRAINT customers_customer_type_id_fkey 
FOREIGN KEY (customer_type_id) 
REFERENCES kastle_banking.customer_types(type_id);

-- Create index on customer_type_id for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_type_id 
ON kastle_banking.customers(customer_type_id);

-- Verify the constraint was added successfully
-- You can run this query to check:
-- SELECT 
--     tc.constraint_name, 
--     tc.table_name, 
--     kcu.column_name, 
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name 
-- FROM 
--     information_schema.table_constraints AS tc 
--     JOIN information_schema.key_column_usage AS kcu
--       ON tc.constraint_name = kcu.constraint_name
--       AND tc.table_schema = kcu.table_schema
--     JOIN information_schema.constraint_column_usage AS ccu
--       ON ccu.constraint_name = tc.constraint_name
--       AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND tc.table_schema = 'kastle_banking'
--   AND tc.table_name = 'customers'
--   AND kcu.column_name = 'customer_type_id';