import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

import { prisma } from './config/db';
import { requestIdMiddleware, requireAuth } from './middleware/auth';
import { csrfProtection } from './middleware/csrf';
import { requireRole } from './middleware/rbac';
import { verifyRequestSignature } from './middleware/signature';
import { perEndpointSessionRateLimiter } from './middleware/rateLimiter';
import { importJsonRoutes } from './routes/importRouteController';

import {
  loginValidators,
  passwordChangeValidators,
  routeValidators,
  stopValidators,
  routeIdParamValidator
} from './validators/expressValidators';

import * as authController from './auth/authController';
import * as fareController from './fares/fareController';
import * as routeController from './routes/routeController';
import * as complianceController from './compliance/complianceController';
import * as exportController from './exports/exportController';
import * as permitController from './routes/nonLocalPermitController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Dynamic CSP Nonce Generation Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  (res as any).locals.cspNonce = nonce;
  res.setHeader('X-CSP-Nonce', nonce);
  next();
});

// Dynamic Helmet Security & HSTS Hardening Configuration
app.use((req: Request, res: Response, next: NextFunction) => {
  const nonce = (res as any).locals.cspNonce;
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", `'nonce-${nonce}'`, "https://www.gstatic.com", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", `'nonce-${nonce}'`, "https://fonts.googleapis.com", "https://unpkg.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "https://*.tile.openstreetmap.org", "https://*.basemaps.cartocdn.com"],
        connectSrc: ["'self'", "https://api.yourdomain.com", "https://*.basemaps.cartocdn.com", "https://unpkg.com"],
        workerSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  })(req, res, next);
});

// Explicit CSP header fallback middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const nonce = (res as any).locals.cspNonce || '';
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; ` +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
    "img-src 'self' data: https: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com; " +
    "connect-src 'self' https://api.yourdomain.com https://*.basemaps.cartocdn.com https://unpkg.com; " +
    "worker-src 'self'; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "base-uri 'self'"
  );
  next();
});

// HTTPS Enforcement Middleware for Non-Development Environments
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestIdMiddleware);

// Session Store Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'super_secret_safar_session_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Apply CSRF Protection
app.use(csrfProtection);

// ─── DYNAMIC HTML SERVING WITH PER-REQUEST NONCE INJECTION ───────────────────
app.get(['/', '/commuter', '/driver', '/index.html'], (req: Request, res: Response) => {
  const nonce = (res as any).locals.cspNonce;
  const filePath = path.join(__dirname, '../../frontend/index.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading page');
    const dynamicHtml = html.replace(/nonce="[^"]*"/g, `nonce="${nonce}"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(dynamicHtml);
  });
});

app.get(['/admin', '/admin.html'], async (req: Request, res: Response) => {
  const nonce = (res as any).locals.cspNonce;
  const filePath = path.join(__dirname, '../../frontend/admin.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading admin suite');
    const dynamicHtml = html.replace(/nonce="[^"]*"/g, `nonce="${nonce}"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(dynamicHtml);
  });
});

app.get(['/govt', '/govt.html'], async (req: Request, res: Response) => {
  const nonce = (res as any).locals.cspNonce;
  const filePath = path.join(__dirname, '../../frontend/govt.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading government portal');
    const dynamicHtml = html.replace(/nonce="[^"]*"/g, `nonce="${nonce}"`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(dynamicHtml);
  });
});

// Serve static assets (CSS, JS, manifest, etc.)
app.use(express.static(path.join(__dirname, '../../frontend')));

// Strict Rate Limiter for Login Attempts
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many failed login attempts. Please try again after 15 minutes.'
    }
  }
});

// ─── PUBLIC & COMMUTER API ROUTING ──────────────────────────────────────────
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ONLINE', database: 'CONNECTED', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ status: 'DEGRADED', database: 'DISCONNECTED', timestamp: new Date() });
  }
});

// Strict Rate Limiters for OTP Request and Verification
const otpRequestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_OTP_REQUESTS',
      message: 'Too many OTP requests. Please try again after 15 minutes.'
    }
  }
});

const otpVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_VERIFY_ATTEMPTS',
      message: 'Too many OTP verification attempts. Please try again after 15 minutes.'
    }
  }
});

app.get('/api/v1/auth/csrf-token', authController.getCsrfToken);
app.post('/api/v1/auth/login', loginRateLimiter, loginValidators, authController.login);
app.post('/api/v1/auth/refresh', authController.refresh);
app.post('/api/v1/auth/otp/request', otpRequestRateLimiter, authController.requestOtp);
app.post('/api/v1/auth/otp/verify', otpVerifyRateLimiter, authController.verifyOtp);


app.get('/api/v1/fares/quote', fareController.getFareQuote);
app.get('/api/v1/fares/sources', fareController.getFareSources);
app.get('/api/v1/fares/rules', fareController.getVerifiedFareRules);
app.get('/api/v1/admin/fares/current', fareController.getCurrentFare);
app.get('/api/v1/routes', routeController.getRoutes);
app.get('/api/v1/routes/:routeId/stops', routeIdParamValidator, routeController.getRouteStops);
app.post('/api/v1/routes/:routeId/nearest-stop', routeIdParamValidator, routeController.findNearestStop);
app.get('/api/v1/config/service-area', routeController.getServiceAreaConfig);

// ─── SRO NOTIFICATIONS (PUBLIC, CACHEABLE) ───────────────────────────────────
app.get('/api/v1/sro/notifications', fareController.getActiveSroNotifications);

// ─── NON-LOCAL PERMIT VERIFICATION (PUBLIC, RATE-LIMITED) ────────────────────
const permitVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 10,                  // 10 lookups per IP per minute
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many verification requests. Try again in 1 minute.'
    }
  }
});
app.get('/api/v1/permits/non-local/verify/:identifier', permitVerifyLimiter, permitController.verifyNonLocalPermit);

// ─── REALTIME TELEMETRY & TRIP BOOKING / SYNC ──────────────────────────────
app.get('/api/v1/telemetry/:trip_id/latest', fareController.getLiveTelemetry);
app.get('/api/v1/payment/status/:booking_id', (req: Request, res: Response) => {
  res.json({ success: true, status: 'completed', bookingId: req.params.booking_id, timestamp: new Date() });
});
app.get('/api/v1/wallet/balance', (req: Request, res: Response) => {
  res.json({ success: true, balancePaise: 50000, currency: 'INR' });
});

// Minimal In-Memory Idempotency Cache (Use Redis in Production)
const idempotencyCache = new Map<string, any>();

app.post('/api/v1/trips/book', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { routeId, routeName, boardingId, deboardingId, vehicleType, distanceKm, fareEstimate, idempotencyKey } = req.body;

  if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
    return res.status(200).json({
      success: true,
      message: 'Idempotent replay',
      data: idempotencyCache.get(idempotencyKey),
      requestId
    });
  }

  try {
    const bookingCode = `BK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const bookingData = {
      bookingId: bookingCode,
      status: 'CONFIRMED',
      route: routeName || routeId,
      boardingId,
      deboardingId,
      vehicleType,
      distanceKm,
      fareEstimate,
      syncedAt: new Date().toISOString()
    };

    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, bookingData);
      // Clean up after 24h
      setTimeout(() => idempotencyCache.delete(idempotencyKey), 24 * 60 * 60 * 1000);
    }

    return res.status(201).json({
      success: true,
      data: bookingData,
      requestId
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'BOOKING_FAILED', message: err.message },
      requestId
    });
  }
});

app.post('/api/v1/sos/trigger', (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { lat, lng, vehicleNo } = req.body;
  
  // Simulated distress dispatch to PCR 112
  console.log(`[🚨 SOS ALERT] Vehicle: ${vehicleNo}, Lat: ${lat}, Lng: ${lng}`);

  return res.status(202).json({
    success: true,
    data: { message: 'SOS alert dispatched to PCR 112.' },
    requestId
  });
});

// ─── AUTHENTICATED & RBAC PROTECTED ROUTES ──────────────────────────────────
app.use('/api/v1', requireAuth);
app.use('/api/v1', perEndpointSessionRateLimiter);

app.post('/api/v1/admin/routes/import-json', requireRole('ADMIN'), importJsonRoutes);

// ─── NON-LOCAL PERMIT MANAGEMENT (AUTHENTICATED) ────────────────────────────
app.get('/api/v1/permits/non-local', requireRole('ADMIN'), permitController.getNonLocalPermits);
app.post('/api/v1/permits/non-local', requireRole('ADMIN'), permitController.registerNonLocalPermit);
app.patch('/api/v1/permits/non-local/:id/verify', requireRole('ADMIN', 'ENFORCEMENT_OFFICER'), permitController.approveNonLocalPermit);

app.post('/api/v1/auth/logout', authController.logout);
app.get('/api/v1/auth/session', authController.getSession);
app.post('/api/v1/auth/change-password', verifyRequestSignature, passwordChangeValidators, authController.changePassword);

app.get('/api/v1/admin/fares', requireRole('FARE_ADMIN', 'SUPER_ADMIN', 'AUDITOR'), fareController.getAdminFares);
app.post('/api/v1/admin/fares', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), fareController.createAdminFare);
app.put('/api/v1/admin/fares/:id', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), fareController.updateAdminFare);
app.post('/api/v1/admin/fares/:id/verify', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), verifyRequestSignature, fareController.verifyAdminFare);
app.post('/api/v1/admin/fares/:id/deactivate', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), fareController.deactivateAdminFare);
app.get('/api/v1/admin/fares/audit-report', requireRole('FARE_ADMIN', 'SUPER_ADMIN', 'AUDITOR'), fareController.getAuditReport);

app.get('/api/v1/admin/fares/history', fareController.getFareHistory);
app.post('/api/v1/admin/fares/draft', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), fareController.saveDraft);
app.post('/api/v1/admin/fares/publish', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), verifyRequestSignature, fareController.publishFare);
app.post('/api/v1/admin/fares/rollback', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), fareController.rollbackFare);

app.get('/api/v1/admin/routes', routeController.getRoutes);
app.get('/api/v1/admin/routes/completeness-report', routeController.getCompletenessReport);
app.get('/api/v1/admin/routes/import-csv-status', routeController.getImportCsvStatus);
app.post('/api/v1/admin/routes', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeValidators, routeController.createRoute);
app.post('/api/v1/admin/routes/import-json', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeController.importJSON);
app.post('/api/v1/admin/routes/import-csv', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeController.importCSV);
app.post('/api/v1/admin/routes/import-gtfs', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeController.importGTFS);
app.post('/api/v1/admin/routes/:routeId/stops', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeIdParamValidator, stopValidators, routeController.addStopToRoute);
app.put('/api/v1/admin/routes/:routeId/stops/:stopId', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeController.updateRouteStop);
app.delete('/api/v1/admin/routes/:routeId/stops/:stopId', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeController.deleteRouteStop);
app.post('/api/v1/admin/routes/:routeId/reorder-stops', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeController.reorderRouteStops);
app.post('/api/v1/admin/routes/:routeId/verify', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), verifyRequestSignature, routeController.verifyRoute);
app.patch('/api/v1/admin/routes/:id/status', requireRole('FARE_ADMIN', 'SUPER_ADMIN'), routeController.updateRouteStatus);

app.get('/api/v1/admin/compliance/stats', complianceController.getComplianceStats);
app.get('/api/v1/admin/activity-timeline', complianceController.getActivityTimeline);
app.get('/api/v1/admin/compliance/export', requireRole('AUDITOR', 'SUPER_ADMIN'), exportController.exportComplianceReport);

// Centralized 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Requested API endpoint does not exist.' },
    requestId: (req as any).requestId
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Safar Express Production Hardened Backend running on port ${PORT}`);
});
