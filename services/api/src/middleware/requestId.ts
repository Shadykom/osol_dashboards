/**
 * Request ID Middleware
 * Generates or extracts request/correlation IDs for request tracing
 */

import { randomUUID } from 'node:crypto';
import type { FastifyPluginCallback, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

// ============================================================================
// Request ID Headers
// ============================================================================

const REQUEST_ID_HEADER = 'x-request-id';
const CORRELATION_ID_HEADER = 'x-correlation-id';

// ============================================================================
// Extend Fastify Types
// ============================================================================

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    correlationId?: string;
  }
}

// ============================================================================
// Plugin Implementation
// ============================================================================

const requestIdPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Extract or generate request ID
    const requestId = (request.headers[REQUEST_ID_HEADER] as string) || randomUUID();
    
    // Extract correlation ID (for distributed tracing)
    const correlationId = request.headers[CORRELATION_ID_HEADER] as string | undefined;

    // Attach to request
    request.requestId = requestId;
    request.correlationId = correlationId;

    // Add to response headers
    reply.header(REQUEST_ID_HEADER, requestId);
    if (correlationId) {
      reply.header(CORRELATION_ID_HEADER, correlationId);
    }
  });

  done();
};

export const requestIdMiddleware = fp(requestIdPlugin, {
  name: 'requestId',
  fastify: '5.x',
});
