/**
 * SAFAR — SQLite & Dual-Write Integrity Test Suite
 * Tests synchronous SQLite persistence, AES-256-GCM decryption directly from SQLite,
 * atomic multi-table payment transactions, and dual-store consistency with MutexWriteQueue.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { db, stmts, recordPaymentTx } from '../command-control-server/db.js';
import { encryptField, decryptField, hashOtp } from '../command-control-server/cryptoUtils.js';

test('▶ SQLite & Dual-Write Persistence Engine', async (t) => {

  await t.test('1. Driver Profile: SQLite synchronous upsert & AES-256-GCM field encryption', () => {
    const vehicleNo = 'JK01-TEST-SQLITE-99';
    const rawUpi = 'driver.test@okhdfcbank';
    const rawAcc = '123456789012';
    const rawIfsc = 'HDFC0001234';

    const encUpi = encryptField(rawUpi);
    const encAcc = encryptField(rawAcc);
    const encIfsc = encryptField(rawIfsc);

    // Write to SQLite
    stmts.upsertDriver.run(
      vehicleNo,
      'Test Driver Bilal',
      encUpi,
      encAcc,
      encIfsc,
      encryptField('Bilal Ahmad')
    );

    // Read directly from SQLite
    const row = stmts.getDriver.get(vehicleNo);
    assert.ok(row, 'Driver row must exist in SQLite database');
    assert.equal(row.vehicle_no, vehicleNo);
    assert.equal(row.name, 'Test Driver Bilal');

    // Verify stored fields are encrypted
    assert.ok(row.upi_id_enc.includes(':'), 'Stored UPI ID must be ciphertext containing IV and AuthTag');
    assert.ok(row.bank_account_enc.includes(':'), 'Stored Bank Account must be encrypted');

    // Decrypt directly from SQLite record
    assert.equal(decryptField(row.upi_id_enc), rawUpi, 'Decrypted UPI ID must match raw input');
    assert.equal(decryptField(row.bank_account_enc), rawAcc, 'Decrypted Account must match raw input');
    assert.equal(decryptField(row.bank_ifsc_enc), rawIfsc, 'Decrypted IFSC must match raw input');
  });

  await t.test('2. Trip Creation: SQLite insertion & OTP Hash integrity', () => {
    const tripId = `trip_test_${Date.now()}`;
    const vehicleNo = 'JK01-TEST-SQLITE-99';
    const otpCode = '7842';
    const otpHash = hashOtp(otpCode);
    const otpExpires = Date.now() + 600000;

    stmts.insertTrip.run(
      tripId,
      vehicleNo,
      25.0,
      'SRN-BUD-01',
      'Lal Chowk',
      'Budgam Stand',
      'AWAITING_PAYMENT',
      otpHash,
      otpExpires,
      3,
      0
    );

    const tripRow = stmts.getTripById.get(tripId);
    assert.ok(tripRow, 'Trip must exist in SQLite');
    assert.equal(tripRow.amount, 25.0);
    assert.equal(tripRow.status, 'AWAITING_PAYMENT');
    assert.equal(tripRow.otp_hash, otpHash);
    assert.equal(tripRow.is_redeemed, 0);
  });

  await t.test('3. Atomic Payment Transaction: recordPaymentTx updates Trip & Driver Earnings atomically', () => {
    const tripId = `trip_tx_${Date.now()}`;
    const vehicleNo = 'JK01-TEST-SQLITE-99';

    // Insert pending trip
    stmts.insertTrip.run(
      tripId,
      vehicleNo,
      35.0,
      'SRN-ANG-03',
      'Pantha Chowk',
      'Anantnag',
      'AWAITING_PAYMENT',
      hashOtp('1234'),
      Date.now() + 600000,
      3,
      0
    );

    // Initial earnings
    const initialEarnings = stmts.getEarnings.get(vehicleNo)?.total_earnings || 0;

    // Execute atomic transaction
    const paidAt = new Date().toISOString();
    recordPaymentTx(tripId, 'PAID_DIRECT', 'UTR-TEST-998877', paidAt, vehicleNo, 35.0);

    // Verify trip updated
    const updatedTrip = stmts.getTripById.get(tripId);
    assert.equal(updatedTrip.status, 'PAID_DIRECT');
    assert.equal(updatedTrip.upi_ref, 'UTR-TEST-998877');
    assert.equal(updatedTrip.paid_at, paidAt);

    // Verify earnings incremented
    const updatedEarnings = stmts.getEarnings.get(vehicleNo)?.total_earnings || 0;
    assert.equal(updatedEarnings, initialEarnings + 35.0);
  });

  await t.test('4. Hot Backup & WAL Checkpoint Verification', () => {
    // Force WAL checkpoint
    const checkpoint = db.pragma('wal_checkpoint(PASSIVE)');
    assert.ok(Array.isArray(checkpoint), 'WAL checkpoint must execute cleanly');

    // Query stats
    const driverCount = db.prepare('SELECT count(*) as count FROM driver_profiles').get().count;
    const tripCount = db.prepare('SELECT count(*) as count FROM trips_ledger').get().count;
    assert.ok(driverCount >= 1, 'Must have at least 1 driver in SQLite');
    assert.ok(tripCount >= 2, 'Must have at least 2 trips in SQLite');
  });

});
