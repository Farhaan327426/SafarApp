/**
 * SAFAR — Leaflet Driver Console Map Module
 */

import { store } from '../../core/state.js';

export function initDriverMap() {
  const driverMapEl = document.getElementById("driverMap");
  if (!driverMapEl || typeof window === "undefined" || !window.L) return;

  const driverState = store.getState('driver');
  if (driverState.driverMap) {
    setTimeout(() => {
      try {
        driverState.driverMap.invalidateSize();
      } catch (e) { }
    }, 150);
    return;
  }

  try {
    const L = window.L;
    const map = L.map("driverMap").setView([34.0837, 74.7973], 13);
    store.setState('driver', { driverMap: map });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors, &copy; CARTO"
    }).addTo(map);

    const marker = L.marker([34.0837, 74.7973]).addTo(map);
    marker.bindPopup("<b>Driver Console GPS Tracking Active</b>");

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 250);
  } catch (e) {
    console.warn("Driver map init warning:", e);
  }
}

// Auto-initialize when switching to driver tab
store.subscribe('navigation', state => {
  if (state.activeTab === 'driver') {
    initDriverMap();
  }
});
