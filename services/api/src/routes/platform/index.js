/**
 * Platform Routes
 * 
 * All platform-level endpoints (tenants, org-units, etc.)
 */

import { Router } from 'express';
import tenantsRouter from './tenants.js';
import orgUnitsRouter from './org-units.js';

const router = Router();

// Mount sub-routers
router.use('/tenants', tenantsRouter);
router.use('/org-units', orgUnitsRouter);

export default router;
