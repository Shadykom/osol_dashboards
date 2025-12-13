/**
 * Organizational Unit Routes
 * 
 * Endpoints for managing organizational structure
 * Requires ADMIN role for access
 */

import { Router } from 'express';
import { requireTenant, requireDb, requireAdmin } from '../../middleware/index.js';

const router = Router();

/**
 * GET /platform/org-units/tree
 * 
 * Returns the organizational unit tree for the current tenant.
 * The tree is structured hierarchically with parent-child relationships.
 * 
 * Requires: ADMIN role (or x-dev-role=ADMIN in development)
 * 
 * Response:
 * {
 *   tree: [
 *     {
 *       id: string,
 *       name: string,
 *       code: string,
 *       type: string,
 *       parentId: string | null,
 *       level: number,
 *       path: string,
 *       children: [...]
 *     }
 *   ],
 *   flatList: [...] // All org units in flat array
 * }
 */
router.get('/tree', requireTenant, requireDb, requireAdmin, async (req, res) => {
  try {
    const { db, tenantId, requestId } = req;
    
    // Query all org units for this tenant
    // RLS will automatically filter by tenant
    const result = await db.query(
      `SELECT 
        id,
        name,
        code,
        type,
        parent_id,
        level,
        path,
        status,
        metadata,
        created_at,
        updated_at
      FROM org_units
      WHERE status = 'active'
      ORDER BY level ASC, name ASC`
    );
    
    const orgUnits = result.rows;
    
    // Build hierarchical tree
    const tree = buildOrgTree(orgUnits);
    
    res.json({
      tenantId,
      tree,
      flatList: orgUnits.map(formatOrgUnit),
      totalCount: orgUnits.length,
    });
  } catch (error) {
    // Handle case where org_units table doesn't exist
    if (error.code === '42P01') {
      return res.json({
        tenantId: req.tenantId,
        tree: [],
        flatList: [],
        totalCount: 0,
        _note: 'org_units table does not exist yet',
      });
    }
    
    console.error(`[${req.requestId}] Error fetching org tree:`, error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch organizational structure',
      requestId: req.requestId,
    });
  }
});

/**
 * GET /platform/org-units/:id
 * 
 * Get a specific organizational unit by ID
 */
router.get('/:id', requireTenant, requireDb, requireAdmin, async (req, res) => {
  try {
    const { db, requestId } = req;
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT 
        id,
        name,
        code,
        type,
        parent_id,
        level,
        path,
        status,
        metadata,
        created_at,
        updated_at
      FROM org_units
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Organizational unit not found: ${id}`,
        requestId,
      });
    }
    
    res.json(formatOrgUnit(result.rows[0]));
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Organizational units table does not exist',
        requestId: req.requestId,
      });
    }
    
    console.error(`[${req.requestId}] Error fetching org unit:`, error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch organizational unit',
      requestId: req.requestId,
    });
  }
});

/**
 * GET /platform/org-units/:id/children
 * 
 * Get direct children of an organizational unit
 */
router.get('/:id/children', requireTenant, requireDb, requireAdmin, async (req, res) => {
  try {
    const { db, requestId } = req;
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT 
        id,
        name,
        code,
        type,
        parent_id,
        level,
        path,
        status,
        metadata,
        created_at,
        updated_at
      FROM org_units
      WHERE parent_id = $1 AND status = 'active'
      ORDER BY name ASC`,
      [id]
    );
    
    res.json({
      parentId: id,
      children: result.rows.map(formatOrgUnit),
      count: result.rows.length,
    });
  } catch (error) {
    if (error.code === '42P01') {
      return res.json({
        parentId: req.params.id,
        children: [],
        count: 0,
        _note: 'org_units table does not exist yet',
      });
    }
    
    console.error(`[${req.requestId}] Error fetching org unit children:`, error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to fetch organizational unit children',
      requestId: req.requestId,
    });
  }
});

/**
 * Format an org unit row for API response
 */
function formatOrgUnit(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    parentId: row.parent_id,
    level: row.level,
    path: row.path,
    status: row.status,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Build a hierarchical tree from flat org units list
 */
function buildOrgTree(orgUnits) {
  const map = new Map();
  const roots = [];
  
  // First pass: create all nodes
  orgUnits.forEach(unit => {
    map.set(unit.id, {
      ...formatOrgUnit(unit),
      children: [],
    });
  });
  
  // Second pass: build relationships
  orgUnits.forEach(unit => {
    const node = map.get(unit.id);
    if (unit.parent_id && map.has(unit.parent_id)) {
      map.get(unit.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}

export default router;
