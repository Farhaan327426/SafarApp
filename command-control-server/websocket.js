const WebSocket = require('ws');
const { getRouteStops } = require('./db');

let wss = null;
let interval = null;

function setupLiveTracking(server) {
  wss = new WebSocket.Server({ server });
  console.log('🚦 Live Tracking WebSocket ready');

  // Simulator for background vehicle telemetry
  const simulateBus = () => {
    const stops = getRouteStops('SRN-SNM-02').length > 0 
      ? getRouteStops('SRN-SNM-02') 
      : getRouteStops('SRN-BUD-01');

    if (!stops || stops.length < 2) return;

    let idx = 0;
    let progress = 0; // 0 to 1 between stops

    interval = setInterval(() => {
      progress += 0.02; // Move forward
      if (progress >= 1) {
        progress = 0;
        idx = (idx + 1) % (stops.length - 1);
      }

      const from = stops[idx];
      const to = stops[idx + 1];
      if (!from || !to) return;

      const lat = from.lat + (to.lat - from.lat) * progress;
      const lng = from.lng + (to.lng - from.lng) * progress;
      const nextStopName = to.name_en;

      const payload = JSON.stringify({
        type: 'BUS_LOCATION',
        source: 'SIMULATOR',
        routeId: 'SRN-SNM-02',
        busId: 'SNM-101',
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        heading: (to.lng - from.lng) >= 0 ? 90 : 270,
        nextStop: nextStopName,
        timestamp: new Date().toISOString()
      });

      broadcastWebSocketPayload(payload);
    }, 1000);
    if (interval && typeof interval.unref === 'function') interval.unref();
  };

  wss.on('connection', (ws) => {
    console.log('🚌 Client connected to live tracker');
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Welcome to SAFAR Live Tracking' }));
    if (!interval) simulateBus();
    
    ws.on('close', () => {
      console.log('Client disconnected from live tracker');
    });
  });
}

function broadcastWebSocketPayload(payloadStr) {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payloadStr);
    }
  });
}

/**
 * Broadcast Real Vehicle Telemetry from REST Push, MQTT, or Kafka
 */
function broadcastRealVehicleGps({ vehicleNo, routeId, lat, lng, speed, heading, nextStop }) {
  const payload = JSON.stringify({
    type: 'BUS_LOCATION',
    source: 'REAL_GPS',
    busId: vehicleNo,
    routeId: routeId || 'SRN-SNM-02',
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    speed: speed || 0,
    heading: heading || 0,
    nextStop: nextStop || 'En route',
    timestamp: new Date().toISOString()
  });

  broadcastWebSocketPayload(payload);
}

function stopTracking() {
  if (interval) clearInterval(interval);
  interval = null;
}

module.exports = { setupLiveTracking, stopTracking, broadcastRealVehicleGps };
