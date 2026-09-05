/**
 * SAFAR PRO — Driver & Conductor Mode
 * =====================================
 * File: frontend/js/driver-mode.js
 * Include: <script src="frontend/js/driver-mode.js"></script> before </body>
 *
 * Integration with your existing tab system:
 *   In your activateTab() or tab-switch handler, add:
 *
 *     if (tabId === 'driver') SafarDriverMode.init();
 *
 * The module is idempotent — safe to call on every tab activation.
 */

const SafarDriverMode = (() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     STATIC DATA
  ───────────────────────────────────────────────────────────────── */

  const VEHICLES = [
    { id: 'sumo',    label: 'Sumo / Max Cab',     capacity: 7,  capacityOptions: [5, 6, 7] },
    { id: 'matador', label: 'Matador / Tempo 407', capacity: 18, capacityOptions: [16, 18, 20, 22, 24] },
    { id: 'magic',   label: 'Tata Magic',           capacity: 7,  capacityOptions: [6, 7, 8] },
    { id: 'auto',    label: 'Auto Rickshaw',         capacity: 3,  capacityOptions: [2, 3] },
    { id: 'bus',     label: 'Private Bus',           capacity: 40, capacityOptions: [32, 36, 40, 44, 48, 52] },
  ];

  /**
   * Per-seat fares in ₹ by vehicle type.
   *
   * DATA INTEGRITY FLAG:
   * These are representative values derived from J&K SRTA tariff structure.
   * Cross-reference against the official J&K SRTA 2026 / SRO-97 notification
   * before production deployment. Auto fares (0) defer to Stage Slabs below.
   */
  const ROUTES = [
    { id: 'sgr-bar',      name: 'Srinagar → Baramulla',  km: 55,  fares: { sumo: 60,  matador: 50,  magic: 55,  auto: 0, bus: 45  } },
    { id: 'sgr-anan',     name: 'Srinagar → Anantnag',   km: 50,  fares: { sumo: 55,  matador: 45,  magic: 50,  auto: 0, bus: 40  } },
    { id: 'jmu-katra',    name: 'Jammu → Katra',          km: 48,  fares: { sumo: 75,  matador: 60,  magic: 65,  auto: 0, bus: 55  } },
    { id: 'sgr-sop',      name: 'Srinagar → Sopore',      km: 48,  fares: { sumo: 60,  matador: 50,  magic: 55,  auto: 0, bus: 45  } },
    { id: 'sgr-pah',      name: 'Srinagar → Pahalgam',    km: 95,  fares: { sumo: 130, matador: 110, magic: 120, auto: 0, bus: 90  } },
    { id: 'sgr-gulmarg',  name: 'Srinagar → Gulmarg',     km: 56,  fares: { sumo: 80,  matador: 0,   magic: 0,   auto: 0, bus: 0   } },
    { id: 'sgr-handwara', name: 'Srinagar → Handwara',    km: 65,  fares: { sumo: 90,  matador: 75,  magic: 80,  auto: 0, bus: 65  } },
    { id: 'jmu-udhampur', name: 'Jammu → Udhampur',       km: 68,  fares: { sumo: 85,  matador: 70,  magic: 75,  auto: 0, bus: 60  } },
    { id: 'jmu-sgr',      name: 'Jammu → Srinagar',       km: 290, fares: { sumo: 380, matador: 320, magic: 350, auto: 0, bus: 280 } },
    { id: 'custom',       name: '— Custom Route —',        km: 0,   fares: null },
  ];

  /**
   * Stage fare slabs — J&K SRTA / SRO-97.
   * VERIFY: Cross-reference against latest J&K SRTA notification before production use.
   */
  const STAGE_SLABS = [
    { min: 0,   max: 3,   fare: 9  },
    { min: 3,   max: 5,   fare: 14 },
    { min: 5,   max: 10,  fare: 17 },
    { min: 10,  max: 15,  fare: 20 },
    { min: 15,  max: 20,  fare: 26 },
    { min: 20,  max: 30,  fare: 32 },
    { min: 30,  max: 40,  fare: 40 },
    { min: 40,  max: 50,  fare: 48 },
    { min: 50,  max: 60,  fare: 56 },
    { min: 60,  max: 70,  fare: 64 },
    { min: 70,  max: 80,  fare: 72 },
    { min: 80,  max: 90,  fare: 80 },
    { min: 90,  max: 100, fare: 88 },
  ];

  // Seat status constants
  const S = { VACANT: 0, UNPAID: 1, PAID: 2 };
  const SEAT_CLASSES = ['vacant', 'unpaid', 'paid'];
  const SEAT_ICONS   = ['○',      '₹',      '✓'  ];

  /* ─────────────────────────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────────────────────────── */

  const state = {
    vehicleId:  'sumo',
    capacity:   7,
    routeId:    'sgr-bar',
    customFare: 0,
    seats:      [],          // Array<0|1|2> indexed by seat position
    initialized: false,
  };

  /* ─────────────────────────────────────────────────────────────────
     STATE ACCESSORS
  ───────────────────────────────────────────────────────────────── */

  function getVehicle() {
    return VEHICLES.find(v => v.id === state.vehicleId) || VEHICLES[0];
  }

  function getRoute() {
    return ROUTES.find(r => r.id === state.routeId) || null;
  }

  function getFare() {
    if (state.routeId === 'custom') return state.customFare || 0;
    const route = getRoute();
    if (!route || !route.fares) return 0;
    return route.fares[state.vehicleId] || 0;
  }

  function computeTotals() {
    const fare  = getFare();
    const paid   = state.seats.filter(s => s === S.PAID).length;
    const unpaid = state.seats.filter(s => s === S.UNPAID).length;
    const vacant = state.seats.filter(s => s === S.VACANT).length;
    return {
      paid, unpaid, vacant,
      filled:        paid + unpaid,
      capacity:      state.seats.length,
      cashCollected: paid * fare,
      cashDue:       unpaid * fare,
      tripPotential: state.seats.length * fare,
    };
  }

  function initSeats() {
    state.seats = new Array(state.capacity).fill(S.VACANT);
  }

  /* ─────────────────────────────────────────────────────────────────
     FORMATTERS
  ───────────────────────────────────────────────────────────────── */

  function inr(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function fareDisplay(fare) {
    if (fare > 0) return inr(fare);
    if (state.routeId === 'custom') return '—';
    return 'Stage Slab';
  }

  /* ─────────────────────────────────────────────────────────────────
     HTML BUILDERS
  ───────────────────────────────────────────────────────────────── */

  function emblemSVG() {
    return `<svg class="tariff-emblem" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="20" cy="20" r="18.5" stroke="#FDE68A" stroke-width="1.2"/>
  <circle cx="20" cy="20" r="13.5" stroke="rgba(253,230,138,0.3)" stroke-width="0.6"/>
  <text x="20" y="17" text-anchor="middle" fill="#FDE68A" font-size="8" font-weight="800" font-family="serif">J&amp;K</text>
  <text x="20" y="24" text-anchor="middle" fill="rgba(253,230,138,0.65)" font-size="4.2" font-family="sans-serif" letter-spacing="0.4">GOVERNMENT</text>
  <text x="20" y="29.5" text-anchor="middle" fill="rgba(253,230,138,0.45)" font-size="3.8" font-family="sans-serif" letter-spacing="0.3">TRANSPORT</text>
</svg>`;
  }

  function buildVehicleOptions() {
    return VEHICLES.map(v =>
      `<option value="${v.id}"${v.id === state.vehicleId ? ' selected' : ''}>${v.label}</option>`
    ).join('');
  }

  function buildCapacityOptions() {
    const v = getVehicle();
    const opts = v.capacityOptions || [v.capacity];
    return opts.map(c =>
      `<option value="${c}"${c === state.capacity ? ' selected' : ''}>${c} Seats</option>`
    ).join('');
  }

  function buildRouteOptions() {
    return ROUTES.map(r =>
      `<option value="${r.id}"${r.id === state.routeId ? ' selected' : ''}>${r.name}</option>`
    ).join('');
  }

  function buildSeatGrid() {
    return state.seats.map((s, i) =>
      `<button class="driver-seat-btn ${SEAT_CLASSES[s]}"
               data-seat-index="${i}"
               type="button"
               aria-label="Seat ${i + 1}, ${SEAT_CLASSES[s]}">
        <span class="seat-num">${i + 1}</span>
        <span class="seat-icon">${SEAT_ICONS[s]}</span>
      </button>`
    ).join('');
  }

  function buildSlabRows() {
    return STAGE_SLABS.map(sl =>
      `<tr>
        <td>${sl.min}–${sl.max} km</td>
        <td class="slab-fare">${inr(sl.fare)}</td>
      </tr>`
    ).join('');
  }

  /* Main dashboard HTML — rendered into #tab-content-driver */
  function buildDashboard() {
    const t        = computeTotals();
    const fare     = getFare();
    const route    = getRoute();
    const vehicle  = getVehicle();
    const routeName = route ? route.name : 'Custom Route';
    const fareStr  = fareDisplay(fare);

    return `
<!-- ── Fullscreen "Show Passenger" Overlay ───────────────────────── -->
<div id="driver-tariff-overlay" role="dialog" aria-modal="true" aria-label="Official Tariff">
  <button class="driver-overlay-close" id="driver-overlay-close-btn" type="button" aria-label="Close">✕</button>
  <div class="driver-overlay-header">
    <div class="driver-overlay-govt">Government of Jammu &amp; Kashmir</div>
    <div class="driver-overlay-dept">State Road Transport Authority</div>
  </div>
  <div class="driver-overlay-fare-label">Official Statutory Fare</div>
  <div class="driver-overlay-fare-amount" id="overlay-fare-amount">${fareStr}</div>
  <div class="driver-overlay-per-seat">per seat / per passenger</div>
  <div class="driver-overlay-route" id="overlay-route-name">${routeName}</div>
  <div class="driver-overlay-vehicle" id="overlay-vehicle-name">${vehicle.label}</div>
  <div class="driver-overlay-stamp">
    SRO-97 · J&amp;K SRTA<br>
    Overcharging is a punishable offence under MVA
  </div>
</div>

<!-- ── Dashboard ─────────────────────────────────────────────────── -->
<div class="driver-dashboard">

  <!-- Controls -->
  <div class="driver-header">
    <div class="driver-header-row">
      <div class="driver-field">
        <span class="driver-field-label">Vehicle Type</span>
        <select class="driver-select" id="driver-vehicle-sel" aria-label="Select vehicle type">
          ${buildVehicleOptions()}
        </select>
      </div>
      <div class="driver-field">
        <span class="driver-field-label">Capacity</span>
        <select class="driver-select" id="driver-capacity-sel" aria-label="Select seat capacity">
          ${buildCapacityOptions()}
        </select>
      </div>
    </div>
    <div class="driver-field">
      <span class="driver-field-label">Route Corridor</span>
      <select class="driver-select" id="driver-route-sel" aria-label="Select route">
        ${buildRouteOptions()}
      </select>
    </div>
    <div class="driver-custom-fare-row${state.routeId === 'custom' ? ' visible' : ''}" id="driver-custom-row">
      <span class="driver-field-label" style="white-space:nowrap;min-width:64px">₹ / Seat</span>
      <input class="driver-input" type="number" id="driver-custom-fare"
             placeholder="Enter per-seat fare"
             inputmode="numeric" min="0"
             value="${state.customFare || ''}"
             aria-label="Custom fare per seat">
    </div>
  </div>

  <!-- SRO-97 Tariff Slip -->
  <div class="driver-tariff-slip" role="region" aria-label="Official tariff card">
    <div class="tariff-header">
      ${emblemSVG()}
      <div class="tariff-govt-info">
        <div class="tariff-govt-name">Government of Jammu &amp; Kashmir</div>
        <div class="tariff-govt-dept">Dept. of Transport — SRTA</div>
      </div>
      <div class="tariff-sro-chip">SRO-97</div>
    </div>
    <div class="tariff-body">
      <div class="tariff-fare-label">Official Statutory Fare — Per Seat</div>
      <div class="tariff-fare-number" id="tariff-fare-number">${fareStr}</div>
      <div class="tariff-fare-suffix">per passenger / per seat</div>
      <div class="tariff-route-name" id="tariff-route-name">${routeName}</div>
      <div class="tariff-vehicle-name" id="tariff-vehicle-name">${vehicle.label}</div>
    </div>
    <div class="tariff-footer">
      <div class="tariff-footer-legal">
        Fixed by J&amp;K SRTA under Motor Vehicles Act.
        Overcharging is a punishable offence.
      </div>
      <button class="tariff-show-btn" id="driver-show-tariff-btn" type="button">
        Show Passenger ↗
      </button>
    </div>
  </div>

  <!-- Conductor Seat Tally -->
  <div class="driver-seat-section" role="region" aria-label="Passenger tally">
    <div class="driver-seat-header">
      <span class="driver-seat-title">Conductor Tally</span>
      <div class="driver-seat-legend" aria-hidden="true">
        <span class="driver-legend-item">
          <span class="driver-legend-dot paid"></span>Paid
        </span>
        <span class="driver-legend-item">
          <span class="driver-legend-dot unpaid"></span>Due
        </span>
        <span class="driver-legend-item">
          <span class="driver-legend-dot vacant"></span>Empty
        </span>
      </div>
    </div>
    <div class="driver-seat-grid" id="driver-seat-grid" data-capacity="${state.capacity}">
      ${buildSeatGrid()}
    </div>
    <div class="driver-totals-bar" aria-live="polite" aria-atomic="true">
      <div class="driver-total-stat">
        <span class="driver-total-value green" id="dt-paid">${t.paid}/${t.capacity}</span>
        <span class="driver-total-label">Paid Seats</span>
      </div>
      <div class="driver-total-stat">
        <span class="driver-total-value amber" id="dt-unpaid">${t.unpaid}</span>
        <span class="driver-total-label">Due</span>
      </div>
      <div class="driver-total-stat">
        <span class="driver-total-value" id="dt-vacant">${t.vacant}</span>
        <span class="driver-total-label">Vacant</span>
      </div>
    </div>
  </div>

  <!-- Cash Summary -->
  <div class="driver-cash-summary" role="region" aria-label="Cash summary" aria-live="polite">
    <div class="driver-cash-stat">
      <span class="driver-cash-label">Collected</span>
      <span class="driver-cash-value collected" id="dc-collected">${inr(t.cashCollected)}</span>
    </div>
    <div class="driver-cash-stat">
      <span class="driver-cash-label">Pending</span>
      <span class="driver-cash-value due" id="dc-due">${inr(t.cashDue)}</span>
    </div>
    <div class="driver-cash-stat">
      <span class="driver-cash-label">Full Load</span>
      <span class="driver-cash-value potential" id="dc-potential">${inr(t.tripPotential)}</span>
    </div>
  </div>

  <!-- Stage Fare Slab Reference -->
  <div class="driver-slab-section" role="region" aria-label="Stage fare reference">
    <div class="driver-slab-header">Stage Fare Reference — SRO-97 / J&amp;K SRTA</div>
    <table class="driver-slab-table">
      <thead>
        <tr>
          <th scope="col">Distance</th>
          <th scope="col">Fare</th>
        </tr>
      </thead>
      <tbody>${buildSlabRows()}</tbody>
    </table>
  </div>

  <!-- New Trip Reset -->
  <button class="driver-new-trip-btn" id="driver-new-trip-btn" type="button">
    ↺ Start New Trip
  </button>

</div>`;
  }

  /* ─────────────────────────────────────────────────────────────────
     DOM PATCHING (surgical updates — no full rerender)
  ───────────────────────────────────────────────────────────────── */

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function patchTariffCard() {
    const fare      = getFare();
    const route     = getRoute();
    const vehicle   = getVehicle();
    const routeName = route ? route.name : 'Custom Route';
    const fareStr   = fareDisplay(fare);

    setText('tariff-fare-number',  fareStr);
    setText('tariff-route-name',   routeName);
    setText('tariff-vehicle-name', vehicle.label);
    setText('overlay-fare-amount', fareStr);
    setText('overlay-route-name',  routeName);
    setText('overlay-vehicle-name',vehicle.label);
  }

  function patchSeatGrid() {
    const grid = document.getElementById('driver-seat-grid');
    if (!grid) return;
    grid.setAttribute('data-capacity', state.capacity);
    grid.innerHTML = buildSeatGrid();
  }

  function patchTotals() {
    const t = computeTotals();
    setText('dt-paid',      `${t.paid}/${t.capacity}`);
    setText('dt-unpaid',    t.unpaid);
    setText('dt-vacant',    t.vacant);
    setText('dc-collected', inr(t.cashCollected));
    setText('dc-due',       inr(t.cashDue));
    setText('dc-potential', inr(t.tripPotential));
  }

  function patchOneSeat(idx) {
    const s   = state.seats[idx];
    const btn = document.querySelector(`[data-seat-index="${idx}"]`);
    if (!btn) return;
    btn.className = `driver-seat-btn ${SEAT_CLASSES[s]}`;
    btn.setAttribute('aria-label', `Seat ${idx + 1}, ${SEAT_CLASSES[s]}`);
    btn.querySelector('.seat-icon').textContent = SEAT_ICONS[s];
  }

  /* ─────────────────────────────────────────────────────────────────
     ACTIONS
  ───────────────────────────────────────────────────────────────── */

  function cycleSeat(idx) {
    if (idx < 0 || idx >= state.seats.length) return;
    state.seats[idx] = (state.seats[idx] + 1) % 3;
    patchOneSeat(idx);
    patchTotals();
  }

  function resetTrip() {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Clear all passenger tallies for a new trip?')) return;
    initSeats();
    patchSeatGrid();
    patchTotals();
  }

  function showOverlay() {
    const overlay = document.getElementById('driver-tariff-overlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      // Focus the close button for accessibility
      const closeBtn = document.getElementById('driver-overlay-close-btn');
      if (closeBtn) closeBtn.focus();
    }
  }

  function hideOverlay() {
    const overlay = document.getElementById('driver-tariff-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     EVENT HANDLERS (delegated from #tab-content-driver)
  ───────────────────────────────────────────────────────────────── */

  function handleClick(e) {
    // Seat tap
    const seatBtn = e.target.closest('[data-seat-index]');
    if (seatBtn) {
      cycleSeat(parseInt(seatBtn.dataset.seatIndex, 10));
      return;
    }
    if (e.target.closest('#driver-show-tariff-btn'))    { showOverlay(); return; }
    if (e.target.closest('#driver-overlay-close-btn'))  { hideOverlay(); return; }
    if (e.target.closest('#driver-new-trip-btn'))       { resetTrip();   return; }
  }

  function handleChange(e) {
    const { id, value } = e.target;

    if (id === 'driver-vehicle-sel') {
      state.vehicleId = value;
      state.capacity  = getVehicle().capacity;
      // Rebuild capacity dropdown for new vehicle
      const capSel = document.getElementById('driver-capacity-sel');
      if (capSel) capSel.innerHTML = buildCapacityOptions();
      initSeats();
      patchSeatGrid();
      patchTariffCard();
      patchTotals();
      return;
    }

    if (id === 'driver-capacity-sel') {
      state.capacity = parseInt(value, 10);
      initSeats();
      patchSeatGrid();
      patchTotals();
      return;
    }

    if (id === 'driver-route-sel') {
      state.routeId = value;
      const customRow = document.getElementById('driver-custom-row');
      if (customRow) customRow.classList.toggle('visible', value === 'custom');
      patchTariffCard();
      patchTotals();
      return;
    }
  }

  function handleInput(e) {
    if (e.target.id === 'driver-custom-fare') {
      state.customFare = parseInt(e.target.value, 10) || 0;
      patchTariffCard();
      patchTotals();
    }
  }

  // Escape key closes the overlay
  function handleKeyDown(e) {
    if (e.key === 'Escape') hideOverlay();
  }

  /* ─────────────────────────────────────────────────────────────────
     BIND / UNBIND
  ───────────────────────────────────────────────────────────────── */

  function bindAll() {
    const root = document.getElementById('tab-content-driver');
    if (!root) return;
    // Remove any prior listeners to prevent stacking on repeated init() calls
    root.removeEventListener('click',   handleClick);
    root.removeEventListener('change',  handleChange);
    root.removeEventListener('input',   handleInput);

    root.addEventListener('click',   handleClick);
    root.addEventListener('change',  handleChange);
    root.addEventListener('input',   handleInput);

    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
  }

  /* ─────────────────────────────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────────────────────────────── */

  /**
   * SafarDriverMode.init()
   * Call when the Driver Mode tab becomes visible.
   * Idempotent: seat state is preserved across tab switches;
   * seats only reset on "Start New Trip".
   */
  function init() {
    const wrapper = document.getElementById('tab-content-driver');
    if (!wrapper) {
      console.warn('[SafarDriverMode] #tab-content-driver not found in DOM.');
      return;
    }

    // First init: seed seats. Subsequent tab activations preserve state.
    if (!state.initialized || state.seats.length !== state.capacity) {
      initSeats();
      state.initialized = true;
    }

    wrapper.innerHTML = buildDashboard();
    bindAll();
  }

  return { init };

})();
