import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app, sseClients, activeAdminTokens, activeTripsStore, broadcastTelemetry } = require('../command-control-server/server.js');

let server = null;
let BASE_URL = '';

function postJson(urlPath, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = http.request(`${BASE_URL}${urlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${urlPath}`, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
  });
}

describe('Phase 2 Step 4b — SafarApp Admin Telemetry Dashboard & Auth Test Suite', () => {

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        BASE_URL = `http://127.0.0.1:${address.port}`;
        console.log(`[Admin Dashboard Test] Server listening on ${BASE_URL}`);
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    setTimeout(() => process.exit(0), 100);
  });

  it('1. Admin Login Success & Failure Validation', async () => {
    // Failure with wrong PIN
    const failRes = await postJson('/api/v1/admin/login', { adminPin: 'wrong-pin' });
    assert.strictEqual(failRes.statusCode, 401, 'Wrong PIN must return 401');

    // Success with valid default PIN
    const successRes = await postJson('/api/v1/admin/login', { adminPin: 'safar-admin-2026' });
    assert.strictEqual(successRes.statusCode, 200, 'Valid PIN must return 200');
    assert.ok(successRes.data.data.adminToken, 'Response must contain adminToken');
    assert.strictEqual(successRes.data.data.adminToken.length, 64, 'Token must be 64 hex characters');
  });

  it('2. Login Rate Limiting (5 Attempts Restriction)', async () => {
    const testIpHeader = { 'X-Forwarded-For': '198.51.100.22' };

    // Fire 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const res = await postJson('/api/v1/admin/login', { adminPin: 'invalid' }, testIpHeader);
      assert.strictEqual(res.statusCode, 401);
    }

    // 6th attempt must return HTTP 429
    const blockedRes = await postJson('/api/v1/admin/login', { adminPin: 'safar-admin-2026' }, testIpHeader);
    assert.strictEqual(blockedRes.statusCode, 429, '6th attempt must return HTTP 429 Rate Limited');
  });

  it('3. Summary Endpoint Protection & Rate Limiting', async () => {
    // Unauthenticated call
    const unauthRes = await getJson('/api/v1/admin/telemetry/summary');
    assert.strictEqual(unauthRes.statusCode, 401, 'Unauthenticated request must return 401');

    // Login to get token
    const loginRes = await postJson('/api/v1/admin/login', { adminPin: 'safar-admin-2026' });
    const adminToken = loginRes.data.data.adminToken;

    // First call with Bearer token
    const summaryRes1 = await getJson('/api/v1/admin/telemetry/summary', {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(summaryRes1.statusCode, 200, 'Authenticated summary request must return 200');

    // Immediate second call (within 1 sec) must trigger 429
    const summaryRes2 = await getJson('/api/v1/admin/telemetry/summary', {
      'Authorization': `Bearer ${adminToken}`
    });
    assert.strictEqual(summaryRes2.statusCode, 429, 'Sub-second request must return 429 Rate Limited');
  });

  it('4. Aggregated Telemetry Summary Data & Broadcast Counter Accuracy', async () => {
    // Inject active trip
    activeTripsStore['JK01-AV-9912'] = {
      vehicleNo: 'JK01-AV-9912',
      routeName: 'Srinagar–Budgam',
      lat: 34.0837,
      lng: 74.7973,
      speed: 32,
      passengerCount: 18,
      timestamp: new Date().toISOString()
    };

    // Broadcast event (this pushes to recentBroadcastTimestamps array)
    if (typeof broadcastTelemetry === 'function') {
      broadcastTelemetry(activeTripsStore['JK01-AV-9912']);
    }

    // Login and wait 1.1 sec for rate limit reset
    const loginRes = await postJson('/api/v1/admin/login', { adminPin: 'safar-admin-2026' });
    const adminToken = loginRes.data.data.adminToken;
    await new Promise(r => setTimeout(r, 1100));

    const summary = await getJson('/api/v1/admin/telemetry/summary', {
      'Authorization': `Bearer ${adminToken}`
    });

    assert.strictEqual(summary.statusCode, 200);
    assert.ok(summary.data.data.activeVehicles >= 1, 'Should count active vehicles');
    assert.ok(summary.data.data.totalPassengers >= 18, 'Should aggregate total passengers');
    assert.ok(summary.data.data.totalBroadcastsLastMinute >= 1, 'totalBroadcastsLastMinute must be >= 1 after broadcast');
  });

});
