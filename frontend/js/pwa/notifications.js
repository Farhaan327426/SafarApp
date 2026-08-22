/**
 * SAFAR — Push Notifications Module
 * VAPID subscription, Notification.requestPermission on user gesture only
 * Push event handling is in sw.js
 */

// Replace with your actual VAPID public key
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkGs-GDL1_0xZqO5FPPMndJ7T0hEfEfPZzj6YBqPvo';

let _pushSubscription = null;

// ─── Permission ───────────────────────────────────────────────────────────────

/**
 * Check current notification permission state.
 * @returns {string} 'granted' | 'denied' | 'default' | 'unsupported'
 */
function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission. MUST be called from a user gesture (click/tap).
 * @returns {Promise<string>} 'granted' | 'denied' | 'default'
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.error('[Notifications] Notification API not supported');
    return 'unsupported';
  }

  // Already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // Already denied — can't re-prompt
  if (Notification.permission === 'denied') {
    console.error('[Notifications] Permission previously denied. User must enable in browser settings.');
    return 'denied';
  }

  try {
    const result = await Notification.requestPermission();
    console.log(`[Notifications] Permission result: ${result}`);
    return result;
  } catch (err) {
    console.error('[Notifications] Permission request failed:', err);
    return 'default';
  }
}

// ─── Push Subscription ───────────────────────────────────────────────────────

/**
 * Subscribe to push notifications via service worker.
 * Requires notification permission to be 'granted' first.
 * @returns {Promise<PushSubscription|null>}
 */
async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('[Notifications] Push API not supported');
    return null;
  }

  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.error('[Notifications] Notification permission not granted. Cannot subscribe to push.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      _pushSubscription = existing;
      console.log('[Notifications] Existing push subscription found');
      return existing;
    }

    // Create new subscription with VAPID key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    _pushSubscription = subscription;
    console.log('[Notifications] Push subscription created');

    // Send subscription to server for storage
    await _sendSubscriptionToServer(subscription);

    return subscription;
  } catch (err) {
    console.error('[Notifications] Push subscription failed:', err);
    return null;
  }
}

/**
 * Unsubscribe from push notifications.
 * @returns {Promise<boolean>}
 */
async function unsubscribeFromPush() {
  if (!_pushSubscription) {
    // Try to get from service worker
    try {
      const registration = await navigator.serviceWorker.ready;
      _pushSubscription = await registration.pushManager.getSubscription();
    } catch (err) {
      console.error('[Notifications] Failed to get subscription:', err);
      return false;
    }
  }

  if (!_pushSubscription) {
    console.log('[Notifications] No active subscription to unsubscribe');
    return true;
  }

  try {
    const success = await _pushSubscription.unsubscribe();
    if (success) {
      _pushSubscription = null;
      console.log('[Notifications] Push subscription removed');
    }
    return success;
  } catch (err) {
    console.error('[Notifications] Unsubscribe failed:', err);
    return false;
  }
}

/**
 * Get current push subscription (if any).
 * @returns {PushSubscription|null}
 */
function getPushSubscription() {
  return _pushSubscription;
}

// ─── Local Notifications ──────────────────────────────────────────────────────

/**
 * Show a local notification (non-push). Requires granted permission.
 * @param {string} title
 * @param {object} options - { body, icon, tag, data, actions }
 * @returns {Notification|null}
 */
function showLocalNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.error('[Notifications] Cannot show notification — permission not granted');
    return null;
  }

  try {
    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/icons/icon-192.png',
      badge: options.badge || '/icons/icon-72.png',
      tag: options.tag || 'safar-local-' + Date.now(),
      vibrate: options.vibrate || [200, 100, 200],
      data: options.data || {},
      requireInteraction: options.requireInteraction || false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) options.onClick();
    };

    return notification;
  } catch (err) {
    console.error('[Notifications] Local notification failed:', err);
    return null;
  }
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function _urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function _sendSubscriptionToServer(subscription) {
  try {
    const response = await fetch('/api/v1/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        user_agent: navigator.userAgent,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      console.error('[Notifications] Server subscription storage failed:', response.status);
    }
  } catch (err) {
    // Queue for later if offline
    console.error('[Notifications] Failed to send subscription to server:', err);
    if (window.SafarNetwork) {
      window.SafarNetwork.queueRequest('/api/v1/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() })
      });
    }
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.SafarNotifications = {
    getNotificationPermission,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    getPushSubscription,
    showLocalNotification
  };
}
