import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !user.role) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session invalid.'
        },
        requestId: (req as any).requestId
      });
    }

    if (!allowedRoles.includes(user.role) && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: Action requires role [${allowedRoles.join(', ')}]. User role is [${user.role}].`
        },
        requestId: (req as any).requestId
      });
    }

    next();
  };
}
