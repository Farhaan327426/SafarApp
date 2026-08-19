/**
 * SAFAR — SQLite Database Module (WAL Mode)
 * Drop-in replacement for MutexWriteQueue JSON persistence.
 * Uses better-sqlite3 for synchronous, high-performance SQLite access.
 * 
 * WAL mode enables concurrent reads with serialized writes.
 * busy_timeout prevents SQLITE_BUSY errors under contention.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'safar.db');
const db = new Database(DB_PATH);

// ─── PRAGMAS ──────────────────────────────────────────────────────────────────
db.pragma('journal_mode = WAL');       // Write-Ahead Logging: concurrent reads + serialized writes
db.pragma('busy_timeout = 5000');      // Wait up to 5s if another connection is writing
db.pragma('synchronous = NORMAL');     // Safe with WAL — fsync only on checkpoint, not every commit
db.pragma('foreign_keys = ON');        // Enforce referential integrity
db.pragma('cache_size = -8000');       // 8MB page cache (negative = KB)

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS driver_profiles (
    vehicle_no TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    upi_id_enc TEXT,
    bank_account_enc TEXT,
    bank_ifsc_enc TEXT,
    bank_holder_enc TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trips_ledger (
    trip_id TEXT PRIMARY KEY,
    vehicle_no TEXT NOT NULL,
    amount REAL NOT NULL,
    route_id TEXT,
    origin TEXT,
    destination TEXT,
    status TEXT DEFAULT 'AWAITING_PAYMENT',
    otp_hash TEXT,
    otp_expires_at INTEGER,
    otp_attempts INTEGER DEFAULT 3,
    is_redeemed INTEGER DEFAULT 0,
    upi_ref TEXT,
    paid_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_no) REFERENCES driver_profiles(vehicle_no)
  );

  CREATE TABLE IF NOT EXISTS driver_earnings (
    vehicle_no TEXT PRIMARY KEY,
    total_earnings REAL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_no) REFERENCES driver_profiles(vehicle_no)
  );

  CREATE TABLE IF NOT EXISTS driver_shifts (
    token TEXT PRIMARY KEY,
    vehicle_no TEXT NOT NULL,
    route_id TEXT,
    vehicle_type TEXT DEFAULT 'MINI_BUS',
    created_at INTEGER,
    expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS audit_events (
    event_id TEXT PRIMARY KEY,
    actor_id TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    ip_address TEXT,
    result TEXT DEFAULT 'SUCCESS'
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_phone TEXT UNIQUE NOT NULL,
    driver_name TEXT NOT NULL,
    driver_vehicle_no TEXT UNIQUE NOT NULL,
    driver_upi_id TEXT NOT NULL,
    kyc_status TEXT NOT NULL DEFAULT 'not_submitted'
      CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
    kyc_doc_licence TEXT,
    kyc_doc_vehicle_rc TEXT,
    kyc_doc_route_permit TEXT,
    kyc_submitted_at TEXT,
    kyc_rejection_reason TEXT,
    kyc_verified_at TEXT,
    verified_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE NOT NULL,
    vehicle_no TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    upi_id_encrypted TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    rejection_reason TEXT,
    utr_reference TEXT,
    requested_at TEXT NOT NULL DEFAULT (datetime('now')),
    approved_at TEXT,
    paid_at TEXT,
    admin_id TEXT
  );

  CREATE TABLE IF NOT EXISTS payout_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payout_id INTEGER NOT NULL,
    trip_id TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (payout_id) REFERENCES payouts(id),
    UNIQUE (payout_id, trip_id)
  );

  -- Indexes for common query patterns
  CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips_ledger(vehicle_no);
  CREATE INDEX IF NOT EXISTS idx_trips_status ON trips_ledger(status);
  CREATE INDEX IF NOT EXISTS idx_trips_created ON trips_ledger(created_at);
  CREATE INDEX IF NOT EXISTS idx_shifts_expires ON driver_shifts(expires_at);
  CREATE INDEX IF NOT EXISTS idx_drivers_kyc ON drivers(kyc_status);
  CREATE INDEX IF NOT EXISTS idx_drivers_vehicle ON drivers(driver_vehicle_no);
  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
  CREATE INDEX IF NOT EXISTS idx_payouts_vehicle_status ON payouts(vehicle_no, status);
  CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
  CREATE INDEX IF NOT EXISTS idx_payout_alloc_trip ON payout_allocations(trip_id);
`);

// ─── PREPARED STATEMENTS ──────────────────────────────────────────────────────
// Prepared statements are compiled once and reused for performance.

const stmts = {
  // Driver Profiles
  upsertDriver: db.prepare(`
    INSERT INTO driver_profiles (vehicle_no, name, upi_id_enc, bank_account_enc, bank_ifsc_enc, bank_holder_enc, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(vehicle_no) DO UPDATE SET
      name = excluded.name,
      upi_id_enc = excluded.upi_id_enc,
      bank_account_enc = excluded.bank_account_enc,
      bank_ifsc_enc = excluded.bank_ifsc_enc,
      bank_holder_enc = excluded.bank_holder_enc,
      updated_at = datetime('now')
  `),

  getDriver: db.prepare('SELECT * FROM driver_profiles WHERE vehicle_no = ?'),
  getAllDrivers: db.prepare('SELECT * FROM driver_profiles'),

  // Trips Ledger
  insertTrip: db.prepare(`
    INSERT INTO trips_ledger (trip_id, vehicle_no, amount, route_id, origin, destination, status, otp_hash, otp_expires_at, otp_attempts, is_redeemed, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `),

  getTripById: db.prepare('SELECT * FROM trips_ledger WHERE trip_id = ?'),
  getTripsByVehicle: db.prepare('SELECT * FROM trips_ledger WHERE vehicle_no = ? ORDER BY created_at DESC'),
  getPaidTripsByVehicle: db.prepare('SELECT * FROM trips_ledger WHERE vehicle_no = ? AND status = ? ORDER BY created_at DESC'),
  getRecentPaidTrips: db.prepare('SELECT * FROM trips_ledger WHERE vehicle_no = ? AND status = ? ORDER BY created_at DESC LIMIT 20'),

  updateTripStatus: db.prepare(`
    UPDATE trips_ledger SET status = ?, upi_ref = ?, paid_at = ? WHERE trip_id = ?
  `),

  updateTripOtpAttempts: db.prepare(`
    UPDATE trips_ledger SET otp_attempts = ? WHERE trip_id = ?
  `),

  markTripRedeemed: db.prepare(`
    UPDATE trips_ledger SET is_redeemed = 1 WHERE trip_id = ?
  `),

  // Driver Earnings
  upsertEarnings: db.prepare(`
    INSERT INTO driver_earnings (vehicle_no, total_earnings, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(vehicle_no) DO UPDATE SET
      total_earnings = total_earnings + excluded.total_earnings,
      updated_at = datetime('now')
  `),

  getEarnings: db.prepare('SELECT total_earnings FROM driver_earnings WHERE vehicle_no = ?'),

  // Driver KYC Operations
  upsertDriverKycOnboard: db.prepare(`
    INSERT INTO drivers (driver_phone, driver_name, driver_vehicle_no, driver_upi_id, kyc_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'not_submitted', datetime('now'), datetime('now'))
    ON CONFLICT(driver_vehicle_no) DO UPDATE SET
      driver_phone = excluded.driver_phone,
      driver_name = excluded.driver_name,
      driver_upi_id = excluded.driver_upi_id,
      updated_at = datetime('now')
  `),

  getDriverByVehicle: db.prepare('SELECT * FROM drivers WHERE driver_vehicle_no = ?'),
  getDriverByPhone: db.prepare('SELECT * FROM drivers WHERE driver_phone = ?'),
  getDriverById: db.prepare('SELECT * FROM drivers WHERE id = ?'),

  updateDriverKycDocs: db.prepare(`
    UPDATE drivers SET
      kyc_doc_licence = ?,
      kyc_doc_vehicle_rc = ?,
      kyc_doc_route_permit = ?,
      kyc_status = 'pending',
      kyc_submitted_at = datetime('now'),
      updated_at = datetime('now')
    WHERE driver_vehicle_no = ?
  `),

  getPendingKycDrivers: db.prepare(`
    SELECT id, driver_phone, driver_name, driver_vehicle_no, driver_upi_id, kyc_status, kyc_submitted_at
    FROM drivers
    WHERE kyc_status = 'pending'
    ORDER BY kyc_submitted_at ASC
  `),

  verifyDriverKyc: db.prepare(`
    UPDATE drivers SET
      kyc_status = ?,
      kyc_rejection_reason = ?,
      kyc_verified_at = datetime('now'),
      verified_by = ?,
      updated_at = datetime('now')
    WHERE driver_vehicle_no = ? OR id = ?
  `),

  // Payouts & Allocations
  getPayoutByRequestId: db.prepare('SELECT * FROM payouts WHERE request_id = ?'),
  getPayoutById: db.prepare('SELECT * FROM payouts WHERE id = ?'),
  getPayoutsByVehicle: db.prepare('SELECT * FROM payouts WHERE vehicle_no = ? ORDER BY requested_at DESC'),
  getAllPayouts: db.prepare('SELECT * FROM payouts ORDER BY requested_at DESC'),
  getPendingPayouts: db.prepare("SELECT * FROM payouts WHERE status = 'pending' ORDER BY requested_at ASC"),

  insertPayout: db.prepare(`
    INSERT INTO payouts (request_id, vehicle_no, amount_paise, upi_id_encrypted, status, requested_at)
    VALUES (?, ?, ?, ?, 'pending', datetime('now'))
  `),

  insertPayoutAllocation: db.prepare(`
    INSERT INTO payout_allocations (payout_id, trip_id, amount_paise, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `),

  deletePayoutAllocations: db.prepare('DELETE FROM payout_allocations WHERE payout_id = ?'),

  updatePayoutStatus: db.prepare(`
    UPDATE payouts SET
      status = ?,
      rejection_reason = ?,
      utr_reference = ?,
      approved_at = CASE WHEN ? = 'approved' THEN datetime('now') ELSE approved_at END,
      paid_at = CASE WHEN ? = 'paid' THEN datetime('now') ELSE paid_at END,
      admin_id = ?
    WHERE id = ?
  `),

  // Audit Events
  insertAudit: db.prepare(`
    INSERT INTO audit_events (event_id, actor_id, actor_role, action, resource_type, resource_id, details, timestamp, ip_address, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
  `),

  getRecentAuditEvents: db.prepare('SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT ?'),
  getAllAuditEvents: db.prepare('SELECT * FROM audit_events ORDER BY timestamp DESC'),
};

// ─── TRANSACTION HELPERS ──────────────────────────────────────────────────────

/**
 * Record a payment: update trip status + increment driver earnings atomically.
 */
const recordPaymentTx = db.transaction((tripId, status, upiRef, paidAt, vehicleNo, amount) => {
  stmts.updateTripStatus.run(status, upiRef, paidAt, tripId);
  stmts.upsertEarnings.run(vehicleNo, amount);
});

/**
 * Calculate available balance in paise for a vehicle:
 * Confirmed trips in trips_ledger minus any amounts allocated to pending/approved/paid payouts.
 */
function getAvailableBalancePaise(vehicleNo) {
  const earnedRow = db.prepare(`
    SELECT COALESCE(SUM(ROUND(tl.amount * 100)), 0) AS total_earned_paise
    FROM trips_ledger tl
    WHERE tl.vehicle_no = ? AND tl.status = 'PAID'
  `).get(vehicleNo);

  const allocatedRow = db.prepare(`
    SELECT COALESCE(SUM(p.amount_paise), 0) AS total_allocated_paise
    FROM payouts p
    WHERE p.vehicle_no = ? AND p.status IN ('pending', 'approved', 'paid')
  `).get(vehicleNo);

  const earned = Number(earnedRow?.total_earned_paise || 0);
  const allocated = Number(allocatedRow?.total_allocated_paise || 0);
  return Math.max(0, earned - allocated);
}

/**
 * Atomic Payout Request Transaction:
 * Checks idempotency, validates available balance in paise, inserts payout record,
 * and creates FIFO allocations linking confirmed trips.
 */
const requestPayoutTx = db.transaction((vehicleNo, requestId, amountPaise, encryptedUpiId) => {
  const existing = stmts.getPayoutByRequestId.get(requestId);
  if (existing) {
    return { status: 'duplicate', payout: existing };
  }

  const availablePaise = getAvailableBalancePaise(vehicleNo);
  if (availablePaise < amountPaise) {
    return { status: 'insufficient', availablePaise };
  }

  const result = stmts.insertPayout.run(requestId, vehicleNo, amountPaise, encryptedUpiId);
  const payoutId = Number(result.lastInsertRowid);

  // Allocate confirmed unallocated trips in FIFO order
  const unallocatedTrips = db.prepare(`
    SELECT tl.trip_id, ROUND(tl.amount * 100) AS amount_paise
    FROM trips_ledger tl
    WHERE tl.vehicle_no = ? AND tl.status = 'PAID'
      AND tl.trip_id NOT IN (
        SELECT pa.trip_id
        FROM payout_allocations pa
        JOIN payouts p ON p.id = pa.payout_id
        WHERE p.status IN ('pending', 'approved', 'paid')
      )
    ORDER BY tl.created_at ASC
  `).all(vehicleNo);

  let remaining = amountPaise;
  for (const trip of unallocatedTrips) {
    if (remaining <= 0) break;
    const alloc = Math.min(Number(trip.amount_paise), remaining);
    stmts.insertPayoutAllocation.run(payoutId, trip.trip_id, alloc);
    remaining -= alloc;
  }

  return {
    status: 'ok',
    payoutId,
    amountPaise,
    remainingAvailablePaise: availablePaise - amountPaise
  };
});

/**
 * Atomic Admin Approve Payout
 */
const approvePayoutTx = db.transaction((payoutId, adminId) => {
  const payout = stmts.getPayoutById.get(payoutId);
  if (!payout) return { status: 'not_found' };
  if (payout.status !== 'pending') return { status: 'invalid_state', currentStatus: payout.status };

  stmts.updatePayoutStatus.run('approved', null, null, 'approved', null, adminId, payoutId);
  return { status: 'ok', payout: stmts.getPayoutById.get(payoutId) };
});

/**
 * Atomic Admin Reject Payout (Releases allocations back to driver available balance)
 */
const rejectPayoutTx = db.transaction((payoutId, adminId, reason) => {
  const payout = stmts.getPayoutById.get(payoutId);
  if (!payout) return { status: 'not_found' };
  if (payout.status !== 'pending' && payout.status !== 'approved') {
    return { status: 'invalid_state', currentStatus: payout.status };
  }

  stmts.updatePayoutStatus.run('rejected', reason, null, null, null, adminId, payoutId);
  stmts.deletePayoutAllocations.run(payoutId);
  return { status: 'ok', payout: stmts.getPayoutById.get(payoutId) };
});

/**
 * Atomic Admin Mark Paid Payout with UTR Reference
 */
const markPaidPayoutTx = db.transaction((payoutId, adminId, utrReference) => {
  const payout = stmts.getPayoutById.get(payoutId);
  if (!payout) return { status: 'not_found' };
  if (payout.status !== 'approved') {
    return { status: 'invalid_state', currentStatus: payout.status };
  }

  stmts.updatePayoutStatus.run('paid', null, utrReference, null, 'paid', adminId, payoutId);
  return { status: 'ok', payout: stmts.getPayoutById.get(payoutId) };
});

/**
 * Close the database connection gracefully.
 */
function closeDb() {
  try {
    db.close();
    console.log('[DB] SQLite database closed gracefully.');
  } catch (err) {
    console.error('[DB] Error closing database:', err.message);
  }
}

module.exports = {
  db,
  stmts,
  recordPaymentTx,
  getAvailableBalancePaise,
  requestPayoutTx,
  approvePayoutTx,
  rejectPayoutTx,
  markPaidPayoutTx,
  closeDb,
  DB_PATH
};
