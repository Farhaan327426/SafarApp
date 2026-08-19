// command-control-server/metrics.js
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'safar_' });

const sseActiveConnections = new client.Gauge({
  name: 'safar_sse_active_connections',
  help: 'Number of active SSE telemetry connections',
  registers: [register]
});

const broadcastPublishDuration = new client.Histogram({
  name: 'safar_broadcast_publish_duration_seconds',
  help: 'Time to publish a telemetry broadcast to Redis or in-memory stateStore',
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

const telemetryBroadcastReceived = new client.Counter({
  name: 'safar_telemetry_broadcast_received_total',
  help: 'Total telemetry broadcasts received from driver clients',
  registers: [register]
});

const anomalyDetected = new client.Counter({
  name: 'safar_anomaly_detected_total',
  help: 'Total anomalies detected by type',
  labelNames: ['type'],
  registers: [register]
});

module.exports = {
  register,
  sseActiveConnections,
  broadcastPublishDuration,
  telemetryBroadcastReceived,
  anomalyDetected,
  contentType: register.contentType
};
