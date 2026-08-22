/**
 * SAFAR — Fare Calculator & SRO Dispute UI Module
 */

import { store } from '../../core/state.js';
import { escapeHtml, trapFocus } from '../../core/dom.js';
import { triggerHaptic } from '../../core/haptics.js';
import { showToast } from '../../core/toast.js';
import { calculateHaversineDistance } from '../../core/network.js';
import { computeOfficialFare } from './fare-engine.js';

let _disputePreviousFocus = null;
let _disputeTrapHandler = null;
let _sroPreviousFocus = null;
let _sroTrapHandler = null;

export function populateRoutes() {
  const routeSelect = document.getElementById("routeSelect");
  if (!routeSelect) return;

  const routes = window.JK_ROUTES_DB || [];
  if (routes.length === 0) return;

  routeSelect.textContent = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Select Route --";
  routeSelect.appendChild(placeholder);

  routes.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${escapeHtml(r.name)} (${r.distance} km)`;
    routeSelect.appendChild(opt);
  });
}

export function onRouteChange() {
  const routeSelect = document.getElementById("routeSelect");
  const routeId = routeSelect ? routeSelect.value : "";
  const routes = window.JK_ROUTES_DB || [];
  const selectedRoute = routes.find(r => r.id === routeId) || null;

  store.setState('commuter', { route: selectedRoute });

  updateJkmtBadge(selectedRoute);
  populateVehicleTypes(selectedRoute);
  populateStops(selectedRoute);
  recalculateDistance();
}

export function updateJkmtBadge(selectedRouteData) {
  const badge = document.getElementById('jkmtRouteBadge');
  const ref = document.getElementById('jkmtRef');
  if (!badge || !ref) return;

  if (selectedRouteData && (selectedRouteData.isJkmtNotified || selectedRouteData.is_jkmt_notified) && (selectedRouteData.jkmtNotificationRef || selectedRouteData.notification_ref)) {
    const gazetteRef = escapeHtml(selectedRouteData.jkmtNotificationRef || selectedRouteData.notification_ref);
    const sourceAuth = escapeHtml(selectedRouteData.sourceAuthority || "J&K Transport Dept");
    const effectiveDate = selectedRouteData.effectiveDate ? new Date(selectedRouteData.effectiveDate).toLocaleDateString('en-IN') : "Active Gazette";
    ref.innerHTML = `<strong>${gazetteRef}</strong> · <span>${effectiveDate}</span> · <small style="opacity:0.85;">${sourceAuth}</small>`;
    badge.hidden = false;
    badge.style.display = "inline-flex";
  } else {
    badge.hidden = true;
    badge.style.display = "none";
  }
}

export function populateVehicleTypes(routeData) {
  const vehicleSelect = document.getElementById("vehicleSelect");
  if (!vehicleSelect) return;
  vehicleSelect.textContent = "";

  if (!routeData) return;

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "-- Select Vehicle --";
  vehicleSelect.appendChild(placeholder);

  const vTypes = routeData.vehicleTypes || [
    "MINI_BUS", "BIG_BUS", "TATA_MAGIC", "SHARED_VAN",
    "E_RICKSHAW", "E_AUTO", "PETROL_AUTO", "TAXI_MAXI_CAB_BASE"
  ];
  vTypes.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v.replace(/_/g, " ");
    vehicleSelect.appendChild(opt);
  });
}

export function populateStops(routeData) {
  const boardingSelect = document.getElementById("boardingSelect");
  const deboardingSelect = document.getElementById("deboardingSelect");
  if (!boardingSelect || !deboardingSelect) return;

  boardingSelect.textContent = "";
  const myLoc = document.createElement("option");
  myLoc.value = "my_location";
  myLoc.textContent = "📍 My Current Location";
  boardingSelect.appendChild(myLoc);

  if (!routeData || !routeData.stops) return;

  routeData.stops.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.km} km)`;
    boardingSelect.appendChild(opt);
  });

  updateDeboardingOptions(routeData);
}

export function updateDeboardingOptions(routeDataOverride) {
  const boardingSelect = document.getElementById("boardingSelect");
  const deboardingSelect = document.getElementById("deboardingSelect");
  if (!boardingSelect || !deboardingSelect) return;

  const commuterState = store.getState('commuter');
  const routeData = routeDataOverride || commuterState.route;

  const boardingId = boardingSelect.value;
  store.setState('commuter', { boardingId });
  deboardingSelect.textContent = "";

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "-- Select Destination Stop --";
  deboardingSelect.appendChild(defaultOpt);

  if (!routeData || !routeData.stops) return;

  const boardingStop = routeData.stops.find(x => x.id === boardingId);
  const minKm = boardingStop ? boardingStop.km : -1;

  const candidateStops =
    boardingId === "my_location"
      ? routeData.stops
      : routeData.stops.filter(s => s.km > minKm);

  candidateStops.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.km} km)`;
    deboardingSelect.appendChild(opt);
  });

  store.setState('commuter', { deboardingId: deboardingSelect.value });
}

export function recalculateDistance() {
  const distInput = document.getElementById("distanceInput");
  if (!distInput) return;

  const commuterState = store.getState('commuter');
  const route = commuterState.route;
  if (!route || !route.stops || !commuterState.deboardingId) return;

  const deboardingStop = route.stops.find(x => x.id === commuterState.deboardingId);
  if (!deboardingStop) return;

  if (commuterState.boardingId === "my_location") {
    if (commuterState.userCoords && deboardingStop.lat && deboardingStop.lng) {
      const geoDist = calculateHaversineDistance(
        commuterState.userCoords.latitude,
        commuterState.userCoords.longitude,
        deboardingStop.lat,
        deboardingStop.lng
      );
      distInput.value = geoDist.toFixed(1);
    } else {
      distInput.value = (deboardingStop.km || 1.0).toFixed(1);
      if (typeof navigator !== "undefined" && navigator.geolocation && !commuterState.userCoords) {
        showToast("📍 Using stop-based distance (GPS unavailable)", "info");
        navigator.geolocation.getCurrentPosition(
          pos => {
            store.setState('commuter', { userCoords: pos.coords });
            recalculateDistance();
          },
          () => {
            distInput.value = (deboardingStop.km || 1.0).toFixed(1);
          },
          { timeout: 5000 }
        );
      }
    }
  } else {
    const boardingStop = route.stops.find(x => x.id === commuterState.boardingId);
    if (boardingStop) {
      const stopDist = Math.max(0.5, Math.abs(deboardingStop.km - boardingStop.km));
      distInput.value = stopDist.toFixed(1);
    }
  }

  const vehicleSelect = document.getElementById("vehicleSelect");
  if (vehicleSelect && vehicleSelect.value) {
    calculateFare();
  }
}

export async function calculateFare() {
  triggerHaptic(30);
  const vehicleSelect = document.getElementById("vehicleSelect");
  const distanceInput = document.getElementById("distanceInput");
  const concessionSelect = document.getElementById("concessionSelect");
  const disputeBtn = document.getElementById("btnShowConductorCard");
  if (!vehicleSelect || !distanceInput) return;

  const commuterState = store.getState('commuter');
  const vehicleType = vehicleSelect.value;
  let distance = parseFloat(distanceInput.value);
  const passengerCategory = concessionSelect ? concessionSelect.value : 'General';

  if (!vehicleType || isNaN(distance) || distance <= 0) {
    setFareResult("FARE_NOT_AVAILABLE", "Select vehicle and distance.");
    if (disputeBtn) disputeBtn.classList.add("hidden");
    return;
  }

  distance = Math.max(0.1, Math.min(distance, commuterState.route?.distance || 500));
  distanceInput.value = distance.toFixed(1);

  const result = await computeOfficialFare(vehicleType, distance, passengerCategory);

  if (!result) {
    setFareResult("FARE_NOT_AVAILABLE", "Official regulated fare schedule unavailable for this combination.");
    if (disputeBtn) disputeBtn.classList.add("hidden");
  } else {
    const formattedFare = `₹${Math.round(result.fare)}`;
    const formattedMeta = `${vehicleType.replace(/_/g, " ")} · ${commuterState.route?.name || "J&K Regulated"}`;

    const boardingEl = document.getElementById("boardingSelect");
    const deboardingEl = document.getElementById("deboardingSelect");
    const originName = boardingEl && boardingEl.options[boardingEl.selectedIndex] ? boardingEl.options[boardingEl.selectedIndex].text.replace(/\s*\([^)]*\)/, '').trim() : "Origin";
    const destName = deboardingEl && deboardingEl.options[deboardingEl.selectedIndex] ? deboardingEl.options[deboardingEl.selectedIndex].text.replace(/\s*\([^)]*\)/, '').trim() : (commuterState.route?.name || "Destination");

    store.setState('commuter', {
      lastCalculatedFare: formattedFare,
      lastCalculatedMeta: formattedMeta,
      lastCalculatedSource: result.source,
      lastCalculatedVehicle: vehicleType.replace(/_/g, " "),
      lastCalculatedOrigin: originName,
      lastCalculatedDestination: destName
    });

    setFareResult(formattedFare, formattedMeta);
    const sourceEl = document.getElementById("fareSource");
    if (sourceEl && result.source) {
      sourceEl.textContent = `As per ${result.source.authority} Notification ${result.source.notification} dated ${result.source.date}`;
    }

    if (disputeBtn) disputeBtn.classList.remove("hidden");

    if (typeof window !== "undefined" && typeof window.applyTranslations === "function") {
      const currentLang = localStorage.getItem("safar_lang") || "en";
      window.applyTranslations(currentLang);
    }
  }
}

export function setFareResult(amount, meta) {
  const amountEl = document.getElementById("fareAmount");
  const metaEl = document.getElementById("fareMeta");
  const sourceEl = document.getElementById("fareSource");
  if (amountEl) amountEl.textContent = amount;
  if (metaEl) metaEl.textContent = meta;
  if (sourceEl) sourceEl.textContent = "";
}

export function getDisputePayloadText() {
  const commuterState = store.getState('commuter');
  const fareText = commuterState.lastCalculatedFare || "₹17";
  const origin = commuterState.lastCalculatedOrigin || "Origin";
  const destination = commuterState.lastCalculatedDestination || (commuterState.route?.name || "Destination");
  const vehicleClass = commuterState.lastCalculatedVehicle || "Mini Bus";
  const authority = commuterState.lastCalculatedSource?.notification
    ? `${commuterState.lastCalculatedSource.notification} dated ${commuterState.lastCalculatedSource.date || "2026-04-30"}`
    : "SRO-97 dated 2021-08-10";
  const source = commuterState.lastCalculatedSource?.authority || "J&K Transport Department";

  return [
    `Fare: ${fareText}`,
    `Route: ${origin} → ${destination}`,
    `Vehicle Class: ${vehicleClass}`,
    `Authority: ${authority}`,
    `Source: ${source}`
  ].join("\n");
}

export function openDisputeModal() {
  triggerHaptic(50);
  _disputePreviousFocus = document.activeElement;
  const modal = document.getElementById("disputeModal");
  const titleEl = document.getElementById("disputeModalTitle");
  const metaEl = document.getElementById("disputeModalMeta");
  const qrContainer = document.getElementById("qr-container");
  const sigNotice = document.getElementById("disputeSignatureNotice");

  if (modal && titleEl && metaEl) {
    const commuterState = store.getState('commuter');
    const fareText = commuterState.lastCalculatedFare || "₹17";
    const origin = commuterState.lastCalculatedOrigin || "Origin";
    const destination = commuterState.lastCalculatedDestination || (commuterState.route?.name || "Destination");
    const vehicleClass = commuterState.lastCalculatedVehicle || "Mini Bus";

    titleEl.textContent = fareText;
    metaEl.textContent = `${vehicleClass} · ${origin} → ${destination}`;

    const disputePayload = getDisputePayloadText();

    if (qrContainer && typeof window !== "undefined" && window.QRCode) {
      qrContainer.innerHTML = "";
      try {
        const QRCodeLib = window.QRCode;
        if (typeof QRCodeLib === "function") {
          new QRCodeLib(qrContainer, {
            text: disputePayload,
            width: 256,
            height: 256,
            correctLevel: (QRCodeLib.CorrectLevel && QRCodeLib.CorrectLevel.H) ? QRCodeLib.CorrectLevel.H : 2
          });
        } else if (QRCodeLib.toCanvas) {
          const canvas = document.createElement("canvas");
          qrContainer.appendChild(canvas);
          QRCodeLib.toCanvas(canvas, disputePayload, { width: 256, errorCorrectionLevel: "H" });
        }
      } catch (error) {
        console.warn("QRCode generation failed:", error);
      }
    }

    if (sigNotice) {
      sigNotice.style.display = (typeof navigator !== "undefined" && navigator.onLine) ? "none" : "block";
    }

    modal.classList.remove("hidden");
    _disputeTrapHandler = trapFocus(modal);
  }
}

export function closeDisputeModal() {
  triggerHaptic(20);
  const modal = document.getElementById("disputeModal");
  if (modal) {
    if (_disputeTrapHandler) { modal.removeEventListener("keydown", _disputeTrapHandler); _disputeTrapHandler = null; }
    modal.classList.add("hidden");
  }
  if (_disputePreviousFocus && typeof _disputePreviousFocus.focus === "function") {
    _disputePreviousFocus.focus();
  }
  _disputePreviousFocus = null;
}

export function openSroModal() {
  const sroModal = document.getElementById('sroModal');
  const sroModalBody = document.getElementById('sroModalBody');
  if (!sroModal || !sroModalBody) return;
  _sroPreviousFocus = document.activeElement;
  sroModal.hidden = false;
  sroModal.style.display = 'flex';
  sroModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const fetchSro = async () => {
    try {
      const notifications = (typeof window !== "undefined" && window.FareEngine && typeof window.FareEngine.fetchSroNotifications === "function")
        ? await window.FareEngine.fetchSroNotifications()
        : [];
      sroModalBody.innerHTML = renderSroList(notifications);
    } catch (err) {
      sroModalBody.innerHTML = '<p class="error-text" style="color:#ef4444; padding:12px 0;">Unable to load fare schedules. Check connection.</p>';
    }
  };

  fetchSro();
  _sroTrapHandler = trapFocus(sroModal);
}

export function closeSroModal() {
  const sroModal = document.getElementById('sroModal');
  if (!sroModal) return;
  if (_sroTrapHandler) { sroModal.removeEventListener('keydown', _sroTrapHandler); _sroTrapHandler = null; }
  sroModal.hidden = true;
  sroModal.style.display = 'none';
  sroModal.classList.add('hidden');
  document.body.style.overflow = '';
  if (_sroPreviousFocus && typeof _sroPreviousFocus.focus === "function") {
    _sroPreviousFocus.focus();
  }
  _sroPreviousFocus = null;
}

export function renderSroList(notifications) {
  if (!notifications?.length) return '<p style="color:var(--text-secondary,#94a3b8);">No active SRO notifications found.</p>';

  return `
    <div class="sro-list" style="display:flex; flex-direction:column; gap:16px;">
      ${notifications.map(n => `
        <div class="sro-card" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px;">
          <h3 class="sro-card__title" style="font-size:14px; font-weight:700; color:#38bdf8; margin:0 0 6px 0;">${escapeHtml(n.sroCode || n.notificationNumber)} — ${escapeHtml(n.title || n.name || 'Official Fare Notification')}</h3>
          <dl class="sro-card__meta" style="font-size:12px; margin:0 0 8px 0; display:grid; grid-template-columns:auto 1fr; gap:4px 8px;">
            <dt style="color:var(--text-secondary,#94a3b8);">Authority:</dt>   <dd style="margin:0; font-weight:600;">${escapeHtml(n.authority || n.sourceAuthority)}</dd>
            <dt style="color:var(--text-secondary,#94a3b8);">Scope:</dt>       <dd style="margin:0;"><span style="background:rgba(56,189,248,0.15); color:#38bdf8; padding:2px 6px; border-radius:4px; font-weight:600;">${escapeHtml(n.vehicleCategoryScope?.replace(/_/g, ' ') ?? 'All Categories')}</span></dd>
            <dt style="color:var(--text-secondary,#94a3b8);">Published:</dt>   <dd style="margin:0;">${new Date(n.notificationDate || n.publishedAt || n.effectiveDate).toLocaleDateString('en-IN')}</dd>
          </dl>
          ${n.fareRules?.length ? `
            <table class="fare-table" style="width:100%; border-collapse:collapse; font-size:12px; margin-top:8px;">
              <thead>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.15); color:var(--text-secondary,#94a3b8); text-align:left;">
                  <th style="padding:4px;">Vehicle / Slab</th>
                  <th style="padding:4px;">Basis</th>
                  <th style="padding:4px; text-align:right;">Regulated Rate</th>
                </tr>
              </thead>
              <tbody>
                ${n.fareRules.map(r => {
    const rateDisplay = r.perKmRate ? `₹${r.perKmRate}/km` : (r.flatFare ? `₹${r.flatFare} flat` : (r.ratePerKm ? `₹${r.ratePerKm}/km` : 'Slab-based'));
    return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                      <td style="padding:4px; font-weight:600;">${escapeHtml((r.vehicleType || `${r.minKm || 0}–${r.maxKm ?? '∞'} km`).replace(/_/g, ' '))}</td>
                      <td style="padding:4px; color:var(--text-secondary,#94a3b8);">${escapeHtml(r.fareBasis || 'Distance Slab')}</td>
                      <td style="padding:4px; text-align:right; font-weight:700; color:#10b981;">${rateDisplay}</td>
                    </tr>
                  `;
  }).join('')}
              </tbody>
            </table>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

export function initFareUI() {
  populateRoutes();

  const fareForm = document.getElementById("fareForm");
  if (fareForm) {
    fareForm.addEventListener("submit", async e => {
      e.preventDefault();
      triggerHaptic(50);
      await calculateFare();
    });
  }

  const routeSelectEl = document.getElementById("routeSelect");
  if (routeSelectEl) {
    routeSelectEl.addEventListener("change", onRouteChange);
  }

  const vehicleCatSelect = document.getElementById('vehicleCategorySelect');
  if (vehicleCatSelect) {
    vehicleCatSelect.addEventListener('change', () => {
      const commuterState = store.getState('commuter');
      updateJkmtBadge(commuterState.route);
    });
  }

  const boardingSelect = document.getElementById("boardingSelect");
  if (boardingSelect) {
    boardingSelect.addEventListener("change", () => {
      updateDeboardingOptions();
      recalculateDistance();
    });
  }

  const deboardingSelect = document.getElementById("deboardingSelect");
  if (deboardingSelect) {
    deboardingSelect.addEventListener("change", () => {
      const deboardingId = deboardingSelect.value;
      store.setState('commuter', { deboardingId });
      recalculateDistance();
    });
  }

  const vehicleSelect = document.getElementById("vehicleSelect");
  if (vehicleSelect) {
    vehicleSelect.addEventListener("change", () => {
      calculateFare();
    });
  }

  const concessionSelect = document.getElementById("concessionSelect");
  if (concessionSelect) {
    concessionSelect.addEventListener("change", () => {
      calculateFare();
    });
  }

  const btnShowConductorCard = document.getElementById("btnShowConductorCard");
  if (btnShowConductorCard) {
    btnShowConductorCard.addEventListener("click", () => openDisputeModal());
  }

  const btnCloseDisputeModal = document.getElementById("btnCloseDisputeModal");
  if (btnCloseDisputeModal) {
    btnCloseDisputeModal.addEventListener("click", () => closeDisputeModal());
  }

  const sroBackdrop = document.getElementById('sroModalBackdrop');
  document.getElementById('sroModalTrigger')?.addEventListener('click', openSroModal);
  document.getElementById('sroModalClose')?.addEventListener('click', closeSroModal);
  sroBackdrop?.addEventListener('click', closeSroModal);

  document.addEventListener('keydown', e => {
    const sroModal = document.getElementById('sroModal');
    if (e.key === 'Escape' && sroModal && !sroModal.hidden && sroModal.style.display !== 'none') {
      closeSroModal();
    }
  });

  const btnShare = document.getElementById("btnShareDispute");
  if (btnShare) {
    btnShare.addEventListener("click", async () => {
      const textToShare = getDisputePayloadText();
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ text: textToShare })) {
        try {
          await navigator.share({ title: 'Safar Fare Reference', text: textToShare });
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(textToShare);
          showToast('Copied to clipboard', 'success');
          return;
        } catch { }
      }
    });
  }
}
