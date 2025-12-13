/**
 * Route Configuration
 * 
 * Central router that mounts all API routes
 */

import { Router } from 'express';
import healthRouter from './health.js';
import platformRouter from './platform/index.js';

const router = Router();

// Health checks (no auth required)
router.use('/health', healthRouter);

// Platform routes (tenant/org management)
router.use('/platform', platformRouter);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    service: 'osol-api',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      platform: {
        tenants: '/platform/tenants/me',
        orgUnits: '/platform/org-units/tree',
      },
    },
    requestId: req.requestId,
  });
});

export default router;
