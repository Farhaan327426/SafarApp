// command-control-server/anomaly/paymentAnomaly.js

const failureBuckets = new Map(); // key (phone/UPI/driverToken) -> Array<timestamp>
const adminAlerts = [];           // Array<{ alertId, type, actor, count, timestamp }>

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes rolling window
const FAILURE_THRESHOLD = 5;       // Trigger alert on 5th failure within window

function recordPaymentFailure(key) {
  if (!key) return false;
  const now = Date.now();
  let bucket = failureBuckets.get(key) || [];
  
  // Prune timestamps older than 10 minutes
  bucket = bucket.filter(ts => now - ts < WINDOW_MS);
  bucket.push(now);
  failureBuckets.set(key, bucket);

  if (bucket.length >= FAILURE_THRESHOLD) {
    const alert = {
      alertId: `alt_${now}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'PAYMENT_FAILURE_SPIKE',
      actor: String(key),
      count: bucket.length,
      windowMinutes: 10,
      timestamp: new Date().toISOString()
    };
    adminAlerts.unshift(alert);
    if (adminAlerts.length > 100) adminAlerts.pop();
    return true;
  }
  return false;
}

function recordPaymentSuccess(key) {
  if (key) failureBuckets.delete(key);
}

function getAdminAlerts() {
  return adminAlerts;
}

function resetPaymentBuckets() {
  failureBuckets.clear();
  adminAlerts.length = 0;
}

module.exports = {
  recordPaymentFailure,
  recordPaymentSuccess,
  getAdminAlerts,
  resetPaymentBuckets,
  FAILURE_THRESHOLD,
  WINDOW_MS
};
