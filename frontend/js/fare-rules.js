/**
 * SAFAR — Official J&K Transport Authority Regulated Fare Engine
 * IIFE-scoped module — NOT exposed on window (security: prevents script injection manipulation)
 *
 * Fetches SRO fare rules from backend API with:
 * - 1-hour TTL cache matching server Cache-Control max-age
 * - Stale-on-failure for offline resilience (returns last known data if fetch fails)
 * - IndexedDB caching via Service Worker for public SRO data (government notifications)
 */

// eslint-disable-next-line no-unused-vars
const FareEngine = (() => {
  'use strict';

  let _sroCache = null;
  let _sroCacheTime = 0;
  const CACHE_TTL = 60 * 60 * 1000; // 1 hour — matches server Cache-Control max-age=3600

  /**
   * Fetches active SRO notifications from the backend API.
   * Caches in-memory for CACHE_TTL. On fetch failure, serves stale data for offline resilience.
   * @returns {Promise<Array>} Array of active SRO fare source notifications with fare rules
   */
  async function fetchSroNotifications() {
    const now = Date.now();
    if (_sroCache && (now - _sroCacheTime) < CACHE_TTL) {
      return _sroCache;
    }

    try {
      const resp = await fetch('/api/v1/sro/notifications');
      if (!resp.ok) {
        // Serve stale on failure — offline resilience
        if (_sroCache) {
          console.warn('[FareEngine] API fetch failed, serving stale SRO cache');
          return _sroCache;
        }
        throw new Error(`SRO API returned ${resp.status}`);
      }

      const json = await resp.json();
      if (json.success && json.data) {
        _sroCache = json.data;
        _sroCacheTime = now;

        // Persist to IndexedDB for Service Worker offline access (public data only)
        _persistToIndexedDB(json.data);
      }
      return _sroCache;
    } catch (err) {
      console.error('[FareEngine] SRO fetch error:', err);
      // Try IndexedDB fallback
      if (!_sroCache) {
        const idbData = await _loadFromIndexedDB();
        if (idbData) {
          _sroCache = idbData;
          _sroCacheTime = now;
          return _sroCache;
        }
      }
      // Serve stale if available
      if (_sroCache) return _sroCache;
      throw new Error('No SRO fare data available (API unreachable and no cached data)');
    }
  }

  /**
   * Computes the official regulated fare for a given vehicle type and distance.
   * Returns null if no matching verified rule is found (FARE_NOT_AVAILABLE).
   * @param {string} vehicleType - Vehicle category (e.g., 'MINI_BUS', 'TATA_MAGIC')
   * @param {number} distanceKm - Travel distance in kilometers
   * @returns {Promise<{fare: number, source: object}|null>}
   */
  /**
   * Computes the official regulated fare for a given vehicle type and distance.
   * Uses active SRO notifications from API or fallback SRO-97 statutory calculation engine.
   * @param {string} vehicleType - Vehicle category (e.g., 'MINI_BUS', 'TATA_MAGIC')
   * @param {number} distanceKm - Travel distance in kilometers
   * @returns {Promise<{fare: number, source: object}>}
   */
  async function getOfficialFare(vehicleType, distanceKm, passengerCategory = 'General') {
    if (!vehicleType || !distanceKm || distanceKm <= 0 || isNaN(distanceKm)) {
      return null;
    }

    const normalizedType = String(vehicleType).toUpperCase().replace(/[\s-]+/g, '_');

    // 1. Try Remote / Cached SRO notifications API if available
    try {
      const sources = await fetchSroNotifications();
      if (sources && sources.length) {
        for (const source of sources) {
          if (!source.fareRules || !source.fareRules.length) continue;

          for (const rule of source.fareRules) {
            if (rule.vehicleType !== normalizedType) continue;
            if (rule.verificationStatus !== 'VERIFIED') continue;

            let discountMult = 1.0;
            if (passengerCategory === 'Student' || passengerCategory === 'Specially Abled') discountMult = 0.5;
            else if (passengerCategory === 'Senior Citizen') discountMult = 0.75;

            if (rule.fareBasis === 'PER_KM' && rule.perKmRate) {
              return {
                fare: Math.max(5, Math.ceil(distanceKm * rule.perKmRate * discountMult)),
                source: {
                  authority: source.authority || 'J&K Transport Department',
                  notification: source.notificationNumber || 'SRO-97 / MVD-2026',
                  date: source.notificationDate || '2026-05-01'
                }
              };
            }

            if (rule.fareBasis === 'DISTANCE_SLAB') {
              if (rule.flatFare && distanceKm >= (rule.distanceMinKm || 0) &&
                  (!rule.distanceMaxKm || distanceKm <= rule.distanceMaxKm)) {
                return {
                  fare: Math.max(5, Math.ceil(rule.flatFare * discountMult)),
                  source: {
                    authority: source.authority || 'J&K Transport Department',
                    notification: source.notificationNumber || 'SRO-97 / MVD-2026',
                    date: source.notificationDate || '2026-05-01'
                  }
                };
              }

              if (rule.perKmRate) {
                let fare = 0;
                if (rule.firstKmRate) {
                  fare = rule.firstKmRate + Math.max(0, distanceKm - 1) * (rule.subsequentKmRate || rule.perKmRate);
                } else {
                  fare = distanceKm * rule.perKmRate;
                }
                return {
                  fare: Math.max(5, Math.ceil(fare * discountMult)),
                  source: {
                    authority: source.authority || 'J&K Transport Department',
                    notification: source.notificationNumber || 'SRO-97 / MVD-2026',
                    date: source.notificationDate || '2026-05-01'
                  }
                };
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[FareEngine] SRO notification check warning, applying SRO-97 statutory engine:', e);
    }

    // 2. Statutory Fallback Engine: J&K Transport Department SRO-97 Schedule
    // Vehicle Multipliers relative to base Mini-Bus Stage Carriage
    const vehicleMultipliers = {
      BIG_BUS: 0.95,
      MINI_BUS: 1.00,
      TATA_MAGIC: 1.10,
      SHARED_VAN: 1.15,
      PETROL_AUTO: 1.25,
      E_AUTO: 0.85,
      E_RICKSHAW: 0.80,
      TAXI_MAXI_CAB_BASE: 1.30,
      TAXI_MEDIUM_TOURIST: 2.00,
      TAXI_PREMIUM_TOURIST: 2.50
    };

    const mult = vehicleMultipliers[normalizedType] || 1.0;

    // SRO-97 Base Slab Calculation (≤20km)
    let baseFare = 9;
    if (distanceKm <= 3) {
      baseFare = 9;
    } else if (distanceKm <= 5) {
      baseFare = 14;
    } else if (distanceKm <= 10) {
      baseFare = 17;
    } else if (distanceKm <= 15) {
      baseFare = 20;
    } else if (distanceKm <= 20) {
      baseFare = 26;
    } else {
      // Over 20km: ₹26 + ₹1.40/km for distance beyond 20km
      baseFare = 26 + Math.ceil((distanceKm - 20) * 1.40);
    }

    let discountMult = 1.0;
    if (passengerCategory === 'Student' || passengerCategory === 'Specially Abled') {
      discountMult = 0.5;
    } else if (passengerCategory === 'Senior Citizen') {
      discountMult = 0.75;
    }

    const calculatedFare = Math.max(5, Math.round(baseFare * mult * discountMult));

    return {
      fare: calculatedFare,
      source: {
        authority: 'J&K Transport Department',
        notification: 'SRO-97 / MVD-2026',
        date: '2026-05-01'
      }
    };
  }

  /**
   * Returns the list of active SRO notifications for display in the SRO modal.
   * @returns {Promise<Array>}
   */
  async function getNotifications() {
    return fetchSroNotifications();
  }

  // ─── IndexedDB Persistence (SRO data only — public government notifications) ──
  const IDB_NAME = 'safar_sro_cache';
  const IDB_STORE = 'sro_notifications';
  const IDB_VERSION = 1;

  function _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'cacheKey' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function _persistToIndexedDB(data) {
    try {
      const db = await _openDB();
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ cacheKey: 'active_sro', data, timestamp: Date.now() });
      tx.oncomplete = () => db.close();
    } catch (e) {
      console.warn('[FareEngine] IndexedDB persist failed:', e);
    }
  }

  async function _loadFromIndexedDB() {
    try {
      const db = await _openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get('active_sro');
        req.onsuccess = () => {
          db.close();
          resolve(req.result ? req.result.data : null);
        };
        req.onerror = () => {
          db.close();
          resolve(null);
        };
      });
    } catch (e) {
      return null;
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────────
  return {
    getOfficialFare,
    fetchSroNotifications,
    getNotifications
  };
})();
