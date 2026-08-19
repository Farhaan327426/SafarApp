/**
 * SAFAR — Telemetry SSE & Shift Auth Integration Test Suite
 * Executed via: node --test test/telemetry-stream.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app, server } from '../command-control-server/server.js';

let testPort = 0;
let testServer = null;
let activeDriverToken = null;
const DRIVER_SECRET = 'safar-driver-secret-2026';

before(async () => {
  await new Promise(resolve => {
    testServer = server.listen(0, '127.0.0.1', () => {
      testPort = testServer.address().port;
      resolve();
    });
  });
});

after(async () => {
  if (testServer) {
    if (typeof testServer.closeAllConnections === 'function') testServer.closeAllConnections();
    await new Promise(resolve => testServer.close(resolve));
  }
  setTimeout(() => process.exit(0), 100);
});

test('1. Shift Start Endpoint rejects unauthenticated requests', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/shift/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleNo: 'JK01-TEST-99', routeId: 'SRN-BUD-01' })
  });

  assert.strictEqual(res.status, 401);
});

test('2. Shift Start Endpoint issues valid driverToken with secret header', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/shift/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Driver-Secret': DRIVER_SECRET
    },
    body: JSON.stringify({ vehicleNo: 'JK01-TEST-99', routeId: 'SRN-BUD-01', vehicleType: 'MINI_BUS' })
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.ok(json.data.driverToken);
  assert.ok(json.data.driverToken.startsWith('drv_tok_'));
  activeDriverToken = json.data.driverToken;
});

test('3. Broadcast rejects unauthenticated requests', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/telemetry/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: 34.0722, lng: 74.8058, speed: 25 })
  });

  assert.strictEqual(res.status, 401);
});

test('4. Broadcast rejects NaN or non-finite coordinates', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/telemetry/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeDriverToken}`
    },
    body: JSON.stringify({ lat: NaN, lng: 74.8058, speed: 25 })
  });

  assert.strictEqual(res.status, 400);
});

test('5. Broadcast accepts valid authenticated telemetry pings', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/telemetry/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeDriverToken}`
    },
    body: JSON.stringify({ lat: 34.0722, lng: 74.8058, speed: 28, passengerCount: 12 })
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
});

test('6. Broadcast rate limits pings within 2 seconds', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/telemetry/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeDriverToken}`
    },
    body: JSON.stringify({ lat: 34.0725, lng: 74.8060, speed: 30, passengerCount: 14 })
  });

  assert.strictEqual(res.status, 429);
});

test('7. SSE Stream connects, receives initial snapshot AND streams live telemetry broadcast events', async () => {
  let sseData = '';
  let sseReq = null;

  // 1. Establish SSE stream
  const connectedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for SSE snapshot')), 2000);
    sseReq = http.get(`http://127.0.0.1:${testPort}/api/v1/telemetry/stream`, res => {
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['content-type'], 'text/event-stream');

      res.on('data', chunk => {
        sseData += chunk.toString();
        if (sseData.includes('event: snapshot')) {
          clearTimeout(timer);
          resolve();
        }
      });
    });
    sseReq.on('error', err => { });
  });

  await connectedPromise;
  assert.ok(sseData.includes('event: snapshot'), 'SSE stream must receive event: snapshot on connect');

  // 2. Wait 2.5 seconds to bypass rate limiter, then post live broadcast ping
  await new Promise(r => setTimeout(r, 2500));

  const telemetryEventPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout waiting for live SSE telemetry event')), 3000);
    const checkInterval = setInterval(() => {
      if (sseData.includes('event: telemetry') && sseData.includes('JK01-TEST-99')) {
        clearInterval(checkInterval);
        clearTimeout(timer);
        resolve(sseData);
      }
    }, 50);
  });

  // Trigger live ping (Realistic bus movement: ~45m in 2.5s = ~65 km/h)
  const broadcastRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/telemetry/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${activeDriverToken}`
    },
    body: JSON.stringify({ lat: 34.0726, lng: 74.8062, speed: 32, passengerCount: 16 })
  });
  assert.strictEqual(broadcastRes.status, 200);

  const finalStreamData = await telemetryEventPromise;
  assert.ok(finalStreamData.includes('event: telemetry'), 'SSE stream must contain event: telemetry event');
  assert.ok(finalStreamData.includes('JK01-TEST-99'), 'SSE stream must contain broadcast vehicleNo');

  if (sseReq) sseReq.destroy();
});
