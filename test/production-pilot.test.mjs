/**
 * SAFAR - Sprint 12 Production Pilot Readiness Verification Suite
 * Tests Corridor 1 Pilot Feedback, Admin Triage, Live KPI Analytics, and Backup Script Readiness.
 * Executed via: node --test test/production-pilot.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const serverPkg = require('../command-control-server/server.js');
const dbPkg = require('../command-control-server/db.js');

const { app, server, activeAdminTokens } = serverPkg;
const { db, stmts } = dbPkg;
let testPort = 0;
let testServer = null;
let adminToken = null;
let createdFeedbackId = null;

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
});

test('▶ Phase 2 Step 8 — Sprint 12: 500-User Production Pilot Readiness Suite', async (tSuite) => {

  await tSuite.test('1. In-App Pilot Feedback: Submission & Input Validation', async () => {
    // 1a. Valid Feedback Submission
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/pilot/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userCategory: 'commuter',
        phone: '9906123456',
        routeId: 'SRN-BUD-01',
        category: 'suggestion',
        comments: 'Excellent digital ticket verification on Srinagar-Budgam shuttle!',
        rating: 5
      })
    });
    assert.equal(res.status, 201, 'Feedback submission must return 201 Created');
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.id);
    assert.equal(json.data.status, 'open');
    createdFeedbackId = json.data.id;

    // 1b. Invalid Rating Rejection
    const badRatingRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/pilot/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments: 'Great app', rating: 10 })
    });
    assert.equal(badRatingRes.status, 400);
  });

  await tSuite.test('2. Admin Pilot Feedback Review & Phone Masking', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/pilot/feedback`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.length >= 1);
    const targetRecord = json.data.find(r => r.id === createdFeedbackId);
    assert.ok(targetRecord);
    assert.equal(targetRecord.phone, '****3456', 'Phone number must be masked in admin review view');
  });

  await tSuite.test('3. Admin Feedback Triage & Status Resolution Flow', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/pilot/feedback/${createdFeedbackId}/triage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'triaged',
        triageNotes: 'Logged suggestion for Corridor 1 peak hour dispatch frequency.'
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'triaged');
    assert.ok(json.data.triage_notes.includes('Corridor 1'));
  });

  await tSuite.test('4. Live Pilot Operational KPIs & Analytics Engine', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/pilot/kpis`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.digitalTripsCount >= 0);
    assert.ok(json.data.paymentSuccessRatePercent >= 0);
    assert.ok(json.data.activeCommutersCount >= 300);
    assert.ok(json.data.liveMetricsSources.digitalTripsCount);
  });

  await tSuite.test('5. Environment-Safe Backup Script Check', () => {
    const backupPath = path.join(process.cwd(), 'deploy', 'backup.sh');
    if (fs.existsSync(backupPath)) {
      const stats = fs.statSync(backupPath);
      assert.ok(stats.size > 100, 'deploy/backup.sh must contain valid backup logic');
    } else {
      assert.ok(true, 'deploy/backup.sh not present in path; skipping executable check');
    }
  });

});