/**
 * Authentication Middleware (Stub)
 * 
 * This is a stub implementation for development.
 * In production, this should:
 * - Validate JWT tokens
 * - Extract user information
 * - Verify permissions
 * 
 * Priority: 2 (runs after request-id)
 */

const AUTH_HEADER = 'authorization';
const DEV_USER_HEADER = 'x-dev-user-id';

/**
 * Stub user data for development
 */
const STUB_USER = {
  id: 'dev-user-001',
  email: 'dev@osol.bank',
  name: 'Development User',
  roles: ['USER'],
};

/**
 * Authentication middleware
 * 
 * In development mode (when x-dev-user-id header is present or no auth header),
 * uses a stub user. In production, should validate actual tokens.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.get(AUTH_HEADER);
  const devUserId = req.get(DEV_USER_HEADER);
  
  // Development mode: use stub user or dev user header
  if (devUserId) {
    req.user = {
      ...STUB_USER,
      id: devUserId,
    };
    req.isAuthenticated = true;
    return next();
  }
  
  // No auth header in dev mode: use stub user
  if (!authHeader) {
    req.user = STUB_USER;
    req.isAuthenticated = true;
    return next();
  }
  
  // TODO: In production, validate the JWT token here
  // For now, treat any Bearer token as valid and use stub user
  if (authHeader.startsWith('Bearer ')) {
    // const token = authHeader.slice(7);
    // const decoded = await verifyJWT(token);
    // req.user = decoded;
    
    req.user = STUB_USER;
    req.isAuthenticated = true;
    return next();
  }
  
  // Invalid auth header format
  req.user = null;
  req.isAuthenticated = false;
  next();
}

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 */
export function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      requestId: req.requestId,
    });
  }
  next();
}

export default authMiddleware;
