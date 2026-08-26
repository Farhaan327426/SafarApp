/**
 * SAFAR — Sprint 9: Fare SRO Versioning & Transport Dept Audit Export Test Suite
 * Tests SRO table versioning, SHA-256 canonical hashing, atomic publish/rollback,
 * multi-tenant OCC editing locks, SSE fare update broadcasting,
 * overcharge severity tiering, and CSV/JSON compliance audit export.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app, server } = require('../command-control-server/server.js');
const { computeRulesChecksum, canonicalJsonStringify } = require('../command-control-server/db.js');

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
    testServer.close();
  }
  setTimeout(() => process.exit(0), 100);
});

test('▶ Phase 2 Step 6 — Sprint 9: Fare SRO Versioning & Transport Dept Audit Export', async (tSuite) => {
  const sampleRulesV1 = {
    sroTitle: "J&K Motor Vehicles Department Gazetted Fare Table 2026",
    effectiveDate: "2026-09-01",
    slabs: { 3: 9, 5: 14, 10: 17, 15: 20, 20: 26 },
    rates: {
      Kashmir: { plain: 1.40, hilly: 1.70 },
      Jammu: { plain: 1.35, hilly: 1.65 }
    },
    concessions: { student: 0.50, senior: 0.80 }
  };

  const sampleRulesV2 = {
    sroTitle: "J&K Revised Transit Revision Fare Table 2026-R2",
    effectiveDate: "2026-10-01",
    slabs: { 3: 10, 5: 15, 10: 18, 15: 22, 20: 28 },
    rates: {
      Kashmir: { plain: 1.45, hilly: 1.75 },
      Jammu: { plain: 1.40, hilly: 1.70 }
    },
    concessions: { student: 0.50, senior: 0.80 }
  };

  let versionId1 = null;
  let versionId2 = null;
  const sroNumber1 = `SRO-STA-${Date.now()}-V1`;
  const sroNumber2 = `SRO-STA-${Date.now()}-V2`;

  await tSuite.test('1. Draft Creation & Canonical SHA-256 Checksum Validation', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_farhaan' },
      body: JSON.stringify({
        sroNumber: sroNumber1,
        rulesJson: sampleRulesV1
      })
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'DRAFT');
    assert.equal(json.data.sroNumber, sroNumber1);
    
    // Verify checksum matches independent recomputation
    const expectedChecksum = computeRulesChecksum(sampleRulesV1);
    assert.equal(json.data.checksum, expectedChecksum);
    versionId1 = json.data.versionId;
    assert.ok(versionId1 > 0);
  });

  await tSuite.test('2. Multi-tenant OCC Draft Editing Lock and Conflict Prevention', async () => {
    // Admin 1 acquires lock
    const lock1Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${versionId1}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_alice' }
    });
    assert.equal(lock1Res.status, 200);
    const lock1Json = await lock1Res.json();
    assert.equal(lock1Json.data.lockAdminId, 'admin_alice');

    // Admin 2 attempts lock on same draft -> 409 Conflict
    const lock2Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${versionId1}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_bob' }
    });
    assert.equal(lock2Res.status, 409);
    const lock2Json = await lock2Res.json();
    assert.equal(lock2Json.error, 'LOCK_CONFLICT');

    // Admin 1 unlocks
    const unlockRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${versionId1}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_alice' }
    });
    assert.equal(unlockRes.status, 200);

    // Admin 2 can now acquire lock
    const lock2Retry = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${versionId1}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_bob' }
    });
    assert.equal(lock2Retry.status, 200);

    // Clean up unlock
    await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${versionId1}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_bob' }
    });
  });

  await tSuite.test('3. Atomic Publish & Previous Version Superseding', async () => {
    // Create second draft SRO-V2
    const draft2Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_farhaan' },
      body: JSON.stringify({
        sroNumber: sroNumber2,
        rulesJson: sampleRulesV2
      })
    });
    assert.equal(draft2Res.status, 201);
    versionId2 = (await draft2Res.json()).data.versionId;

    // Publish Version 1
    const pub1Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${versionId1}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_farhaan' }
    });
    assert.equal(pub1Res.status, 200);

    // Public active fare should be Version 1
    const active1Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/fares/active`);
    assert.equal(active1Res.status, 200);
    const active1 = await active1Res.json();
    assert.equal(active1.data.versionId, versionId1);
    assert.equal(active1.data.sroNumber, sroNumber1);

    // Publish Version 2
    const pub2Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${versionId2}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_farhaan' }
    });
    assert.equal(pub2Res.status, 200);

    // Verify Version 2 is now ACTIVE, and Version 1 is SUPERSEDED
    const listRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/versions`, {
      headers: { 'x-admin-id': 'admin_farhaan' }
    });
    const allVersions = (await listRes.json()).data;
    const v1 = allVersions.find(v => v.version_id === versionId1);
    const v2 = allVersions.find(v => v.version_id === versionId2);
    assert.equal(v1.status, 'SUPERSEDED');
    assert.equal(v2.status, 'ACTIVE');
  });

  await tSuite.test('4. Real-time SSE Stream Notification on SRO Publish', async () => {
    // Create draft 3
    const sroNumber3 = `SRO-STA-${Date.now()}-V3`;
    const draft3Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_farhaan' },
      body: JSON.stringify({
        sroNumber: sroNumber3,
        rulesJson: sampleRulesV1
      })
    });
    const v3Id = (await draft3Res.json()).data.versionId;

    // Connect to SSE stream
    const sseReceived = [];
    const sseReq = http.get(`http://127.0.0.1:${testPort}/api/v1/telemetry/stream`, (res) => {
      res.on('data', chunk => {
        const text = chunk.toString();
        if (text.includes('fare_update')) {
          sseReceived.push(text);
        }
      });
    });

    // Wait for connection
    await new Promise(r => setTimeout(r, 200));

    // Publish v3
    await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${v3Id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_farhaan' }
    });

    // Wait for SSE broadcast
    await new Promise(r => setTimeout(r, 400));
    sseReq.destroy();

    assert.ok(sseReceived.length > 0, 'Expected fare_update event delivered to SSE subscriber');
    assert.ok(sseReceived[0].includes('fare_version_published'), 'SSE payload should contain fare_version_published');
  });

  await tSuite.test('5. One-Click Historical Rollback to Prior Active Version', async () => {
    // Rollback to versionId1 (which was SUPERSEDED)
    const rollRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/${versionId1}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_super' }
    });
    assert.equal(rollRes.status, 200);

    // Active version should now be versionId1
    const activeRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/fares/active`);
    assert.equal(activeRes.status, 200);
    const active = await activeRes.json();
    assert.equal(active.data.versionId, versionId1);

    // All versions list should reflect ROLLED_BACK on prior active
    const listRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/fares/sro/versions`, {
      headers: { 'x-admin-id': 'admin_super' }
    });
    const all = (await listRes.json()).data;
    const rolledBack = all.find(v => v.status === 'ROLLED_BACK');
    assert.ok(rolledBack, 'A rolled back version must exist with status ROLLED_BACK');
  });

  await tSuite.test('6. Overcharge Discrepancy Recording & Severity Tiering', async () => {
    // 1. Minor Overcharge (4% overcharge) -> expected ₹100, charged ₹104 (10400 paise)
    const d1Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/compliance/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'TRIP-AUDIT-001',
        routeId: 'SRN-BUD-01',
        driverId: 'JK01-AV-9912',
        expectedFarePaise: 10000,
        chargedFarePaise: 10400,
        operatorId: 'OP_KASHMIR_TRANSIT'
      })
    });
    assert.equal(d1Res.status, 201);
    const d1 = (await d1Res.json()).data;
    assert.equal(d1.severity, 'MINOR');
    assert.equal(d1.overchargePaise, 400);

    // 2. Moderate Overcharge (12% overcharge) -> expected ₹100, charged ₹112 (11200 paise)
    const d2Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/compliance/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'TRIP-AUDIT-002',
        routeId: 'SRN-BUD-01',
        driverId: 'JK01-AV-9912',
        expectedFarePaise: 10000,
        chargedFarePaise: 11200,
        operatorId: 'OP_KASHMIR_TRANSIT'
      })
    });
    assert.equal(d2Res.status, 201);
    const d2 = (await d2Res.json()).data;
    assert.equal(d2.severity, 'MODERATE');

    // 3. Severe Overcharge (35% overcharge) -> expected ₹100, charged ₹135 (13500 paise)
    const d3Res = await fetch(`http://127.0.0.1:${testPort}/api/v1/compliance/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'TRIP-AUDIT-003',
        routeId: 'JMU-KTR-45',
        driverId: 'JK02-BB-4411',
        expectedFarePaise: 10000,
        chargedFarePaise: 13500,
        operatorId: 'OP_JAMMU_EXPRESS'
      })
    });
    assert.equal(d3Res.status, 201);
    const d3 = (await d3Res.json()).data;
    assert.equal(d3.severity, 'SEVERE');
  });

  await tSuite.test('7. Transport Department CSV & JSON Regulatory Audit Export', async () => {
    const authHeaders = { 'x-admin-id': 'admin_transport_dept' };
    // Test JSON export
    const jsonRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/compliance/audit-export?format=json`, {
      headers: authHeaders
    });
    assert.equal(jsonRes.status, 200);
    const checksumHeader = jsonRes.headers.get('x-audit-checksum');
    assert.ok(checksumHeader && checksumHeader.length === 64, 'Must set 64-char hex SHA-256 checksum header');
    const exportJson = await jsonRes.json();
    assert.equal(exportJson.success, true);
    assert.ok(exportJson.totalCount >= 3);
    assert.equal(exportJson.checksum, checksumHeader);

    // Test CSV export
    const csvRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/compliance/audit-export?format=csv`, {
      headers: authHeaders
    });
    assert.equal(csvRes.status, 200);
    assert.ok(csvRes.headers.get('content-type').includes('text/csv'));
    assert.ok(csvRes.headers.get('x-audit-checksum'), 'CSV export must include SHA-256 header');
    const csvText = await csvRes.text();
    assert.ok(csvText.includes('trip_id,route_id,driver_id,expected_fare_paise'));
    assert.ok(csvText.includes('TRIP-AUDIT-001'));
    assert.ok(csvText.includes('OP_KASHMIR_TRANSIT'));
    assert.ok(csvText.includes('OP_JAMMU_EXPRESS'));
  });

  await tSuite.test('8. Operator Compliance Ratings & Discrepancy Statistics', async () => {
    const statsRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/compliance/operator-ratings`, {
      headers: { 'x-admin-id': 'admin_transport_dept' }
    });
    assert.equal(statsRes.status, 200);
    const json = await statsRes.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    
    const kashmirOp = json.data.find(o => o.operator_id === 'OP_KASHMIR_TRANSIT');
    assert.ok(kashmirOp);
    assert.ok(kashmirOp.discrepancy_count >= 2);
    assert.ok(kashmirOp.minor_count >= 1);
    assert.ok(kashmirOp.moderate_count >= 1);

    const jammuOp = json.data.find(o => o.operator_id === 'OP_JAMMU_EXPRESS');
    assert.ok(jammuOp);
    assert.ok(jammuOp.severe_count >= 1);
  });
});
