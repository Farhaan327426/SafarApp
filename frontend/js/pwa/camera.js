/**
 * SAFAR — Camera & QR Module
 * getUserMedia with environment camera, permission check, graceful degradation
 * Stream release on modal close
 */

let _activeStream = null;
let _videoElement = null;

// ─── Permission Check ─────────────────────────────────────────────────────────

/**
 * Check camera permission state without triggering prompt.
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt' | 'unsupported'
 */
async function queryCameraPermission() {
  if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
    return 'unsupported';
  }

  if ('permissions' in navigator) {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      return result.state;
    } catch (err) {
      // 'camera' query not supported on all browsers — that's OK
      return 'prompt';
    }
  }

  return 'prompt';
}

// ─── Camera Stream ────────────────────────────────────────────────────────────

/**
 * Start camera stream for QR scanning. Must be called from user gesture.
 * Prefers environment (rear) camera for ticket scanning.
 * @param {HTMLVideoElement|string} videoElementOrId - Video element or its ID
 * @returns {Promise<{stream: MediaStream, track: MediaStreamTrack}|null>}
 */
async function startCameraStream(videoElementOrId) {
  if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
    console.error('[Camera] getUserMedia API not supported');
    _showManualEntryFallback();
    return null;
  }

  // Release any existing stream first
  stopCameraStream();

  try {
    // Try environment (rear) camera first
    _activeStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
  } catch (envErr) {
    // Fallback to any available camera
    try {
      _activeStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
    } catch (anyErr) {
      console.error('[Camera] All camera access failed:', anyErr);

      if (anyErr.name === 'NotAllowedError') {
        console.error('[Camera] Permission denied by user');
      } else if (anyErr.name === 'NotFoundError') {
        console.error('[Camera] No camera device found');
      } else if (anyErr.name === 'NotReadableError') {
        console.error('[Camera] Camera already in use by another application');
      }

      _showManualEntryFallback();
      return null;
    }
  }

  // Attach stream to video element
  _videoElement = typeof videoElementOrId === 'string'
    ? document.getElementById(videoElementOrId)
    : videoElementOrId;

  if (_videoElement && _activeStream) {
    _videoElement.srcObject = _activeStream;
    _videoElement.setAttribute('playsinline', 'true'); // iOS Safari
    _videoElement.setAttribute('autoplay', 'true');

    try {
      await _videoElement.play();
    } catch (playErr) {
      console.error('[Camera] Video play failed:', playErr);
    }

    const videoTrack = _activeStream.getVideoTracks()[0];
    return { stream: _activeStream, track: videoTrack };
  }

  return null;
}

/**
 * Stop camera stream and release hardware.
 * Call this when QR scan modal is closed.
 */
function stopCameraStream() {
  if (_activeStream) {
    _activeStream.getTracks().forEach(track => {
      track.stop();
    });
    _activeStream = null;
  }

  if (_videoElement) {
    _videoElement.srcObject = null;
    _videoElement = null;
  }
}

/**
 * Check if camera stream is currently active.
 * @returns {boolean}
 */
function isCameraActive() {
  return _activeStream !== null && _activeStream.active;
}

/**
 * Get camera capabilities (resolution, zoom, torch).
 * @returns {object|null}
 */
function getCameraCapabilities() {
  if (!_activeStream) return null;

  const track = _activeStream.getVideoTracks()[0];
  if (!track) return null;

  try {
    const capabilities = track.getCapabilities();
    const settings = track.getSettings();
    return { capabilities, settings };
  } catch (err) {
    console.error('[Camera] Get capabilities failed:', err);
    return null;
  }
}

/**
 * Toggle flashlight/torch (if device supports it).
 * @param {boolean} on
 * @returns {Promise<boolean>}
 */
async function toggleTorch(on) {
  if (!_activeStream) return false;

  const track = _activeStream.getVideoTracks()[0];
  if (!track) return false;

  try {
    const capabilities = track.getCapabilities();
    if (!capabilities.torch) {
      console.error('[Camera] Torch not supported on this device');
      return false;
    }

    await track.applyConstraints({
      advanced: [{ torch: on }]
    });
    return true;
  } catch (err) {
    console.error('[Camera] Torch toggle failed:', err);
    return false;
  }
}

// ─── QR Code Scanning Scaffold ────────────────────────────────────────────────

/**
 * Capture a single frame from the video stream for QR processing.
 * Returns an ImageData object that can be fed to a QR decoder.
 * NOTE: Actual QR decoding requires a decoder library (jsQR, zxing, etc.)
 * This provides the raw frame capture scaffold.
 * @param {HTMLVideoElement} videoEl
 * @returns {ImageData|null}
 */
function captureFrame(videoEl) {
  if (!videoEl || videoEl.readyState < videoEl.HAVE_CURRENT_DATA) {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.error('[Camera] Frame capture failed:', err);
    return null;
  }
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function _showManualEntryFallback() {
  // Emit custom event so UI can show manual ticket code input
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('safar-camera-denied', {
      detail: { reason: 'Camera access denied or unavailable. Use manual ticket code entry.' }
    }));
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.SafarCamera = {
    queryCameraPermission,
    startCameraStream,
    stopCameraStream,
    isCameraActive,
    getCameraCapabilities,
    toggleTorch,
    captureFrame
  };
}
