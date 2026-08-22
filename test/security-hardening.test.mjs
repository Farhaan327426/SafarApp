/**
 * Safar — System Hardening & Security Architecture Comprehensive Verification Suite
 * Executed via: node --test test/security-hardening.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import serverPkg from '../command-control-server/server.js';
import { encryptField, decryptField, hashOtp } from '../command-control-server/cryptoUtils.js';
import { MutexWriteQueue } from '../command-control-server/mutexQueue.js';
import sanitizerPkg from '../command-control-server/sanitizer.js';
const { deepRedact } = sanitizerPkg;

const { app, server, driversStore, tripsLedger, driverEarningsLedger } = serverPkg;

let testPort = 0;
let testServer = null;
const DRIVER_SECRET = 'safar-driver-secret-2026';
let driver1Token = null;
let generatedTripId = null;
let generatedOtp = null;

before(async () => {
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

test('1. Setup Driver Session & Encrypted Profile Registration', async () => {
  // Start shift
  const shiftRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/shift/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Driver-Secret': DRIVER_SECRET
    },
    body: JSON.stringify({ vehicleNo: 'JK01-SEC-99', routeId: 'SRN-BUD-01' })
  });
  assert.strictEqual(shiftRes.status, 200);
  const shiftJson = await shiftRes.json();
  driver1Token = shiftJson.data.driverToken;
  assert.ok(driver1Token);

  // Register Profile
  const profileRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${driver1Token}`
    },
    body: JSON.stringify({
      name: 'Security Driver',
      upiId: 'secdriver@okaxis',
      bankAccount: {
        accountNumber: '11223344556677',
        ifsc: 'SBIN0009999',
        accountHolderName: 'Security Driver'
      }
    })
  });
  assert.strictEqual(profileRes.status, 200);
  const profileJson = await profileRes.json();
  assert.strictEqual(profileJson.data.upiId, 'se****@okaxis');
  assert.strictEqual(profileJson.data.bankAccount.maskedAccount, '**********6677');

  // Inspect driversStore in memory & verify encryption at rest
  const storedProfile = driversStore.get('JK01-SEC-99');
  assert.ok(storedProfile.upiId.includes(':')); // Encrypted format iv:authTag:ciphertext
  assert.ok(storedProfile.bankAccount.accountNumber.includes(':'));
  assert.strictEqual(decryptField(storedProfile.upiId), 'secdriver@okaxis');
  assert.strictEqual(decryptField(storedProfile.bankAccount.accountNumber), '11223344556677');
});

test('2. OTP Intent Generation & Display-Only Verification Flow', async () => {
  // Generate UPI Intent
  const intentRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/upi-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicleNo: 'JK01-SEC-99',
      fareAmount: 25,
      routeId: 'SRN-BUD-01',
      origin: 'Srinagar',
      destination: 'Budgam'
    })
  });
  assert.strictEqual(intentRes.status, 200);
  const intentJson = await intentRes.json();
  assert.strictEqual(intentJson.success, true);
  assert.ok(intentJson.data.tripId);
  assert.ok(intentJson.data.otpCode);
  assert.strictEqual(intentJson.data.otpCode.length, 4);
  assert.ok(/^\d{4}$/.test(intentJson.data.otpCode));

  generatedTripId = intentJson.data.tripId;
  generatedOtp = intentJson.data.otpCode;
});

test('3. OTP Verification: Invalid Code & Lockout Enforcement', async () => {
  // Create second intent for testing wrong OTP attempts
  await new Promise(r => setTimeout(r, 5100)); // bypass rate limit
  const intentRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/upi-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicleNo: 'JK01-SEC-99',
      fareAmount: 30,
      routeId: 'SRN-BUD-01',
      origin: 'Srinagar',
      destination: 'Budgam'
    })
  });
  const tempTripId = (await intentRes.json()).data.tripId;

  // 1st wrong attempt
  const wrong1 = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${tempTripId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` },
    body: JSON.stringify({ otpCode: '0000' })
  });
  assert.strictEqual(wrong1.status, 400);
  const json1 = await wrong1.json();
  assert.strictEqual(json1.error.code, 'INVALID_OTP');
  assert.ok(json1.error.message.includes('2 attempt(s) remaining'));

  // 2nd wrong attempt
  await new Promise(r => setTimeout(r, 2100));
  const wrong2 = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${tempTripId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` },
    body: JSON.stringify({ otpCode: '0000' })
  });
  assert.strictEqual(wrong2.status, 400);

  // 3rd wrong attempt (exhausting attempts)
  await new Promise(r => setTimeout(r, 2100));
  const wrong3 = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${tempTripId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` },
    body: JSON.stringify({ otpCode: '0000' })
  });
  assert.strictEqual(wrong3.status, 400);

  // 4th attempt after lockout
  await new Promise(r => setTimeout(r, 2100));
  const wrong4 = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${tempTripId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` },
    body: JSON.stringify({ otpCode: '0000' })
  });
  assert.strictEqual(wrong4.status, 400);
  assert.strictEqual((await wrong4.json()).error.code, 'OTP_LOCKED');
});

test('4. Successful OTP Verification, Single-Use Enforcement & Legacy upiRef Compatibility', async () => {
  // 4a. Mark paid using valid generatedOtp for generatedTripId
  await new Promise(r => setTimeout(r, 2100));
  const validRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${generatedTripId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` },
    body: JSON.stringify({ otpCode: generatedOtp })
  });
  assert.strictEqual(validRes.status, 200);
  const validJson = await validRes.json();
  assert.strictEqual(validJson.data.status, 'PAID_DIRECT');

  // 4b. Single-Use Reuse Assertion: Attempting to reuse valid OTP returns 400 Bad Request
  await new Promise(r => setTimeout(r, 2100));
  const dupRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${generatedTripId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` },
    body: JSON.stringify({ otpCode: generatedOtp })
  });
  assert.strictEqual(dupRes.status, 400);
  const dupJson = await dupRes.json();
  assert.ok(dupJson.error.code === 'OTP_EXPIRED' || dupJson.error.code === 'INVALID_TRIP_STATUS');

  // 4c. Legacy Backward Compatibility Assertion: upiRef without otpCode works cleanly
  await new Promise(r => setTimeout(r, 5100)); // clear upiIntent rate limit
  const legacyIntentRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/upi-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicleNo: 'JK01-SEC-99',
      fareAmount: 15,
      routeId: 'SRN-BUD-01',
      origin: 'Srinagar',
      destination: 'Budgam'
    })
  });
  assert.strictEqual(legacyIntentRes.status, 200);
  const legacyTripId = (await legacyIntentRes.json()).data.tripId;

  await new Promise(r => setTimeout(r, 2100));
  const legacyMarkRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/trips/${legacyTripId}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${driver1Token}` },
    body: JSON.stringify({ upiRef: '998877665544' }) // Legacy call without otpCode
  });
  assert.strictEqual(legacyMarkRes.status, 200);
  const legacyMarkJson = await legacyMarkRes.json();
  assert.strictEqual(legacyMarkJson.data.status, 'PAID_DIRECT');
});

test('5. Deep Recursive PII Redaction Verification', () => {
  const sensitivePayload = {
    user: {
      name: 'Tariq',
      upi_id: 'tariq@upi',
      nested: {
        bank_account: '998877665544',
        ifsc: 'SBIN0001234',
        otpCode: '5892'
      }
    },
    meta: {
      safeField: 'Hello World'
    }
  };

  const redacted = deepRedact(sensitivePayload);
  assert.strictEqual(redacted.user.name, 'Tariq');
  assert.strictEqual(redacted.user.upi_id, '[REDACTED]');
  assert.strictEqual(redacted.user.nested.bank_account, '[REDACTED]');
  assert.strictEqual(redacted.user.nested.ifsc, '[REDACTED]');
  assert.strictEqual(redacted.user.nested.otpCode, '[REDACTED]');
  assert.strictEqual(redacted.meta.safeField, 'Hello World');
});

test('6. MutexWriteQueue Concurrency & Crash Snapshot Recovery', async () => {
  const tempDbPath = path.join(process.cwd(), 'command-control-server', 'data', 'test_recovery_db.json');
  const queue = new MutexWriteQueue(tempDbPath, { maxBackups: 5, snapshotInterval: 2 });

  // Execute 5 rapid writes
  for (let i = 1; i <= 5; i++) {
    await queue.enqueueWrite(() => ({ count: i, timestamp: Date.now() }));
  }

  assert.ok(fs.existsSync(tempDbPath));
  const files = fs.readdirSync(path.dirname(tempDbPath));
  const bakFiles = files.filter(f => f.startsWith('test_recovery_db.json') && f.endsWith('.bak'));
  assert.ok(bakFiles.length >= 1, 'Backup snapshots created');

  // Corrupt main DB file
  fs.writeFileSync(tempDbPath, 'CORRUPTED_JSON_DATA_!!!', 'utf8');

  // Attempt recovery
  const recoveredData = MutexWriteQueue.recoverFromLatestSnapshot(tempDbPath);
  assert.ok(recoveredData);
  assert.ok(recoveredData.count > 0);

  // Cleanup test temp files
  try {
    fs.unlinkSync(tempDbPath);
    bakFiles.forEach(f => fs.unlinkSync(path.join(path.dirname(tempDbPath), f)));
  } catch (e) {}
});
