/**
 * SAFAR — Permissions Bridge Module
 * Geolocation with IP fallback, continuous watchPosition, permission query
 * All permission requests require explicit user gesture
 */

// ─── Geolocation ──────────────────────────────────────────────────────────────

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000
};

let _watchId = null;
let _lastKnownPosition = null;

/**
 * Query geolocation permission state without triggering a prompt.
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt' | 'unsupported'
 */
async function queryGeolocationPermission() {
  if (!('permissions' in navigator)) return 'unsupported';

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state; // 'granted', 'denied', 'prompt'
  } catch (err) {
    console.error('[Permissions] Geolocation permission query failed:', err);
    return 'unsupported';
  }
}

/**
 * Request one-time geolocation fix. Must be called from user gesture.
 * Falls back to IP-based geolocation if denied.
 * @returns {Promise<{lat: number, lng: number, source: string}>}
 */
async function requestGeolocation() {
  if (!('geolocation' in navigator)) {
    console.error('[Permissions] Geolocation API not available');
    return _fallbackIPGeolocation();
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _lastKnownPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'gps',
          timestamp: pos.timestamp
        };
        resolve(_lastKnownPosition);
      },
      (err) => {
        _handleGeoError(err);
        // Fallback to IP-based on any error
        resolve(_fallbackIPGeolocation());
      },
      GEO_OPTIONS
    );
  });
}

/**
 * Start continuous geolocation watch for live tracking.
 * @param {Function} onUpdate - Called with {lat, lng, accuracy, speed, heading}
 * @param {Function} onError - Called with error info
 * @returns {number|null} watchId for clearing
 */
function startContinuousWatch(onUpdate, onError) {
  if (!('geolocation' in navigator)) {
    console.error('[Permissions] Geolocation API not available for watch');
    if (onError) onError({ code: 0, message: 'Geolocation not supported' });
    return null;
  }

  // Clear any existing watch
  stopContinuousWatch();

  _watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const data = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        altitude: pos.coords.altitude,
        source: 'gps_watch',
        timestamp: pos.timestamp
      };
      _lastKnownPosition = data;
      if (onUpdate) onUpdate(data);
    },
    (err) => {
      const errInfo = _handleGeoError(err);
      if (onError) onError(errInfo);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000 // Tighter cache for live tracking
    }
  );

  return _watchId;
}

/**
 * Stop continuous geolocation watch.
 */
function stopContinuousWatch() {
  if (_watchId !== null) {
    navigator.geolocation.clearWatch(_watchId);
    _watchId = null;
  }
}

/**
 * Get last known position without triggering a new request.
 * @returns {{lat, lng, source, timestamp}|null}
 */
function getLastKnownPosition() {
  return _lastKnownPosition;
}

/**
 * Handle geolocation errors with specific code mapping.
 * @param {GeolocationPositionError} err
 * @returns {{code: number, message: string, action: string}}
 */
function _handleGeoError(err) {
  const errorMap = {
    1: { code: 1, message: 'Location permission denied by user', action: 'show_manual_input' },
    2: { code: 2, message: 'Position unavailable (device/network issue)', action: 'retry_with_fallback' },
    3: { code: 3, message: 'Location request timed out', action: 'retry' }
  };

  const info = errorMap[err.code] || { code: err.code, message: err.message, action: 'unknown' };
  console.error(`[Permissions] Geolocation error (code ${info.code}): ${info.message}`);
  return info;
}

/**
 * IP-based geolocation fallback when GPS is denied/unavailable.
 * Uses free ipapi.co service. Returns approximate location.
 * @returns {Promise<{lat: number, lng: number, source: string}>}
 */
async function _fallbackIPGeolocation() {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      const position = {
        lat: data.latitude || 34.08,
        lng: data.longitude || 74.80,
        accuracy: 5000, // ~5km accuracy for IP
        source: 'ip_fallback',
        city: data.city,
        region: data.region,
        timestamp: Date.now()
      };
      _lastKnownPosition = position;
      return position;
    }
  } catch (err) {
    console.error('[Permissions] IP geolocation fallback failed:', err);
  }

  // Ultimate fallback: Srinagar center
  return {
    lat: 34.0837,
    lng: 74.7973,
    accuracy: 50000,
    source: 'default_srinagar',
    timestamp: Date.now()
  };
}

// ─── Generic Permission Query ─────────────────────────────────────────────────

/**
 * Query any permission state by name.
 * @param {string} permName - e.g. 'camera', 'microphone', 'notifications'
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt' | 'unsupported'
 */
async function queryPermission(permName) {
  if (!('permissions' in navigator)) return 'unsupported';

  try {
    const result = await navigator.permissions.query({ name: permName });
    return result.state;
  } catch (err) {
    // Some permission names aren't queryable on all browsers
    console.error(`[Permissions] Query for '${permName}' failed:`, err);
    return 'unsupported';
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.SafarPermissions = {
    queryGeolocationPermission,
    requestGeolocation,
    startContinuousWatch,
    stopContinuousWatch,
    getLastKnownPosition,
    queryPermission
  };
}
