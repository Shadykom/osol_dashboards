/**
 * CMS Logging Module
 * Structured logging with request context support
 */

import pino from 'pino';
import type { LogLevel, RequestContext } from '../types/index.js';

// ============================================================================
// Logger Configuration
// ============================================================================

export interface LoggerConfig {
  level: LogLevel;
  serviceName: string;
  environment: string;
  prettyPrint?: boolean;
}

// ============================================================================
// Create Logger Instance
// ============================================================================

export function createLogger(config: LoggerConfig): pino.Logger {
  const options: pino.LoggerOptions = {
    name: config.serviceName,
    level: config.level,
    base: {
      service: config.serviceName,
      env: config.environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
  };

  // Pretty print for development
  if (config.prettyPrint && config.environment === 'development') {
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(options);
}

// ============================================================================
// Request-Scoped Logger
// ============================================================================

export interface RequestLogger extends pino.Logger {
  requestId: string;
  tenantId?: string;
}

export function createRequestLogger(
  baseLogger: pino.Logger,
  context: Partial<RequestContext>
): RequestLogger {
  const childLogger = baseLogger.child({
    requestId: context.requestId,
    correlationId: context.correlationId,
    tenantId: context.tenantId,
    userId: context.userId,
  }) as RequestLogger;

  childLogger.requestId = context.requestId || '';
  childLogger.tenantId = context.tenantId;

  return childLogger;
}

// ============================================================================
// Log Context Helpers
// ============================================================================

export function logError(
  logger: pino.Logger,
  error: Error,
  message?: string,
  context?: Record<string, unknown>
): void {
  logger.error(
    {
      err: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    },
    message || error.message
  );
}

export function logHttpRequest(
  logger: pino.Logger,
  req: {
    method: string;
    url: string;
    headers?: Record<string, string | string[] | undefined>;
  },
  context?: Record<string, unknown>
): void {
  logger.info(
    {
      http: {
        method: req.method,
        url: req.url,
        userAgent: req.headers?.['user-agent'],
      },
      ...context,
    },
    'HTTP Request'
  );
}

export function logHttpResponse(
  logger: pino.Logger,
  res: {
    statusCode: number;
    responseTime: number;
  },
  context?: Record<string, unknown>
): void {
  const level = res.statusCode >= 400 ? 'warn' : 'info';
  logger[level](
    {
      http: {
        statusCode: res.statusCode,
        responseTime: res.responseTime,
      },
      ...context,
    },
    'HTTP Response'
  );
}

export function logDatabaseQuery(
  logger: pino.Logger,
  query: {
    sql?: string;
    params?: unknown[];
    duration: number;
    error?: Error;
  }
): void {
  if (query.error) {
    logger.error(
      {
        db: {
          duration: query.duration,
          error: query.error.message,
        },
      },
      'Database query failed'
    );
  } else {
    logger.debug(
      {
        db: {
          duration: query.duration,
        },
      },
      'Database query executed'
    );
  }
}

// ============================================================================
// Default Logger Instance (singleton)
// ============================================================================

let defaultLogger: pino.Logger | null = null;

export function initializeLogger(config: LoggerConfig): pino.Logger {
  defaultLogger = createLogger(config);
  return defaultLogger;
}

export function getLogger(): pino.Logger {
  if (!defaultLogger) {
    // Create a default logger if not initialized
    defaultLogger = createLogger({
      level: 'info',
      serviceName: 'cms-api',
      environment: process.env.NODE_ENV || 'development',
      prettyPrint: process.env.NODE_ENV === 'development',
    });
  }
  return defaultLogger;
}
