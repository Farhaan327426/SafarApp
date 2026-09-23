/**
 * SAFAR — TariffSyncService Integration & Lifecycle Tests
 * Validates synchronous Promise deduplication, offline fallback, and clean timer disposal.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createTariffSyncService } from '../src/services/tariffSyncService.js';

function createMockStorage(initialData = {}) {
  const store = new Map(Object.entries(initialData));
  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

test('TariffSyncService — Contract & Lifecycle Verification', async (t) => {
  await t.test('Promise deduplication: concurrent sync() calls return the identical Promise reference', () => {
    const mockStorage = createMockStorage();
    let fetchCount = 0;

    // Mock global fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => {
      fetchCount++;
      return new Promise((resolve) => setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({})
        });
      }, 50));
    };

    const service = createTariffSyncService({
      storage: mockStorage,
      endpoint: '/test-tariffs.json'
    });

    try {
      const p1 = service.sync();
      const p2 = service.sync();

      // P0 requirement: synchronous return of exact same Promise instance
      assert.equal(p1, p2, 'Concurrent sync() invocations must return the exact same Promise instance');
    } finally {
      service.dispose();
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('Clean lifecycle: dispose() halts retry timers and clears subscriptions', () => {
    let timerCleared = false;
    const fakeScheduler = {
      setTimeout: (fn, ms) => {
        const id = setTimeout(fn, ms);
        return id;
      },
      clearTimeout: (id) => {
        timerCleared = true;
        clearTimeout(id);
      }
    };

    const service = createTariffSyncService({
      storage: createMockStorage(),
      scheduler: fakeScheduler
    });

    service._scheduleRetry();
    service.dispose();

    assert.equal(timerCleared, true, 'dispose() must clear pending retry timers');
  });

  await t.test('Cache fallback: loads valid schedule from storage on startup', async () => {
    const { readFileSync } = await import('node:fs');
    const canonicalTariffs = JSON.parse(
      readFileSync(new URL('../public/data/tariffs.json', import.meta.url), 'utf-8')
    );

    const mockStorage = createMockStorage({
      'safar_tariff_schedule_v1': JSON.stringify(canonicalTariffs)
    });

    const service = createTariffSyncService({ storage: mockStorage });
    const snapshot = service.getSnapshot();

    assert.equal(snapshot.dataFreshness, 'CACHE_FRESH');
    assert.equal(snapshot.activeScheduleId, 'SO-126-2026');
    assert.notEqual(snapshot.tariffs, null);
    service.dispose();
  });
});
