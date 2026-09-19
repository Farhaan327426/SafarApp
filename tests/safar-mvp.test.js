/**
 * SAFAR AI MVP — Automated Test Suite (Stage 1 & Stage 2)
 * Run using Node.js built-in test runner: `node --test tests/safar-mvp.test.js`
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../backend/index.js';
import { getSession } from '../backend/ai/conversationService.js';
import { calculateFare } from '../backend/fare/fareService.js';
import { getRoute } from '../backend/routes/routeService.js';
import { getSchedule } from '../backend/schedule/scheduleService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Safar AI MVP: Stage 1 Foundation Tests', () => {
  let server;
  const TEST_PORT = 3199;
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. Database files exist and are valid JSON', () => {
    const files = ['locations.json', 'fares.json', 'routes.json', 'schedules.json'];
    for (const file of files) {
      const filePath = path.join(ROOT_DIR, 'database', file);
      assert.ok(fs.existsSync(filePath), `File should exist: ${file}`);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      assert.ok(Array.isArray(parsed), `${file} should contain a JSON array`);
      assert.ok(parsed.length > 0, `${file} should not be empty`);
    }
  });

  test('2. 12 MVP Locations are present with required aliases and DEMO flag', () => {
    const locationsPath = path.join(ROOT_DIR, 'database', 'locations.json');
    const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf-8'));

    const expectedIds = [
      'srinagar', 'lal_chowk', 'trc', 'baramulla', 'budgam', 'sopore',
      'anantnag', 'pahalgam', 'gulmarg', 'sonamarg', 'jammu', 'katra'
    ];

    assert.equal(locations.length, 12, 'Must contain exactly 12 MVP locations');

    for (const expectedId of expectedIds) {
      const loc = locations.find((l) => l.id === expectedId);
      assert.ok(loc, `Location "${expectedId}" must be defined`);
      assert.equal(loc.source_type, 'DEMO', `Location "${expectedId}" must be marked as DEMO`);
      assert.ok(loc.aliases.en?.length > 0, `Location "${expectedId}" must have English aliases`);
      assert.ok(loc.aliases.ur?.length > 0, `Location "${expectedId}" must have Urdu aliases`);
      assert.ok(loc.aliases.hi?.length > 0, `Location "${expectedId}" must have Hindi aliases`);
      assert.ok(loc.aliases.romanized?.length > 0, `Location "${expectedId}" must have Romanized aliases`);
    }
  });

  test('3. Data Safety: Every record in all database collections is labeled source_type: DEMO', () => {
    const files = ['locations.json', 'fares.json', 'routes.json', 'schedules.json'];
    for (const file of files) {
      const filePath = path.join(ROOT_DIR, 'database', file);
      const items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      for (const item of items) {
        assert.equal(item.source_type, 'DEMO', `Item in ${file} must have source_type: DEMO`);
        assert.ok(item.source, `Item in ${file} must have a source provenance string`);
      }
    }
  });

  test('4. Schedules collection contains the mandatory listed schedule disclaimer', () => {
    const schedulesPath = path.join(ROOT_DIR, 'database', 'schedules.json');
    const schedules = JSON.parse(fs.readFileSync(schedulesPath, 'utf-8'));
    for (const item of schedules) {
      assert.equal(
        item.disclaimer,
        'This is the listed schedule, not live vehicle information.',
        'Schedule must include exact mandatory static disclaimer'
      );
    }
  });

  test('5. Backend API: GET /api/health responds with Stage 1/2 status and DEMO data safety notice', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.ok(data.stage >= 1);
    assert.equal(data.dataSafety.mode, 'DEMO');
    assert.equal(data.database.locationsCount, 12);
  });

  test('6. Backend API: POST /api/chat returns Stage 1/2 foundation response for non-fare query', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello Safar AI' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(
      data.reply,
      'Safar AI is ready to help with fares, routes, schedules, and complaints.'
    );
    assert.equal(data.source_type, 'DEMO');
  });

  test('7. Conversation Context: Manages 4 session memory fields correctly', () => {
    const session = getSession('test-session-1');
    session.reset();
    assert.deepEqual(session.getContext(), {
      lastOrigin: null,
      lastDestination: null,
      lastTransportMode: null,
      lastIntent: null
    });

    session.updateContext({
      origin: 'Baramulla',
      destination: 'Srinagar',
      transportMode: 'minibus',
      intent: 'FARE'
    });

    assert.deepEqual(session.getContext(), {
      lastOrigin: 'Baramulla',
      lastDestination: 'Srinagar',
      lastTransportMode: 'minibus',
      lastIntent: 'FARE'
    });
  });

  test('8. Frontend Static Files: Server serves index.html and assets properly', async () => {
    const homeRes = await fetch(`${BASE_URL}/`);
    assert.equal(homeRes.status, 200);
    const htmlText = await homeRes.text();
    assert.ok(htmlText.includes('SAFAR AI'), 'Homepage should contain SAFAR AI brand');
    assert.ok(htmlText.includes('Your J&K Transport Assistant'), 'Homepage should contain subtitle');
    assert.ok(htmlText.includes('Quick Actions'), 'Homepage should contain Quick Actions');
    assert.ok(htmlText.includes('Popular Routes'), 'Homepage should contain Popular Routes');
    assert.ok(htmlText.includes('DEMO DATA'), 'Homepage should display DEMO DATA notice');

    const cssRes = await fetch(`${BASE_URL}/css/safar-mvp.css`);
    assert.equal(cssRes.status, 200);
    assert.ok(cssRes.headers.get('content-type')?.includes('text/css'));

    const jsRes = await fetch(`${BASE_URL}/js/safar-app.js`);
    assert.equal(jsRes.status, 200);
    assert.ok(jsRes.headers.get('content-type')?.includes('javascript'));
  });
});

describe('Safar AI MVP: Stage 2 Fare System Tests', () => {
  let server;
  const TEST_PORT = 3198;
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. Known fare route via POST /api/fare: Baramulla to Srinagar', async () => {
    const res = await fetch(`${BASE_URL}/api/fare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Baramulla',
        destination: 'Srinagar',
        vehicleType: 'Minibus'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.type, 'FARE');
    assert.equal(data.origin, 'Baramulla');
    assert.equal(data.destination, 'Srinagar');
    assert.equal(data.vehicleType, 'Minibus');
    assert.equal(data.fare.min, 50);
    assert.equal(data.fare.max, 60);
    assert.equal(data.source_type, 'DEMO');
    assert.equal(data.status, 'DEMO / ESTIMATE');
  });

  test('2. Reverse direction of bidirectional route: Srinagar to Baramulla', async () => {
    const result = calculateFare({
      origin: 'Srinagar',
      destination: 'Baramulla'
    });

    assert.equal(result.success, true);
    assert.equal(result.origin, 'Srinagar');
    assert.equal(result.destination, 'Baramulla');
    assert.equal(result.fare.min, 50);
    assert.equal(result.fare.max, 60);
    assert.equal(result.source_type, 'DEMO');
  });

  test('3. Vehicle-specific fare lookup: Shared Taxi for Baramulla to Srinagar', async () => {
    const res = await fetch(`${BASE_URL}/api/fare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Baramulla',
        destination: 'Srinagar',
        vehicleType: 'shared taxi'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.vehicleType, 'Shared Taxi / Cab');
    assert.equal(data.fare.min, 90);
    assert.equal(data.fare.max, 110);
  });

  test('4. Unknown route: Kupwara to Kishtwar returns clear unsupported message', async () => {
    const res = await fetch(`${BASE_URL}/api/fare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Kupwara',
        destination: 'Kishtwar'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "I don't have verified information for this route yet.");
    assert.equal(data.source_type, 'DEMO');
  });

  test('5. Unknown location: returns unsupported message without inventing data', async () => {
    const result = calculateFare({
      origin: 'UnknownTown',
      destination: 'Srinagar'
    });

    assert.equal(result.success, false);
    assert.equal(result.message, "I don't have verified information for this route yet.");
    assert.equal(result.source_type, 'DEMO');
  });

  test('6. Missing origin or destination: asks user for details instead of guessing', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How much?' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.reply.includes('Which route would you like to check?'));
    assert.ok(data.reply.includes('starting point and destination'));
  });

  test('7. Romanized fare query: "Baramulla se Srinagar ka kiraya?" resolves correctly', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Baramulla se Srinagar ka kiraya?',
        sessionId: 'test-romanized-session'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.ok(data.fareData, 'Should return structured fareData');
    assert.equal(data.fareData.origin, 'Baramulla');
    assert.equal(data.fareData.destination, 'Srinagar');
    assert.equal(data.fareData.fare.min, 50);
    assert.equal(data.fareData.fare.max, 60);
    assert.equal(data.source_type, 'DEMO');
  });

  test('8. Follow-up query: "What about shared taxi?" reuses context', async () => {
    const sessionId = 'test-follow-up-session';

    // Turn 1: "Fare from Baramulla to Srinagar?"
    const res1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Fare from Baramulla to Srinagar?',
        sessionId
      })
    });

    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.fareData.origin, 'Baramulla');
    assert.equal(data1.fareData.destination, 'Srinagar');
    assert.equal(data1.fareData.vehicleType, 'Minibus');

    // Turn 2: "What about shared taxi?"
    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What about shared taxi?',
        sessionId
      })
    });

    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.fareData.origin, 'Baramulla');
    assert.equal(data2.fareData.destination, 'Srinagar');
    assert.equal(data2.fareData.vehicleType, 'Shared Taxi / Cab');
    assert.equal(data2.fareData.fare.min, 90);
    assert.equal(data2.fareData.fare.max, 110);
  });

  test('9. DEMO disclaimer presence: every fare response contains the required notice', () => {
    const result = calculateFare({
      origin: 'Budgam',
      destination: 'Lal Chowk'
    });

    assert.equal(result.success, true);
    assert.equal(result.source_type, 'DEMO');
    assert.equal(
      result.disclaimer,
      'Demo / Estimated data — actual fare may vary by operator.'
    );
    assert.ok(result.formattedText.includes('Notice:'));
    assert.ok(result.formattedText.includes('Demo / Estimated data — actual fare may vary by operator.'));
  });

  test('10. No fabricated fare for unsupported routes: strictly rejects invention', () => {
    const result = calculateFare({
      origin: 'Gulmarg',
      destination: 'Pahalgam'
    });

    assert.equal(result.success, false);
    assert.equal(result.message, "I don't have verified information for this route yet.");
    assert.equal(result.fare, undefined);
  });
});

describe('Safar AI MVP: Stage 3 Route System Tests', () => {
  let server;
  const TEST_PORT = 3197;
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. Known route API request via POST /api/route: Budgam to Lal Chowk', async () => {
    const res = await fetch(`${BASE_URL}/api/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Budgam',
        destination: 'Lal Chowk'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.type, 'ROUTE');
    assert.equal(data.origin, 'Budgam');
    assert.equal(data.destination, 'Lal Chowk');
    assert.equal(data.status, 'DEMO / ESTIMATE');
    assert.equal(data.source_type, 'DEMO');
  });

  test('2. Reverse route: Lal Chowk to Budgam', async () => {
    const result = getRoute({
      origin: 'Lal Chowk',
      destination: 'Budgam'
    });

    assert.equal(result.success, true);
    assert.equal(result.origin, 'Lal Chowk');
    assert.equal(result.destination, 'Budgam');
    assert.equal(result.status, 'DEMO / ESTIMATE');
    assert.equal(result.source_type, 'DEMO');
  });

  test('3. Waypoint extraction: returns structured origin -> transit -> destination', async () => {
    const result = getRoute({
      origin: 'Srinagar',
      destination: 'Baramulla'
    });

    assert.equal(result.success, true);
    assert.ok(Array.isArray(result.waypoints), 'Waypoints should be an array');
    assert.equal(result.waypoints[0], 'Srinagar');
    assert.equal(result.waypoints[result.waypoints.length - 1], 'Baramulla');
    assert.ok(result.majorTransitPoint.includes('Parimpora'), 'Should identify Parimpora as major transit point');
    assert.ok(result.summaryPath.includes('Parimpora'), 'Summary path should include transit point');
  });

  test('4. Unknown route: returns clear unsupported message without guessing', async () => {
    const res = await fetch(`${BASE_URL}/api/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Gulmarg',
        destination: 'Pahalgam'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "I don't have a verified route for this journey yet.");
    assert.equal(data.source_type, 'DEMO');
  });

  test('5. Unknown origin: rejects safely without fabricating waypoints', async () => {
    const result = getRoute({
      origin: 'Atlantis',
      destination: 'Lal Chowk'
    });

    assert.equal(result.success, false);
    assert.equal(result.message, "I don't have a verified route for this journey yet.");
    assert.equal(result.source_type, 'DEMO');
  });

  test('6. Unknown destination: rejects safely without fabricating waypoints', async () => {
    const result = getRoute({
      origin: 'Budgam',
      destination: 'Neverland'
    });

    assert.equal(result.success, false);
    assert.equal(result.message, "I don't have a verified route for this journey yet.");
    assert.equal(result.source_type, 'DEMO');
  });

  test('7. Missing input: asks user for starting point and destination', async () => {
    const res = await fetch(`${BASE_URL}/api/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: 'Budgam' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Which route would you like to check?'));
    assert.ok(data.missingFields.includes('destination'));
  });

  test('8. DEMO provenance: verified that source_type is strictly DEMO', () => {
    const result = getRoute({
      origin: 'Jammu',
      destination: 'Katra'
    });

    assert.equal(result.success, true);
    assert.equal(result.source_type, 'DEMO');
    assert.equal(result.status, 'DEMO / ESTIMATE');
  });

  test('9. Route disclaimer: exact notice is present on route results', () => {
    const result = getRoute({
      origin: 'Sopore',
      destination: 'Lal Chowk'
    });

    assert.equal(result.success, true);
    assert.equal(
      result.disclaimer,
      'Demo route information — actual route and stops may vary.'
    );
    assert.ok(result.formattedText.includes('Notice:'));
    assert.ok(result.formattedText.includes('Demo route information — actual route and stops may vary.'));
  });

  test('10. Route query through /api/chat: resolves natural & Romanized questions with context', async () => {
    const sessionId = 'test-route-session';

    // Query 1: Natural English route question
    const res1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How can I travel from Budgam to Lal Chowk?',
        sessionId
      })
    });

    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.type, 'ROUTE');
    assert.ok(data1.routeData, 'Should return structured routeData');
    assert.equal(data1.routeData.origin, 'Budgam');
    assert.equal(data1.routeData.destination, 'Lal Chowk');
    assert.ok(data1.routeData.waypoints.length >= 3);

    // Query 2: Romanized route question
    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Budgam se Lal Chowk ka route kya hai?',
        sessionId: 'romanized-route-session'
      })
    });

    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'ROUTE');
    assert.equal(data2.routeData.origin, 'Budgam');
    assert.equal(data2.routeData.destination, 'Lal Chowk');

    // Query 3: Follow-up question using context ("What about from here to Srinagar?")
    const res3 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What about from here to Srinagar?',
        sessionId
      })
    });

    assert.equal(res3.status, 200);
    const data3 = await res3.json();
    assert.equal(data3.type, 'ROUTE');
    // From Lal Chowk (previous destination) to Srinagar (hub)
    assert.ok(data3.routeData !== undefined);
  });
});

describe('Safar AI MVP: Stage 4 Schedule System Tests', () => {
  let server;
  const TEST_PORT = 3196;
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. Known schedule API request via POST /api/schedule: Srinagar to Baramulla', async () => {
    const res = await fetch(`${BASE_URL}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Srinagar',
        destination: 'Baramulla'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.type, 'SCHEDULE');
    assert.equal(data.origin, 'Srinagar');
    assert.equal(data.destination, 'Baramulla');
    assert.equal(data.source_type, 'DEMO');
    assert.equal(data.status, 'DEMO / ESTIMATE');
  });

  test('2. Reverse direction: Baramulla to Srinagar', async () => {
    const result = getSchedule({
      origin: 'Baramulla',
      destination: 'Srinagar'
    });

    assert.equal(result.success, true);
    assert.equal(result.origin, 'Baramulla');
    assert.equal(result.destination, 'Srinagar');
    assert.equal(result.firstDeparture, '06:30 AM');
    assert.equal(result.source_type, 'DEMO');
  });

  test('3. First departure extraction: verified format and presence', () => {
    const result = getSchedule({
      origin: 'Srinagar',
      destination: 'Baramulla'
    });

    assert.equal(result.success, true);
    assert.equal(result.firstDeparture, '06:00 AM');
  });

  test('4. Frequency extraction: verified typical frequency string', () => {
    const result = getSchedule({
      origin: 'Srinagar',
      destination: 'Baramulla'
    });

    assert.equal(result.success, true);
    assert.equal(result.frequency, '30–45 minutes');
  });

  test('5. Last departure extraction: verified last listed departure', () => {
    const result = getSchedule({
      origin: 'Srinagar',
      destination: 'Baramulla'
    });

    assert.equal(result.success, true);
    assert.equal(result.lastDeparture, '07:00 PM');
  });

  test('6. Vehicle-specific schedule: supports matching vehicle mode', async () => {
    const res = await fetch(`${BASE_URL}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Srinagar',
        destination: 'Baramulla',
        vehicleType: 'Bus'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.vehicleType.includes('Bus'));
  });

  test('7. Incompatible vehicle mode rejection: clear advisory returned', async () => {
    const res = await fetch(`${BASE_URL}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Srinagar',
        destination: 'Baramulla',
        vehicleType: 'Auto Rickshaw'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "I don't have a listed schedule for that vehicle type on this route.");
  });

  test('8. Unsupported schedule: returns clear unsupported message without guessing', async () => {
    const res = await fetch(`${BASE_URL}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'Kupwara',
        destination: 'Kishtwar'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "I don't have verified schedule information for this route yet.");
    assert.equal(data.source_type, 'DEMO');
  });

  test('9. Unknown location: rejects safely without fabricating departures', () => {
    const result = getSchedule({
      origin: 'Atlantis',
      destination: 'Srinagar'
    });

    assert.equal(result.success, false);
    assert.equal(result.message, "I don't have verified schedule information for this route yet.");
    assert.equal(result.source_type, 'DEMO');
  });

  test('10. Missing input: asks user for starting point and destination', async () => {
    const res = await fetch(`${BASE_URL}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: 'Baramulla' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('Which route would you like to check?'));
    assert.ok(data.missingFields.includes('origin'));
  });

  test('11. DEMO provenance: verified source_type is DEMO and status is DEMO / ESTIMATE', () => {
    const result = getSchedule({
      origin: 'Jammu',
      destination: 'Katra'
    });

    assert.equal(result.success, true);
    assert.equal(result.source_type, 'DEMO');
    assert.equal(result.status, 'DEMO / ESTIMATE');
  });

  test('12. Mandatory disclaimer: exact required statement present on schedule result', () => {
    const result = getSchedule({
      origin: 'Budgam',
      destination: 'Lal Chowk'
    });

    assert.equal(result.success, true);
    assert.equal(
      result.disclaimer,
      'This is the listed schedule, not live vehicle information.'
    );
    assert.ok(result.formattedText.includes('Notice:'));
    assert.ok(result.formattedText.includes('This is the listed schedule, not live vehicle information.'));
  });

  test('13. Chat schedule query: resolves "When is the next listed bus from Srinagar to Baramulla?"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'When is the next listed bus from Srinagar to Baramulla?',
        sessionId: 'schedule-chat-session'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'SCHEDULE');
    assert.ok(data.scheduleData, 'Should return structured scheduleData');
    assert.equal(data.scheduleData.origin, 'Srinagar');
    assert.equal(data.scheduleData.destination, 'Baramulla');
    assert.equal(data.scheduleData.firstDeparture, '06:00 AM');
    assert.equal(data.scheduleData.lastDeparture, '07:00 PM');
    assert.ok(data.reply.includes('First listed departure'));
    assert.ok(data.reply.includes('This is the listed schedule, not live vehicle information.'));
  });

  test('14. "Last bus" follow-up query: "What about the last one?" reuses context', async () => {
    const sessionId = 'schedule-follow-up-session';

    // Turn 1
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'When is the bus from Srinagar to Baramulla?',
        sessionId
      })
    });

    // Turn 2
    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What about the last one?',
        sessionId
      })
    });

    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'SCHEDULE');
    assert.equal(data2.scheduleData.origin, 'Srinagar');
    assert.equal(data2.scheduleData.destination, 'Baramulla');
    assert.equal(data2.scheduleData.lastDeparture, '07:00 PM');
  });

  test('15. Live tracking rejection: safely rejects live tracking without inventing data', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Where is the bus right now?'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.reply, 'Live tracking is not available in the current version.');
  });
});

