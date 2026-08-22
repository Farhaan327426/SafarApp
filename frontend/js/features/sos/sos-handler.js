/**
 * SAFAR — Emergency SOS Alert Overlay Handler
 */

import { triggerHaptic } from '../../core/haptics.js';
import { showToast } from '../../core/toast.js';
import { trapFocus } from '../../core/dom.js';

let _sosTimer = null;
let _sosOverlay = null;
let _sosPreviousFocus = null;
let _sosTrapHandler = null;

export function triggerEmergencySos() {
  triggerHaptic(100);
  showSosOverlay();
}

export function showSosOverlay() {
  if (_sosOverlay) return;
  _sosPreviousFocus = document.activeElement;
  _sosOverlay = document.createElement("div");
  _sosOverlay.setAttribute("role", "alertdialog");
  _sosOverlay.setAttribute("aria-label", "Emergency SOS — Hold to confirm");
  _sosOverlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(20,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;";
  _sosOverlay.innerHTML = `
    <h2 style="color:#fff;font-size:22px;font-weight:800;text-align:center;margin:0;">EMERGENCY SOS</h2>
    <p style="color:#fca5a5;font-size:14px;text-align:center;margin:0;">Hold the button below for 2 seconds to call J&K Emergency Helpline (112)</p>
    <button id="sosHoldBtn" style="width:120px;height:120px;border-radius:50%;background:#dc2626;border:4px solid #fff;color:#fff;font-size:18px;font-weight:800;cursor:pointer;position:relative;overflow:hidden;touch-action:none;" aria-label="Hold for 2 seconds to call 112">
      HOLD
      <svg viewBox="0 0 36 36" style="position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);pointer-events:none;">
        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
        <circle id="sosProgressRing" cx="18" cy="18" r="16" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="100.53" stroke-dashoffset="100.53" style="transition:stroke-dashoffset 2s linear;"/>
      </svg>
    </button>
    <button id="sosCancelBtn" style="background:transparent;border:1px solid rgba(255,255,255,0.3);color:#fff;padding:10px 28px;border-radius:8px;font-size:14px;cursor:pointer;">Cancel</button>
  `;
  document.body.appendChild(_sosOverlay);

  const holdBtn = document.getElementById("sosHoldBtn");
  const cancelBtn = document.getElementById("sosCancelBtn");
  const ring = document.getElementById("sosProgressRing");

  function startHold() {
    if (_sosTimer) return;
    ring.style.strokeDashoffset = "0";
    _sosTimer = setTimeout(() => {
      executeSosCall();
    }, 2000);
  }

  function cancelHold() {
    if (_sosTimer) { clearTimeout(_sosTimer); _sosTimer = null; }
    ring.style.transition = "none";
    ring.style.strokeDashoffset = "100.53";
    requestAnimationFrame(() => { ring.style.transition = "stroke-dashoffset 2s linear"; });
  }

  holdBtn.addEventListener("pointerdown", startHold);
  holdBtn.addEventListener("pointerup", cancelHold);
  holdBtn.addEventListener("pointerleave", cancelHold);
  holdBtn.addEventListener("click", e => e.preventDefault());
  holdBtn.addEventListener("keydown", e => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      startHold();
    }
  });
  holdBtn.addEventListener("keyup", e => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      cancelHold();
    }
  });
  cancelBtn.addEventListener("click", closeSosOverlay);

  _sosTrapHandler = trapFocus(_sosOverlay);
}

export function closeSosOverlay() {
  if (_sosTimer) { clearTimeout(_sosTimer); _sosTimer = null; }
  if (_sosOverlay) {
    if (_sosTrapHandler) { _sosOverlay.removeEventListener("keydown", _sosTrapHandler); _sosTrapHandler = null; }
    _sosOverlay.remove();
    _sosOverlay = null;
  }
  if (_sosPreviousFocus && typeof _sosPreviousFocus.focus === "function") {
    _sosPreviousFocus.focus();
  }
  _sosPreviousFocus = null;
}

export function executeSosCall() {
  closeSosOverlay();
  triggerHaptic(100);
  showToast("Dialing J&K Emergency Helpline (112)...", "warning");

  if (typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, time: new Date().toISOString() };
        if (navigator.onLine) {
          fetch('/api/v1/sos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinates: coords, type: 'COMMUTER_EMERGENCY' })
          }).catch(() => { });
        }
      },
      () => { },
      { timeout: 3000 }
    );
  }

  if (typeof window !== "undefined") {
    window.location.href = "tel:112";
  }
}

export function initSosHandler() {
  const sosBtn = document.getElementById("sosBtn");
  if (sosBtn) {
    sosBtn.addEventListener("click", triggerEmergencySos);
  }
}
