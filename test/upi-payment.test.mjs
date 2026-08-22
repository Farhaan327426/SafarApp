/**
 * Safar — Direct UPI Payment & Driver Earnings Integration Test Suite
 * Executed via: node --test test/upi-payment.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import serverPkg from '../command-control-server/server.js';
import { MutexWriteQueue } from '../command-control-server/mutexQueue.js';
import { decryptField } from '../command-control-server/cryptoUtils.js';
const { app, server, driversStore, tripsLedger, driverEarningsLedger } = serverPkg;

let testPort = 0;
let testServer = null;
const DRIVER_SECRET = 'safar-driver-secret-2026';

let driver1Token = null;
let driver2Token = null;
let generatedTripId = null;

before(async () => {
  // Reset in-memory stores and DB file for clean test environment
  if (driversStore) driversStore.clear();
  if (tripsLedger) tripsLedger.length = 0;
  if (driverEarningsLedger) driverEarningsLedger.clear();

  const dbPath = path.join(process.cwd(), 'command-control-server', 'data', 'safar_ledger_db.json');
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  } catch (e) {}

  await new Promise(resolve => {
    testServer = server.listen(0, '127.0.0.1', () => {
      testPort = testServer.address().port;
      resolve();
    });
  });
});

after(async () => {
  if (testServer) {
    if (typeof testServer.closeAllConnections === 'function') {
      testServer.closeAllConnections();
    }
    await new Promise(resolve => testServer.close(resolve));
  }
  setTimeout(() => process.exit(0), 100);
});

test('1. Setup: Start Driver 1 & Driver 2 Shift Sessions', async () => {
  // Start Driver 1 (JK01-TEST-11)
  const res1 = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/shift/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Driver-Secret': DRIVER_SECRET
    },
    body: JSON.stringify({ vehicleNo: 'JK01-TEST-11', routeId: 'SRN-BUD-01' })
  });
  assert.strictEqual(res1.status, 200);
  const json1 = await res1.json();
  assert.strictEqual(json1.success, true);
  driver1Token = json1.data.driverToken;
  assert.ok(driver1Token);

  // Start Driver 2 (JK02-TEST-22)
  const res2 = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/shift/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Driver-Secret': DRIVER_SECRET
    },
    body: JSON.stringify({ vehicleNo: 'JK02-TEST-22', routeId: 'SRN-ANG-03' })
  });
  assert.strictEqual(res2.status, 200);
  const json2 = await res2.json();
  assert.strictEqual(json2.success, true);
  driver2Token = json2.data.driverToken;
  assert.ok(driver2Token);
});

test('2. Driver Profile Registration & Data Masking', async () => {
  // 2a. Unauthenticated request
  const unauthRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tariq Ahmad', upiId: 'tariq@upi' })
  });
  assert.strictEqual(unauthRes.status, 401);

  // 2b. Invalid UPI ID format (using Driver 2 token)
  const invalidUpiRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${driver2Token}`
    },
    body: JSON.stringify({
      name: 'Driver Two',
      upiId: 'invalid-upi-handle',
      bankAccount: { accountNumber: '12345678901', ifsc: 'SBIN0001234' }
    })
  });
  assert.strictEqual(invalidUpiRes.status, 400);

  // 2c. Successful registration for Driver 1
  const validRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${driver1Token}`
    },
    body: JSON.stringify({
      name: 'Tariq Ahmad',
      upiId: 'tariq.driver@okaxis',
      bankAccount: {
        accountNumber: '987654321098',
        ifsc: 'SBIN0005678',
        accountHolderName: 'Tariq Ahmad'
      }
    })
  });
  assert.strictEqual(validRes.status, 200);
  const json = await validRes.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.vehicleNo, 'JK01-TEST-11');
  assert.strictEqual(json.data.name, 'Tariq Ahmad');
  assert.strictEqual(json.data.upiId, 'ta****@okaxis'); // Masked
  assert.strictEqual(json.data.bankAccount.maskedAccount, '********1098'); // Masked
});

test('3. UPI Intent Generation & Rate Limiting', async () => {
  // 3a. Missing driver payout profile returns 400
  const missingRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/upi-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicleNo: 'JK02-TEST-22', // No profile registered yet
      fareAmount: 17,
      routeId: 'SRN-ANG-03',
      origin: 'Srinagar',
      destination: 'Anantnag'
    })
  });
  assert.strictEqual(missingRes.status, 400);

  // Wait 5.1s to ensure rate limit window clears for intent endpoint
  await new Promise(r => setTimeout(r, 5100));

  // 3b. Successful UPI Intent for Driver 1 (JK01-TEST-11)
  const validRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/upi-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicleNo: 'JK01-TEST-11',
      fareAmount: 17,
      routeId: 'SRN-BUD-01',
      origin: 'Lal Chowk',
      destination: 'Budgam Stand'
    })
  });
  assert.strictEqual(validRes.status, 200);
  const json = await validRes.json();
  assert.strictEqual(json.success, true);
  assert.ok(json.data.tripId);
  assert.ok(json.data.upiLink.includes('upi://pay?pa=tariq.driver%40okaxis'));
  assert.ok(json.data.upiLink.includes('am=17'));
  generatedTripId = json.data.tripId;

  // 3c. Rate Limiting enforcement (second call within 5s from same IP)
  const rateLimitRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/upi-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicleNo: 'JK01-TEST-11',
      fareAmount: 17,
      routeId: 'SRN-BUD-01',
      origin: 'Lal Chowk',
      destination: 'Budgam Stand'
    })
  });
  assert.strictEqual(rateLimitRes.status, 429);
});

test('4. Manual Payment Confirmation & Ownership Check', async () => {
  // 4a. Critical Ownership Check: Driver 2 tries to mark Driver 1\'s trip as paid
  const forbiddenRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${generatedTripId}/mark-paid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${driver2Token}`
    },
    body: JSON.stringify({ upiRef: '999888777666' })
  });
  assert.strictEqual(forbiddenRes.status, 403);
  const forbiddenJson = await forbiddenRes.json();
  assert.ok(forbiddenJson.error.message.includes('FORBIDDEN'));

  // 4b. Legitimate Owner (Driver 1) marks trip as paid
  const validRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${generatedTripId}/mark-paid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${driver1Token}`
    },
    body: JSON.stringify({ upiRef: '123456789012' })
  });
  assert.strictEqual(validRes.status, 200);
  const validJson = await validRes.json();
  assert.strictEqual(validJson.success, true);
  assert.strictEqual(validJson.data.status, 'PAID_DIRECT');

  // 4c. Duplicate mark-paid attempt returns 400
  await new Promise(r => setTimeout(r, 2100)); // Bypass 2s rate limit
  const dupRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${generatedTripId}/mark-paid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${driver1Token}`
    },
    body: JSON.stringify({ upiRef: '123456789012' })
  });
  assert.strictEqual(dupRes.status, 400);
});

test('5. Driver Earnings Aggregation', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/earnings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${driver1Token}`
    }
  });
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.totalEarnings, 17);
  assert.strictEqual(json.data.tripsCount, 1);
  assert.strictEqual(json.data.recentTrips[0].tripId, generatedTripId);
});

test('6. Admin Telemetry Summary & Payout Details', async () => {
  // Login as admin
  const loginRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPin: 'safar-admin-2026' })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginJson = await loginRes.json();
  const adminToken = loginJson.data.adminToken;

  // Check Admin Telemetry Summary includes totalDirectEarnings
  const summaryRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/telemetry/summary`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(summaryRes.status, 200);
  const summaryJson = await summaryRes.json();
  assert.strictEqual(summaryJson.success, true);
  assert.strictEqual(summaryJson.data.totalDirectEarnings, 17);

  // Check Admin Drivers Payout Details returns masked values
  const payoutRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/drivers/payout-details`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(payoutRes.status, 200);
  const payoutJson = await payoutRes.json();
  assert.strictEqual(payoutJson.success, true);
  assert.ok(Array.isArray(payoutJson.data));
  const driver1Profile = payoutJson.data.find(d => d.vehicleNo === 'JK01-TEST-11');
  assert.ok(driver1Profile);
  assert.strictEqual(driver1Profile.upiId, 'ta****@okaxis');
});

test('7. File-backed Persistence across Server Restart', async () => {
  // Stop current test server instance
  if (testServer) {
    await new Promise(resolve => testServer.close(resolve));
  }

  // Clear in-memory maps to simulate process exit and restart
  driversStore.clear();
  tripsLedger.length = 0;
  driverEarningsLedger.clear();

  // Re-read file-backed database from disk to simulate server restart
  const dbPath = path.join(process.cwd(), 'command-control-server', 'data', 'safar_ledger_db.json');
  assert.ok(fs.existsSync(dbPath), 'safar_ledger_db.json file must exist on disk');

  const raw = fs.readFileSync(dbPath, 'utf8');
  const data = MutexWriteQueue.verifyAndUnwrapData(raw);
  
  if (Array.isArray(data.driversStore)) {
    data.driversStore.forEach(([k, v]) => driversStore.set(k, v));
  }
  if (Array.isArray(data.tripsLedger)) {
    data.tripsLedger.forEach(t => tripsLedger.push(t));
  }
  if (Array.isArray(data.driverEarningsLedger)) {
    data.driverEarningsLedger.forEach(([k, v]) => driverEarningsLedger.set(k, v));
  }

  assert.ok(driversStore.has('JK01-TEST-11'), 'Persisted driversStore must contain JK01-TEST-11');
  assert.strictEqual(decryptField(driversStore.get('JK01-TEST-11').upiId), 'tariq.driver@okaxis');
  assert.strictEqual(tripsLedger.length, 1, 'Persisted tripsLedger must retain paid trip');
  assert.strictEqual(tripsLedger[0].status, 'PAID_DIRECT');

  // Restart HTTP listener with loaded file state
  await new Promise(resolve => {
    testServer = server.listen(0, '127.0.0.1', () => {
      testPort = testServer.address().port;
      resolve();
    });
  });

  // Re-start shift session for Driver 1
  const shiftRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/shift/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Driver-Secret': DRIVER_SECRET
    },
    body: JSON.stringify({ vehicleNo: 'JK01-TEST-11', routeId: 'SRN-BUD-01' })
  });
  const shiftJson = await shiftRes.json();
  const newDriverToken = shiftJson.data.driverToken;

  // Query driver earnings endpoint after restart
  const earningsRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/earnings`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${newDriverToken}` }
  });
  assert.strictEqual(earningsRes.status, 200);
  const earningsJson = await earningsRes.json();
  assert.strictEqual(earningsJson.success, true);
  assert.strictEqual(earningsJson.data.totalEarnings, 17);
  assert.strictEqual(earningsJson.data.tripsCount, 1);
});
