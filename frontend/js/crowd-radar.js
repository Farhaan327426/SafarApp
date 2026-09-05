/**
 * SafarApp — Crowd & Evening Radar
 * Modules: Crowdsourced Occupancy Telemetry · Predictive Boarding Advisories
 *          · Evening Transit Radar (post-19:00) · Hub Pool Matching
 *          · Vehicle Registration Flagging (MVA §194A)
 *          · Backward-Compatibility for Safar Commuter Defense Layer
 *
 * Storage: IndexedDB (offline-first) with localStorage fallback.
 * All timestamps in IST (Asia/Kolkata, UTC+5:30).
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

const OCCUPANCY = Object.freeze({
  AVAILABLE: { code: 'AVAILABLE', label: 'Available Seating',  color: '#1A8C4E', indicator: '🟢', threshold: 0.70 },
  STANDING:  { code: 'STANDING',  label: 'Standing Room Only', color: '#D48B20', indicator: '🟡', threshold: 0.95 },
  OVERLOAD:  { code: 'OVERLOAD',  label: 'Severe Overload',    color: '#D42B2B', indicator: '🔴', threshold: Infinity },
});

// Backward-compatibility levels
const OCCUPANCY_LEVELS = Object.freeze({
  SEATS_AVAILABLE: { id: "seats", label: "Available Seating", color: "#10b981", badge: "🟢 Low / Seated" },
  STANDING_ONLY:   { id: "standing", label: "Standing Room Only", color: "#f59e0b", badge: "🟡 Standing Full" },
  SEVERE_OVERLOAD: { id: "overload", label: "Severe Overload (120%+)", color: "#ef4444", badge: "🔴 Footboard Hazard" }
});

// Evening radar active window: 19:00 – 23:59
const EVENING_START_HOUR = 19;

// Major transit hubs with GPS coordinates
const TRANSIT_HUBS = {
  'jahangir-chowk':   { name: 'Jahangir Chowk',    city: 'Srinagar', lat: 34.0867, lng: 74.7955 },
  'trc':              { name: 'TRC Srinagar',        city: 'Srinagar', lat: 34.0779, lng: 74.7992 },
  'batamaloo':        { name: 'Batamaloo Stand',     city: 'Srinagar', lat: 34.0906, lng: 74.7848 },
  'batmaloo-inter':   { name: 'Batmaloo Interstate', city: 'Srinagar', lat: 34.0912, lng: 74.7841 },
  'lal-chowk':        { name: 'Lal Chowk',           city: 'Srinagar', lat: 34.0836, lng: 74.7973 },
  'jewel-chowk':      { name: 'Jewel Chowk',          city: 'Jammu',   lat: 32.7376, lng: 74.8617 },
  'general-bus-stand':{ name: 'General Bus Stand',   city: 'Jammu',   lat: 32.7266, lng: 74.8570 },
  'railway-station':  { name: 'Jammu Railway Station',city: 'Jammu',   lat: 32.7287, lng: 74.8700 },
};

// Legacy hubs array
const EVENING_HUBS = [
  { name: "Jahangir Chowk / TRC", city: "Srinagar", coordinates: [34.0722, 74.8080], routes: ["Budgam", "Baramulla", "Soura", "Pampore"] },
  { name: "Batamaloo Stand", city: "Srinagar", coordinates: [34.0745, 74.7932], routes: ["Tangmarg", "Magam", "Pattan"] },
  { name: "Jewel Chowk", city: "Jammu", coordinates: [32.7231, 74.8582], routes: ["RS Pura", "Akhnoor", "Bishnah", "Udhampur"] }
];

// Evening feeder routes that go dark after 19:00 (commonly reported)
const EVENING_CRITICAL_ROUTES = [
  { id: 'sr-budgam',     from: 'Srinagar',  to: 'Budgam',     lastKnown: '19:30', vehicles: ['Matador', 'Sumo'] },
  { id: 'sr-baramulla',  from: 'Srinagar',  to: 'Baramulla',  lastKnown: '20:00', vehicles: ['Minibus'] },
  { id: 'an-bijbehara',  from: 'Anantnag',  to: 'Bijbehara',  lastKnown: '20:30', vehicles: ['Sumo', 'Auto'] },
  { id: 'jm-rs-pura',    from: 'Jammu',     to: 'RS Pura',    lastKnown: '21:00', vehicles: ['Minibus'] },
  { id: 'sr-pantha',     from: 'Srinagar',  to: 'Pantha Chowk', lastKnown: '20:00', vehicles: ['Shared taxi'] },
  { id: 'sr-hyderpora',  from: 'Srinagar',  to: 'Hyderpora',  lastKnown: '20:15', vehicles: ['Minibus'] },
];

const NIGHT_SURCHARGE_PCT = 20;

// ─── In-Memory Store ─────────────────────────────────────────────────────────

let _store = {
  occupancyReports: [],    // { vehicleId, routeId, status, ts, hubKey }
  flaggedVehicles: [],     // { regNo, violation, reporterId, ts, mvaSec }
  poolRequests: [],        // { hubKey, destination, seats, userId, ts }
  eveningUpdates: [],      // { routeId, type, ts, note }
};

function _persist() {
  try {
    localStorage.setItem('safar_crowd_store', JSON.stringify(_store));
  } catch (_) { /* Storage full or unavailable */ }
}

function _hydrate() {
  try {
    const raw = localStorage.getItem('safar_crowd_store');
    if (raw) _store = { ..._store, ...JSON.parse(raw) };
  } catch (_) {}
}

_hydrate();

// ─── Occupancy Classification ─────────────────────────────────────────────────

function classifyLoad(loadFactor) {
  if (loadFactor <= OCCUPANCY.AVAILABLE.threshold) return OCCUPANCY.AVAILABLE;
  if (loadFactor <= OCCUPANCY.STANDING.threshold)  return OCCUPANCY.STANDING;
  return OCCUPANCY.OVERLOAD;
}

function reportOccupancy({ vehicleId, routeId, statusCode, hubKey }) {
  const status = OCCUPANCY[statusCode] || OCCUPANCY.AVAILABLE;
  const report = {
    id: `OCC-${Date.now()}`,
    vehicleId: vehicleId || 'UNKNOWN',
    routeId:   routeId   || 'UNKNOWN',
    status,
    hubKey,
    ts: new Date().toISOString(),
    votes: 1,
  };

  const existing = _store.occupancyReports.find(r =>
    r.vehicleId === vehicleId &&
    (Date.now() - new Date(r.ts).getTime()) < 5 * 60 * 1000
  );

  if (existing) {
    existing.votes++;
    existing.status = status;
    existing.ts = report.ts;
  } else {
    _store.occupancyReports.unshift(report);
    if (_store.occupancyReports.length > 200) _store.occupancyReports.length = 200;
  }

  _persist();
  return report;
}

function getOccupancyStatus(vehicleId) {
  const STALE_MS = 10 * 60 * 1000;
  const report = _store.occupancyReports.find(r =>
    r.vehicleId === vehicleId &&
    (Date.now() - new Date(r.ts).getTime()) < STALE_MS
  );
  return report?.status || null;
}

function getRouteOccupancySummary(routeId) {
  const STALE_MS = 15 * 60 * 1000;
  const recent = _store.occupancyReports.filter(r =>
    r.routeId === routeId &&
    (Date.now() - new Date(r.ts).getTime()) < STALE_MS
  );

  if (!recent.length) return null;

  const counts = { AVAILABLE: 0, STANDING: 0, OVERLOAD: 0 };
  recent.forEach(r => {
    if (r.status?.code && counts[r.status.code] !== undefined) {
      counts[r.status.code]++;
    }
  });

  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return {
    routeId,
    dominant: OCCUPANCY[dominant] || OCCUPANCY.AVAILABLE,
    breakdown: counts,
    reportCount: recent.length,
    lastReport: recent[0].ts,
  };
}

// ─── Predictive Boarding Advisory ─────────────────────────────────────────────

function generateBoardingAdvisory({ routeId, incomingVehicleId, alternatives = [] }) {
  const incomingStatus = getOccupancyStatus(incomingVehicleId);
  if (!incomingStatus || incomingStatus.code === 'AVAILABLE') return null;

  const advisories = [];

  if (incomingStatus.code === 'OVERLOAD') {
    advisories.push({
      severity: 'HIGH',
      message: `Approaching ${incomingVehicleId || 'vehicle'} is severely overloaded (120%+). Footboard riding risk.`,
      action: alternatives.length
        ? `Alternative: ${alternatives[0].vehicle} departs in ~${alternatives[0].etaMin} min with available seats.`
        : 'Consider waiting for next vehicle.',
      mvaNoteApplicable: true,
    });
  } else if (incomingStatus.code === 'STANDING') {
    advisories.push({
      severity: 'MEDIUM',
      message: `Approaching ${incomingVehicleId || 'vehicle'} is at standing capacity.`,
      action: alternatives.length
        ? `Alternative: ${alternatives[0].vehicle} leaves in ~${alternatives[0].etaMin} min.`
        : '',
      mvaNoteApplicable: false,
    });
  }

  return advisories;
}

// ─── Vehicle Flagging (MVA §194A) ─────────────────────────────────────────────

const REG_PATTERN = /^JK\d{2}\s?[A-Z]{1,2}\s?\d{4}$/i;

function flagVehicle({ regNo, violation, hubKey, photoDataUrl }) {
  const cleanReg = (regNo || '').toUpperCase().replace(/\s/g, ' ').trim();
  if (!REG_PATTERN.test(cleanReg)) {
    return { error: 'Invalid J&K registration format. Expected: JK01 AB 1234' };
  }

  const penaltyMap = {
    OVERLOAD:    { section: '194A', penalty: '₹20,000 or ₹2,000 per excess passenger' },
    FARE_GOUGE:  { section: '192A', penalty: '₹10,000 + cancellation of permit' },
    ROUTE_ABUSE: { section: '179',  penalty: '₹5,000 — failure to comply with authority order' },
    ROUTE_ABANDON: { section: '179', penalty: '₹5,000 — failure to comply with authority order' },
    RASH_DRIVING: { section: '183', penalty: '₹1,000–₹2,000 + licence suspension' }
  };

  const mva = penaltyMap[violation] || penaltyMap.OVERLOAD;

  const record = {
    id: `FLAG-${Date.now()}`,
    regNo: cleanReg,
    violation,
    mvaSec: mva.section,
    penalty: mva.penalty,
    hubKey,
    photoDataUrl: photoDataUrl || null,
    ts: new Date().toISOString(),
    dispatched: false,
  };

  _store.flaggedVehicles.unshift(record);
  if (_store.flaggedVehicles.length > 100) _store.flaggedVehicles.length = 100;
  _persist();

  return record;
}

function getFlaggedVehicles() {
  return [..._store.flaggedVehicles];
}

// ─── Evening Transit Radar ─────────────────────────────────────────────────────

function isEveningRadarActive() {
  const hr = new Date().getHours();
  return hr >= EVENING_START_HOUR || hr < 6;
}

function getEveningRadarStatus() {
  const now = new Date();
  const isActive = isEveningRadarActive();

  if (!isActive) {
    const activationAt = new Date(now);
    activationAt.setHours(EVENING_START_HOUR, 0, 0, 0);
    return {
      active: false,
      activatesAt: activationAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  const routes = EVENING_CRITICAL_ROUTES.map(route => {
    const updates = _store.eveningUpdates.filter(u => u.routeId === route.id);
    const latestUpdate = updates[0] || null;
    const summary = getRouteOccupancySummary(route.id);

    return {
      ...route,
      latestUpdate,
      occupancySummary: summary,
      nightFareNote: `+${NIGHT_SURCHARGE_PCT}% statutory night surcharge applies`,
      status: latestUpdate?.type || 'UNKNOWN',
    };
  });

  return { active: true, routes, timestamp: now.toISOString() };
}

function submitEveningUpdate({ routeId, type, note }) {
  const update = {
    id: `EVE-${Date.now()}`,
    routeId,
    type,
    note: note || '',
    ts: new Date().toISOString(),
  };
  _store.eveningUpdates.unshift(update);
  if (_store.eveningUpdates.length > 300) _store.eveningUpdates.length = 300;
  _persist();
  return update;
}

// ─── Hub Pool Matching ─────────────────────────────────────────────────────────

function registerPoolRequest({ hubKey, destination, seats = 1, userId }) {
  const hub = TRANSIT_HUBS[hubKey];
  if (!hub) return { error: `Unknown hub: ${hubKey}` };

  const STALE_MS = 30 * 60 * 1000;
  const destNorm = (destination || '').toLowerCase().trim();

  const request = {
    id: `POOL-${Date.now()}`,
    hubKey,
    hubName: hub.name,
    destination: destNorm,
    seats,
    userId: userId || `anon-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    matched: false,
  };

  const matches = _store.poolRequests.filter(r =>
    r.hubKey === hubKey &&
    r.destination === destNorm &&
    !r.matched &&
    (Date.now() - new Date(r.ts).getTime()) < STALE_MS &&
    r.userId !== request.userId
  );

  _store.poolRequests.unshift(request);
  _persist();

  const totalSeats = matches.reduce((sum, r) => sum + r.seats, 0) + seats;
  const sumoCapacity = 7;

  return {
    request,
    matches,
    totalSeats,
    canFillSumo: totalSeats >= sumoCapacity,
    nightFareNote: isEveningRadarActive()
      ? `Night rate applies. Confirm driver is charging max +${NIGHT_SURCHARGE_PCT}% surcharge only.`
      : null,
    matchCount: matches.length,
  };
}

function getPoolRequests(hubKey) {
  const STALE_MS = 30 * 60 * 1000;
  return _store.poolRequests.filter(r =>
    r.hubKey === hubKey &&
    (Date.now() - new Date(r.ts).getTime()) < STALE_MS
  );
}

// ─── Legacy Backward Compatibility Helpers ────────────────────────────────────

function recordOccupancy(vehiclePlate, routeKey, levelId) {
  let mappedStatus = 'AVAILABLE';
  if (levelId === 'STANDING_ONLY' || levelId === 'standing') mappedStatus = 'STANDING';
  if (levelId === 'SEVERE_OVERLOAD' || levelId === 'overload') mappedStatus = 'OVERLOAD';

  const rep = reportOccupancy({
    vehicleId: vehiclePlate,
    routeId: routeKey,
    statusCode: mappedStatus
  });

  try {
    const legacyStoreKey = "safar_occupancy_feed";
    const existing = JSON.parse(localStorage.getItem(legacyStoreKey)) || [];
    existing.unshift({
      plate: (vehiclePlate || "UNREG").toUpperCase().trim(),
      routeKey,
      level: OCCUPANCY_LEVELS[levelId] || OCCUPANCY_LEVELS.STANDING_ONLY,
      timestamp: Date.now()
    });
    localStorage.setItem(legacyStoreKey, JSON.stringify(existing.slice(0, 50)));
  } catch (_) {}

  return rep;
}

function getOccupancyReports() {
  try {
    const legacy = JSON.parse(localStorage.getItem("safar_occupancy_feed"));
    if (legacy && legacy.length) return legacy;
  } catch (_) {}
  return _store.occupancyReports.map(r => ({
    plate: r.vehicleId,
    routeKey: r.routeId,
    level: { label: r.status.label, color: r.status.color },
    timestamp: new Date(r.ts).getTime()
  }));
}

function getActiveEveningPools() {
  return EVENING_HUBS.map(hub => ({
    ...hub,
    activeVehiclesRemaining: Math.floor(Math.random() * 4) + 1,
    estimatedWaitTimeMins: Math.floor(Math.random() * 15) + 5,
    nightTariffMultiplier: 1.20
  }));
}

// ─── UI Render Helpers ─────────────────────────────────────────────────────────

function renderOccupancyBar(containerEl, { vehicleId, routeId }) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  containerEl.className = 'occupancy-bar';
  containerEl.setAttribute('role', 'group');
  containerEl.setAttribute('aria-label', 'Report vehicle occupancy');

  Object.values(OCCUPANCY).forEach(state => {
    const pill = document.createElement('button');
    pill.className = 'occupancy-pill';
    pill.dataset.status = state.code;
    pill.setAttribute('aria-pressed', 'false');
    pill.innerHTML = `
      <span class="occupancy-pill__dot" style="background:${state.color}"></span>
      <span class="occupancy-pill__label">${state.label}</span>
    `;
    pill.addEventListener('click', () => {
      containerEl.querySelectorAll('.occupancy-pill').forEach(p =>
        p.setAttribute('aria-pressed', 'false')
      );
      pill.setAttribute('aria-pressed', 'true');
      const report = CrowdRadar.reportOccupancy({ vehicleId, routeId, statusCode: state.code });
      containerEl.dispatchEvent(new CustomEvent('occupancy:reported', { detail: report, bubbles: true }));
    });
    containerEl.appendChild(pill);
  });
}

function renderEveningRadar(containerEl) {
  if (!containerEl) return;
  const radarData = getEveningRadarStatus();

  if (!radarData.active) {
    containerEl.innerHTML = `
      <div class="evening-radar evening-radar--inactive">
        <p class="radar-inactive-msg">Evening Radar activates at ${radarData.activatesAt}</p>
      </div>`;
    return;
  }

  const routesHtml = radarData.routes.map(route => {
    const statusClass = {
      OPERATING:  'route-status--ok',
      SUSPENDED:  'route-status--alert',
      IRREGULAR:  'route-status--warn',
      OVERPRICED: 'route-status--warn',
      UNKNOWN:    'route-status--unknown',
    }[route.status] || 'route-status--unknown';

    const occ = route.occupancySummary;
    const occHtml = occ
      ? `<span class="route-occ" style="color:${occ.dominant.color}">${occ.dominant.indicator} ${occ.dominant.label}</span>`
      : '';

    return `
      <div class="evening-route ${statusClass}">
        <div class="evening-route__header">
          <span class="route-name">${route.from} → ${route.to}</span>
          <span class="route-last-known">Last seen: ${route.lastKnown}</span>
        </div>
        <div class="evening-route__vehicles">${route.vehicles.join(' · ')}</div>
        ${occHtml}
        <div class="evening-route__night-note">${route.nightFareNote}</div>
        <div class="evening-route__update-bar" data-route-id="${route.id}">
          ${['OPERATING','SUSPENDED','IRREGULAR','OVERPRICED'].map(t => `
            <button class="update-pill" data-type="${t}" onclick="CrowdRadar.submitEveningUpdate({routeId:'${route.id}',type:'${t}'})">
              ${t}
            </button>`).join('')}
        </div>
      </div>`;
  }).join('');

  containerEl.innerHTML = `
    <div class="evening-radar">
      <div class="evening-radar__header">
        <span class="radar-icon">◉</span>
        <span class="radar-title">Evening Transit Radar</span>
        <span class="radar-live">LIVE</span>
      </div>
      <div class="evening-radar__routes">${routesHtml}</div>
    </div>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const CrowdRadar = {
  reportOccupancy,
  getOccupancyStatus,
  getRouteOccupancySummary,
  generateBoardingAdvisory,
  flagVehicle,
  getFlaggedVehicles,
  isEveningRadarActive,
  getEveningRadarStatus,
  submitEveningUpdate,
  registerPoolRequest,
  getPoolRequests,
  renderOccupancyBar,
  renderEveningRadar,
  classifyLoad,
  OCCUPANCY,
  TRANSIT_HUBS,
  EVENING_CRITICAL_ROUTES,

  // Backward compatibility
  OCCUPANCY_LEVELS,
  EVENING_HUBS,
  recordOccupancy,
  getOccupancyReports,
  getActiveEveningPools,
};

if (typeof window !== "undefined") {
  window.CrowdRadar = CrowdRadar;
  window.SafarCrowdRadar = CrowdRadar;
}
if (typeof globalThis !== "undefined") {
  globalThis.CrowdRadar = CrowdRadar;
  globalThis.SafarCrowdRadar = CrowdRadar;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = CrowdRadar;
}
