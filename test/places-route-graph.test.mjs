/**
 * SAFAR - Place & Stop Graph Verification Suite
 * Tests Multilingual Search, FTS5 Indexing, Route Stop Sequence Integrity, Duplicate Detection,
 * Signed CAPTCHA Validation, Bulk Admin Verification, Corridor 2 Seeding, Fare Estimation,
 * WebSocket Live Tracking, Real Vehicle Telemetry Push, and Multi-Stop Route Optimization.
 * Executed via: node --test test/places-route-graph.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import serverPkg from '../command-control-server/server.js';
import dbPkg from '../command-control-server/db.js';

const { app, server } = serverPkg;
const { db, encodeGeohash, levenshteinDistance, haversineDistanceKm, findPotentialDuplicates } = dbPkg;

let testPort = 0;
let testServer = null;
let adminToken = null;
let reportedPlaceId = null;

before(async () => {
  await new Promise(resolve => {
    testServer = server.listen(0, '127.0.0.1', () => {
      testPort = testServer.address().port;
      resolve();
    });
  });

  // Authenticate admin session
  const loginRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPin: 'safar-admin-2026' })
  });
  const loginJson = await loginRes.json();
  adminToken = loginJson.data.adminToken;
});

after(async () => {
  if (testServer) {
    if (typeof testServer.closeAllConnections === 'function') testServer.closeAllConnections();
    await new Promise(resolve => testServer.close(resolve));
  }
  setTimeout(() => process.exit(0), 100);
});

test('▶ Phase 2 Step 9 — SAFAR Place & Stop Graph Test Suite', async (tSuite) => {

  await tSuite.test('1. Multilingual Search Across English, Hindi, Urdu, Kashmiri', async () => {
    const resEn = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/search?q=Amar%20Singh`);
    assert.equal(resEn.status, 200);
    const jsonEn = await resEn.json();
    assert.equal(jsonEn.success, true);
    assert.ok(jsonEn.count >= 1);
    assert.equal(jsonEn.data[0].name_en, 'Amar Singh College');

    const resHi = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/search?q=${encodeURIComponent('लाल चौक')}`);
    assert.equal(resHi.status, 200);
    const jsonHi = await resHi.json();
    assert.ok(jsonHi.count >= 1);

    const resUr = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/search?q=${encodeURIComponent('لال چوک')}`);
    assert.equal(resUr.status, 200);
    const jsonUr = await resUr.json();
    assert.ok(jsonUr.count >= 1);

    const resKs = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/search?q=${encodeURIComponent('لالہ چوک')}`);
    assert.equal(resKs.status, 200);
    const jsonKs = await resKs.json();
    assert.ok(jsonKs.count >= 1);
  });

  await tSuite.test('2. Ordered Route Stop Sequence Integrity (SRN-BUD-01)', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/routes/SRN-BUD-01/stops`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.totalStops >= 50, 'Corridor 1 must contain at least 50 ordered stop nodes');
    
    const stops = json.data;
    for (let i = 0; i < stops.length - 1; i++) {
      assert.ok(stops[i].stop_sequence < stops[i+1].stop_sequence, 'Stops must be ordered by stop_sequence');
    }
    assert.equal(stops[0].name_en, 'Lal Chowk Ghanta Ghar');
    assert.equal(stops[0].distance_from_previous_m, 0, 'First stop distance from previous must be 0');
  });

  await tSuite.test('3. Community Missing Stop / Landmark Report & Validation', async () => {
    const capRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/captcha/challenge`);
    assert.equal(capRes.status, 200);
    const capJson = await capRes.json();
    assert.ok(capJson.token);
    const [qStr] = capJson.question.match(/\d+ \+ \d+/);
    const [n1, n2] = qStr.split(' + ').map(Number);
    const validAnswer = n1 + n2;

    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nameEn: 'LVD Hospital Crossing',
        nameUr: 'ایل وی ڈی ہسپتال',
        type: 'hospital',
        lat: 34.0310,
        lng: 74.7820,
        source: 'user',
        captchaToken: capJson.token,
        captchaAnswer: validAnswer
      })
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.id);
    assert.equal(json.data.verified, 0);
    assert.equal(json.message, "Thank you! We'll review your suggestion.");
    reportedPlaceId = json.data.id;

    const badCoordRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameEn: 'Bad Landmark', lat: 999.0, lng: 12.0 })
    });
    assert.equal(badCoordRes.status, 400);
  });

  await tSuite.test('4. Admin Pending Places Queue & Single Verification Workflow', async () => {
    const pendingRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/places/pending`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(pendingRes.status, 200);
    const pendingJson = await pendingRes.json();
    assert.ok(pendingJson.data.some(p => p.id === reportedPlaceId));

    const verifyRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/places/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ placeId: reportedPlaceId, action: 'approve' })
    });
    assert.equal(verifyRes.status, 200);
    const verifyJson = await verifyRes.json();
    assert.equal(verifyJson.data.verified, 1);
    assert.equal(verifyJson.data.confidence_score, 1.0);
  });

  await tSuite.test('5. Admin Bulk Verification & Merge Workflow', async () => {
    const dupRes1 = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameEn: 'LVD Hospital Dup 1', type: 'hospital', lat: 34.0310, lng: 74.7820 })
    });
    const dupJson1 = await dupRes1.json();
    const dup1Id = dupJson1.data.id;

    const dupRes2 = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameEn: 'LVD Hospital Dup 2', type: 'hospital', lat: 34.0310, lng: 74.7820 })
    });
    const dupJson2 = await dupRes2.json();
    const dup2Id = dupJson2.data.id;

    const bulkRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/places/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        items: [
          { placeId: dup1Id, action: 'merge', mergedPlaceId: reportedPlaceId },
          { placeId: dup2Id, action: 'reject' }
        ]
      })
    });
    assert.equal(bulkRes.status, 200);
    const bulkJson = await bulkRes.json();
    assert.equal(bulkJson.success, true);
    assert.equal(bulkJson.data.mergedCount, 1);
    assert.equal(bulkJson.data.rejectedCount, 1);
  });

  await tSuite.test('6. Duplicate Detection Heuristic (Levenshtein + Haversine)', async () => {
    const dups = findPotentialDuplicates({ nameEn: 'Lal Chowk', lat: 34.0720, lng: 74.8080 });
    assert.ok(dups.length >= 1);
    assert.ok(dups[0].distanceKm <= 0.5);

    const dupRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/duplicates?nameEn=Lal%20Chowk&lat=34.0720&lng=74.8080`);
    assert.equal(dupRes.status, 200);
    const dupJson = await dupRes.json();
    assert.ok(dupJson.count >= 1);
  });

  await tSuite.test('7. Edge Cases & Special Characters Search', async () => {
    const emptyRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/search?q=   `);
    assert.equal(emptyRes.status, 200);
    const emptyJson = await emptyRes.json();
    assert.equal(emptyJson.count, 0);

    const specRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/search?q=${encodeURIComponent("O'Brien*")}`);
    assert.equal(specRes.status, 200);
    const specJson = await specRes.json();
    assert.equal(specJson.success, true);
  });

  await tSuite.test('8. Place Search Performance Benchmarks (<50ms cached, <200ms uncached)', async () => {
    const startUncached = performance.now();
    const res1 = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/search?q=Hospital`);
    const durUncached = performance.now() - startUncached;
    assert.equal(res1.status, 200);
    assert.ok(durUncached <= 200, `Uncached latency (${durUncached.toFixed(2)}ms) must be <= 200ms`);

    const startCached = performance.now();
    const res2 = await fetch(`http://127.0.0.1:${testPort}/api/v1/places/search?q=Hospital`);
    const durCached = performance.now() - startCached;
    assert.equal(res2.status, 200);
    assert.ok(durCached <= 50, `Cached search latency (${durCached.toFixed(2)}ms) must be <= 50ms`);
  });

  await tSuite.test('9. Corridor 2 (SRN-SNM-02) Seeding & Fare/ETA Estimation', async () => {
    const stopsRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/routes/SRN-SNM-02/stops`);
    assert.equal(stopsRes.status, 200);
    const stopsJson = await stopsRes.json();
    assert.equal(stopsJson.success, true);
    assert.equal(stopsJson.totalStops, 13, 'Corridor 2 must contain 13 stops');

    const estRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/routes/SRN-SNM-02/estimate?fromSeq=1&toSeq=13`);
    assert.equal(estRes.status, 200);
    const estJson = await estRes.json();
    assert.equal(estJson.success, true);
    assert.equal(estJson.data.fromStop, 'Budgam Bus Stand Terminal');
    assert.equal(estJson.data.toStop, 'Sonmarg Zero Point');
    assert.ok(estJson.data.totalDistanceKm > 40, 'Total distance to Sonmarg must be > 40 km');
    assert.ok(estJson.data.estimatedFareINR >= 200, 'Estimated fare to Sonmarg must be >= ₹200');
  });

  await tSuite.test('10. Live Tracking WebSocket Connection & Telemetry Stream', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${testPort}`);
    let receivedConnected = false;
    let receivedBusLocation = false;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket broadcast timeout'));
      }, 3000);

      ws.on('open', () => {});

      ws.on('message', (msg) => {
        const payload = JSON.parse(msg.toString());
        if (payload.type === 'CONNECTED') {
          receivedConnected = true;
        } else if (payload.type === 'BUS_LOCATION') {
          receivedBusLocation = true;
          assert.equal(payload.routeId, 'SRN-SNM-02');
          assert.ok(payload.lat && payload.lng);
          assert.ok(payload.nextStop);
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    assert.ok(receivedConnected, 'WebSocket must receive CONNECTED initial payload');
    assert.ok(receivedBusLocation, 'WebSocket must receive simulated BUS_LOCATION broadcast');
  });

  await tSuite.test('11. Real Vehicle Telemetry Push & Instant WebSocket Broadcast', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${testPort}`);
    let realPayloadReceived = false;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Real telemetry broadcast timeout'));
      }, 3000);

      ws.on('open', async () => {
        const pushRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/telemetry/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleNo: 'JK-01-SNM-9999',
            routeId: 'SRN-SNM-02',
            lat: 34.2250,
            lng: 74.8800,
            speed: 42,
            heading: 85,
            nextStop: 'Ganderbal Town'
          })
        });
        const pushJson = await pushRes.json();
        if (pushRes.status !== 200) console.log('--- TEST 11 ERROR ---', pushRes.status, pushJson);
        assert.equal(pushRes.status, 200);
      });

      ws.on('message', (msg) => {
        const payload = JSON.parse(msg.toString());
        if (payload.type === 'BUS_LOCATION' && payload.source === 'REAL_GPS') {
          realPayloadReceived = true;
          assert.equal(payload.busId, 'JK-01-SNM-9999');
          assert.equal(payload.lat, 34.225);
          assert.equal(payload.nextStop, 'Ganderbal Town');
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    assert.ok(realPayloadReceived, 'WebSocket clients must receive instant real vehicle telemetry broadcast');
  });

  await tSuite.test('12. Multi-Stop Route Optimization & Trip Planner', async () => {
    // Direct trip plan (Lal Chowk to Budgam)
    const directRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/routing/plan?origin=Lal%20Chowk&destination=Budgam`);
    assert.equal(directRes.status, 200);
    const directJson = await directRes.json();
    assert.equal(directJson.success, true);
    assert.ok(['DIRECT', 'TRANSFER'].includes(directJson.tripType));
    assert.ok(directJson.estimatedFareINR > 0);

    // Multi-stop trip plan across routes (Budgam to Sonmarg)
    const transferRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/routing/plan?origin=Budgam&destination=Sonmarg`);
    assert.equal(transferRes.status, 200);
    const transferJson = await transferRes.json();
    assert.equal(transferJson.success, true);
    assert.ok(transferJson.totalDistanceKm > 30);
    assert.ok(transferJson.estimatedFareINR >= 100);
  });

});