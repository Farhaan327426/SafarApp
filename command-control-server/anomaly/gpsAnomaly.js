// command-control-server/anomaly/gpsAnomaly.js

/**
 * Calculate Haversine distance in kilometers between two GPS coordinates
 */
function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Major tunnels across Jammu & Kashmir with coordinate bounding boxes & buffers
const TUNNELS = [
  {
    name: 'Jawahar Tunnel (NH-44)',
    minLat: 33.48, maxLat: 33.58,
    minLng: 75.15, maxLng: 75.25
  },
  {
    name: 'Banihal-Qazigund Road Tunnel (Navyug Tunnel)',
    minLat: 33.45, maxLat: 33.62,
    minLng: 75.12, maxLng: 75.22
  },
  {
    name: 'Dr. Syama Prasad Mookerjee Tunnel (Chenani-Nashri)',
    minLat: 33.00, maxLat: 33.15,
    minLng: 75.25, maxLng: 75.35
  },
  {
    name: 'Nandni Tunnels (Jammu-Udhampur Highway)',
    minLat: 32.80, maxLat: 32.90,
    minLng: 74.95, maxLng: 75.05
  }
];

const MAX_SPEED_KMH = 100;         // Surface road standard speed cap
const REJECT_SPEED_KMH = 200;      // Instant rejection speed cap (impossible ground velocity)
const TUNNEL_MAX_SPEED_KMH = 150;  // Allowed velocity inside tunnel bounding boxes
const WINDOW_SIZE = 5;

const positionHistory = new Map(); // driverId/vehicleNo -> Array<{lat, lng, timestamp}>

function isInsideTunnel(lat, lng) {
  return TUNNELS.some(t =>
    lat >= t.minLat && lat <= t.maxLat &&
    lng >= t.minLng && lng <= t.maxLng
  );
}

function detectGpsAnomaly(driverId, newPoint) {
  const history = positionHistory.get(driverId) || [];
  
  if (history.length === 0) {
    history.push(newPoint);
    positionHistory.set(driverId, history);
    return { anomaly: false, speedKmh: 0 };
  }

  const prev = history[history.length - 1];
  const distanceKm = calculateHaversine(prev.lat, prev.lng, newPoint.lat, newPoint.lng);
  const timeDeltaHours = (newPoint.timestamp - prev.timestamp) / 3600000;

  if (timeDeltaHours <= 0) {
    return { anomaly: true, reason: 'non_monotonic_time', speedKmh: 0 };
  }

  const speedKmh = distanceKm / timeDeltaHours;

  const prevInTunnel = isInsideTunnel(prev.lat, prev.lng);
  const currInTunnel = isInsideTunnel(newPoint.lat, newPoint.lng);

  // 1. Check tunnel-aware velocity allowance
  if (prevInTunnel || currInTunnel) {
    if (speedKmh <= TUNNEL_MAX_SPEED_KMH) {
      history.push(newPoint);
      if (history.length > WINDOW_SIZE) history.shift();
      positionHistory.set(driverId, history);
      return { anomaly: false, speedKmh, inTunnel: true };
    }
  }

  // 2. Reject impossible speeds (> 200 km/h or > 100 km/h on non-tunnel roads)
  if (speedKmh > MAX_SPEED_KMH) {
    return {
      anomaly: true,
      reason: speedKmh > REJECT_SPEED_KMH ? 'impossible_teleport' : 'speed_exceeded',
      speedKmh: Math.round(speedKmh),
      distanceKm: Number(distanceKm.toFixed(2)),
      timeDeltaSecs: Math.round((newPoint.timestamp - prev.timestamp) / 1000)
    };
  }

  // Valid point: update history
  history.push(newPoint);
  if (history.length > WINDOW_SIZE) history.shift();
  positionHistory.set(driverId, history);

  return { anomaly: false, speedKmh: Math.round(speedKmh) };
}

function resetHistory(driverId) {
  if (driverId) positionHistory.delete(driverId);
  else positionHistory.clear();
}

module.exports = {
  detectGpsAnomaly,
  isInsideTunnel,
  calculateHaversine,
  resetHistory,
  TUNNELS,
  MAX_SPEED_KMH,
  TUNNEL_MAX_SPEED_KMH,
  REJECT_SPEED_KMH
};
