/**
 * SAFAR — Live Bus GPS Telemetry & SSE Stream Client Module
 */

import { store } from '../../core/state.js';

let _eventSource = null;
let _pollingInterval = null;

export function initLiveTracker() {
  const liveState = store.getState('live');
  if (liveState.isStreaming || _eventSource) return;

  if (typeof window !== "undefined" && 'EventSource' in window) {
    try {
      _eventSource = new EventSource('/api/v1/telemetry/stream');

      _eventSource.addEventListener('snapshot', e => {
        try {
          const activeTrips = JSON.parse(e.data);
          store.setState('live', { activeTrips: Array.isArray(activeTrips) ? activeTrips : [], isStreaming: true });
        } catch (err) { }
      });

      _eventSource.addEventListener('telemetry', e => {
        try {
          const trip = JSON.parse(e.data);
          const currentTrips = store.getState('live').activeTrips || [];
          const idx = currentTrips.findIndex(t => t.vehicleNo === trip.vehicleNo);
          const updated = [...currentTrips];
          if (idx >= 0) {
            updated[idx] = trip;
          } else {
            updated.push(trip);
          }
          store.setState('live', { activeTrips: updated, isStreaming: true });
        } catch (err) { }
      });

      _eventSource.addEventListener('trip_removed', e => {
        try {
          const { vehicleNo } = JSON.parse(e.data);
          const currentTrips = store.getState('live').activeTrips || [];
          const updated = currentTrips.filter(t => t.vehicleNo !== vehicleNo);
          store.setState('live', { activeTrips: updated });
        } catch (err) { }
      });

      _eventSource.onerror = () => {
        destroyLiveTracker();
        startPollingFallback();
      };
    } catch (e) {
      startPollingFallback();
    }
  } else {
    startPollingFallback();
  }
}

export function destroyLiveTracker() {
  if (_eventSource) {
    _eventSource.close();
    _eventSource = null;
  }
  if (_pollingInterval) {
    clearInterval(_pollingInterval);
    _pollingInterval = null;
  }
  store.setState('live', { isStreaming: false });
}

function startPollingFallback() {
  if (_pollingInterval) return;
  _pollingInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/v1/telemetry/active');
      if (res.ok) {
        const json = await res.json();
        store.setState('live', { activeTrips: json.data || [], isStreaming: false });
      }
    } catch (e) { }
  }, 5000);
}

export async function sendConductorPing(telemetryData, token) {
  return fetch('/api/v1/telemetry/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(telemetryData)
  });
}

// Automatic Stream Lifecycle Management via Tab Subscriptions
store.subscribe('navigation', ({ activeTab }) => {
  if (activeTab === 'commuter') {
    initLiveTracker();
  } else {
    destroyLiveTracker();
  }
});
