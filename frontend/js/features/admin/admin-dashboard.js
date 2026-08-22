/**
 * Safar Admin Telemetry Dashboard Module
 * EventSource Live Fleet Tracker & Authenticated Summary Aggregator
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'safar_admin_token';
  let adminToken = sessionStorage.getItem(STORAGE_KEY);
  let eventSource = null;
  let summaryInterval = null;

  const AdminDashboard = {
    init() {
      if (!adminToken) {
        this.renderLoginOverlay();
      } else {
        this.startDashboard();
      }
    },

    renderLoginOverlay() {
      const overlay = document.getElementById('adminAuthModalOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
      }
    },

    async handleLogin(pinInput) {
      try {
        const res = await fetch('/api/v1/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPin: pinInput })
        });
        const json = await res.json();
        if (json.success && json.data.adminToken) {
          adminToken = json.data.adminToken;
          sessionStorage.setItem(STORAGE_KEY, adminToken);
          const overlay = document.getElementById('adminAuthModalOverlay');
          if (overlay) overlay.style.display = 'none';
          this.startDashboard();
          return { success: true };
        } else {
          return { success: false, error: json.error || 'Invalid PIN' };
        }
      } catch (err) {
        return { success: false, error: 'Network error' };
      }
    },

    startDashboard() {
      this.fetchSummary();
      this.initSseStream();
      if (!summaryInterval) {
        summaryInterval = setInterval(() => this.fetchSummary(), 5000);
      }
    },

    async fetchSummary() {
      if (!adminToken) return;
      try {
        const res = await fetch('/api/v1/admin/telemetry/summary', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (res.status === 401) {
          this.logout();
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          this.renderMetrics(json.data);
        }
      } catch (e) {
        console.warn('[Admin Dashboard] Summary fetch failed', e);
      }
    },

    initSseStream() {
      if (eventSource) return;
      eventSource = new EventSource('/api/v1/telemetry/stream');
      eventSource.addEventListener('telemetry', (e) => {
        try {
          const trip = JSON.parse(e.data);
          this.updateVehicleRow(trip);
        } catch (_) {}
      });
      eventSource.onerror = () => {
        // SSE reconnect handles automatically
      };
    },

    renderMetrics(data) {
      const activeElem = document.getElementById('telemetryActiveVehicles');
      const passElem = document.getElementById('telemetryTotalPassengers');
      const speedElem = document.getElementById('telemetryAvgSpeed');
      const bcastElem = document.getElementById('telemetryBroadcastsLastMin');

      if (activeElem) activeElem.textContent = data.activeVehicles || 0;
      if (passElem) passElem.textContent = data.totalPassengers || 0;
      if (speedElem) speedElem.textContent = (data.averageSpeedKmph || 0) + ' km/h';
      if (bcastElem) bcastElem.textContent = data.totalBroadcastsLastMinute || 0;

      if (Array.isArray(data.vehicles)) {
        this.renderTable(data.vehicles);
      }
    },

    renderTable(vehicles) {
      const tbody = document.getElementById('telemetryVehicleTableBody');
      if (!tbody) return;
      tbody.innerHTML = vehicles.map(v => `
        <tr id="veh-row-${v.vehicleNo}">
          <td><strong>${v.vehicleNo}</strong></td>
          <td>${v.routeName || 'Unassigned'}</td>
          <td>${v.speedKmph || 0} km/h ${(v.speedKmph > 60) ? '<span class="badge warning">Over-Speeding</span>' : ''}</td>
          <td>${v.passengerCount || 0} passengers</td>
          <td>${new Date(v.lastSeen).toLocaleTimeString()}</td>
        </tr>
      `).join('');
    },

    updateVehicleRow(trip) {
      const tbody = document.getElementById('telemetryVehicleTableBody');
      if (!tbody) return;
      let row = document.getElementById('veh-row-' + trip.vehicleNo);
      if (!row) {
        this.fetchSummary();
      } else {
        row.cells[2].innerHTML = (trip.speed || 0) + ' km/h ' + ((trip.speed > 60) ? '<span class="badge warning">Over-Speeding</span>' : '');
        row.cells[3].textContent = (trip.passengerCount || 0) + ' passengers';
        row.cells[4].textContent = new Date(trip.timestamp || Date.now()).toLocaleTimeString();
      }
    },

    logout() {
      sessionStorage.removeItem(STORAGE_KEY);
      adminToken = null;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (summaryInterval) {
        clearInterval(summaryInterval);
        summaryInterval = null;
      }
      this.renderLoginOverlay();
    }
  };

  window.SafarAdminDashboard = AdminDashboard;
  document.addEventListener('DOMContentLoaded', () => AdminDashboard.init());
})();
