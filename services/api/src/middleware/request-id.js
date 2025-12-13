/**
 * Request ID Middleware
 * 
 * Generates or extracts a unique request ID for each request.
 * The request ID is used for tracing and logging.
 * 
 * Priority: 1 (runs first)
 */

import { randomUUID } from 'crypto';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Request ID middleware
 * Attaches a unique request ID to each request and response
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestIdMiddleware(req, res, next) {
  // Use existing request ID from header or generate a new one
  const requestId = req.get(REQUEST_ID_HEADER) || randomUUID();
  
  // Attach to request object for use in handlers and other middleware
  req.requestId = requestId;
  
  // Set response header for client correlation
  res.setHeader(REQUEST_ID_HEADER, requestId);
  
  // Log the request (in production, use a proper logger)
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${requestId}] ${req.method} ${req.path}`);
  
  next();
}

export default requestIdMiddleware;
