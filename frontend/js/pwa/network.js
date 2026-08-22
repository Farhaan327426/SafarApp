/**
 * SAFAR — Network Detection & Request Queue Module
 * Online/offline detection, visual UI state, request retry queue
 */

let _isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let _offlineQueue = [];
let _connectivityListenersAttached = false;
let _offlineBanner = null;

/**
 * Initialize network detection and UI state management.
 * Call once from DOMContentLoaded.
 */
function initNetworkDetection() {
  if (typeof window === 'undefined') return;

  _isOnline = navigator.onLine;

  if (!_connectivityListenersAttached) {
    window.addEventListener('online', _handleOnline);
    window.addEventListener('offline', _handleOffline);
    _connectivityListenersAttached = true;
  }

  // Create offline banner element
  _createOfflineBanner();

  // Set initial state
  if (!_isOnline) {
    _showOfflineBanner();
  }
}

/**
 * Check if the app currently has network connectivity.
 * @returns {boolean}
 */
function isOnline() {
  return _isOnline;
}

/**
 * Queue a failed request for retry when connectivity returns.
 * @param {string} url
 * @param {object} options - fetch options (method, headers, body)
 */
function queueRequest(url, options = {}) {
  _offlineQueue.push({
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    url,
    method: options.method || 'GET',
    headers: options.headers || { 'Content-Type': 'application/json' },
    body: options.body || null,
    timestamp: Date.now(),
    retries: 0
  });

  console.error('[Network] Request queued for retry:', url);

  // Also try to register background sync if SW supports it
  _registerBackgroundSync();
}

/**
 * Fetch wrapper that auto-queues on failure.
 * @param {string} url
 * @param {object} options
 * @returns {Promise<Response|null>}
 */
async function resilientFetch(url, options = {}) {
  if (!_isOnline) {
    queueRequest(url, options);
    return null;
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    console.error('[Network] Fetch failed, queueing:', url, err);
    queueRequest(url, options);
    return null;
  }
}

/**
 * Get count of pending queued requests.
 * @returns {number}
 */
function getQueuedRequestCount() {
  return _offlineQueue.length;
}

// ─── Internal Handlers ────────────────────────────────────────────────────────

function _handleOnline() {
  _isOnline = true;
  console.log('[Network] Connectivity restored');
  _hideOfflineBanner();
  _processQueue();
}

function _handleOffline() {
  _isOnline = false;
  console.error('[Network] Connectivity lost');
  _showOfflineBanner();
}

async function _processQueue() {
  if (_offlineQueue.length === 0) return;

  console.log(`[Network] Processing ${_offlineQueue.length} queued requests`);

  const queue = [..._offlineQueue];
  _offlineQueue = [];

  for (const item of queue) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });
      console.log('[Network] Queued request succeeded:', item.url);
    } catch (err) {
      item.retries++;
      if (item.retries < 3) {
        _offlineQueue.push(item);
        console.error('[Network] Queued request retry failed, re-queuing:', item.url);
      } else {
        console.error('[Network] Queued request permanently failed after 3 retries:', item.url);
      }
    }
  }
}

function _createOfflineBanner() {
  if (_offlineBanner) return;

  _offlineBanner = document.createElement('div');
  _offlineBanner.id = 'safar-offline-banner';
  _offlineBanner.setAttribute('role', 'alert');
  _offlineBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 99999;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      text-align: center;
      padding: 8px 16px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 20px rgba(239,68,68,0.4);
      transform: translateY(-100%);
      transition: transform 0.35s ease;
    " id="safar-offline-inner">
      <span>📵</span>
      <span>You're offline — fare calculator & cached routes still work</span>
    </div>
  `;
  document.body.appendChild(_offlineBanner);
}

function _showOfflineBanner() {
  // Public banner disabled
}

function _hideOfflineBanner() {
  // Public banner disabled
}

async function _registerBackgroundSync() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
      await reg.sync.register('safar-offline-queue');
    }
  } catch (err) {
    console.error('[Network] Background sync registration failed:', err);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.SafarNetwork = {
    initNetworkDetection,
    isOnline,
    queueRequest,
    resilientFetch,
    getQueuedRequestCount
  };
}
