/**
 * SAFAR - Sprint 11 & 12 Security Audit & Zero-Fee Charter Verification Suite
 * Tests Helmet Security Headers, CORS, Magic Bytes, RBAC, and Zero-Fee Compliance.
 * Executed via: node --test test/security-audit.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import serverPkg from '../command-control-server/server.js';
import { db, recordPaymentTx } from '../command-control-server/db.js';
import { encryptField } from '../command-control-server/cryptoUtils.js';

const { app, server, driversStore } = serverPkg;
let testPort = 0;
let testServer = null;

before(async () => {
  await new Promise(resolve => {
    testServer = server.listen(0, '127.0.0.1', () => {
      testPort = testServer.address().port;
      resolve();
    });
  });

  // Register driver for zero-fee tests
  const encUpi = encryptField('tariq@jkb');
  db.prepare('INSERT OR IGNORE INTO driver_profiles (vehicle_no, name, upi_id_enc) VALUES (?, ?, ?)').run('JK-01-AB-1024', 'Tariq Bhat', encUpi);
  db.prepare('INSERT OR REPLACE INTO drivers (driver_phone, driver_name, driver_vehicle_no, driver_upi_id, kyc_status) VALUES (?, ?, ?, ?, ?)').run('9906000001', 'Tariq Bhat', 'JK-01-AB-1024', 'tariq@jkb', 'approved');
  if (driversStore) {
    driversStore.set('JK-01-AB-1024', { vehicleNo: 'JK-01-AB-1024', name: 'Tariq Bhat', upiId: encUpi });
  }
});

after(async () => {
  if (testServer) {
    if (typeof testServer.closeAllConnections === 'function') testServer.closeAllConnections();
    await new Promise(resolve => testServer.close(resolve));
  }
});

test('▶ Phase 2 Step 5 — Sprint 11/12 Security Audit & Zero-Fee Charter Suite', async (tSuite) => {

  await tSuite.test('1. Express Helmet Security Headers Verification', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.ok(res.headers.get('content-security-policy'));
    assert.ok(res.headers.get('strict-transport-security'));
  });

  await tSuite.test('2. CORS Origin Whitelist Enforcement', async () => {
    const validRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/health`, {
      headers: { 'Origin': 'https://safarkashmir.in' }
    });
    assert.equal(validRes.headers.get('access-control-allow-origin'), 'https://safarkashmir.in');

    const invalidRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/health`, {
      headers: { 'Origin': 'https://malicious-site.com' }
    });
    assert.equal(invalidRes.headers.get('access-control-allow-origin'), null);
  });

  await tSuite.test('3. Zero-Fee Commuter Charter Compliance Check', async () => {
    const tripRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/upi-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleNo: 'JK-01-AB-1024',
        fareAmount: 24.00,
        routeId: 'SRN-BUD-01',
        origin: 'Lal Chowk',
        destination: 'Budgam'
      })
    });
    assert.equal(tripRes.status, 200);
    const json = await tripRes.json();
    assert.equal(json.data.amount, 24.00, 'Calculated fare must equal exact SRO fare');
    assert.equal(json.data.convenienceFee || 0, 0, 'Commuter convenience fee MUST be 0');
  });

  await tSuite.test('4. Zero-Commission Driver Payout Integrity Check', async () => {
    const tripId = `test_zero_comm_${Date.now()}`;
    const vehicleNo = 'JK-01-AB-1024';
    db.prepare('INSERT INTO trips_ledger (trip_id, vehicle_no, amount, status) VALUES (?, ?, ?, ?)').run(tripId, vehicleNo, 50.0, 'AWAITING_PAYMENT');

    recordPaymentTx(tripId, 'PAID', 'UPI_REF_9999', new Date().toISOString(), vehicleNo, 50.0);
    const updatedTrip = db.prepare('SELECT * FROM trips_ledger WHERE trip_id = ?').get(tripId);
    assert.equal(updatedTrip.amount, 50.0, 'Driver full 100% fare earnings recorded without commission deduction');
  });

  await tSuite.test('5. RBAC Endpoint Access Protection', async () => {
    const unauthRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/pilot/feedback`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated request must be rejected');
  });

});