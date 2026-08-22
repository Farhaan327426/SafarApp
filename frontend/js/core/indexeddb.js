/**
 * SAFAR — Centralized IndexedDB Adapter (safar_sync DB v3)
 */

export function openSyncDB() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("safar_sync", 3);
    request.onupgradeneeded = evt => {
      const db = evt.target.result;
      if (!db.objectStoreNames.contains("offline_queue")) {
        db.createObjectStore("offline_queue", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("failed_queue")) {
        db.createObjectStore("failed_queue", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("routes_cache")) {
        db.createObjectStore("routes_cache", { keyPath: "id" });
      }
    };
    request.onsuccess = evt => resolve(evt.target.result);
    request.onerror = evt => reject(evt.target.error);
  });
}

export async function cacheRoutesInIndexedDB(routes) {
  try {
    const db = await openSyncDB();
    const tx = db.transaction("routes_cache", "readwrite");
    const store = tx.objectStore("routes_cache");
    store.clear();
    routes.forEach(r => store.put(r));
  } catch (e) { }
}

export async function getCachedRoutesFromIndexedDB() {
  try {
    const db = await openSyncDB();
    return new Promise(resolve => {
      const tx = db.transaction("routes_cache", "readonly");
      const store = tx.objectStore("routes_cache");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function saveOfflineBooking(booking) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("offline_queue", "readwrite");
    const store = tx.objectStore("offline_queue");
    const addReq = store.add(booking);
    addReq.onsuccess = () => resolve();
    addReq.onerror = () => reject(addReq.error);
  });
}

export async function getOfflineQueueCount() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction("offline_queue", "readonly");
    const countReq = tx.objectStore("offline_queue").count();
    return new Promise(resolve => {
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => resolve(0);
    });
  } catch (e) {
    return 0;
  }
}

export async function getOfflineQueueItems() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction("offline_queue", "readonly");
    const store = tx.objectStore("offline_queue");
    return new Promise(resolve => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

export async function deleteOfflineQueueItems(ids) {
  try {
    const db = await openSyncDB();
    const deleteTx = db.transaction("offline_queue", "readwrite");
    const deleteStore = deleteTx.objectStore("offline_queue");
    ids.forEach(id => deleteStore.delete(id));
  } catch (e) { }
}
