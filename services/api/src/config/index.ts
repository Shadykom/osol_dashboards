/**
 * CMS API Configuration
 * Environment-based configuration with validation
 */

import { z } from 'zod';
import type { AppConfig, LogLevel, Environment } from '@cms/common';

// ============================================================================
// Environment Variable Schema
// ============================================================================

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_POOL_MIN: z.string().default('2').transform(Number),
  DATABASE_POOL_MAX: z.string().default('10').transform(Number),
  DATABASE_SSL: z.string().default('true').transform(v => v === 'true'),
  DEFAULT_TENANT_FOR_DEV: z.string().uuid().optional(),
  CORS_ORIGIN: z.string().default('*'),
});

// ============================================================================
// Configuration Type
// ============================================================================

export interface Config extends AppConfig {
  cors: {
    origin: string | string[];
  };
}

// ============================================================================
// Load Configuration
// ============================================================================

let config: Config | null = null;

export function loadConfig(): Config {
  if (config) {
    return config;
  }

  // Parse and validate environment variables
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('Configuration validation failed:');
    for (const [key, messages] of Object.entries(errors)) {
      console.error(`  ${key}: ${messages?.join(', ')}`);
    }
    process.exit(1);
  }

  const env = result.data;

  config = {
    env: env.NODE_ENV as Environment,
    port: env.PORT,
    host: env.HOST,
    logLevel: env.LOG_LEVEL as LogLevel,
    database: {
      url: env.DATABASE_URL,
      poolMin: env.DATABASE_POOL_MIN,
      poolMax: env.DATABASE_POOL_MAX,
      ssl: env.DATABASE_SSL,
    },
    defaultTenantForDev: env.DEFAULT_TENANT_FOR_DEV,
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    },
  };

  return config;
}

export function getConfig(): Config {
  if (!config) {
    return loadConfig();
  }
  return config;
}

// ============================================================================
// Environment Helpers
// ============================================================================

export function isDevelopment(): boolean {
  return getConfig().env === 'development';
}

export function isProduction(): boolean {
  return getConfig().env === 'production';
}

export function isStaging(): boolean {
  return getConfig().env === 'staging';
}
