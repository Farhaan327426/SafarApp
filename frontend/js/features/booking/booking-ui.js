/**
 * SAFAR — Booking & Sync UI Module
 */

import { store } from '../../core/state.js';
import { triggerHaptic } from '../../core/haptics.js';
import { showToast } from '../../core/toast.js';
import { saveBooking, updateOfflineState, syncOfflineQueue } from './booking-service.js';

export async function updateOfflineBadge() {
  const count = await updateOfflineState();
  const badge = document.getElementById("syncBadge");
  if (badge) {
    badge.textContent = count > 0 ? `${count} pending` : "Synced";
    badge.className = count > 0 ? "sync-badge pending" : "sync-badge synced";
  }
}

export async function submitBooking() {
  triggerHaptic(40);
  const commuterState = store.getState('commuter');
  const vehicleSelect = document.getElementById("vehicleSelect");
  const distInput = document.getElementById("distanceInput");
  const fareAmountEl = document.getElementById("fareAmount");

  if (!commuterState.route || !vehicleSelect || !vehicleSelect.value) {
    showToast("Please select a Route and Vehicle Type before booking.", "warning");
    return;
  }

  const booking = {
    routeId: commuterState.route.id,
    routeName: commuterState.route.name,
    boardingId: commuterState.boardingId,
    deboardingId: commuterState.deboardingId,
    vehicleType: vehicleSelect.value,
    distanceKm: parseFloat(distInput ? distInput.value : "1.0"),
    fareEstimate: fareAmountEl ? fareAmountEl.textContent : "—",
    timestamp: new Date().toISOString(),
    idempotencyKey: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  };

  try {
    await saveBooking(booking);
    await updateOfflineBadge();

    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register("safar-offline-queue");
    }

    showToast(`Trip booking saved offline for "${commuterState.route.name}". Auto-sync queued.`, "success");
  } catch (err) {
    showToast("Error recording booking locally.", "warning");
  }
}

export async function flushOfflineQueue() {
  triggerHaptic(30);
  const flushBtn = document.getElementById("flushSyncBtn");
  if (flushBtn) {
    flushBtn.textContent = "Syncing...";
    flushBtn.disabled = true;
  }

  try {
    const { successCount, total } = await syncOfflineQueue();
    await updateOfflineBadge();

    if (total === 0) {
      showToast("Offline queue is empty. All trips are synced!", "info");
    } else {
      showToast(`Synced ${successCount} of ${total} offline bookings with regulatory ledger.`, "success");
    }
  } catch (e) {
    showToast("Error flushing offline sync queue.", "warning");
  } finally {
    if (flushBtn) {
      flushBtn.textContent = "🔄 Sync Offline Queue";
      flushBtn.disabled = false;
    }
  }
}

export function initBookingUI() {
  const bookTripBtn = document.getElementById("bookTripBtn");
  if (bookTripBtn) {
    bookTripBtn.addEventListener("click", submitBooking);
  }

  const flushSyncBtn = document.getElementById("flushSyncBtn");
  if (flushSyncBtn) {
    flushSyncBtn.addEventListener("click", flushOfflineQueue);
  }

  store.subscribe('commuter', () => {
    updateOfflineBadge();
  });
}
