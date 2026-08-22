/**
 * SAFAR — Storage Management Module
 * IndexedDB for structured offline data, quota management, persistence
 */

const SAFAR_DB_NAME = 'safar_db';
const SAFAR_DB_VERSION = 1;
let _db = null;

// ─── IndexedDB Setup ──────────────────────────────────────────────────────────

/**
 * Open/create the SAFAR IndexedDB.
 * Stores: routes, fares, trip_history, offline_queue, user_prefs
 * @returns {Promise<IDBDatabase>}
 */
async function initDatabase() {
  if (_db) return _db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SAFAR_DB_NAME, SAFAR_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Routes store — cached J&K route data for offline use
      if (!db.objectStoreNames.contains('routes')) {
        const routeStore = db.createObjectStore('routes', { keyPath: 'id' });
        routeStore.createIndex('region', 'region', { unique: false });
        routeStore.createIndex('terrain', 'terrain', { unique: false });
      }

      // Fare slabs store — Transport Department fare version cache
      if (!db.objectStoreNames.contains('fares')) {
        const fareStore = db.createObjectStore('fares', { keyPath: 'version' });
        fareStore.createIndex('region', 'region', { unique: false });
      }

      // Trip history store — past bookings and audit trail
      if (!db.objectStoreNames.contains('trip_history')) {
        const tripStore = db.createObjectStore('trip_history', { keyPath: 'trip_id' });
        tripStore.createIndex('created_at', 'created_at', { unique: false });
        tripStore.createIndex('route_id', 'route_id', { unique: false });
      }

      // Offline action queue — for background sync
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
      }

      // User preferences
      if (!db.objectStoreNames.contains('user_prefs')) {
        db.createObjectStore('user_prefs', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      _db = event.target.result;
      resolve(_db);
    };

    request.onerror = (event) => {
      console.error('[Storage] IndexedDB open failed:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ─── Generic CRUD ─────────────────────────────────────────────────────────────

/**
 * Put a record into a store (insert or update).
 * @param {string} storeName
 * @param {object} data
 * @returns {Promise<void>}
 */
async function putRecord(storeName, data) {
  try {
    const db = await initDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(data);
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error(`[Storage] putRecord(${storeName}) failed:`, err);
  }
}

/**
 * Get a record by key from a store.
 * @param {string} storeName
 * @param {*} key
 * @returns {Promise<object|undefined>}
 */
async function getRecord(storeName, key) {
  try {
    const db = await initDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`[Storage] getRecord(${storeName}, ${key}) failed:`, err);
    return undefined;
  }
}

/**
 * Get all records from a store.
 * @param {string} storeName
 * @returns {Promise<Array>}
 */
async function getAllRecords(storeName) {
  try {
    const db = await initDatabase();
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`[Storage] getAllRecords(${storeName}) failed:`, err);
    return [];
  }
}

/**
 * Delete a record by key.
 * @param {string} storeName
 * @param {*} key
 * @returns {Promise<void>}
 */
async function deleteRecord(storeName, key) {
  try {
    const db = await initDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error(`[Storage] deleteRecord(${storeName}, ${key}) failed:`, err);
  }
}

/**
 * Clear all records in a store.
 * @param {string} storeName
 * @returns {Promise<void>}
 */
async function clearStore(storeName) {
  try {
    const db = await initDatabase();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error(`[Storage] clearStore(${storeName}) failed:`, err);
  }
}

// ─── Storage Quota Management ─────────────────────────────────────────────────

/**
 * Check storage usage vs quota. Purge old data if usage > 80%.
 * @returns {Promise<{usage: number, quota: number, percentUsed: number}>}
 */
async function checkStorageQuota() {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    console.error('[Storage] StorageManager API not supported');
    return { usage: 0, quota: 0, percentUsed: 0 };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;

    console.log(`[Storage] Usage: ${_formatBytes(usage)} / ${_formatBytes(quota)} (${percentUsed}%)`);

    // Auto-purge if > 80% used
    if (percentUsed > 80) {
      console.error('[Storage] Usage exceeds 80% — purging old cached data');
      await _purgeOldData();
    }

    return { usage, quota, percentUsed };
  } catch (err) {
    console.error('[Storage] Quota estimate failed:', err);
    return { usage: 0, quota: 0, percentUsed: 0 };
  }
}

/**
 * Request persistent storage (must be called after user interaction).
 * @returns {Promise<boolean>}
 */
async function requestPersistence() {
  if (!('storage' in navigator && 'persist' in navigator.storage)) {
    console.error('[Storage] Persistent storage API not supported');
    return false;
  }

  try {
    const granted = await navigator.storage.persist();
    console.log(`[Storage] Persistence ${granted ? 'GRANTED' : 'DENIED'}`);
    return granted;
  } catch (err) {
    console.error('[Storage] Persistence request failed:', err);
    return false;
  }
}

/**
 * Check if storage is already persisted.
 * @returns {Promise<boolean>}
 */
async function isPersisted() {
  if (!('storage' in navigator && 'persisted' in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (err) {
    console.error('[Storage] Persisted check failed:', err);
    return false;
  }
}

// ─── Route & Fare Caching Helpers ─────────────────────────────────────────────

/**
 * Cache all J&K routes into IndexedDB for offline access.
 * @param {Array} routes - Array of route objects from JK_ROUTES_DB
 */
async function cacheRoutes(routes) {
  try {
    const db = await initDatabase();
    const tx = db.transaction('routes', 'readwrite');
    const store = tx.objectStore('routes');
    for (const route of routes) {
      store.put({ ...route, cached_at: Date.now() });
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[Storage] Route caching failed:', err);
  }
}

/**
 * Cache fare slab configuration for offline fare calculation.
 * @param {object} fareConfig - The active fare version config
 */
async function cacheFareConfig(fareConfig) {
  try {
    await putRecord('fares', { ...fareConfig, cached_at: Date.now() });
  } catch (err) {
    console.error('[Storage] Fare config caching failed:', err);
  }
}

/**
 * Save a trip to history for audit trail.
 * @param {object} trip - Trip data with trip_id
 */
async function saveTripHistory(trip) {
  try {
    await putRecord('trip_history', { ...trip, created_at: Date.now() });
  } catch (err) {
    console.error('[Storage] Trip history save failed:', err);
  }
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function _purgeOldData() {
  try {
    // Purge trip history older than 30 days
    const trips = await getAllRecords('trip_history');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    for (const trip of trips) {
      if (trip.created_at && trip.created_at < thirtyDaysAgo) {
        await deleteRecord('trip_history', trip.trip_id);
      }
    }

    // Clear offline queue
    await clearStore('offline_queue');

    console.log('[Storage] Old data purged successfully');
  } catch (err) {
    console.error('[Storage] Purge failed:', err);
  }
}

function _formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── Exports ──────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.SafarStorage = {
    initDatabase,
    putRecord,
    getRecord,
    getAllRecords,
    deleteRecord,
    clearStore,
    checkStorageQuota,
    requestPersistence,
    isPersisted,
    cacheRoutes,
    cacheFareConfig,
    saveTripHistory
  };
}
