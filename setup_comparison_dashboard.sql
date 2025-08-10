-- Schema: kastle_banking
-- Purpose: Comparison dashboard base views and helper functions

-- Note: This script creates lightweight daily views per domain and
-- comparison functions that aggregate by day/month/quarter/year.
-- It relies only on existing tables found in osol_full_schema.sql.

-- =========================
-- Sales (Transactions) Daily View
-- =========================
-- Create a portable source view for transactions depending on what exists
DO $$
BEGIN
  IF to_regclass('kastle_banking.transactions') IS NOT NULL THEN
    EXECUTE 'CREATE OR REPLACE VIEW kastle_banking.vw_tx_source AS SELECT * FROM kastle_banking.transactions';
  ELSIF to_regclass('kastle_banking.transactions_view') IS NOT NULL THEN
    EXECUTE 'CREATE OR REPLACE VIEW kastle_banking.vw_tx_source AS SELECT * FROM kastle_banking.transactions_view';
  ELSIF to_regclass('public.transactions') IS NOT NULL THEN
    EXECUTE 'CREATE OR REPLACE VIEW kastle_banking.vw_tx_source AS SELECT * FROM public.transactions';
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW kastle_banking.vw_tx_source AS 
      SELECT 
        NULL::bigint AS transaction_id,
        now()::timestamptz AS transaction_date,
        NULL::varchar AS account_number,
        NULL::int AS transaction_type_id,
        NULL::varchar AS debit_credit,
        0::numeric(18,2) AS transaction_amount,
        NULL::varchar AS currency_code,
        NULL::numeric AS running_balance,
        NULL::varchar AS contra_account,
        NULL::varchar AS channel,
        NULL::varchar AS reference_number,
        NULL::varchar AS cheque_number,
        NULL::text AS narration,
        NULL::varchar AS beneficiary_name,
        NULL::varchar AS beneficiary_account,
        NULL::varchar AS beneficiary_bank,
        NULL::varchar AS status,
        NULL::varchar AS approval_status,
        NULL::varchar AS approved_by,
        NULL::varchar AS reversal_ref,
        NULL::varchar AS branch_id,
        NULL::varchar AS teller_id,
        NULL::varchar AS device_id,
        NULL::varchar AS ip_address,
        now()::timestamptz AS created_at,
        now()::timestamptz AS posted_at';
  END IF;
END $$;

DROP VIEW IF EXISTS kastle_banking.vw_sales_daily CASCADE;
CREATE VIEW kastle_banking.vw_sales_daily AS
WITH tx AS (
  SELECT 
    t.transaction_date::date AS metric_date,
    COALESCE(t.branch_id, a.branch_id) AS branch_id,
    a.product_id,
    t.debit_credit,
    t.status,
    t.transaction_amount::numeric(18,2) AS amount
  FROM kastle_banking.vw_tx_source t
  LEFT JOIN kastle_banking.accounts a
    ON a.account_number::text = t.account_number::text
)
SELECT 
  metric_date,
  branch_id,
  product_id,
  SUM(CASE WHEN debit_credit = 'CREDIT' AND status = 'COMPLETED' THEN amount ELSE 0 END) AS sales_amount,
  COUNT(*) FILTER (WHERE debit_credit = 'CREDIT' AND status = 'COMPLETED') AS sales_count
FROM tx
GROUP BY metric_date, branch_id, product_id;

-- Index recommendation (optional, not created here):
-- CREATE INDEX ON kastle_banking.transactions (transaction_date, branch_id);
-- CREATE INDEX ON kastle_banking.accounts (account_number, product_id, branch_id);

-- =========================
-- Collections Daily View (from daily_collection_summary)
-- =========================
DROP VIEW IF EXISTS kastle_banking.vw_collections_daily CASCADE;
CREATE VIEW kastle_banking.vw_collections_daily AS
SELECT 
  d.summary_date AS metric_date,
  d.branch_id,
  NULL::integer AS product_id, -- Not product-specific in current schema
  d.total_due_amount,
  d.total_collected,
  d.collection_rate,
  d.accounts_due,
  d.accounts_collected,
  d.ptps_obtained,
  d.ptps_kept,
  d.digital_payments
FROM kastle_banking.daily_collection_summary d;

-- =========================
-- Customers Daily View
-- =========================
DROP VIEW IF EXISTS kastle_banking.vw_customers_daily CASCADE;
CREATE VIEW kastle_banking.vw_customers_daily AS
SELECT 
  c.onboarding_date AS metric_date,
  COALESCE(c.onboarding_branch, NULLIF(c.branch_id, '')::varchar(10)) AS branch_id,
  COUNT(*) AS new_customers
FROM kastle_banking.customers c
WHERE c.onboarding_date IS NOT NULL
GROUP BY c.onboarding_date, COALESCE(c.onboarding_branch, NULLIF(c.branch_id, '')::varchar(10));

-- =========================
-- Accounts (Products) Daily View
-- =========================
DROP VIEW IF EXISTS kastle_banking.vw_accounts_daily CASCADE;
CREATE VIEW kastle_banking.vw_accounts_daily AS
SELECT 
  a.opening_date AS metric_date,
  a.branch_id,
  a.product_id,
  COUNT(*) AS new_accounts
FROM kastle_banking.accounts a
WHERE a.opening_date IS NOT NULL
GROUP BY a.opening_date, a.branch_id, a.product_id;

-- =========================
-- Collection Cases Daily View
-- =========================
DROP VIEW IF EXISTS kastle_banking.vw_cases_daily CASCADE;
CREATE VIEW kastle_banking.vw_cases_daily AS
WITH created_cases AS (
  SELECT 
    cc.created_at::date AS metric_date,
    cc.branch_id,
    cc.product_type,
    COUNT(*) AS new_cases
  FROM kastle_banking.collection_cases cc
  WHERE cc.created_at IS NOT NULL
  GROUP BY cc.created_at::date, cc.branch_id, cc.product_type
),
resolved_cases AS (
  SELECT 
    cc.updated_at::date AS metric_date,
    cc.branch_id,
    cc.product_type,
    COUNT(*) AS resolved_cases
  FROM kastle_banking.collection_cases cc
  WHERE cc.updated_at IS NOT NULL
    AND cc.case_status IN ('RESOLVED','CLOSED','SETTLED','WRITTEN_OFF')
  GROUP BY cc.updated_at::date, cc.branch_id, cc.product_type
)
SELECT 
  COALESCE(cr.metric_date, rs.metric_date) AS metric_date,
  COALESCE(cr.branch_id, rs.branch_id) AS branch_id,
  COALESCE(cr.product_type, rs.product_type) AS product_type,
  COALESCE(cr.new_cases, 0) AS new_cases,
  COALESCE(rs.resolved_cases, 0) AS resolved_cases
FROM created_cases cr
FULL OUTER JOIN resolved_cases rs
  ON cr.metric_date = rs.metric_date
 AND cr.branch_id = rs.branch_id
 AND COALESCE(cr.product_type, '') = COALESCE(rs.product_type, '');

-- =========================
-- Helper: period_bucket function (day/month/quarter/year)
-- =========================
DROP FUNCTION IF EXISTS kastle_banking.period_bucket(date, text) CASCADE;
CREATE FUNCTION kastle_banking.period_bucket(p_date date, p_granularity text)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN lower(p_granularity) = 'day' THEN p_date
    WHEN lower(p_granularity) = 'month' THEN date_trunc('month', p_date)::date
    WHEN lower(p_granularity) = 'quarter' THEN date_trunc('quarter', p_date)::date
    WHEN lower(p_granularity) = 'year' THEN date_trunc('year', p_date)::date
    ELSE p_date
  END;
$$;

-- =========================
-- Generic comparison helper to compute delta and pct change
-- =========================
DROP FUNCTION IF EXISTS kastle_banking.compute_change(numeric, numeric) CASCADE;
CREATE FUNCTION kastle_banking.compute_change(v2 numeric, v1 numeric)
RETURNS TABLE(delta numeric, pct_change numeric)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    (v2 - v1) AS delta,
    CASE WHEN v1 IS NULL OR v1 = 0 THEN NULL ELSE ((v2 - v1) / v1) * 100 END AS pct_change;
$$;

-- =========================
-- Comparison functions per domain
-- =========================
-- Each function returns aggregated values for two arbitrary date ranges
-- and supports optional filtering by branch and product (where applicable).

-- 1) Sales comparison
DROP FUNCTION IF EXISTS kastle_banking.fn_compare_sales(text[], integer[], date, date, date, date, text) CASCADE;
CREATE FUNCTION kastle_banking.fn_compare_sales(
  p_branch_ids text[] DEFAULT NULL,
  p_product_ids integer[] DEFAULT NULL,
  p_start_1 date,
  p_end_1 date,
  p_start_2 date,
  p_end_2 date,
  p_granularity text DEFAULT 'month'
)
RETURNS TABLE (
  period date,
  branch_id varchar(10),
  product_id integer,
  value_1 numeric,
  value_2 numeric,
  delta numeric,
  pct_change numeric
)
LANGUAGE sql
AS $$
WITH d1 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         product_id,
         SUM(sales_amount) AS value
  FROM kastle_banking.vw_sales_daily
  WHERE metric_date BETWEEN p_start_1 AND p_end_1
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
    AND (p_product_ids IS NULL OR product_id = ANY(p_product_ids))
  GROUP BY 1,2,3
), d2 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         product_id,
         SUM(sales_amount) AS value
  FROM kastle_banking.vw_sales_daily
  WHERE metric_date BETWEEN p_start_2 AND p_end_2
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
    AND (p_product_ids IS NULL OR product_id = ANY(p_product_ids))
  GROUP BY 1,2,3
)
SELECT 
  COALESCE(d1.period, d2.period) AS period,
  COALESCE(d1.branch_id, d2.branch_id) AS branch_id,
  COALESCE(d1.product_id, d2.product_id) AS product_id,
  COALESCE(d1.value, 0) AS value_1,
  COALESCE(d2.value, 0) AS value_2,
  (SELECT delta FROM kastle_banking.compute_change(COALESCE(d2.value,0), COALESCE(d1.value,0))) AS delta,
  (SELECT pct_change FROM kastle_banking.compute_change(COALESCE(d2.value,0), COALESCE(d1.value,0))) AS pct_change
FROM d1
FULL OUTER JOIN d2 USING (period, branch_id, product_id)
ORDER BY period, branch_id, product_id;
$$;

-- 2) Collections comparison
DROP FUNCTION IF EXISTS kastle_banking.fn_compare_collections(text[], date, date, date, date, text) CASCADE;
CREATE FUNCTION kastle_banking.fn_compare_collections(
  p_branch_ids text[] DEFAULT NULL,
  p_start_1 date,
  p_end_1 date,
  p_start_2 date,
  p_end_2 date,
  p_granularity text DEFAULT 'month'
)
RETURNS TABLE (
  period date,
  branch_id varchar(10),
  value_1 numeric,
  value_2 numeric,
  delta numeric,
  pct_change numeric
)
LANGUAGE sql
AS $$
WITH d1 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         SUM(total_collected) AS value
  FROM kastle_banking.vw_collections_daily
  WHERE metric_date BETWEEN p_start_1 AND p_end_1
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
  GROUP BY 1,2
), d2 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         SUM(total_collected) AS value
  FROM kastle_banking.vw_collections_daily
  WHERE metric_date BETWEEN p_start_2 AND p_end_2
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
  GROUP BY 1,2
)
SELECT 
  COALESCE(d1.period, d2.period) AS period,
  COALESCE(d1.branch_id, d2.branch_id) AS branch_id,
  COALESCE(d1.value, 0) AS value_1,
  COALESCE(d2.value, 0) AS value_2,
  (SELECT delta FROM kastle_banking.compute_change(COALESCE(d2.value,0), COALESCE(d1.value,0))) AS delta,
  (SELECT pct_change FROM kastle_banking.compute_change(COALESCE(d2.value,0), COALESCE(d1.value,0))) AS pct_change
FROM d1
FULL OUTER JOIN d2 USING (period, branch_id)
ORDER BY period, branch_id;
$$;

-- 3) Customers comparison (new customers)
DROP FUNCTION IF EXISTS kastle_banking.fn_compare_customers(text[], date, date, date, date, text) CASCADE;
CREATE FUNCTION kastle_banking.fn_compare_customers(
  p_branch_ids text[] DEFAULT NULL,
  p_start_1 date,
  p_end_1 date,
  p_start_2 date,
  p_end_2 date,
  p_granularity text DEFAULT 'month'
)
RETURNS TABLE (
  period date,
  branch_id varchar(10),
  value_1 bigint,
  value_2 bigint,
  delta bigint,
  pct_change numeric
)
LANGUAGE sql
AS $$
WITH d1 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         SUM(new_customers)::bigint AS value
  FROM kastle_banking.vw_customers_daily
  WHERE metric_date BETWEEN p_start_1 AND p_end_1
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
  GROUP BY 1,2
), d2 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         SUM(new_customers)::bigint AS value
  FROM kastle_banking.vw_customers_daily
  WHERE metric_date BETWEEN p_start_2 AND p_end_2
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
  GROUP BY 1,2
)
SELECT 
  COALESCE(d1.period, d2.period) AS period,
  COALESCE(d1.branch_id, d2.branch_id) AS branch_id,
  COALESCE(d1.value, 0) AS value_1,
  COALESCE(d2.value, 0) AS value_2,
  (COALESCE(d2.value,0) - COALESCE(d1.value,0)) AS delta,
  CASE WHEN COALESCE(d1.value,0) = 0 THEN NULL ELSE ((COALESCE(d2.value,0) - COALESCE(d1.value,0))::numeric / COALESCE(d1.value,0)) * 100 END AS pct_change
FROM d1
FULL OUTER JOIN d2 USING (period, branch_id)
ORDER BY period, branch_id;
$$;

-- 4) Accounts (Products) comparison (new accounts)
DROP FUNCTION IF EXISTS kastle_banking.fn_compare_accounts(text[], integer[], date, date, date, date, text) CASCADE;
CREATE FUNCTION kastle_banking.fn_compare_accounts(
  p_branch_ids text[] DEFAULT NULL,
  p_product_ids integer[] DEFAULT NULL,
  p_start_1 date,
  p_end_1 date,
  p_start_2 date,
  p_end_2 date,
  p_granularity text DEFAULT 'month'
)
RETURNS TABLE (
  period date,
  branch_id varchar(10),
  product_id integer,
  value_1 bigint,
  value_2 bigint,
  delta bigint,
  pct_change numeric
)
LANGUAGE sql
AS $$
WITH d1 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         product_id,
         SUM(new_accounts)::bigint AS value
  FROM kastle_banking.vw_accounts_daily
  WHERE metric_date BETWEEN p_start_1 AND p_end_1
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
    AND (p_product_ids IS NULL OR product_id = ANY(p_product_ids))
  GROUP BY 1,2,3
), d2 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         product_id,
         SUM(new_accounts)::bigint AS value
  FROM kastle_banking.vw_accounts_daily
  WHERE metric_date BETWEEN p_start_2 AND p_end_2
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
    AND (p_product_ids IS NULL OR product_id = ANY(p_product_ids))
  GROUP BY 1,2,3
)
SELECT 
  COALESCE(d1.period, d2.period) AS period,
  COALESCE(d1.branch_id, d2.branch_id) AS branch_id,
  COALESCE(d1.product_id, d2.product_id) AS product_id,
  COALESCE(d1.value, 0) AS value_1,
  COALESCE(d2.value, 0) AS value_2,
  (COALESCE(d2.value,0) - COALESCE(d1.value,0)) AS delta,
  CASE WHEN COALESCE(d1.value,0) = 0 THEN NULL ELSE ((COALESCE(d2.value,0) - COALESCE(d1.value,0))::numeric / COALESCE(d1.value,0)) * 100 END AS pct_change
FROM d1
FULL OUTER JOIN d2 USING (period, branch_id, product_id)
ORDER BY period, branch_id, product_id;
$$;

-- 5) Cases comparison (by product_type text)
DROP FUNCTION IF EXISTS kastle_banking.fn_compare_cases(text[], text[], date, date, date, date, text) CASCADE;
CREATE FUNCTION kastle_banking.fn_compare_cases(
  p_branch_ids text[] DEFAULT NULL,
  p_product_types text[] DEFAULT NULL,
  p_start_1 date,
  p_end_1 date,
  p_start_2 date,
  p_end_2 date,
  p_granularity text DEFAULT 'month'
)
RETURNS TABLE (
  period date,
  branch_id varchar(10),
  product_type text,
  new_cases_1 bigint,
  new_cases_2 bigint,
  new_cases_delta bigint,
  new_cases_pct_change numeric,
  resolved_cases_1 bigint,
  resolved_cases_2 bigint,
  resolved_cases_delta bigint,
  resolved_cases_pct_change numeric
)
LANGUAGE sql
AS $$
WITH d1 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         product_type,
         SUM(new_cases)::bigint AS new_cases,
         SUM(resolved_cases)::bigint AS resolved_cases
  FROM kastle_banking.vw_cases_daily
  WHERE metric_date BETWEEN p_start_1 AND p_end_1
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
    AND (p_product_types IS NULL OR product_type = ANY(p_product_types))
  GROUP BY 1,2,3
), d2 AS (
  SELECT period_bucket(metric_date, p_granularity) AS period,
         branch_id,
         product_type,
         SUM(new_cases)::bigint AS new_cases,
         SUM(resolved_cases)::bigint AS resolved_cases
  FROM kastle_banking.vw_cases_daily
  WHERE metric_date BETWEEN p_start_2 AND p_end_2
    AND (p_branch_ids IS NULL OR branch_id = ANY(p_branch_ids))
    AND (p_product_types IS NULL OR product_type = ANY(p_product_types))
  GROUP BY 1,2,3
)
SELECT 
  COALESCE(d1.period, d2.period) AS period,
  COALESCE(d1.branch_id, d2.branch_id) AS branch_id,
  COALESCE(d1.product_type, d2.product_type) AS product_type,
  COALESCE(d1.new_cases, 0) AS new_cases_1,
  COALESCE(d2.new_cases, 0) AS new_cases_2,
  (COALESCE(d2.new_cases,0) - COALESCE(d1.new_cases,0)) AS new_cases_delta,
  CASE WHEN COALESCE(d1.new_cases,0) = 0 THEN NULL ELSE ((COALESCE(d2.new_cases,0) - COALESCE(d1.new_cases,0))::numeric / COALESCE(d1.new_cases,0)) * 100 END AS new_cases_pct_change,
  COALESCE(d1.resolved_cases, 0) AS resolved_cases_1,
  COALESCE(d2.resolved_cases, 0) AS resolved_cases_2,
  (COALESCE(d2.resolved_cases,0) - COALESCE(d1.resolved_cases,0)) AS resolved_cases_delta,
  CASE WHEN COALESCE(d1.resolved_cases,0) = 0 THEN NULL ELSE ((COALESCE(d2.resolved_cases,0) - COALESCE(d1.resolved_cases,0))::numeric / COALESCE(d1.resolved_cases,0)) * 100 END AS resolved_cases_pct_change
FROM d1
FULL OUTER JOIN d2 USING (period, branch_id, product_type)
ORDER BY period, branch_id, product_type;
$$;

-- =========================
-- Drill-down detail views for cards
-- =========================
DROP VIEW IF EXISTS kastle_banking.vw_sales_detail CASCADE;
CREATE VIEW kastle_banking.vw_sales_detail AS
SELECT 
  t.transaction_id,
  t.transaction_date,
  t.account_number,
  a.customer_id,
  t.debit_credit,
  t.transaction_amount,
  t.narration,
  t.channel,
  t.status,
  COALESCE(t.branch_id, a.branch_id) AS branch_id,
  a.product_id
FROM kastle_banking.transactions t
LEFT JOIN kastle_banking.accounts a
  ON a.account_number::text = t.account_number::text;

DROP VIEW IF EXISTS kastle_banking.vw_collections_detail CASCADE;
CREATE VIEW kastle_banking.vw_collections_detail AS
SELECT 
  d.summary_date,
  d.branch_id,
  d.total_due_amount,
  d.total_collected,
  d.collection_rate,
  d.accounts_due,
  d.accounts_collected,
  d.ptps_obtained,
  d.ptps_kept,
  d.digital_payments
FROM kastle_banking.daily_collection_summary d;

DROP VIEW IF EXISTS kastle_banking.vw_customers_detail CASCADE;
CREATE VIEW kastle_banking.vw_customers_detail AS
SELECT 
  c.customer_id,
  c.full_name,
  c.onboarding_date,
  COALESCE(c.onboarding_branch, NULLIF(c.branch_id, '')::varchar(10)) AS branch_id,
  c.customer_type,
  c.customer_segment AS segment,
  c.customer_status,
  c.risk_category
FROM kastle_banking.customers c;

DROP VIEW IF EXISTS kastle_banking.vw_accounts_detail CASCADE;
CREATE VIEW kastle_banking.vw_accounts_detail AS
SELECT 
  a.account_id,
  a.account_number,
  a.customer_id,
  a.product_id,
  a.branch_id,
  a.opening_date,
  a.account_status,
  a.current_balance
FROM kastle_banking.accounts a;

DROP VIEW IF EXISTS kastle_banking.vw_cases_detail CASCADE;
CREATE VIEW kastle_banking.vw_cases_detail AS
SELECT 
  cc.case_id,
  cc.case_number,
  cc.customer_id,
  cc.account_number,
  cc.branch_id,
  cc.product_type,
  cc.total_outstanding,
  cc.total_overdue,
  cc.days_past_due AS dpd,
  cc.case_status,
  cc.assigned_to,
  cc.assignment_date,
  cc.created_at,
  cc.updated_at
FROM kastle_banking.collection_cases cc;