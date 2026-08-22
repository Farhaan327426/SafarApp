import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter Middleware: 10 requests/min per endpoint per session token (or IP)
 */
export const perEndpointSessionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req: Request) => {
    const sessionToken = (req.session as any)?.id || req.headers['x-session-token'] || req.ip;
    return `${sessionToken}:${req.baseUrl}${req.path}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: (req: Request, res: Response) => {
    return res.status(429).json({
      success: false,
      error: {
        code: 'ERR_RATE_LIMIT_EXCEEDED',
        message: 'Rate Limit Exceeded [ERR_RATE_LIMIT_EXCEEDED]: Maximum 10 requests/min per endpoint. Please wait before retrying.'
      },
      requestId: (req as any).requestId
    });
  }
});
