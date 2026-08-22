/**
 * SAFAR — Routes Data Service (100% DOM-Free)
 */

import { store } from '../../core/state.js';
import { cacheRoutesInIndexedDB, getCachedRoutesFromIndexedDB } from '../../core/indexeddb.js';

export async function loadRoutes() {
  try {
    const res = await fetch("/api/v1/routes", { headers: { Accept: "application/json" } });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        window.JK_ROUTES_DB = json.data;
        await cacheRoutesInIndexedDB(json.data);
        return json.data;
      }
    }
  } catch (err) {
    const cachedRoutes = await getCachedRoutesFromIndexedDB();
    if (cachedRoutes && cachedRoutes.length > 0) {
      window.JK_ROUTES_DB = cachedRoutes;
      return cachedRoutes;
    }
  }
  return window.JK_ROUTES_DB || [];
}
