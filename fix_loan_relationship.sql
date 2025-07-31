ALTER TABLE kastle_banking.loan_accounts ADD CONSTRAINT fk_loan_accounts_loan_type FOREIGN KEY (loan_type_id) REFERENCES kastle_banking.loan_types(type_id);
