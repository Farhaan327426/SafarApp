/**
 * SafarApp - Crowd Radar & Evening Transit Pool (crowd-radar.js)
 */

const SafarCrowdRadar = (() => {
  // In-memory / localStorage telemetry buffer
  const STORAGE_KEY = "safar_occupancy_feed";

  const OCCUPANCY_LEVELS = {
    SEATS_AVAILABLE: { id: "seats", label: "Available Seating", color: "#10b981", badge: "🟢 Low / Seated" },
    STANDING_ONLY:   { id: "standing", label: "Standing Room Only", color: "#f59e0b", badge: "🟡 Standing Full" },
    SEVERE_OVERLOAD: { id: "overload", label: "Severe Overload (120%+)", color: "#ef4444", badge: "🔴 Footboard Hazard" }
  };

  const EVENING_HUBS = [
    { name: "Jahangir Chowk / TRC", city: "Srinagar", coordinates: [34.0722, 74.8080], routes: ["Budgam", "Baramulla", "Soura", "Pampore"] },
    { name: "Batamaloo Stand", city: "Srinagar", coordinates: [34.0745, 74.7932], routes: ["Tangmarg", "Magam", "Pattan"] },
    { name: "Jewel Chowk", city: "Jammu", coordinates: [32.7231, 74.8582], routes: ["RS Pura", "Akhnoor", "Bishnah", "Udhampur"] }
  ];

  function recordOccupancy(vehiclePlate, routeKey, levelId) {
    const reports = getOccupancyReports();
    const entry = {
      plate: (vehiclePlate || "UNREG").toUpperCase().trim(),
      routeKey,
      level: OCCUPANCY_LEVELS[levelId] || OCCUPANCY_LEVELS.STANDING_ONLY,
      timestamp: Date.now()
    };
    reports.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports.slice(0, 50)));
    return entry;
  }

  function getOccupancyReports() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function isEveningRadarActive() {
    const hr = new Date().getHours();
    return hr >= 19 || hr < 6;
  }

  function getActiveEveningPools() {
    return EVENING_HUBS.map(hub => ({
      ...hub,
      activeVehiclesRemaining: Math.floor(Math.random() * 4) + 1,
      estimatedWaitTimeMins: Math.floor(Math.random() * 15) + 5,
      nightTariffMultiplier: 1.20
    }));
  }

  return {
    OCCUPANCY_LEVELS,
    EVENING_HUBS,
    recordOccupancy,
    getOccupancyReports,
    isEveningRadarActive,
    getActiveEveningPools
  };
})();

// Attach to global scope
if (typeof window !== "undefined") {
  window.SafarCrowdRadar = SafarCrowdRadar;
}
if (typeof globalThis !== "undefined") {
  globalThis.SafarCrowdRadar = SafarCrowdRadar;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = SafarCrowdRadar;
}
