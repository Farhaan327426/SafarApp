/**
 * SAFAR — Service Worker Registration
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then(function(reg) { console.log('[SW] PWA Service Worker Registered:', reg.scope); })
      .catch(function(err) { console.warn('[SW] Registration deferred:', err.message); });
  });
}
