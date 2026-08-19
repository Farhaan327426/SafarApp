/**
 * SAFAR — IndexedDB Offline Store Unit Test Suite
 * Tests local persistence of transit routes, SRO fare tables, vehicle telemetry snapshots,
 * and sync metadata using fake-indexeddb.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {
  saveRoutes,
  getRoutes,
  saveFares,
  getFaresByRoute,
  savePositions,
  getPositions,
  getMeta
} from '../frontend/js/offline-store.js';

test('▶ IndexedDB Offline Store Subsystem', async (t) => {

  await t.test('1. saveRoutes stores routes and updates lastRoutesSync timestamp', async () => {
    const mockRoutes = [
      { id: 'SRN-BUD-01', name: 'Srinagar - Budgam Corridor', distance: 14 },
      { id: 'SRN-HZB-02', name: 'Lal Chowk - Hazratbal', distance: 12 }
    ];

    await saveRoutes(mockRoutes);

    const retrieved = await getRoutes();
    assert.equal(retrieved.length, 2, 'Must retrieve exactly 2 routes');
    assert.equal(retrieved[0].name, 'Srinagar - Budgam Corridor');

    const lastSync = await getMeta('lastRoutesSync');
    assert.ok(typeof lastSync === 'number', 'lastRoutesSync must be a numerical timestamp');
    assert.ok(Date.now() - lastSync < 5000, 'Sync timestamp must be recent');
  });

  await t.test('2. getRoutes returns all cached routes accurately', async () => {
    const routes = await getRoutes();
    assert.ok(Array.isArray(routes));
    assert.ok(routes.some(r => r.id === 'SRN-BUD-01'));
  });

  await t.test('3. saveFares & getFaresByRoute store and retrieve SRO fare table', async () => {
    const routeId = 'SRN-BUD-01';
    const fareTable = {
      baseFare: 9.0,
      slabs: [{ minKm: 0, maxKm: 3, fare: 9 }, { minKm: 3, maxKm: 14, fare: 18 }]
    };

    await saveFares(routeId, 'SRO-2026-97', fareTable);

    const fares = await getFaresByRoute(routeId);
    assert.ok(fares.length >= 1, 'Must return cached fare records');
    assert.equal(fares[0].routeId, routeId);
    assert.equal(fares[0].fareVersion, 'SRO-2026-97');
    assert.equal(fares[0].fares.baseFare, 9.0);

    const lastFaresSync = await getMeta('lastFaresSync');
    assert.ok(typeof lastFaresSync === 'number');
  });

  await t.test('4. savePositions & getPositions cache last-known vehicle coordinates', async () => {
    const mockPositions = [
      { vehicleNo: 'JK01-A-101', lat: 34.0837, lng: 74.7973, speed: 28, routeId: 'SRN-BUD-01' },
      { vehicleNo: 'JK01-B-202', lat: 34.0725, lng: 74.8050, speed: 15, routeId: 'SRN-HZB-02' }
    ];

    await savePositions(mockPositions);

    const positions = await getPositions();
    assert.ok(positions.length >= 2, 'Must return cached positions');
    const v1 = positions.find(p => p.vehicleNo === 'JK01-A-101');
    assert.ok(v1, 'Vehicle JK01-A-101 must exist in offline store');
    assert.equal(v1.speed, 28);

    const lastPosSync = await getMeta('lastPositionsSync');
    assert.ok(typeof lastPosSync === 'number');
  });

  await t.test('5. getMeta returns null for non-existent keys', async () => {
    const nonExistent = await getMeta('non_existent_key_xyz');
    assert.equal(nonExistent, null, 'Unset meta key must return null');
  });

});
