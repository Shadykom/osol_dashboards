/**
 * Health Check Routes
 * 
 * Endpoints for service health monitoring
 */

import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

/**
 * GET /health
 * 
 * Basic health check - returns 200 if service is running
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'osol-api',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

/**
 * GET /health/ready
 * 
 * Readiness check - verifies all dependencies are available
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
  };
  
  try {
    // Check database connectivity
    await query('SELECT 1');
    checks.database = true;
  } catch (error) {
    console.error(`[${req.requestId}] Database health check failed:`, error);
  }
  
  const allHealthy = Object.values(checks).every(Boolean);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

/**
 * GET /health/live
 * 
 * Liveness check - simple check that service can respond
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'live',
    timestamp: new Date().toISOString(),
  });
});

export default router;
