/**
 * SAFAR — IndexedDB Offline Store
 * Promise-based local persistence for routes, SRO fare slabs, last-known bus positions, and sync metadata.
 * Only caches non-sensitive public transit data (no PII, OTP, or payment credentials).
 */

const DB_NAME = 'safar_offline_db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    // Check if indexedDB is supported
    const idb = typeof indexedDB !== 'undefined' ? indexedDB : (typeof globalThis !== 'undefined' ? globalThis.indexedDB : null);
    if (!idb) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('routes')) {
        const store = db.createObjectStore('routes', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('fares')) {
        const store = db.createObjectStore('fares', { keyPath: 'routeId' });
        store.createIndex('fareVersion', 'fareVersion', { unique: false });
      }
      if (!db.objectStoreNames.contains('positions')) {
        const store = db.createObjectStore('positions', { keyPath: 'vehicleNo' });
        store.createIndex('routeId', 'routeId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveRoutes(routes) {
  if (!Array.isArray(routes)) return;
  const db = await openDB();
  const tx = db.transaction(['routes', 'meta'], 'readwrite');
  const store = tx.objectStore('routes');
  routes.forEach((r) => {
    if (r && (r.id || r.code)) {
      const record = { id: r.id || r.code, ...r, updatedAt: Date.now() };
      store.put(record);
    }
  });
  const metaStore = tx.objectStore('meta');
  metaStore.put({ key: 'lastRoutesSync', value: Date.now() });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getRoutes() {
  try {
    const db = await openDB();
    const tx = db.transaction('routes', 'readonly');
    const store = tx.objectStore('routes');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
}

async function saveFares(routeId, fareVersion, fares) {
  if (!routeId) return;
  const db = await openDB();
  const tx = db.transaction(['fares', 'meta'], 'readwrite');
  const store = tx.objectStore('fares');
  store.put({ routeId: String(routeId), fareVersion: fareVersion || 1, fares, updatedAt: Date.now() });
  const metaStore = tx.objectStore('meta');
  metaStore.put({ key: 'lastFaresSync', value: Date.now() });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFaresByRoute(routeId) {
  try {
    const db = await openDB();
    const tx = db.transaction('fares', 'readonly');
    const store = tx.objectStore('fares');
    const request = store.get(String(routeId));
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ? [request.result] : []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
}

async function savePositions(positions) {
  if (!Array.isArray(positions)) return;
  const db = await openDB();
  const tx = db.transaction(['positions', 'meta'], 'readwrite');
  const store = tx.objectStore('positions');
  positions.forEach((p) => {
    if (p && p.vehicleNo) {
      store.put({ ...p, updatedAt: Date.now() });
    }
  });
  const metaStore = tx.objectStore('meta');
  metaStore.put({ key: 'lastPositionsSync', value: Date.now() });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPositions() {
  try {
    const db = await openDB();
    const tx = db.transaction('positions', 'readonly');
    const store = tx.objectStore('positions');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return [];
  }
}

async function getMeta(key) {
  try {
    const db = await openDB();
    const tx = db.transaction('meta', 'readonly');
    const store = tx.objectStore('meta');
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return null;
  }
}

export {
  openDB,
  saveRoutes,
  getRoutes,
  saveFares,
  getFaresByRoute,
  savePositions,
  getPositions,
  getMeta,
};
