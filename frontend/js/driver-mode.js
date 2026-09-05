/**
 * SAFAR PRO — Driver & Conductor Mode
 * =====================================
 * File: frontend/js/driver-mode.js
 * Architecture: Offline-first PWA, SafeStorage, Drive Safe Lock,
 * QR Dispute Resolution, Expense Ledger, Net Profit & Multi-Tab Sync.
 * Styled to mirror Page 1 (Fare Calculator) visual design system.
 */

const SafarDriverMode = (() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     STATIC DATA & CONFIGURATION
  ───────────────────────────────────────────────────────────────── */

  const VEHICLES = [
    { id: 'sumo',    label: 'Sumo / Max Cab',      capacity: 7,  standardCapacity: 7,  capacityOptions: [5, 6, 7, 8, 9, 10] },
    { id: 'matador', label: 'Matador / Tempo 407',  capacity: 18, standardCapacity: 20, capacityOptions: [16, 18, 20, 22, 24, 26, 28] },
    { id: 'magic',   label: 'Tata Magic',            capacity: 7,  standardCapacity: 7,  capacityOptions: [6, 7, 8, 9, 10] },
    { id: 'auto',    label: 'Auto Rickshaw',          capacity: 3,  standardCapacity: 3,  capacityOptions: [2, 3, 4] },
    { id: 'bus',     label: 'Private Bus',            capacity: 40, standardCapacity: 42, capacityOptions: [32, 36, 40, 44, 48, 52] },
  ];

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

  const VEHICLE_STAGE_CONFIG = {
    sumo: {
      title: 'Sumo / Maxi-Cab Stage Fares',
      rule: 'Inter-district stage tariff & way-drop rates (per passenger seat)',
      chip: 'Per Seat Drop',
      basis: 'Per Passenger',
      slabs: [
        { min: 0,   max: 5,   fare: 30 },
        { min: 5,   max: 10,  fare: 40 },
        { min: 10,  max: 15,  fare: 50 },
        { min: 15,  max: 20,  fare: 60 },
        { min: 20,  max: 25,  fare: 70 },
        { min: 25,  max: 30,  fare: 80 },
        { min: 30,  max: 40,  fare: 100 },
        { min: 40,  max: 50,  fare: 120 },
        { min: 50,  max: 60,  fare: 140 },
        { min: 60,  max: 75,  fare: 170 },
        { min: 75,  max: 90,  fare: 200 },
        { min: 90,  max: 110, fare: 240 },
      ]
    },
    matador: {
      title: 'Matador (407) Stage Fares',
      rule: '₹1.64/km per passenger (SRO-97 high-frequency stage route)',
      chip: 'Per Seat Rate',
      basis: 'Per Passenger',
      slabs: [
        { min: 0,   max: 3,   fare: 10 },
        { min: 3,   max: 5,   fare: 12 },
        { min: 5,   max: 8,   fare: 15 },
        { min: 8,   max: 12,  fare: 20 },
        { min: 12,  max: 16,  fare: 26 },
        { min: 16,  max: 20,  fare: 33 },
        { min: 20,  max: 25,  fare: 41 },
        { min: 25,  max: 30,  fare: 49 },
        { min: 30,  max: 35,  fare: 57 },
        { min: 35,  max: 40,  fare: 66 },
        { min: 40,  max: 50,  fare: 82 },
        { min: 50,  max: 60,  fare: 98 },
      ]
    },
    magic: {
      title: 'Tata Magic Stage Fares',
      rule: 'Fixed stage carriage slabs: ₹9 (3km), ₹14 (5km), ₹17 (10km)...',
      chip: 'Fixed Slabs',
      basis: 'Per Passenger',
      slabs: [
        { min: 0,   max: 3,   fare: 9 },
        { min: 3,   max: 5,   fare: 14 },
        { min: 5,   max: 10,  fare: 17 },
        { min: 10,  max: 15,  fare: 20 },
        { min: 15,  max: 20,  fare: 26 },
        { min: 20,  max: 25,  fare: 32 },
        { min: 25,  max: 30,  fare: 38 },
        { min: 30,  max: 40,  fare: 48 },
        { min: 40,  max: 50,  fare: 58 },
        { min: 50,  max: 60,  fare: 68 },
      ]
    },
    auto: {
      title: 'Auto Rickshaw Metered Fares',
      rule: '₹45 for first 2 km, then ₹7.40/km (Metered / entire auto up to 3 pax)',
      chip: 'Per Vehicle Metered',
      basis: 'Entire Auto (Up to 3)',
      slabs: [
        { min: 0,   max: 2,   fare: 45 },
        { min: 2,   max: 4,   fare: 60 },
        { min: 4,   max: 6,   fare: 75 },
        { min: 6,   max: 8,   fare: 90 },
        { min: 8,   max: 10,  fare: 104 },
        { min: 10,  max: 12,  fare: 119 },
        { min: 12,  max: 15,  fare: 141 },
        { min: 15,  max: 18,  fare: 163 },
        { min: 18,  max: 20,  fare: 178 },
        { min: 20,  max: 25,  fare: 215 },
        { min: 25,  max: 30,  fare: 252 },
      ]
    },
    bus: {
      title: 'Private Bus Stage Fares',
      rule: '₹1.40/km per passenger (Long-distance trunk stage carriage)',
      chip: 'Per Seat Trunk',
      basis: 'Per Passenger',
      slabs: [
        { min: 0,   max: 5,   fare: 8 },
        { min: 5,   max: 10,  fare: 14 },
        { min: 10,  max: 15,  fare: 21 },
        { min: 15,  max: 20,  fare: 28 },
        { min: 20,  max: 25,  fare: 35 },
        { min: 25,  max: 30,  fare: 42 },
        { min: 30,  max: 40,  fare: 56 },
        { min: 40,  max: 50,  fare: 70 },
        { min: 50,  max: 60,  fare: 84 },
        { min: 60,  max: 75,  fare: 105 },
        { min: 75,  max: 90,  fare: 126 },
        { min: 90,  max: 110, fare: 154 },
      ]
    }
  };

  const EMERGENCY_CONTACTS = [
    { name: 'National Highway Helpline', number: '1033', badge: 'NHAI / NH-44', icon: '🚨' },
    { name: 'Ambulance (J&K EMS)', number: '108', badge: 'Medical Emergency', icon: '🚑' },
    { name: 'Police / PCR Response', number: '112', badge: 'Emergency Command', icon: '🚓' },
    { name: 'Traffic Police Srinagar (Kashmir)', number: '01942450022', display: '0194-2450022', badge: 'Kashmir Valley', icon: '📞' },
    { name: 'Traffic Police Jammu', number: '01912459048', display: '0191-2459048', badge: 'Jammu Highway', icon: '📞' },
    { name: 'Disaster Management Helpline', number: '1070', badge: 'Avalanche & Snow', icon: '⛰️' },
    { name: 'Tourist Police Srinagar', number: '01942477567', display: '0194-2477567', badge: 'Tourism Assist', icon: '🛡️' },
    { name: 'Women Helpline J&K', number: '181', badge: 'Safety & Protection', icon: '🚺' },
  ];

  const S = { VACANT: 0, UNPAID: 1, PAID: 2 };
  const SEAT_CLASSES = ['vacant', 'unpaid', 'paid'];
  const SEAT_ICONS   = ['○',      '₹',      '✓'  ];

  const STORAGE_KEY_ACTIVE = 'safar_driver_active_trip';
  const STORAGE_KEY_TRIPS  = 'safar_driver_trips';
  const MAX_HISTORY_TRIPS  = 100;
  const MAX_UNDO_STACK     = 20;

  /* ─────────────────────────────────────────────────────────────────
     SAFESTORAGE ENGINE
  ───────────────────────────────────────────────────────────────── */

  class SafeStorageEngine {
    constructor() {
      this.debounceTimer = null;
      this.debounceDelay = 400; // ms
    }

    save(key, data) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        try {
          const serialized = JSON.stringify(data);
          localStorage.setItem(key, serialized);
          window.dispatchEvent(new CustomEvent('safar-driver-sync', {
            detail: { key, timestamp: Date.now() }
          }));
        } catch (err) {
          console.warn('[SafeStorage] Save error:', err);
          if (err && err.name === 'QuotaExceededError') {
            this.pruneHistory(STORAGE_KEY_TRIPS, 50);
          }
        }
      }, this.debounceDelay);
    }

    load(key, defaultValue = null) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return defaultValue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
            throw new Error('Unsafe object structure');
          }
        }
        return parsed;
      } catch (err) {
        console.warn('[SafeStorage] Recovery for key:', key, err);
        return defaultValue;
      }
    }

    pruneHistory(key, maxEntries = MAX_HISTORY_TRIPS) {
      const history = this.load(key, []);
      if (Array.isArray(history) && history.length > maxEntries) {
        const pruned = history.slice(-maxEntries);
        try {
          localStorage.setItem(key, JSON.stringify(pruned));
        } catch (e) {
          // Silent pass
        }
        return pruned;
      }
      return history;
    }
  }

  const storage = new SafeStorageEngine();

  /* ─────────────────────────────────────────────────────────────────
     BATTERY & HAPTICS
  ───────────────────────────────────────────────────────────────── */

  class BatteryController {
    constructor() {
      this.battery = null;
      this.lowPowerMode = false;
      this.init();
    }

    async init() {
      if (typeof navigator !== 'undefined' && navigator.getBattery) {
        try {
          this.battery = await navigator.getBattery();
          this.evaluate();
          this.battery.addEventListener('levelchange', () => this.evaluate());
          this.battery.addEventListener('chargingchange', () => this.evaluate());
        } catch (e) {
          // Silent pass
        }
      }
    }

    evaluate() {
      if (this.battery && this.battery.level < 0.20 && !this.battery.charging) {
        this.lowPowerMode = true;
        storage.debounceDelay = 800;
        document.body.classList.add('driver-low-power');
      } else {
        this.lowPowerMode = false;
        storage.debounceDelay = 400;
        document.body.classList.remove('driver-low-power');
      }
    }
  }

  const batteryCtrl = new BatteryController();

  function triggerHaptic(duration = 15) {
    if (batteryCtrl.lowPowerMode) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (e) {
        // Silent pass
      }
    } else {
      const pulse = document.createElement('div');
      pulse.className = 'driver-haptic-pulse';
      document.body.appendChild(pulse);
      setTimeout(() => pulse.remove(), 260);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────────────────────────── */

  const state = {
    vehicleId:        'sumo',
    capacity:         7,
    routeId:          'sgr-bar',
    customFare:       0,
    seats:            [],
    luggageCount:     0,
    parcelCount:      0,
    nightSurcharge:   false,
    expenses: {
      fuel:          0,
      tolls:         0,
      addaFees:      0,
      meals:         0,
      miscellaneous: 0,
    },
    driveLock:        false,
    privacyMode:      false,
    preTripExpanded:  false,
    preTripCheck: {
      docs:  false,
      tyres: false,
      fuel:  false,
      float: false,
    },
    undoStack:        [],
    initialized:      false,
  };

  function pushUndo() {
    state.undoStack.push(JSON.stringify({
      seats: state.seats,
      luggageCount: state.luggageCount,
      parcelCount: state.parcelCount,
      expenses: { ...state.expenses }
    }));
    if (state.undoStack.length > MAX_UNDO_STACK) {
      state.undoStack.shift();
    }
    updateUndoBtnState();
  }

  function undoLastAction() {
    if (state.undoStack.length === 0) return;
    const previous = JSON.parse(state.undoStack.pop());
    if (previous) {
      if (Array.isArray(previous.seats) && previous.seats.length === state.seats.length) {
        state.seats = previous.seats;
      }
      if (typeof previous.luggageCount === 'number') state.luggageCount = previous.luggageCount;
      if (typeof previous.parcelCount === 'number') state.parcelCount = previous.parcelCount;
      if (previous.expenses) state.expenses = { ...previous.expenses };
      triggerHaptic(25);
      patchSeatGrid();
      patchTotals();
      patchCargo();
      persistActiveTrip();
      updateUndoBtnState();
      showToast('Action undone');
    }
  }

  function updateUndoBtnState() {
    const btn = document.getElementById('driver-undo-btn');
    if (btn) {
      btn.disabled = state.undoStack.length === 0;
      btn.style.opacity = state.undoStack.length === 0 ? '0.45' : '1';
    }
  }

  function getVehicle() {
    return VEHICLES.find(v => v.id === state.vehicleId) || VEHICLES[0];
  }

  function getRoute() {
    return ROUTES.find(r => r.id === state.routeId) || null;
  }

  function getBasePerSeatFare() {
    if (state.routeId === 'custom') return state.customFare || 0;
    const route = getRoute();
    if (!route || !route.fares) return 0;
    let base = route.fares[state.vehicleId] || 0;
    if (state.nightSurcharge) {
      base = Math.round(base * 1.20);
    }
    return base;
  }

  function computeTotals() {
    const fare = getBasePerSeatFare();
    const paid = state.seats.filter(s => s === S.PAID).length;
    const unpaid = state.seats.filter(s => s === S.UNPAID).length;
    const vacant = state.seats.filter(s => s === S.VACANT).length;

    const passengerCollected = paid * fare;
    const luggageCollected = state.luggageCount * 15;
    const parcelCollected = state.parcelCount * 40;
    const grossCollection = passengerCollected + luggageCollected + parcelCollected;

    const totalExpenses = (Number(state.expenses.fuel) || 0) +
                          (Number(state.expenses.tolls) || 0) +
                          (Number(state.expenses.addaFees) || 0) +
                          (Number(state.expenses.meals) || 0) +
                          (Number(state.expenses.miscellaneous) || 0);

    const netProfit = grossCollection - totalExpenses;

    return {
      paid,
      unpaid,
      vacant,
      filled: paid + unpaid,
      capacity: state.seats.length,
      cashCollected: passengerCollected,
      cashDue: unpaid * fare,
      tripPotential: state.seats.length * fare,
      luggageCollected,
      parcelCollected,
      grossCollection,
      totalExpenses,
      netProfit,
    };
  }

  function initSeats() {
    state.seats = new Array(state.capacity).fill(S.VACANT);
  }

  function persistActiveTrip() {
    storage.save(STORAGE_KEY_ACTIVE, {
      vehicleId:      state.vehicleId,
      capacity:       state.capacity,
      routeId:        state.routeId,
      customFare:     state.customFare,
      seats:          state.seats,
      luggageCount:   state.luggageCount,
      parcelCount:    state.parcelCount,
      nightSurcharge: state.nightSurcharge,
      expenses:       state.expenses,
      driveLock:      state.driveLock,
      privacyMode:    state.privacyMode,
      preTripCheck:   state.preTripCheck,
      updatedAt:      Date.now(),
    });
  }

  function restoreActiveTrip() {
    const saved = storage.load(STORAGE_KEY_ACTIVE, null);
    if (!saved) return false;

    if (saved.vehicleId && VEHICLES.some(v => v.id === saved.vehicleId)) {
      state.vehicleId = saved.vehicleId;
    }
    if (typeof saved.capacity === 'number' && saved.capacity >= 1 && saved.capacity <= 100) {
      state.capacity = saved.capacity;
    }
    if (saved.routeId && (saved.routeId === 'custom' || ROUTES.some(r => r.id === saved.routeId))) {
      state.routeId = saved.routeId;
    }
    if (typeof saved.customFare === 'number') state.customFare = saved.customFare;
    if (Array.isArray(saved.seats) && saved.seats.length === state.capacity) {
      state.seats = saved.seats.map(s => (s === 1 ? 1 : s === 2 ? 2 : 0));
    } else {
      initSeats();
    }
    if (typeof saved.luggageCount === 'number') state.luggageCount = saved.luggageCount;
    if (typeof saved.parcelCount === 'number') state.parcelCount = saved.parcelCount;
    if (typeof saved.nightSurcharge === 'boolean') state.nightSurcharge = saved.nightSurcharge;
    if (saved.expenses && typeof saved.expenses === 'object') {
      state.expenses = {
        fuel:          Number(saved.expenses.fuel) || 0,
        tolls:         Number(saved.expenses.tolls) || 0,
        addaFees:      Number(saved.expenses.addaFees) || 0,
        meals:         Number(saved.expenses.meals) || 0,
        miscellaneous: Number(saved.expenses.miscellaneous) || 0,
      };
    }
    if (typeof saved.driveLock === 'boolean') state.driveLock = saved.driveLock;
    if (typeof saved.privacyMode === 'boolean') state.privacyMode = saved.privacyMode;
    if (saved.preTripCheck && typeof saved.preTripCheck === 'object') {
      state.preTripCheck = { ...state.preTripCheck, ...saved.preTripCheck };
    }
    return true;
  }

  /* ─────────────────────────────────────────────────────────────────
     FORMATTERS
  ───────────────────────────────────────────────────────────────── */

  function inr(n) {
    const num = Number(n) || 0;
    if (state.privacyMode) return '₹••••';
    return '₹' + num.toLocaleString('en-IN');
  }

  function fareDisplay(fare) {
    if (fare > 0) return inr(fare);
    if (state.routeId === 'custom') return '—';
    return 'Stage Slab';
  }

  function showToast(msg) {
    let toast = document.getElementById('toast');
    let toastText = document.getElementById('toast-text');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast-notification';
      toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f2bd70" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span id="toast-text"></span>`;
      document.body.appendChild(toast);
      toastText = toast.querySelector('#toast-text');
    }
    if (toastText) toastText.textContent = msg;
    toast.removeAttribute('hidden');
    toast.style.display = 'flex';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.setAttribute('hidden', '');
      toast.style.display = 'none';
    }, 2800);
  }

  /* ─────────────────────────────────────────────────────────────────
     QR GENERATOR (Level M, Version 5/6 with Fallback)
  ───────────────────────────────────────────────────────────────── */

  function generateTariffQR(routeId, fare, capacity) {
    const payload = `https://farhaan327426.github.io/SafarApp/?v=${encodeURIComponent(routeId)}&f=${fare}&c=${capacity}`;
    const textRef = `REF: SRO97-${String(routeId).toUpperCase()}-${fare}`;

    if (typeof window !== 'undefined' && typeof window.qrcode === 'function') {
      try {
        const qr = window.qrcode(5, 'M');
        qr.addData(payload);
        qr.make();
        return { svg: qr.createSvgTag(5, 4), textRef, payload };
      } catch (err) {
        try {
          const qr6 = window.qrcode(6, 'M');
          qr6.addData(payload);
          qr6.make();
          return { svg: qr6.createSvgTag(5, 4), textRef, payload };
        } catch (e) {
          console.warn('[QRCode] Fallback:', e);
        }
      }
    }

    const fallbackSVG = `<svg viewBox="0 0 160 160" width="160" height="160" xmlns="http://www.w3.org/2000/svg" style="background:#fff;border-radius:8px;padding:8px">
      <rect width="160" height="160" fill="#ffffff"/>
      <rect x="16" y="16" width="36" height="36" fill="#234b4c"/>
      <rect x="22" y="22" width="24" height="24" fill="#ffffff"/>
      <rect x="28" y="28" width="12" height="12" fill="#234b4c"/>
      <rect x="108" y="16" width="36" height="36" fill="#234b4c"/>
      <rect x="114" y="22" width="24" height="24" fill="#ffffff"/>
      <rect x="120" y="28" width="12" height="12" fill="#234b4c"/>
      <rect x="16" y="108" width="36" height="36" fill="#234b4c"/>
      <rect x="22" y="114" width="24" height="24" fill="#ffffff"/>
      <rect x="28" y="120" width="12" height="12" fill="#234b4c"/>
      <circle cx="80" cy="80" r="14" fill="#d36b3d"/>
      <text x="80" y="85" font-family="sans-serif" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">SRO</text>
      <text x="80" y="152" font-family="sans-serif" font-size="8" font-weight="700" fill="#234b4c" text-anchor="middle">OFFICIAL TARIFF</text>
    </svg>`;
    return { svg: fallbackSVG, textRef, payload };
  }

  /* ─────────────────────────────────────────────────────────────────
     CSV EXPORT & JSON IMPORT
  ───────────────────────────────────────────────────────────────── */

  function sanitizeCSVCell(value) {
    const str = String(value == null ? '' : value).trim();
    if (/^[=+\-@]/.test(str)) {
      return `"'${str.replace(/"/g, '""')}"`;
    }
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportShiftCSV() {
    const trips = storage.load(STORAGE_KEY_TRIPS, []);
    if (!Array.isArray(trips) || trips.length === 0) {
      alert('No completed trips in history to export.');
      return;
    }

    const headers = [
      'Date (ISO)', 'Route', 'Vehicle', 'Passengers', 'Luggage Bags', 'Parcels', 
      'Gross Collection (INR)', 'Fuel (INR)', 'Tolls (INR)', 'Adda Fee (INR)', 
      'Total Expenses (INR)', 'Net In-Pocket (INR)'
    ];

    const rows = trips.map(t => [
      new Date(t.timestamp).toISOString(),
      t.route,
      t.vehicle,
      t.passengerCount,
      t.luggageCount || 0,
      t.parcelCount || 0,
      t.grossCollection || 0,
      t.expenses?.fuel || 0,
      t.expenses?.tolls || 0,
      t.expenses?.addaFees || 0,
      t.totalExpenses || 0,
      t.netProfit || 0
    ]);

    const csvBody = [
      headers.map(sanitizeCSVCell).join(','),
      ...rows.map(r => r.map(sanitizeCSVCell).join(','))
    ].join('\r\n');

    const csvContent = '\uFEFF' + csvBody;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `SafarApp_Shift_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showToast('Shift CSV exported safely');
  }

  function exportBackupJSON() {
    const trips = storage.load(STORAGE_KEY_TRIPS, []);
    const active = storage.load(STORAGE_KEY_ACTIVE, {});
    const backupData = {
      app: 'SafarApp Driver Mode',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      activeTrip: active,
      trips: Array.isArray(trips) ? trips : []
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `SafarApp_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showToast('Backup JSON exported');
  }

  function handleImportJSON(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Error: Import file exceeds 2MB maximum size limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const data = JSON.parse(text);

        if (!data || typeof data !== 'object') throw new Error('Invalid JSON format');
        if ('__proto__' in data || 'constructor' in data || 'prototype' in data) {
          throw new Error('Malicious payload detected');
        }

        if (!Array.isArray(data.trips)) {
          throw new Error('Missing "trips" array in backup file.');
        }

        const sanitizedTrips = [];
        for (const t of data.trips) {
          if (!t || typeof t !== 'object') continue;
          const passengers = Number(t.passengerCount) || 0;
          const gross = Number(t.grossCollection) || 0;
          if (passengers < 0 || passengers > 100) continue;
          if (gross < 0 || gross > 50000) continue;

          sanitizedTrips.push({
            id: t.id || 'trip_' + Math.random().toString(36).slice(2, 9),
            timestamp: typeof t.timestamp === 'number' ? t.timestamp : Date.now(),
            route: String(t.route || 'Route').slice(0, 80),
            vehicle: String(t.vehicle || 'Sumo').slice(0, 40),
            passengerCount: passengers,
            luggageCount: Number(t.luggageCount) || 0,
            parcelCount: Number(t.parcelCount) || 0,
            grossCollection: gross,
            totalExpenses: Number(t.totalExpenses) || 0,
            netProfit: Number(t.netProfit) || 0,
            expenses: t.expenses && typeof t.expenses === 'object' ? {
              fuel: Number(t.expenses.fuel) || 0,
              tolls: Number(t.expenses.tolls) || 0,
              addaFees: Number(t.expenses.addaFees) || 0,
              meals: Number(t.expenses.meals) || 0,
              miscellaneous: Number(t.expenses.miscellaneous) || 0
            } : {}
          });
        }

        if (sanitizedTrips.length === 0) {
          alert('No valid trip records found in backup.');
          return;
        }

        renderImportPreviewModal(sanitizedTrips);
      } catch (err) {
        alert('Import failed: ' + (err.message || 'Corrupted file'));
      }
    };
    reader.readAsText(file);
  }

  function commitImport(tripsToMerge) {
    const existing = storage.load(STORAGE_KEY_TRIPS, []);
    const existingIds = new Set(existing.map(t => t.id || t.timestamp));
    const newItems = tripsToMerge.filter(t => !existingIds.has(t.id || t.timestamp));
    const merged = [...existing, ...newItems].slice(-MAX_HISTORY_TRIPS);
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(merged));
    showToast(`Successfully imported ${newItems.length} trips.`);
    closeImportPreviewModal();
    renderShiftModal();
  }

  /* ─────────────────────────────────────────────────────────────────
     HTML BUILDERS (Mirrored directly from Tab 1 style language)
  ───────────────────────────────────────────────────────────────── */

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

  function buildQuickCorridorPills() {
    return ROUTES.filter(r => r.id !== 'custom').slice(0, 6).map(r => `
      <button class="corridor-pill${r.id === state.routeId ? ' active' : ''}" data-corridor-id="${r.id}" type="button">
        ${r.name}
      </button>
    `).join('');
  }

  function buildSeatGrid() {
    return state.seats.map((s, i) =>
      `<button class="driver-seat-btn ${SEAT_CLASSES[s]}${state.driveLock ? ' locked' : ''}"
               data-seat-index="${i}"
               type="button"
               ${state.driveLock ? 'disabled aria-disabled="true"' : ''}
               aria-label="Seat ${i + 1}, ${SEAT_CLASSES[s]}">
        <span class="seat-num">${i + 1}</span>
        <span class="seat-icon">${SEAT_ICONS[s]}</span>
      </button>`
    ).join('');
  }

  function getStageConfig(vId = state.vehicleId) {
    return VEHICLE_STAGE_CONFIG[vId] || VEHICLE_STAGE_CONFIG.sumo;
  }

  function buildSlabRows(vId = state.vehicleId) {
    const cfg = getStageConfig(vId);
    return cfg.slabs.map(sl =>
      `<tr>
        <td>${sl.min}–${sl.max} km</td>
        <td class="slab-fare">${inr(sl.fare)} <span class="slab-basis">${cfg.basis === 'Per Passenger' ? '(Seat)' : '(Auto)'}</span></td>
      </tr>`
    ).join('');
  }

  function buildEmergencyList() {
    return EMERGENCY_CONTACTS.map(c => `
      <div class="driver-emergency-item">
        <div class="emergency-icon-box">${c.icon}</div>
        <div class="emergency-info">
          <div class="emergency-title">${c.name}</div>
          <div class="emergency-badge">${c.badge}</div>
        </div>
        <a href="tel:${c.number}" class="emergency-dial-btn" aria-label="Call ${c.name}">
          📞 ${c.display || c.number}
        </a>
      </div>
    `).join('');
  }

  function buildPreTripCard() {
    const c = state.preTripCheck;
    return `
    <div class="driver-pretrip-card">
      <div class="driver-pretrip-header" id="driver-pretrip-toggle">
        <div class="pretrip-title-wrap">
          <span class="pretrip-icon">📋</span>
          <strong>Pre-Trip Vehicle Readiness Checklist</strong>
        </div>
        <span class="pretrip-toggle-icon">${state.preTripExpanded ? '▲' : '▼'}</span>
      </div>
      <div class="driver-pretrip-body${state.preTripExpanded ? ' expanded' : ''}">
        <label class="driver-check-item">
          <input type="checkbox" id="check-docs" ${c.docs ? 'checked' : ''}>
          <span>RC, Insurance &amp; Route Permit in vehicle</span>
        </label>
        <label class="driver-check-item">
          <input type="checkbox" id="check-tyres" ${c.tyres ? 'checked' : ''}>
          <span>Tyre pressure &amp; Spare wheel inspected</span>
        </label>
        <label class="driver-check-item">
          <input type="checkbox" id="check-fuel" ${c.fuel ? 'checked' : ''}>
          <span>Fuel adequate &amp; Snow chains onboard (winter)</span>
        </label>
        <label class="driver-check-item">
          <input type="checkbox" id="check-float" ${c.float ? 'checked' : ''}>
          <span>Cash change float ready (₹10 / ₹20 notes)</span>
        </label>
        <div class="driver-pretrip-disclaimer">
          ⚠️ <em>Basic operator guidance aid — not a substitute for statutory RTO inspection or certified mechanical fitness.</em>
        </div>
      </div>
    </div>`;
  }

  /* Main dashboard HTML — formatted directly like Tab 1 (Fare Calculator) */
  function buildDashboard() {
    const t         = computeTotals();
    const fare      = getBasePerSeatFare();
    const route     = getRoute();
    const vehicle   = getVehicle();
    const routeName = route ? route.name : 'Custom Route';
    const fareStr   = fareDisplay(fare);
    const isOverload = state.capacity > vehicle.standardCapacity;
    const overloadDiff = state.capacity - vehicle.standardCapacity;

    return `
<!-- ── Fullscreen "Show Passenger" Overlay with Offline QR ─────── -->
<div id="driver-tariff-overlay" role="dialog" aria-modal="true" aria-label="Official Statutory Tariff">
  <button class="driver-overlay-close" id="driver-overlay-close-btn" type="button" aria-label="Close">✕</button>
  
  <div class="driver-overlay-header">
    <div class="driver-overlay-govt">Government of Jammu &amp; Kashmir</div>
    <div class="driver-overlay-dept">State Road Transport Authority (SRTA)</div>
  </div>

  <div class="driver-overlay-fare-label">Official Statutory Tariff — SRO-97</div>
  <div class="driver-overlay-fare-amount" id="overlay-fare-amount">${fareStr}</div>
  <div class="driver-overlay-per-seat">per seat / per passenger</div>
  <div class="driver-overlay-route" id="overlay-route-name">${routeName}</div>
  <div class="driver-overlay-vehicle" id="overlay-vehicle-name">${vehicle.label}</div>

  <div class="driver-qr-container">
    <div id="driver-qr-svg-wrap"></div>
    <div class="driver-qr-ref" id="driver-qr-ref-code">REF: SRO97-${String(state.routeId).toUpperCase()}-${fare}</div>
    <div class="driver-qr-note">Scan with smartphone camera to verify statutory fare independently</div>
  </div>

  <div class="driver-overlay-stamp">
    Statutory Fare under J&amp;K Motor Vehicles Rules / SRO-97.<br>
    Overcharging is a punishable offence under MVA. For disputes call Passenger Helpline: <strong>1033</strong>
  </div>
</div>

<!-- ── Emergency Directory Modal ───────────────────────────────── -->
<div id="driver-emergency-modal" class="driver-modal-overlay" role="dialog" aria-modal="true" hidden>
  <div class="driver-modal-box">
    <div class="driver-modal-header">
      <div class="modal-title-box">
        <span class="modal-icon">🚨</span>
        <h3>J&amp;K Emergency &amp; Highway Contacts</h3>
      </div>
      <button class="driver-modal-close" id="close-emergency-modal-btn" type="button">✕</button>
    </div>
    <div class="driver-modal-content">
      ${buildEmergencyList()}
    </div>
  </div>
</div>

<!-- ── Expense Tracker Modal ───────────────────────────────────── -->
<div id="driver-expense-modal" class="driver-modal-overlay" role="dialog" aria-modal="true" hidden>
  <div class="driver-modal-box">
    <div class="driver-modal-header">
      <div class="modal-title-box">
        <span class="modal-icon">⛽</span>
        <h3>Operating Expenses &amp; Outgoings</h3>
      </div>
      <button class="driver-modal-close" id="close-expense-modal-btn" type="button">✕</button>
    </div>
    <div class="driver-modal-content">
      <div class="driver-field">
        <label class="field-label">Fuel (Diesel / Petrol) ₹</label>
        <input class="driver-input" type="number" id="exp-fuel" value="${state.expenses.fuel || ''}" placeholder="0" min="0">
      </div>
      <div class="driver-field" style="margin-top:10px;">
        <label class="field-label">NH-44 Toll Plazas (Chenani/Banihal) ₹</label>
        <input class="driver-input" type="number" id="exp-tolls" value="${state.expenses.tolls || ''}" placeholder="0" min="0">
      </div>
      <div class="driver-field" style="margin-top:10px;">
        <label class="field-label">Adda / Union Fee &amp; Commission ₹</label>
        <input class="driver-input" type="number" id="exp-adda" value="${state.expenses.addaFees || ''}" placeholder="0" min="0">
      </div>
      <div class="driver-field" style="margin-top:10px;">
        <label class="field-label">Tea, Meals &amp; Refreshments ₹</label>
        <input class="driver-input" type="number" id="exp-meals" value="${state.expenses.meals || ''}" placeholder="0" min="0">
      </div>
      <div class="driver-field" style="margin-top:10px;">
        <label class="field-label">Maintenance / Challan / Misc ₹</label>
        <input class="driver-input" type="number" id="exp-misc" value="${state.expenses.miscellaneous || ''}" placeholder="0" min="0">
      </div>
      <div class="expense-summary-box">
        <div class="exp-sum-row">
          <span>Total Outgoings:</span>
          <strong id="exp-modal-total">${inr(t.totalExpenses)}</strong>
        </div>
        <div class="exp-sum-row highlight">
          <span>Net In-Pocket Profit:</span>
          <strong id="exp-modal-net">${inr(t.netProfit)}</strong>
        </div>
      </div>
      <button class="primary-btn full-width" id="save-expense-btn" type="button" style="margin-top:16px;">Save &amp; Update Ledger</button>
    </div>
  </div>
</div>

<!-- ── Shift Ledger Modal ──────────────────────────────────────── -->
<div id="driver-shift-modal" class="driver-modal-overlay" role="dialog" aria-modal="true" hidden>
  <div class="driver-modal-box large">
    <div class="driver-modal-header">
      <div class="modal-title-box">
        <span class="modal-icon">📊</span>
        <h3>Daily Shift Ledger &amp; Archives</h3>
      </div>
      <button class="driver-modal-close" id="close-shift-modal-btn" type="button">✕</button>
    </div>
    <div class="driver-modal-content" id="shift-modal-body"></div>
  </div>
</div>

<!-- ── Import Preview Modal ────────────────────────────────────── -->
<div id="driver-import-modal" class="driver-modal-overlay" role="dialog" aria-modal="true" hidden>
  <div class="driver-modal-box">
    <div class="driver-modal-header">
      <div class="modal-title-box">
        <span class="modal-icon">📥</span>
        <h3>Confirm Backup Import</h3>
      </div>
      <button class="driver-modal-close" id="close-import-modal-btn" type="button">✕</button>
    </div>
    <div class="driver-modal-content" id="import-modal-body"></div>
  </div>
</div>

<!-- ── Hero Header Card (Mirrors Page 1 Hero) ──────────────────── -->
<div class="hero-card driver-hero">
  <div class="hero-content">
    <div class="hero-tag">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>Driver &amp; Conductor Console</span>
    </div>
    <h1>Driver Console</h1>
    <p>Statutory J&amp;K SRTA tariffs, live conductor seat tally, and cargo tracking.</p>
    <div class="hero-subchip-row">
      <span class="hero-subchip">100% Offline PWA</span>
      <span class="hero-subchip">MVA Sec 194A Advisory</span>
    </div>
  </div>
  <div class="hero-mountain-bg"></div>
</div>

<!-- ── Quick Corridor Pills Bar (Mirrors Page 1 Popular Trips) ─── -->
<div class="quick-corridors-bar">
  <span class="corridors-label">Popular Corridors:</span>
  <div class="corridors-scroll" id="driver-quick-corridors">
    ${buildQuickCorridorPills()}
  </div>
</div>

<!-- ── Main 2-Column Calculator Grid (Mirrors Page 1 Layout) ───── -->
<div class="calculator-grid driver-grid">

  <!-- Left Column: Inputs & Tallies (7 cols) -->
  <div class="calc-inputs-col">

    <!-- Step 1: Vehicle & Route Configuration -->
    <div class="card-box">
      <div class="card-header">
        <div class="step-badge">1</div>
        <div class="header-titles">
          <h2>Vehicle &amp; Route Configuration</h2>
          <p>Commercial vehicle mode and authorized adda corridor</p>
        </div>
        <span class="chip-sm">Commercial Permit</span>
      </div>

      <!-- Overload Alert Banner (if capacity > standard) -->
      <div class="driver-overload-banner${isOverload ? ' visible' : ''}" id="driver-overload-banner" role="alert">
        <span class="caution-icon">⚠️</span>
        <div class="overload-text">
          <strong>Permit Capacity Exceeded (+${overloadDiff} seats above RTO rating)</strong>
          <p>MVA Section 194A advisory: carriage of excess passengers risks ₹200/excess passenger challan.</p>
        </div>
      </div>

      <div class="route-input-row" style="margin-bottom: 12px;">
        <div class="input-field">
          <label class="field-label origin"><span class="dot-orange"></span> Vehicle Mode</label>
          <div class="input-icon-wrap">
            <select class="driver-select" id="driver-vehicle-sel" aria-label="Select vehicle type">
              ${buildVehicleOptions()}
            </select>
          </div>
        </div>

        <div class="input-field">
          <label class="field-label dest"><span class="dot-green"></span> Seating Capacity</label>
          <div class="input-icon-wrap">
            <select class="driver-select" id="driver-capacity-sel" aria-label="Select seat capacity">
              ${buildCapacityOptions()}
            </select>
          </div>
        </div>
      </div>

      <div class="input-field" style="margin-top: 14px;">
        <label class="field-label dest"><span class="dot-green"></span> Route Corridor (Adda)</label>
        <div class="input-icon-wrap">
          <select class="driver-select" id="driver-route-sel" aria-label="Select route corridor">
            ${buildRouteOptions()}
          </select>
        </div>
      </div>

      <div class="driver-custom-fare-row${state.routeId === 'custom' ? ' visible' : ''}" id="driver-custom-row" style="margin-top: 12px;">
        <label class="field-label">Custom Per-Seat Fare (₹)</label>
        <div class="input-icon-wrap">
          <input class="driver-input" type="number" id="driver-custom-fare"
                 placeholder="Enter per-seat fare" inputmode="numeric" min="0"
                 value="${state.customFare || ''}">
        </div>
      </div>
    </div>

    <!-- Step 2: Passenger Seat Tally & Cargo -->
    <div class="card-box">
      <div class="card-header">
        <div class="step-badge">2</div>
        <div class="header-titles">
          <h2>Passenger Seat Tally &amp; Cargo</h2>
          <p>Tap seats to cycle status: Empty → Due → Paid</p>
        </div>
        <button class="lock-toggle-pill${state.driveLock ? ' active' : ''}" id="driver-lock-toggle-btn" type="button">
          ${state.driveLock ? '🔒 Drive Locked' : '🔓 Tap to Lock'}
        </button>
      </div>

      <!-- Drive Safe Lock Active Shield Banner -->
      <div class="driver-safety-banner${state.driveLock ? ' active' : ''}" id="driver-safety-banner">
        <div class="safety-banner-content">
          <span class="shield-icon">🔒</span>
          <div>
            <strong>DRIVE SAFE LOCK ACTIVE</strong>
            <p>Seat taps disabled to avoid accidental touches on mountain road bumps.</p>
          </div>
        </div>
        <button class="driver-unlock-btn" id="driver-unlock-btn" type="button">
          🔓 Tap to Unlock at Stand
        </button>
      </div>

      <!-- Conductor Seat Tally Section -->
      <div class="driver-seat-section">
        <div class="driver-seat-header">
          <span class="driver-seat-title">Conductor Tally</span>
          <div class="driver-seat-legend" aria-hidden="true">
            <span class="driver-legend-item"><span class="driver-legend-dot paid"></span>Paid</span>
            <span class="driver-legend-item"><span class="driver-legend-dot unpaid"></span>Due</span>
            <span class="driver-legend-item"><span class="driver-legend-dot vacant"></span>Empty</span>
          </div>
        </div>

        <div class="driver-seat-grid" id="driver-seat-grid" data-capacity="${state.capacity}">
          ${buildSeatGrid()}
        </div>

        <div class="driver-totals-bar">
          <div class="driver-total-stat">
            <span class="driver-total-value green" id="dt-paid">${t.paid}/${t.capacity}</span>
            <span class="driver-total-label">Paid Seats</span>
          </div>
          <div class="driver-total-stat">
            <span class="driver-total-value amber" id="dt-unpaid">${t.unpaid}</span>
            <span class="driver-total-label">Due (Pending)</span>
          </div>
          <div class="driver-total-stat">
            <span class="driver-total-value" id="dt-vacant">${t.vacant}</span>
            <span class="driver-total-label">Vacant</span>
          </div>
        </div>
      </div>

      <!-- Cargo Addons & Mountain Surcharge Bar -->
      <div class="driver-cargo-bar" style="margin-top: 18px;">
        <div class="cargo-item">
          <span class="cargo-label">🧳 Luggage (+₹15/bag)</span>
          <div class="cargo-stepper">
            <button type="button" class="stepper-btn" id="luggage-dec">−</button>
            <span class="stepper-val" id="luggage-val">${state.luggageCount}</span>
            <button type="button" class="stepper-btn" id="luggage-inc">+</button>
          </div>
        </div>
        <div class="cargo-item">
          <span class="cargo-label">📦 Parcels (+₹40/box)</span>
          <div class="cargo-stepper">
            <button type="button" class="stepper-btn" id="parcel-dec">−</button>
            <span class="stepper-val" id="parcel-val">${state.parcelCount}</span>
            <button type="button" class="stepper-btn" id="parcel-inc">+</button>
          </div>
        </div>
        <div class="cargo-item switch-item">
          <label class="switch-wrap">
            <input type="checkbox" id="night-surcharge-toggle" ${state.nightSurcharge ? 'checked' : ''}>
            <span class="switch-slider"></span>
            <span class="switch-text">🌙 Night/Snow (+20%)</span>
          </label>
        </div>
      </div>

      <!-- Pre-Trip Readiness Checklist -->
      <div style="margin-top: 16px;">
        ${buildPreTripCard()}
      </div>

    </div>

  </div>

  <!-- Right Column: Stage Fare Reference (5 cols) -->
  <div class="calc-results-col">

    <!-- Stage Fare Slab Reference -->
    <div class="card-box" id="driver-slab-card">
      <div class="card-header">
        <div class="header-titles">
          <h3 id="driver-slab-title">${getStageConfig(state.vehicleId).title}</h3>
          <p id="driver-slab-desc">${getStageConfig(state.vehicleId).rule}</p>
        </div>
        <span class="chip-sm" id="driver-slab-chip">${getStageConfig(state.vehicleId).chip}</span>
      </div>
      <div style="max-height: 280px; overflow-y: auto;">
        <table class="driver-slab-table">
          <thead>
            <tr>
              <th scope="col">Distance</th>
              <th scope="col">Fare</th>
            </tr>
          </thead>
          <tbody id="driver-slab-tbody">${buildSlabRows(state.vehicleId)}</tbody>
        </table>
      </div>
    </div>

  </div>

</div>`;
  }

  /* ─────────────────────────────────────────────────────────────────
     DOM PATCHING
  ───────────────────────────────────────────────────────────────── */

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function patchTariffCard() {
    const fare      = getBasePerSeatFare();
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
    setText('fare-route-summary',  routeName);

    const isOverload = state.capacity > vehicle.standardCapacity;
    const banner = document.getElementById('driver-overload-banner');
    if (banner) {
      banner.classList.toggle('visible', isOverload);
      const overloadDiff = state.capacity - vehicle.standardCapacity;
      const strongEl = banner.querySelector('strong');
      if (strongEl) {
        strongEl.textContent = `Permit Capacity Exceeded (+${overloadDiff} seats above RTO rating)`;
      }
    }
  }

  function patchStageSlabs() {
    const cfg = getStageConfig(state.vehicleId);
    const tbody = document.getElementById('driver-slab-tbody');
    if (tbody) {
      tbody.innerHTML = buildSlabRows(state.vehicleId);
    }
    setText('driver-slab-title', cfg.title);
    setText('driver-slab-desc', cfg.rule);
    setText('driver-slab-chip', cfg.chip);
  }

  function patchSeatGrid() {
    const grid = document.getElementById('driver-seat-grid');
    if (!grid) return;
    grid.setAttribute('data-capacity', state.capacity);
    grid.innerHTML = buildSeatGrid();
  }

  function patchTotals() {
    const t = computeTotals();
    setText('dt-paid',        `${t.paid}/${t.capacity}`);
    setText('dt-unpaid',      t.unpaid);
    setText('dt-vacant',      t.vacant);
    setText('dc-collected',   inr(t.cashCollected));
    setText('dc-due',         inr(t.cashDue));
    setText('dc-potential',   inr(t.tripPotential));
    setText('dc-net-profit',  inr(t.netProfit));

    const netSub = document.querySelector('.net-sub');
    if (netSub) {
      netSub.textContent = `(Gross: ${inr(t.grossCollection)} − Expenses: ${inr(t.totalExpenses)})`;
    }

    setText('exp-modal-total', inr(t.totalExpenses));
    setText('exp-modal-net',   inr(t.netProfit));
  }

  function patchCargo() {
    setText('luggage-val', state.luggageCount);
    setText('parcel-val', state.parcelCount);
    const nightToggle = document.getElementById('night-surcharge-toggle');
    if (nightToggle) nightToggle.checked = state.nightSurcharge;
  }

  function patchOneSeat(idx) {
    const s   = state.seats[idx];
    const btn = document.querySelector(`[data-seat-index="${idx}"]`);
    if (!btn) return;
    btn.className = `driver-seat-btn ${SEAT_CLASSES[s]}${state.driveLock ? ' locked' : ''}`;
    btn.setAttribute('aria-label', `Seat ${idx + 1}, ${SEAT_CLASSES[s]}`);
    btn.querySelector('.seat-icon').textContent = SEAT_ICONS[s];
  }

  /* ─────────────────────────────────────────────────────────────────
     ACTIONS
  ───────────────────────────────────────────────────────────────── */

  function cycleSeat(idx) {
    if (state.driveLock) {
      showToast('Unlock Drive Safe Lock to tap seats');
      return;
    }
    if (idx < 0 || idx >= state.seats.length) return;
    pushUndo();
    state.seats[idx] = (state.seats[idx] + 1) % 3;
    triggerHaptic(15);
    patchOneSeat(idx);
    patchTotals();
    persistActiveTrip();
  }

  function markAllPaid() {
    if (state.driveLock) {
      showToast('Unlock Drive Safe Lock first');
      return;
    }
    pushUndo();
    let updated = 0;
    for (let i = 0; i < state.seats.length; i++) {
      if (state.seats[i] !== S.VACANT) {
        state.seats[i] = S.PAID;
        updated++;
      }
    }
    if (updated === 0) {
      state.seats.fill(S.PAID);
    }
    triggerHaptic(30);
    patchSeatGrid();
    patchTotals();
    persistActiveTrip();
    showToast('All passengers marked paid');
  }

  function toggleDriveLock() {
    state.driveLock = !state.driveLock;
    triggerHaptic(20);
    const banner = document.getElementById('driver-safety-banner');
    const lockBtn = document.getElementById('driver-lock-toggle-btn');
    if (banner) banner.classList.toggle('active', state.driveLock);
    if (lockBtn) {
      lockBtn.classList.toggle('active', state.driveLock);
      lockBtn.textContent = state.driveLock ? '🔒 Drive Locked' : '🔓 Tap to Lock';
    }
    patchSeatGrid();
    persistActiveTrip();
    showToast(state.driveLock ? 'Drive Safe Lock Engaged' : 'Drive Safe Lock Released');
  }

  function saveCurrentTripToLedger() {
    const t = computeTotals();
    const route = getRoute();
    const vehicle = getVehicle();

    const tripRecord = {
      id: 'trip_' + Date.now(),
      timestamp: Date.now(),
      route: route ? route.name : 'Custom Route',
      vehicle: vehicle.label,
      passengerCount: t.paid,
      luggageCount: state.luggageCount,
      parcelCount: state.parcelCount,
      grossCollection: t.grossCollection,
      totalExpenses: t.totalExpenses,
      netProfit: t.netProfit,
      expenses: { ...state.expenses }
    };

    const history = storage.load(STORAGE_KEY_TRIPS, []);
    history.push(tripRecord);
    const pruned = history.slice(-MAX_HISTORY_TRIPS);
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(pruned));

    showToast('Trip saved to Daily Shift Ledger!');

    initSeats();
    state.luggageCount = 0;
    state.parcelCount = 0;
    state.undoStack = [];
    patchCargo();
    patchSeatGrid();
    patchTotals();
    persistActiveTrip();
    updateUndoBtnState();
  }

  function resetTrip() {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Clear all passenger seat tallies for this trip?')) return;
    pushUndo();
    initSeats();
    patchSeatGrid();
    patchTotals();
    persistActiveTrip();
    showToast('Seat tallies reset');
  }

  function showOverlay() {
    const overlay = document.getElementById('driver-tariff-overlay');
    if (!overlay) return;

    const fare = getBasePerSeatFare();
    const qrData = generateTariffQR(state.routeId, fare, state.capacity);
    const qrWrap = document.getElementById('driver-qr-svg-wrap');
    const refCode = document.getElementById('driver-qr-ref-code');

    if (qrWrap) qrWrap.innerHTML = qrData.svg;
    if (refCode) refCode.textContent = qrData.textRef;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    const closeBtn = document.getElementById('driver-overlay-close-btn');
    if (closeBtn) closeBtn.focus();
  }

  function hideOverlay() {
    const overlay = document.getElementById('driver-tariff-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function openEmergencyModal() {
    const modal = document.getElementById('driver-emergency-modal');
    if (modal) {
      modal.removeAttribute('hidden');
      modal.classList.add('active');
    }
  }

  function closeEmergencyModal() {
    const modal = document.getElementById('driver-emergency-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
      modal.classList.remove('active');
    }
  }

  function openExpenseModal() {
    const modal = document.getElementById('driver-expense-modal');
    if (modal) {
      const exp = state.expenses;
      const fuelInput = document.getElementById('exp-fuel');
      const tollsInput = document.getElementById('exp-tolls');
      const addaInput = document.getElementById('exp-adda');
      const mealsInput = document.getElementById('exp-meals');
      const miscInput = document.getElementById('exp-misc');
      if (fuelInput) fuelInput.value = exp.fuel || '';
      if (tollsInput) tollsInput.value = exp.tolls || '';
      if (addaInput) addaInput.value = exp.addaFees || '';
      if (mealsInput) mealsInput.value = exp.meals || '';
      if (miscInput) miscInput.value = exp.miscellaneous || '';
      patchTotals();
      modal.removeAttribute('hidden');
      modal.classList.add('active');
    }
  }

  function closeExpenseModal() {
    const modal = document.getElementById('driver-expense-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
      modal.classList.remove('active');
    }
  }

  function renderShiftModal() {
    const modal = document.getElementById('driver-shift-modal');
    const body = document.getElementById('shift-modal-body');
    if (!modal || !body) return;

    const trips = storage.load(STORAGE_KEY_TRIPS, []);
    const totalEarnings = trips.reduce((sum, t) => sum + (Number(t.netProfit) || 0), 0);
    const totalPassengers = trips.reduce((sum, t) => sum + (Number(t.passengerCount) || 0), 0);

    let rowsHtml = '';
    if (trips.length === 0) {
      rowsHtml = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--color-text-muted)">No completed trips yet today. Tap "End Trip &amp; Save" after each run.</td></tr>`;
    } else {
      rowsHtml = trips.slice().reverse().map(t => `
        <tr>
          <td>${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td><strong>${t.route}</strong><br><small style="color:var(--color-text-muted)">${t.vehicle}</small></td>
          <td>${t.passengerCount} pax</td>
          <td>${inr(t.grossCollection)}</td>
          <td class="slab-fare" style="color:var(--color-primary);font-weight:800">${inr(t.netProfit)}</td>
        </tr>
      `).join('');
    }

    body.innerHTML = `
      <div class="shift-stats-grid">
        <div class="shift-stat-box">
          <span class="stat-num">${trips.length}</span>
          <span class="stat-lbl">Completed Trips</span>
        </div>
        <div class="shift-stat-box">
          <span class="stat-num">${totalPassengers}</span>
          <span class="stat-lbl">Passengers Carried</span>
        </div>
        <div class="shift-stat-box highlight">
          <span class="stat-num" style="color:var(--color-primary);">${inr(totalEarnings)}</span>
          <span class="stat-lbl">Net Cumulative Profit</span>
        </div>
      </div>

      <div class="shift-actions-row">
        <button class="primary-btn" id="export-shift-csv-btn" type="button">📥 Export Shift CSV</button>
        <button class="outline-btn" id="export-backup-json-btn" type="button">💾 Export Backup JSON</button>
        <label class="outline-btn" style="cursor:pointer;display:inline-flex;align-items:center;margin:0;">
          📁 Import Backup
          <input type="file" id="import-backup-file-input" accept=".json" style="display:none;">
        </label>
      </div>

      <div class="shift-table-wrap">
        <table class="driver-slab-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Route</th>
              <th>Pax</th>
              <th>Gross</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    modal.removeAttribute('hidden');
    modal.classList.add('active');

    const csvBtn = document.getElementById('export-shift-csv-btn');
    const jsonBtn = document.getElementById('export-backup-json-btn');
    const importInput = document.getElementById('import-backup-file-input');

    if (csvBtn) csvBtn.onclick = exportShiftCSV;
    if (jsonBtn) jsonBtn.onclick = exportBackupJSON;
    if (importInput) importInput.onchange = (e) => handleImportJSON(e.target.files[0]);
  }

  function closeShiftModal() {
    const modal = document.getElementById('driver-shift-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
      modal.classList.remove('active');
    }
  }

  function renderImportPreviewModal(trips) {
    const modal = document.getElementById('driver-import-modal');
    const body = document.getElementById('import-modal-body');
    if (!modal || !body) return;

    const dates = trips.map(t => new Date(t.timestamp));
    const minDate = new Date(Math.min(...dates)).toLocaleDateString();
    const maxDate = new Date(Math.max(...dates)).toLocaleDateString();
    const totalProfit = trips.reduce((sum, t) => sum + t.netProfit, 0);

    body.innerHTML = `
      <div style="padding:16px 0;font-size:14px;line-height:1.5;color:var(--color-text-main);">
        <p>Found <strong>${trips.length} trips</strong> spanning from <strong>${minDate}</strong> to <strong>${maxDate}</strong>.</p>
        <p style="margin-top:8px;">Cumulative Net Profit: <strong>${inr(totalProfit)}</strong></p>
        <p style="margin-top:12px;color:var(--color-text-muted);font-size:12px;">New records will be merged with your current history without deleting existing trips.</p>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="primary-btn full-width" id="confirm-import-btn" type="button">Confirm &amp; Merge</button>
        <button class="outline-btn" id="cancel-import-btn" type="button">Cancel</button>
      </div>
    `;

    modal.removeAttribute('hidden');
    modal.classList.add('active');

    const confirmBtn = document.getElementById('confirm-import-btn');
    const cancelBtn = document.getElementById('cancel-import-btn');
    if (confirmBtn) confirmBtn.onclick = () => commitImport(trips);
    if (cancelBtn) cancelBtn.onclick = closeImportPreviewModal;
  }

  function closeImportPreviewModal() {
    const modal = document.getElementById('driver-import-modal');
    if (modal) {
      modal.setAttribute('hidden', '');
      modal.classList.remove('active');
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     EVENT DELEGATION
  ───────────────────────────────────────────────────────────────── */

  function handleClick(e) {
    // Quick corridor pill tap
    const corridorPill = e.target.closest('[data-corridor-id]');
    if (corridorPill) {
      const routeId = corridorPill.dataset.corridorId;
      state.routeId = routeId;
      const sel = document.getElementById('driver-route-sel');
      if (sel) sel.value = routeId;
      document.querySelectorAll('#driver-quick-corridors .corridor-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.corridorId === routeId);
      });
      patchTariffCard();
      patchTotals();
      persistActiveTrip();
      showToast(`Loaded corridor: ${getRoute()?.name || routeId}`);
      return;
    }

    const seatBtn = e.target.closest('[data-seat-index]');
    if (seatBtn) {
      cycleSeat(parseInt(seatBtn.dataset.seatIndex, 10));
      return;
    }

    if (e.target.closest('#driver-show-tariff-btn'))    { showOverlay(); return; }
    if (e.target.closest('#driver-overlay-close-btn'))  { hideOverlay(); return; }
    if (e.target.closest('#driver-all-paid-btn'))       { markAllPaid(); return; }
    if (e.target.closest('#driver-undo-btn'))           { undoLastAction(); return; }
    if (e.target.closest('#driver-lock-toggle-btn') || e.target.closest('#driver-unlock-btn')) {
      toggleDriveLock();
      return;
    }
    if (e.target.closest('#driver-save-trip-btn'))      { saveCurrentTripToLedger(); return; }
    if (e.target.closest('#driver-new-trip-btn'))       { resetTrip(); return; }

    if (e.target.closest('#driver-open-emergency-btn')) { openEmergencyModal(); return; }
    if (e.target.closest('#close-emergency-modal-btn')) { closeEmergencyModal(); return; }

    if (e.target.closest('#driver-open-expenses-btn'))  { openExpenseModal(); return; }
    if (e.target.closest('#close-expense-modal-btn'))   { closeExpenseModal(); return; }

    if (e.target.closest('#driver-open-shift-btn'))     { renderShiftModal(); return; }
    if (e.target.closest('#close-shift-modal-btn'))     { closeShiftModal(); return; }

    if (e.target.closest('#close-import-modal-btn'))    { closeImportPreviewModal(); return; }

    if (e.target.closest('#driver-privacy-toggle-btn')) {
      state.privacyMode = !state.privacyMode;
      const btn = document.getElementById('driver-privacy-toggle-btn');
      if (btn) btn.textContent = state.privacyMode ? '👁️ Show' : '👁️ Mask';
      patchTotals();
      persistActiveTrip();
      return;
    }

    if (e.target.closest('#driver-pretrip-toggle')) {
      state.preTripExpanded = !state.preTripExpanded;
      const body = document.querySelector('.driver-pretrip-body');
      const icon = document.querySelector('.pretrip-toggle-icon');
      if (body) body.classList.toggle('expanded', state.preTripExpanded);
      if (icon) icon.textContent = state.preTripExpanded ? '▲' : '▼';
      return;
    }

    // Cargo Steppers
    if (e.target.closest('#luggage-inc')) {
      pushUndo();
      state.luggageCount++;
      triggerHaptic(15);
      patchCargo();
      patchTotals();
      persistActiveTrip();
      return;
    }
    if (e.target.closest('#luggage-dec')) {
      if (state.luggageCount > 0) {
        pushUndo();
        state.luggageCount--;
        triggerHaptic(15);
        patchCargo();
        patchTotals();
        persistActiveTrip();
      }
      return;
    }

    if (e.target.closest('#parcel-inc')) {
      pushUndo();
      state.parcelCount++;
      triggerHaptic(15);
      patchCargo();
      patchTotals();
      persistActiveTrip();
      return;
    }
    if (e.target.closest('#parcel-dec')) {
      if (state.parcelCount > 0) {
        pushUndo();
        state.parcelCount--;
        triggerHaptic(15);
        patchCargo();
        patchTotals();
        persistActiveTrip();
      }
      return;
    }

    if (e.target.closest('#save-expense-btn')) {
      const fuelVal = Number(document.getElementById('exp-fuel')?.value) || 0;
      const tollsVal = Number(document.getElementById('exp-tolls')?.value) || 0;
      const addaVal = Number(document.getElementById('exp-adda')?.value) || 0;
      const mealsVal = Number(document.getElementById('exp-meals')?.value) || 0;
      const miscVal = Number(document.getElementById('exp-misc')?.value) || 0;

      state.expenses = {
        fuel: fuelVal,
        tolls: tollsVal,
        addaFees: addaVal,
        meals: mealsVal,
        miscellaneous: miscVal,
      };
      closeExpenseModal();
      patchTotals();
      persistActiveTrip();
      showToast('Operating expenses updated');
      return;
    }
  }

  function handleChange(e) {
    const { id, value } = e.target;

    if (id === 'driver-vehicle-sel') {
      state.vehicleId = value;
      state.capacity  = getVehicle().capacity;
      const capSel = document.getElementById('driver-capacity-sel');
      if (capSel) capSel.innerHTML = buildCapacityOptions();
      initSeats();
      patchSeatGrid();
      patchTariffCard();
      patchTotals();
      patchStageSlabs();
      persistActiveTrip();
      return;
    }

    if (id === 'driver-capacity-sel') {
      state.capacity = parseInt(value, 10);
      initSeats();
      patchSeatGrid();
      patchTariffCard();
      patchTotals();
      persistActiveTrip();
      return;
    }

    if (id === 'driver-route-sel') {
      state.routeId = value;
      const customRow = document.getElementById('driver-custom-row');
      if (customRow) customRow.classList.toggle('visible', value === 'custom');
      document.querySelectorAll('#driver-quick-corridors .corridor-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.corridorId === value);
      });
      patchTariffCard();
      patchTotals();
      persistActiveTrip();
      return;
    }

    if (id === 'night-surcharge-toggle') {
      pushUndo();
      state.nightSurcharge = e.target.checked;
      triggerHaptic(15);
      patchTariffCard();
      patchTotals();
      persistActiveTrip();
      return;
    }

    if (id === 'check-docs')  { state.preTripCheck.docs  = e.target.checked; persistActiveTrip(); }
    if (id === 'check-tyres') { state.preTripCheck.tyres = e.target.checked; persistActiveTrip(); }
    if (id === 'check-fuel')  { state.preTripCheck.fuel  = e.target.checked; persistActiveTrip(); }
    if (id === 'check-float') { state.preTripCheck.float = e.target.checked; persistActiveTrip(); }
  }

  function handleInput(e) {
    if (e.target.id === 'driver-custom-fare') {
      state.customFare = parseInt(e.target.value, 10) || 0;
      patchTariffCard();
      patchTotals();
      persistActiveTrip();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      hideOverlay();
      closeEmergencyModal();
      closeExpenseModal();
      closeShiftModal();
      closeImportPreviewModal();
    }
  }

  function handleStorageSync(e) {
    if (e.key === STORAGE_KEY_ACTIVE || e.type === 'safar-driver-sync') {
      restoreActiveTrip();
      patchSeatGrid();
      patchTariffCard();
      patchStageSlabs();
      patchTotals();
      patchCargo();
    }
  }

  function bindAll() {
    const root = document.getElementById('tab-content-driver');
    if (!root) return;

    root.removeEventListener('click',   handleClick);
    root.removeEventListener('change',  handleChange);
    root.removeEventListener('input',   handleInput);

    root.addEventListener('click',   handleClick);
    root.addEventListener('change',  handleChange);
    root.addEventListener('input',   handleInput);

    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);

    window.removeEventListener('storage', handleStorageSync);
    window.removeEventListener('safar-driver-sync', handleStorageSync);
    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('safar-driver-sync', handleStorageSync);
  }

  function init() {
    const wrapper = document.getElementById('tab-content-driver');
    if (!wrapper) {
      console.warn('[SafarDriverMode] #tab-content-driver not found.');
      return;
    }

    if (!state.initialized) {
      const restored = restoreActiveTrip();
      if (!restored || state.seats.length !== state.capacity) {
        initSeats();
      }
      state.initialized = true;
    }

    wrapper.innerHTML = buildDashboard();
    bindAll();
    updateUndoBtnState();
  }

  return { init, state, computeTotals, exportShiftCSV, exportBackupJSON, generateTariffQR };

})();
