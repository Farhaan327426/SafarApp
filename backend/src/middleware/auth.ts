import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyAccessToken, TokenPayload } from '../auth/jwt';

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: string;
  tenantId?: string;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  (req as any).requestId = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let userPayload: TokenPayload | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    userPayload = verifyAccessToken(token);
  }

  // Fallback to session user if JWT not provided
  if (!userPayload && (req.session as any)?.user) {
    const sUser = (req.session as any).user;
    userPayload = {
      userId: sUser.id,
      username: sUser.username,
      role: sUser.role,
      tenantId: sUser.tenantId
    };
  }

  if (!userPayload) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Valid access token or active session required.'
      },
      requestId: (req as any).requestId
    });
  }

  (req as any).user = {
    id: userPayload.userId,
    username: userPayload.username,
    role: userPayload.role,
    tenantId: userPayload.tenantId
  };

  next();
}
