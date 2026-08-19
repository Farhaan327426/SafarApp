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

  -- Indexes for common query patterns
  CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips_ledger(vehicle_no);
  CREATE INDEX IF NOT EXISTS idx_trips_status ON trips_ledger(status);
  CREATE INDEX IF NOT EXISTS idx_trips_created ON trips_ledger(created_at);
  CREATE INDEX IF NOT EXISTS idx_shifts_expires ON driver_shifts(expires_at);
  CREATE INDEX IF NOT EXISTS idx_drivers_kyc ON drivers(kyc_status);
  CREATE INDEX IF NOT EXISTS idx_drivers_vehicle ON drivers(driver_vehicle_no);
  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
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
  closeDb,
  DB_PATH
};
