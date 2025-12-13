/**
 * Test Database Helpers
 * 
 * Utilities for setting up and tearing down test data
 */

import { getClient } from '../../db/pool.js';
import { createTenantClient } from '../../db/tenant-client.js';
import config from '../../config/index.js';

// Test tenant UUIDs
export const TEST_TENANT_A = '11111111-1111-1111-1111-111111111111';
export const TEST_TENANT_B = '22222222-2222-2222-2222-222222222222';

/**
 * Setup test schema with tenants and org_units tables
 * Creates tables with RLS policies
 */
export async function setupTestSchema() {
  const client = await getClient();
  
  try {
    // Set search path
    await client.query(`SET search_path TO ${config.database.schema}, public`);
    
    // Create tenants table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create org_units table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS org_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        type VARCHAR(50) DEFAULT 'department',
        parent_id UUID REFERENCES org_units(id) ON DELETE SET NULL,
        level INTEGER DEFAULT 0,
        path TEXT,
        status VARCHAR(50) DEFAULT 'active',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create index on tenant_id for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_org_units_tenant_id ON org_units(tenant_id)
    `);
    
    // Enable RLS on org_units
    await client.query(`
      ALTER TABLE org_units ENABLE ROW LEVEL SECURITY
    `);
    
    // Drop existing policy if exists and create new one
    await client.query(`
      DROP POLICY IF EXISTS tenant_isolation_policy ON org_units
    `);
    
    await client.query(`
      CREATE POLICY tenant_isolation_policy ON org_units
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid)
    `);
    
    console.log('[Test DB] Schema setup complete');
  } finally {
    client.release();
  }
}

/**
 * Insert test tenants
 */
export async function insertTestTenants() {
  const client = await getClient();
  
  try {
    await client.query(`SET search_path TO ${config.database.schema}, public`);
    
    // Insert tenant A
    await client.query(`
      INSERT INTO tenants (id, name, slug, status)
      VALUES ($1, 'Test Tenant A', 'tenant-a', 'active')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `, [TEST_TENANT_A]);
    
    // Insert tenant B
    await client.query(`
      INSERT INTO tenants (id, name, slug, status)
      VALUES ($1, 'Test Tenant B', 'tenant-b', 'active')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `, [TEST_TENANT_B]);
    
    console.log('[Test DB] Test tenants inserted');
  } finally {
    client.release();
  }
}

/**
 * Insert test org units for each tenant
 */
export async function insertTestOrgUnits() {
  const client = await getClient();
  
  try {
    await client.query(`SET search_path TO ${config.database.schema}, public`);
    
    // Clear existing test data
    await client.query(`
      DELETE FROM org_units WHERE tenant_id IN ($1, $2)
    `, [TEST_TENANT_A, TEST_TENANT_B]);
    
    // Insert org units for Tenant A
    await client.query(`
      INSERT INTO org_units (id, tenant_id, name, code, type, level, status)
      VALUES 
        ('aaaaaaaa-0001-0001-0001-000000000001', $1, 'Tenant A - HQ', 'A-HQ', 'headquarters', 0, 'active'),
        ('aaaaaaaa-0001-0001-0001-000000000002', $1, 'Tenant A - Branch 1', 'A-BR1', 'branch', 1, 'active'),
        ('aaaaaaaa-0001-0001-0001-000000000003', $1, 'Tenant A - Branch 2', 'A-BR2', 'branch', 1, 'active')
    `, [TEST_TENANT_A]);
    
    // Update parent_id for branches
    await client.query(`
      UPDATE org_units 
      SET parent_id = 'aaaaaaaa-0001-0001-0001-000000000001'
      WHERE id IN ('aaaaaaaa-0001-0001-0001-000000000002', 'aaaaaaaa-0001-0001-0001-000000000003')
    `);
    
    // Insert org units for Tenant B
    await client.query(`
      INSERT INTO org_units (id, tenant_id, name, code, type, level, status)
      VALUES 
        ('bbbbbbbb-0002-0002-0002-000000000001', $1, 'Tenant B - Main Office', 'B-MAIN', 'headquarters', 0, 'active'),
        ('bbbbbbbb-0002-0002-0002-000000000002', $1, 'Tenant B - Regional', 'B-REG', 'region', 1, 'active')
    `, [TEST_TENANT_B]);
    
    // Update parent_id for Tenant B
    await client.query(`
      UPDATE org_units 
      SET parent_id = 'bbbbbbbb-0002-0002-0002-000000000001'
      WHERE id = 'bbbbbbbb-0002-0002-0002-000000000002'
    `);
    
    console.log('[Test DB] Test org units inserted');
  } finally {
    client.release();
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  const client = await getClient();
  
  try {
    await client.query(`SET search_path TO ${config.database.schema}, public`);
    
    // Delete test org units
    await client.query(`
      DELETE FROM org_units WHERE tenant_id IN ($1, $2)
    `, [TEST_TENANT_A, TEST_TENANT_B]);
    
    // Delete test tenants
    await client.query(`
      DELETE FROM tenants WHERE id IN ($1, $2)
    `, [TEST_TENANT_A, TEST_TENANT_B]);
    
    console.log('[Test DB] Test data cleaned up');
  } finally {
    client.release();
  }
}

/**
 * Query org units using a specific tenant context
 */
export async function queryOrgUnitsAsTenant(tenantId) {
  const client = await createTenantClient(tenantId);
  
  try {
    const result = await client.query(`
      SELECT id, tenant_id, name, code, type 
      FROM org_units 
      ORDER BY name
    `);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Full test setup - creates schema, tenants, and org units
 */
export async function fullTestSetup() {
  await setupTestSchema();
  await insertTestTenants();
  await insertTestOrgUnits();
}

export default {
  TEST_TENANT_A,
  TEST_TENANT_B,
  setupTestSchema,
  insertTestTenants,
  insertTestOrgUnits,
  cleanupTestData,
  queryOrgUnitsAsTenant,
  fullTestSetup,
};
