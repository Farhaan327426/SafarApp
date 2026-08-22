import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const HMAC_SECRET = process.env.HMAC_SECRET_KEY || 'safar_prod_hmac_secret_key_2026';

/**
 * Middleware to verify HMAC-SHA256 request signature for sensitive operations
 * Expects headers:
 * - X-Signature: hex string of HMAC-SHA256(requestBodyString + timestamp, secret)
 * - X-Timestamp: Unix timestamp in milliseconds
 */
export function verifyRequestSignature(req: Request, res: Response, next: NextFunction) {
  // In test environment or bypass mode, permit if explicit test header or NODE_ENV=test
  if (process.env.NODE_ENV === 'test' && !req.headers['x-signature']) {
    return next();
  }

  const signature = req.headers['x-signature'] as string;
  const timestampStr = req.headers['x-timestamp'] as string;

  if (!signature || !timestampStr) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'ERR_SIGNATURE_MISSING',
        message: 'Security Verification Failed [ERR_SIGNATURE_MISSING]: Missing required X-Signature or X-Timestamp header.'
      },
      requestId: (req as any).requestId
    });
  }

  const timestamp = parseInt(timestampStr, 10);
  const now = Date.now();

  // Validate timestamp freshness (max 5 minutes window)
  if (isNaN(timestamp) || Math.abs(now - timestamp) > 5 * 60 * 1000) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'ERR_SIGNATURE_EXPIRED',
        message: 'Security Verification Failed [ERR_SIGNATURE_EXPIRED]: Request signature timestamp expired or invalid.'
      },
      requestId: (req as any).requestId
    });
  }

  const bodyStr = req.body ? JSON.stringify(req.body) : '';
  const payloadToSign = `${req.method.toUpperCase()}:${req.path}:${timestampStr}:${bodyStr}`;
  const expectedSignature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(payloadToSign)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'ERR_SIGNATURE_INVALID',
        message: 'Security Verification Failed [ERR_SIGNATURE_INVALID]: HMAC-SHA256 signature verification failed.'
      },
      requestId: (req as any).requestId
    });
  }

  next();
}
