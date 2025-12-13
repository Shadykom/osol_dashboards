/**
 * Application configuration
 * Loads environment variables and provides typed configuration
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from services/api directory first, then workspace root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'db.bzlenegoilnswsbanxgb.supabase.co',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    schema: process.env.DB_SCHEMA || 'kastle_banking',
    ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  },
  
  // Tenant
  defaultTenantId: process.env.DEFAULT_TENANT_ID || null,
  
  // RBAC
  rbac: {
    enabled: process.env.RBAC_ENABLED !== 'false',
    devBypassEnabled: process.env.RBAC_DEV_BYPASS !== 'false',
  }
};

export default config;
