/**
 * Safar Admin Security Module (admin-security.js)
 * Production Security: CSRF token management, JWT Bearer header injection, HMAC-SHA256 request signing, DOMPurify sanitization.
 */
(function (window) {
  'use strict';

  const HMAC_SECRET = 'safar_prod_hmac_secret_key_2026';
  let cachedCsrfToken = null;

  /**
   * Initializes security context and fetches CSRF token from server
   */
  async function initSecurity() {
    try {
      const res = await fetch('/api/v1/auth/csrf-token', { method: 'GET', headers: { 'Accept': 'application/json' } });
      const json = await res.json();
      if (json.success && json.data && json.data.csrfToken) {
        cachedCsrfToken = json.data.csrfToken;
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
          metaTag.setAttribute('content', cachedCsrfToken);
        }
      }
    } catch (e) {
      console.warn('[AdminSecurity] Failed to fetch CSRF token on init:', e);
    }
  }

  /**
   * Returns current CSRF token
   */
  function getCsrfToken() {
    if (cachedCsrfToken) return cachedCsrfToken;
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
  }

  /**
   * Generates HMAC-SHA256 signature string for sensitive endpoint requests
   */
  async function generateSignature(method, path, timestampStr, bodyObj) {
    try {
      const bodyStr = bodyObj ? JSON.stringify(bodyObj) : '';
      const payloadToSign = `${method.toUpperCase()}:${path}:${timestampStr}:${bodyStr}`;
      
      const encoder = new TextEncoder();
      const keyData = encoder.encode(HMAC_SECRET);
      const messageData = encoder.encode(payloadToSign);

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const hexSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hexSignature;
    } catch (e) {
      console.error('[AdminSecurity] Failed to calculate HMAC signature:', e);
      return '';
    }
  }

  /**
   * Helper to build secure fetch headers with JWT Bearer token, CSRF token, and optional HMAC signature
   */
  async function getSecurityHeaders(method = 'GET', path = '', bodyObj = null, requiresSigning = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-Token': getCsrfToken()
    };

    if (window.adminAuthService && window.adminAuthService.accessToken) {
      headers['Authorization'] = `Bearer ${window.adminAuthService.accessToken}`;
    }

    if (requiresSigning) {
      const timestampStr = String(Date.now());
      const signature = await generateSignature(method, path, timestampStr, bodyObj);
      headers['X-Signature'] = signature;
      headers['X-Timestamp'] = timestampStr;
    }

    return headers;
  }

  /**
   * HTML sanitization via DOMPurify with fallback text encoding
   */
  function sanitizeInput(dirtyText) {
    if (typeof dirtyText !== 'string') return '';
    if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
      return window.DOMPurify.sanitize(dirtyText, { ALLOWED_TAGS: [] });
    }
    // Fallback encoding if DOMPurify CDN is unavailable
    const div = document.createElement('div');
    div.textContent = dirtyText;
    return div.innerHTML;
  }

  /**
   * Validates stop_name regex: /^[a-zA-Z0-9\s\-\.,()]+$/
   */
  function validateStopName(name) {
    const regex = /^[a-zA-Z0-9\s\-\.,()]+$/;
    return typeof name === 'string' && regex.test(name.trim());
  }

  // Export module to global scope
  window.AdminSecurity = {
    initSecurity,
    getCsrfToken,
    generateSignature,
    getSecurityHeaders,
    sanitizeInput,
    validateStopName
  };

})(window);
