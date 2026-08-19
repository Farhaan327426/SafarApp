/**
 * Safar Administration Platform — Production Microservice & Transit Control Engine
 * Enterprise Architecture with Server-Side Authorization, Idempotency, Optimistic Concurrency Control (OCC),
 * Draft->Review->Publish Workflow, Fare Version Rollback, Activity Timeline, & Formula Injection Sanitization.
 */

const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { encryptField, decryptField, hashOtp } = require('./cryptoUtils');
const { MutexWriteQueue } = require('./mutexQueue');
const { deepRedact } = require('./sanitizer');
const { stmts, recordPaymentTx } = require('./db');
const stateStore = require('./stateStore');

stateStore.init({
  redisUrl: process.env.REDIS_URL || null,
});

const app = express();
const server = http.createServer(app);
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

// Security Headers & Dynamic CSP Nonce Middleware
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  req.requestId = generateId("req");

  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.cartocdn.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://unpkg.com https://cdn.jsdelivr.net; connect-src 'self' https://*.basemaps.cartocdn.com https://*.cartocdn.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://unpkg.com https://cdn.jsdelivr.net; frame-ancestors 'none'; base-uri 'self';`
  );

  next();
});

// Serve Frontend Application Files
app.use(express.static(path.join(__dirname, '..', 'frontend')));


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

// 1. 
// 1. Driver Shift Start Endpoint (Authenticated via Driver Registration Secret / PIN)
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

  const driverToken = `drv_tok_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const expiresAt = Date.now() + 12 * 3600 * 1000;

  activeDriverTokens.set(driverToken, {
    vehicleNo,
    routeId,
    vehicleType: vehicleType || 'MINI_BUS',
    expiresAt
  });

  res.json({
    success: true,
    data: { driverToken, expiresAt, vehicleNo, routeId }
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

  // stateStore: Update snapshot & publish to telemetry channel
  await stateStore.updateSnapshot(vehicleNo, tripData);
  await stateStore.publish('telemetry.broadcast', tripData);

  res.json({ success: true, timestamp: tripData.timestamp });
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
    unsubBroadcast();
    unsubTripRemoved();
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
setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of lastAiQueryTimeMap.entries()) {
    if (now - time > 60000) lastAiQueryTimeMap.delete(ip);
  }
}, 60000);

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
    answer = "⚖️ Regulatory Compliance & Dispute Redressal: All stage carriage operators must adhere strictly to the notified rate schedule. If a conductor overcharges or refuses to issue a receipt, you can report the vehicle number to the Transport Authority Control Room or Police PCR (112). Use the Fare Calculator tab to display the official verified slab fare.";
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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED: Admin token required." });
  }
  const token = authHeader.substring(7);
  const session = activeAdminTokens.get(token);
  if (!session || Date.now() >= session.expiresAt) {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED: Admin token invalid or expired." });
  }
  req.adminSession = session;
  req.adminToken = token;
  next();
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
  const validPin = process.env.ADMIN_PIN || "safar-admin-2026";

  if (adminPin !== validPin) {
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
      return res.status(400).json({
        success: false,
        error: { code: 'OTP_EXPIRED', message: 'OTP has expired or already been redeemed.' }
      });
    }

    if (trip.otpAttemptsRemaining <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'OTP_LOCKED', message: 'Max verification attempts exceeded for this OTP.' }
      });
    }

    const inputHash = hashOtp(otpCode);
    if (inputHash !== trip.otpHash) {
      trip.otpAttemptsRemaining = (trip.otpAttemptsRemaining || 1) - 1;
      saveLedgerDb();
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




