/**
 * RLS Integration Tests
 * 
 * Tests that verify Row Level Security (RLS) properly isolates
 * tenant data when using the tenant-aware database client.
 * 
 * Run with: node --test src/tests/rls.integration.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import {
  TEST_TENANT_A,
  TEST_TENANT_B,
  fullTestSetup,
  cleanupTestData,
  queryOrgUnitsAsTenant,
} from './helpers/test-db.js';
import { createTenantClient } from '../db/tenant-client.js';
import { shutdown } from '../db/pool.js';

describe('RLS Tenant Isolation', () => {
  before(async () => {
    console.log('\n=== Setting up test data ===\n');
    try {
      await fullTestSetup();
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });
  
  after(async () => {
    console.log('\n=== Cleaning up test data ===\n');
    try {
      await cleanupTestData();
      await shutdown();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });
  
  describe('Org Units Table', () => {
    it('should only return Tenant A org units when querying with Tenant A context', async () => {
      const orgUnits = await queryOrgUnitsAsTenant(TEST_TENANT_A);
      
      console.log(`Tenant A query returned ${orgUnits.length} org units`);
      
      // Should have exactly 3 org units for Tenant A
      assert.strictEqual(orgUnits.length, 3, 'Should return exactly 3 org units for Tenant A');
      
      // All returned org units should belong to Tenant A
      for (const unit of orgUnits) {
        assert.strictEqual(
          unit.tenant_id, 
          TEST_TENANT_A, 
          `Org unit ${unit.name} should belong to Tenant A`
        );
      }
      
      // Verify specific org unit names
      const names = orgUnits.map(u => u.name);
      assert.ok(names.includes('Tenant A - HQ'), 'Should include HQ');
      assert.ok(names.includes('Tenant A - Branch 1'), 'Should include Branch 1');
      assert.ok(names.includes('Tenant A - Branch 2'), 'Should include Branch 2');
      
      // Should NOT include any Tenant B org units
      assert.ok(!names.includes('Tenant B - Main Office'), 'Should NOT include Tenant B data');
    });
    
    it('should only return Tenant B org units when querying with Tenant B context', async () => {
      const orgUnits = await queryOrgUnitsAsTenant(TEST_TENANT_B);
      
      console.log(`Tenant B query returned ${orgUnits.length} org units`);
      
      // Should have exactly 2 org units for Tenant B
      assert.strictEqual(orgUnits.length, 2, 'Should return exactly 2 org units for Tenant B');
      
      // All returned org units should belong to Tenant B
      for (const unit of orgUnits) {
        assert.strictEqual(
          unit.tenant_id, 
          TEST_TENANT_B, 
          `Org unit ${unit.name} should belong to Tenant B`
        );
      }
      
      // Verify specific org unit names
      const names = orgUnits.map(u => u.name);
      assert.ok(names.includes('Tenant B - Main Office'), 'Should include Main Office');
      assert.ok(names.includes('Tenant B - Regional'), 'Should include Regional');
      
      // Should NOT include any Tenant A org units
      assert.ok(!names.includes('Tenant A - HQ'), 'Should NOT include Tenant A data');
    });
    
    it('should return empty results for non-existent tenant', async () => {
      const nonExistentTenantId = '99999999-9999-9999-9999-999999999999';
      const orgUnits = await queryOrgUnitsAsTenant(nonExistentTenantId);
      
      assert.strictEqual(orgUnits.length, 0, 'Should return no org units for non-existent tenant');
    });
  });
  
  describe('Tenant Client set_config', () => {
    it('should correctly set app.current_tenant config', async () => {
      const client = await createTenantClient(TEST_TENANT_A);
      
      try {
        // Verify the tenant context was set correctly
        const result = await client.query(`
          SELECT current_setting('app.current_tenant', true) as tenant_id
        `);
        
        assert.strictEqual(
          result.rows[0].tenant_id, 
          TEST_TENANT_A, 
          'app.current_tenant should be set to Tenant A UUID'
        );
      } finally {
        client.release();
      }
    });
    
    it('should isolate tenant context between different clients', async () => {
      // Create two clients with different tenant contexts
      const clientA = await createTenantClient(TEST_TENANT_A);
      const clientB = await createTenantClient(TEST_TENANT_B);
      
      try {
        // Query tenant context from both clients
        const [resultA, resultB] = await Promise.all([
          clientA.query(`SELECT current_setting('app.current_tenant', true) as tenant_id`),
          clientB.query(`SELECT current_setting('app.current_tenant', true) as tenant_id`),
        ]);
        
        // Each client should have its own tenant context
        assert.strictEqual(
          resultA.rows[0].tenant_id, 
          TEST_TENANT_A, 
          'Client A should have Tenant A context'
        );
        
        assert.strictEqual(
          resultB.rows[0].tenant_id, 
          TEST_TENANT_B, 
          'Client B should have Tenant B context'
        );
        
        // Cross-query: Client A querying org_units should only see Tenant A data
        const orgUnitsA = await clientA.query('SELECT * FROM org_units');
        assert.strictEqual(orgUnitsA.rows.length, 3, 'Client A should see 3 org units');
        
        // Cross-query: Client B querying org_units should only see Tenant B data
        const orgUnitsB = await clientB.query('SELECT * FROM org_units');
        assert.strictEqual(orgUnitsB.rows.length, 2, 'Client B should see 2 org units');
        
      } finally {
        clientA.release();
        clientB.release();
      }
    });
  });
  
  describe('Cross-Tenant Access Prevention', () => {
    it('should prevent Tenant A from inserting data with Tenant B tenant_id', async () => {
      const client = await createTenantClient(TEST_TENANT_A);
      
      try {
        // Try to insert an org unit with Tenant B's tenant_id
        // This should fail due to RLS WITH CHECK policy
        await assert.rejects(
          async () => {
            await client.query(`
              INSERT INTO org_units (tenant_id, name, code, type)
              VALUES ($1, 'Malicious Insert', 'HACK', 'department')
            `, [TEST_TENANT_B]);
          },
          {
            // PostgreSQL returns error when RLS WITH CHECK fails
            message: /new row violates row-level security policy/
          },
          'Should reject insert with different tenant_id'
        );
      } catch (error) {
        // If the error is about RLS policy, test passes
        if (error.message && error.message.includes('row-level security')) {
          console.log('✓ RLS correctly prevented cross-tenant insert');
        } else {
          throw error;
        }
      } finally {
        client.release();
      }
    });
    
    it('should prevent Tenant A from updating Tenant B data', async () => {
      const clientA = await createTenantClient(TEST_TENANT_A);
      
      try {
        // Try to update Tenant B's org unit
        const result = await clientA.query(`
          UPDATE org_units 
          SET name = 'Hacked Name'
          WHERE id = 'bbbbbbbb-0002-0002-0002-000000000001'
        `);
        
        // No rows should be affected because RLS filters out Tenant B data
        assert.strictEqual(
          result.rowCount, 
          0, 
          'Should not be able to update Tenant B org units from Tenant A context'
        );
      } finally {
        clientA.release();
      }
    });
    
    it('should prevent Tenant A from deleting Tenant B data', async () => {
      const clientA = await createTenantClient(TEST_TENANT_A);
      
      try {
        // Try to delete Tenant B's org unit
        const result = await clientA.query(`
          DELETE FROM org_units 
          WHERE id = 'bbbbbbbb-0002-0002-0002-000000000001'
        `);
        
        // No rows should be affected because RLS filters out Tenant B data
        assert.strictEqual(
          result.rowCount, 
          0, 
          'Should not be able to delete Tenant B org units from Tenant A context'
        );
        
        // Verify Tenant B's data still exists
        const clientB = await createTenantClient(TEST_TENANT_B);
        try {
          const check = await clientB.query(`
            SELECT * FROM org_units WHERE id = 'bbbbbbbb-0002-0002-0002-000000000001'
          `);
          assert.strictEqual(check.rows.length, 1, 'Tenant B org unit should still exist');
        } finally {
          clientB.release();
        }
      } finally {
        clientA.release();
      }
    });
  });
});

// Run tests if executed directly
if (process.argv[1].endsWith('rls.integration.test.js')) {
  console.log('Running RLS Integration Tests...\n');
}
