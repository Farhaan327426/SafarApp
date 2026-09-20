/**
 * SAFAR Transit Icon Registry (frontend/js/icons.js)
 * Centralized stroke-based geometric SVG icon system.
 * Specification: stroke="currentColor", stroke-linecap="round", stroke-linejoin="round", fill="none".
 */

var SafarIcons = (function () {
  'use strict';

  // SVG Path Definitions (24x24 viewBox)
  var ICON_PATHS = {
    // ── Transport Modes ──
    bus: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/><path d="M4 11h16"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/><path d="M6 19v2"/><path d="M18 19v2"/>',
    minibus: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/><path d="M4 11h16"/><path d="M10 4v7"/><circle cx="7.5" cy="15" r="1.5"/><circle cx="16.5" cy="15" r="1.5"/><path d="M6 18v2"/><path d="M18 18v2"/>',
    car: '<path d="M5 11l2-5h10l2 5H5z"/><rect x="3" y="11" width="18" height="6" rx="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    taxi: '<path d="M5 11l2-5h10l2 5H5z"/><rect x="3" y="11" width="18" height="6" rx="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 3h6v3H9z"/>',
    auto: '<path d="M5 14h14l-2-6H7l-2 6z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M12 4v4"/><path d="M5 14v3"/><path d="M19 14v3"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    train: '<rect x="4" y="3" width="16" height="15" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><circle cx="8" cy="15" r="1.5"/><circle cx="16" cy="15" r="1.5"/><line x1="6" y1="18" x2="3" y2="21"/><line x1="18" y1="18" x2="21" y2="21"/>',

    // ── Emergency & Legal ──
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    emergency: '<path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    police: '<path d="M12 2a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-3V6a4 4 0 0 0-4-4z"/><circle cx="12" cy="14" r="2"/>',
    ambulance: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M12 9v6"/><path d="M9 12h6"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    female: '<circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/>',
    trafficLight: '<rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',

    // ── Wayfinding & Transit Geography ──
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    mountain: '<polygon points="3 20 9 10 15 20 3 20"/><polygon points="13 20 17 14 21 20 13 20"/>',
    snowflake: '<line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><line x1="12" y1="12" x2="18.5" y2="5.5"/>',

    // ── Actions, Utilities & Documents ──
    receipt: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    speaker: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    sparkles: '<path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><circle cx="12" cy="12" r="3"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  };

  // Aliases for intuitive key resolution
  var ALIASES = {
    matador: 'minibus',
    sumo: 'car',
    cab: 'taxi',
    rickshaw: 'auto',
    route: 'bus',
    fare: 'receipt',
    complaint: 'receipt',
    warning: 'alert',
    hazard: 'alert',
    sos: 'emergency',
    location: 'mapPin',
    pin: 'mapPin',
    crowd: 'users',
    close: 'x',
    right: 'arrowRight',
    left: 'arrowLeft',
    snow: 'snowflake',
    night: 'moon',
    dossier: 'receipt',
    voice: 'mic',
    audio: 'speaker',
    gps: 'mapPin',
    photo: 'camera'
  };

  return {
    /**
     * Get an inline SVG markup string.
     * @param {string} name - The icon key or alias (e.g. 'bus', 'alert', 'shield')
     * @param {Object} [options]
     * @param {number} [options.size=18] - Width/height in pixels
     * @param {string} [options.className=''] - Additional CSS classes
     * @param {number} [options.strokeWidth=1.8] - Stroke width
     * @returns {string} Safe inline SVG element string
     */
    get: function (name, options) {
      options = options || {};
      var size = options.size || 18;
      var className = options.className ? 'safar-icon ' + options.className : 'safar-icon';
      var strokeWidth = options.strokeWidth || 1.8;

      var key = (name || '').toLowerCase().trim();
      var resolved = ICON_PATHS[key] ? key : (ALIASES[key] || 'compass');
      var inner = ICON_PATHS[resolved] || ICON_PATHS.compass;

      return '<svg class="' + className + '" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    },

    /**
     * Helper to render an occupancy status pip.
     * @param {'green'|'amber'|'rose'|'available'|'standing'|'overload'} level
     * @returns {string} HTML span element
     */
    statusPip: function (level) {
      var lvl = (level || '').toLowerCase();
      var colorClass = 'pip-green';
      if (lvl === 'standing' || lvl === 'amber' || lvl === 'yellow') {
        colorClass = 'pip-amber';
      } else if (lvl === 'overload' || lvl === 'rose' || lvl === 'red') {
        colorClass = 'pip-rose';
      }
      return '<span class="status-pip ' + colorClass + '" aria-hidden="true"></span>';
    },

    has: function (name) {
      var key = (name || '').toLowerCase().trim();
      return Boolean(ICON_PATHS[key] || ALIASES[key]);
    }
  };
})();

// Attach to environment globals
if (typeof window !== 'undefined') {
  window.SafarIcons = SafarIcons;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SafarIcons = SafarIcons;
}
