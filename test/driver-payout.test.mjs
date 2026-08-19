/**
 * SAFAR — Driver Payout & Ledger Audit Flow Integration Test Suite
 * Tests KYC gating, atomic FIFO trip allocations, idempotency,
 * available balance tracking, admin review (approve/reject/mark-paid),
 * and CSV earnings export.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const serverPkg = require('../command-control-server/server.js');
const dbPkg = require('../command-control-server/db.js');
const { app, server } = serverPkg;
const { stmts, recordPaymentTx } = dbPkg;

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

test('▶ Driver Payout & Ledger Audit Flow', async (tSuite) => {

  const testVehicleNo = `JK01-PAY-${Date.now() % 10000}`;
  let driverToken = null;

  // Seed Driver & Initial Confirmed Trips
  await tSuite.test('0. Setup: Register driver and seed confirmed trip earnings', async () => {
    // 1. Register driver
    const onbRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '9876500001',
        name: 'Bashir Ahmad',
        vehicleNo: testVehicleNo,
        upiId: 'bashir@ybl'
      })
    });
    assert.equal(onbRes.status, 201);
    const onbJson = await onbRes.json();
    driverToken = onbJson.data.driverToken;

    // 2. Insert 3 confirmed trips totaling ₹600 (₹200 + ₹250 + ₹150)
    const trip1Id = `TRIP-PAY-1-${Date.now()}`;
    const trip2Id = `TRIP-PAY-2-${Date.now()}`;
    const trip3Id = `TRIP-PAY-3-${Date.now()}`;

    stmts.insertTrip.run(trip1Id, testVehicleNo, 200, 'SRN-BUD-01', 'Lal Chowk', 'Budgam', 'PAID', null, 0, 3, 0);
    recordPaymentTx(trip1Id, 'PAID', 'UPI-REF-001', new Date().toISOString(), testVehicleNo, 200);

    stmts.insertTrip.run(trip2Id, testVehicleNo, 250, 'SRN-BUD-01', 'Lal Chowk', 'Budgam', 'PAID', null, 0, 3, 0);
    recordPaymentTx(trip2Id, 'PAID', 'UPI-REF-002', new Date().toISOString(), testVehicleNo, 250);

    stmts.insertTrip.run(trip3Id, testVehicleNo, 150, 'SRN-BUD-01', 'Lal Chowk', 'Budgam', 'PAID', null, 0, 3, 0);
    recordPaymentTx(trip3Id, 'PAID', 'UPI-REF-003', new Date().toISOString(), testVehicleNo, 150);
  });

  await tSuite.test('1. KYC Gate: Payout request blocked with 403 when KYC unapproved', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/payout/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        requestId: `REQ-BLOCKED-${Date.now()}`,
        amount: 200
      })
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'KYC_NOT_APPROVED');
  });

  await tSuite.test('2. KYC Approval: Admin approves driver KYC', async () => {
    const verifyRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/kyc/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleNo: testVehicleNo,
        action: 'approve'
      })
    });

    assert.equal(verifyRes.status, 200);
  });

  await tSuite.test('3. Insufficient Balance: Requesting amount exceeding balance returns 422', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/payout/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        requestId: `REQ-EXCEED-${Date.now()}`,
        amount: 1000 // Total earned is ₹600
      })
    });

    assert.equal(res.status, 422);
    const json = await res.json();
    assert.equal(json.error.code, 'INSUFFICIENT_BALANCE');
    assert.equal(json.error.availableRupees, 600);
  });

  let activePayoutId = null;
  const uniqueRequestId = `REQ-WITHDRAW-${Date.now()}`;

  await tSuite.test('4. Payout Request: Requesting ₹350 creates pending payout and locks trip allocations', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/payout/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        requestId: uniqueRequestId,
        amount: 350,
        upiId: 'bashir@ybl'
      })
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.amountRupees, 350);
    assert.equal(json.data.status, 'pending');
    assert.equal(json.data.remainingAvailableRupees, 250); // 600 - 350 = 250
    activePayoutId = json.data.payoutId;
  });

  await tSuite.test('5. Idempotency Check: Repeating same requestId returns 409 and original payout ID', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/payout/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        requestId: uniqueRequestId,
        amount: 350
      })
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.error.code, 'DUPLICATE_REQUEST');
    assert.equal(json.error.payoutId, activePayoutId);
  });

  await tSuite.test('6. Earnings Summary: Reflects reduced available balance and pending payout', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/earnings/summary`, {
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.availableRupees, 250);
    assert.equal(json.data.pendingPayoutsRupees, 350);
    assert.equal(json.data.lifetimeEarnedRupees, 600);
  });

  await tSuite.test('7. Admin Review: Admin sees pending payout in queue and approves it', async () => {
    const queueRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/payout/pending`);
    assert.equal(queueRes.status, 200);
    const queueJson = await queueRes.json();
    const target = queueJson.data.find(p => p.payoutId === activePayoutId);
    assert.ok(target, 'Active payout must be listed in admin queue');
    assert.equal(target.amountRupees, 350);

    const approveRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/payout/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Id': 'admin_auditor' },
      body: JSON.stringify({ payoutId: activePayoutId })
    });

    assert.equal(approveRes.status, 200);
    const approveJson = await approveRes.json();
    assert.equal(approveJson.data.status, 'approved');
  });

  await tSuite.test('8. Admin Mark Paid: Enters UTR reference and finalizes payout', async () => {
    const markRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/payout/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Id': 'admin_auditor' },
      body: JSON.stringify({
        payoutId: activePayoutId,
        utrReference: 'UTR20260819776655'
      })
    });

    assert.equal(markRes.status, 200);
    const markJson = await markRes.json();
    assert.equal(markJson.data.status, 'paid');
    assert.equal(markJson.data.utrReference, 'UTR20260819776655');
  });

  await tSuite.test('9. Payout Status: Driver sees paid status and UTR reference', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/payout/status`, {
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    const target = json.data.find(p => p.payoutId === activePayoutId);
    assert.ok(target);
    assert.equal(target.status, 'paid');
    assert.equal(target.utrReference, 'UTR20260819776655');
  });

  await tSuite.test('10. Rejection & Release Flow: Requesting remaining ₹250 and rejecting releases funds', async () => {
    // 1. Request ₹250
    const reqRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/payout/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        requestId: `REQ-REJECT-${Date.now()}`,
        amount: 250
      })
    });
    assert.equal(reqRes.status, 201);
    const reqJson = await reqRes.json();
    const rejectPayoutId = reqJson.data.payoutId;

    // 2. Reject payout with reason
    const rejectRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/admin/payout/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Id': 'admin_auditor' },
      body: JSON.stringify({
        payoutId: rejectPayoutId,
        reason: 'UPI ID inactive on NPCI switch. Please update UPI handle.'
      })
    });
    assert.equal(rejectRes.status, 200);

    // 3. Verify available balance returned to ₹250
    const summaryRes = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/earnings/summary`, {
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });
    const summaryJson = await summaryRes.json();
    assert.equal(summaryJson.data.availableRupees, 250);
  });

  await tSuite.test('11. CSV Export: GET /api/v1/driver/earnings/export returns full statement', async () => {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/v1/driver/earnings/export`, {
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'), 'Content-type must contain text/csv');
    const text = await res.text();
    assert.ok(text.includes('=== SAFAR DRIVER EARNINGS & PAYOUT STATEMENT ==='));
    assert.ok(text.includes(testVehicleNo));
    assert.ok(text.includes('UTR20260819776655'));
  });

});
