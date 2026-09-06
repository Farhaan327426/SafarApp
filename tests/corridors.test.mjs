import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { corridors, getStageFare, searchCorridors } from '../src/data/corridors.js';

const canonicalCorridors = JSON.parse(readFileSync(new URL('../src/data/corridors.json', import.meta.url), 'utf-8'));

test('Corridors Schema & Data Integrity', async (t) => {
  await t.test('All 8 priority corridors are defined', () => {
    assert.strictEqual(canonicalCorridors.length, 8);
    const expectedIds = [
      'JK-SRI-01', 'JK-SRI-02', 'JK-SRI-03', 'JK-JAM-01',
      'JK-JAM-02', 'JK-KMR-01', 'JK-NKA-01', 'JK-NKA-02'
    ];
    const actualIds = canonicalCorridors.map(c => c.id);
    assert.deepStrictEqual(actualIds, expectedIds);
  });

  await t.test('Every corridor complies with TransitCorridor schema', () => {
    const validTiers = ['low', 'moderate', 'high'];
    for (const c of canonicalCorridors) {
      assert.ok(typeof c.id === 'string' && c.id.startsWith('JK-'), `Invalid corridor id ${c.id}`);
      assert.ok(typeof c.name === 'string' && c.name.length > 0, `Invalid name in ${c.id}`);
      assert.ok(Array.isArray(c.vehicleTypes) && c.vehicleTypes.length > 0, `No vehicleTypes in ${c.id}`);
      assert.ok(typeof c.frequencyText === 'string' && c.frequencyText.length > 0, `No frequencyText in ${c.id}`);
      assert.ok(typeof c.firstTrip === 'string' && c.firstTrip.includes(':'), `No firstTrip in ${c.id}`);
      assert.ok(typeof c.lastTrip === 'string' && c.lastTrip.includes(':'), `No lastTrip in ${c.id}`);
      assert.ok(validTiers.includes(c.occupancyTier), `Invalid occupancyTier in ${c.id}`);
      assert.ok(Array.isArray(c.stages) && c.stages.length >= 2, `Corridor ${c.id} must have at least 2 stages`);

      // Monotonic km check
      let lastKm = -1;
      let lastFare = -1;
      for (let i = 0; i < c.stages.length; i++) {
        const stage = c.stages[i];
        assert.ok(typeof stage.stopId === 'string' && stage.stopId.length > 0);
        assert.ok(typeof stage.stopName === 'string' && stage.stopName.length > 0);
        assert.ok(typeof stage.kmFromSource === 'number');
        assert.ok(typeof stage.statutoryFare === 'number');

        if (i === 0) {
          assert.strictEqual(stage.kmFromSource, 0, `First stage of ${c.id} must be km 0`);
          assert.strictEqual(stage.statutoryFare, 0, `First stage of ${c.id} must be fare 0`);
        } else {
          assert.ok(stage.kmFromSource > lastKm, `Stage ${stage.stopName} in ${c.id} must have km > previous`);
          assert.ok(stage.statutoryFare >= lastFare, `Stage ${stage.stopName} in ${c.id} fare must be >= previous`);
        }
        lastKm = stage.kmFromSource;
        lastFare = stage.statutoryFare;
      }
    }
  });

  await t.test('Parity: frontend/js/corridors-data.js matches canonical JSON exactly', () => {
    const script = readFileSync('./frontend/js/corridors-data.js', 'utf-8');
    const globalProxy = {};
    new Function('window', script)(globalProxy);
    const { JK_CORRIDORS } = globalProxy;

    assert.ok(Array.isArray(JK_CORRIDORS), 'JK_CORRIDORS must be an array');
    assert.deepStrictEqual(JK_CORRIDORS, canonicalCorridors, 'corridors-data.js has diverged from canonical JSON');
  });

  await t.test('getStageFare contract and bidirectional travel semantics', () => {
    // Forward travel
    const s1ToS3 = getStageFare('JK-SRI-01', 's1', 's3');
    assert.strictEqual(s1ToS3, 20);

    const s2ToS3 = getStageFare('JK-SRI-01', 's2', 's3');
    assert.strictEqual(s2ToS3, 10);

    // Bidirectional/reverse intermediate boarding
    const s3ToS2 = getStageFare('JK-SRI-01', 's3', 's2');
    assert.strictEqual(s3ToS2, 10);

    // Single stop cumulative lookup
    assert.strictEqual(getStageFare('JK-SRI-01', 's2'), 10);

    // Non-existent stops or corridors return null
    assert.strictEqual(getStageFare('JK-INVALID', 's1', 's2'), null);
    assert.strictEqual(getStageFare('JK-SRI-01', 's999', 's2'), null);
  });

  await t.test('searchCorridors filters accurately', () => {
    const hazratbalSearch = searchCorridors('Hazratbal');
    assert.ok(hazratbalSearch.length >= 1);
    assert.strictEqual(hazratbalSearch[0].id, 'JK-SRI-01');

    const katraSearch = searchCorridors('Katra');
    assert.ok(katraSearch.some(c => c.id === 'JK-JAM-01'));
  });

  await t.test('Multi-vehicle terminal fare within statutory rate boundaries', () => {
    for (const c of canonicalCorridors) {
      const terminalStage = c.stages[c.stages.length - 1];
      const km = terminalStage.kmFromSource;
      const fare = terminalStage.statutoryFare;

      assert.ok(fare > 0, `Terminal fare on ${c.id} must be > 0`);
      const effectiveRate = fare / km;
      assert.ok(
        effectiveRate >= 1.0 && effectiveRate <= 3.5,
        `Terminal fare on ${c.id} (₹${fare} for ${km} km -> ₹${effectiveRate.toFixed(2)}/km) must be within statutory bounds for declared vehicles: ${c.vehicleTypes.join(', ')}`
      );
    }
  });

  await t.test('QR payload locked key ordering and serialization', () => {
    const payload = {
      sro: 'SRO-97',
      ts: 1757157600000,
      seat: 20,
      fare: 40,
      pax: 2,
      veh: 'Matador',
      d: 'Hazratbal',
      o: 'Lal Chowk',
      v: 1
    };
    const replacer = ['v', 'o', 'd', 'veh', 'pax', 'fare', 'seat', 'ts', 'sro'];
    const jsonString = JSON.stringify(payload, replacer);
    const parsedKeys = Object.keys(JSON.parse(jsonString));
    assert.deepStrictEqual(parsedKeys, replacer);

    const base64 = Buffer.from(jsonString).toString('base64');
    assert.ok(base64.length > 0);
  });
});
