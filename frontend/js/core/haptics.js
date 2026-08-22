/**
 * SAFAR — Haptic Touch Feedback Engine (Singleton)
 */

let _hapticContext = null;

export function getHapticContext() {
  if (!_hapticContext && typeof window !== "undefined") {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        _hapticContext = new AudioCtx();
      } catch (e) { }
    }
  }
  return _hapticContext;
}

export function triggerHaptic(duration = 100) {
  try {
    const ctx = getHapticContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => { });
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    }
  } catch (e) { /* silent — audio not critical */ }

  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(duration);
    } catch (e) { }
  }
}
