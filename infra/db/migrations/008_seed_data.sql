-- =============================================================================
-- Migration 008: Seed Data
-- Description: Initial seed data for development/testing
-- EPIC 1 - Database Layer for CMS
-- =============================================================================

-- =============================================================================
-- IMPORTANT: This script creates initial data for development/testing.
-- In production, you may want to run this selectively or modify the data.
-- =============================================================================

-- Start transaction
BEGIN;

-- =============================================================================
-- 1. Create Tenant
-- =============================================================================
INSERT INTO platform.tenants (id, name, status, default_language, timezone)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo Organization',
    'active',
    'en',
    'UTC'
);

-- Store tenant_id in a variable for use in subsequent inserts
-- Note: We'll reference the ID directly since PostgreSQL doesn't have session variables

-- =============================================================================
-- 2. Create Global Permissions (no tenant_id)
-- =============================================================================
INSERT INTO platform.permissions (id, code, description, category) VALUES
    -- User Management
    ('aaaaaaaa-0001-0001-0001-000000000001', 'users.view', 'View user list and details', 'users'),
    ('aaaaaaaa-0001-0001-0001-000000000002', 'users.create', 'Create new users', 'users'),
    ('aaaaaaaa-0001-0001-0001-000000000003', 'users.update', 'Update user information', 'users'),
    ('aaaaaaaa-0001-0001-0001-000000000004', 'users.delete', 'Delete users', 'users'),
    
    -- Role Management
    ('aaaaaaaa-0001-0001-0001-000000000005', 'roles.view', 'View roles and assignments', 'roles'),
    ('aaaaaaaa-0001-0001-0001-000000000006', 'roles.create', 'Create new roles', 'roles'),
    ('aaaaaaaa-0001-0001-0001-000000000007', 'roles.update', 'Update role definitions', 'roles'),
    ('aaaaaaaa-0001-0001-0001-000000000008', 'roles.delete', 'Delete roles', 'roles'),
    ('aaaaaaaa-0001-0001-0001-000000000009', 'roles.assign', 'Assign roles to users', 'roles'),
    
    -- Organization Management
    ('aaaaaaaa-0001-0001-0001-000000000010', 'org_units.view', 'View organizational units', 'org_units'),
    ('aaaaaaaa-0001-0001-0001-000000000011', 'org_units.create', 'Create organizational units', 'org_units'),
    ('aaaaaaaa-0001-0001-0001-000000000012', 'org_units.update', 'Update organizational units', 'org_units'),
    ('aaaaaaaa-0001-0001-0001-000000000013', 'org_units.delete', 'Delete organizational units', 'org_units'),
    
    -- Reports
    ('aaaaaaaa-0001-0001-0001-000000000014', 'reports.view', 'View reports', 'reports'),
    ('aaaaaaaa-0001-0001-0001-000000000015', 'reports.export', 'Export reports', 'reports'),
    
    -- Settings
    ('aaaaaaaa-0001-0001-0001-000000000016', 'settings.view', 'View system settings', 'settings'),
    ('aaaaaaaa-0001-0001-0001-000000000017', 'settings.update', 'Update system settings', 'settings'),
    
    -- Dashboard
    ('aaaaaaaa-0001-0001-0001-000000000018', 'dashboard.view', 'View dashboard', 'dashboard'),
    ('aaaaaaaa-0001-0001-0001-000000000019', 'dashboard.customize', 'Customize dashboard widgets', 'dashboard'),
    
    -- Cases/Tasks (placeholder for future modules)
    ('aaaaaaaa-0001-0001-0001-000000000020', 'cases.view', 'View cases', 'cases'),
    ('aaaaaaaa-0001-0001-0001-000000000021', 'cases.create', 'Create cases', 'cases'),
    ('aaaaaaaa-0001-0001-0001-000000000022', 'cases.update', 'Update cases', 'cases'),
    ('aaaaaaaa-0001-0001-0001-000000000023', 'cases.delete', 'Delete cases', 'cases'),
    ('aaaaaaaa-0001-0001-0001-000000000024', 'cases.assign', 'Assign cases', 'cases');

-- =============================================================================
-- 3. Create Organizational Hierarchy: HO -> CENTER -> BRANCH -> TEAM
-- =============================================================================

-- Head Office (root - no parent)
INSERT INTO platform.org_units (id, tenant_id, parent_id, type, name, code, path)
VALUES (
    'bbbbbbbb-0001-0001-0001-000000000001',
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'HO',
    'Head Office',
    'HO-001',
    'HO-001'
);

-- Center (child of HO)
INSERT INTO platform.org_units (id, tenant_id, parent_id, type, name, code, path)
VALUES (
    'bbbbbbbb-0001-0001-0001-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-0001-0001-0001-000000000001',
    'CENTER',
    'Central Region',
    'CENTER-001',
    'HO-001/CENTER-001'
);

-- Branch (child of CENTER)
INSERT INTO platform.org_units (id, tenant_id, parent_id, type, name, code, path)
VALUES (
    'bbbbbbbb-0001-0001-0001-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-0001-0001-0001-000000000002',
    'BRANCH',
    'Downtown Branch',
    'BRANCH-001',
    'HO-001/CENTER-001/BRANCH-001'
);

-- Team (child of BRANCH)
INSERT INTO platform.org_units (id, tenant_id, parent_id, type, name, code, path)
VALUES (
    'bbbbbbbb-0001-0001-0001-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-0001-0001-0001-000000000003',
    'TEAM',
    'Collection Team Alpha',
    'TEAM-001',
    'HO-001/CENTER-001/BRANCH-001/TEAM-001'
);

-- =============================================================================
-- 4. Create Roles: ADMIN, SUPERVISOR, AGENT
-- =============================================================================
INSERT INTO platform.roles (id, tenant_id, name, description)
VALUES 
    (
        'cccccccc-0001-0001-0001-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'ADMIN',
        'System administrator with full access'
    ),
    (
        'cccccccc-0001-0001-0001-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'SUPERVISOR',
        'Team supervisor with management capabilities'
    ),
    (
        'cccccccc-0001-0001-0001-000000000003',
        '11111111-1111-1111-1111-111111111111',
        'AGENT',
        'Regular agent with operational access'
    );

-- =============================================================================
-- 5. Create Admin User
-- =============================================================================
INSERT INTO platform.users (id, tenant_id, email, display_name, status)
VALUES (
    'dddddddd-0001-0001-0001-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'admin@demo.org',
    'System Administrator',
    'active'
);

-- =============================================================================
-- 6. Assign Permissions to Roles
-- =============================================================================

-- ADMIN role gets ALL permissions
INSERT INTO platform.role_permissions (tenant_id, role_id, permission_id)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-0001-0001-0001-000000000001',
    id
FROM platform.permissions;

-- SUPERVISOR role gets view + limited management permissions
INSERT INTO platform.role_permissions (tenant_id, role_id, permission_id)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-0001-0001-0001-000000000002',
    id
FROM platform.permissions
WHERE code IN (
    'users.view',
    'users.update',
    'roles.view',
    'roles.assign',
    'org_units.view',
    'reports.view',
    'reports.export',
    'dashboard.view',
    'dashboard.customize',
    'cases.view',
    'cases.create',
    'cases.update',
    'cases.assign'
);

-- AGENT role gets basic operational permissions
INSERT INTO platform.role_permissions (tenant_id, role_id, permission_id)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-0001-0001-0001-000000000003',
    id
FROM platform.permissions
WHERE code IN (
    'users.view',
    'org_units.view',
    'reports.view',
    'dashboard.view',
    'cases.view',
    'cases.create',
    'cases.update'
);

-- =============================================================================
-- 7. Assign ADMIN role to admin user (global scope - no org_unit restriction)
-- =============================================================================
INSERT INTO platform.user_roles (tenant_id, user_id, role_id, scope_org_unit_id)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-0001-0001-0001-000000000001',
    'cccccccc-0001-0001-0001-000000000001',
    NULL  -- NULL scope means global access within tenant
);

-- Commit transaction
COMMIT;

-- =============================================================================
-- Verification Queries (optional - for testing)
-- =============================================================================
-- Run these after migration to verify data:
/*
-- Check tenant
SELECT * FROM platform.tenants;

-- Check org hierarchy
SELECT id, type, name, code, path, parent_id 
FROM platform.org_units 
ORDER BY path;

-- Check roles
SELECT * FROM platform.roles;

-- Check permissions
SELECT * FROM platform.permissions ORDER BY category, code;

-- Check role permissions count
SELECT r.name, COUNT(rp.permission_id) as permission_count
FROM platform.roles r
LEFT JOIN platform.role_permissions rp ON r.id = rp.role_id
GROUP BY r.name;

-- Check user roles
SELECT u.email, r.name as role_name, ou.name as scope
FROM platform.user_roles ur
JOIN platform.users u ON ur.user_id = u.id
JOIN platform.roles r ON ur.role_id = r.id
LEFT JOIN platform.org_units ou ON ur.scope_org_unit_id = ou.id;
*/
