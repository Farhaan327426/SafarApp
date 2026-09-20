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
import { draftComplaint, classifyComplaintIssue } from '../backend/complaints/complaintService.js';

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

describe('Safar AI MVP: Stage 5 Complaint Assistant Tests', () => {
  let server;
  const TEST_PORT = 3195;
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

  test('1. Basic complaint draft via POST /api/complaint: full parameters', async () => {
    const res = await fetch(`${BASE_URL}/api/complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2025-01-15',
        location: 'Lal Chowk',
        route: 'Baramulla → Srinagar',
        vehicleType: 'Minibus',
        issue: 'OVERCHARGE',
        amountCharged: 50,
        expectedFare: 30,
        description: 'Driver charged me more than expected.'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.type, 'COMPLAINT_DRAFT');
    assert.equal(data.issue, 'OVERCHARGE');
    assert.equal(data.fields.route, 'Baramulla → Srinagar');
    assert.equal(data.fields.amountCharged, '₹50');
    assert.equal(data.fields.expectedFare, '₹30');
    assert.equal(data.status, 'DRAFT — NOT SUBMITTED');
  });

  test('2. Overcharge classification: normalizes variations to OVERCHARGE', () => {
    assert.equal(classifyComplaintIssue('The driver overcharged me.'), 'OVERCHARGE');
    assert.equal(classifyComplaintIssue('Driver ne zyada paisay liye.'), 'OVERCHARGE');
    assert.equal(classifyComplaintIssue('ڈرائیور نے زیادہ پیسے لیے۔'), 'OVERCHARGE');
    assert.equal(classifyComplaintIssue('ज्यादा किराया लिया'), 'OVERCHARGE');
  });

  test('3. Refused service classification: normalizes refusal to REFUSED_SERVICE', () => {
    assert.equal(classifyComplaintIssue('The driver refused to take me.'), 'REFUSED_SERVICE');
    assert.equal(classifyComplaintIssue('driver refused me'), 'REFUSED_SERVICE');
    assert.equal(classifyComplaintIssue('nahi bithaya'), 'REFUSED_SERVICE');
  });

  test('4. Overloading classification: normalizes overcrowding to OVERLOADING', () => {
    assert.equal(classifyComplaintIssue('The bus was overcrowded.'), 'OVERLOADING');
    assert.equal(classifyComplaintIssue('bus bohat crowded thi'), 'OVERLOADING');
    assert.equal(classifyComplaintIssue('overloading vehicle'), 'OVERLOADING');
  });

  test('5. Rude behavior classification: normalizes misbehavior to RUDE_BEHAVIOR', () => {
    assert.equal(classifyComplaintIssue('The driver behaved badly.'), 'RUDE_BEHAVIOR');
    assert.equal(classifyComplaintIssue('driver abused me'), 'RUDE_BEHAVIOR');
    assert.equal(classifyComplaintIssue('badtamiz conductor'), 'RUDE_BEHAVIOR');
  });

  test('6. Dangerous driving classification: normalizes reckless driving to DANGEROUS_DRIVING', () => {
    assert.equal(classifyComplaintIssue('The driver was driving dangerously.'), 'DANGEROUS_DRIVING');
    assert.equal(classifyComplaintIssue('rash driving on highway'), 'DANGEROUS_DRIVING');
    assert.equal(classifyComplaintIssue('khatarnak driving'), 'DANGEROUS_DRIVING');
  });

  test('7. OTHER classification: handles uncertain or general issues as OTHER', () => {
    assert.equal(classifyComplaintIssue('AC was not working properly'), 'OTHER');
    assert.equal(classifyComplaintIssue('Seat was torn'), 'OTHER');
  });

  test('8. Partial complaint: handles missing fields without errors', async () => {
    const res = await fetch(`${BASE_URL}/api/complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue: 'OVERLOADING'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.issue, 'OVERLOADING');
    assert.equal(data.status, 'DRAFT — NOT SUBMITTED');
  });

  test('9. Missing fields marked as "Not specified"', async () => {
    const res = await fetch(`${BASE_URL}/api/complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue: 'REFUSED_SERVICE'
      })
    });

    const data = await res.json();
    assert.equal(data.fields.route, 'Not specified');
    assert.equal(data.fields.location, 'Not specified');
    assert.equal(data.fields.vehicleType, 'Not specified');
    assert.equal(data.fields.amountCharged, 'Not specified');
    assert.equal(data.fields.expectedFare, 'Not specified');
    assert.equal(data.fields.description, 'Not specified');
  });

  test('10. Draft disclaimer: exact mandatory static draft disclaimer present', async () => {
    const res = await fetch(`${BASE_URL}/api/complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue: 'OVERCHARGE'
      })
    });

    const data = await res.json();
    assert.equal(
      data.disclaimer,
      'This is a draft complaint summary. It has not been automatically filed with any authority.'
    );
    assert.ok(
      data.complaintText.includes('This is a draft complaint summary. It has not been automatically filed with any authority.')
    );
  });

  test('11. Data Safety: Never generates tracking numbers or case IDs', async () => {
    const res = await fetch(`${BASE_URL}/api/complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue: 'OVERCHARGE',
        amountCharged: 50
      })
    });

    const data = await res.json();
    assert.equal(data.trackingId, undefined);
    assert.equal(data.complaintId, undefined);
    assert.equal(data.registrationNumber, undefined);
    assert.equal(data.caseNumber, undefined);
    assert.ok(!data.complaintText.includes('Tracking ID'));
    assert.ok(!data.complaintText.includes('Registration ID'));
  });

  test('12. Chat complaint query: "The driver overcharged me." generates draft card', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'The driver overcharged me.'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'COMPLAINT');
    assert.ok(data.complaintData);
    assert.equal(data.complaintData.issue, 'OVERCHARGE');
    assert.equal(data.complaintData.status, 'DRAFT — NOT SUBMITTED');
  });

  test('13. Complaint text integrity: ready-to-copy plain text format', () => {
    const draft = draftComplaint({
      route: 'Srinagar → Baramulla',
      vehicleType: 'Minibus',
      issue: 'OVERCHARGE',
      amountCharged: 60,
      expectedFare: 40,
      description: 'Conductor took 60 rs instead of 40 rs'
    });

    assert.ok(draft.complaintText.includes('Subject: Transport Service Complaint'));
    assert.ok(draft.complaintText.includes('Route: Srinagar → Baramulla'));
    assert.ok(draft.complaintText.includes('Vehicle Type: Minibus'));
    assert.ok(draft.complaintText.includes('Amount Charged: ₹60'));
    assert.ok(draft.complaintText.includes('Expected Fare: ₹40'));
    assert.ok(draft.complaintText.includes('Conductor took 60 rs instead of 40 rs'));
    assert.ok(draft.complaintText.includes(draft.disclaimer));
  });

  test('14. Follow-up using existing route context: reuses session route memory', async () => {
    const sessionId = `session-complaint-test-${Date.now()}`;

    // Step 1: User asks for fare on a route
    const res1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Fare from Baramulla to Srinagar',
        sessionId
      })
    });
    assert.equal(res1.status, 200);

    // Step 2: User complains without repeating the route
    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'The driver charged me too much.',
        sessionId
      })
    });

    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'COMPLAINT');
    assert.ok(data2.complaintData);
    assert.equal(data2.complaintData.fields.route, 'Baramulla → Srinagar');
    assert.equal(data2.complaintData.issue, 'OVERCHARGE');
  });
});

describe('Safar AI MVP: Stage 6 Full AI Orchestration Tests', () => {
  let server;
  const TEST_PORT = 3194;
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

  test('1. Fare intent: resolves fare queries with structured fare card data', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.ok(data.fareData);
    assert.equal(data.fareData.origin, 'Baramulla');
    assert.equal(data.fareData.destination, 'Srinagar');
  });

  test('2. Route intent: resolves route queries with structured route card data', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How can I travel from Budgam to Lal Chowk?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'ROUTE');
    assert.ok(data.routeData);
    assert.equal(data.routeData.origin, 'Budgam');
    assert.equal(data.routeData.destination, 'Lal Chowk');
  });

  test('3. Schedule intent: resolves schedule queries with structured schedule card data', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'When is the next listed bus from Srinagar to Baramulla?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'SCHEDULE');
    assert.ok(data.scheduleData);
    assert.equal(data.scheduleData.origin, 'Srinagar');
    assert.equal(data.scheduleData.destination, 'Baramulla');
  });

  test('4. Complaint intent: resolves passenger grievances with draft complaint data', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'The driver overcharged me on the bus.' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'COMPLAINT');
    assert.ok(data.complaintData);
    assert.equal(data.complaintData.issue, 'OVERCHARGE');
    assert.equal(data.complaintData.status, 'DRAFT — NOT SUBMITTED');
  });

  test('5. General intent: responds to standard greetings', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'GENERAL');
    assert.equal(data.reply, "Hello! I'm Safar AI. I can help with fares, routes, listed schedules, and transport complaints.");
  });

  test('6. Fare via Romanized query: "Baramulla se Srinagar ka kiraya kitna hai?"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Baramulla se Srinagar ka kiraya kitna hai?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.ok(data.fareData);
  });

  test('7. Route via Romanized query: "Budgam se Lal Chowk ka route kya hai?"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Budgam se Lal Chowk ka route kya hai?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'ROUTE');
    assert.ok(data.routeData);
  });

  test('8. Schedule via Romanized query: "Srinagar se Baramulla bus kab hai?"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Srinagar se Baramulla bus kab hai?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'SCHEDULE');
    assert.ok(data.scheduleData);
  });

  test('9. Complaint via Romanized query: "Driver ne zyada paisay liye."', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Driver ne zyada paisay liye.' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'COMPLAINT');
    assert.equal(data.complaintData.issue, 'OVERCHARGE');
  });

  test('10. Urdu fare query: "سرینگر سے بارہمولہ کا کرایہ؟"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'سرینگر سے بارہمولہ کا کرایہ؟' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.ok(data.fareData);
  });

  test('11. Ambiguous query handling: prompts user for clarification without guessing', async () => {
    const res1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How much?' })
    });
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.type, 'FARE_PROMPT');
    assert.equal(data1.reply, 'Which route would you like to check? Please provide the starting point and destination.');

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bus?' })
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'AMBIGUOUS_PROMPT');
    assert.equal(data2.reply, 'Would you like to check a fare, route, or listed schedule?');
  });

  test('12. Follow-up fare query: reuses previous origin and destination with new vehicle mode', async () => {
    const sessionId = `stage6-fare-followup-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What about shared taxi?', sessionId })
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'FARE');
    assert.ok(data2.fareData);
    assert.ok(data2.fareData.vehicleType.includes('Shared Taxi'));
    assert.equal(data2.fareData.origin, 'Baramulla');
    assert.equal(data2.fareData.destination, 'Srinagar');
  });

  test('13. Follow-up schedule query: reuses route context for "What about the last one?"', async () => {
    const sessionId = `stage6-sched-followup-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the schedule from Srinagar to Baramulla?', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What about the last one?', sessionId })
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'SCHEDULE');
    assert.equal(data2.scheduleData.origin, 'Srinagar');
    assert.equal(data2.scheduleData.destination, 'Baramulla');
    assert.equal(data2.scheduleData.lastDeparture, '07:00 PM');
  });

  test('14. Follow-up route query: "What about from here to Sopore?"', async () => {
    const sessionId = `stage6-route-followup-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How do I travel from Budgam to Lal Chowk?', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What about from here to Sopore?', sessionId })
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'ROUTE');
    assert.ok(data2.routeData);
  });

  test('15. Complaint after route context: reuses established corridor', async () => {
    const sessionId = `stage6-complaint-followup-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'The driver charged me too much.', sessionId })
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'COMPLAINT');
    assert.equal(data2.complaintData.fields.route, 'Baramulla → Srinagar');
  });

  test('16. Explicit new route overriding old context: new endpoints override session memory', async () => {
    const sessionId = `stage6-override-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Jammu to Katra', sessionId })
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'FARE');
    assert.equal(data2.fareData.origin, 'Jammu');
    assert.equal(data2.fareData.destination, 'Katra');
  });

  test('17. Unsupported route with previous context: does not fall back to old cached route', async () => {
    const sessionId = `stage6-unsupported-override-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bus schedule from Kupwara to Kishtwar', sessionId })
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.type, 'SCHEDULE');
    assert.equal(data2.reply, "I don't have verified schedule information for this route yet.");
    assert.equal(data2.scheduleData, null);
  });

  test('18. Live tracking rejection: safely returns standard notice', async () => {
    const res1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Where is the bus right now?' })
    });
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.equal(data1.reply, 'Live tracking is not available in the current version.');

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Track the bus' })
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.reply, 'Live tracking is not available in the current version.');
  });

  test('19. Multi-intent query: returns combined fare and schedule response', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the fare from Jammu to Katra and when is the listed bus?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'MULTI_INTENT');
    assert.ok(data.fareData);
    assert.ok(data.scheduleData);
    assert.equal(data.fareData.origin, 'Jammu');
    assert.equal(data.fareData.destination, 'Katra');
    assert.equal(data.scheduleData.origin, 'Jammu');
    assert.equal(data.scheduleData.destination, 'Katra');
  });

  test('20. General capability question: responds with accurate non-live capabilities', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What can Safar AI do?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'GENERAL');
    assert.equal(data.reply, 'I can help you check demo fare estimates, listed schedules, available demo routes, and prepare transport complaint drafts.');
  });

  test('21. Complaint with transport keywords: correctly classified as COMPLAINT, not FARE or SCHEDULE', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'I was charged more than the listed fare on the bus route.' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'COMPLAINT');
    assert.equal(data.complaintData.issue, 'OVERCHARGE');
  });
});

describe('Safar AI MVP: Stage 7 Final Hardening & Release Readiness Tests', () => {
  let server;
  const TEST_PORT = 3203;
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

  test('1. No vehicle specified in fare query: explicit default mode (Minibus) applied', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.ok(data.fareData);
    assert.equal(data.fareData.isDefaultVehicle, true);
    assert.equal(data.fareData.vehicleType, 'Minibus');
    assert.ok(data.fareData.defaultVehicleNotice.includes('Minibus'));
    assert.ok(data.reply.includes('Default vehicle: Minibus'));
  });

  test('2. Explicit vehicle specified in fare query: isDefaultVehicle is false', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar in shared taxi' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.ok(data.fareData);
    assert.equal(data.fareData.isDefaultVehicle, false);
    assert.ok(data.fareData.vehicleType.includes('Shared Taxi'));
  });

  test('3. English fare query: resolves with demo estimate', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the fare from Srinagar to Baramulla?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.equal(data.fareData.origin, 'Srinagar');
    assert.equal(data.fareData.destination, 'Baramulla');
  });

  test('4. Hindi fare query: "श्रीनगर से बारामूला का किराया कितना है?"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'श्रीनगर से बारामूला का किराया कितना है?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.equal(data.fareData.origin, 'Srinagar');
    assert.equal(data.fareData.destination, 'Baramulla');
  });

  test('5. Urdu fare query: "سرینگر سے بارہمولہ کا کرایہ کتنا ہے؟"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'سرینگر سے بارہمولہ کا کرایہ کتنا ہے؟' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.equal(data.fareData.origin, 'Srinagar');
    assert.equal(data.fareData.destination, 'Baramulla');
  });

  test('6. Romanized fare query with aliases: "srngr se bmla ka kiraya?"', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'srngr se bmla ka kiraya?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.equal(data.fareData.origin, 'Srinagar');
    assert.equal(data.fareData.destination, 'Baramulla');
  });

  test('7. Ambiguous query: prompts user for clarification without guessing', async () => {
    const res1 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How much?' })
    });
    const data1 = await res1.json();
    assert.equal(data1.type, 'FARE_PROMPT');
    assert.ok(data1.reply.includes('Which route would you like to check'));

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bus?' })
    });
    const data2 = await res2.json();
    assert.equal(data2.type, 'AMBIGUOUS_PROMPT');
    assert.ok(data2.reply.includes('Would you like to check a fare, route, or listed schedule'));

    const res3 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'From Srinagar?' })
    });
    const data3 = await res3.json();
    assert.equal(data3.type, 'ROUTE_PROMPT');
    assert.ok(data3.reply.includes('Where would you like to go from Srinagar'));
  });

  test('8. Unsupported route: returns clear non-invented message', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Kupwara to Kishtwar' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.equal(data.reply, "I don't have verified information for this route yet.");
  });

  test('9. Unsupported schedule: returns clear non-invented message', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Schedule from Kupwara to Kishtwar' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'SCHEDULE');
    assert.equal(data.reply, "I don't have verified schedule information for this route yet.");
  });

  test('10. Live tracking rejection: explicitly states unavailable', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Where is the bus right now?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'GENERAL');
    assert.equal(data.reply, 'Live tracking is not available in the current version.');
  });

  test('11. Complaint disclaimer: exact static draft disclaimer present', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'The driver overcharged me' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'COMPLAINT');
    assert.equal(data.disclaimer, 'This is a draft complaint summary. It has not been automatically filed with any authority.');
    assert.equal(data.complaintData.status, 'DRAFT — NOT SUBMITTED');
  });

  test('12. Demo-data disclaimer: DEMO / ESTIMATE and disclaimer present', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Srinagar to Baramulla' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.fareData.status, 'DEMO / ESTIMATE');
    assert.equal(data.fareData.source_type, 'DEMO');
    assert.equal(data.disclaimer, 'Demo / Estimated data — actual fare may vary by operator.');
  });

  test('13. Multi-intent fare + schedule: returns both cleanly', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the fare from Srinagar to Baramulla and when is the bus?' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'MULTI_INTENT');
    assert.ok(data.fareData);
    assert.ok(data.scheduleData);
    assert.equal(data.fareData.origin, 'Srinagar');
    assert.equal(data.scheduleData.origin, 'Srinagar');
  });

  test('14. Follow-up fare: reuses context', async () => {
    const sessionId = `stage7-fare-fup-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What about shared taxi?', sessionId })
    });
    const data2 = await res2.json();
    assert.equal(data2.type, 'FARE');
    assert.equal(data2.fareData.origin, 'Baramulla');
    assert.equal(data2.fareData.destination, 'Srinagar');
    assert.ok(data2.fareData.vehicleType.includes('Shared Taxi'));
  });

  test('15. Follow-up schedule: reuses context', async () => {
    const sessionId = `stage7-sched-fup-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Schedule from Srinagar to Baramulla', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What about the last one?', sessionId })
    });
    const data2 = await res2.json();
    assert.equal(data2.type, 'SCHEDULE');
    assert.equal(data2.scheduleData.origin, 'Srinagar');
    assert.equal(data2.scheduleData.lastDeparture, '07:00 PM');
  });

  test('16. Explicit new route overriding old context: new endpoints override session', async () => {
    const sessionId = `stage7-override-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Jammu to Katra', sessionId })
    });
    const data2 = await res2.json();
    assert.equal(data2.type, 'FARE');
    assert.equal(data2.fareData.origin, 'Jammu');
    assert.equal(data2.fareData.destination, 'Katra');
  });

  test('17. Complaint after previous route context: grievance reuses corridor', async () => {
    const sessionId = `stage7-complaint-fup-${Date.now()}`;
    await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar', sessionId })
    });

    const res2 = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'The driver overcharged me', sessionId })
    });
    const data2 = await res2.json();
    assert.equal(data2.type, 'COMPLAINT');
    assert.equal(data2.complaintData.fields.route, 'Baramulla → Srinagar');
  });

  test('18. Malformed API request: returns 400 with valid JSON error', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this-is-not-valid-json'
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error.includes('JSON'));
  });

  test('19. Unknown vehicle type: query with unsupported vehicle returns clear advisory', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Fare from Baramulla to Srinagar in submarine' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.type, 'FARE');
    assert.ok(data.fareData);
    assert.equal(data.fareData.isDefaultVehicle, true);
  });

  test('20. Mobile-safe frontend markup/layout checks: viewport and responsive design verified', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0">'));
    assert.ok(html.includes('STAGE 7 MVP'));

    const cssRes = await fetch(`${BASE_URL}/css/safar-mvp.css`);
    assert.equal(cssRes.status, 200);
    const css = await cssRes.text();
    assert.ok(css.includes('@media (max-width: 600px)'));
    assert.ok(css.includes('.fare-card-default-mode'));
  });
});

