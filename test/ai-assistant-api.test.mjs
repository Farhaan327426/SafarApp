/**
 * SAFAR — AI Assistant API Integration Test Suite
 * Executed via: node --test test/ai-assistant-api.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert';
import serverModule from '../command-control-server/server.js';

const { app, server, activeTripsStore } = serverModule;

let testPort = 0;
let testServer = null;

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

test('1. POST /api/v1/ai/query classifies GREETING intent', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Assalamu Alaikum' })
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.intent, 'GREETING');
  assert.ok(json.data.answer.includes('Safar AI'));
});

test('2. POST /api/v1/ai/query classifies STUDENT_CONCESSION intent', async () => {
  await new Promise(r => setTimeout(r, 1100)); // Bypass rate limiter
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'student discount rules' })
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.intent, 'STUDENT_CONCESSION');
  assert.ok(json.data.answer.includes('50%'));
});

test('3. POST /api/v1/ai/query calculates exact FARE_QUERY from route DB', async () => {
  await new Promise(r => setTimeout(r, 1100));
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'fare for Srinagar to Budgam' })
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.intent, 'FARE_QUERY');
  assert.ok(json.data.answer.includes('Srinagar - Budgam Corridor'));
  assert.ok(json.data.answer.includes('₹20'));
});

test('4. POST /api/v1/ai/query integrates LIVE_TRACKING active trips state', async () => {
  await new Promise(r => setTimeout(r, 1100));
  
  // Populate active trip in store
  activeTripsStore['JK01-TEST-AI'] = {
    vehicleNo: 'JK01-TEST-AI',
    routeName: 'Srinagar Express',
    speed: 35,
    passengerCount: 18,
    lastSeen: Date.now()
  };

  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'where is my bus live gps' })
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.strictEqual(json.data.intent, 'LIVE_TRACKING');
  assert.ok(json.data.answer.includes('JK01-TEST-AI'));
  assert.ok(json.data.answer.includes('35 km/h'));

  delete activeTripsStore['JK01-TEST-AI'];
});

test('5. POST /api/v1/ai/query rejects empty or non-string query with HTTP 400', async () => {
  await new Promise(r => setTimeout(r, 1100));
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '' })
  });

  assert.strictEqual(res.status, 400);
});

test('6. POST /api/v1/ai/query rejects queries exceeding 500 characters with HTTP 400', async () => {
  await new Promise(r => setTimeout(r, 1100));
  const longQuery = 'a'.repeat(501);
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: longQuery })
  });

  assert.strictEqual(res.status, 400);
});

test('7. POST /api/v1/ai/query accepts query of exactly 500 characters', async () => {
  await new Promise(r => setTimeout(r, 1100));
  const valid500Query = 'fare '.repeat(100);
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: valid500Query })
  });

  assert.strictEqual(res.status, 200);
});

test('8. POST /api/v1/ai/query rate limits rapid requests with HTTP 429', async () => {
  const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'rapid query check' })
  });

  assert.strictEqual(res.status, 429);
});
