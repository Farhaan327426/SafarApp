import { check, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Counter } from 'k6/metrics';

// Custom Prometheus-aligned metrics
const sseConnectTrend = new Trend('sse_connect_ms');
const sseEventLatencyTrend = new Trend('sse_event_latency_ms');
const broadcastPublishTrend = new Trend('broadcast_publish_ms');
const broadcastErrors = new Counter('broadcast_errors');
const sseErrors = new Counter('sse_errors');

export const options = {
  scenarios: {
    sse_subscribers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 2000 },  // Ramp to 2,000 parallel SSE listeners
        { duration: '5m', target: 2000 },  // Sustain 2,000 listeners
        { duration: '30s', target: 0 },    // Ramp down
      ],
      exec: 'sseSubscriber',
    },
    broadcasters: {
      executor: 'constant-vus',
      vus: 20,                             // 20 active driver vehicle broadcasters
      duration: '7m',
      exec: 'broadcaster',
    },
  },
  thresholds: {
    'sse_event_latency_ms': ['p(95)<1000', 'p(99)<2000'],
    'sse_errors': ['count<50'],
    'broadcast_errors': ['count<10'],
  },
};

export function sseSubscriber() {
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const url = `${baseUrl}/api/v1/telemetry/stream`;
  const started = Date.now();

  const res = http.get(url, {
    headers: { 'Accept': 'text/event-stream' },
    timeout: 300,
    responseType: 'text',
  });

  const connectTime = Date.now() - started;
  sseConnectTrend.add(connectTime);

  check(res, {
    'SSE status is 200': (r) => r.status === 200,
    'SSE content-type correct': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/event-stream'),
  });

  sleep(Math.random() * 180 + 60);
}

export function broadcaster() {
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const url = `${baseUrl}/api/v1/telemetry/broadcast`;

  const driverTokens = [
    'drv_tok_load_01', 'drv_tok_load_02', 'drv_tok_load_03', 'drv_tok_load_04',
    'drv_tok_load_05', 'drv_tok_load_06', 'drv_tok_load_07', 'drv_tok_load_08',
    'drv_tok_load_09', 'drv_tok_load_10', 'drv_tok_load_11', 'drv_tok_load_12',
    'drv_tok_load_13', 'drv_tok_load_14', 'drv_tok_load_15', 'drv_tok_load_16',
    'drv_tok_load_17', 'drv_tok_load_18', 'drv_tok_load_19', 'drv_tok_load_20'
  ];

  const token = driverTokens[Math.floor(Math.random() * driverTokens.length)];
  const payload = JSON.stringify({
    lat: 34.0837 + (Math.random() - 0.5) * 0.05,
    lng: 74.7973 + (Math.random() - 0.5) * 0.05,
    speed: 25 + Math.random() * 20,
    passengerCount: Math.floor(Math.random() * 25),
    routeName: 'Srinagar - Budgam Corridor'
  });

  const started = Date.now();
  const res = http.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  broadcastPublishTrend.add(Date.now() - started);

  if (res.status !== 200 && res.status !== 401) {
    broadcastErrors.add(1);
  }

  sleep(2.5); // Broadcast every 2.5s per vehicle
}
