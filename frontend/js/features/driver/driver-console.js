/**
 * SAFAR — Driver & Conductor Console Module
 */

import { store } from '../../core/state.js';
import { triggerHaptic } from '../../core/haptics.js';
import { showToast } from '../../core/toast.js';
import { VEHICLE_CAPACITIES, GPS_STATES, DUTY_STATES } from '../../core/constants.js';

export function populateConductorRoutes() {
  const select = document.getElementById("conductorRouteSelect");
  if (!select) return;
  select.textContent = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Select Assigned Route --";
  select.appendChild(placeholder);

  const routes = window.JK_ROUTES_DB || [];
  routes.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${r.name} (${r.distance} km)`;
    select.appendChild(opt);
  });
}

export function adjustPassengerCount(delta) {
  triggerHaptic(40);
  const driverState = store.getState('driver');
  const newCount = driverState.passengerCount + delta;
  const clamped = Math.max(0, Math.min(driverState.maxCapacity, newCount));

  let newEarnings = driverState.earnings;
  if (clamped > driverState.passengerCount) {
    newEarnings += 15;
  }

  store.setState('driver', {
    passengerCount: clamped,
    earnings: newEarnings
  });

  updatePassengerDisplay();
  updateDriverStatsDisplay();
}

export function updatePassengerDisplay() {
  const driverState = store.getState('driver');
  const countEl = document.getElementById("driverPassengerCount");
  const capacityEl = document.getElementById("driverMaxCapacity");
  const btnPlus = document.getElementById("btnPassengerPlus");
  const btnMinus = document.getElementById("btnPassengerMinus");

  if (countEl) {
    countEl.textContent = String(driverState.passengerCount);
  }
  if (capacityEl) {
    capacityEl.textContent = String(driverState.maxCapacity);
  }
  if (btnPlus) {
    const atMax = driverState.passengerCount >= driverState.maxCapacity;
    btnPlus.style.opacity = atMax ? "0.4" : "1";
    btnPlus.style.cursor = atMax ? "not-allowed" : "pointer";
  }
  if (btnMinus) {
    const atZero = driverState.passengerCount <= 0;
    btnMinus.style.opacity = atZero ? "0.4" : "1";
    btnMinus.style.cursor = atZero ? "not-allowed" : "pointer";
  }
}

export function updateDriverStatsDisplay() {
  const driverState = store.getState('driver');
  const pingsEl = document.getElementById("conductorPingsCount");
  const earningsEl = document.getElementById("conductorEarnings");
  if (pingsEl) {
    pingsEl.textContent = String(driverState.pingsCount);
  }
  if (earningsEl) {
    earningsEl.textContent = driverState.authoritativeEarnings != null
      ? `₹${Number(driverState.authoritativeEarnings).toFixed(2)} (Est.)`
      : "Unavailable";
  }
}

import { sendConductorPing } from '../map/live-tracker-service.js';

let _driverShiftToken = null;
let _isSendingPing = false;

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolocation unavailable"));
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speed: Math.max(0, (pos.coords.speed || 0) * 3.6) // m/s to km/h
      }),
      reject,
      { timeout: 5000, maximumAge: 2000 }
    );
  });
}

export async function startDriverShift(vehicleNo, routeId, vehicleType, driverPin) {
  const res = await fetch('/api/v1/driver/shift/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicleNo, routeId, vehicleType, driverSecret: driverPin })
  });
  if (res.ok) {
    const json = await res.json();
    _driverShiftToken = json.data.driverToken;
    return _driverShiftToken;
  }
  throw new Error("Invalid driver PIN or unauthorized shift session");
}

export async function toggleConductorBroadcast() {
  triggerHaptic(60);
  const driverState = store.getState('driver');
  const btn = document.getElementById("btnToggleBroadcast");
  const routeSelect = document.getElementById("conductorRouteSelect");
  const vehicleNoInput = document.getElementById("conductorVehicleNo");
  const vehicleTypeSelect = document.getElementById("conductorVehicleType");
  const pinInput = document.getElementById("conductorPin");

  const vehicleNo = vehicleNoInput ? vehicleNoInput.value.trim() : "JK01-AV-9912";
  const routeId = routeSelect ? routeSelect.value : "";
  const vehicleType = vehicleTypeSelect ? vehicleTypeSelect.value : "MINI_BUS";

  if (!driverState.isBroadcasting) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      store.setState('driver', { gpsStatus: GPS_STATES.UNAVAILABLE });
      showToast("⚠️ Geolocation API is not supported on this device.", "warning");
      return;
    }

    let driverPin = pinInput ? pinInput.value.trim() : "";
    if (!driverPin && typeof window !== "undefined" && typeof window.prompt === "function") {
      driverPin = window.prompt("Enter 4-digit Driver Security PIN:");
    }

    try {
      await startDriverShift(vehicleNo, routeId, vehicleType, driverPin);
    } catch (err) {
      showToast("⚠️ Authentication failed: Invalid Driver PIN or unauthorized shift.", "warning");
      return;
    }

    store.setState('driver', {
      gpsStatus: GPS_STATES.BROADCASTING,
      dutyStatus: DUTY_STATES.ON_DUTY,
      isBroadcasting: true,
      pingsCount: driverState.pingsCount + 1
    });

    if (btn) {
      btn.textContent = "🛑 Stop GPS Broadcast (Active)";
      btn.classList.remove("btn-broadcast-idle");
      btn.classList.add("btn-broadcast-active");
    }

    updateDriverStatsDisplay();

    if (driverState.broadcastTimer) clearInterval(driverState.broadcastTimer);
    const timer = setInterval(async () => {
      const currentDriverState = store.getState('driver');
      if (!currentDriverState.isBroadcasting || !_driverShiftToken || _isSendingPing) return;

      _isSendingPing = true;
      try {
        const pos = await getCurrentPosition();
        await sendConductorPing({
          lat: pos.lat,
          lng: pos.lng,
          speed: pos.speed,
          passengerCount: currentDriverState.passengerCount,
          routeName: routeSelect ? routeSelect.options[routeSelect.selectedIndex]?.text : "J&K Transit Corridor"
        }, _driverShiftToken);

        store.setState('driver', { pingsCount: currentDriverState.pingsCount + 1 });
        updateDriverStatsDisplay();
      } catch (err) {
        store.setState('driver', { gpsStatus: GPS_STATES.INTERRUPTED });
      } finally {
        _isSendingPing = false;
      }
    }, 3000);

    store.setState('driver', { broadcastTimer: timer });
  } else {
    if (driverState.broadcastTimer) {
      clearInterval(driverState.broadcastTimer);
    }

    _driverShiftToken = null;
    _isSendingPing = false;

    store.setState('driver', {
      isBroadcasting: false,
      gpsStatus: GPS_STATES.STOPPED,
      dutyStatus: DUTY_STATES.OFF_DUTY,
      broadcastTimer: null
    });

    if (btn) {
      btn.textContent = "📡 Start GPS Broadcast";
      btn.classList.remove("btn-broadcast-active");
      btn.classList.add("btn-broadcast-idle");
    }
  }
}

export async function triggerConductorVerifyCode() {
  triggerHaptic(35);
  const input = document.getElementById("conductorVerifyInput");
  const resultEl = document.getElementById("conductorVerifyResult");
  if (!input || !resultEl) return;

  const code = input.value.trim().toUpperCase().slice(0, 50).replace(/[^A-Z0-9\-]/g, "");
  input.value = code;
  if (!code) {
    resultEl.textContent = "⚠️ Please enter a ticket or receipt code to verify.";
    resultEl.className = "verify-result error";
    return;
  }

  resultEl.textContent = "Verifying with transport authority registry...";
  resultEl.className = "verify-result info";

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    resultEl.innerHTML = `<span>📡 <strong>OFFLINE — Verification unavailable</strong>.<br>Do not display this ticket as verified. Follow authorized offline inspection procedure.</span>`;
    resultEl.className = "verify-result info";
    return;
  }

  try {
    const res = await fetch(`/api/v1/conductor/verify/${encodeURIComponent(code)}`, {
      headers: { Accept: "application/json" }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.valid || data.status === "VERIFIED" || data.success) {
        const ticketInfo = data.data || data;
        const routeName = ticketInfo.routeName || store.getState('commuter').route?.name || "J&K Regulated Corridor";
        const fare = ticketInfo.fare ? `₹${ticketInfo.fare}` : "Standard Regulated Fare";
        resultEl.textContent = `✅ VERIFIED PASS [${code}] — Route: ${routeName}, Fare: ${fare}. Authoritative record confirmed.`;
        resultEl.className = "verify-result success";
      } else {
        resultEl.textContent = `❌ INVALID TICKET [${code}] — ${data.message || "Code not recognized."}`;
        resultEl.className = "verify-result error";
      }
    } else {
      resultEl.textContent = `⚠️ Verification unavailable (HTTP ${res.status}). Inspect physical pass.`;
      resultEl.className = "verify-result error";
    }
  } catch (err) {
    resultEl.textContent = `⚠️ Network error: Verification unavailable. Please try again.`;
    resultEl.className = "verify-result error";
  }
}

export function initDriverConsole() {
  populateConductorRoutes();
  updatePassengerDisplay();
  updateDriverStatsDisplay();

  const btnPassengerMinus = document.getElementById("btnPassengerMinus");
  if (btnPassengerMinus) {
    btnPassengerMinus.addEventListener("click", () => adjustPassengerCount(-1));
  }

  const btnPassengerPlus = document.getElementById("btnPassengerPlus");
  if (btnPassengerPlus) {
    btnPassengerPlus.addEventListener("click", () => adjustPassengerCount(1));
  }

  const conductorVehicleType = document.getElementById("conductorVehicleType");
  if (conductorVehicleType) {
    conductorVehicleType.addEventListener("change", () => {
      const vType = conductorVehicleType.value;
      const maxCap = VEHICLE_CAPACITIES[vType] || 22;
      store.setState('driver', { vehicleType: vType, maxCapacity: maxCap });
      updatePassengerDisplay();
    });
  }

  const btnToggleBroadcast = document.getElementById("btnToggleBroadcast");
  if (btnToggleBroadcast) {
    btnToggleBroadcast.addEventListener("click", toggleConductorBroadcast);
  }

  const btnConductorVerifySubmit = document.getElementById("btnConductorVerifySubmit");
  if (btnConductorVerifySubmit) {
    btnConductorVerifySubmit.addEventListener("click", triggerConductorVerifyCode);
  }

  const conductorVerifyInput = document.getElementById("conductorVerifyInput");
  if (conductorVerifyInput) {
    conductorVerifyInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        triggerConductorVerifyCode();
      }
    });
  }

  const btnScanQrCode = document.getElementById("btnScanQrCode");
  if (btnScanQrCode) {
    btnScanQrCode.addEventListener("click", () => {
      triggerHaptic(30);
      if (conductorVerifyInput) {
        conductorVerifyInput.focus();
        conductorVerifyInput.placeholder = "Enter scanned QR code (e.g. TKT-9821)...";
        showToast("Ready: Enter or paste QR ticket code into the input field.", "info");
      }
    });
  }

  // End Conductor Console initialization
}

export async function markTripPaidWithNotice(tripId, upiRef = '') {
  if (!confirm("⚠️ Confirm only after payment is received. Misuse will be treated as a transport violation. Proceed to mark paid?")) {
    return false;
  }

  if (!_driverShiftToken) {
    showToast("⚠️ Valid driver shift token required.", "warning");
    return false;
  }

  try {
    const res = await fetch(`/api/v1/trips/${encodeURIComponent(tripId)}/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_driverShiftToken}`
      },
      body: JSON.stringify({ upiRef })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to mark trip as paid');
    }

    showToast("✅ Payment confirmed & earnings ledger updated.", "success");
    return true;
  } catch (err) {
    showToast(`⚠️ Error: ${err.message}`, "error");
    return false;
  }
}

