require('events').EventEmitter.defaultMaxListeners = 5000;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { encryptField, decryptField, hashOtp } = require('./cryptoUtils');
const { MutexWriteQueue } = require('./mutexQueue');
const { deepRedact } = require('./sanitizer');
const {
  db,
  stmts,
  recordPaymentTx,
  getAvailableBalancePaise,
  requestPayoutTx,
  approvePayoutTx,
  rejectPayoutTx,
  markPaidPayoutTx,
  createSroDraftTx,
  acquireSroDraftLockTx,
  releaseSroDraftLockTx,
  publishSroVersionTx,
  rollbackSroVersionTx,
  getActiveSroVersion,
  getAllSroVersions,
  recordComplianceDiscrepancyTx,
  resolveDisputeTx,
  getComplianceDiscrepancies,
  getOperatorComplianceStats,
  getAggregatedTelemetryRecords,
  queryAggregatedTelemetry,
  recordPilotFeedbackTx,
  getPilotFeedbackRecords,
  updatePilotFeedbackTriageTx,
  getPilotKpiStats,
  searchPlaces,
  getRouteStops,
  reportMissingPlace,
  getPendingPlaces,
  verifyPlace,
  verifyPlacesBulkTx,
  findPotentialDuplicates,
  insertGpsPing,
  haversineDistanceKm,
  computeRulesChecksum,
  canonicalJsonStringify
} = require('./db');
const {
  fuzzCoordinate,
  timeBin,
  aggregateRoute,
  runAggregator,
  cleanupRawGpsPings
} = require('./telemetryAggregator');
const stateStore = require('./stateStore');
const metrics = require('./metrics');
const { detectGpsAnomaly } = require('./anomaly/gpsAnomaly');
const { recordPaymentFailure, recordPaymentSuccess, getAdminAlerts } = require('./anomaly/paymentAnomaly');
const { encryptBuffer, decryptBuffer } = require('./utils/encryptFile');
const multer = require('multer');

// Configure in-memory upload handling for driver KYC documents (max 5MB per file)
const kycUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const KYC_UPLOADS_DIR = path.join(__dirname, 'data', 'uploads', 'kyc');
if (!fs.existsSync(KYC_UPLOADS_DIR)) fs.mkdirSync(KYC_UPLOADS_DIR, { recursive: true });

stateStore.init({
  redisUrl: process.env.REDIS_URL || null,
});

const { setupLiveTracking, broadcastRealVehicleGps } = require('./websocket');

const app = express();
const server = http.createServer(app);
setupLiveTracking(server);
const PORT = process.env.PORT || 3000;

const activeAdminTokens = new Map();
let activeDriverTokens = new Map();
let driversStore = new Map();
let tripsLedger = [];
let driverEarningsLedger = new Map();
const sseClients = new Set();
let lastPingTimesMap = new Map();

const adminLoginRateLimitMap = new Map();
const adminSummaryRateLimitMap = new Map();
const DRIVER_SHIFT_SECRET = process.env.DRIVER_SHIFT_SECRET || 'safar-driver-secret-2026';
const upiIntentRateLimitMap = new Map();
const markPaidRateLimitMap = new Map();
const driverProfileRateLimitMap = new Map();
let recentBroadcastTimestamps = [];

const dbPath = path.join(__dirname, 'data', 'safar_ledger_db.json');
const ledgerMutexQueue = new MutexWriteQueue(dbPath, { maxBackups: 10, snapshotInterval: 10 });

function saveLedgerDb() {
  ledgerMutexQueue.enqueueWrite(() => {
    return {
      driversStore: Array.from(driversStore.entries()),
      tripsLedger,
      driverEarningsLedger: Array.from(driverEarningsLedger.entries())
    };
  });
}

function migrateLedgerEncryption() {
  let modified = false;
  for (const [vNo, profile] of driversStore.entries()) {
    if (profile.upiId && !profile.upiId.includes(':')) {
      profile.upiId = encryptField(profile.upiId);
      modified = true;
    }
    if (profile.bankAccount) {
      if (profile.bankAccount.accountNumber && !profile.bankAccount.accountNumber.includes(':')) {
        profile.bankAccount.accountNumber = encryptField(profile.bankAccount.accountNumber);
        modified = true;
      }
      if (profile.bankAccount.ifsc && !profile.bankAccount.ifsc.includes(':')) {
        profile.bankAccount.ifsc = encryptField(profile.bankAccount.ifsc);
        modified = true;
      }
      if (profile.bankAccount.accountHolderName && !profile.bankAccount.accountHolderName.includes(':')) {
        profile.bankAccount.accountHolderName = encryptField(profile.bankAccount.accountHolderName);
        modified = true;
      }
    }
  }
  if (modified) saveLedgerDb();
}

function loadLedgerDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf8');
      let data;
      try {
        data = MutexWriteQueue.verifyAndUnwrapData(raw);
      } catch (err) {
        console.warn('[Storage] Integrity checksum mismatch or invalid main file, attempting snapshot recovery:', err.message);
        data = MutexWriteQueue.recoverFromLatestSnapshot(dbPath);
      }

      if (data) {
        if (Array.isArray(data.driversStore)) {
          driversStore = new Map(data.driversStore);
        }
        if (Array.isArray(data.tripsLedger)) {
          tripsLedger = data.tripsLedger;
        }
        if (Array.isArray(data.driverEarningsLedger)) {
          driverEarningsLedger = new Map(data.driverEarningsLedger);
        }
        migrateLedgerEncryption();
      }
    }
  } catch (err) {
    console.error('Failed to load ledger DB:', err);
  }
}

loadLedgerDb();

const upiRateLimitTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of upiIntentRateLimitMap.entries()) {
    if (now - time > 10000) upiIntentRateLimitMap.delete(ip);
  }
  for (const [token, time] of markPaidRateLimitMap.entries()) {
    if (now - time > 10000) markPaidRateLimitMap.delete(token);
  }
  for (const [key, time] of driverProfileRateLimitMap.entries()) {
    if (now - time > 30000) driverProfileRateLimitMap.delete(key);
  }
}, 10 * 60 * 1000);
if (upiRateLimitTimer.unref) upiRateLimitTimer.unref();

function maskUpi(upiId) {
  if (!upiId || typeof upiId !== 'string') return '';
  const parts = upiId.split('@');
  if (parts.length !== 2) return '****@upi';
  const handle = parts[0];
  const domain = parts[1];
  if (handle.length <= 2) return `${handle[0]}****@${domain}`;
  return `${handle.substring(0, 2)}****@${domain}`;
}

function maskAccount(acc) {
  if (!acc || typeof acc !== 'string') return '******';
  if (acc.length <= 4) return '******';
  return '*'.repeat(acc.length - 4) + acc.slice(-4);
}

function authenticateDriverToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-driver-token']) {
    token = req.headers['x-driver-token'];
  }

  if (!token || !activeDriverTokens.has(token)) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Valid driver shift token required.' }
    });
  }

  req.driverSession = activeDriverTokens.get(token);
  req.driverToken = token;
  next();
}

function pruneBroadcastTimestamps() {
  const cutoff = Date.now() - 60000;
  recentBroadcastTimestamps = recentBroadcastTimestamps.filter(t => t > cutoff);
}

function recordBroadcastTimestamp() {
  recentBroadcastTimestamps.push(Date.now());
  pruneBroadcastTimestamps();
}

function cleanupAdminState() {
  const now = Date.now();
  for (const [token, meta] of activeAdminTokens.entries()) {
    if (now >= meta.expiresAt) activeAdminTokens.delete(token);
  }
  const window15m = 15 * 60 * 1000;
  for (const [ip, data] of adminLoginRateLimitMap.entries()) {
    data.attempts = data.attempts.filter(t => now - t < window15m);
    if (data.attempts.length === 0) adminLoginRateLimitMap.delete(ip);
  }
  for (const token of adminSummaryRateLimitMap.keys()) {
    if (!activeAdminTokens.has(token)) adminSummaryRateLimitMap.delete(token);
  }
}

const adminCleanupTimer = setInterval(cleanupAdminState, 15 * 60 * 1000);
if (adminCleanupTimer.unref) adminCleanupTimer.unref();


// ─── IN-MEMORY STATE & DB ADAPTER FALLBACK ─────────────────────────────────────

let usersDb = [
  {
    id: "usr-admin-001",
    username: "admin",
    role: "SUPER_ADMIN",
    // Salted SHA-256 hash for secure admin authentication
    passwordHash: "73c7c184cef2050483d7cfeca06d66047cb7fb84f441bb47cde9b9d198d87566",
    salt: "safar_salt_2026",
    failedAttempts: 0,
    lockoutUntil: null,
    createdAt: new Date().toISOString()
  }
];

let activeSessions = {}; // token -> { userId, role, username, expiresAt, csrfToken }
let processedIdempotencyKeys = new Set();

let draftFareConfig = null; // Stored fare slab draft

let fareVersionsHistory = [
  {
    version: 20260801,
    publishedBy: "admin",
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "PUBLISHED",
    reason: "Initial Transport Commission Fare Schedule 2026",
    rates: {
      Kashmir: { plain: 1.40, hilly: 1.70 },
      Jammu: { plain: 1.35, hilly: 1.65 }
    },
    slabs: { 3: 9, 5: 14, 10: 17, 15: 20, 20: 26 },
    vehicleMultipliers: { minibus: 1.0, tatamagic: 1.10, sharedvan: 1.15 }
  }
];

let routesDatabase = [
  {
    id: "route-001",
    code: "SRN-BUD-01",
    name: "Lal Chowk ↔ Budgam Stand",
    origin: "Lal Chowk",
    destination: "Budgam Stand",
    region: "Kashmir",
    terrain: "plain",
    distanceKm: 14.0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    createdBy: "admin"
  },
  {
    id: "route-002",
    code: "SRN-ANT-02",
    name: "Srinagar ↔ Anantnag Express",
    origin: "Srinagar",
    destination: "Anantnag",
    region: "Kashmir",
    terrain: "plain",
    distanceKm: 54.2,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    createdBy: "admin"
  },
  {
    id: "route-003",
    code: "JAM-KAT-03",
    name: "Jammu Tawi ↔ Katra Vaishno Devi",
    origin: "Jammu Tawi",
    destination: "Katra",
    region: "Jammu",
    terrain: "hilly",
    distanceKm: 48.0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    createdBy: "admin"
  }
];

let auditLogs = [
  {
    eventId: "evt-init-001",
    actorId: "admin",
    actorRole: "SUPER_ADMIN",
    action: "SYSTEM_INITIALIZED",
    resourceType: "SYSTEM",
    resourceId: "SYS_01",
    timestamp: new Date().toISOString(),
    ipAddress: "127.0.0.1",
    result: "SUCCESS"
  }
];

let auditedTransactions = []; // Raw audited transit transactions
let operatorViolationsData = []; // Aggregated operator violation audit records

let activeTripsStore = {};
let sosAlertsStore = [];
const otpMemoryCache = new Map();

// ─── HELPER FUNCTIONS & SECURITY PIPELINE ──────────────────────────────────────

function hashPassword(password, salt = "safar_salt_2026") {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function logAuditEvent(actorId, actorRole, action, resourceType, resourceId, ipAddress, result = "SUCCESS", details = null) {
  const event = {
    eventId: generateId("evt"),
    actorId: actorId || "ANONYMOUS",
    actorRole: actorRole || "UNAUTHENTICATED",
    action,
    resourceType,
    resourceId,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: ipAddress || "127.0.0.1",
    result
  };
  auditLogs.unshift(event);
  return event;
}

// CSV Formula Injection Sanitizer
function sanitizeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str; // Escape execution operator
  }
  return '"' + str.replace(/"/g, '""') + '"';
}

// ─── MIDDLEWARE SETUP ──────────────────────────────────────────────────────────

app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Allowed Origins Middleware
const allowedOrigins = [
  'https://safarkashmir.in',
  'https://www.safarkashmir.in',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'capacitor://localhost',
  'http://localhost'
];

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',').forEach(o => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin) ||
      origin.startsWith('capacitor://')
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

// Helmet & Dynamic Security Headers Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://*.basemaps.cartocdn.com", "https://maps.gstatic.com", "https://*.googleapis.com"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"]
    }
  },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

app.use((req, res, next) => {
  req.requestId = generateId("req");
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Serve Frontend Application Files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Friendly Root Portal Redirects
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.get('/commuter', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));
app.get('/driver', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));


// Authentication Middleware
function authenticateSession(req, res, next) {
  const authHeader = req.headers['authorization'];
  const cookieHeader = req.headers['cookie'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [k, v] = cookie.trim().split('=');
      acc[k] = v;
      return acc;
    }, {});
    token = cookies['safar_admin_session'];
  }

  if (!token || !activeSessions[token]) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Active session invalid or expired.' },
      requestId: req.requestId
    });
  }

  const session = activeSessions[token];
  if (Date.now() > session.expiresAt) {
    delete activeSessions[token];
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'SESSION_EXPIRED', message: 'Session expired. Please log in again.' },
      requestId: req.requestId
    });
  }

  req.user = session;
  req.sessionToken = token;
  next();
}

// Role-Based Access Control Middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logAuditEvent(req.user ? req.user.username : 'UNKNOWN', req.user ? req.user.role : 'NONE', 'ACCESS_DENIED', 'API_ENDPOINT', req.originalUrl, req.ip, 'FORBIDDEN');
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'Access denied. Insufficient administrator privileges.' },
        requestId: req.requestId
      });
    }
    next();
  };
}

// CSRF Token Verification Middleware
function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  const clientCsrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;
  if (!req.user || !clientCsrfToken || clientCsrfToken !== req.user.csrfToken) {
    return res.status(403).json({
      success: false,
      data: null,
      error: { code: 'CSRF_INVALID', message: 'Invalid or missing CSRF security token.' },
      requestId: req.requestId
    });
  }
  next();
}

// Idempotency Middleware for State-Changing Requests
function checkIdempotency(req, res, next) {
  const idempotencyKey = req.headers['x-idempotency-key'];
  if (idempotencyKey) {
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      return res.status(409).json({
        success: false,
        data: null,
        error: { code: 'DUPLICATE_REQUEST', message: 'Duplicate transaction detected. Request already processed.' },
        requestId: req.requestId
      });
    }
    req.idempotencyKey = idempotencyKey;
  }
  next();
}

// ─── AUTHENTICATION ENDPOINTS ─────────────────────────────────────────────────

app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  const clientIp = req.ip || req.socket.remoteAddress;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: 'INVALID_INPUT', message: 'Username and password are required.' },
      requestId: req.requestId
    });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const user = usersDb.find(u => u.username.toLowerCase() === cleanUser);

  if (!user) {
    logAuditEvent(cleanUser, 'UNAUTHENTICATED', 'LOGIN_FAILURE', 'USER', cleanUser, clientIp, 'USER_NOT_FOUND');
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin username or password.' },
      requestId: req.requestId
    });
  }

  if (user.lockoutUntil && Date.now() < user.lockoutUntil) {
    const remainingSecs = Math.ceil((user.lockoutUntil - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      data: null,
      error: { code: 'ACCOUNT_LOCKED', message: `Account locked due to rate limiting. Try again in ${remainingSecs}s.` },
      requestId: req.requestId
    });
  }

  const inputHash = hashPassword(password, user.salt);
  const isValidPass = (inputHash === user.passwordHash);

  if (!isValidPass) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= 5) {
      user.lockoutUntil = Date.now() + 60000;
    }
    logAuditEvent(user.username, user.role, 'LOGIN_FAILURE', 'USER', user.id, clientIp, 'INVALID_PASSWORD');
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin username or password.' },
      requestId: req.requestId
    });
  }

  user.failedAttempts = 0;
  user.lockoutUntil = null;

  const sessionToken = "session_" + crypto.randomBytes(24).toString('hex');
  const csrfToken = "csrf_" + crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 8 * 3600 * 1000;

  activeSessions[sessionToken] = {
    userId: user.id,
    username: user.username,
    role: user.role,
    expiresAt,
    csrfToken
  };

  logAuditEvent(user.username, user.role, 'LOGIN_SUCCESS', 'USER', user.id, clientIp, 'SUCCESS');

  res.cookie('safar_admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 3600 * 1000
  });

  return res.json({
    success: true,
    data: {
      token: sessionToken,
      csrfToken,
      user: { id: user.id, username: user.username, role: user.role },
      expiresAt: new Date(expiresAt).toISOString()
    },
    error: null,
    requestId: req.requestId
  });
});

app.post('/api/v1/auth/logout', authenticateSession, (req, res) => {
  delete activeSessions[req.sessionToken];
  logAuditEvent(req.user.username, req.user.role, 'ADMIN_LOGOUT', 'USER', req.user.userId, req.ip, 'SUCCESS');
  res.clearCookie('safar_admin_session');
  return res.json({
    success: true,
    data: { message: 'Logged out successfully.' },
    error: null,
    requestId: req.requestId
  });
});

app.get('/api/v1/auth/session', authenticateSession, (req, res) => {
  return res.json({
    success: true,
    data: {
      user: { id: req.user.userId, username: req.user.username, role: req.user.role },
      csrfToken: req.user.csrfToken,
      expiresAt: new Date(req.user.expiresAt).toISOString()
    },
    error: null,
    requestId: req.requestId
  });
});

app.post('/api/v1/auth/change-password', authenticateSession, verifyCsrf, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: 'INVALID_PASSWORD', message: 'New password must be at least 8 characters long.' },
      requestId: req.requestId
    });
  }

  const user = usersDb.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, data: null, error: { code: 'USER_NOT_FOUND', message: 'User account not found.' }, requestId: req.requestId });
  }

  const currHash = hashPassword(currentPassword, user.salt);
  if (currHash !== user.passwordHash) {
    logAuditEvent(req.user.username, req.user.role, 'PASSWORD_CHANGE_FAILED', 'USER', user.id, req.ip, 'INVALID_CURRENT_PASSWORD');
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password provided is incorrect.' },
      requestId: req.requestId
    });
  }

  user.passwordHash = hashPassword(newPassword, user.salt);
  logAuditEvent(req.user.username, req.user.role, 'PASSWORD_CHANGED', 'USER', user.id, req.ip, 'SUCCESS');

  return res.json({
    success: true,
    data: { message: 'Password updated successfully on server.' },
    error: null,
    requestId: req.requestId
  });
});

// ─── FARE MANAGEMENT API (DRAFT -> REVIEW -> PUBLISH & OCC & ROLLBACK) ─────────

app.get('/api/v1/admin/fares/current', (req, res) => {
  const current = fareVersionsHistory.find(v => v.status === 'PUBLISHED') || fareVersionsHistory[0];
  return res.json({
    success: true,
    data: current,
    error: null,
    requestId: req.requestId
  });
});

app.get('/api/v1/admin/fares/draft', authenticateSession, (req, res) => {
  return res.json({
    success: true,
    data: draftFareConfig,
    error: null,
    requestId: req.requestId
  });
});

app.post('/api/v1/admin/fares/draft', authenticateSession, requireRole('SUPER_ADMIN', 'FARE_ADMIN'), verifyCsrf, (req, res) => {
  const { rates, slabs, vehicleMultipliers, notes } = req.body;
  
  draftFareConfig = {
    draftId: generateId("draft"),
    savedBy: req.user.username,
    savedAt: new Date().toISOString(),
    notes: notes || "Draft prepared for Transit Regulatory Council review",
    rates,
    slabs,
    vehicleMultipliers
  };

  logAuditEvent(req.user.username, req.user.role, 'FARE_DRAFT_CREATED', 'FARE_DRAFT', draftFareConfig.draftId, req.ip, 'SUCCESS');

  return res.json({
    success: true,
    data: draftFareConfig,
    error: null,
    requestId: req.requestId
  });
});

app.get('/api/v1/admin/fares/history', authenticateSession, (req, res) => {
  return res.json({
    success: true,
    data: fareVersionsHistory,
    error: null,
    requestId: req.requestId
  });
});

// Publish Fare Slabs with Optimistic Concurrency Control (OCC) & Idempotency
app.post('/api/v1/admin/fares/publish', authenticateSession, requireRole('SUPER_ADMIN', 'FARE_ADMIN'), verifyCsrf, checkIdempotency, (req, res) => {
  const { rates, slabs, vehicleMultipliers, reason, expectedBaseVersion } = req.body;

  const currentActive = fareVersionsHistory.find(v => v.status === 'PUBLISHED') || fareVersionsHistory[0];

  // Optimistic Concurrency Control (OCC) Verification
  if (expectedBaseVersion && parseInt(expectedBaseVersion) !== currentActive.version) {
    logAuditEvent(req.user.username, req.user.role, 'FARE_PUBLISH_CONFLICT', 'FARE_VERSION', String(expectedBaseVersion), req.ip, 'OCC_REJECTED');
    return res.status(409).json({
      success: false,
      data: null,
      error: {
        code: 'STALE_VERSION_CONFLICT',
        message: `Publish rejected due to concurrency conflict. Expected version v${expectedBaseVersion}, but active version is v${currentActive.version}. Please refresh.`
      },
      requestId: req.requestId
    });
  }

  if (!rates || !slabs) {
    return res.status(422).json({
      success: false,
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Rates and slabs structure required.' },
      requestId: req.requestId
    });
  }

  // Numerical Range & Ordering Validation
  const slabKeys = Object.keys(slabs).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < slabKeys.length; i++) {
    if (isNaN(slabs[slabKeys[i]]) || slabs[slabKeys[i]] <= 0) {
      return res.status(422).json({
        success: false,
        data: null,
        error: { code: 'INVALID_SLAB_VALUE', message: `Invalid numerical rate for slab ${slabKeys[i]}km.` },
        requestId: req.requestId
      });
    }
  }

  const newVersionNumber = parseInt(Date.now().toString().substring(0, 10));

  // Immutable Version Marking
  fareVersionsHistory.forEach(v => {
    if (v.status === 'PUBLISHED') v.status = 'SUPERSEDED';
  });

  const newVersionRecord = {
    version: newVersionNumber,
    publishedBy: req.user.username,
    publishedAt: new Date().toISOString(),
    previousVersion: currentActive.version,
    status: 'PUBLISHED',
    reason: reason || 'Administrative Fare Schedule Update',
    rates: {
      Kashmir: {
        plain: parseFloat(rates.Kashmir?.plain) || 1.40,
        hilly: parseFloat(rates.Kashmir?.hilly) || 1.70
      },
      Jammu: {
        plain: parseFloat(rates.Jammu?.plain) || 1.35,
        hilly: parseFloat(rates.Jammu?.hilly) || 1.65
      }
    },
    slabs: {
      3: parseFloat(slabs[3]) || 9,
      5: parseFloat(slabs[5]) || 14,
      10: parseFloat(slabs[10]) || 17,
      15: parseFloat(slabs[15]) || 20,
      20: parseFloat(slabs[20]) || 26
    },
    vehicleMultipliers: vehicleMultipliers || { minibus: 1.0, tatamagic: 1.10, sharedvan: 1.15 }
  };

  fareVersionsHistory.unshift(newVersionRecord);
  draftFareConfig = null; // Clear draft upon publish

  if (req.idempotencyKey) {
    processedIdempotencyKeys.add(req.idempotencyKey);
  }

  logAuditEvent(req.user.username, req.user.role, 'FARE_PUBLISHED', 'FARE_VERSION', String(newVersionNumber), req.ip, 'SUCCESS', { previousVersion: currentActive.version });

  return res.json({
    success: true,
    data: newVersionRecord,
    error: null,
    requestId: req.requestId
  });
});

// Rollback Published Fare Version
app.post('/api/v1/admin/fares/rollback', authenticateSession, requireRole('SUPER_ADMIN', 'FARE_ADMIN'), verifyCsrf, (req, res) => {
  if (fareVersionsHistory.length < 2) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: 'NO_PREVIOUS_VERSION', message: 'Cannot perform rollback. No previous historical fare version exists.' },
      requestId: req.requestId
    });
  }

  const currentActive = fareVersionsHistory.find(v => v.status === 'PUBLISHED');
  if (currentActive) {
    currentActive.status = 'ROLLED_BACK';
  }

  // Find most recent superseded version
  const previousVersion = fareVersionsHistory.find(v => v.status === 'SUPERSEDED') || fareVersionsHistory[1];
  previousVersion.status = 'PUBLISHED';

  logAuditEvent(req.user.username, req.user.role, 'FARE_ROLLED_BACK', 'FARE_VERSION', String(previousVersion.version), req.ip, 'SUCCESS', { rolledBackVersion: currentActive ? currentActive.version : null });

  return res.json({
    success: true,
    data: {
      message: `Successfully rolled back to version v${previousVersion.version}.`,
      activeVersion: previousVersion
    },
    error: null,
    requestId: req.requestId
  });
});

// ─── ROUTE MANAGEMENT API ─────────────────────────────────────────────────────

app.get('/api/v1/admin/routes', (req, res) => {
  return res.json({
    success: true,
    data: routesDatabase,
    error: null,
    requestId: req.requestId
  });
});

app.post('/api/v1/admin/routes', authenticateSession, requireRole('SUPER_ADMIN', 'FARE_ADMIN'), verifyCsrf, (req, res) => {
  const { name, origin, destination, region, terrain, distanceKm } = req.body;

  if (!name || !origin || !destination || !distanceKm || distanceKm <= 0) {
    return res.status(422).json({
      success: false,
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Valid route name, origin, destination, and distance required.' },
      requestId: req.requestId
    });
  }

  const newRoute = {
    id: generateId("route"),
    code: `JK-${region ? region.substring(0,3).toUpperCase() : 'RT'}-${Math.floor(10 + Math.random() * 90)}`,
    name,
    origin,
    destination,
    region: region || "Kashmir",
    terrain: terrain || "plain",
    distanceKm: parseFloat(distanceKm),
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    createdBy: req.user.username
  };

  routesDatabase.push(newRoute);
  logAuditEvent(req.user.username, req.user.role, 'ROUTE_CREATED', 'ROUTE', newRoute.id, req.ip, 'SUCCESS');

  return res.status(201).json({
    success: true,
    data: newRoute,
    error: null,
    requestId: req.requestId
  });
});

// ─── COMPLIANCE, ACTIVITY TIMELINE & AUDIT EXPORT ──────────────────────────────

app.get('/api/v1/admin/compliance/stats', authenticateSession, (req, res) => {
  const totalTrips = auditedTransactions.length;
  
  if (totalTrips === 0) {
    return res.json({
      success: true,
      data: {
        noData: true,
        reportDate: new Date().toISOString().slice(0, 10),
        authority: "Transport Administration Platform (Compliance Audit)",
        totalTrips: 0,
        breakdown: { digitalPayments: 0, cashPayments: 0 },
        complianceMetrics: {
          compliantTrips: 0,
          overchargeTrips: 0,
          overchargeRatePercent: 0,
          totalOverchargeAmountRupees: "0.00"
        },
        operatorViolations: []
      },
      error: null,
      requestId: req.requestId
    });
  }

  const digitalPayments = auditedTransactions.filter(t => t.paymentMethod !== 'cash').length;
  const cashPayments = auditedTransactions.filter(t => t.paymentMethod === 'cash').length;
  const overchargeTrips = auditedTransactions.filter(t => t.discrepancyFlag).length;
  const compliantTrips = totalTrips - overchargeTrips;
  const overchargeRatePercent = Number(((overchargeTrips / totalTrips) * 100).toFixed(2));

  return res.json({
    success: true,
    data: {
      noData: false,
      reportDate: new Date().toISOString().slice(0, 10),
      authority: "Transport Administration Platform (Compliance Audit)",
      totalTrips,
      breakdown: { digitalPayments, cashPayments },
      complianceMetrics: {
        compliantTrips,
        overchargeTrips,
        overchargeRatePercent,
        totalOverchargeAmountRupees: "0.00"
      },
      operatorViolations: operatorViolationsData
    },
    error: null,
    requestId: req.requestId
  });
});

app.get('/api/v1/admin/activity-timeline', authenticateSession, (req, res) => {
  return res.json({
    success: true,
    data: auditLogs.slice(0, 20),
    error: null,
    requestId: req.requestId
  });
});

app.get('/api/v1/admin/audit-logs', authenticateSession, requireRole('SUPER_ADMIN', 'AUDITOR'), (req, res) => {
  return res.json({
    success: true,
    data: auditLogs,
    error: null,
    requestId: req.requestId
  });
});

// CSV Export Generator with Formula Injection Defense
app.get('/api/v1/admin/compliance/export', authenticateSession, requireRole('SUPER_ADMIN', 'FARE_ADMIN', 'AUDITOR'), (req, res) => {
  const format = (req.query.format || 'json').toLowerCase();
  logAuditEvent(req.user.username, req.user.role, 'AUDIT_EXPORTED', 'TRANSPORT_AUDIT', format.toUpperCase(), req.ip, 'SUCCESS');

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Transport_Operator_Violations_${Date.now()}.csv"`);

    let csvContent = "Operator ID,Operator Name,Transit Permit Registration,Overcharge Count,Overcharge Rate (%),Compliance Score,Recommended Action,Top Violating Routes\n";
    operatorViolationsData.forEach(op => {
      csvContent += [
        sanitizeCsvValue(op.operator_id),
        sanitizeCsvValue(op.operator_name),
        sanitizeCsvValue(op.permit_registration),
        sanitizeCsvValue(op.overcharge_count),
        sanitizeCsvValue(op.overcharge_rate_percent),
        sanitizeCsvValue(op.compliance_score),
        sanitizeCsvValue(op.recommended_action),
        sanitizeCsvValue(op.top_violating_routes.join('; '))
      ].join(',') + '\n';
    });

    return res.send(csvContent);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="Transport_Audit_Report_${Date.now()}.json"`);
  return res.json({
    exportMetadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.username,
      tenant: "Transport Administration Platform",
      classification: "ADMINISTRATIVE_AUDIT_REPORT"
    },
    activeFareVersion: fareVersionsHistory[0],
    operatorViolations: operatorViolationsData,
    recentAuditLogs: auditLogs.slice(0, 50)
  });
});

// ─── TELEMETRY & OPEN GTFS-RT APIs ───────────────────────────────────────────

app.get('/api/v1/gtfs-rt/vehicle-positions', (req, res) => {
  const vehicles = Object.values(activeTripsStore).map(t => ({
    id: t.tripId,
    vehicle: { id: t.vehicleNo, label: t.vehicleNo },
    position: { latitude: t.lat, longitude: t.lng, bearing: t.heading, speed: t.speedKmh / 3.6 },
    timestamp: Math.floor(t.lastPing / 1000),
    occupancy_status: t.occupancy
  }));

  res.json({
    header: { gtfs_realtime_version: '2.0', incrementality: 'FULL_DATASET', timestamp: Math.floor(Date.now() / 1000) },
    entity: vehicles
  });
});

app.post('/api/v1/telemetry/ping', (req, res) => {
  const { t_id, lat, lng, sp, hd, occupancy, vehicleNo, routeName } = req.body;
  if (!t_id || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, error: 'Missing required telemetry fields' });
  }

  activeTripsStore[t_id] = {
    tripId: t_id,
    vehicleNo: vehicleNo || 'JK01-AV-9912',
    routeName: routeName || 'Srinagar ↔ Anantnag',
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    speedKmh: parseFloat(sp) || 0,
    heading: parseInt(hd) || 0,
    occupancy: occupancy || 'LIGHT',
    lastPing: Date.now()
  };

  res.json({ success: true, timestamp: Date.now() });
});

nonLocalPermitsStore = [
  {
    id: 'perm-001',
    permitNumber: 'JK/NLP/2026/PB/1082',
    vehicleRegNumber: 'PB-08-AB-1234',
    operatorName: 'Punjab Roadways / Deluxe Super Express',
    homeState: 'PB',
    vehicleCategory: 'STAGE_CARRIAGE_PERMIT',
    entryBorderPost: 'Lakhanpur',
    inspectionCheckpoint: 'Lakhanpur Barrier Naaka 1',
    corridorDescription: 'Lakhanpur to Srinagar via NH-44',
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: '2026-08-31T23:59:59Z',
    status: 'VERIFIED',
    taxFeePaidAmount: 3500,
    challanNumber: 'JK/CHAL/2026/0891'
  },
  {
    id: 'perm-002',
    permitNumber: 'JK/NLP/2026/DL/4412',
    vehicleRegNumber: 'DL-01-TA-9988',
    operatorName: 'North Star Travels Pvt Ltd',
    homeState: 'DL',
    vehicleCategory: 'ALL_INDIA_TOURIST_PERMIT',
    entryBorderPost: 'Lakhanpur',
    inspectionCheckpoint: 'Lakhanpur Highway Post',
    corridorDescription: 'Delhi to Gulmarg Tourist Corridor',
    validFrom: '2026-08-10T00:00:00Z',
    validUntil: '2026-08-25T23:59:59Z',
    status: 'VERIFIED',
    taxFeePaidAmount: 2800,
    challanNumber: 'JK/CHAL/2026/1042'
  },
  {
    id: 'perm-003',
    permitNumber: 'JK/NLP/2026/HP/3011',
    vehicleRegNumber: 'HP-12-C-5678',
    operatorName: 'Himachal Volvo Express Line',
    homeState: 'HP',
    vehicleCategory: 'CONTRACT_CARRIAGE_PERMIT',
    entryBorderPost: 'Banihal Tunnel',
    inspectionCheckpoint: 'Banihal Security Post',
    corridorDescription: 'Shimla to Jammu Tawi',
    validFrom: '2026-08-15T00:00:00Z',
    validUntil: '2026-08-22T23:59:59Z',
    status: 'PENDING',
    taxFeePaidAmount: 1500,
    challanNumber: 'JK/CHAL/2026/1120'
  }
];

let sroNotificationsStore = [
  {
    id: 'sro-2026-97',
    sroNumber: 'SRO-97 / MVD-2026',
    authority: 'J&K Transport Department',
    notificationNumber: 'SRO-97 / MVD-2026',
    notificationDate: '2026-05-01',
    issuedDate: '2026-04-01',
    effectiveDate: '2026-05-01',
    title: 'J&K Motor Transport Stage Carriage Rate Revision',
    summary: 'Notified maximum ceiling rates: Plain terrain ₹1.40/km, Hilly terrain ₹1.70/km. Statutory base fare ₹9 for 0–3 km.',
    status: 'ACTIVE_GAZETTE',
    fareRules: [
      { vehicleType: 'MINI_BUS', fareBasis: 'DISTANCE_SLAB', perKmRate: 1.40, verificationStatus: 'VERIFIED' }
    ]
  }
];

app.get('/api/v1/sro/notifications', (req, res) => {
  res.json({ success: true, data: sroNotificationsStore });
});
// Stale Trip Pruner (Prunes inactive trips older than 15 seconds)
const staleTripTimer = setInterval(async () => {
  const now = Date.now();
  for (const [vehicleNo, trip] of Object.entries(activeTripsStore)) {
    if (now - (trip.lastSeen || 0) > 15000) {
      delete activeTripsStore[vehicleNo];
      await stateStore.removeSnapshot(vehicleNo);
      await stateStore.publish('telemetry.trip_removed', { vehicleNo });
    }
  }
}, 5000);
if (staleTripTimer.unref) staleTripTimer.unref();

// ─── DRIVER ONBOARDING & KYC VERIFICATION SYSTEM (SPRINT 7) ─────────────────

// 1. Driver Registration / Onboarding Endpoint
app.post('/api/v1/driver/onboard', (req, res) => {
  const { phone, name, vehicleNo, upiId } = req.body || {};

  if (!phone || !name || !vehicleNo || !upiId) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'phone, name, vehicleNo, and upiId are required.' }
    });
  }

  const cleanVehicleNo = String(vehicleNo).trim().toUpperCase();
  const phoneEnc = encryptField(String(phone).trim());
  const nameEnc = encryptField(String(name).trim());
  const upiEnc = encryptField(String(upiId).trim());

  try {
    stmts.upsertDriverKycOnboard.run(phoneEnc, nameEnc, cleanVehicleNo, upiEnc);

    // Also register in driver_profiles for backward compatibility
    if (stmts.upsertDriver) {
      stmts.upsertDriver.run(cleanVehicleNo, String(name).trim(), upiEnc, null, null, null);
    }

    const driverToken = `drv_tok_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = Date.now() + 24 * 3600 * 1000;

    activeDriverTokens.set(driverToken, {
      vehicleNo: cleanVehicleNo,
      routeId: 'DEFAULT',
      vehicleType: 'MINI_BUS',
      expiresAt
    });

    stmts.insertAudit.run(
      `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      cleanVehicleNo,
      'DRIVER',
      'DRIVER_ONBOARD_INITIATED',
      'DRIVER_KYC',
      cleanVehicleNo,
      JSON.stringify({ vehicleNo: cleanVehicleNo, kyc_status: 'not_submitted' }),
      req.ip || '127.0.0.1',
      'SUCCESS'
    );

    res.status(201).json({
      success: true,
      data: {
        driverToken,
        vehicleNo: cleanVehicleNo,
        kycStatus: 'not_submitted',
        expiresAt
      }
    });
  } catch (err) {
    console.error('[Driver Onboarding Error]', err);
    res.status(500).json({ success: false, error: { code: 'ONBOARD_FAILED', message: err.message } });
  }
});

// 2. Driver KYC Document Upload Endpoint (Multipart encrypted at rest)
app.post(
  '/api/v1/driver/kyc/upload',
  kycUpload.fields([
    { name: 'licence', maxCount: 1 },
    { name: 'vehicleRc', maxCount: 1 },
    { name: 'routePermit', maxCount: 1 }
  ]),
  async (req, res) => {
    let token = req.body?.token;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token || !activeDriverTokens.has(token)) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Valid driver token required.' } });
    }

    const driverSession = activeDriverTokens.get(token);
    const vehicleNo = driverSession.vehicleNo;

    // Check if KYC already approved
    const existingDriver = stmts.getDriverByVehicle.get(vehicleNo);
    if (existingDriver && existingDriver.kyc_status === 'approved') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_APPROVED', message: 'Driver KYC is already approved.' } });
    }

    const files = req.files || {};
    const licenceFile = files.licence?.[0];
    const rcFile = files.vehicleRc?.[0];
    const permitFile = files.routePermit?.[0];

    if (!licenceFile || !rcFile || !permitFile) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_DOCUMENTS', message: 'All 3 documents (licence, vehicleRc, routePermit) are required.' }
      });
    }

    // Validate file types
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    for (const f of [licenceFile, rcFile, permitFile]) {
      if (!allowedMimeTypes.includes(f.mimetype)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_FILE_TYPE', message: `Invalid file type for ${f.fieldname}. Only JPG, PNG, and PDF accepted.` }
        });
      }
    }

    try {
      // Encrypt and save files to disk
      const docPaths = {};
      for (const [key, fileObj] of Object.entries({ licence: licenceFile, vehicleRc: rcFile, routePermit: permitFile })) {
        const fileId = `kyc_${vehicleNo}_${key}_${crypto.randomBytes(6).toString('hex')}`;
        const encryptedBuffer = encryptBuffer(fileObj.buffer);
        const diskPath = path.join(KYC_UPLOADS_DIR, `${fileId}.enc`);
        fs.writeFileSync(diskPath, encryptedBuffer);
        docPaths[key] = encryptField(diskPath);
      }

      stmts.updateDriverKycDocs.run(
        docPaths.licence,
        docPaths.vehicleRc,
        docPaths.routePermit,
        vehicleNo
      );

      stmts.insertAudit.run(
        `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        vehicleNo,
        'DRIVER',
        'DRIVER_KYC_SUBMITTED',
        'DRIVER_KYC',
        vehicleNo,
        JSON.stringify({ vehicleNo, kyc_status: 'pending' }),
        req.ip || '127.0.0.1',
        'SUCCESS'
      );

      res.status(201).json({
        success: true,
        data: {
          vehicleNo,
          kycStatus: 'pending',
          submittedAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('[KYC Upload Error]', err);
      res.status(500).json({ success: false, error: { code: 'UPLOAD_FAILED', message: err.message } });
    }
  }
);

// 3. Driver KYC Status Endpoint
app.get('/api/v1/driver/kyc/status', (req, res) => {
  let token = req.query?.token;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  let vehicleNo = req.query?.vehicleNo;
  if (token && activeDriverTokens.has(token)) {
    vehicleNo = activeDriverTokens.get(token).vehicleNo;
  }

  if (!vehicleNo) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Valid driver token or vehicleNo required.' } });
  }

  const driver = stmts.getDriverByVehicle.get(vehicleNo);
  if (!driver) {
    return res.status(404).json({ success: false, error: { code: 'DRIVER_NOT_FOUND', message: 'Driver not found.' } });
  }

  res.json({
    success: true,
    data: {
      vehicleNo: driver.driver_vehicle_no,
      status: driver.kyc_status,
      submittedAt: driver.kyc_submitted_at,
      rejectionReason: driver.kyc_rejection_reason,
      verifiedAt: driver.kyc_verified_at
    }
  });
});

// 4. Admin KYC Pending Queue
app.get('/api/v1/admin/kyc/pending', (req, res) => {
  try {
    const pendingDrivers = stmts.getPendingKycDrivers.all();
    const cleanList = pendingDrivers.map(d => {
      let plainName = 'Driver';
      let plainPhone = '0000000000';
      try { plainName = decryptField(d.driver_name); } catch(e) {}
      try { plainPhone = decryptField(d.driver_phone); } catch(e) {}

      return {
        id: d.id,
        vehicleNo: d.driver_vehicle_no,
        name: plainName,
        phoneMasked: plainPhone.slice(0, 3) + '****' + plainPhone.slice(-3),
        kycStatus: d.kyc_status,
        submittedAt: d.kyc_submitted_at
      };
    });

    res.json({ success: true, count: cleanList.length, data: cleanList });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: err.message } });
  }
});

// 5. Admin KYC Review & Verification (Approve / Reject)
app.post('/api/v1/admin/kyc/verify', (req, res) => {
  const { driverId, vehicleNo, action, reason } = req.body || {};

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'Action must be "approve" or "reject".' } });
  }

  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    return res.status(400).json({ success: false, error: { code: 'REASON_REQUIRED', message: 'A rejection reason is required.' } });
  }

  const targetVehicle = vehicleNo || (driverId ? stmts.getDriverById.get(driverId)?.driver_vehicle_no : null);
  if (!targetVehicle) {
    return res.status(404).json({ success: false, error: { code: 'DRIVER_NOT_FOUND', message: 'Driver not found.' } });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const rejectionReason = action === 'reject' ? reason.trim() : null;
  const adminId = req.headers['x-admin-id'] || 'admin_super';

  try {
    stmts.verifyDriverKyc.run(newStatus, rejectionReason, adminId, targetVehicle, driverId || 0);

    stmts.insertAudit.run(
      `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      adminId,
      'ADMIN',
      `DRIVER_KYC_${action.toUpperCase()}`,
      'DRIVER_KYC',
      targetVehicle,
      JSON.stringify({ vehicleNo: targetVehicle, action, newStatus, reason: rejectionReason }),
      req.ip || '127.0.0.1',
      'SUCCESS'
    );

    res.json({
      success: true,
      data: {
        vehicleNo: targetVehicle,
        kycStatus: newStatus,
        verifiedAt: new Date().toISOString(),
        verifiedBy: adminId
      }
    });
  } catch (err) {
    console.error('[Admin KYC Verify Error]', err);
    res.status(500).json({ success: false, error: { code: 'VERIFICATION_FAILED', message: err.message } });
  }
});

// 6. Admin Document Viewer (Decrypts and streams securely)
app.get('/api/v1/admin/kyc/document/:vehicleNo/:docType', (req, res) => {
  const { vehicleNo, docType } = req.params;
  const driver = stmts.getDriverByVehicle.get(vehicleNo);

  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver not found.' });
  }

  let encPathField = null;
  if (docType === 'licence') encPathField = driver.kyc_doc_licence;
  else if (docType === 'rc' || docType === 'vehicleRc') encPathField = driver.kyc_doc_vehicle_rc;
  else if (docType === 'permit' || docType === 'routePermit') encPathField = driver.kyc_doc_route_permit;

  if (!encPathField) {
    return res.status(404).json({ success: false, error: 'Document not found or not uploaded.' });
  }

  try {
    const diskPath = decryptField(encPathField);
    if (!fs.existsSync(diskPath)) {
      return res.status(404).json({ success: false, error: 'Encrypted document file missing from storage.' });
    }

    const encryptedData = fs.readFileSync(diskPath);
    const decryptedBuffer = decryptBuffer(encryptedData);

    // Detect MIME type signature (PNG, JPEG, PDF)
    let mimeType = 'application/octet-stream';
    if (decryptedBuffer[0] === 0xFF && decryptedBuffer[1] === 0xD8) {
      mimeType = 'image/jpeg';
    } else if (decryptedBuffer[0] === 0x89 && decryptedBuffer[1] === 0x50) {
      mimeType = 'image/png';
    } else if (decryptedBuffer.toString('utf8', 0, 4) === '%PDF') {
      mimeType = 'application/pdf';
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'no-store, private');
    res.send(decryptedBuffer);
  } catch (err) {
    console.error('[Document Viewer Error]', err);
    res.status(500).json({ success: false, error: 'Failed to decrypt document.' });
  }
});

// ─── DRIVER PAYOUT & LEDGER AUDIT SYSTEM (SPRINT 8) ─────────────────────────

// Helper: resolve vehicleNo from token or query/body
function resolveDriverVehicleNo(req) {
  let token = req.body?.token || req.query?.token;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (token && activeDriverTokens.has(token)) {
    return activeDriverTokens.get(token).vehicleNo;
  }
  return req.body?.vehicleNo || req.query?.vehicleNo || null;
}

// 1. Driver Payout Request (Idempotent & KYC Gated)
app.post('/api/v1/driver/payout/request', (req, res) => {
  const vehicleNo = resolveDriverVehicleNo(req);
  if (!vehicleNo) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Driver session or vehicleNo required.' } });
  }

  const { requestId, amount, upiId } = req.body || {};
  if (!requestId || !amount || Number(amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'requestId and positive amount are required.' }
    });
  }

  // 1. KYC Approval Check
  const driver = stmts.getDriverByVehicle.get(vehicleNo);
  if (!driver || driver.kyc_status !== 'approved') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'KYC_NOT_APPROVED',
        message: 'Withdrawals are restricted to KYC-approved drivers. Current status: ' + (driver?.kyc_status || 'not_submitted')
      }
    });
  }

  const amountPaise = Math.round(Number(amount) * 100);
  const targetUpi = upiId ? String(upiId).trim() : (driver.driver_upi_id ? decryptField(driver.driver_upi_id) : 'driver@upi');
  const encryptedUpi = encryptField(targetUpi);

  try {
    const txResult = requestPayoutTx(vehicleNo, String(requestId).trim(), amountPaise, encryptedUpi);

    if (txResult.status === 'duplicate') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REQUEST',
          message: 'Payout request with this requestId already exists.',
          payoutId: txResult.payout.id,
          status: txResult.payout.status
        }
      });
    }

    if (txResult.status === 'insufficient') {
      return res.status(422).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `Requested ₹${amount} exceeds available balance of ₹${(txResult.availablePaise / 100).toFixed(2)}.`,
          availableRupees: txResult.availablePaise / 100,
          requestedRupees: Number(amount)
        }
      });
    }

    stmts.insertAudit.run(
      `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      vehicleNo,
      'DRIVER',
      'PAYOUT_REQUESTED',
      'PAYOUT',
      String(txResult.payoutId),
      JSON.stringify({ vehicleNo, amountRupees: amount, amountPaise, payoutId: txResult.payoutId }),
      req.ip || '127.0.0.1',
      'SUCCESS'
    );

    res.status(201).json({
      success: true,
      data: {
        payoutId: txResult.payoutId,
        vehicleNo,
        amountRupees: Number(amount),
        status: 'pending',
        remainingAvailableRupees: txResult.remainingAvailablePaise / 100
      }
    });
  } catch (err) {
    console.error('[Payout Request Error]', err);
    res.status(500).json({ success: false, error: { code: 'PAYOUT_FAILED', message: err.message } });
  }
});

// 2. Driver Payout Status History
app.get('/api/v1/driver/payout/status', (req, res) => {
  const vehicleNo = resolveDriverVehicleNo(req);
  if (!vehicleNo) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Driver session or vehicleNo required.' } });
  }

  const payouts = stmts.getPayoutsByVehicle.all(vehicleNo);
  const formatted = payouts.map(p => {
    let plainUpi = '***';
    try { plainUpi = decryptField(p.upi_id_encrypted); } catch(e) {}
    return {
      payoutId: p.id,
      requestId: p.request_id,
      amountRupees: p.amount_paise / 100,
      upiIdMasked: plainUpi.replace(/(?<=.).(?=.*@)/g, '*'),
      status: p.status,
      rejectionReason: p.rejection_reason,
      utrReference: p.utr_reference,
      requestedAt: p.requested_at,
      approvedAt: p.approved_at,
      paidAt: p.paid_at
    };
  });

  res.json({ success: true, count: formatted.length, data: formatted });
});

// 3. Driver Earnings Summary API
app.get('/api/v1/driver/earnings/summary', (req, res) => {
  const vehicleNo = resolveDriverVehicleNo(req);
  if (!vehicleNo) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Driver session or vehicleNo required.' } });
  }

  const availablePaise = getAvailableBalancePaise(vehicleNo);
  const payouts = stmts.getPayoutsByVehicle.all(vehicleNo);

  const pendingPaise = payouts
    .filter(p => p.status === 'pending' || p.status === 'approved')
    .reduce((sum, p) => sum + Number(p.amount_paise), 0);

  const paidPaise = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount_paise), 0);

  const totalEarnedRow = stmts.getEarnings.get(vehicleNo);
  const totalEarnedRupees = Number(totalEarnedRow?.total_earnings || 0);

  res.json({
    success: true,
    data: {
      vehicleNo,
      availableRupees: availablePaise / 100,
      pendingPayoutsRupees: pendingPaise / 100,
      totalPaidOutRupees: paidPaise / 100,
      lifetimeEarnedRupees: totalEarnedRupees
    }
  });
});

// 4. Driver Earnings CSV Export
app.get('/api/v1/driver/earnings/export', (req, res) => {
  const vehicleNo = resolveDriverVehicleNo(req);
  if (!vehicleNo) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Driver session or vehicleNo required.' } });
  }

  const trips = stmts.getPaidTripsByVehicle.all(vehicleNo, 'PAID');
  const payouts = stmts.getPayoutsByVehicle.all(vehicleNo);

  let csv = '=== SAFAR DRIVER EARNINGS & PAYOUT STATEMENT ===\n';
  csv += `Vehicle Number,${vehicleNo}\n`;
  csv += `Generated At,${new Date().toISOString()}\n\n`;

  csv += '--- CONFIRMED TRIP EARNINGS ---\n';
  csv += 'Trip ID,Amount (INR),Route ID,Origin,Destination,Paid At,UPI Ref\n';
  for (const t of trips) {
    csv += `"${t.trip_id}",${t.amount},"${t.route_id || 'N/A'}","${t.origin || ''}","${t.destination || ''}","${t.paid_at || t.created_at}","${t.upi_ref || ''}"\n`;
  }

  csv += '\n--- PAYOUT WITHDRAWAL HISTORY ---\n';
  csv += 'Payout ID,Request ID,Amount (INR),Status,Requested At,Paid At,UTR Reference,Rejection Reason\n';
  for (const p of payouts) {
    csv += `"${p.id}","${p.request_id}",${p.amount_paise / 100},"${p.status}","${p.requested_at}","${p.paid_at || ''}","${p.utr_reference || ''}","${p.rejection_reason || ''}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="safar_earnings_${vehicleNo}.csv"`);
  res.send(csv);
});

// 5. Admin Pending Payouts Queue
app.get('/api/v1/admin/payout/pending', (req, res) => {
  const pending = stmts.getPendingPayouts.all();
  const formatted = pending.map(p => {
    let plainUpi = '***';
    try { plainUpi = decryptField(p.upi_id_encrypted); } catch(e) {}
    const driver = stmts.getDriverByVehicle.get(p.vehicle_no);
    let driverName = 'Driver';
    try { if (driver) driverName = decryptField(driver.driver_name); } catch(e) {}

    return {
      payoutId: p.id,
      requestId: p.request_id,
      vehicleNo: p.vehicle_no,
      driverName,
      kycStatus: driver?.kyc_status || 'not_submitted',
      amountRupees: p.amount_paise / 100,
      amountPaise: p.amount_paise,
      upiId: plainUpi,
      status: p.status,
      requestedAt: p.requested_at,
      availableBalanceRupees: getAvailableBalancePaise(p.vehicle_no) / 100
    };
  });

  res.json({ success: true, count: formatted.length, data: formatted });
});

// 6. Admin All Payouts List (Filterable)
app.get('/api/v1/admin/payout/all', (req, res) => {
  const { status, vehicleNo } = req.query || {};
  let list = stmts.getAllPayouts.all();

  if (status) {
    list = list.filter(p => p.status === status);
  }
  if (vehicleNo) {
    list = list.filter(p => p.vehicle_no.toLowerCase() === vehicleNo.toLowerCase());
  }

  const formatted = list.map(p => {
    let plainUpi = '***';
    try { plainUpi = decryptField(p.upi_id_encrypted); } catch(e) {}
    return {
      payoutId: p.id,
      requestId: p.request_id,
      vehicleNo: p.vehicle_no,
      amountRupees: p.amount_paise / 100,
      amountPaise: p.amount_paise,
      upiIdMasked: plainUpi.replace(/(?<=.).(?=.*@)/g, '*'),
      status: p.status,
      utrReference: p.utr_reference,
      rejectionReason: p.rejection_reason,
      requestedAt: p.requested_at,
      approvedAt: p.approved_at,
      paidAt: p.paid_at,
      adminId: p.admin_id
    };
  });

  res.json({ success: true, count: formatted.length, data: formatted });
});

// 7. Admin Approve Payout
app.post('/api/v1/admin/payout/approve', (req, res) => {
  const { payoutId } = req.body || {};
  if (!payoutId) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'payoutId is required.' } });
  }

  const adminId = req.headers['x-admin-id'] || 'admin_super';
  const result = approvePayoutTx(Number(payoutId), adminId);

  if (result.status === 'not_found') {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payout record not found.' } });
  }
  if (result.status === 'invalid_state') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: `Cannot approve payout in status: ${result.currentStatus}` } });
  }

  stmts.insertAudit.run(
    `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    adminId,
    'ADMIN',
    'PAYOUT_APPROVED',
    'PAYOUT',
    String(payoutId),
    JSON.stringify({ payoutId, vehicleNo: result.payout.vehicle_no, amountRupees: result.payout.amount_paise / 100 }),
    req.ip || '127.0.0.1',
    'SUCCESS'
  );

  res.json({
    success: true,
    data: {
      payoutId: result.payout.id,
      status: result.payout.status,
      approvedAt: result.payout.approved_at
    }
  });
});

// 8. Admin Reject Payout (Releases trip allocations back to driver balance)
app.post('/api/v1/admin/payout/reject', (req, res) => {
  const { payoutId, reason } = req.body || {};
  if (!payoutId || !reason || String(reason).trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'payoutId and non-empty reason are required.' }
    });
  }

  const adminId = req.headers['x-admin-id'] || 'admin_super';
  const result = rejectPayoutTx(Number(payoutId), adminId, String(reason).trim());

  if (result.status === 'not_found') {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payout record not found.' } });
  }
  if (result.status === 'invalid_state') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: `Cannot reject payout in status: ${result.currentStatus}` } });
  }

  stmts.insertAudit.run(
    `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    adminId,
    'ADMIN',
    'PAYOUT_REJECTED',
    'PAYOUT',
    String(payoutId),
    JSON.stringify({ payoutId, vehicleNo: result.payout.vehicle_no, reason: result.payout.rejection_reason }),
    req.ip || '127.0.0.1',
    'SUCCESS'
  );

  res.json({
    success: true,
    data: {
      payoutId: result.payout.id,
      status: result.payout.status,
      rejectionReason: result.payout.rejection_reason
    }
  });
});

// 9. Admin Mark Paid Payout (With Manual UPI UTR Reference)
app.post('/api/v1/admin/payout/mark-paid', (req, res) => {
  const { payoutId, utrReference } = req.body || {};
  if (!payoutId || !utrReference || String(utrReference).trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'payoutId and non-empty utrReference are required.' }
    });
  }

  const adminId = req.headers['x-admin-id'] || 'admin_super';
  const result = markPaidPayoutTx(Number(payoutId), adminId, String(utrReference).trim());

  if (result.status === 'not_found') {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payout record not found.' } });
  }
  if (result.status === 'invalid_state') {
    return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: `Payout must be in 'approved' status to mark paid. Current status: ${result.currentStatus}` } });
  }

  stmts.insertAudit.run(
    `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    adminId,
    'ADMIN',
    'PAYOUT_PAID',
    'PAYOUT',
    String(payoutId),
    JSON.stringify({ payoutId, vehicleNo: result.payout.vehicle_no, utrReference: result.payout.utr_reference }),
    req.ip || '127.0.0.1',
    'SUCCESS'
  );

  res.json({
    success: true,
    data: {
      payoutId: result.payout.id,
      status: result.payout.status,
      paidAt: result.payout.paid_at,
      utrReference: result.payout.utr_reference
    }
  });
});

// ─── DRIVER SHIFT MANAGEMENT ────────────────────────────────────────────────
// 1. Driver Shift Start Endpoint (Gated by Driver Secret AND KYC Verification)
app.post('/api/v1/driver/shift/start', (req, res) => {
  const { vehicleNo, routeId, vehicleType, driverSecret } = req.body || {};
  const authSecretHeader = req.headers['x-driver-secret'];

  // Enforce driver registration secret authentication
  if ((!authSecretHeader || authSecretHeader !== DRIVER_SHIFT_SECRET) && (!driverSecret || driverSecret !== DRIVER_SHIFT_SECRET)) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED_DRIVER', message: 'Valid driver authentication secret or PIN required.' }
    });
  }

  if (!vehicleNo || !routeId) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'vehicleNo and routeId are required to start shift.' }
    });
  }

  const cleanVehicleNo = String(vehicleNo).trim().toUpperCase();

  // SPRINT 7: KYC Verification Shift Gate
  const driver = stmts.getDriverByVehicle.get(cleanVehicleNo);
  const allowPending = process.env.ALLOW_PENDING_SHIFT === 'true';

  if (driver && driver.kyc_status !== 'approved' && !allowPending) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'KYC_VERIFICATION_REQUIRED',
        message: 'Driver KYC verification required before starting shift. Your current status is: ' + driver.kyc_status,
        kycStatus: driver.kyc_status,
        rejectionReason: driver.kyc_rejection_reason || null
      }
    });
  }

  const driverToken = `drv_tok_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const expiresAt = Date.now() + 12 * 3600 * 1000;

  activeDriverTokens.set(driverToken, {
    vehicleNo: cleanVehicleNo,
    routeId,
    vehicleType: vehicleType || 'MINI_BUS',
    expiresAt
  });

  res.json({
    success: true,
    data: { driverToken, expiresAt, vehicleNo: cleanVehicleNo, routeId }
  });
});

// 2. Telemetry Broadcast Endpoint (Authenticated & Rate-Limited)
app.post('/api/v1/telemetry/broadcast', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED: Bearer token required.' });
  }

  const token = authHeader.substring(7);
  const driverInfo = activeDriverTokens.get(token);
  if (!driverInfo || Date.now() > driverInfo.expiresAt) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED: Shift token invalid or expired.' });
  }

  const { lat, lng, speed, passengerCount, routeName } = req.body || {};

  // Input Validation (Finite numbers and geographical bounds check)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return res.status(400).json({ success: false, error: 'INVALID_COORDS: Latitude/Longitude must be valid finite numbers.' });
  }

  const cleanSpeed = Number.isFinite(speed) ? Math.max(0, speed) : 0;
  const cleanPassengers = Number.isFinite(passengerCount) ? Math.max(0, passengerCount) : 0;

  const vehicleNo = driverInfo.vehicleNo;

  // Rate Limiter (1 ping per 2000ms per vehicle)
  const lastPing = lastPingTimesMap.get(vehicleNo) || 0;
  const now = Date.now();
  if (now - lastPing < 2000) {
    return res.status(429).json({ success: false, error: 'RATE_LIMITED: Max 1 broadcast per 2 seconds.' });
  }
  lastPingTimesMap.set(vehicleNo, now);

  // GPS Velocity & Teleport Anomaly Detection
  const anomalyCheck = detectGpsAnomaly(vehicleNo, {
    lat,
    lng,
    timestamp: now
  });

  if (anomalyCheck.anomaly) {
    metrics.anomalyDetected.inc({ type: anomalyCheck.reason || 'gps_jump' });
    // Instant rejection if velocity is impossible (>200 km/h or explicit teleport)
    if (anomalyCheck.reason === 'impossible_teleport' || (anomalyCheck.speedKmh && anomalyCheck.speedKmh > 200)) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'GPS_ANOMALY_REJECTED',
          message: `Broadcast rejected: Impossible velocity (${anomalyCheck.speedKmh} km/h).`,
          details: anomalyCheck
        }
      });
    }
  }

  // Store active trip in telemetry data shape
  const tripData = {
    vehicleNo,
    routeId: driverInfo.routeId,
    routeName: routeName || driverInfo.routeId,
    vehicleType: driverInfo.vehicleType,
    lat,
    lng,
    speed: cleanSpeed,
    passengerCount: cleanPassengers,
    lastSeen: now,
    timestamp: new Date().toISOString()
  };

  activeTripsStore[vehicleNo] = tripData;
  recordBroadcastTimestamp();
  metrics.telemetryBroadcastReceived.inc();

  // stateStore: Update snapshot & publish to telemetry channel with duration metric
  const publishEnd = metrics.broadcastPublishDuration.startTimer();
  await stateStore.updateSnapshot(vehicleNo, tripData);
  await stateStore.publish('telemetry.broadcast', tripData);
  publishEnd();

  // Asynchronous SQLite raw GPS persistence (7-day retention)
  try {
    stmts.insertGpsPing.run(
      driverInfo.driverId || driverInfo.vehicleNo || 'driver_unknown',
      driverInfo.vehicleNo,
      driverInfo.routeId,
      lat,
      lng,
      cleanSpeed,
      0,
      now
    );
  } catch (dbErr) {
    console.error('[DB] Raw GPS ping insert error:', dbErr.message);
  }

  res.json({ success: true, timestamp: tripData.timestamp, anomalyWarning: anomalyCheck.anomaly ? anomalyCheck.reason : null });
});

// 3. Active Telemetry Snapshot Endpoint
app.get('/api/v1/telemetry/active', async (req, res) => {
  const snapshotMap = await stateStore.getSnapshot();
  res.json({ success: true, data: Object.values(snapshotMap) });
});

// 4. Server-Sent Events (SSE) Live Stream Endpoint
app.get('/api/v1/telemetry/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial snapshot payload from stateStore
  let snapshotData;
  try {
    const rawSnapshot = await stateStore.getSnapshot();
    snapshotData = Object.values(rawSnapshot);
  } catch (err) {
    snapshotData = Object.values(activeTripsStore);
  }
  res.write(`event: snapshot\ndata: ${JSON.stringify(snapshotData)}\n\n`);

  sseClients.add(res);
  metrics.sseActiveConnections.inc();

  // Subscribe to telemetry.broadcast via stateStore
  const unsubBroadcast = stateStore.subscribe('telemetry.broadcast', (tripData) => {
    try {
      res.write(`event: telemetry\ndata: ${JSON.stringify(tripData)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch (e) {}
  });

  // Subscribe to telemetry.trip_removed via stateStore
  const unsubTripRemoved = stateStore.subscribe('telemetry.trip_removed', (data) => {
    try {
      res.write(`event: trip_removed\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch (e) {}
  });

  // Subscribe to safar_fare_updates via stateStore
  const unsubFare = stateStore.subscribe('safar_fare_updates', (data) => {
    try {
      res.write(`event: fare_update\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') res.flush();
    } catch (e) {}
  });

  // Keep-alive ping interval (every 15s)
  const keepaliveTimer = setInterval(() => {
    try {
      res.write(':keepalive\n\n');
    } catch (e) {
      clearInterval(keepaliveTimer);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepaliveTimer);
    sseClients.delete(res);
    metrics.sseActiveConnections.dec();
    unsubBroadcast();
    unsubTripRemoved();
    unsubFare();
  });
});

// ─── AUTHORITATIVE SERVER ROUTE DATABASE & STATUTORY FARE ENGINE ────────────
const serverRoutesDb = [
  { id: "SRN-BUD-01", name: "Srinagar - Budgam Corridor", distance: 14, stops: ["Lal Chowk", "Jahangir Chowk", "Hyderpora", "Humhama", "Budgam Town"] },
  { id: "SRN-HZB-02", name: "Lal Chowk - Hazratbal (KU)", distance: 12, stops: ["Lal Chowk", "Dalgate", "Rainawari", "Hazratbal", "Kashmir University"] },
  { id: "SRN-ANG-03", name: "Srinagar - Anantnag Express", distance: 54, stops: ["Pantha Chowk", "Pampore", "Awantipora", "Bijbehara", "Anantnag Bus Stand"] },
  { id: "SRN-BAR-04", name: "Srinagar - Baramulla Highway", distance: 54, stops: ["Parimpora", "Pattan", "Sangrama", "Baramulla Main Market"] },
  { id: "SRN-GBL-05", name: "Srinagar - Ganderbal Route", distance: 21, stops: ["Soura", "Nagbal", "Ganderbal Hub"] },
  { id: "JMU-KAT-06", name: "Jammu - Katra Tourist Corridor", distance: 45, stops: ["Jammu Tawi", "Nagrota", "Jhajjar Kotli", "Katra Bus Stand"] }
];

function calculateServerStatutoryFare(vehicleType = 'MINI_BUS', distanceKm = 10, passengerCategory = 'General') {
  const dist = Math.max(0.1, Number(distanceKm));
  let baseFare = 26;

  if (dist <= 3) baseFare = 9;
  else if (dist <= 5) baseFare = 14;
  else if (dist <= 10) baseFare = 17;
  else if (dist <= 15) baseFare = 20;
  else if (dist <= 20) baseFare = 26;
  else baseFare = 26 + (dist - 20) * 1.40;

  let categoryMult = 1.0;
  if (passengerCategory === 'Student' || passengerCategory === 'Specially Abled') categoryMult = 0.5;
  else if (passengerCategory === 'Senior Citizen') categoryMult = 0.75;

  const fare = Math.max(5, Math.round(baseFare * categoryMult));
  const studentFare = Math.max(5, Math.round(baseFare * 0.5));
  return { fare, studentFare, distanceKm: dist };
}

let lastAiQueryTimeMap = new Map(); // ip -> timestamp

// Rate limiter cleanup for AI queries
const aiRateLimitTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of lastAiQueryTimeMap.entries()) {
    if (now - time > 60000) lastAiQueryTimeMap.delete(ip);
  }
}, 60000);
if (aiRateLimitTimer.unref) aiRateLimitTimer.unref();

// ─── REAL BACKEND AI TRANSIT ASSISTANT ENDPOINT ──────────────────────────────
app.post('/api/v1/ai/query', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  // 1. IP Rate Limiter (Max 1 query per 1000ms)
  const lastQueryTime = lastAiQueryTimeMap.get(clientIp) || 0;
  const now = Date.now();
  if (now - lastQueryTime < 1000) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded: Max 1 query per second.' }
    });
  }
  lastAiQueryTimeMap.set(clientIp, now);

  // 2. Input Validation (1..500 chars string)
  const { query } = req.body || {};
  if (typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Query must be a non-empty string.' }
    });
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0 || trimmedQuery.length > 500) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_LENGTH', message: 'Query length must be between 1 and 500 characters.' }
    });
  }

  const q = trimmedQuery.toLowerCase();

  // 3. Language Detector (Devanagari, Arabic script, Roman Kashmiri, English)
  let detectedLang = 'en';
  if (/[\u0900-\u097F]/.test(trimmedQuery)) {
    detectedLang = 'hi';
  } else if (/[\u0600-\u06FF]/.test(trimmedQuery)) {
    detectedLang = 'ur';
  } else if (
    q.includes("chhu") || q.includes("chhe") || q.includes("kathe") ||
    q.includes("koshur") || q.includes("kiraya") || q.includes("kitna") ||
    q.includes("kahan") || q.includes("namaskar") || q.includes("namaste") ||
    q.includes("salam") || q.includes("shukriya") || q.includes("meharbani")
  ) {
    detectedLang = 'ks_roman';
  }

  // 4. Multilingual Intent Classification Engine
  let intent = 'GENERAL_HELP';
  let answer = '';

  // Intent A: GREETING
  if (
    q.includes("hello") || q.includes("hi") || q.includes("salam") ||
    q.includes("assalamu") || q.includes("namaste") || q.includes("kya haal") || q.includes("helo")
  ) {
    intent = 'GREETING';
    if (detectedLang === 'hi') {
      answer = "नमस्ते! मैं सफ़र AI सहायक हूँ। आप मुझसे बस किराया, रूट, लाइव बस लोकेशन या छात्र छूट के बारे में पूछ सकते हैं।";
    } else if (detectedLang === 'ur' || detectedLang === 'ks_roman') {
      answer = "Walaikum Assalam! Be chhus tuhund Safar AI Assistant. Tohi hekyiv stage-carriage kiraya, route timetable, ya live bus tracking mutaliq prith.";
    } else {
      answer = "Walaikum Assalam / Greetings! I am your Safar AI transit assistant. Ask me about regulated bus fares, route stops, crowd density, or student concession policies across J&K.";
    }
  }
  // Intent B: STUDENT_CONCESSION
  else if (q.includes("student") || q.includes("discount") || q.includes("concession") || q.includes("pass") || q.includes("choot")) {
    intent = 'STUDENT_CONCESSION';
    if (detectedLang === 'hi') {
      answer = "🎓 छात्र रियायत नियम: परिवहन प्राधिकरण के आदेशानुसार वैध संस्थान पहचान पत्र रखने वाले छात्रों को बस किराए पर 50% की छूट प्रदान की जाती है।";
    } else {
      answer = "🎓 Student Concession Rules: As mandated by the J&K Transport Authority, bona fide students carrying a valid institutional photo ID card are entitled to a 50% fare discount on all stage carriage buses across Jammu & Kashmir.";
    }
  }
  // Intent C: LIVE_TRACKING
  else if (q.includes("where is my bus") || q.includes("track") || q.includes("location") || q.includes("kahan hai") || q.includes("gps") || q.includes("live")) {
    intent = 'LIVE_TRACKING';
    const activeTrips = Object.values(activeTripsStore);
    if (activeTrips.length > 0) {
      const trip = activeTrips[0];
      answer = `📍 Live Vehicle Tracker: Found active bus [${trip.vehicleNo}] on corridor "${trip.routeName}". Current Speed: ${trip.speed || 24} km/h, Passenger Count: ${trip.passengerCount || 0}. Check the Commuter tab map for live real-time visual tracking.`;
    } else {
      answer = "📍 Live Corridor GPS: Stage carriage vehicles continuously broadcast telemetry on major corridors (Srinagar–Budgam, Anantnag Express, Baramulla, Jammu–Katra). No active broadcasts right now, but you can observe real-time pins on the Commuter Live Tracker when drivers initiate shifts.";
    }
  }
  // Intent D: DISPUTE_COMPLIANCE
  else if (q.includes("overcharge") || q.includes("complain") || q.includes("rule") || q.includes("police") || q.includes("authority") || q.includes("dispute") || q.includes("receipt") || q.includes("pcr")) {
    intent = 'DISPUTE_COMPLIANCE';
    answer = "⚖️ Regulatory Compliance & Dispute Redressal: All stage carriage operators must adhere strictly to the notified rate schedule. If a driver overcharges or refuses to issue a receipt, you can report the vehicle number to the Transport Authority Control Room or Police PCR (112). Use the Fare Calculator tab to display the official verified slab fare.";
  }
  // Intent E: CROWD_DENSITY
  else if (q.includes("crowd") || q.includes("rush") || q.includes("seat") || q.includes("full") || q.includes("kashmir university")) {
    intent = 'CROWD_DENSITY';
    answer = "📊 Corridor Density: Kashmir University and Lal Chowk corridors operate peak-hour shuttle mini-buses every 6 to 8 minutes. Current passenger load is MODERATE with seating available.";
  }
  // Intent F: FARE_QUERY
  else {
    let matchedRoute = null;
    if (q.includes("budgam")) matchedRoute = serverRoutesDb.find(r => r.id === "SRN-BUD-01");
    else if (q.includes("hazratbal") || q.includes("university")) matchedRoute = serverRoutesDb.find(r => r.id === "SRN-HZB-02");
    else if (q.includes("anantnag") || q.includes("islamabad")) matchedRoute = serverRoutesDb.find(r => r.id === "SRN-ANG-03");
    else if (q.includes("baramulla") || q.includes("varmul")) matchedRoute = serverRoutesDb.find(r => r.id === "SRN-BAR-04");
    else if (q.includes("ganderbal")) matchedRoute = serverRoutesDb.find(r => r.id === "SRN-GBL-05");
    else if (q.includes("jammu") || q.includes("katra")) matchedRoute = serverRoutesDb.find(r => r.id === "JMU-KAT-06");

    if (matchedRoute || q.includes("fare") || q.includes("kiraya") || q.includes("rate") || q.includes("price") || q.includes("cost") || q.includes("cheapest")) {
      intent = 'FARE_QUERY';
      const targetRoute = matchedRoute || serverRoutesDb[0];
      const fareInfo = calculateServerStatutoryFare("MINI_BUS", targetRoute.distance, "General");

      if (detectedLang === 'hi') {
        answer = `🚌 रूट "${targetRoute.name}" (${targetRoute.distance} किमी):\n• मिनी बस किराया: ₹${fareInfo.fare}\n• छात्र रियायती दर: ₹${fareInfo.studentFare}\nआप फेयर कैलकुलेटर टैब में विस्तृत स्टॉप-दर-स्टॉप दूरी भी देख सकते हैं।`;
      } else {
        answer = `🚌 Route Details: "${targetRoute.name}" (${targetRoute.distance} km)\n• Regulated Mini-Bus Fare: ₹${fareInfo.fare}\n• Student Concession Rate: ₹${fareInfo.studentFare} (50% discount)\n• Key Stops: ${targetRoute.stops.slice(0, 4).join(" ➔ ")}`;
      }
    }
    // Intent G: GENERAL_HELP Fallback
    else {
      intent = 'GENERAL_HELP';
      answer = `I checked our transport authority database for your query. You can calculate official fares in **Commuter**, broadcast GPS in **Driver**, or inspect the **Blueprint** Mind Map!`;
    }
  }

  res.json({
    success: true,
    data: {
      intent,
      language: detectedLang,
      answer,
      timestamp: new Date().toISOString()
    }
  });
});

// Fallback SPA Route (must be last route handler)
// Admin Authentication Middleware
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const session = activeAdminTokens.get(token);
    if (session && Date.now() < session.expiresAt) {
      req.adminSession = session;
      req.adminToken = token;
      return next();
    }
  }
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const adminId = req.headers['x-admin-id'];
    if (adminId && (adminId.startsWith('admin_') || adminId === 'admin_super')) {
      req.adminSession = { id: adminId, role: 'ADMIN' };
      req.adminToken = adminId;
      return next();
    }
  }
  return res.status(401).json({ success: false, error: "UNAUTHORIZED: Admin token required." });
}

// Admin Login Endpoint (POST /api/v1/admin/login)
app.post("/api/v1/admin/login", (req, res) => {
  const clientIp = req.ip || "127.0.0.1";
  const now = Date.now();
  const window15m = 15 * 60 * 1000;

  let limitData = adminLoginRateLimitMap.get(clientIp) || { attempts: [] };
  limitData.attempts = limitData.attempts.filter(t => now - t < window15m);

  if (limitData.attempts.length >= 5) {
    return res.status(429).json({
      success: false,
      error: "TOO_MANY_REQUESTS: Max 5 failed attempts per 15 minutes. Try again later."
    });
  }

  const { adminPin } = req.body || {};
  const isProd = process.env.NODE_ENV === "production";
  const validPin = process.env.ADMIN_PIN || (isProd ? null : "safar-admin-2026");

  if (!validPin || adminPin !== validPin) {
    limitData.attempts.push(now);
    adminLoginRateLimitMap.set(clientIp, limitData);
    return res.status(401).json({ success: false, error: "UNAUTHORIZED: Invalid Admin PIN." });
  }

  adminLoginRateLimitMap.delete(clientIp);

  const adminToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(now + 2 * 3600 * 1000).toISOString();

  activeAdminTokens.set(adminToken, {
    expiresAt: now + 2 * 3600 * 1000,
    createdAt: now,
    ip: clientIp
  });

  res.json({
    success: true,
    data: { adminToken, expiresAt }
  });
});

// Admin Telemetry Summary Endpoint (GET /api/v1/admin/telemetry/summary)
app.get("/api/v1/admin/telemetry/summary", requireAdminAuth, (req, res) => {
  const now = Date.now();
  const lastReq = adminSummaryRateLimitMap.get(req.adminToken) || 0;

  if (now - lastReq < 1000) {
    return res.status(429).json({ success: false, error: "RATE_LIMITED: Max 1 summary request per second." });
  }
  adminSummaryRateLimitMap.set(req.adminToken, now);

  pruneBroadcastTimestamps();

  const vehicles = Object.values(activeTripsStore);
  const activeVehiclesCount = vehicles.length;
  const totalPassengers = vehicles.reduce((sum, v) => sum + (v.passengerCount || 0), 0);

  const totalSpeed = vehicles.reduce((sum, v) => sum + (v.speed || 0), 0);
  const averageSpeedKmph = activeVehiclesCount > 0 ? Number((totalSpeed / activeVehiclesCount).toFixed(1)) : 0;

  const vehicleList = vehicles.map(v => ({
    vehicleNo: v.vehicleNo,
    routeName: v.routeName,
    lat: v.lat,
    lng: v.lng,
    speedKmph: v.speed,
    passengerCount: v.passengerCount,
    lastSeen: v.timestamp
  }));

  const totalDirectEarnings = tripsLedger
    .filter(t => t.status === 'PAID_DIRECT')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalAwaitingPayments = tripsLedger
    .filter(t => t.status === 'AWAITING_PAYMENT').length;

  res.json({
    success: true,
    data: {
      activeVehicles: activeVehiclesCount,
      totalBroadcastsLastMinute: recentBroadcastTimestamps.length,
      averageSpeedKmph,
      totalPassengers,
      totalDirectEarnings,
      totalAwaitingPayments,
      vehicles: vehicleList
    }
  });
});

// ─── DRIVER & DIRECT UPI PAYMENT ENDPOINTS ──────────────────────────────────────

// Driver Shift Start Endpoint (POST /api/v1/driver/shift/start)
app.post('/api/v1/driver/shift/start', (req, res) => {
  const driverSecret = req.headers['x-driver-secret'];
  const expectedSecret = process.env.DRIVER_SECRET || 'safar-driver-secret-2026';

  if (!driverSecret || driverSecret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or missing X-Driver-Secret header.' }
    });
  }

  const { vehicleNo, routeId, vehicleType } = req.body || {};
  if (!vehicleNo || typeof vehicleNo !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'vehicleNo is required.' }
    });
  }

  const driverToken = 'drv_tok_' + crypto.randomBytes(16).toString('hex');
  const session = {
    driverToken,
    vehicleNo: vehicleNo.trim(),
    routeId: routeId || 'SRN-BUD-01',
    vehicleType: vehicleType || 'MINI_BUS',
    createdAt: Date.now()
  };

  activeDriverTokens.set(driverToken, session);

  res.json({
    success: true,
    data: {
      driverToken,
      vehicleNo: session.vehicleNo,
      routeId: session.routeId
    }
  });
});

// Driver Profile Registration & Update (POST /api/v1/driver/profile)
app.post('/api/v1/driver/profile', authenticateDriverToken, (req, res) => {
  const token = req.driverToken;
  const now = Date.now();
  const lastUpdate = driverProfileRateLimitMap.get(token) || 0;

  if (now - lastUpdate < 10000) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded: Max 1 profile update per 10 seconds.' }
    });
  }
  driverProfileRateLimitMap.set(token, now);

  const vehicleNo = req.driverSession.vehicleNo;
  const { name, upiId, bankAccount } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_NAME', message: 'Name is required and must be under 100 characters.' }
    });
  }

  const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;
  if (!upiId || typeof upiId !== 'string' || !upiRegex.test(upiId.trim())) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_UPI_ID', message: 'Invalid UPI ID format. Expected standard handle (e.g. driver@upi).' }
    });
  }

  if (!bankAccount || typeof bankAccount !== 'object') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_BANK_ACCOUNT', message: 'bankAccount details object is required.' }
    });
  }

  const { accountNumber, ifsc, accountHolderName } = bankAccount;
  const accNumRegex = /^\d{9,18}$/;
  if (!accountNumber || typeof accountNumber !== 'string' || !accNumRegex.test(accountNumber.trim())) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ACCOUNT_NUMBER', message: 'Bank account number must be 9 to 18 digits.' }
    });
  }

  const ifscRegex = /^[A-Za-z0-9]{11}$/;
  if (!ifsc || typeof ifsc !== 'string' || !ifscRegex.test(ifsc.trim())) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_IFSC', message: 'IFSC code must be 11 alphanumeric characters.' }
    });
  }

  if (accountHolderName && (typeof accountHolderName !== 'string' || accountHolderName.length > 100)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_HOLDER_NAME', message: 'Account holder name must be under 100 characters.' }
    });
  }

  const profileData = {
    vehicleNo,
    name: name.trim(),
    upiId: encryptField(upiId.trim()),
    bankAccount: {
      accountNumber: encryptField(accountNumber.trim()),
      ifsc: encryptField(ifsc.trim().toUpperCase()),
      accountHolderName: encryptField((accountHolderName || name).trim())
    },
    updatedAt: new Date().toISOString()
  };

  // 1. PRIMARY PERSISTENCE: Synchronous SQLite WAL Engine
  try {
    stmts.upsertDriver.run(
      profileData.vehicleNo,
      profileData.name,
      profileData.upiId,
      profileData.bankAccount.accountNumber,
      profileData.bankAccount.ifsc,
      profileData.bankAccount.accountHolderName
    );
  } catch (sqlErr) {
    console.error('[DB_DUAL_WRITE] SQLite Driver Upsert Failed:', sqlErr.message);
  }

  // 2. IN-MEMORY & JSON BACKUP PERSISTENCE
  driversStore.set(vehicleNo, profileData);
  saveLedgerDb();

  const decUpi = decryptField(profileData.upiId);
  const decAcc = decryptField(profileData.bankAccount.accountNumber);
  const decIfsc = decryptField(profileData.bankAccount.ifsc);

  res.json({
    success: true,
    data: {
      vehicleNo,
      name: profileData.name,
      upiId: maskUpi(decUpi),
      bankAccount: {
        maskedAccount: maskAccount(decAcc),
        ifsc: decIfsc
      }
    }
  });
});

// UPI Intent Generation Endpoint (POST /api/v1/trips/upi-intent)
app.post('/api/v1/trips/upi-intent', (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const lastIntentTime = upiIntentRateLimitMap.get(clientIp) || 0;

  if (now - lastIntentTime < 5000) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded: Max 1 intent per 5 seconds per IP.' }
    });
  }
  upiIntentRateLimitMap.set(clientIp, now);

  const { vehicleNo, fareAmount, routeId, origin, destination } = req.body || {};

  if (!vehicleNo || typeof vehicleNo !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_VEHICLE', message: 'vehicleNo is required.' }
    });
  }

  const numFare = Number(fareAmount);
  if (isNaN(numFare) || numFare <= 0 || numFare > 5000) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FARE', message: 'fareAmount must be a positive number up to ₹5000.' }
    });
  }

  if (!routeId || !origin || !destination) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ROUTE_PARAMS', message: 'routeId, origin, and destination are required strings.' }
    });
  }

  const driver = driversStore.get(vehicleNo.trim());
  if (!driver || !driver.upiId) {
    return res.status(400).json({
      success: false,
      error: { code: 'DRIVER_NOT_FOUND', message: 'Driver payout profile not registered or missing valid UPI ID.' }
    });
  }

  const rawUpi = decryptField(driver.upiId);
  const tripId = `trip_${now}_${crypto.randomBytes(4).toString('hex')}`;
  const upiLink = `upi://pay?pa=${encodeURIComponent(rawUpi)}&pn=${encodeURIComponent(driver.name)}&am=${numFare}&cu=INR&tn=${encodeURIComponent('Safar Trip ' + tripId)}`;

  // Generate 4-digit OTP for display-only verification in passenger app
  const otpCode = String(crypto.randomInt(1000, 10000));
  const otpHash = hashOtp(otpCode);
  const otpExpiresAt = now + 10 * 60 * 1000; // 10 minutes TTL

  const tripRecord = {
    tripId,
    vehicleNo: driver.vehicleNo,
    amount: numFare,
    routeId,
    origin,
    destination,
    status: 'AWAITING_PAYMENT',
    otpHash,
    otpExpiresAt,
    otpAttemptsRemaining: 3,
    isRedeemed: false,
    createdAt: new Date().toISOString()
  };

  // 1. PRIMARY PERSISTENCE: Synchronous SQLite WAL Engine
  try {
    stmts.insertTrip.run(
      tripRecord.tripId,
      tripRecord.vehicleNo,
      tripRecord.amount,
      tripRecord.routeId,
      tripRecord.origin,
      tripRecord.destination,
      tripRecord.status,
      tripRecord.otpHash,
      tripRecord.otpExpiresAt,
      tripRecord.otpAttemptsRemaining,
      0
    );
  } catch (sqlErr) {
    console.error('[DB_DUAL_WRITE] SQLite Trip Insert Failed:', sqlErr.message);
  }

  // 2. IN-MEMORY & JSON BACKUP PERSISTENCE
  tripsLedger.push(tripRecord);
  saveLedgerDb();

  res.json({
    success: true,
    data: {
      tripId,
      upiLink,
      otpCode, // Returned for display on passenger app
      amount: numFare,
      driverName: driver.name,
      vehicleNo: driver.vehicleNo
    }
  });
});

// Manual Payment Confirmation Endpoint (POST /api/v1/trips/:tripId/mark-paid)
app.post('/api/v1/trips/:tripId/mark-paid', authenticateDriverToken, (req, res) => {
  const token = req.driverToken;
  const now = Date.now();
  const lastMarkTime = markPaidRateLimitMap.get(token) || 0;

  if (now - lastMarkTime < 2000) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded: Max 1 mark-paid per 2 seconds.' }
    });
  }
  markPaidRateLimitMap.set(token, now);

  const { tripId } = req.params;
  const trip = tripsLedger.find(t => t.tripId === tripId);

  if (!trip) {
    return res.status(404).json({
      success: false,
      error: { code: 'TRIP_NOT_FOUND', message: 'Trip ID not found in ledger.' }
    });
  }

  if (trip.status !== 'AWAITING_PAYMENT') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TRIP_STATUS', message: 'Trip is already processed or not awaiting payment.' }
    });
  }

  // Critical Ownership Verification
  if (req.driverSession.vehicleNo !== trip.vehicleNo) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'FORBIDDEN: Trip does not belong to this driver.' }
    });
  }

  const { upiRef, otpCode } = req.body || {};

  // OTP Verification Mode
  if (otpCode !== undefined && otpCode !== null) {
    if (trip.isRedeemed || (trip.otpExpiresAt && now > trip.otpExpiresAt)) {
      const isSpike = recordPaymentFailure(req.driverSession.vehicleNo);
      if (isSpike) metrics.anomalyDetected.inc({ type: 'payment_failure_spike' });
      return res.status(400).json({
        success: false,
        error: { code: 'OTP_EXPIRED', message: 'OTP has expired or already been redeemed.' }
      });
    }

    if (trip.otpAttemptsRemaining <= 0) {
      const isSpike = recordPaymentFailure(req.driverSession.vehicleNo);
      if (isSpike) metrics.anomalyDetected.inc({ type: 'payment_failure_spike' });
      return res.status(400).json({
        success: false,
        error: { code: 'OTP_LOCKED', message: 'Max verification attempts exceeded for this OTP.' }
      });
    }

    const inputHash = hashOtp(otpCode);
    if (inputHash !== trip.otpHash) {
      trip.otpAttemptsRemaining = (trip.otpAttemptsRemaining || 1) - 1;
      saveLedgerDb();
      const isSpike = recordPaymentFailure(req.driverSession.vehicleNo);
      if (isSpike) metrics.anomalyDetected.inc({ type: 'payment_failure_spike' });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: `Invalid OTP code. ${trip.otpAttemptsRemaining} attempt(s) remaining.`
        }
      });
    }

    trip.isRedeemed = true;
  }

  recordPaymentSuccess(req.driverSession.vehicleNo);

  const cleanUpiRef = typeof upiRef === 'string' ? upiRef.trim().slice(0, 50) : (otpCode ? `OTP-VERIFIED-${otpCode}` : null);

  trip.status = 'PAID_DIRECT';
  trip.upiRef = cleanUpiRef;
  trip.paidAt = new Date().toISOString();

  // 1. PRIMARY PERSISTENCE: Atomic SQLite Transaction (Trip + Earnings)
  try {
    recordPaymentTx(
      trip.tripId,
      trip.status,
      trip.upiRef,
      trip.paidAt,
      trip.vehicleNo,
      trip.amount
    );
  } catch (sqlErr) {
    console.error('[DB_DUAL_WRITE] SQLite Payment Record Failed:', sqlErr.message);
  }

  // 2. IN-MEMORY & JSON BACKUP PERSISTENCE
  const prevEarnings = driverEarningsLedger.get(trip.vehicleNo) || 0;
  driverEarningsLedger.set(trip.vehicleNo, prevEarnings + trip.amount);

  saveLedgerDb();

  broadcastTelemetry({
    type: 'TRIP_PAYMENT_CONFIRMED',
    tripId: trip.tripId,
    vehicleNo: trip.vehicleNo,
    amount: trip.amount,
    paidAt: trip.paidAt
  });

  res.json({
    success: true,
    data: {
      tripId: trip.tripId,
      status: 'PAID_DIRECT',
      paidAt: trip.paidAt
    }
  });
});

// Driver Earnings Ledger Endpoint (GET /api/v1/driver/earnings)
app.get('/api/v1/driver/earnings', authenticateDriverToken, (req, res) => {
  const vehicleNo = req.driverSession.vehicleNo;
  const paidTrips = tripsLedger.filter(t => t.vehicleNo === vehicleNo && t.status === 'PAID_DIRECT');
  const totalEarnings = paidTrips.reduce((sum, t) => sum + (t.amount || 0), 0);

  res.json({
    success: true,
    data: {
      totalEarnings,
      tripsCount: paidTrips.length,
      recentTrips: paidTrips.slice(-20).reverse()
    }
  });
});

// Admin Drivers Masked Payout Details (GET /api/v1/admin/drivers/payout-details)
app.get('/api/v1/admin/drivers/payout-details', requireAdminAuth, (req, res) => {
  const list = Array.from(driversStore.values()).map(d => {
    const decUpi = decryptField(d.upiId);
    const decAcc = decryptField(d.bankAccount?.accountNumber);
    const decIfsc = decryptField(d.bankAccount?.ifsc);

    return {
      vehicleNo: d.vehicleNo,
      name: d.name,
      upiId: maskUpi(decUpi),
      bankAccount: {
        maskedAccount: maskAccount(decAcc),
        ifsc: decIfsc
      }
    };
  });

  res.json({
    success: true,
    data: list
  });
});

// ─── PROMETHEUS & ADMIN ALERTS ENDPOINTS ──────────────────────────────────────

app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', metrics.contentType);
    res.send(await metrics.register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/v1/admin/alerts', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    data: getAdminAlerts()
  });
});

// ─── HEALTH CHECK ENDPOINTS (Pre-SPA Fallback) ────────────────────────────────

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/readyz', (req, res) => {
  const lagStart = Date.now();
  setImmediate(() => {
    const lag = Date.now() - lagStart;
    const healthy = lag < 100; // Event loop lag under 100ms
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ready' : 'degraded',
      eventLoopLagMs: lag,
      sseClients: sseClients.size,
      activeDrivers: activeDriverTokens.size,
      activeTrips: Object.keys(activeTripsStore).length,
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      uptime: Math.floor(process.uptime())
    });
  });
});

// ─── FARE SRO VERSIONING & TRANSPORT DEPT COMPLIANCE (SPRINT 9) ──────────

// 1. Public Active SRO Version
app.get('/api/v1/fares/active', (req, res) => {
  try {
    const active = getActiveSroVersion();
    if (!active) {
      return res.status(404).json({ success: false, error: 'No active fare version' });
    }
    const rules = JSON.parse(active.rules_json);
    res.json({
      success: true,
      data: {
        versionId: active.version_id,
        sroNumber: active.sro_number,
        publishedAt: active.published_at,
        rules,
        sha256Checksum: active.sha256_checksum
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Admin List All SRO Versions
app.get('/api/v1/admin/fares/sro/versions', requireAdminAuth, (req, res) => {
  try {
    const versions = getAllSroVersions().map(v => ({
      ...v,
      rules: JSON.parse(v.rules_json)
    }));
    res.json({ success: true, data: versions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Admin Create SRO Draft
app.post('/api/v1/admin/fares/sro/draft', requireAdminAuth, (req, res) => {
  try {
    const { sroNumber, rulesJson, createdBy } = req.body || {};
    if (!sroNumber || !rulesJson || typeof rulesJson !== 'object') {
      return res.status(400).json({ success: false, error: 'sroNumber and rulesJson object are required' });
    }
    const adminId = req.headers['x-admin-id'] || createdBy || req.adminToken || 'admin_super';
    const draft = createSroDraftTx({ sroNumber: String(sroNumber).trim(), rulesJson, createdBy: adminId });
    res.status(201).json({ success: true, data: draft });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Admin Acquire Draft Lock
app.post('/api/v1/admin/fares/sro/:versionId/lock', requireAdminAuth, (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId, 10);
    const adminId = req.headers['x-admin-id'] || (req.body && req.body.adminId) || req.adminToken || 'admin_super';
    const result = acquireSroDraftLockTx(versionId, adminId);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.message === 'LOCK_CONFLICT') {
      return res.status(409).json({ success: false, error: 'LOCK_CONFLICT', message: 'Draft is currently locked by another administrator' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Admin Release Draft Lock
app.post('/api/v1/admin/fares/sro/:versionId/unlock', requireAdminAuth, (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId, 10);
    const adminId = req.headers['x-admin-id'] || (req.body && req.body.adminId) || req.adminToken || 'admin_super';
    const result = releaseSroDraftLockTx(versionId, adminId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Admin Publish SRO Version
app.post('/api/v1/admin/fares/sro/:versionId/publish', requireAdminAuth, async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId, 10);
    const adminId = req.headers['x-admin-id'] || (req.body && req.body.adminId) || req.adminToken || 'admin_super';
    const published = publishSroVersionTx(versionId, adminId);

    const eventPayload = {
      type: 'fare_version_published',
      versionId: published.version_id,
      sroNumber: published.sro_number,
      sha256Checksum: published.sha256_checksum,
      timestamp: Date.now()
    };

    // Broadcast to Redis / memory StateStore
    await stateStore.publish('safar_fare_updates', eventPayload);

    // Direct SSE push
    const sseMsg = `event: fare_update\ndata: ${JSON.stringify(eventPayload)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.write(sseMsg);
        if (typeof client.flush === 'function') client.flush();
      } catch (e) {}
    });

    // Record Audit
    stmts.insertAudit.run(
      `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      adminId,
      'ADMIN',
      'FARE_SRO_PUBLISHED',
      'FARE_SRO',
      String(versionId),
      JSON.stringify({ versionId, sroNumber: published.sro_number, checksum: published.sha256_checksum }),
      req.ip || '127.0.0.1',
      'SUCCESS'
    );

    res.json({ success: true, data: published });
  } catch (err) {
    if (err.message === 'LOCK_CONFLICT') {
      return res.status(409).json({ success: false, error: 'LOCK_CONFLICT', message: 'Draft is locked by another administrator' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Admin Rollback SRO Version
app.post('/api/v1/admin/fares/sro/:versionId/rollback', requireAdminAuth, async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId, 10);
    const adminId = req.headers['x-admin-id'] || (req.body && req.body.adminId) || req.adminToken || 'admin_super';
    const target = rollbackSroVersionTx(versionId, adminId);

    const eventPayload = {
      type: 'fare_version_rolled_back',
      versionId: target.version_id,
      sroNumber: target.sro_number,
      sha256Checksum: target.sha256_checksum,
      timestamp: Date.now()
    };

    await stateStore.publish('safar_fare_updates', eventPayload);

    const sseMsg = `event: fare_update\ndata: ${JSON.stringify(eventPayload)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.write(sseMsg);
        if (typeof client.flush === 'function') client.flush();
      } catch (e) {}
    });

    stmts.insertAudit.run(
      `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      adminId,
      'ADMIN',
      'FARE_SRO_ROLLED_BACK',
      'FARE_SRO',
      String(versionId),
      JSON.stringify({ versionId, sroNumber: target.sro_number, checksum: target.sha256_checksum }),
      req.ip || '127.0.0.1',
      'SUCCESS'
    );

    res.json({ success: true, data: target });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Record Compliance Discrepancy (Overcharge & Dispute Reporting)
app.post('/api/v1/compliance/report', (req, res) => {
  try {
    const {
      disputeId,
      tripId,
      routeId,
      driverId,
      vehicleNo,
      expectedFarePaise,
      chargedFarePaise,
      actualFareChargedINR,
      passengerPhone,
      clientSroVersion,
      operatorId,
      reportedBy
    } = req.body || {};

    const computedChargedPaise = chargedFarePaise !== undefined 
      ? Number(chargedFarePaise) 
      : (actualFareChargedINR !== undefined ? Math.round(Number(actualFareChargedINR) * 100) : undefined);

    if (computedChargedPaise === undefined) {
      return res.status(400).json({
        success: false,
        error: 'chargedFarePaise or actualFareChargedINR is required.'
      });
    }

    let finalRouteId = routeId;
    let finalDriverId = driverId;
    let finalVehicleNo = vehicleNo || driverId;
    let finalOperatorId = operatorId;
    let finalExpectedPaise = expectedFarePaise !== undefined ? Number(expectedFarePaise) : null;

    const existingTrip = tripId && stmts.getTripById ? stmts.getTripById.get(String(tripId)) : null;
    if (existingTrip) {
      if (!finalRouteId) finalRouteId = existingTrip.route_id || 'SRN-BUD-01';
      if (!finalDriverId) finalDriverId = existingTrip.vehicle_no;
      if (!finalVehicleNo) finalVehicleNo = existingTrip.vehicle_no;
      if (!finalOperatorId) finalOperatorId = existingTrip.vehicle_no.split('-')[0] || 'OP_DEFAULT';
    }

    finalRouteId = finalRouteId || 'SRN-BUD-01';
    finalDriverId = finalDriverId || finalVehicleNo || 'JK01-AV-9912';
    finalVehicleNo = finalVehicleNo || finalDriverId;
    finalOperatorId = finalOperatorId || 'OP_JK_METRO';

    const activeSro = getActiveSroVersion ? getActiveSroVersion() : null;

    if (finalExpectedPaise === null) {
      // Default baseline slab if not provided
      finalExpectedPaise = 900;
    }

    const passengerPhoneHash = passengerPhone 
      ? crypto.createHash('sha256').update('safar_salt_' + String(passengerPhone).trim()).digest('hex') 
      : null;
    const passengerPhoneLast2 = passengerPhone 
      ? String(passengerPhone).trim().slice(-2) 
      : null;

    const discrepancy = recordComplianceDiscrepancyTx({
      disputeId: disputeId || null,
      tripId: tripId || `trip-disp-${Date.now()}`,
      routeId: finalRouteId,
      driverId: finalDriverId,
      vehicleNo: finalVehicleNo,
      expectedFarePaise: finalExpectedPaise,
      chargedFarePaise: computedChargedPaise,
      operatorId: finalOperatorId,
      reportedBy: reportedBy || req.headers['x-admin-id'] || (passengerPhone ? 'passenger' : 'system'),
      passengerPhoneHash,
      passengerPhoneLast2,
      clientSroVersion: clientSroVersion || null,
      sroVersionId: activeSro?.version_id || null,
      sroChecksumAtReport: activeSro?.sha256_checksum || null
    });

    if (discrepancy.duplicate) {
      return res.status(200).json({ success: true, data: discrepancy, duplicate: true });
    }

    res.status(201).json({ success: true, data: discrepancy });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8b. Resolve Commuter Dispute (Admin Review Queue)
app.post('/api/v1/admin/compliance/disputes/:disputeId/resolve', requireAdminAuth, (req, res) => {
  try {
    const { disputeId } = req.params;
    const { action, notes } = req.body || {};

    if (!action || !['UPHOLD', 'DISMISS'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "action must be either 'UPHOLD' or 'DISMISS'"
      });
    }

    const adminId = req.headers['x-admin-id'] || req.user?.username || 'admin';
    const result = resolveDisputeTx({
      disputeId,
      action,
      adminId,
      notes
    });

    if (result.error === 'DISPUTE_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Dispute not found' });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Transport Department Compliance Audit Statement Export
app.get('/api/v1/admin/compliance/audit-export', requireAdminAuth, (req, res) => {
  try {
    const { format = 'csv', operatorId, severity, routeId } = req.query || {};
    const discrepancies = getComplianceDiscrepancies({ operatorId, severity, routeId });

    if (format === 'json') {
      const canonical = canonicalJsonStringify(discrepancies);
      const checksum = crypto.createHash('sha256').update(canonical).digest('hex');
      res.setHeader('X-Audit-Checksum', checksum);
      return res.json({
        success: true,
        totalCount: discrepancies.length,
        checksum,
        exportedAt: new Date().toISOString(),
        data: discrepancies
      });
    }

    // CSV Format
    const headers = [
      'id',
      'trip_id',
      'route_id',
      'driver_id',
      'expected_fare_paise',
      'charged_fare_paise',
      'overcharge_paise',
      'overcharge_percent',
      'severity',
      'operator_id',
      'reported_by',
      'reported_at',
      'resolved_at'
    ];

    const rows = discrepancies.map(d => [
      d.id,
      `"${d.trip_id}"`,
      `"${d.route_id}"`,
      `"${d.driver_id}"`,
      d.expected_fare_paise,
      d.charged_fare_paise,
      d.overcharge_paise,
      d.overcharge_percent.toFixed(2),
      d.severity,
      `"${d.operator_id}"`,
      `"${d.reported_by || ''}"`,
      `"${d.reported_at}"`,
      `"${d.resolved_at || ''}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const checksum = crypto.createHash('sha256').update(csvContent).digest('hex');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="safar-compliance-audit-${Date.now()}.csv"`);
    res.setHeader('X-Audit-Checksum', checksum);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Fleet Operator Compliance Ratings
app.get('/api/v1/admin/compliance/operator-ratings', requireAdminAuth, (req, res) => {
  try {
    const stats = getOperatorComplianceStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ANONYMISED GOVERNMENT TELEMETRY (SPRINT 10) ──────────────────────────

function authenticateAuditorOrAdmin(req, res, next) {
  // 1. Session token
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [k, v] = cookie.trim().split('=');
      acc[k] = v;
      return acc;
    }, {});
    token = cookies['safar_admin_session'];
  }

  if (token && (activeSessions[token] || activeAdminTokens.has(token))) {
    const session = activeSessions[token] || { id: 'admin', role: 'ADMIN', expiresAt: Date.now() + 3600000 };
    if (Date.now() <= session.expiresAt) {
      req.user = session;
      return next();
    }
  }

  // 2. Direct Admin / Auditor identifier header
  const adminId = req.headers['x-admin-id'] || req.headers['x-auditor-id'];
  const userRole = req.headers['x-role'] || 'AUDITOR';
  if (adminId) {
    req.user = { id: adminId, username: adminId, role: userRole };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: { code: 'UNAUTHORIZED', message: 'Authorised government auditor or administrator authentication required.' }
  });
}

// 11. Government / Auditor Anonymised Aggregated Telemetry Export
app.get('/api/v1/government/telemetry/aggregated', authenticateAuditorOrAdmin, (req, res) => {
  try {
    const { date, routeId, format = 'json', startTime, endTime } = req.query || {};
    let start, end;

    if (date) {
      const startOfDay = new Date(date + 'T00:00:00Z').getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
      start = startOfDay;
      end = endOfDay;
    } else if (startTime && endTime) {
      start = new Date(startTime).getTime();
      end = new Date(endTime).getTime();
    } else {
      end = Date.now();
      start = end - 24 * 60 * 60 * 1000;
    }

    const records = queryAggregatedTelemetry(routeId || null, start, end);

    const anonymized = records.map(r => ({
      routeId: r.route_id,
      timeBin: new Date(r.time_bin).toISOString(),
      busCount: r.bus_count,
      avgSpeedKmh: r.avg_speed !== null ? Number(r.avg_speed.toFixed(2)) : 0,
      centroid: {
        lat: r.fuzzed_centroid_lat,
        lng: r.fuzzed_centroid_lng
      }
    }));

    if (format === 'csv') {
      const headers = ['routeId', 'timeBin', 'busCount', 'avgSpeedKmh', 'fuzzedLat', 'fuzzedLng'];
      const rows = anonymized.map(d => [
        `"${d.routeId}"`,
        `"${d.timeBin}"`,
        d.busCount,
        d.avgSpeedKmh.toFixed(2),
        d.centroid.lat.toFixed(3),
        d.centroid.lng.toFixed(3)
      ].join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const checksum = crypto.createHash('sha256').update(csvContent).digest('hex');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="safar-aggregated-telemetry-${Date.now()}.csv"`);
      res.setHeader('X-Audit-Checksum', `sha256:${checksum}`);
      return res.send(csvContent);
    }

    const canonical = canonicalJsonStringify(anonymized);
    const checksum = crypto.createHash('sha256').update(canonical).digest('hex');
    res.setHeader('X-Audit-Checksum', `sha256:${checksum}`);
    return res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      date: date || new Date(start).toISOString().split('T')[0],
      start,
      end,
      routeId: routeId || null,
      totalBins: anonymized.length,
      checksum: `sha256:${checksum}`,
      data: anonymized
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SPRINT 12: CORRIDOR 1 PILOT FEEDBACK & KPI ANALYTICS ENDPOINTS ─────────

// 1. In-App Pilot Feedback Endpoint (POST /api/v1/pilot/feedback)
app.post('/api/v1/pilot/feedback', (req, res) => {
  try {
    const { userCategory, phone, vehicleNo, routeId, category, comments, rating } = req.body || {};

    if (!comments || typeof comments !== 'string' || comments.trim().length === 0 || comments.length > 1000) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COMMENTS', message: 'Comments must be a non-empty string under 1000 characters.' }
      });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be an integer between 1 and 5.' }
      });
    }

    const validUserCats = ['commuter', 'driver', 'other'];
    const validCats = ['bug', 'suggestion', 'complaint', 'praise', 'other'];

    const feedbackRecord = recordPilotFeedbackTx({
      userCategory: validUserCats.includes(userCategory) ? userCategory : 'commuter',
      phone: typeof phone === 'string' ? phone.trim().slice(0, 20) : null,
      vehicleNo: typeof vehicleNo === 'string' ? vehicleNo.trim().slice(0, 30) : null,
      routeId: typeof routeId === 'string' ? routeId.trim().slice(0, 50) : 'SRN-BUD-01',
      category: validCats.includes(category) ? category : 'other',
      comments: comments.trim(),
      rating: numRating,
      ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1'
    });

    res.status(201).json({
      success: true,
      message: 'Pilot feedback recorded successfully.',
      data: feedbackRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Admin Pilot Feedback Review Endpoint (GET /api/v1/admin/pilot/feedback)
app.get('/api/v1/admin/pilot/feedback', requireAdminAuth, (req, res) => {
  try {
    const { status, category, limit } = req.query || {};
    const records = getPilotFeedbackRecords({
      status: status ? String(status).trim() : null,
      category: category ? String(category).trim() : null,
      limit: limit ? parseInt(limit, 10) : 50
    });

    // Mask phone numbers in admin view for privacy compliance
    const maskedRecords = records.map(r => ({
      ...r,
      phone: r.phone ? (r.phone.length > 4 ? `****${r.phone.slice(-4)}` : '****') : null
    }));

    res.json({
      success: true,
      totalCount: maskedRecords.length,
      data: maskedRecords
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Admin Pilot Feedback Triage Endpoint (PATCH /api/v1/admin/pilot/feedback/:id/triage)
app.patch('/api/v1/admin/pilot/feedback/:id/triage', requireAdminAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, triageNotes } = req.body || {};

    const validStatuses = ['open', 'triaged', 'resolved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be one of: open, triaged, resolved.' }
      });
    }

    const updated = updatePilotFeedbackTriageTx(id, {
      status,
      triagedBy: req.adminToken ? 'admin_authenticated' : 'admin_super',
      triageNotes: triageNotes ? String(triageNotes).trim() : ''
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Feedback record not found.' });
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admin Pilot Operational KPIs Endpoint (GET /api/v1/admin/pilot/kpis)
app.get('/api/v1/admin/pilot/kpis', authenticateAuditorOrAdmin, (req, res) => {
  try {
    const kpiStats = getPilotKpiStats();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: kpiStats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SAFAR PLACE & STOP GRAPH ENDPOINTS ──────────────────────────────────────

let searchRateLimitMap = new Map(); // ip -> [timestamps]
let reportRateLimitMap = new Map(); // ip -> [timestamps]
const captchaStore = new Map(); // token -> { answer, expiresAt }

// Clean rate limiters and captcha tokens
const searchCaptchaTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of searchRateLimitMap.entries()) {
    const valid = times.filter(t => now - t < 60000);
    if (valid.length === 0) searchRateLimitMap.delete(ip);
    else searchRateLimitMap.set(ip, valid);
  }
  for (const [ip, times] of reportRateLimitMap.entries()) {
    const valid = times.filter(t => now - t < 60000);
    if (valid.length === 0) reportRateLimitMap.delete(ip);
    else reportRateLimitMap.set(ip, valid);
  }
  for (const [token, data] of captchaStore.entries()) {
    if (now > data.expiresAt) captchaStore.delete(token);
  }
}, 60000);
if (searchCaptchaTimer.unref) searchCaptchaTimer.unref();

// 0. Dynamic Signed Math CAPTCHA Endpoint (GET /api/v1/captcha/challenge)
app.get('/api/v1/captcha/challenge', (req, res) => {
  try {
    const num1 = Math.floor(Math.random() * 12) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    const challengeId = 'cap_' + crypto.randomBytes(8).toString('hex');
    const token = crypto.createHmac('sha256', 'safar_captcha_secret').update(`${challengeId}:${answer}:${Date.now()}`).digest('hex');

    captchaStore.set(token, { answer, expiresAt: Date.now() + 5 * 60 * 1000 });

    res.json({
      success: true,
      challengeId,
      token,
      question: `What is ${num1} + ${num2}?`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Multilingual Place Search Endpoint (GET /api/v1/places/search?q=...)
app.get('/api/v1/places/search', (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const times = searchRateLimitMap.get(clientIp) || [];
    const validTimes = times.filter(t => now - t < 60000);

    if (validTimes.length >= 100) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded: Max 100 searches per minute.' }
      });
    }

    validTimes.push(now);
    searchRateLimitMap.set(clientIp, validTimes);

    const { q, limit } = req.query || {};
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const numLimit = limit ? Math.min(50, parseInt(limit, 10)) : 10;
    const places = searchPlaces(q, numLimit);

    res.json({
      success: true,
      query: q.trim(),
      count: places.length,
      data: places
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Ordered Route Stops Endpoint (GET /api/v1/routes/:routeId/stops)
app.get('/api/v1/routes/:routeId/stops', (req, res) => {
  try {
    const { routeId } = req.params;
    const stops = getRouteStops(routeId);

    if (!stops || stops.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'ROUTE_NOT_FOUND', message: `No stops registered for route ID: ${routeId}` }
      });
    }

    res.json({
      success: true,
      routeId,
      totalStops: stops.length,
      data: stops
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2b. Fare & ETA Estimation Endpoint (GET /api/v1/routes/:routeId/estimate)
app.get('/api/v1/routes/:routeId/estimate', (req, res) => {
  try {
    const { routeId } = req.params;
    const { fromSeq, toSeq } = req.query || {};

    const stops = getRouteStops(routeId);
    if (!stops || stops.length === 0) {
      return res.status(404).json({ success: false, error: `Route ${routeId} not found` });
    }

    const fSeq = fromSeq ? parseInt(fromSeq, 10) : 1;
    const tSeq = toSeq ? parseInt(toSeq, 10) : stops[stops.length - 1].stop_sequence;

    const fromIdx = stops.findIndex(s => s.stop_sequence === fSeq);
    const toIdx = stops.findIndex(s => s.stop_sequence === tSeq);

    if (fromIdx === -1 || toIdx === -1) {
      return res.status(400).json({ success: false, error: 'Invalid stop sequence provided.' });
    }
    if (toIdx < fromIdx) {
      return res.status(400).json({ success: false, error: 'Destination stop must follow origin stop in sequence.' });
    }

    let totalDistance = 0;
    let totalTime = 0;
    for (let i = fromIdx + 1; i <= toIdx; i++) {
      totalDistance += stops[i].distance_from_previous_m || 0;
      totalTime += stops[i].travel_time_estimate_min || 0;
    }

    // Fare heuristic: ₹10 base + ₹5 per km (rounded to nearest ₹5)
    const distanceKm = totalDistance / 1000;
    const fare = Math.max(10, Math.round((10 + (distanceKm * 5)) / 5) * 5);

    res.json({
      success: true,
      routeId,
      data: {
        fromStop: stops[fromIdx].name_en,
        toStop: stops[toIdx].name_en,
        totalDistanceKm: parseFloat(distanceKm.toFixed(2)),
        totalTimeMin: Math.round(totalTime),
        estimatedFareINR: fare
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2e. OTP Polling Fallback Endpoint (GET /api/v1/otp/status) for 2G/3G network drops
app.get('/api/v1/otp/status', (req, res) => {
  try {
    const { intentId } = req.query || {};
    if (!intentId) {
      return res.status(400).json({ success: false, error: 'intentId query parameter is required.' });
    }

    // High-performance In-Memory cache lookup to prevent SQLite write-queue contention during 6-8 AM morning peak
    let intent = otpMemoryCache.get(intentId);
    if (!intent) {
      intent = db.prepare('SELECT * FROM otp_intents WHERE intent_id = ?').get(intentId);
      if (intent) otpMemoryCache.set(intentId, intent);
    }

    if (!intent) {
      return res.status(404).json({ success: false, error: 'OTP intent not found or expired.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = intent.expires_at || intent.expiresAt || 0;
    const isExpired = expiresAt < now;

    res.json({
      success: true,
      data: {
        intentId: intent.intent_id || intent.intentId,
        otpHash: intent.otp_hash || intent.otpHash,
        displayOtp: intent.display_otp || intent.displayOtp,
        verified: intent.verified === 1 || intent.verified === true,
        expired: isExpired,
        createdAt: intent.created_at || intent.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2f. Zero-Fee Driver Shift Activation Endpoint (POST /api/v1/driver/shift/activate)
app.post('/api/v1/driver/shift/activate', (req, res) => {
  try {
    const { driverId, vehicleNo, routeId } = req.body || {};
    if (!driverId && !vehicleNo) {
      return res.status(400).json({ success: false, error: 'driverId or vehicleNo is required.' });
    }

    const id = driverId || vehicleNo;
    db.prepare(`
      INSERT INTO audit_events (actor_id, actor_role, action, details_json, created_at)
      VALUES (?, 'DRIVER', 'FREE_SHIFT_ACTIVATED', ?, datetime('now'))
    `).run(id, JSON.stringify({ routeId: routeId || 'SRN-SNM-02', fee: 0 }));

    res.json({
      success: true,
      feeINR: 0,
      message: `Shift activated for ${id} (100% Free Driver Access). Telemetry & Direct UPI ready.`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post('/api/v1/telemetry/push', (req, res) => {
  try {
    const { vehicleNo, routeId, lat, lng, speed, heading, nextStop } = req.body || {};
    if (!vehicleNo || !lat || !lng) {
      return res.status(400).json({ success: false, error: 'vehicleNo, lat, and lng are required.' });
    }

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);

    insertGpsPing({
      driverId: 'drv_sim',
      vehicleNo,
      routeId: routeId || 'SRN-SNM-02',
      lat: numLat,
      lng: numLng,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date().toISOString()
    });

    broadcastRealVehicleGps({
      vehicleNo,
      routeId: routeId || 'SRN-SNM-02',
      lat: numLat,
      lng: numLng,
      speed: speed || 0,
      heading: heading || 0,
      nextStop: nextStop || 'En route'
    });

    res.json({
      success: true,
      message: 'Real-time vehicle telemetry ingested and broadcast successfully.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2d. Multi-Stop Route Optimization & Trip Planner (GET /api/v1/routing/plan)
app.get('/api/v1/routing/plan', (req, res) => {
  try {
    const { originPlaceId, destPlaceId, origin, destination } = req.query || {};
    
    let originPlace = originPlaceId ? db.prepare('SELECT * FROM places WHERE id = ?').get(parseInt(originPlaceId, 10)) : null;
    let destPlace = destPlaceId ? db.prepare('SELECT * FROM places WHERE id = ?').get(parseInt(destPlaceId, 10)) : null;

    if (!originPlace && origin) {
      originPlace = db.prepare('SELECT * FROM places WHERE name_en LIKE ? AND deleted_at IS NULL LIMIT 1').get(`%${origin}%`);
    }
    if (!destPlace && destination) {
      destPlace = db.prepare('SELECT * FROM places WHERE name_en LIKE ? AND deleted_at IS NULL LIMIT 1').get(`%${destination}%`);
    }

    if (!originPlace || !destPlace) {
      const allStops = getRouteStops('SRN-BUD-01');
      originPlace = originPlace || allStops[0];
      destPlace = destPlace || allStops[allStops.length - 1];
    }

    const oId = originPlace.id || originPlace.place_id;
    const dId = destPlace.id || destPlace.place_id;

    const originRoutes = db.prepare('SELECT DISTINCT route_id FROM route_stops WHERE place_id = ?').all(oId).map(r => r.route_id);
    const destRoutes = db.prepare('SELECT DISTINCT route_id FROM route_stops WHERE place_id = ?').all(dId).map(r => r.route_id);

    const commonRoute = originRoutes.find(r => destRoutes.includes(r));

    if (commonRoute) {
      const stops = getRouteStops(commonRoute);
      const oStop = stops.find(s => s.place_id === oId);
      const dStop = stops.find(s => s.place_id === dId);

      if (oStop && dStop) {
        const minSeq = Math.min(oStop.stop_sequence, dStop.stop_sequence);
        const maxSeq = Math.max(oStop.stop_sequence, dStop.stop_sequence);

        let distM = 0;
        let timeMin = 0;
        const pathStops = stops.filter(s => s.stop_sequence >= minSeq && s.stop_sequence <= maxSeq);
        for (let i = 1; i < pathStops.length; i++) {
          distM += pathStops[i].distance_from_previous_m || 0;
          timeMin += pathStops[i].travel_time_estimate_min || 0;
        }

        const distKm = distM / 1000;
        const fareINR = Math.max(10, Math.round((10 + (distKm * 5)) / 5) * 5);

        return res.json({
          success: true,
          tripType: 'DIRECT',
          routeId: commonRoute,
          transfers: 0,
          origin: originPlace.name_en,
          destination: destPlace.name_en,
          totalDistanceKm: parseFloat(distKm.toFixed(2)),
          totalTimeMin: Math.round(timeMin),
          estimatedFareINR: fareINR,
          routeStopsCount: Math.abs(dStop.stop_sequence - oStop.stop_sequence)
        });
      }
    }

    // Transfer route (e.g. Corridor 1 -> Interchange -> Corridor 2)
    const distKm = haversineDistanceKm(originPlace.lat, originPlace.lng, destPlace.lat, destPlace.lng);
    const estTimeMin = Math.round((distKm / 30) * 60);
    const fareINR = Math.max(15, Math.round((15 + (distKm * 5)) / 5) * 5);

    res.json({
      success: true,
      tripType: 'TRANSFER',
      transfers: 1,
      interchangeHub: 'Lal Chowk Ghanta Ghar (Interchange)',
      origin: originPlace.name_en,
      destination: destPlace.name_en,
      totalDistanceKm: parseFloat(distKm.toFixed(2)),
      totalTimeMin: estTimeMin,
      estimatedFareINR: fareINR
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Duplicate Inspection Endpoint (GET /api/v1/places/duplicates)
app.get('/api/v1/places/duplicates', (req, res) => {
  try {
    const { nameEn, lat, lng } = req.query || {};
    if (!nameEn || !lat || !lng) {
      return res.status(400).json({ success: false, error: 'nameEn, lat, and lng required.' });
    }
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    const duplicates = findPotentialDuplicates({ nameEn, lat: numLat, lng: numLng });
    res.json({ success: true, count: duplicates.length, data: duplicates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Missing Landmark/Stop Reporting Endpoint (POST /api/v1/places/report)
app.post('/api/v1/places/report', (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const times = reportRateLimitMap.get(clientIp) || [];
    const validTimes = times.filter(t => now - t < 60000);

    if (validTimes.length >= 20) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded: Max 20 place reports per minute.' }
      });
    }

    const { nameEn, nameHi, nameUr, nameKs, type, lat, lng, source, captchaToken, captchaAnswer } = req.body || {};

    if (captchaToken) {
      const stored = captchaStore.get(captchaToken);
      if (!stored || Date.now() > stored.expiresAt) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CAPTCHA', message: 'CAPTCHA token expired or invalid. Please refresh challenge.' }
        });
      }
      if (parseInt(captchaAnswer, 10) !== stored.answer) {
        return res.status(400).json({
          success: false,
          error: { code: 'CAPTCHA_FAILED', message: 'Incorrect CAPTCHA answer.' }
        });
      }
      captchaStore.delete(captchaToken);
    }

    if (!nameEn || typeof nameEn !== 'string' || nameEn.trim().length === 0 || nameEn.length > 200) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'nameEn is required and must be under 200 characters.' }
      });
    }

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (isNaN(numLat) || numLat < -90 || numLat > 90 || isNaN(numLng) || numLng < -180 || numLng > 180) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid lat (-90..90) and lng (-180..180) required.' }
      });
    }

    validTimes.push(now);
    reportRateLimitMap.set(clientIp, validTimes);

    const reported = reportMissingPlace({
      nameEn: nameEn.trim(),
      nameHi,
      nameUr,
      nameKs,
      type: type || 'landmark',
      lat: numLat,
      lng: numLng,
      source: source || 'user',
      ipAddress: clientIp
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! We\'ll review your suggestion.',
      data: reported
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Admin Pending Unverified Places Queue (GET /api/v1/admin/places/pending)
app.get('/api/v1/admin/places/pending', requireAdminAuth, (req, res) => {
  try {
    const { type, limit } = req.query || {};
    const pending = getPendingPlaces({
      type: type ? String(type).trim() : null,
      limit: limit ? parseInt(limit, 10) : 50
    });

    res.json({
      success: true,
      count: pending.length,
      data: pending
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Admin Place Verification & Merging Endpoint (POST /api/v1/admin/places/verify)
app.post('/api/v1/admin/places/verify', requireAdminAuth, (req, res) => {
  try {
    const body = req.body || {};

    // Support bulk verification payload: { items: [{ placeId, action, mergedPlaceId }] }
    if (Array.isArray(body.items) || Array.isArray(body)) {
      const itemsList = Array.isArray(body.items) ? body.items : body;
      const bulkResult = verifyPlacesBulkTx({
        items: itemsList,
        adminId: 'admin_authenticated',
        ipAddress: req.ip || '127.0.0.1'
      });
      return res.json({
        success: true,
        message: `Bulk verification complete. Approved: ${bulkResult.approvedCount}, Rejected: ${bulkResult.rejectedCount}, Merged: ${bulkResult.mergedCount}`,
        data: bulkResult
      });
    }

    const { placeId, action, mergedPlaceId } = body;
    const numPlaceId = parseInt(placeId, 10);

    if (isNaN(numPlaceId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PLACE_ID', message: 'Valid placeId integer required.' }
      });
    }

    const validActions = ['approve', 'reject', 'merge'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Action must be one of: approve, reject, merge.' }
      });
    }

    const updated = verifyPlace({
      placeId: numPlaceId,
      action,
      mergedPlaceId: mergedPlaceId ? parseInt(mergedPlaceId, 10) : null,
      adminId: 'admin_authenticated'
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Place record not found.' });
    }

    res.json({
      success: true,
      message: `Place ${action} action executed successfully.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const { startAggregatorTimers } = require('./telemetryAggregator');
startAggregatorTimers();

app.get('/*path', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ─── GRACEFUL SHUTDOWN HANDLER ────────────────────────────────────────────────

function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Initiating graceful shutdown...`);

  // 1. Stop accepting new connections
  server.close(() => {
    console.log('[Shutdown] HTTP server closed.');
  });

  // 2. Close SSE connections with retry hint
  sseClients.forEach(client => {
    try {
      client.write('event: server_shutdown\ndata: {"retry":5000}\n\n');
      client.end();
    } catch (e) {}
  });
  sseClients.clear();

  // 3. Flush pending writes
  saveLedgerDb();

  // 4. Clear intervals
  clearInterval(staleTripTimer);
  clearInterval(adminCleanupTimer);
  clearInterval(upiRateLimitTimer);

  setTimeout(() => {
    console.log('[Shutdown] Complete.');
    process.exit(0);
  }, 3000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Safar Unified Transit Ecosystem running on port ${PORT} (0.0.0.0)`);
    console.log(`   - Main & Commuter Portal: http://localhost:${PORT}/commuter`);
    console.log(`   - Driver & Conductor:     http://localhost:${PORT}/driver`);
    console.log(`   - Admin Regulatory Suite: http://localhost:${PORT}/admin`);
    console.log(`   - Government Enforcement: http://localhost:${PORT}/govt`);
    console.log(`   - Health Check:           http://localhost:${PORT}/healthz`);
  });
}







function broadcastTelemetry(payload) {
  recordBroadcastTimestamp();
  const ssePayload = "event: telemetry\ndata: " + JSON.stringify(payload) + "\n\n";
  sseClients.forEach(client => {
    try {
      client.write(ssePayload);
      if (typeof client.flush === "function") client.flush();
    } catch (e) { }
  });
}

module.exports = { app, server, activeDriverTokens, activeTripsStore, driversStore, tripsLedger, driverEarningsLedger, activeAdminTokens, recentBroadcastTimestamps, adminLoginRateLimitMap, sseClients, broadcastTelemetry, serverRoutesDb, calculateServerStatutoryFare };




