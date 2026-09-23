/**
 * SAFAR — Tariff Synchronization Service
 * External Store with synchronous Promise deduplication, offline cache fallback,
 * injectable unref timers, and lifecycle disposal.
 */

import { validateTariffSchedule } from './tariffValidator.js';

const STORAGE_KEY = 'safar_tariff_schedule_v1';
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const RETRY_DELAY_MS = 5 * 1000; // 5 seconds

/**
 * Creates an isolated TariffSyncService instance.
 *
 * @param {object} [options]
 * @param {Storage} [options.storage] - Web Storage API compatible object.
 * @param {string} [options.endpoint] - Tariff fetch endpoint.
 * @param {{ setTimeout: typeof setTimeout, clearTimeout: typeof clearTimeout }} [options.scheduler] - Timer scheduler.
 */
export function createTariffSyncService(options = {}) {
  const storage = options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  const endpoint = options.endpoint ?? '/data/tariffs.json';
  const scheduler = options.scheduler ?? { setTimeout, clearTimeout };

  /** @type {Set<() => void>} */
  const listeners = new Set();

  /** @type {Promise<import('../types/transit').SyncState> | null} */
  let currentSyncPromise = null;

  /** @type {any} */
  let retryTimer = null;

  /** @type {import('../types/transit').SyncState} */
  let state = {
    networkCondition: typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'ONLINE',
    dataFreshness: 'NO_DATA',
    lastSyncedAt: null,
    activeScheduleId: null,
    tariffs: null,
    error: null
  };

  // Attempt initial load from cache
  if (storage) {
    try {
      const cached = storage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const validation = validateTariffSchedule(parsed);
        if (validation.isValid) {
          state = {
            ...state,
            dataFreshness: 'CACHE_FRESH',
            activeScheduleId: parsed.activeScheduleId,
            tariffs: parsed.tariffs,
            lastSyncedAt: parsed.storedAt ?? null
          };
        }
      }
    } catch {
      // Ignore initial cache read error
    }
  }

  function emitChange() {
    for (const listener of listeners) {
      listener();
    }
  }

  function scheduleRetry() {
    if (retryTimer != null) return;
    retryTimer = scheduler.setTimeout(() => {
      retryTimer = null;
      sync(true).catch(() => {});
    }, RETRY_DELAY_MS);

    if (typeof retryTimer?.unref === 'function') {
      retryTimer.unref();
    }
  }

  /**
   * Internal async execution of the sync operation.
   * @param {boolean} force
   * @returns {Promise<import('../types/transit').SyncState>}
   */
  async function executeSync(force) {
    const isOnline = typeof navigator === 'undefined' || navigator.onLine;

    if (!isOnline) {
      state = {
        ...state,
        networkCondition: 'OFFLINE',
        dataFreshness: state.tariffs ? 'CACHE_FRESH' : 'NO_DATA',
        error: 'Network offline'
      };
      emitChange();
      return state;
    }

    try {
      const res = await fetch(endpoint, {
        cache: force ? 'reload' : 'default',
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const payload = await res.json();
      const validation = validateTariffSchedule(payload);

      if (!validation.isValid) {
        throw new Error(`Invalid tariff schema: ${validation.errors.join('; ')}`);
      }

      const now = Date.now();
      if (storage) {
        try {
          storage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...payload, storedAt: now })
          );
        } catch {
          // Storage quota full or disabled
        }
      }

      state = {
        networkCondition: 'ONLINE',
        dataFreshness: 'CACHE_FRESH',
        lastSyncedAt: now,
        activeScheduleId: payload.activeScheduleId,
        tariffs: payload.tariffs,
        error: null
      };

      emitChange();
      return state;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      state = {
        ...state,
        networkCondition: isOffline ? 'OFFLINE' : 'UNREACHABLE',
        dataFreshness: state.tariffs ? 'CACHE_FRESH' : 'NO_DATA',
        error: errorMessage
      };

      emitChange();
      scheduleRetry();
      return state;
    }
  }

  /**
   * Public sync method. MUST NOT be async to preserve identical Promise reference!
   * @param {boolean} [force=false]
   * @returns {Promise<import('../types/transit').SyncState>}
   */
  function sync(force = false) {
    if (currentSyncPromise) {
      return currentSyncPromise;
    }

    currentSyncPromise = executeSync(force).finally(() => {
      currentSyncPromise = null;
    });

    return currentSyncPromise;
  }

  return {
    sync,
    getSnapshot() {
      return state;
    },
    /** @param {() => void} listener */
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      if (retryTimer != null) {
        scheduler.clearTimeout(retryTimer);
        retryTimer = null;
      }
      listeners.clear();
      currentSyncPromise = null;
    },
    // Exposed for testing
    _scheduleRetry: scheduleRetry
  };
}

export const tariffSyncService = createTariffSyncService();
