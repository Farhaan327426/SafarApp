/**
 * SAFAR AI MVP — Automated Test Suite (Stage 1 Foundation)
 * Run using Node.js built-in test runner: `node --test tests/safar-mvp.test.js`
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, loadDatabase, database } from '../backend/index.js';
import { getSession } from '../backend/ai/conversationService.js';

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

  test('5. Backend API: GET /api/health responds with Stage 1 status and DEMO data safety notice', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.stage, 1);
    assert.equal(data.dataSafety.mode, 'DEMO');
    assert.equal(data.database.locationsCount, 12);
  });

  test('6. Backend API: POST /api/chat returns Stage 1 foundation response', async () => {
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
