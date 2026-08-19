/**
 * SAFAR — JSON → SQLite One-Time Migration Script
 * Reads existing MutexWriteQueue JSON ledger and imports into SQLite.
 * 
 * Usage: node command-control-server/migrate-json-to-sqlite.js
 * 
 * Safe to run multiple times (uses INSERT OR IGNORE for trips).
 */

const fs = require('fs');
const path = require('path');
const { MutexWriteQueue } = require('./mutexQueue');
const { db, stmts } = require('./db');

const JSON_DB_PATH = path.join(__dirname, 'data', 'safar_ledger_db.json');

function migrate() {
  console.log('─── SAFAR JSON → SQLite Migration ───');
  console.log(`Source: ${JSON_DB_PATH}`);
  console.log(`Target: ${path.join(__dirname, 'data', 'safar.db')}`);
  console.log('');

  // 1. Check if JSON file exists
  if (!fs.existsSync(JSON_DB_PATH)) {
    console.log('ℹ️  No JSON ledger file found. Nothing to migrate.');
    console.log('   SQLite database is ready with empty tables.');
    return;
  }

  // 2. Read and verify JSON data
  let data;
  try {
    const raw = fs.readFileSync(JSON_DB_PATH, 'utf8');
    try {
      data = MutexWriteQueue.verifyAndUnwrapData(raw);
    } catch (err) {
      console.warn('⚠️  Checksum verification failed, attempting raw parse:', err.message);
      data = JSON.parse(raw);
      if (data.data) data = data.data; // Handle wrapper format
    }
  } catch (err) {
    console.error('❌ Failed to read JSON file:', err.message);
    process.exit(1);
  }

  if (!data) {
    console.error('❌ No data found in JSON file.');
    process.exit(1);
  }

  // 3. Migrate within a transaction (all-or-nothing)
  const migrateTx = db.transaction(() => {
    let driversCount = 0;
    let tripsCount = 0;
    let earningsCount = 0;

    // 3a. Migrate driver profiles
    if (Array.isArray(data.driversStore)) {
      for (const [vehicleNo, profile] of data.driversStore) {
        if (!vehicleNo || !profile) continue;
        stmts.upsertDriver.run(
          vehicleNo,
          profile.name || 'Unknown',
          profile.upiId || null,
          profile.bankAccount?.accountNumber || null,
          profile.bankAccount?.ifsc || null,
          profile.bankAccount?.accountHolderName || null
        );
        driversCount++;
      }
      console.log(`✅ Migrated ${driversCount} driver profiles`);
    } else {
      console.log('ℹ️  No driver profiles found in JSON data');
    }

    // 3b. Migrate trips ledger
    if (Array.isArray(data.tripsLedger)) {
      const insertTrip = db.prepare(`
        INSERT OR IGNORE INTO trips_ledger 
        (trip_id, vehicle_no, amount, route_id, origin, destination, status, otp_hash, otp_expires_at, otp_attempts, is_redeemed, upi_ref, paid_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const trip of data.tripsLedger) {
        if (!trip.tripId || !trip.vehicleNo) continue;

        // Ensure driver profile exists (referential integrity)
        const existingDriver = stmts.getDriver.get(trip.vehicleNo);
        if (!existingDriver) {
          stmts.upsertDriver.run(trip.vehicleNo, 'Migrated Driver', null, null, null, null);
          driversCount++;
        }

        insertTrip.run(
          trip.tripId,
          trip.vehicleNo,
          trip.amount || 0,
          trip.routeId || null,
          trip.origin || null,
          trip.destination || null,
          trip.status || 'AWAITING_PAYMENT',
          trip.otpHash || null,
          trip.otpExpiresAt || null,
          trip.otpAttemptsRemaining ?? 3,
          trip.isRedeemed ? 1 : 0,
          trip.upiRef || null,
          trip.paidAt || null,
          trip.createdAt || new Date().toISOString()
        );
        tripsCount++;
      }
      console.log(`✅ Migrated ${tripsCount} trip records`);
    } else {
      console.log('ℹ️  No trips found in JSON data');
    }

    // 3c. Migrate driver earnings
    if (Array.isArray(data.driverEarningsLedger)) {
      const upsertEarnings = db.prepare(`
        INSERT OR REPLACE INTO driver_earnings (vehicle_no, total_earnings)
        VALUES (?, ?)
      `);

      for (const [vehicleNo, earnings] of data.driverEarningsLedger) {
        if (!vehicleNo) continue;

        // Ensure driver profile exists
        const existingDriver = stmts.getDriver.get(vehicleNo);
        if (!existingDriver) {
          stmts.upsertDriver.run(vehicleNo, 'Migrated Driver', null, null, null, null);
        }

        upsertEarnings.run(vehicleNo, earnings || 0);
        earningsCount++;
      }
      console.log(`✅ Migrated ${earningsCount} earnings records`);
    } else {
      console.log('ℹ️  No earnings data found in JSON data');
    }

    return { driversCount, tripsCount, earningsCount };
  });

  // 4. Execute migration
  try {
    const result = migrateTx();
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  MIGRATION COMPLETE');
    console.log(`  Drivers:  ${result.driversCount}`);
    console.log(`  Trips:    ${result.tripsCount}`);
    console.log(`  Earnings: ${result.earningsCount}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('ℹ️  The original JSON file has been preserved.');
    console.log('   You can safely rename or archive it:');
    console.log(`   ${JSON_DB_PATH} → ${JSON_DB_PATH}.migrated.bak`);
  } catch (err) {
    console.error('❌ Migration failed (rolled back):', err.message);
    process.exit(1);
  }
}

migrate();
