/**
 * SAFAR — Sprint 10: Anonymised Telemetry Sharing Test Suite
 * Tests 200m-500m grid coordinate fuzzing, 5-minute time binning,
 * multi-bus deduplicated aggregation, 7-day raw GPS cleanup,
 * auditor RBAC enforcement, zero-PII privacy guarantees, and checksummed CSV/JSON exports.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const http = require('http');
const { app } = require('../command-control-server/server.js');
const { stmts, db, getAggregatedTelemetryRecords } = require('../command-control-server/db.js');
const {
  fuzzCoordinate,
  timeBin,
  aggregateRoute,
  runAggregator,
  cleanupRawGpsPings,
  BIN_MS
} = require('../command-control-server/telemetryAggregator.js');

let testPort = 0;
let testServer = null;

before(async () => {
  testServer = http.createServer(app);
  await new Promise(resolve => {
    testServer.listen(0, '127.0.0.1', () => {
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
});

test('▶ Phase 2 Step 7 — Sprint 10: Anonymised Telemetry Sharing (200m Fuzzing & Audit Export)', async (tSuite) => {
  const baseLat = 34.083656;
  const baseLng = 74.797371;

  await tSuite.test('1. Coordinate Fuzzing (200m Grid Snapping & Privacy Protection)', () => {
    const rawCoord1 = { lat: 34.083656, lng: 74.797371 };
    // Slightly offset coordinate (< 50 meters away)
    const rawCoord2 = { lat: 34.083800, lng: 74.797500 };

    const fuzzed1 = fuzzCoordinate(rawCoord1.lat, rawCoord1.lng, 200);
    const fuzzed2 = fuzzCoordinate(rawCoord2.lat, rawCoord2.lng, 200);

    // Assert that raw coordinates are not directly exposed
    assert.notEqual(fuzzed1.lat, rawCoord1.lat);
    assert.notEqual(fuzzed1.lng, rawCoord1.lng);

    // Nearby points in the same 200m grid cell snap to identical cell centroid
    assert.equal(fuzzed1.lat, fuzzed2.lat);
    assert.equal(fuzzed1.lng, fuzzed2.lng);

    // Faraway point (> 1km away) snaps to a distinct centroid
    const fuzzedFar = fuzzCoordinate(34.120000, 74.830000, 200);
    assert.notEqual(fuzzed1.lat, fuzzedFar.lat);
  });

  await tSuite.test('2. Time Binning (5-Minute Boundary Snapping)', () => {
    const binStart = 1755600000000; // Exact 5-min boundary
    const bin1 = timeBin(binStart + 12000); // 12 seconds in
    const bin2 = timeBin(binStart + 60000);  // 1 minute in
    const bin3 = timeBin(binStart + 240000); // 4 minutes in
    const binNext = timeBin(binStart + 300000); // 5 minutes (next bin)

    // All timestamps within the 5-min window snap to same bin
    assert.equal(bin1, binStart);
    assert.equal(bin2, binStart);
    assert.equal(bin3, binStart);
    assert.equal(binNext - bin1, BIN_MS);
    assert.equal(bin1 % BIN_MS, 0);
  });

  const testRouteId = `SRN-TEST-${Date.now()}`;
  const now = Date.now();
  const testBinStart = timeBin(now - 10 * 60 * 1000);

  await tSuite.test('3. Raw GPS Ping Ingestion & Aggregation with Vehicle Deduplication', () => {
    // Insert 4 pings: 3 from vehicle A, 1 from vehicle B in the same 5-minute bin
    stmts.insertGpsPing.run('drv_101', 'JK01-AA-1111', testRouteId, baseLat, baseLng, 25.5, 0, testBinStart + 10000);
    stmts.insertGpsPing.run('drv_101', 'JK01-AA-1111', testRouteId, baseLat + 0.0001, baseLng + 0.0001, 30.0, 0, testBinStart + 60000);
    stmts.insertGpsPing.run('drv_101', 'JK01-AA-1111', testRouteId, baseLat + 0.0002, baseLng + 0.0002, 35.0, 0, testBinStart + 120000);
    stmts.insertGpsPing.run('drv_102', 'JK01-BB-2222', testRouteId, baseLat + 0.0005, baseLng + 0.0005, 20.0, 0, testBinStart + 180000);

    const agg = aggregateRoute(testRouteId, testBinStart, testBinStart + BIN_MS);
    assert.ok(agg);
    assert.equal(agg.routeId, testRouteId);
    assert.equal(agg.timeBin, testBinStart);
    // Distinct vehicle count = 2
    assert.equal(agg.busCount, 2);
    // Average speed = (25.5 + 30.0 + 35.0 + 20.0) / 4 = 27.63
    assert.ok(Math.abs(agg.avgSpeed - 27.63) < 0.1);
    assert.ok(typeof agg.fuzzedCentroidLat === 'number');
    assert.ok(typeof agg.fuzzedCentroidLng === 'number');
  });

  await tSuite.test('4. Aggregator Run & Table Upsert Idempotency', () => {
    const results = runAggregator(testBinStart);
    assert.ok(results.length > 0);
    const match = results.find(r => r.routeId === testRouteId);
    assert.ok(match);
    assert.equal(match.busCount, 2);

    // Verify record in SQLite table
    const records = getAggregatedTelemetryRecords({ routeId: testRouteId });
    assert.ok(records.length >= 1);
    assert.equal(records[0].route_id, testRouteId);
    assert.equal(records[0].bus_count, 2);

    // Re-run should update without throwing UNIQUE constraint violation
    const retryResults = runAggregator(testBinStart);
    assert.ok(retryResults.length > 0);
  });

  await tSuite.test('5. 7-Day Raw GPS Retention Cleanup', () => {
    const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
    stmts.insertGpsPing.run('drv_old', 'JK01-OLD-9999', 'SRN-OLD', baseLat, baseLng, 20, 0, oldTimestamp);

    // Verify it exists
    const beforeCount = db.prepare('SELECT COUNT(*) as count FROM gps_pings WHERE timestamp < ?').get(Date.now() - 7 * 24 * 60 * 60 * 1000).count;
    assert.ok(beforeCount >= 1);

    // Run cleanup
    const deletedCount = cleanupRawGpsPings(7);
    assert.ok(deletedCount >= 1);

    // Verify old pings deleted
    const afterCount = db.prepare('SELECT COUNT(*) as count FROM gps_pings WHERE timestamp < ?').get(Date.now() - 7 * 24 * 60 * 60 * 1000).count;
    assert.equal(afterCount, 0);

    // Recent pings are preserved
    const recentCount = db.prepare('SELECT COUNT(*) as count FROM gps_pings WHERE timestamp >= ?').get(testBinStart).count;
    assert.ok(recentCount >= 4);
  });

  await tSuite.test('6. Government / Auditor Endpoint Authentication & RBAC', async () => {
    // 1. Unauthorized request (no token/header) -> 401
    const unauthRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/government/telemetry/aggregated`);
    assert.equal(unauthRes.status, 401);

    // 2. Authorized request with auditor header -> 200
    const authRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/government/telemetry/aggregated`, {
      headers: { 'x-auditor-id': 'auditor_transport_jk', 'x-role': 'GOVT_AUDITOR' }
    });
    assert.equal(authRes.status, 200);
    const json = await authRes.json();
    assert.equal(json.success, true);
  });

  await tSuite.test('7. Privacy & Zero-PII Export Guarantee (JSON & CSV)', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/government/telemetry/aggregated?routeId=${testRouteId}&format=json`, {
      headers: { 'x-auditor-id': 'auditor_transport_jk' }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(json.data.length >= 1);

    const record = json.data[0];
    // Check that exact data structure matches spec
    assert.ok(record.routeId);
    assert.ok(record.timeBin);
    assert.ok(record.busCount);
    assert.ok(record.avgSpeedKmh !== undefined);
    assert.ok(record.centroid && record.centroid.lat && record.centroid.lng);

    // Deep PII Scan: ensure NO vehicle numbers, driver IDs, or passenger details are present
    const rawJsonStr = JSON.stringify(json);
    assert.equal(rawJsonStr.includes('JK01-AA-1111'), false, 'Vehicle registration must never appear in export');
    assert.equal(rawJsonStr.includes('JK01-BB-2222'), false, 'Vehicle registration must never appear in export');
    assert.equal(rawJsonStr.includes('drv_101'), false, 'Driver ID must never appear in export');
    assert.equal(rawJsonStr.includes('drv_102'), false, 'Driver ID must never appear in export');
  });

  await tSuite.test('8. Checksummed CSV and JSON Regulatory Exports', async () => {
    // 1. JSON Export Checksum Verification
    const jsonRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/government/telemetry/aggregated?routeId=${testRouteId}&format=json`, {
      headers: { 'x-auditor-id': 'auditor_transport_jk' }
    });
    assert.equal(jsonRes.status, 200);
    const checksumHeader = jsonRes.headers.get('x-audit-checksum');
    assert.ok(checksumHeader && checksumHeader.startsWith('sha256:'), 'Must provide sha256: prefixed header');
    const jsonBody = await jsonRes.json();
    assert.equal(jsonBody.checksum, checksumHeader);

    // 2. CSV Export Checksum & Header Verification
    const csvRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/government/telemetry/aggregated?routeId=${testRouteId}&format=csv`, {
      headers: { 'x-auditor-id': 'auditor_transport_jk' }
    });
    assert.equal(csvRes.status, 200);
    assert.ok(csvRes.headers.get('content-type').includes('text/csv'));
    const csvChecksumHeader = csvRes.headers.get('x-audit-checksum');
    assert.ok(csvChecksumHeader && csvChecksumHeader.startsWith('sha256:'));
    
    const csvText = await csvRes.text();
    const calculatedChecksum = 'sha256:' + crypto.createHash('sha256').update(csvText).digest('hex');
    assert.equal(csvChecksumHeader, calculatedChecksum, 'CSV header checksum must match payload SHA-256');

    assert.ok(csvText.includes('routeId,timeBin,busCount,avgSpeedKmh,fuzzedLat,fuzzedLng'));
    assert.ok(csvText.includes(testRouteId));
  });
});
