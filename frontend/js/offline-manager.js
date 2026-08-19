/**
 * SAFAR — Offline Manager & Connectivity Banner
 * Monitors network state, displays non-intrusive offline alerts,
 * and orchestrates background cache synchronization into IndexedDB.
 */

import { getMeta, saveRoutes, saveFares, savePositions } from './offline-store.js';

function showBanner(text) {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  banner.innerHTML = `<span class="offline-dot"></span> <span>${text}</span>`;
  banner.style.display = 'flex';
}

function hideBanner() {
  const banner = document.getElementById('offline-banner');
  if (banner) banner.style.display = 'none';
}

async function updateStatus() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const { lastRoutes } = await getLastSyncTimes();
    if (lastRoutes) {
      const minutesAgo = Math.max(1, Math.round((Date.now() - lastRoutes) / 60000));
      showBanner(`Offline — showing cached transit schedules (updated ${minutesAgo}m ago)`);
    } else {
      showBanner('Offline — showing cached route & fare data');
    }
  } else {
    hideBanner();
    refreshCachedData();
  }
}

async function refreshCachedData() {
  try {
    // 1. Fetch & cache active routes
    const routesRes = await fetch('/api/v1/admin/routes').catch(() => null);
    if (routesRes && routesRes.ok) {
      const json = await routesRes.json();
      const routes = json.data || json;
      if (Array.isArray(routes) && routes.length > 0) {
        await saveRoutes(routes);
      }
    }

    // 2. Fetch & cache current fare schedules
    const faresRes = await fetch('/api/v1/admin/fares/current').catch(() => null);
    if (faresRes && faresRes.ok) {
      const json = await faresRes.json();
      const fareData = json.data || json;
      if (fareData && fareData.version) {
        await saveFares('default', fareData.version, fareData);
      }
    }

    // 3. Fetch & cache active vehicle positions snapshot
    const positionsRes = await fetch('/api/v1/telemetry/active').catch(() => null);
    if (positionsRes && positionsRes.ok) {
      const json = await positionsRes.json();
      const positions = json.data || json;
      if (Array.isArray(positions) && positions.length > 0) {
        await savePositions(positions);
      }
    }
  } catch (err) {
    console.warn('[offline-manager] Background sync deferred:', err.message);
  }
}

export async function getLastSyncTimes() {
  const lastRoutes = await getMeta('lastRoutesSync');
  const lastPositions = await getMeta('lastPositionsSync');
  const lastFares = await getMeta('lastFaresSync');
  return { lastRoutes, lastPositions, lastFares };
}

export function initOfflineManager() {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  }
}
