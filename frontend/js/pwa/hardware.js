/**
 * SAFAR — Hardware Bridge Module
 * Battery status, haptic feedback, device orientation, WebBluetooth, clipboard
 */

// ─── Battery Status ───────────────────────────────────────────────────────────

let _battery = null;
let _batteryCallbacks = [];
let _lowPowerMode = false;

/**
 * Initialize battery monitoring.
 * Listens for charging changes and level drops.
 * @param {object} callbacks - { onLow: fn, onCritical: fn, onCharging: fn }
 */
async function initBatteryMonitor(callbacks = {}) {
  if (!('getBattery' in navigator)) {
    console.error('[Hardware] Battery Status API not supported');
    return null;
  }

  try {
    _battery = await navigator.getBattery();
    _batteryCallbacks = callbacks;

    // Initial check
    _evaluateBatteryLevel();

    // Listen for changes
    _battery.addEventListener('chargingchange', _evaluateBatteryLevel);
    _battery.addEventListener('levelchange', _evaluateBatteryLevel);
    _battery.addEventListener('chargingtimechange', _evaluateBatteryLevel);

    return getBatteryStatus();
  } catch (err) {
    console.error('[Hardware] Battery monitor init failed:', err);
    return null;
  }
}

/**
 * Get current battery status.
 * @returns {{level: number, charging: boolean, chargingTime: number, dischargingTime: number}|null}
 */
function getBatteryStatus() {
  if (!_battery) return null;

  return {
    level: Math.round(_battery.level * 100),
    charging: _battery.charging,
    chargingTime: _battery.chargingTime,
    dischargingTime: _battery.dischargingTime,
    lowPowerMode: _lowPowerMode
  };
}

/**
 * Check if low power mode is active (battery < 10%).
 * @returns {boolean}
 */
function isLowPowerMode() {
  return _lowPowerMode;
}

function _evaluateBatteryLevel() {
  if (!_battery) return;

  const level = Math.round(_battery.level * 100);
  const charging = _battery.charging;

  // Below 10%: critical — disable high-drain features
  if (level <= 10 && !charging) {
    _lowPowerMode = true;
    console.error(`[Hardware] CRITICAL battery: ${level}%. Disabling map animations.`);
    _disableHighDrainFeatures();
    if (_batteryCallbacks.onCritical) _batteryCallbacks.onCritical(level);
  }
  // Below 20%: warn driver console
  else if (level <= 20 && !charging) {
    _lowPowerMode = false;
    console.error(`[Hardware] Low battery warning: ${level}%`);
    if (_batteryCallbacks.onLow) _batteryCallbacks.onLow(level);
  }
  // Normal or charging
  else {
    if (_lowPowerMode) {
      _lowPowerMode = false;
      _enableHighDrainFeatures();
    }
    if (_batteryCallbacks.onCharging && charging) {
      _batteryCallbacks.onCharging(level);
    }
  }
}

function _disableHighDrainFeatures() {
  // Pause Leaflet map animations
  const mapEl = document.getElementById('commuterMap');
  if (mapEl) {
    mapEl.style.willChange = 'auto';
  }

  // Pause CSS animations globally via class
  document.body.classList.add('safar-low-power');

  // Reduce GPS polling
  if (window.SafarPermissions) {
    window.SafarPermissions.stopContinuousWatch();
  }
}

function _enableHighDrainFeatures() {
  document.body.classList.remove('safar-low-power');
}

// ─── Haptic Feedback ──────────────────────────────────────────────────────────

/**
 * Trigger haptic vibration pattern.
 * @param {'alert'|'error'|'success'|'tap'|number[]} pattern
 */
function hapticFeedback(pattern) {
  if (!('vibrate' in navigator)) {
    return; // Silent — haptics not supported
  }

  const patterns = {
    alert: [200, 100, 200],     // Double buzz for arrival alerts, fare confirmation
    error: [500],               // Long buzz for error states
    success: [100],             // Short tap for success
    tap: [50],                  // Micro tap for UI feedback
    sos: [300, 100, 300, 100, 300] // SOS pattern
  };

  try {
    const vibrationPattern = Array.isArray(pattern) ? pattern : (patterns[pattern] || [100]);
    navigator.vibrate(vibrationPattern);
  } catch (err) {
    console.error('[Hardware] Vibration failed:', err);
  }
}

/**
 * Cancel any ongoing vibration.
 */
function cancelHaptic() {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch (err) {
      // Silent
    }
  }
}

// ─── Device Orientation ───────────────────────────────────────────────────────
// EXPERIMENTAL: DeviceOrientation — requires requestPermission() on iOS 13+

let _orientationCallback = null;

/**
 * Request device orientation permission (required on iOS 13+).
 * Must be called from user gesture.
 * @param {Function} onHeading - Called with compass heading in degrees
 * @returns {Promise<boolean>} Whether permission was granted
 */
async function requestOrientationPermission(onHeading) {
  // iOS 13+ requires explicit permission
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') {
        console.error('[Hardware] Device orientation permission denied');
        return false;
      }
    } catch (err) {
      console.error('[Hardware] Device orientation permission request failed:', err);
      return false;
    }
  }

  _orientationCallback = onHeading;
  window.addEventListener('deviceorientation', _handleOrientation, true);
  return true;
}

/**
 * Stop listening to device orientation.
 */
function stopOrientationWatch() {
  window.removeEventListener('deviceorientation', _handleOrientation, true);
  _orientationCallback = null;
}

function _handleOrientation(event) {
  // Compass heading: alpha is 0-360 degrees
  // webkitCompassHeading is iOS-specific, more accurate
  const heading = event.webkitCompassHeading || (360 - (event.alpha || 0));

  if (_orientationCallback) {
    _orientationCallback({
      heading: Math.round(heading),
      beta: event.beta,   // Front-back tilt
      gamma: event.gamma, // Left-right tilt
      absolute: event.absolute
    });
  }
}

// ─── WebBluetooth ─────────────────────────────────────────────────────────────
// EXPERIMENTAL: Web Bluetooth API — <50% global browser support — fallback required

/**
 * Scan for and connect to a driver hardware console via Bluetooth.
 * Must be called from user gesture.
 * @param {object} serviceFilters - Bluetooth service UUID filters
 * @returns {Promise<BluetoothDevice|null>}
 */
async function connectBluetoothDevice(serviceFilters = {}) {
  // EXPERIMENTAL: Web Bluetooth API — fallback required
  if (!('bluetooth' in navigator)) {
    console.error('[Hardware] WebBluetooth API not supported in this browser');
    return null;
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: serviceFilters.filters || [{ services: ['battery_service'] }],
      optionalServices: serviceFilters.optionalServices || []
    });

    console.log('[Hardware] Bluetooth device found:', device.name);

    const server = await device.gatt.connect();
    console.log('[Hardware] Bluetooth GATT connected');

    return { device, server };
  } catch (err) {
    console.error('[Hardware] Bluetooth connection failed:', err);
    return null;
  }
}

// EXPERIMENTAL: WebHID API — <50% global browser support — fallback required

/**
 * Connect to a USB HID device (fallback for Bluetooth).
 * Must be called from user gesture.
 * @returns {Promise<HIDDevice|null>}
 */
async function connectUSBHID() {
  // EXPERIMENTAL: WebHID API — fallback required
  if (!('hid' in navigator)) {
    console.error('[Hardware] WebHID API not supported');
    return null;
  }

  try {
    const devices = await navigator.hid.requestDevice({ filters: [] });
    if (devices.length > 0) {
      const device = devices[0];
      await device.open();
      console.log('[Hardware] USB HID device connected:', device.productName);
      return device;
    }
    return null;
  } catch (err) {
    console.error('[Hardware] USB HID connection failed:', err);
    return null;
  }
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

/**
 * Copy text to clipboard. Must be called from user gesture.
 * Falls back to document.execCommand('copy') for legacy browsers.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
  // Modern Clipboard API
  if ('clipboard' in navigator && 'writeText' in navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('[Hardware] Clipboard API write failed:', err);
      // Fall through to legacy
    }
  }

  // Legacy fallback
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  } catch (err) {
    console.error('[Hardware] Legacy clipboard copy failed:', err);
    return false;
  }
}

/**
 * Copy a fare/route share string to clipboard with haptic feedback.
 * @param {string} routeName
 * @param {number} fare
 * @returns {Promise<boolean>}
 */
async function shareFareInfo(routeName, fare) {
  const text = `🚍 SAFAR Fare\nRoute: ${routeName}\nFare: ₹${fare}\nCalculated using Transport Department regulated rates\nhttps://safarkashmir.in`;
  const success = await copyToClipboard(text);
  if (success) {
    hapticFeedback('success');
  }
  return success;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.SafarHardware = {
    // Battery
    initBatteryMonitor,
    getBatteryStatus,
    isLowPowerMode,
    // Haptics
    hapticFeedback,
    cancelHaptic,
    // Orientation
    requestOrientationPermission,
    stopOrientationWatch,
    // Bluetooth
    connectBluetoothDevice,
    connectUSBHID,
    // Clipboard
    copyToClipboard,
    shareFareInfo
  };
}
