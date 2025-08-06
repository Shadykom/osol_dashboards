-- Create Balance Sheet View
CREATE OR REPLACE VIEW balance_sheet_view AS
SELECT 
    -- Date and Filters
    CURRENT_DATE as date,
    b.id as branch_id,
    b.name as branch_name,
    p.id as product_id,
    p.name as product_name,
    c.segment as customer_segment,
    
    -- Assets - Current
    COALESCE(SUM(CASE WHEN a.account_type = 'CASH' THEN a.balance ELSE 0 END), 0) as cash,
    COALESCE(SUM(CASE WHEN a.account_type = 'RECEIVABLE' THEN a.balance ELSE 0 END), 0) as accounts_receivable,
    COALESCE(SUM(CASE WHEN a.account_type = 'INVENTORY' THEN a.balance ELSE 0 END), 0) as inventory,
    COALESCE(SUM(CASE WHEN a.account_type = 'OTHER_CURRENT_ASSET' THEN a.balance ELSE 0 END), 0) as other_current_assets,
    
    -- Assets - Non-Current
    COALESCE(SUM(CASE WHEN a.account_type = 'PROPERTY_PLANT_EQUIPMENT' THEN a.balance ELSE 0 END), 0) as property_plant_equipment,
    COALESCE(SUM(CASE WHEN a.account_type = 'INVESTMENT' THEN a.balance ELSE 0 END), 0) as investments,
    COALESCE(SUM(CASE WHEN a.account_type = 'INTANGIBLE' THEN a.balance ELSE 0 END), 0) as intangible_assets,
    COALESCE(SUM(CASE WHEN a.account_type = 'OTHER_NON_CURRENT_ASSET' THEN a.balance ELSE 0 END), 0) as other_non_current_assets,
    
    -- Liabilities - Current
    COALESCE(SUM(CASE WHEN a.account_type = 'PAYABLE' THEN a.balance ELSE 0 END), 0) as accounts_payable,
    COALESCE(SUM(CASE WHEN a.account_type = 'SHORT_TERM_DEBT' THEN a.balance ELSE 0 END), 0) as short_term_debt,
    COALESCE(SUM(CASE WHEN a.account_type = 'ACCRUED_EXPENSE' THEN a.balance ELSE 0 END), 0) as accrued_expenses,
    COALESCE(SUM(CASE WHEN a.account_type = 'OTHER_CURRENT_LIABILITY' THEN a.balance ELSE 0 END), 0) as other_current_liabilities,
    
    -- Liabilities - Non-Current
    COALESCE(SUM(CASE WHEN a.account_type = 'LONG_TERM_DEBT' THEN a.balance ELSE 0 END), 0) as long_term_debt,
    COALESCE(SUM(CASE WHEN a.account_type = 'DEFERRED_TAX' THEN a.balance ELSE 0 END), 0) as deferred_tax_liabilities,
    COALESCE(SUM(CASE WHEN a.account_type = 'OTHER_NON_CURRENT_LIABILITY' THEN a.balance ELSE 0 END), 0) as other_non_current_liabilities,
    
    -- Equity
    COALESCE(SUM(CASE WHEN a.account_type = 'COMMON_STOCK' THEN a.balance ELSE 0 END), 0) as common_stock,
    COALESCE(SUM(CASE WHEN a.account_type = 'RETAINED_EARNINGS' THEN a.balance ELSE 0 END), 0) as retained_earnings,
    COALESCE(SUM(CASE WHEN a.account_type = 'ADDITIONAL_PAID_IN_CAPITAL' THEN a.balance ELSE 0 END), 0) as additional_paid_in_capital,
    COALESCE(SUM(CASE WHEN a.account_type = 'TREASURY_STOCK' THEN a.balance ELSE 0 END), 0) as treasury_stock,
    COALESCE(SUM(CASE WHEN a.account_type = 'OTHER_EQUITY' THEN a.balance ELSE 0 END), 0) as other_equity
    
FROM accounts a
LEFT JOIN branches b ON a.branch_id = b.id
LEFT JOIN products p ON a.product_id = p.id
LEFT JOIN customers c ON a.customer_id = c.id
GROUP BY b.id, b.name, p.id, p.name, c.segment;

-- Create Cash Flow View
CREATE OR REPLACE VIEW cash_flow_view AS
SELECT 
    -- Date and Filters
    t.transaction_date as date,
    b.id as branch_id,
    b.name as branch_name,
    p.id as product_id,
    p.name as product_name,
    c.segment as customer_segment,
    
    -- Opening Cash Balance
    COALESCE(LAG(SUM(CASE WHEN a.account_type = 'CASH' THEN t.amount ELSE 0 END)) 
        OVER (PARTITION BY b.id, p.id, c.segment ORDER BY t.transaction_date), 0) as opening_cash_balance,
    
    -- Operating Activities
    COALESCE(SUM(CASE WHEN t.category = 'NET_INCOME' THEN t.amount ELSE 0 END), 0) as net_income,
    COALESCE(SUM(CASE WHEN t.category = 'DEPRECIATION' THEN t.amount ELSE 0 END), 0) as depreciation,
    COALESCE(SUM(CASE WHEN t.category = 'AMORTIZATION' THEN t.amount ELSE 0 END), 0) as amortization,
    COALESCE(SUM(CASE WHEN t.category = 'STOCK_COMPENSATION' THEN t.amount ELSE 0 END), 0) as stock_based_compensation,
    COALESCE(SUM(CASE WHEN t.category = 'DEFERRED_TAX' THEN t.amount ELSE 0 END), 0) as deferred_income_tax,
    COALESCE(SUM(CASE WHEN t.category = 'AR_CHANGE' THEN t.amount ELSE 0 END), 0) as accounts_receivable_change,
    COALESCE(SUM(CASE WHEN t.category = 'INVENTORY_CHANGE' THEN t.amount ELSE 0 END), 0) as inventory_change,
    COALESCE(SUM(CASE WHEN t.category = 'AP_CHANGE' THEN t.amount ELSE 0 END), 0) as accounts_payable_change,
    COALESCE(SUM(CASE WHEN t.category = 'OTHER_OPERATING' THEN t.amount ELSE 0 END), 0) as other_operating_activities,
    
    -- Investing Activities
    COALESCE(SUM(CASE WHEN t.category = 'CAPEX' THEN t.amount ELSE 0 END), 0) as capital_expenditures,
    COALESCE(SUM(CASE WHEN t.category = 'ACQUISITIONS' THEN t.amount ELSE 0 END), 0) as acquisitions,
    COALESCE(SUM(CASE WHEN t.category = 'INVESTMENT_PURCHASE' THEN t.amount ELSE 0 END), 0) as purchase_of_investments,
    COALESCE(SUM(CASE WHEN t.category = 'INVESTMENT_SALE' THEN t.amount ELSE 0 END), 0) as sale_of_investments,
    COALESCE(SUM(CASE WHEN t.category = 'ASSET_SALE' THEN t.amount ELSE 0 END), 0) as sale_of_assets,
    COALESCE(SUM(CASE WHEN t.category = 'OTHER_INVESTING' THEN t.amount ELSE 0 END), 0) as other_investing_activities,
    
    -- Financing Activities
    COALESCE(SUM(CASE WHEN t.category = 'DEBT_ISSUANCE' THEN t.amount ELSE 0 END), 0) as debt_issuance,
    COALESCE(SUM(CASE WHEN t.category = 'DEBT_REPAYMENT' THEN t.amount ELSE 0 END), 0) as debt_repayment,
    COALESCE(SUM(CASE WHEN t.category = 'STOCK_ISSUANCE' THEN t.amount ELSE 0 END), 0) as common_stock_issuance,
    COALESCE(SUM(CASE WHEN t.category = 'STOCK_REPURCHASE' THEN t.amount ELSE 0 END), 0) as common_stock_repurchase,
    COALESCE(SUM(CASE WHEN t.category = 'DIVIDENDS' THEN t.amount ELSE 0 END), 0) as dividends_paid,
    COALESCE(SUM(CASE WHEN t.category = 'OTHER_FINANCING' THEN t.amount ELSE 0 END), 0) as other_financing_activities,
    
    -- Additional Metrics
    COALESCE(SUM(CASE WHEN t.type = 'REVENUE' THEN t.amount ELSE 0 END), 0) as revenue,
    COALESCE(SUM(CASE WHEN a.account_type = 'DEBT' THEN a.balance ELSE 0 END), 0) as total_debt,
    COALESCE(SUM(CASE WHEN t.category = 'INTEREST_EXPENSE' THEN t.amount ELSE 0 END), 0) as interest_expense,
    COALESCE(SUM(a.balance), 0) as total_assets
    
FROM transactions t
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN branches b ON t.branch_id = b.id
LEFT JOIN products p ON t.product_id = p.id
LEFT JOIN customers c ON t.customer_id = c.id
GROUP BY t.transaction_date, b.id, b.name, p.id, p.name, c.segment;

-- Create simplified mock data tables if they don't exist
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    account_type VARCHAR(50),
    balance DECIMAL(15, 2),
    branch_id INTEGER,
    product_id INTEGER,
    customer_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_date DATE,
    category VARCHAR(50),
    type VARCHAR(50),
    amount DECIMAL(15, 2),
    account_id INTEGER,
    branch_id INTEGER,
    product_id INTEGER,
    customer_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    segment VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO branches (name) VALUES 
    ('Main Branch'),
    ('Downtown Branch'),
    ('Airport Branch')
ON CONFLICT DO NOTHING;

INSERT INTO products (name) VALUES 
    ('Savings Account'),
    ('Current Account'),
    ('Term Deposit'),
    ('Business Loan')
ON CONFLICT DO NOTHING;

INSERT INTO customers (name, segment) VALUES 
    ('John Doe', 'Retail'),
    ('Jane Smith', 'Premium'),
    ('ABC Corp', 'Corporate'),
    ('XYZ Ltd', 'SME')
ON CONFLICT DO NOTHING;