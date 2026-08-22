/**
 * SAFAR — Leaflet CartoDB Commuter Map Module
 */

import { store } from '../../core/state.js';

let _commuterMap = null;

export function initCommuterMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  if (typeof window === "undefined" || !window.L) {
    setTimeout(initCommuterMap, 200);
    return;
  }

  if (_commuterMap) {
    setTimeout(() => {
      try { _commuterMap.invalidateSize(); } catch (e) { }
    }, 150);
    return;
  }

  try {
    const L = window.L;
    const map = L.map("map").setView([34.0722, 74.8058], 13);
    _commuterMap = map;
    window.commuterMap = map;

    const primaryTiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      crossOrigin: true
    });

    primaryTiles.on("tileerror", () => {
      console.warn("[CommuterMap] CartoDB tile load warning, falling back to OpenStreetMap");
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);
    });

    primaryTiles.addTo(map);

    const hubs = [
      { name: "Lal Chowk Central Terminal", lat: 34.0722, lng: 74.8058 },
      { name: "Parimpora Transport Hub", lat: 34.0885, lng: 74.7612 },
      { name: "Batamaloo Bus Stand", lat: 34.0740, lng: 74.7930 },
      { name: "Jammu Tawi Railway Bus Stand", lat: 32.7060, lng: 74.8780 }
    ];

    hubs.forEach(h => {
      L.marker([h.lat, h.lng])
        .addTo(map)
        .bindPopup(`<b>${h.name}</b><br><small>J&K Regulated Transit Terminal</small>`);
    });

    [100, 300, 800].forEach(delay => {
      setTimeout(() => {
        if (_commuterMap) _commuterMap.invalidateSize();
      }, delay);
    });
  } catch (err) {
    console.warn("Commuter map init error:", err);
  }

  // Subscribe to navigation updates for tab invalidation
  store.subscribe('navigation', state => {
    if (state.activeTab === 'commuter' && _commuterMap) {
      try { _commuterMap.invalidateSize(); } catch (e) { }
    }
  });
}
