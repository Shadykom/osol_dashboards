/**
 * Tenant Routes
 * 
 * Endpoints for tenant management and information
 */

import { Router } from 'express';
import { requireTenant, requireDb } from '../../middleware/index.js';

const router = Router();

/**
 * GET /platform/tenants/me
 * 
 * Returns information about the current tenant based on tenant context.
 * In development, this uses the x-tenant-id header.
 * In production, this would use the authenticated user's tenant.
 * 
 * Response:
 * {
 *   id: string,
 *   name: string,
 *   slug: string,
 *   status: string,
 *   settings: object,
 *   createdAt: string,
 *   updatedAt: string
 * }
 */
router.get('/me', requireTenant, requireDb, async (req, res) => {
  try {
    const { db, tenantId, requestId } = req;
    
    // Query tenant information
    const result = await db.query(
      `SELECT 
        id,
        name,
        slug,
        status,
        settings,
        created_at,
        updated_at
      FROM tenants
      WHERE id = $1`,
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      // If tenant doesn't exist in DB, return basic info from context
      // This handles the case where RLS tables don't have a tenants table yet
      return res.json({
        id: tenantId,
        name: `Tenant ${tenantId.slice(0, 8)}`,
        slug: tenantId.slice(0, 8),
        status: 'active',
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _note: 'Tenant info from context (no tenants table found)',
      });
    }
    
    const tenant = result.rows[0];
    
    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      settings: tenant.settings || {},
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    });
  } catch (error) {
    // Handle case where tenants table doesn't exist
    if (error.code === '42P01') {
      return res.json({
        id: req.tenantId,
        name: `Tenant ${req.tenantId.slice(0, 8)}`,
        slug: req.tenantId.slice(0, 8),
        status: 'active',
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _note: 'Tenants table does not exist yet',
      });
    }
    
    console.error(`[${req.requestId}] Error fetching tenant:`, error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch tenant information',
      requestId: req.requestId,
    });
  }
});

/**
 * GET /platform/tenants/me/stats
 * 
 * Returns usage statistics for the current tenant
 */
router.get('/me/stats', requireTenant, requireDb, async (req, res) => {
  try {
    const { db, requestId } = req;
    
    // Get various counts for the tenant
    // These queries will be filtered by RLS automatically
    const queries = await Promise.allSettled([
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM org_units'),
      db.query('SELECT COUNT(*) as count FROM customers'),
    ]);
    
    const [usersResult, orgUnitsResult, customersResult] = queries;
    
    res.json({
      users: usersResult.status === 'fulfilled' ? parseInt(usersResult.value.rows[0]?.count || 0) : 0,
      orgUnits: orgUnitsResult.status === 'fulfilled' ? parseInt(orgUnitsResult.value.rows[0]?.count || 0) : 0,
      customers: customersResult.status === 'fulfilled' ? parseInt(customersResult.value.rows[0]?.count || 0) : 0,
    });
  } catch (error) {
    console.error(`[${req.requestId}] Error fetching tenant stats:`, error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch tenant statistics',
      requestId: req.requestId,
    });
  }
});

export default router;
