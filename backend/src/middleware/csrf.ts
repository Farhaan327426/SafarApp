import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Modern Double Submit / Custom Header CSRF Protection
 * 1. Attaches a dynamic per-session / per-request CSRF token.
 * 2. Validates x-csrf-token header against the session CSRF token for state-changing requests (POST, PUT, PATCH, DELETE).
 * 3. Validates Origin/Referer header to match authorized origins.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Ensure session has a CSRF token
  if (req.session && !(req.session as any).csrfToken) {
    (req.session as any).csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Set CSRF token in response header for client consumption
  const sessionCsrf = req.session ? (req.session as any).csrfToken : null;
  if (sessionCsrf) {
    res.setHeader('X-CSRF-Token', sessionCsrf);
  }

  // Safe HTTP methods do not require CSRF token validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || process.env.NODE_ENV === 'test') {
    return next();
  }

  // Validate CSRF Header for state-modifying requests
  const clientCsrf = req.headers['x-csrf-token'];
  if (!clientCsrf || clientCsrf !== sessionCsrf) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_INVALID',
        message: 'Forbidden: Invalid or missing CSRF token.'
      },
      requestId: (req as any).requestId
    });
  }

  // Validate Origin / Referer for extra security
  const origin = req.headers.origin || req.headers.referer;
  if (process.env.NODE_ENV === 'production' && origin) {
    const allowedOrigin = process.env.CORS_ORIGIN || '';
    if (allowedOrigin && !origin.startsWith(allowedOrigin)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ORIGIN_MISMATCH',
          message: 'Forbidden: Untrusted request origin.'
        },
        requestId: (req as any).requestId
      });
    }
  }

  next();
}
