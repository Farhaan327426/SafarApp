/**
 * SAFAR — Live Bus GPS Broadcast & Commuter Tracking Engine
 * Surpassing Uber and Chalo standards for unorganized transit networks.
 */

const FIREBASE_DB_URL = "https://safarapp-59712-default-rtdb.firebaseio.com";

class LiveTrackerModule {
  constructor() {
    this.map = null;
    this.markers = {};
    this.activeTrips = [];
    this.conductorWatchId = null;
    this.userWatchId = null;
    this.isBroadcasting = false;
    this.broadcastInterval = null;
    this.firebasePollingInterval = null;
    this.currentConductorTrip = null;
    this.pingsSentCount = 0;
    this.userMarker = null;
    this.followingTripId = null;
    this.followInterval = null;
    this.trafficMultiplier = 1.0;

    // BroadcastChannel for same-device cross-tab instant sync
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('safar_gps_pings');
      this.channel.onmessage = (event) => this.handleChannelMessage(event.data);
    }

    // Listen to localStorage changes for multi-tab fallback sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'safar_active_trips') {
        this.activeTrips = this._parseLocalTrips();
        this.renderBusMarkers();
        if (window.renderTripCards) window.renderTripCards();
      }
    });

    this.activeTrips = this._parseLocalTrips();
    this._startFirebaseSSESync();
    this._startFirebasePolling();
    this.startUserLocationWatch();
  }

  _startFirebaseSSESync() {
    try {
      if ('EventSource' in window) {
        const sse = new EventSource(`${FIREBASE_DB_URL}/trips.json`);
        const handler = (e) => this._handleSSEEvent(e);
        sse.addEventListener('put', handler);
        sse.addEventListener('patch', handler);
        sse.onerror = () => {
          // Fallback to HTTP polling if SSE disconnects
        };
      }
    } catch (e) {
      console.warn("EventSource setup failed, relying on HTTP polling", e);
    }
  }

  _handleSSEEvent(e) {
    try {
      const payload = JSON.parse(e.data);
      if (payload && payload.data !== undefined) {
        const tripsData = payload.data;
        if (tripsData && typeof tripsData === 'object') {
          const now = Date.now();
          const trips = Object.values(tripsData).filter(
            t => t && t.status === "active" && (now - t.lastPing) < 900000
          );
          this.activeTrips = trips;
          this._saveTripsLocally();
          this.renderBusMarkers();
          if (window.renderTripCards) window.renderTripCards();
        }
      }
    } catch (err) {}
  }

  async _firebaseGet(path) {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}${path}.json`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn(`Firebase GET ${path} failed:`, e);
    }
    return null;
  }

  async _firebasePut(path, data) {
    try {
      await fetch(`${FIREBASE_DB_URL}${path}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn(`Firebase PUT ${path} failed, using local fallback:`, e);
    }
  }

  _parseLocalTrips() {
    try {
      const saved = localStorage.getItem("safar_active_trips");
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        return parsed.filter(t => t.status === "active" && (now - t.lastPing) < 900000);
      }
    } catch (e) {}
    return [];
  }

  _saveTripsLocally() {
    try {
      localStorage.setItem("safar_active_trips", JSON.stringify(this.activeTrips));
      if (this.channel) {
        this.channel.postMessage({ type: 'TRIPS_UPDATED', trips: this.activeTrips });
      }
    } catch (e) {}
  }

  _startFirebasePolling() {
    if (this.firebasePollingInterval) return;
    // Poll every 10 seconds as fallback
    this.firebasePollingInterval = setInterval(async () => {
      const data = await this._firebaseGet('/trips');
      if (data && typeof data === 'object') {
        const now = Date.now();
        const trips = Object.values(data).filter(
          t => t && t.status === "active" && (now - t.lastPing) < 900000
        );
        this.activeTrips = trips;
        this._saveTripsLocally();
        this.renderBusMarkers();
        if (window.renderTripCards) window.renderTripCards();
      }
    }, 10000);
  }

  handleChannelMessage(data) {
    if (data.type === 'TRIPS_UPDATED' && Array.isArray(data.trips)) {
      this.activeTrips = data.trips;
      this.renderBusMarkers();
      if (window.renderTripCards) window.renderTripCards();
    }
  }

  /**
   * ETA Prediction Engine:
   * ETA (mins) = (remainingDistKm / max(currentSpeedKmH, 15) * trafficMultiplier) * 60
   */
  calculatePredictedETA(remainingDistKm, speedKmH = 25, trafficMult = 1.0) {
    const effectiveSpeed = Math.max(speedKmH, 12);
    const etaHours = remainingDistKm / (effectiveSpeed * (trafficMult || 1.0));
    return Math.max(1, Math.round(etaHours * 60));
  }

  initMap(elementId = "commuterMap") {
    const mapElement = document.getElementById(elementId);
    if (!mapElement) return;

    if (this.map) {
      try { this.map.remove(); } catch (e) {}
      this.map = null;
      this.markers = {};
    }

    try {
      this.map = L.map(elementId, {
        center: [34.08, 74.80],
        zoom: 11,
        zoomControl: true
      });

      const primaryTileLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          crossOrigin: true
        }
      );

      primaryTileLayer.on('tileerror', () => {
        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }
        ).addTo(this.map);
      });

      primaryTileLayer.addTo(this.map);

      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 250);

      this.renderBusMarkers();
    } catch (err) {
      console.warn("Leaflet Map init error:", err);
    }
  }

  refreshMapSize() {
    if (this.map) {
      setTimeout(() => {
        try { this.map.invalidateSize(); } catch (e) {}
      }, 150);
    }
  }

  renderBusMarkers(filterRoute = "") {
    if (!this.map) return;

    Object.values(this.markers).forEach(m => this.map.removeLayer(m));
    this.markers = {};

    const now = Date.now();
    const activeValidTrips = this.activeTrips.filter(t => t.status === "active");

    activeValidTrips.forEach(trip => {
      if (filterRoute && !trip.routeName.toLowerCase().includes(filterRoute.toLowerCase())) return;

      const isDemo = Boolean(trip.isDemo || trip.isSimulated);
      const isStale = (now - trip.lastPing) > 120000;
      const markerColor = isDemo ? "#818cf8" : (isStale ? "#ef4444" : "#10b981");
      const telemetryTypeLabel = isDemo ? "DEMO / SIMULATION" : (isStale ? "STALE GPS ( >2m )" : "LIVE TELEMETRY");
      const vehicleBadge = trip.vehicleType ? trip.vehicleType.toUpperCase() : "BUS";

      const predictedEtaMins = this.calculatePredictedETA(trip.fareSlabKm || 10, trip.speed || 25, this.trafficMultiplier);

      const customIcon = L.divIcon({
        className: 'custom-bus-pin',
        html: `
          <div style="
            background: ${markerColor};
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 800;
            font-size: 11px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            border: 2px solid #ffffff;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span>[BUS]</span> ${trip.vehicleNo} <span style="background: rgba(0,0,0,0.35); padding: 2px 6px; border-radius: 10px; font-size:9px;">${telemetryTypeLabel}</span>
          </div>
        `,
        iconSize: [180, 36],
        iconAnchor: [90, 18]
      });

      const marker = L.marker([trip.lat, trip.lng], { icon: customIcon }).addTo(this.map);

      const isFollowing = this.followingTripId === trip.id;

      const popupContent = `
        <div style="font-family: var(--font-sans); min-width: 230px; padding: 6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="font-weight: 800; font-size: 14px; color: ${markerColor};">
              ${trip.vehicleNo} (${vehicleBadge})
            </div>
            <span style="font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; background:${isDemo ? 'rgba(129,140,248,0.2)' : 'rgba(16,185,129,0.2)'}; color:${isDemo ? '#818cf8' : '#10b981'};">
              ${telemetryTypeLabel}
            </span>
          </div>
          <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 6px;">
            ${trip.routeName}
          </div>
          <div style="font-size: 12px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px; color: #fff;">
            <b>Predicted ETA:</b> <span style="color: #10b981; font-weight: bold;">${predictedEtaMins} mins</span><br/>
            <b>Speed:</b> ${trip.speed || 24} km/h<br/>
            <b>Next Stop:</b> ${trip.nextStop || 'En Route'}<br/>
            <small style="color:#94a3b8;">${isDemo ? '⚠️ Simulated demonstration path — not live broadcast.' : '✓ Authoritative broadcast telemetry.'}</small>
          </div>
          <button onclick="window.liveTrackerModule.toggleFollowBus('${trip.id}')" style="
            width: 100%; background: ${isFollowing ? '#dc2626' : '#14b8a6'}; color: white;
            border: none; padding: 8px; border-radius: 8px;
            font-size: 12px; font-weight: bold; cursor: pointer; margin-bottom: 6px;">
            ${isFollowing ? '🛑 Stop Following Bus' : '🎯 Follow Bus Camera'}
          </button>
          <button onclick="selectBusForFare('${trip.routeId}', ${trip.fareSlabKm || 10})" style="
            width: 100%; background: #1e293b; color: white; border: 1px solid rgba(255,255,255,0.2);
            padding: 8px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer;">
            💰 Check Fare & Book Pass
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.markers[trip.id] = marker;
    });
  }

  toggleFollowBus(tripId) {
    if (this.followingTripId === tripId) {
      this.followingTripId = null;
      if (this.followInterval) clearInterval(this.followInterval);
      if (window.showToast) window.showToast("Follow mode disabled.", "info");
    } else {
      this.followingTripId = tripId;
      this.followBusCamera(tripId);
      if (this.followInterval) clearInterval(this.followInterval);
      this.followInterval = setInterval(() => this.followBusCamera(tripId), 5000);
      if (window.showToast) window.showToast("Follow mode active. Camera will center on bus every 5 seconds.", "success");
    }
  }

  followBusCamera(tripId) {
    if (!this.map || !this.followingTripId) return;
    const targetTrip = this.activeTrips.find(t => t.id === tripId);
    if (targetTrip) {
      this.map.panTo([targetTrip.lat, targetTrip.lng], { animate: true, duration: 1.0 });
    }
  }

  startConductorBroadcast(vehicleNo, routeId, vehicleType) {
    if (this.isBroadcasting) return;

    this.isBroadcasting = true;
    this.pingsSentCount = 0;

    let startLat = 34.0837, startLng = 74.7973;
    if (routeId && routeId.startsWith('jmu')) {
      startLat = 32.7266; startLng = 74.8570;
    }

    const tripId = "trip-" + vehicleNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    this.currentConductorTrip = {
      id: tripId,
      vehicleNo: vehicleNo || "JK01-AV-9912",
      vehicleType: vehicleType || "minibus",
      routeId: routeId || "srn-budgam",
      routeName: "Live Active Route",
      lat: startLat,
      lng: startLng,
      speed: 28,
      lastPing: Date.now(),
      nextStop: "En Route",
      etaMinutes: 8,
      fareSlabKm: 14,
      status: "active"
    };

    this._firebasePut(`/trips/${tripId}`, this.currentConductorTrip);

    this.activeTrips = this._parseLocalTrips().filter(t => t.vehicleNo !== vehicleNo);
    this.activeTrips.unshift(this.currentConductorTrip);
    this._saveTripsLocally();

    if (navigator.geolocation) {
      this.conductorWatchId = navigator.geolocation.watchPosition(
        pos => {
          if (!this.currentConductorTrip) return;
          this.currentConductorTrip.lat = pos.coords.latitude;
          this.currentConductorTrip.lng = pos.coords.longitude;
          this.currentConductorTrip.speed = Math.round((pos.coords.speed || 0) * 3.6);
          this.currentConductorTrip.lastPing = Date.now();
          this.pingsSentCount++;
          this._pushPing();
        },
        err => console.warn("Conductor GPS error:", err),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 }
      );
    }

    this.broadcastInterval = setInterval(() => {
      if (!this.currentConductorTrip) return;
      this.currentConductorTrip.lastPing = Date.now();
      this._pushPing();
    }, 8000);
  }

  _pushPing() {
    if (!this.currentConductorTrip) return;
    const tripId = this.currentConductorTrip.id;
    this._firebasePut(`/trips/${tripId}`, this.currentConductorTrip);

    const idx = this.activeTrips.findIndex(t => t.id === tripId);
    if (idx !== -1) this.activeTrips[idx] = this.currentConductorTrip;
    else this.activeTrips.unshift(this.currentConductorTrip);
    this._saveTripsLocally();

    if (window.updateConductorUI) window.updateConductorUI();
  }

  stopConductorBroadcast() {
    this.isBroadcasting = false;
    if (this.conductorWatchId !== null) {
      navigator.geolocation.clearWatch(this.conductorWatchId);
      this.conductorWatchId = null;
    }
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    if (this.currentConductorTrip) {
      const tripId = this.currentConductorTrip.id;
      this._firebasePut(`/trips/${tripId}`, { ...this.currentConductorTrip, status: "ended" });
      this.activeTrips = this._parseLocalTrips().filter(t => t.id !== tripId);
      this._saveTripsLocally();
      this.currentConductorTrip = null;
    }
    if (window.updateConductorUI) window.updateConductorUI();
  }

  /** Continuous User Geolocation Pulsing Marker Watch */
  startUserLocationWatch() {
    if (!navigator.geolocation) return;

    this.userWatchId = navigator.geolocation.watchPosition(
      pos => {
        if (!this.map) return;
        const { latitude: lat, longitude: lng } = pos.coords;

        if (this.userMarker) this.map.removeLayer(this.userMarker);

        const userIcon = L.divIcon({
          className: 'user-pulsing-dot',
          html: `
            <div style="position: relative; width: 20px; height: 20px;">
              <div style="position: absolute; inset: 0; background: #38bdf8; border-radius: 50%; opacity: 0.7; animation: pulseGlow 1.8s infinite ease-out;"></div>
              <div style="position: absolute; inset: 3px; background: #0284c7; border-radius: 50%; border: 2px solid #ffffff;"></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
      },
      err => console.warn("User location watch error:", err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }
}

window.liveTrackerModule = new LiveTrackerModule();
