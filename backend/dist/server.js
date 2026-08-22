"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("./config/db");
const auth_1 = require("./middleware/auth");
const csrf_1 = require("./middleware/csrf");
const rbac_1 = require("./middleware/rbac");
const signature_1 = require("./middleware/signature");
const rateLimiter_1 = require("./middleware/rateLimiter");
const importRouteController_1 = require("./routes/importRouteController");
const expressValidators_1 = require("./validators/expressValidators");
const authController = __importStar(require("./auth/authController"));
const fareController = __importStar(require("./fares/fareController"));
const routeController = __importStar(require("./routes/routeController"));
const complianceController = __importStar(require("./compliance/complianceController"));
const exportController = __importStar(require("./exports/exportController"));
const permitController = __importStar(require("./routes/nonLocalPermitController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Dynamic CSP Nonce Generation Middleware
app.use((req, res, next) => {
    const nonce = crypto_1.default.randomBytes(16).toString('hex');
    res.locals.cspNonce = nonce;
    res.setHeader('X-CSP-Nonce', nonce);
    next();
});
// Dynamic Helmet Security & HSTS Hardening Configuration
app.use((req, res, next) => {
    const nonce = res.locals.cspNonce;
    (0, helmet_1.default)({
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
app.use((req, res, next) => {
    const nonce = res.locals.cspNonce || '';
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; ` +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
        "img-src 'self' data: https: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com; " +
        "connect-src 'self' https://api.yourdomain.com https://*.basemaps.cartocdn.com https://unpkg.com; " +
        "worker-src 'self'; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "base-uri 'self'");
    next();
});
// HTTPS Enforcement Middleware for Non-Development Environments
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(auth_1.requestIdMiddleware);
// Session Store Configuration
app.use((0, express_session_1.default)({
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
app.use(csrf_1.csrfProtection);
// ─── DYNAMIC HTML SERVING WITH PER-REQUEST NONCE INJECTION ───────────────────
app.get(['/', '/index.html'], (req, res) => {
    const nonce = res.locals.cspNonce;
    const filePath = path_1.default.join(__dirname, '../../frontend/index.html');
    fs_1.default.readFile(filePath, 'utf8', (err, html) => {
        if (err)
            return res.status(500).send('Error loading page');
        const dynamicHtml = html.replace(/nonce="[^"]*"/g, `nonce="${nonce}"`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(dynamicHtml);
    });
});
app.get('/admin.html', async (req, res) => {
    // Session-validated admin route — redirects to login on auth failure
    try {
        const sessionUser = req.user;
        const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'ENFORCEMENT_OFFICER'];
        if (!sessionUser || !allowedRoles.includes(sessionUser.role)) {
            return res.redirect(302, `/login?next=${encodeURIComponent('/admin.html')}`);
        }
        const nonce = res.locals.cspNonce;
        const filePath = path_1.default.join(__dirname, '../../frontend/admin.html');
        fs_1.default.readFile(filePath, 'utf8', (err, html) => {
            if (err)
                return res.status(500).send('Error loading admin suite');
            const dynamicHtml = html.replace(/nonce="[^"]*"/g, `nonce="${nonce}"`);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(dynamicHtml);
        });
    }
    catch (e) {
        return res.redirect(302, `/login?next=${encodeURIComponent('/admin.html')}`);
    }
});
// Serve static assets (CSS, JS, manifest, etc.)
app.use(express_1.default.static(path_1.default.join(__dirname, '../../frontend')));
// Strict Rate Limiter for Login Attempts
const loginRateLimiter = (0, express_rate_limit_1.default)({
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
app.get('/health', async (req, res) => {
    try {
        await db_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ONLINE', database: 'CONNECTED', timestamp: new Date() });
    }
    catch (err) {
        res.status(503).json({ status: 'DEGRADED', database: 'DISCONNECTED', timestamp: new Date() });
    }
});
// Strict Rate Limiters for OTP Request and Verification
const otpRequestRateLimiter = (0, express_rate_limit_1.default)({
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
const otpVerifyRateLimiter = (0, express_rate_limit_1.default)({
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
app.post('/api/v1/auth/login', loginRateLimiter, expressValidators_1.loginValidators, authController.login);
app.post('/api/v1/auth/refresh', authController.refresh);
app.post('/api/v1/auth/otp/request', otpRequestRateLimiter, authController.requestOtp);
app.post('/api/v1/auth/otp/verify', otpVerifyRateLimiter, authController.verifyOtp);
app.get('/api/v1/fares/quote', fareController.getFareQuote);
app.get('/api/v1/fares/sources', fareController.getFareSources);
app.get('/api/v1/fares/rules', fareController.getVerifiedFareRules);
app.get('/api/v1/admin/fares/current', fareController.getCurrentFare);
app.get('/api/v1/routes', routeController.getRoutes);
app.get('/api/v1/routes/:routeId/stops', expressValidators_1.routeIdParamValidator, routeController.getRouteStops);
app.post('/api/v1/routes/:routeId/nearest-stop', expressValidators_1.routeIdParamValidator, routeController.findNearestStop);
app.get('/api/v1/config/service-area', routeController.getServiceAreaConfig);
// ─── SRO NOTIFICATIONS (PUBLIC, CACHEABLE) ───────────────────────────────────
app.get('/api/v1/sro/notifications', fareController.getActiveSroNotifications);
// ─── NON-LOCAL PERMIT VERIFICATION (PUBLIC, RATE-LIMITED) ────────────────────
const permitVerifyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 lookups per IP per minute
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
app.get('/api/v1/payment/status/:booking_id', (req, res) => {
    res.json({ success: true, status: 'completed', bookingId: req.params.booking_id, timestamp: new Date() });
});
app.get('/api/v1/wallet/balance', (req, res) => {
    res.json({ success: true, balancePaise: 50000, currency: 'INR' });
});
// Minimal In-Memory Idempotency Cache (Use Redis in Production)
const idempotencyCache = new Map();
app.post('/api/v1/trips/book', async (req, res) => {
    const requestId = req.requestId;
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
        const bookingCode = `BK-${Date.now().toString(36).toUpperCase()}-${crypto_1.default.randomBytes(2).toString('hex').toUpperCase()}`;
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
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'BOOKING_FAILED', message: err.message },
            requestId
        });
    }
});
app.post('/api/v1/sos/trigger', (req, res) => {
    const requestId = req.requestId;
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
app.use('/api/v1', auth_1.requireAuth);
app.use('/api/v1', rateLimiter_1.perEndpointSessionRateLimiter);
app.post('/api/v1/admin/routes/import-json', (0, rbac_1.requireRole)('ADMIN'), importRouteController_1.importJsonRoutes);
// ─── NON-LOCAL PERMIT MANAGEMENT (AUTHENTICATED) ────────────────────────────
app.get('/api/v1/permits/non-local', (0, rbac_1.requireRole)('ADMIN'), permitController.getNonLocalPermits);
app.post('/api/v1/permits/non-local', (0, rbac_1.requireRole)('ADMIN'), permitController.registerNonLocalPermit);
app.patch('/api/v1/permits/non-local/:id/verify', (0, rbac_1.requireRole)('ADMIN', 'ENFORCEMENT_OFFICER'), permitController.approveNonLocalPermit);
app.post('/api/v1/auth/logout', authController.logout);
app.get('/api/v1/auth/session', authController.getSession);
app.post('/api/v1/auth/change-password', signature_1.verifyRequestSignature, expressValidators_1.passwordChangeValidators, authController.changePassword);
app.get('/api/v1/admin/fares', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN', 'AUDITOR'), fareController.getAdminFares);
app.post('/api/v1/admin/fares', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), fareController.createAdminFare);
app.put('/api/v1/admin/fares/:id', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), fareController.updateAdminFare);
app.post('/api/v1/admin/fares/:id/verify', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), signature_1.verifyRequestSignature, fareController.verifyAdminFare);
app.post('/api/v1/admin/fares/:id/deactivate', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), fareController.deactivateAdminFare);
app.get('/api/v1/admin/fares/audit-report', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN', 'AUDITOR'), fareController.getAuditReport);
app.get('/api/v1/admin/fares/history', fareController.getFareHistory);
app.post('/api/v1/admin/fares/draft', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), fareController.saveDraft);
app.post('/api/v1/admin/fares/publish', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), signature_1.verifyRequestSignature, fareController.publishFare);
app.post('/api/v1/admin/fares/rollback', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), fareController.rollbackFare);
app.get('/api/v1/admin/routes', routeController.getRoutes);
app.get('/api/v1/admin/routes/completeness-report', routeController.getCompletenessReport);
app.get('/api/v1/admin/routes/import-csv-status', routeController.getImportCsvStatus);
app.post('/api/v1/admin/routes', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), expressValidators_1.routeValidators, routeController.createRoute);
app.post('/api/v1/admin/routes/import-json', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), routeController.importJSON);
app.post('/api/v1/admin/routes/import-csv', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), routeController.importCSV);
app.post('/api/v1/admin/routes/import-gtfs', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), routeController.importGTFS);
app.post('/api/v1/admin/routes/:routeId/stops', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), expressValidators_1.routeIdParamValidator, expressValidators_1.stopValidators, routeController.addStopToRoute);
app.put('/api/v1/admin/routes/:routeId/stops/:stopId', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), routeController.updateRouteStop);
app.delete('/api/v1/admin/routes/:routeId/stops/:stopId', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), routeController.deleteRouteStop);
app.post('/api/v1/admin/routes/:routeId/reorder-stops', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), routeController.reorderRouteStops);
app.post('/api/v1/admin/routes/:routeId/verify', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), signature_1.verifyRequestSignature, routeController.verifyRoute);
app.patch('/api/v1/admin/routes/:id/status', (0, rbac_1.requireRole)('FARE_ADMIN', 'SUPER_ADMIN'), routeController.updateRouteStatus);
app.get('/api/v1/admin/compliance/stats', complianceController.getComplianceStats);
app.get('/api/v1/admin/activity-timeline', complianceController.getActivityTimeline);
app.get('/api/v1/admin/compliance/export', (0, rbac_1.requireRole)('AUDITOR', 'SUPER_ADMIN'), exportController.exportComplianceReport);
// Centralized 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Requested API endpoint does not exist.' },
        requestId: req.requestId
    });
});
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Safar Express Production Hardened Backend running on port ${PORT}`);
});
