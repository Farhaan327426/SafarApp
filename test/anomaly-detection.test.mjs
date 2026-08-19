/**
 * SAFAR — Telemetry Anomaly Detection & Prometheus Metrics Test Suite
 * Tests GPS speed limits, tunnel-aware allowances, payment failure spike alerts, and /metrics.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectGpsAnomaly, resetHistory } from '../command-control-server/anomaly/gpsAnomaly.js';
import { recordPaymentFailure, recordPaymentSuccess, getAdminAlerts, resetPaymentBuckets } from '../command-control-server/anomaly/paymentAnomaly.js';
import metrics from '../command-control-server/metrics.js';

test('▶ Anomaly Detection & Telemetry Monitoring Suite', async (t) => {

  t.beforeEach(() => {
    resetHistory();
    resetPaymentBuckets();
  });

  await t.test('1. GPS Speed Filter: Standard road velocity > 100 km/h detected as anomaly', () => {
    const driverId = 'JK01-ANOMALY-01';
    const now = Date.now();

    // Point 1: Lal Chowk
    const pt1 = { lat: 34.0725, lng: 74.8050, timestamp: now };
    const r1 = detectGpsAnomaly(driverId, pt1);
    assert.equal(r1.anomaly, false, 'First GPS point should establish baseline');

    // Point 2: 1.5 km away in 10 seconds (Speed = 540 km/h)
    const pt2 = { lat: 34.0860, lng: 74.8050, timestamp: now + 10000 };
    const r2 = detectGpsAnomaly(driverId, pt2);

    assert.equal(r2.anomaly, true, 'Speed > 100 km/h outside tunnels must be flagged as anomaly');
    assert.ok(r2.speedKmh > 100, `Computed speed (${r2.speedKmh} km/h) must exceed 100 km/h`);
  });

  await t.test('2. Tunnel-Aware Allowance: High speed inside Banihal/Jawahar Tunnel accepted', () => {
    const driverId = 'JK01-TUNNEL-01';
    const now = Date.now();

    // Inside Banihal-Qazigund Tunnel bounding box (lat ~33.52, lng ~75.18)
    const pt1 = { lat: 33.5200, lng: 75.1800, timestamp: now };
    detectGpsAnomaly(driverId, pt1);

    // Moves 300m in 10s (Speed ~ 108 km/h, well within TUNNEL_MAX_SPEED_KMH = 150)
    const pt2 = { lat: 33.5227, lng: 75.1800, timestamp: now + 10000 };
    const r2 = detectGpsAnomaly(driverId, pt2);

    assert.equal(r2.anomaly, false, 'Velocity <= 150 km/h inside tunnel bounding box must be permitted');
    assert.equal(r2.inTunnel, true, 'Result should confirm location inside tunnel boundary');
  });

  await t.test('3. Payment Failure Spike: Triggers admin alert on 5th consecutive failure', () => {
    const actorKey = 'JK01-BUS-7777';

    // 1st to 4th failures
    for (let i = 1; i <= 4; i++) {
      const isSpike = recordPaymentFailure(actorKey);
      assert.equal(isSpike, false, `Failure #${i} should not trigger spike alert yet`);
    }

    // 5th failure triggers spike
    const isSpike5 = recordPaymentFailure(actorKey);
    assert.equal(isSpike5, true, '5th failure within 10 minutes must trigger spike alert');

    const alerts = getAdminAlerts();
    assert.ok(alerts.length >= 1, 'Admin alert list must contain generated alert');
    assert.equal(alerts[0].type, 'PAYMENT_FAILURE_SPIKE');
    assert.equal(alerts[0].actor, actorKey);
  });

  await t.test('4. Payment Success: Clears failure bucket', () => {
    const actorKey = 'JK01-BUS-8888';

    recordPaymentFailure(actorKey);
    recordPaymentFailure(actorKey);
    recordPaymentSuccess(actorKey);

    // Next failure should be count 1, not 3
    const isSpike = recordPaymentFailure(actorKey);
    assert.equal(isSpike, false, 'Success must reset counter, preventing false spike');
  });

  await t.test('5. Prometheus Metrics: Registry exports standard Prometheus formatting', async () => {
    metrics.sseActiveConnections.set(42);
    metrics.anomalyDetected.inc({ type: 'gps_jump' });
    metrics.telemetryBroadcastReceived.inc(100);

    const output = await metrics.register.metrics();
    assert.ok(output.includes('safar_sse_active_connections 42'), 'Metrics must export active SSE gauge');
    assert.ok(output.includes('safar_anomaly_detected_total{type="gps_jump"} 1'), 'Metrics must export anomaly counter');
    assert.ok(output.includes('safar_telemetry_broadcast_received_total 100'), 'Metrics must export broadcast counter');
  });

});
