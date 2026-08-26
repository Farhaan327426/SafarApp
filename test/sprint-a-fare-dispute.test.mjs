/**
 * SAFAR — Sprint A: Fare Dispute & Compliance Ledger Test Suite
 * Validates:
 * 1. Schema migration idempotency (schema_migrations & ledger_adjustments)
 * 2. Max-of-Two severity classifier (protects short-hop and catches large nominal overcharges)
 * 3. Commuter dispute idempotency via client-generated disputeId
 * 4. Payout clawback via ledger_adjustments without trips_ledger pollution
 * 5. Insufficient balance recovery handling (UPHELD_PENDING_RECOVERY)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  db,
  stmts,
  classifySeverity,
  recordComplianceDiscrepancyTx,
  resolveDisputeTx,
  getAvailableBalancePaise
} from '../command-control-server/db.js';

test('=== SAFAR SPRINT A: FARE DISPUTE & COMPLIANCE LEDGER SUITE ===', async (t) => {

  await t.test('1. Schema Migrations & Table Integrity', () => {
    const migration = db.prepare("SELECT * FROM schema_migrations WHERE id = '007_add_dispute_fields_to_compliance'").get();
    assert.ok(migration, 'Migration 007 must be recorded in schema_migrations');

    const tableInfo = db.prepare("PRAGMA table_info(fare_compliance_discrepancies)").all();
    const columns = tableInfo.map(c => c.name);

    assert.ok(columns.includes('id'), 'Must preserve primary key id');
    assert.ok(columns.includes('driver_id'), 'Must preserve legacy driver_id');
    assert.ok(columns.includes('operator_id'), 'Must preserve legacy operator_id');
    assert.ok(columns.includes('expected_fare_paise'), 'Must preserve expected_fare_paise');
    assert.ok(columns.includes('charged_fare_paise'), 'Must preserve charged_fare_paise');
    assert.ok(columns.includes('dispute_id'), 'Must include new dispute_id');
    assert.ok(columns.includes('vehicle_no'), 'Must include new vehicle_no');
    assert.ok(columns.includes('passenger_phone_hash'), 'Must include passenger_phone_hash');
    assert.ok(columns.includes('status'), 'Must include status');

    const adjTable = db.prepare("PRAGMA table_info(ledger_adjustments)").all();
    assert.ok(adjTable.length > 0, 'ledger_adjustments table must exist');
  });

  await t.test('2. Max-of-Two Severity Classifier Matrix', () => {
    // 2.1 Rounding floor (< 100 paise) -> MINOR
    const sRounding = classifySeverity(50, 5.5);
    assert.equal(sRounding, 'MINOR', 'Sub-rupee rounding must be MINOR');

    // 2.2 Short-hop predatory: ₹5 overcharge on ₹9 base (55.5% over, 500 paise)
    // Percentage: > 15% -> SEVERE; Absolute: 500p -> MINOR; MAX -> SEVERE
    const sShortHop = classifySeverity(500, 55.55);
    assert.equal(sShortHop, 'SEVERE', 'Short hop 55% overcharge must be SEVERE');

    // 2.3 Moderate percentage, low rupee: ₹8 overcharge on ₹200 base (4% over, 800 paise)
    // Percentage: <= 5% -> MINOR; Absolute: 800p -> MINOR; MAX -> MINOR
    const sLow = classifySeverity(800, 4.0);
    assert.equal(sLow, 'MINOR', '4% overcharge under ₹10 must be MINOR');

    // 2.4 Moderate percentage: ₹25 overcharge on ₹200 base (12.5% over, 2500 paise)
    // Percentage: 12.5% -> MODERATE; Absolute: 2500p -> MODERATE; MAX -> MODERATE
    const sModerate = classifySeverity(2500, 12.5);
    assert.equal(sModerate, 'MODERATE', '12.5% overcharge must be MODERATE');

    // 2.5 Long-hop high nominal: ₹40 overcharge on ₹400 base (10% over, 4000 paise)
    // Percentage: 10% -> MODERATE; Absolute: 4000p -> SEVERE; MAX -> SEVERE
    const sLongHop = classifySeverity(4000, 10.0);
    assert.equal(sLongHop, 'SEVERE', '₹40 overcharge (> ₹30) must be SEVERE even if only 10%');
  });

  await t.test('3. Commuter Dispute Filing & Idempotency', () => {
    const disputeId = `disp-test-${Date.now()}`;

    const res1 = recordComplianceDiscrepancyTx({
      disputeId,
      tripId: 'trip-abc-123',
      routeId: 'SRN-BUD-01',
      driverId: 'DRV-901',
      vehicleNo: 'JK-01-AB-1234',
      expectedFarePaise: 900,
      chargedFarePaise: 1400, // ₹5 overcharge
      operatorId: 'OP_JK_METRO',
      reportedBy: 'passenger',
      passengerPhoneHash: 'hash_masked_123',
      passengerPhoneLast2: '45',
      clientSroVersion: 20260801
    });

    assert.equal(res1.disputeId, disputeId);
    assert.equal(res1.severity, 'SEVERE');
    assert.equal(res1.status, 'OPEN');

    // Duplicate submission with same disputeId
    const res2 = recordComplianceDiscrepancyTx({
      disputeId,
      tripId: 'trip-abc-123',
      routeId: 'SRN-BUD-01',
      driverId: 'DRV-901',
      vehicleNo: 'JK-01-AB-1234',
      expectedFarePaise: 900,
      chargedFarePaise: 1400
    });

    assert.equal(res2.duplicate, true, 'Duplicate submission must return duplicate: true');
    assert.equal(res2.dispute_id, disputeId);
  });

  await t.test('4. Sub-Rupee Rounding Variance Auto-Dismissal', () => {
    const disputeId = `disp-rounding-${Date.now()}`;

    const res = recordComplianceDiscrepancyTx({
      disputeId,
      tripId: 'trip-round-1',
      routeId: 'SRN-BUD-01',
      driverId: 'DRV-901',
      vehicleNo: 'JK-01-AB-1234',
      expectedFarePaise: 900,
      chargedFarePaise: 950 // 50 paise variance
    });

    assert.equal(res.status, 'RESOLVED_DISMISSED', 'Sub-rupee variance must be auto-dismissed');
  });

  await t.test('5. Payout Clawback via ledger_adjustments (Zero KPI Pollution)', () => {
    const testVehicle = `JK-TEST-${Date.now()}`;
    const disputeId = `disp-clawback-${Date.now()}`;

    // Setup driver profile & 2 confirmed paid trips in trips_ledger (₹50 each = ₹100 total)
    stmts.upsertDriver.run(testVehicle, 'Test Driver', 'enc_upi', 'enc_acct', 'enc_ifsc', 'enc_holder');
    stmts.insertTrip.run(`trip-c1-${Date.now()}`, testVehicle, 50.0, 'SRN-BUD-01', 'Lal Chowk', 'Budgam', 'PAID', null, null, 0, 1);
    stmts.insertTrip.run(`trip-c2-${Date.now()}`, testVehicle, 50.0, 'SRN-BUD-01', 'Lal Chowk', 'Budgam', 'PAID', null, null, 0, 1);

    const initialBalance = getAvailableBalancePaise(testVehicle);
    assert.equal(initialBalance, 10000, 'Initial balance must be 10000 paise (₹100)');

    const tripCountBefore = db.prepare('SELECT COUNT(*) as cnt FROM trips_ledger WHERE vehicle_no = ?').get(testVehicle).cnt;

    // File dispute for ₹15 overcharge (1500 paise)
    recordComplianceDiscrepancyTx({
      disputeId,
      tripId: `trip-c1-${Date.now()}`,
      routeId: 'SRN-BUD-01',
      driverId: 'DRV-TEST',
      vehicleNo: testVehicle,
      expectedFarePaise: 3500,
      chargedFarePaise: 5000 // 1500 paise overcharge
    });

    // Admin resolves and upholds dispute
    const resolveRes = resolveDisputeTx({
      disputeId,
      action: 'UPHOLD',
      adminId: 'super_admin_1',
      notes: 'Overcharge verified from GPS log'
    });

    assert.equal(resolveRes.success, true);
    assert.equal(resolveRes.status, 'RESOLVED_UPHELD');

    // Verify available balance decreased by 1500 paise (to 8500 paise / ₹85)
    const postClawbackBalance = getAvailableBalancePaise(testVehicle);
    assert.equal(postClawbackBalance, 8500, 'Available balance must be reduced to 8500 paise');

    // Verify ledger_adjustments row was created
    const adj = db.prepare('SELECT * FROM ledger_adjustments WHERE dispute_id = ?').get(disputeId);
    assert.ok(adj, 'ledger_adjustments entry must exist');
    assert.equal(adj.amount_paise, 1500);

    // Verify trips_ledger was NOT polluted with fake trips
    const tripCountAfter = db.prepare('SELECT COUNT(*) as cnt FROM trips_ledger WHERE vehicle_no = ?').get(testVehicle).cnt;
    assert.equal(tripCountAfter, tripCountBefore, 'trips_ledger row count must not change on clawback');
  });

  await t.test('6. Insufficient Balance Recovery (UPHELD_PENDING_RECOVERY)', () => {
    const poorVehicle = `JK-POOR-${Date.now()}`;
    const disputeId = `disp-poor-${Date.now()}`;

    stmts.upsertDriver.run(poorVehicle, 'Poor Driver', 'enc_upi', 'enc_acct', 'enc_ifsc', 'enc_holder');
    // 0 paid trips -> 0 balance

    const balanceBefore = getAvailableBalancePaise(poorVehicle);
    assert.equal(balanceBefore, 0);

    recordComplianceDiscrepancyTx({
      disputeId,
      tripId: 'trip-poor-1',
      routeId: 'SRN-BUD-01',
      vehicleNo: poorVehicle,
      expectedFarePaise: 900,
      chargedFarePaise: 2900 // 2000 paise overcharge
    });

    const resolveRes = resolveDisputeTx({
      disputeId,
      action: 'UPHOLD',
      adminId: 'admin_rto',
      notes: 'Upheld for zero-balance driver'
    });

    assert.equal(resolveRes.status, 'UPHELD_PENDING_RECOVERY', 'Status must be UPHELD_PENDING_RECOVERY when balance < overcharge');

    // Balance remains floored at 0
    const balanceAfter = getAvailableBalancePaise(poorVehicle);
    assert.equal(balanceAfter, 0);
  });

  await t.test('7. Admin Dispute Dismissal', () => {
    const disputeId = `disp-dismiss-${Date.now()}`;

    recordComplianceDiscrepancyTx({
      disputeId,
      tripId: 'trip-d-1',
      routeId: 'SRN-BUD-01',
      vehicleNo: 'JK-01-AB-1234',
      expectedFarePaise: 900,
      chargedFarePaise: 2000
    });

    const res = resolveDisputeTx({
      disputeId,
      action: 'DISMISS',
      adminId: 'admin_1',
      notes: 'Fare board matched special peak tariff'
    });

    assert.equal(res.status, 'RESOLVED_DISMISSED');

    const adj = db.prepare('SELECT * FROM ledger_adjustments WHERE dispute_id = ?').get(disputeId);
    assert.equal(adj, undefined, 'No ledger adjustment should be created on dismissal');
  });

});
