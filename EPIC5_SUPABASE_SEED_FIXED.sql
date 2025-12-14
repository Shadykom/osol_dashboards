-- =============================================================================
-- EPIC 5: Seed Data for MDM & Integration (FIXED VERSION)
-- =============================================================================
-- Run this AFTER the EPIC5_SUPABASE_MIGRATION.sql script
-- This version handles tenant_config foreign key issues gracefully
-- =============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_lms_source_id UUID;
    v_manual_source_id UUID;
    v_api_source_id UUID;
    v_tenant_exists BOOLEAN;
BEGIN
    -- Try to get tenant from platform.tenants first
    SELECT id INTO v_tenant_id FROM platform.tenants WHERE status = 'active' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        -- Try public.tenants as fallback
        BEGIN
            SELECT id INTO v_tenant_id FROM public.tenants WHERE status = 'active' LIMIT 1;
        EXCEPTION WHEN undefined_table THEN
            NULL;
        END;
    END IF;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No active tenant found in platform.tenants or public.tenants. Please create a tenant first.';
    END IF;
    
    RAISE NOTICE '✅ Using tenant ID: %', v_tenant_id;
    
    -- Set tenant context for RLS
    PERFORM set_config('app.current_tenant', v_tenant_id::text, true);
    
    -- ==========================================================================
    -- Seed Source Systems
    -- ==========================================================================
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (
        v_tenant_id, 'LMS', 'Loan Management System',
        'Primary source for loan and contract data', 'active',
        '{"priority": 1, "trustLevel": "high", "dataTypes": ["PARTY", "CONTRACT", "CHARGE"]}'::jsonb
    )
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_lms_source_id;
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (
        v_tenant_id, 'MANUAL', 'Manual Entry',
        'Manual data entry by staff through UI', 'active',
        '{"priority": 2, "trustLevel": "medium", "dataTypes": ["PARTY", "CONTRACT"]}'::jsonb
    )
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_manual_source_id;
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (
        v_tenant_id, 'API', 'External API Integration',
        'External system API integrations', 'active',
        '{"priority": 3, "trustLevel": "medium", "dataTypes": ["PARTY", "CONTRACT"]}'::jsonb
    )
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_api_source_id;
    
    RAISE NOTICE '✅ Created source systems: LMS=%, MANUAL=%, API=%', v_lms_source_id, v_manual_source_id, v_api_source_id;
    
    -- ==========================================================================
    -- Seed Reference Data: COUNTRY
    -- ==========================================================================
    
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'COUNTRY', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', '{"iso3": "SAU", "phoneCode": "+966"}'::jsonb, 1),
    (v_tenant_id, 'COUNTRY', 'AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', '{"iso3": "ARE", "phoneCode": "+971"}'::jsonb, 2),
    (v_tenant_id, 'COUNTRY', 'EG', 'مصر', 'Egypt', '{"iso3": "EGY", "phoneCode": "+20"}'::jsonb, 3),
    (v_tenant_id, 'COUNTRY', 'JO', 'الأردن', 'Jordan', '{"iso3": "JOR", "phoneCode": "+962"}'::jsonb, 4),
    (v_tenant_id, 'COUNTRY', 'KW', 'الكويت', 'Kuwait', '{"iso3": "KWT", "phoneCode": "+965"}'::jsonb, 5),
    (v_tenant_id, 'COUNTRY', 'BH', 'البحرين', 'Bahrain', '{"iso3": "BHR", "phoneCode": "+973"}'::jsonb, 6),
    (v_tenant_id, 'COUNTRY', 'QA', 'قطر', 'Qatar', '{"iso3": "QAT", "phoneCode": "+974"}'::jsonb, 7),
    (v_tenant_id, 'COUNTRY', 'OM', 'عمان', 'Oman', '{"iso3": "OMN", "phoneCode": "+968"}'::jsonb, 8)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    RAISE NOTICE '✅ Seeded COUNTRY reference data (8 records)';
    
    -- ==========================================================================
    -- Seed Reference Data: NATIONALITY
    -- ==========================================================================
    
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'NATIONALITY', 'SAUDI', 'سعودي', 'Saudi', '{"countryCode": "SA"}'::jsonb, 1),
    (v_tenant_id, 'NATIONALITY', 'EMIRATI', 'إماراتي', 'Emirati', '{"countryCode": "AE"}'::jsonb, 2),
    (v_tenant_id, 'NATIONALITY', 'EGYPTIAN', 'مصري', 'Egyptian', '{"countryCode": "EG"}'::jsonb, 3),
    (v_tenant_id, 'NATIONALITY', 'JORDANIAN', 'أردني', 'Jordanian', '{"countryCode": "JO"}'::jsonb, 4),
    (v_tenant_id, 'NATIONALITY', 'KUWAITI', 'كويتي', 'Kuwaiti', '{"countryCode": "KW"}'::jsonb, 5)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    RAISE NOTICE '✅ Seeded NATIONALITY reference data (5 records)';
    
    -- ==========================================================================
    -- Seed Reference Data: FEE_TYPE
    -- ==========================================================================
    
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'FEE_TYPE', 'LATE_FEE', 'رسوم التأخير', 'Late Payment Fee', '{"category": "penalty"}'::jsonb, 1),
    (v_tenant_id, 'FEE_TYPE', 'ADMIN_FEE', 'رسوم إدارية', 'Administrative Fee', '{"category": "service"}'::jsonb, 2),
    (v_tenant_id, 'FEE_TYPE', 'PROCESSING_FEE', 'رسوم المعالجة', 'Processing Fee', '{"category": "service"}'::jsonb, 3),
    (v_tenant_id, 'FEE_TYPE', 'EARLY_SETTLEMENT', 'رسوم التسوية المبكرة', 'Early Settlement Fee', '{"category": "contract"}'::jsonb, 4),
    (v_tenant_id, 'FEE_TYPE', 'COLLECTION_FEE', 'رسوم التحصيل', 'Collection Fee', '{"category": "penalty"}'::jsonb, 5)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    RAISE NOTICE '✅ Seeded FEE_TYPE reference data (5 records)';
    
    -- ==========================================================================
    -- Seed Reference Data: CHARGE_TYPE
    -- ==========================================================================
    
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'CHARGE_TYPE', 'PENALTY', 'غرامة', 'Penalty', '{"affectsCredit": true}'::jsonb, 1),
    (v_tenant_id, 'CHARGE_TYPE', 'SERVICE_CHARGE', 'رسوم خدمة', 'Service Charge', '{"affectsCredit": false}'::jsonb, 2),
    (v_tenant_id, 'CHARGE_TYPE', 'INTEREST', 'فائدة', 'Interest', '{"affectsCredit": true}'::jsonb, 3),
    (v_tenant_id, 'CHARGE_TYPE', 'PRINCIPAL', 'أصل القرض', 'Principal', '{"affectsCredit": true}'::jsonb, 4)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    RAISE NOTICE '✅ Seeded CHARGE_TYPE reference data (4 records)';
    
    -- ==========================================================================
    -- Seed Reference Data: PARTY_TYPE
    -- ==========================================================================
    
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'PARTY_TYPE', 'INDIVIDUAL', 'فرد', 'Individual', '{"requiresNationalId": true}'::jsonb, 1),
    (v_tenant_id, 'PARTY_TYPE', 'CORPORATE', 'شركة', 'Corporate', '{"requiresCR": true}'::jsonb, 2),
    (v_tenant_id, 'PARTY_TYPE', 'SME', 'منشأة صغيرة ومتوسطة', 'Small & Medium Enterprise', '{"requiresCR": true}'::jsonb, 3)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    RAISE NOTICE '✅ Seeded PARTY_TYPE reference data (3 records)';
    
    -- ==========================================================================
    -- Seed Reference Data: CONTRACT_STATUS
    -- ==========================================================================
    
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'CONTRACT_STATUS', 'ACTIVE', 'نشط', 'Active', '{"allowCollection": true}'::jsonb, 1),
    (v_tenant_id, 'CONTRACT_STATUS', 'CLOSED', 'مغلق', 'Closed', '{"allowCollection": false}'::jsonb, 2),
    (v_tenant_id, 'CONTRACT_STATUS', 'DEFAULTED', 'متعثر', 'Defaulted', '{"allowCollection": true}'::jsonb, 3),
    (v_tenant_id, 'CONTRACT_STATUS', 'WRITTEN_OFF', 'شطب', 'Written Off', '{"allowCollection": true}'::jsonb, 4)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    RAISE NOTICE '✅ Seeded CONTRACT_STATUS reference data (4 records)';
    
    -- ==========================================================================
    -- Seed Reference Data: ID_TYPE
    -- ==========================================================================
    
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'ID_TYPE', 'NATIONAL_ID', 'الهوية الوطنية', 'National ID', '{"format": "^[0-9]{10}$"}'::jsonb, 1),
    (v_tenant_id, 'ID_TYPE', 'IQAMA', 'الإقامة', 'Iqama (Residency)', '{"format": "^[0-9]{10}$"}'::jsonb, 2),
    (v_tenant_id, 'ID_TYPE', 'PASSPORT', 'جواز السفر', 'Passport', '{}'::jsonb, 3),
    (v_tenant_id, 'ID_TYPE', 'CR_NUMBER', 'السجل التجاري', 'Commercial Registration', '{}'::jsonb, 4)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    RAISE NOTICE '✅ Seeded ID_TYPE reference data (4 records)';
    
    -- ==========================================================================
    -- Seed Reference Data: DQ_RULE (Data Quality Rules)
    -- ==========================================================================
    
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'DQ_RULE', 'MISSING_PRIMARY_ID', 'معرف رئيسي مفقود', 'Missing Primary Identifier', '{"severity": "critical", "entity": "PARTY"}'::jsonb, 1),
    (v_tenant_id, 'DQ_RULE', 'MISSING_NAME', 'الاسم مفقود', 'Missing Name', '{"severity": "critical", "entity": "PARTY"}'::jsonb, 2),
    (v_tenant_id, 'DQ_RULE', 'INVALID_PHONE', 'رقم هاتف غير صالح', 'Invalid Phone Format', '{"severity": "medium", "entity": "PARTY"}'::jsonb, 3),
    (v_tenant_id, 'DQ_RULE', 'INVALID_EMAIL', 'بريد إلكتروني غير صالح', 'Invalid Email Format', '{"severity": "medium", "entity": "PARTY"}'::jsonb, 4)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    RAISE NOTICE '✅ Seeded DQ_RULE reference data (4 records)';
    
    -- ==========================================================================
    -- Seed Default Mapping Templates
    -- ==========================================================================
    
    -- Party mapping template for LMS
    INSERT INTO integration.mapping_templates (
        tenant_id, source_system_id, dataset, name, description, is_default, mapping_json
    ) VALUES (
        v_tenant_id, v_lms_source_id, 'PARTY', 'LMS Party Default Mapping',
        'Default mapping template for party data from LMS', true,
        '{
            "externalRefField": "customer_id",
            "partyTypeField": "customer_type",
            "partyTypeMapping": {"I": "PERSON", "C": "ORGANIZATION", "INDIVIDUAL": "PERSON", "CORPORATE": "ORGANIZATION"},
            "nameFields": {"primary": "full_name", "primaryAr": "full_name_ar", "firstName": "first_name", "lastName": "last_name"},
            "identifierFields": [
                {"field": "national_id", "type": "NATIONAL_ID"},
                {"field": "iqama_number", "type": "IQAMA"},
                {"field": "passport_number", "type": "PASSPORT"}
            ],
            "contactFields": [
                {"field": "mobile", "type": "MOBILE", "isPrimary": true},
                {"field": "phone", "type": "PHONE"},
                {"field": "email", "type": "EMAIL"}
            ],
            "attributeFields": ["nationality", "date_of_birth", "gender", "employer"]
        }'::jsonb
    )
    ON CONFLICT (tenant_id, source_system_id, dataset, name, version) DO UPDATE 
    SET mapping_json = EXCLUDED.mapping_json;
    
    -- Contract mapping template for LMS
    INSERT INTO integration.mapping_templates (
        tenant_id, source_system_id, dataset, name, description, is_default, mapping_json
    ) VALUES (
        v_tenant_id, v_lms_source_id, 'CONTRACT', 'LMS Contract Default Mapping',
        'Default mapping template for contract data from LMS', true,
        '{
            "externalRefField": "loan_account_number",
            "partyRefField": "customer_id",
            "productCodeField": "product_code",
            "contractNumberField": "loan_account_number",
            "securedFlagField": "is_secured",
            "statusField": "status",
            "statusMapping": {"A": "active", "C": "closed", "D": "defaulted", "W": "written_off"},
            "dateFields": {"startDate": "disbursement_date", "endDate": "maturity_date"},
            "attributeFields": ["principal_amount", "outstanding_balance", "currency", "interest_rate"]
        }'::jsonb
    )
    ON CONFLICT (tenant_id, source_system_id, dataset, name, version) DO UPDATE 
    SET mapping_json = EXCLUDED.mapping_json;
    
    -- Manual entry mapping template
    INSERT INTO integration.mapping_templates (
        tenant_id, source_system_id, dataset, name, description, is_default, mapping_json
    ) VALUES (
        v_tenant_id, v_manual_source_id, 'PARTY', 'Manual Party Entry Mapping',
        'Mapping template for manual party data entry', true,
        '{
            "externalRefField": "external_ref",
            "partyTypeField": "party_type",
            "nameFields": {"primary": "name", "primaryAr": "name_ar"},
            "identifierFields": [{"field": "identifier_value", "typeField": "identifier_type"}],
            "contactFields": [{"field": "phone", "type": "PHONE"}, {"field": "email", "type": "EMAIL"}]
        }'::jsonb
    )
    ON CONFLICT (tenant_id, source_system_id, dataset, name, version) DO UPDATE 
    SET mapping_json = EXCLUDED.mapping_json;
    
    RAISE NOTICE '✅ Seeded mapping templates (3 records)';
    
    -- ==========================================================================
    -- SKIP tenant_config - it has FK issues with different tenant tables
    -- The API will handle default configs at runtime
    -- ==========================================================================
    
    RAISE NOTICE '⚠️ Skipping tenant_config seeding (FK constraint issues - configs will be set via API)';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ EPIC 5 Seed data completed successfully!';
    RAISE NOTICE '========================================';
    
END $$;

-- =============================================================================
-- VERIFICATION: Count seeded data
-- =============================================================================

SELECT 'Source Systems' as table_name, COUNT(*) as count FROM mdm.source_systems
UNION ALL
SELECT 'Reference Data' as table_name, COUNT(*) as count FROM mdm.reference_data
UNION ALL
SELECT 'Mapping Templates' as table_name, COUNT(*) as count FROM integration.mapping_templates;

-- Show reference data by domain
SELECT domain, COUNT(*) as count 
FROM mdm.reference_data 
GROUP BY domain 
ORDER BY domain;
