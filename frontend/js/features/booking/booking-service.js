/**
 * SAFAR — Booking & Offline Queue Service
 */

import { saveOfflineBooking as saveToDB, getOfflineQueueCount, getOfflineQueueItems, deleteOfflineQueueItems } from '../../core/indexeddb.js';
import { store } from '../../core/state.js';

export async function saveBooking(booking) {
  await saveToDB(booking);
  await updateOfflineState();
}

export async function updateOfflineState() {
  const count = await getOfflineQueueCount();
  store.setState('commuter', { offlineCount: count });
  return count;
}

export async function syncOfflineQueue() {
  const items = await getOfflineQueueItems();
  if (items.length === 0) {
    return { successCount: 0, total: 0 };
  }

  let successCount = 0;
  const syncedIds = [];

  for (const item of items) {
    try {
      const res = await fetch("/api/v1/trips/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": item.idempotencyKey || `offline-${item.id}`
        },
        body: JSON.stringify(item)
      });
      if (res.ok || res.status === 201 || res.status === 202) {
        successCount++;
        syncedIds.push(item.id);
      }
    } catch (err) {
      break;
    }
  }

  if (syncedIds.length > 0) {
    await deleteOfflineQueueItems(syncedIds);
    await updateOfflineState();
  }

  return { successCount, total: items.length };
}
