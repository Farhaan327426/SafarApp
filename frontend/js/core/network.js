/**
 * SAFAR — Network Monitor & Geo Math Utilities (Side-Effect Free)
 */

import { showToast } from './toast.js';

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.1, R * c);
}

export function updateNetworkStatus() {
  if (typeof document === "undefined") return;
  const badge = document.getElementById("networkStatusBadge");
  if (!badge) return;

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  if (isOnline) {
    badge.textContent = "🟢 Online";
    badge.className = "network-badge online";
    showToast("🟢 Connected to live network. Background sync active.", "success");
  } else {
    badge.textContent = "📡 Offline Mode";
    badge.className = "network-badge offline";
    showToast("📡 Offline Mode: Using local fare cache & offline transaction ledger.", "info");
  }
}
