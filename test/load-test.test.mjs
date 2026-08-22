import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app, sseClients, broadcastTelemetry } = require('../command-control-server/server.js');

let server = null;
let BASE_URL = '';
const CONCURRENT_SSE_CLIENTS = 50;
const CONCURRENT_AI_REQUESTS = 25;

function calculatePercentiles(latenciesMs) {
  if (latenciesMs.length === 0) return { p50: 0, p95: 0 };
  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p95 = sorted[Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1)];
  return { p50, p95 };
}

function connectSseClient(url, expectedEventsCount = 2, timeoutMs = 10000) {
  const clientObj = {
    req: null,
    res: null,
    receivedEvents: [],
    close() {
      if (this.res) this.res.destroy();
      if (this.req) this.req.destroy();
    }
  };

  const promise = new Promise((resolve, reject) => {
    clientObj.req = http.get(url, {
      headers: { 'Accept': 'text/event-stream' }
    }, (res) => {
      clientObj.res = res;
      if (res.statusCode !== 200) {
        reject(new Error('SSE Connection failed with status: ' + res.statusCode));
        return;
      }

      let buffer = '';
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for ' + expectedEventsCount + ' SSE events. Got ' + clientObj.receivedEvents.length));
      }, timeoutMs);

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop();

        for (const block of blocks) {
          const lines = block.split('\n').map(l => l.trim());
          if (lines.some(l => l.startsWith(':'))) continue;

          const eventTypeLine = lines.find(l => l.startsWith('event:'));
          const dataLine = lines.find(l => l.startsWith('data:'));

          if (eventTypeLine || dataLine) {
            const eventType = eventTypeLine ? eventTypeLine.replace('event:', '').trim() : 'message';
            const dataStr = dataLine ? dataLine.replace('data:', '').trim() : '';

            clientObj.receivedEvents.push({ type: eventType, data: dataStr });

            if (clientObj.receivedEvents.length >= expectedEventsCount) {
              clearTimeout(timer);
              resolve(clientObj);
              return;
            }
          }
        }
      });

      res.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    clientObj.req.on('error', (err) => {
      reject(err);
    });
  });

  return { clientObj, promise };
}

describe('Phase 2 Step 4a — SafarApp Command Control Backend Load Test', () => {

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        BASE_URL = 'http://127.0.0.1:' + address.port;
        console.log('[Load Test] Server listening on ' + BASE_URL);
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    setTimeout(() => process.exit(0), 100);
  });

  it('1. Deterministic SSE Concurrency & Connection Cleanup Test', async () => {
    const clients = [];
    try {
      const clientPromises = [];
      for (let i = 0; i < CONCURRENT_SSE_CLIENTS; i++) {
        const { clientObj, promise } = connectSseClient(BASE_URL + '/api/v1/telemetry/stream', 2, 10000);
        clients.push(clientObj);
        clientPromises.push(promise);
      }

      const deadline = Date.now() + 5000;
      while (sseClients.size < CONCURRENT_SSE_CLIENTS && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 20));
      }
      assert.strictEqual(sseClients.size, CONCURRENT_SSE_CLIENTS, 'server sseClients.size must equal ' + CONCURRENT_SSE_CLIENTS);

      if (typeof broadcastTelemetry === 'function') {
        broadcastTelemetry({ vehicleId: 'JK01-A-4892', lat: 34.0837, lng: 74.7973, speed: 45 });
      }

      await Promise.all(clientPromises);

      for (const client of clients) {
        const types = client.receivedEvents.map(e => e.type);
        assert.ok(types.includes('snapshot'), 'Client must receive snapshot');
        assert.ok(types.includes('telemetry'), 'Client must receive telemetry');
      }

      for (const client of clients) {
        client.close();
      }

      const cleanupDeadline = Date.now() + 2000;
      while (sseClients.size > 0 && Date.now() < cleanupDeadline) {
        await new Promise(r => setTimeout(r, 50));
      }

      assert.strictEqual(sseClients.size, 0, 'sseClients.size must equal 0 after socket teardown');

    } finally {
      for (const client of clients) {
        try { client.close(); } catch (_) {}
      }
    }
  });

  it('2. Real AI Endpoint (/api/v1/ai/query) Latency Benchmarks (p50/p95)', async () => {
    const makeAiRequest = (ipHeader) => new Promise((resolve, reject) => {
      const startHr = process.hrtime.bigint();
      const postData = JSON.stringify({ query: 'What is the fare from Srinagar to Jammu?' });

      const req = http.request(BASE_URL + '/api/v1/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-Forwarded-For': ipHeader
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const durationMs = Number(process.hrtime.bigint() - startHr) / 1e6;
          resolve({ statusCode: res.statusCode, body, durationMs });
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    for (let i = 0; i < 3; i++) {
      await makeAiRequest('192.168.1.' + (i + 1));
    }

    const requests = Array.from({ length: CONCURRENT_AI_REQUESTS }).map((_, i) =>
      makeAiRequest('203.0.113.' + (i + 100))
    );

    const responses = await Promise.all(requests);
    const successful = responses.filter(r => r.statusCode === 200);

    assert.strictEqual(successful.length, CONCURRENT_AI_REQUESTS, 'All 25 requests with distinct IPs must succeed (HTTP 200)');

    const latenciesMs = responses.map(r => r.durationMs);
    const { p50, p95 } = calculatePercentiles(latenciesMs);

    console.log('[AI Benchmark Metrics] p50 = ' + p50.toFixed(2) + 'ms, p95 = ' + p95.toFixed(2) + 'ms');

    assert.ok(p50 <= 2000, 'p50 median latency (' + p50.toFixed(2) + 'ms) must be <= 2000ms');
    assert.ok(p95 <= 3000, 'p95 latency (' + p95.toFixed(2) + 'ms) must be <= 3000ms');
  });

  it('3. Trust Proxy IP Derivation & Rate Limiting Enforcement', async () => {
    const testIp = '198.51.100.99';

    const sendReq = () => new Promise((resolve) => {
      const postData = JSON.stringify({ query: 'Rate limit check' });
      const req = http.request(BASE_URL + '/api/v1/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-Forwarded-For': testIp
        }
      }, (res) => {
        resolve(res.statusCode);
      });
      req.write(postData);
      req.end();
    });

    let rateLimited = false;
    for (let i = 0; i < 25; i++) {
      const status = await sendReq();
      if (status === 429) {
        rateLimited = true;
        break;
      }
    }

    assert.strictEqual(rateLimited, true, 'Repeated requests from single IP must return HTTP 429');
  });

});
