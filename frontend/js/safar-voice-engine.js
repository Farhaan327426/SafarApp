/**
 * SAFAR PRO — Voice Engine (STT, TTS, Barge-in, Voice State Machine)
 * ===================================================
 * File: frontend/js/safar-voice-engine.js
 * Features:
 * - Central VoiceState Machine (IDLE, LISTENING, THINKING, SPEAKING, WAITING, ERROR)
 * - Barge-in: Immediate interruption of TTS when commuter speaks or taps mic
 * - Multilingual STT & TTS (en-IN, hi-IN, ur-IN)
 * - Dynamic Voice loading with onvoiceschanged race prevention
 * - Natural endpointing & silence management
 */

const SafarVoiceEngine = (() => {
  'use strict';

  // 1. Voice State Machine Constants
  const VoiceState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking',
    WAITING: 'waiting',
    ERROR: 'error'
  };

  const VALID_TRANSITIONS = {
    [VoiceState.IDLE]: [VoiceState.LISTENING, VoiceState.THINKING, VoiceState.WAITING, VoiceState.ERROR],
    [VoiceState.LISTENING]: [VoiceState.THINKING, VoiceState.IDLE, VoiceState.WAITING, VoiceState.ERROR],
    [VoiceState.THINKING]: [VoiceState.SPEAKING, VoiceState.WAITING, VoiceState.IDLE, VoiceState.ERROR],
    [VoiceState.SPEAKING]: [VoiceState.LISTENING, VoiceState.WAITING, VoiceState.IDLE, VoiceState.ERROR], // Listening = Barge-in
    [VoiceState.WAITING]: [VoiceState.LISTENING, VoiceState.THINKING, VoiceState.IDLE, VoiceState.ERROR],
    [VoiceState.ERROR]: [VoiceState.IDLE, VoiceState.LISTENING]
  };

  let currentState = VoiceState.IDLE;
  const stateListeners = new Set();

  function getState() {
    return currentState;
  }

  function setState(nextState, context = {}) {
    if (nextState === currentState) return;

    const allowed = VALID_TRANSITIONS[currentState] || [];
    if (!allowed.includes(nextState)) {
      console.warn(`[VoiceEngine] Transition ignored: ${currentState} -> ${nextState}`);
      return;
    }

    const prevState = currentState;
    currentState = nextState;

    stateListeners.forEach(listener => {
      try {
        listener(currentState, prevState, context);
      } catch (err) {
        console.error('[VoiceEngine Listener Error]', err);
      }
    });
  }

  function onStateChange(callback) {
    stateListeners.add(callback);
    return () => stateListeners.delete(callback);
  }

  /* ─────────────────────────────────────────────────────────────────
     VOICE OUTPUT MANAGER (TTS & BARGE-IN)
  ───────────────────────────────────────────────────────────────── */
  class VoiceOutputManager {
    constructor() {
      this.currentUtterance = null;
      this.isSpeaking = false;
      this.preferredVoices = {};
      this._initVoices();
    }

    _initVoices() {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      const cacheVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || !voices.length) return;

        this.preferredVoices['en-IN'] = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN') ||
                                        voices.find(v => v.lang.startsWith('en'));
        this.preferredVoices['hi-IN'] = voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi_IN') ||
                                        voices.find(v => v.lang.startsWith('hi'));
        this.preferredVoices['ur-IN'] = voices.find(v => v.lang === 'ur-IN' || v.lang === 'ur_IN') ||
                                        this.preferredVoices['hi-IN'] ||
                                        this.preferredVoices['en-IN'];
      };

      cacheVoices();
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = cacheVoices;
      }
    }

    getVoiceForLang(langCode) {
      const code = langCode || 'en-IN';
      return this.preferredVoices[code] || this.preferredVoices['en-IN'] || null;
    }

    speak(text, lang = 'en-IN', onStart = null, onEnd = null) {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
      }

      this.stop(); // Stop any active speech

      if (!text || !text.trim()) {
        if (onEnd) onEnd();
        return;
      }

      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.96;
        utter.pitch = 1.0;
        utter.lang = lang;

        const voice = this.getVoiceForLang(lang);
        if (voice) utter.voice = voice;

        utter.onstart = () => {
          this.isSpeaking = true;
          this.currentUtterance = utter;
          setState(VoiceState.SPEAKING);
          if (onStart) onStart();
        };

        utter.onend = () => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          if (currentState === VoiceState.SPEAKING) {
            setState(VoiceState.IDLE);
          }
          if (onEnd) onEnd();
        };

        utter.onerror = (err) => {
          console.warn('[SpeechSynthesis Error]', err);
          this.isSpeaking = false;
          this.currentUtterance = null;
          if (currentState === VoiceState.SPEAKING) {
            setState(VoiceState.IDLE);
          }
          if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn('[SpeechSynthesis Exception]', err);
        this.isSpeaking = false;
        if (onEnd) onEnd();
      }
    }

    /**
     * Immediate cancellation for barge-in
     */
    interrupt() {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
      this.isSpeaking = false;
      this.currentUtterance = null;
    }

    stop() {
      this.interrupt();
      if (currentState === VoiceState.SPEAKING) {
        setState(VoiceState.IDLE);
      }
    }
  }

  const voiceOutput = new VoiceOutputManager();

  /* ─────────────────────────────────────────────────────────────────
     SPEECH RECOGNITION (STT) WITH BARGE-IN & ENDPOINTING
  ───────────────────────────────────────────────────────────────── */
  let activeRecognition = null;
  let silenceTimer = null;
  let maxSpeechTimeout = null;

  function getSpeechRecClass() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function isSupported() {
    return !!getSpeechRecClass();
  }

  /**
   * Explicitly request and verify microphone hardware permission
   */
  async function requestMicrophonePermission() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Check if SpeechRecognition is at least present
      if (!getSpeechRecClass()) {
        return { granted: false, reason: 'BROWSER_UNSUPPORTED' };
      }
      return { granted: true }; // Fallback to SpeechRec browser prompt
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop all tracks to release hardware light/indicator
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch (err) {
      console.warn('[Microphone Permission Error]', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return { granted: false, reason: 'MIC_PERMISSION_DENIED' };
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        return { granted: false, reason: 'MIC_NOT_FOUND' };
      }
      return { granted: false, reason: 'MIC_ERROR', message: err.message };
    }
  }

  /**
   * Start single-turn listening session with endpointing
   */
  function startListening({
    lang = 'en-IN',
    onInterim = null,
    onFinal = null,
    onError = null
  } = {}) {
    // BARGE-IN: If TTS is speaking, interrupt it instantly!
    if (voiceOutput.isSpeaking || currentState === VoiceState.SPEAKING) {
      voiceOutput.interrupt();
    }

    stopListening();

    const SpeechRec = getSpeechRecClass();
    if (!SpeechRec) {
      setState(VoiceState.ERROR, { reason: 'BROWSER_UNSUPPORTED' });
      if (onError) onError({ code: 'BROWSER_UNSUPPORTED', error: 'not-supported' });
      return false;
    }

    try {
      const recognition = new SpeechRec();
      // Single-turn mode gives clean, predictable endpointing & natural turn transitions
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 2;

      recognition.onstart = () => {
        setState(VoiceState.LISTENING);
      };

      recognition.onspeechstart = () => {
        clearTimeout(silenceTimer);
      };

      recognition.onspeechend = () => {
        // Natural endpointing: wait 1400ms after user stops speaking
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (currentState === VoiceState.LISTENING) {
            stopListening();
          }
        }, 1400);
      };

      recognition.onresult = (evt) => {
        let interim = '';
        let final = '';

        for (let i = evt.resultIndex; i < evt.results.length; ++i) {
          const item = evt.results[i][0];
          if (evt.results[i].isFinal) {
            final += item.transcript;
          } else {
            interim += item.transcript;
          }
        }

        const combined = (final || interim).trim();
        if (combined && onInterim) {
          onInterim(combined, !!final);
        }

        if (final) {
          clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (currentState === VoiceState.LISTENING) {
              stopListening();
              if (onFinal) onFinal(combined);
            }
          }, 1200);
        }
      };

      recognition.onerror = (evt) => {
        console.warn('[STT Error]', evt.error);
        clearTimeout(silenceTimer);
        clearTimeout(maxSpeechTimeout);

        let code = 'RECOGNITION_ERROR';
        if (evt.error === 'not-allowed') {
          code = 'MIC_PERMISSION_DENIED';
          setState(VoiceState.ERROR, { reason: 'MIC_PERMISSION_DENIED' });
        } else if (evt.error === 'audio-capture') {
          code = 'MIC_NOT_FOUND';
          setState(VoiceState.ERROR, { reason: 'MIC_NOT_FOUND' });
        } else if (evt.error === 'network') {
          code = 'NETWORK_ERROR';
          setState(VoiceState.ERROR, { reason: 'NETWORK_ERROR' });
        } else if (evt.error === 'no-speech') {
          code = 'NO_SPEECH';
          setState(VoiceState.IDLE);
        } else if (evt.error === 'language-not-supported') {
          code = 'LANGUAGE_UNAVAILABLE';
          setState(VoiceState.ERROR, { reason: 'LANGUAGE_UNAVAILABLE' });
        } else {
          setState(VoiceState.ERROR, { reason: evt.error });
        }

        if (onError) onError({ code, rawError: evt.error });
      };

      recognition.onend = () => {
        clearTimeout(silenceTimer);
        clearTimeout(maxSpeechTimeout);
        if (currentState === VoiceState.LISTENING) {
          setState(VoiceState.IDLE);
        }
      };

      // Safety timeout after 15 seconds
      maxSpeechTimeout = setTimeout(() => {
        if (currentState === VoiceState.LISTENING) {
          stopListening();
        }
      }, 15000);

      activeRecognition = recognition;
      recognition.start();
      return true;
    } catch (err) {
      console.warn('[STT Exception]', err);
      setState(VoiceState.ERROR, { reason: err.message });
      if (onError) onError({ code: 'RECOGNITION_ERROR', error: err.message });
      return false;
    }
  }

  function stopListening() {
    clearTimeout(silenceTimer);
    clearTimeout(maxSpeechTimeout);

    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (_) {}
      activeRecognition = null;
    }

    if (currentState === VoiceState.LISTENING) {
      setState(VoiceState.IDLE);
    }
  }

  return {
    VoiceState,
    getState,
    setState,
    onStateChange,
    voiceOutput,
    isSupported,
    requestMicrophonePermission,
    startListening,
    stopListening,
    speak: (text, lang, onStart, onEnd) => voiceOutput.speak(text, lang, onStart, onEnd),
    stopSpeaking: () => voiceOutput.stop(),
    interrupt: () => voiceOutput.interrupt()
  };
})();

// Attach to global scope
if (typeof window !== 'undefined') {
  window.SafarVoiceEngine = SafarVoiceEngine;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SafarVoiceEngine = SafarVoiceEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafarVoiceEngine;
}
