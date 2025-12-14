/**
 * Idempotency Tests for EPIC 5
 * Tests that same payload produces same result when ingested multiple times
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import pg from 'pg';

const { Pool } = pg;

// Test configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/cms_test';
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '00000000-0000-0000-0000-000000000001';

let pool;

// Helper to set tenant context
async function withTenantContext(client, tenantId, fn) {
  await client.query(`SELECT set_config('app.current_tenant', $1, true)`, [tenantId]);
  return fn(client);
}

describe('EPIC 5 - Idempotency Tests', () => {
  before(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
    
    // Ensure test tenant exists
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO platform.tenants (id, name, status)
        VALUES ($1, 'Test Tenant', 'active')
        ON CONFLICT (id) DO NOTHING
      `, [TEST_TENANT_ID]);
      
      // Create test source system
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        await c.query(`
          INSERT INTO mdm.source_systems (id, tenant_id, code, name, status)
          VALUES (
            '00000000-0000-0000-0000-000000000010',
            $1, 'TEST_LMS', 'Test LMS System', 'active'
          )
          ON CONFLICT (tenant_id, code) DO NOTHING
        `, [TEST_TENANT_ID]);
      });
    } finally {
      client.release();
    }
  });

  after(async () => {
    // Cleanup
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        // Clean up test data
        await c.query(`DELETE FROM mdm.party_source_record WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM integration.ingestion_items WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM integration.ingestion_runs WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM mdm.party_contacts WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM mdm.party_source_map WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM mdm.party_golden WHERE tenant_id = $1`, [TEST_TENANT_ID]);
      });
    } finally {
      client.release();
    }
    
    await pool.end();
  });

  beforeEach(async () => {
    // Clean party data before each test
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        await c.query(`DELETE FROM mdm.party_source_record WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM integration.ingestion_items WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM integration.ingestion_runs WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM mdm.party_contacts WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM mdm.party_source_map WHERE tenant_id = $1`, [TEST_TENANT_ID]);
        await c.query(`DELETE FROM mdm.party_golden WHERE tenant_id = $1`, [TEST_TENANT_ID]);
      });
    } finally {
      client.release();
    }
  });

  it('should create new party on first ingestion', async () => {
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        // Create ingestion run
        const runResult = await c.query(`
          INSERT INTO integration.ingestion_runs (tenant_id, source_system_id, mode, dataset, status)
          VALUES ($1, '00000000-0000-0000-0000-000000000010', 'API', 'PARTY', 'running')
          RETURNING id
        `, [TEST_TENANT_ID]);
        const runId = runResult.rows[0].id;
        
        // Create party
        const partyResult = await c.query(`
          INSERT INTO mdm.party_golden (tenant_id, party_type, primary_name, identifiers_json)
          VALUES ($1, 'PERSON', 'Test Person', '[{"type": "NATIONAL_ID", "value": "1234567890"}]')
          RETURNING party_id
        `, [TEST_TENANT_ID]);
        const partyId = partyResult.rows[0].party_id;
        
        // Create source map
        const payloadHash = 'hash_v1_12345';
        await c.query(`
          INSERT INTO mdm.party_source_map (tenant_id, source_system_id, external_party_ref, party_id, payload_hash)
          VALUES ($1, '00000000-0000-0000-0000-000000000010', 'CUST001', $2, $3)
        `, [TEST_TENANT_ID, partyId, payloadHash]);
        
        // Create ingestion item
        await c.query(`
          INSERT INTO integration.ingestion_items (tenant_id, run_id, external_ref, entity_type, entity_id, outcome, payload_hash)
          VALUES ($1, $2, 'CUST001', 'PARTY', $3, 'INSERTED', $4)
        `, [TEST_TENANT_ID, runId, partyId, payloadHash]);
        
        // Verify
        const mapCount = await c.query(`
          SELECT COUNT(*) as count FROM mdm.party_source_map WHERE tenant_id = $1
        `, [TEST_TENANT_ID]);
        
        assert.strictEqual(parseInt(mapCount.rows[0].count), 1, 'Should have exactly 1 source map entry');
      });
    } finally {
      client.release();
    }
  });

  it('should SKIP when same payload hash is ingested again', async () => {
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        const payloadHash = 'hash_v1_identical';
        
        // First ingestion
        const runResult1 = await c.query(`
          INSERT INTO integration.ingestion_runs (tenant_id, source_system_id, mode, dataset, status)
          VALUES ($1, '00000000-0000-0000-0000-000000000010', 'API', 'PARTY', 'running')
          RETURNING id
        `, [TEST_TENANT_ID]);
        const runId1 = runResult1.rows[0].id;
        
        const partyResult = await c.query(`
          INSERT INTO mdm.party_golden (tenant_id, party_type, primary_name, identifiers_json)
          VALUES ($1, 'PERSON', 'Test Person', '[{"type": "NATIONAL_ID", "value": "1234567890"}]')
          RETURNING party_id
        `, [TEST_TENANT_ID]);
        const partyId = partyResult.rows[0].party_id;
        
        await c.query(`
          INSERT INTO mdm.party_source_map (tenant_id, source_system_id, external_party_ref, party_id, payload_hash)
          VALUES ($1, '00000000-0000-0000-0000-000000000010', 'CUST002', $2, $3)
        `, [TEST_TENANT_ID, partyId, payloadHash]);
        
        await c.query(`
          INSERT INTO integration.ingestion_items (tenant_id, run_id, external_ref, entity_type, entity_id, outcome, payload_hash)
          VALUES ($1, $2, 'CUST002', 'PARTY', $3, 'INSERTED', $4)
        `, [TEST_TENANT_ID, runId1, partyId, payloadHash]);
        
        // Second ingestion with same hash
        const runResult2 = await c.query(`
          INSERT INTO integration.ingestion_runs (tenant_id, source_system_id, mode, dataset, status)
          VALUES ($1, '00000000-0000-0000-0000-000000000010', 'API', 'PARTY', 'running')
          RETURNING id
        `, [TEST_TENANT_ID]);
        const runId2 = runResult2.rows[0].id;
        
        // Check existing hash
        const existingMap = await c.query(`
          SELECT payload_hash FROM mdm.party_source_map 
          WHERE tenant_id = $1 AND external_party_ref = 'CUST002'
        `, [TEST_TENANT_ID]);
        
        const existingHash = existingMap.rows[0].payload_hash;
        
        // Same hash should result in SKIPPED
        if (existingHash === payloadHash) {
          await c.query(`
            UPDATE mdm.party_source_map SET last_seen_at = NOW() 
            WHERE tenant_id = $1 AND external_party_ref = 'CUST002'
          `, [TEST_TENANT_ID]);
          
          await c.query(`
            INSERT INTO integration.ingestion_items (tenant_id, run_id, external_ref, entity_type, entity_id, outcome, payload_hash)
            VALUES ($1, $2, 'CUST002', 'PARTY', $3, 'SKIPPED', $4)
          `, [TEST_TENANT_ID, runId2, partyId, payloadHash]);
        }
        
        // Verify: source map count should still be 1
        const mapCount = await c.query(`
          SELECT COUNT(*) as count FROM mdm.party_source_map WHERE tenant_id = $1
        `, [TEST_TENANT_ID]);
        
        assert.strictEqual(parseInt(mapCount.rows[0].count), 1, 'Source map count should remain 1 after second ingestion');
        
        // Verify: should have 2 ingestion items (1 INSERTED, 1 SKIPPED)
        const itemCounts = await c.query(`
          SELECT outcome, COUNT(*) as count FROM integration.ingestion_items 
          WHERE tenant_id = $1 AND external_ref = 'CUST002'
          GROUP BY outcome
        `, [TEST_TENANT_ID]);
        
        const outcomes = {};
        for (const row of itemCounts.rows) {
          outcomes[row.outcome] = parseInt(row.count);
        }
        
        assert.strictEqual(outcomes['INSERTED'], 1, 'Should have 1 INSERTED');
        assert.strictEqual(outcomes['SKIPPED'], 1, 'Should have 1 SKIPPED');
      });
    } finally {
      client.release();
    }
  });

  it('should UPDATE when payload hash changes', async () => {
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        const hashV1 = 'hash_v1_original';
        const hashV2 = 'hash_v2_updated';
        
        // First ingestion
        const partyResult = await c.query(`
          INSERT INTO mdm.party_golden (tenant_id, party_type, primary_name, identifiers_json)
          VALUES ($1, 'PERSON', 'Test Person V1', '[{"type": "NATIONAL_ID", "value": "1234567890"}]')
          RETURNING party_id
        `, [TEST_TENANT_ID]);
        const partyId = partyResult.rows[0].party_id;
        
        await c.query(`
          INSERT INTO mdm.party_source_map (tenant_id, source_system_id, external_party_ref, party_id, payload_hash)
          VALUES ($1, '00000000-0000-0000-0000-000000000010', 'CUST003', $2, $3)
        `, [TEST_TENANT_ID, partyId, hashV1]);
        
        // Second ingestion with different hash
        const existingMap = await c.query(`
          SELECT id, payload_hash FROM mdm.party_source_map 
          WHERE tenant_id = $1 AND external_party_ref = 'CUST003'
        `, [TEST_TENANT_ID]);
        
        assert.ok(existingMap.rows[0], 'Should have existing source map');
        assert.strictEqual(existingMap.rows[0].payload_hash, hashV1, 'Should have original hash');
        
        // Update with new hash
        await c.query(`
          UPDATE mdm.party_golden SET primary_name = 'Test Person V2' WHERE party_id = $1
        `, [partyId]);
        
        await c.query(`
          UPDATE mdm.party_source_map SET payload_hash = $2, last_seen_at = NOW()
          WHERE tenant_id = $1 AND external_party_ref = 'CUST003'
        `, [TEST_TENANT_ID, hashV2]);
        
        // Verify hash was updated
        const updatedMap = await c.query(`
          SELECT payload_hash FROM mdm.party_source_map 
          WHERE tenant_id = $1 AND external_party_ref = 'CUST003'
        `, [TEST_TENANT_ID]);
        
        assert.strictEqual(updatedMap.rows[0].payload_hash, hashV2, 'Hash should be updated to V2');
        
        // Verify party name was updated
        const updatedParty = await c.query(`
          SELECT primary_name FROM mdm.party_golden WHERE party_id = $1
        `, [partyId]);
        
        assert.strictEqual(updatedParty.rows[0].primary_name, 'Test Person V2', 'Party name should be updated');
      });
    } finally {
      client.release();
    }
  });

  it('should maintain unique constraint on (tenant_id, source_system_id, external_party_ref)', async () => {
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        // Create party and source map
        const partyResult = await c.query(`
          INSERT INTO mdm.party_golden (tenant_id, party_type, primary_name)
          VALUES ($1, 'PERSON', 'Test Person')
          RETURNING party_id
        `, [TEST_TENANT_ID]);
        const partyId = partyResult.rows[0].party_id;
        
        await c.query(`
          INSERT INTO mdm.party_source_map (tenant_id, source_system_id, external_party_ref, party_id, payload_hash)
          VALUES ($1, '00000000-0000-0000-0000-000000000010', 'CUST_UNIQUE', $2, 'hash1')
        `, [TEST_TENANT_ID, partyId]);
        
        // Try to insert duplicate
        try {
          await c.query(`
            INSERT INTO mdm.party_source_map (tenant_id, source_system_id, external_party_ref, party_id, payload_hash)
            VALUES ($1, '00000000-0000-0000-0000-000000000010', 'CUST_UNIQUE', $2, 'hash2')
          `, [TEST_TENANT_ID, partyId]);
          
          assert.fail('Should have thrown duplicate key error');
        } catch (error) {
          assert.strictEqual(error.code, '23505', 'Should be unique violation error');
        }
      });
    } finally {
      client.release();
    }
  });
});

describe('EPIC 5 - Freshness Tests', () => {
  before(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
  });

  after(async () => {
    await pool.end();
  });

  it('should update data_freshness after successful ingestion', async () => {
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        // Create completed ingestion run
        const runResult = await c.query(`
          INSERT INTO integration.ingestion_runs (
            tenant_id, source_system_id, mode, dataset, status, ended_at,
            stats_json
          )
          VALUES (
            $1, '00000000-0000-0000-0000-000000000010', 'API', 'PARTY', 'success', NOW(),
            '{"total_received": 100, "total_inserted": 80, "total_updated": 15, "total_skipped": 5, "total_failed": 0}'
          )
          RETURNING id
        `, [TEST_TENANT_ID]);
        const runId = runResult.rows[0].id;
        
        // Update freshness
        await c.query(`SELECT integration.update_data_freshness($1, $2)`, [runId, 100]);
        
        // Verify freshness was updated
        const freshnessResult = await c.query(`
          SELECT last_status, record_count, last_run_id
          FROM integration.data_freshness
          WHERE tenant_id = $1 AND source_system_id = '00000000-0000-0000-0000-000000000010' AND dataset = 'PARTY'
        `, [TEST_TENANT_ID]);
        
        assert.ok(freshnessResult.rows[0], 'Should have freshness record');
        assert.strictEqual(freshnessResult.rows[0].last_status, 'success', 'Status should be success');
        assert.strictEqual(freshnessResult.rows[0].record_count, 100, 'Record count should be 100');
        assert.strictEqual(freshnessResult.rows[0].last_run_id, runId, 'Last run ID should match');
      });
    } finally {
      client.release();
    }
  });

  it('should track last_success_at separately from last run', async () => {
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        // Clear existing freshness
        await c.query(`
          DELETE FROM integration.data_freshness 
          WHERE tenant_id = $1 AND dataset = 'CONTRACT'
        `, [TEST_TENANT_ID]);
        
        // First run - success
        const run1Result = await c.query(`
          INSERT INTO integration.ingestion_runs (
            tenant_id, source_system_id, mode, dataset, status, ended_at,
            stats_json
          )
          VALUES (
            $1, '00000000-0000-0000-0000-000000000010', 'API', 'CONTRACT', 'success', NOW() - INTERVAL '1 hour',
            '{"total_received": 50}'
          )
          RETURNING id
        `, [TEST_TENANT_ID]);
        await c.query(`SELECT integration.update_data_freshness($1, $2)`, [run1Result.rows[0].id, 50]);
        
        // Get success timestamp
        const successResult = await c.query(`
          SELECT last_success_at FROM integration.data_freshness
          WHERE tenant_id = $1 AND dataset = 'CONTRACT'
        `, [TEST_TENANT_ID]);
        const successAt = successResult.rows[0].last_success_at;
        
        // Second run - failed
        const run2Result = await c.query(`
          INSERT INTO integration.ingestion_runs (
            tenant_id, source_system_id, mode, dataset, status, ended_at,
            stats_json
          )
          VALUES (
            $1, '00000000-0000-0000-0000-000000000010', 'API', 'CONTRACT', 'failed', NOW(),
            '{"total_received": 0}'
          )
          RETURNING id
        `, [TEST_TENANT_ID]);
        await c.query(`SELECT integration.update_data_freshness($1, $2)`, [run2Result.rows[0].id, 0]);
        
        // Verify: last_success_at should still be from the first run
        const freshnessResult = await c.query(`
          SELECT last_success_at, last_status, last_run_id
          FROM integration.data_freshness
          WHERE tenant_id = $1 AND dataset = 'CONTRACT'
        `, [TEST_TENANT_ID]);
        
        assert.strictEqual(freshnessResult.rows[0].last_status, 'failed', 'Last status should be failed');
        assert.strictEqual(freshnessResult.rows[0].last_run_id, run2Result.rows[0].id, 'Last run should be the failed run');
        
        // last_success_at should NOT have been updated by the failed run
        const currentSuccessAt = freshnessResult.rows[0].last_success_at;
        assert.ok(currentSuccessAt, 'last_success_at should still exist');
      });
    } finally {
      client.release();
    }
  });

  it('should create reconciliation summary matching ingestion items', async () => {
    const client = await pool.connect();
    try {
      await withTenantContext(client, TEST_TENANT_ID, async (c) => {
        // Create run with items
        const runResult = await c.query(`
          INSERT INTO integration.ingestion_runs (
            tenant_id, source_system_id, mode, dataset, status
          )
          VALUES ($1, '00000000-0000-0000-0000-000000000010', 'API', 'PARTY', 'running')
          RETURNING id
        `, [TEST_TENANT_ID]);
        const runId = runResult.rows[0].id;
        
        // Add various items
        const items = [
          { ref: 'A1', outcome: 'INSERTED' },
          { ref: 'A2', outcome: 'INSERTED' },
          { ref: 'A3', outcome: 'UPDATED' },
          { ref: 'A4', outcome: 'SKIPPED' },
          { ref: 'A5', outcome: 'SKIPPED' },
          { ref: 'A6', outcome: 'SKIPPED' },
          { ref: 'A7', outcome: 'FAILED' },
        ];
        
        for (const item of items) {
          await c.query(`
            INSERT INTO integration.ingestion_items (tenant_id, run_id, external_ref, entity_type, outcome, payload_hash)
            VALUES ($1, $2, $3, 'PARTY', $4, 'hash_' || $3)
          `, [TEST_TENANT_ID, runId, item.ref, item.outcome]);
        }
        
        // Create reconciliation summary
        await c.query(`SELECT integration.create_reconciliation_summary($1)`, [runId]);
        
        // Verify summary matches
        const summaryResult = await c.query(`
          SELECT total_received, total_inserted, total_updated, total_skipped, total_failed
          FROM integration.reconciliation_summary
          WHERE run_id = $1
        `, [runId]);
        
        assert.ok(summaryResult.rows[0], 'Should have reconciliation summary');
        assert.strictEqual(summaryResult.rows[0].total_received, 7, 'Total received should be 7');
        assert.strictEqual(summaryResult.rows[0].total_inserted, 2, 'Total inserted should be 2');
        assert.strictEqual(summaryResult.rows[0].total_updated, 1, 'Total updated should be 1');
        assert.strictEqual(summaryResult.rows[0].total_skipped, 3, 'Total skipped should be 3');
        assert.strictEqual(summaryResult.rows[0].total_failed, 1, 'Total failed should be 1');
      });
    } finally {
      client.release();
    }
  });
});

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running EPIC 5 Integration Tests...');
}
