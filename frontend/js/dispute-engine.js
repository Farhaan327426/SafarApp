/**
 * SafarApp — Dispute Engine & Voice Assistant
 * Modules: Intent Classifier · SRO-97 Fare Matrix · Overcharge Calculator
 *          · Digital Dispute Card Generator · Web Speech STT/TTS Verbal Negotiator
 *          · Full Backward-Compatibility for Safar Commuter Defense Layer
 *
 * Statutory basis: SRO-97 (J&K Transport Dept), Motor Vehicles Act 1988
 * Sections cited: 192A (Permit violation/Fare gouging) · 194A (Overloading) · 177 · 179
 */

'use strict';

// ─── SRO-97 Fare Matrix ───────────────────────────────────────────────────────
// Stage-based fares (₹). Source: J&K Transport Dept gazette SRO-97.
// Structure: routeKey → { stages: [{km, fare}], nightHike: 0.20 }
// nightHike = 20% statutory surcharge post-19:00 hrs.

const SRO97_FARE_MATRIX = {
  // Srinagar intra-city & periphery
  'lal-chowk_batamaloo':        { stages: [{ km: 3.2, fare: 10 }],  nightHike: 0.20 },
  'lal-chowk_dalgate':          { stages: [{ km: 2.8, fare: 10 }],  nightHike: 0.20 },
  'lal-chowk_hazratbal':        { stages: [{ km: 5.5, fare: 15 }],  nightHike: 0.20 },
  'lal-chowk_hyderpora':        { stages: [{ km: 7.0, fare: 20 }],  nightHike: 0.20 },
  'lal-chowk_pantha-chowk':     { stages: [{ km: 9.5, fare: 25 }],  nightHike: 0.20 },
  'lal-chowk_anantnag':         { stages: [{ km: 56,  fare: 90 }],  nightHike: 0.20 },
  'lal-chowk_baramulla':        { stages: [{ km: 55,  fare: 90 }],  nightHike: 0.20 },
  'lal-chowk_budgam':           { stages: [{ km: 14,  fare: 25 }],  nightHike: 0.20 },
  'srinagar_pulwama':            { stages: [{ km: 38,  fare: 60 }],  nightHike: 0.20 },
  'srinagar_shopian':            { stages: [{ km: 65,  fare: 100 }], nightHike: 0.20 },
  'srinagar_sopore':             { stages: [{ km: 48,  fare: 75 }],  nightHike: 0.20 },
  'srinagar_kupwara':            { stages: [{ km: 97,  fare: 140 }], nightHike: 0.20 },
  // Jammu intra-city & periphery
  'jammu_rs-pura':               { stages: [{ km: 24,  fare: 40 }],  nightHike: 0.20 },
  'jammu_bishnah':               { stages: [{ km: 29,  fare: 50 }],  nightHike: 0.20 },
  'jammu_akhnoor':               { stages: [{ km: 32,  fare: 55 }],  nightHike: 0.20 },
  'jammu_katra':                 { stages: [{ km: 48,  fare: 80 }],  nightHike: 0.20 },
  'jammu_udhampur':              { stages: [{ km: 68,  fare: 110 }], nightHike: 0.20 },
  'jammu_banihal':               { stages: [{ km: 129, fare: 200 }], nightHike: 0.20 },
  // Anantnag sub-division
  'anantnag_bijbehara':          { stages: [{ km: 9,   fare: 15 }],  nightHike: 0.20 },
  'anantnag_kokernag':           { stages: [{ km: 21,  fare: 35 }],  nightHike: 0.20 },
  'anantnag_pahalgam':           { stages: [{ km: 28,  fare: 50 }],  nightHike: 0.20 },
};

// Fallback per-km rate when no route key matched (₹ per km)
const FALLBACK_RATE_PER_KM = 2.5;
const NIGHT_HOUR_START = 19; // 7:00 PM

// ─── Legacy Tariff Definitions (Backward-Compatibility) ──────────────────────
const STATUTORY_TARIFFS = {
  matador_minibus: { baseKm: 3, baseFare: 10, perKmAfter: 2.2, label: "Minibus / Matador (Stage Carriage)" },
  shared_sumo:     { baseKm: 4, baseFare: 15, perKmAfter: 3.5, label: "Shared Cab / Sumo / Tavera" },
  e_rickshaw:      { baseKm: 2, baseFare: 10, perKmAfter: 5.0, label: "E-Rickshaw (Short-Hop Point-to-Point)" },
  auto_rickshaw:   { baseKm: 1.5, baseFare: 18, perKmAfter: 12.0, label: "Metered Auto Rickshaw" }
};

const CORRIDORS = {
  "lal chowk-batamaloo": { dist: 3.2, mode: "matador_minibus" },
  "lal chowk-dalgate": { dist: 2.8, mode: "matador_minibus" },
  "lal chowk-hazratbal": { dist: 10.5, mode: "matador_minibus" },
  "pantha chowk-lal chowk": { dist: 8.4, mode: "matador_minibus" },
  "jahangir chowk-budgam": { dist: 14.0, mode: "shared_sumo" },
  "jewel chowk-talab tillo": { dist: 4.1, mode: "matador_minibus" },
  "jewel chowk-rs pura": { dist: 22.0, mode: "shared_sumo" }
};

// ─── Intent Classifier ───────────────────────────────────────────────────────

const INTENT_PATTERNS = {
  FARE_DISPUTE: [
    /(?:charging|demand|le raha|maang raha|zyada|extra|adhik|beshi).{0,40}(?:rupe|rs|₹|\d+)/i,
    /(?:overcharge|over.charge|overfar|kitna kiraya|kiraya batao)/i,
    /(?:\d+)\s*(?:rupe|rs|₹).{0,20}(?:kyon|kyun|why|galat|wrong|illegal)/i,
  ],
  ROUTE_QUERY: [
    /(?:route|raste|kahan se|which bus|koi bus|schedule|time)/i,
    /(?:from|se|to|tak|jaana|going).{0,30}(?:bus|sumo|matador|vehicle)/i,
  ],
  SAFETY_ALERT: [
    /(?:overload|bhara hua|full|crowded|hanging|footboard|unsafe|danger)/i,
    /(?:driver|chauffeur).{0,30}(?:fast|tez|rash|drunk|nasha)/i,
  ],
  LIVE_ETA: [
    /(?:kab aayegi|when.{0,10}bus|eta|arrive|kitni der|how long)/i,
  ],
  GRIEVANCE: [
    /(?:complain|shikayat|report|FIR|RTO|traffic police|authority)/i,
  ],
};

/**
 * Classify user input into one of the intent categories.
 * Returns { intent: string, confidence: number }
 */
function classifyIntent(text) {
  const results = [];
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const matched = patterns.filter(p => p.test(text)).length;
    if (matched > 0) {
      results.push({ intent, confidence: matched / patterns.length });
    }
  }
  results.sort((a, b) => b.confidence - a.confidence);
  return results[0] || { intent: 'UNKNOWN', confidence: 0 };
}

// ─── Fare Lookup ─────────────────────────────────────────────────────────────

/**
 * Normalize a location string to a lookup key fragment.
 */
function normalizeLocation(raw) {
  if (!raw) return '';
  return raw.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/^(from|to|lal)\s+/i, '')
    .trim();
}

/**
 * Find statutory fare for a route.
 * Tries both directions (A→B, B→A).
 * Returns { fare, routeKey, source, distanceKm } or null if not found.
 */
function lookupStatutoryFare(fromRaw, toRaw, isNight = false) {
  const from = normalizeLocation(fromRaw);
  const to   = normalizeLocation(toRaw);
  const key1 = `${from}_${to}`;
  const key2 = `${to}_${from}`;

  const entry = SRO97_FARE_MATRIX[key1] || SRO97_FARE_MATRIX[key2];
  if (entry) {
    const baseFare = entry.stages[entry.stages.length - 1].fare;
    const fare = isNight ? Math.ceil(baseFare * (1 + entry.nightHike)) : baseFare;
    return {
      fare,
      baseFare,
      nightSurcharge: isNight ? Math.ceil(baseFare * entry.nightHike) : 0,
      routeKey: key1,
      distanceKm: entry.stages[entry.stages.length - 1].km,
      source: 'SRO-97',
      isNight,
    };
  }
  return null;
}

/**
 * Calculate overcharge discrepancy.
 * Returns structured dispute object.
 */
function calculateDiscrepancy(chargedFare, statutoryFare, routeData) {
  const discrepancy = chargedFare - statutoryFare;
  const isOvercharge = discrepancy > 0;
  const mvaSections = [];

  if (discrepancy > 0) {
    mvaSections.push({ section: '192A', desc: 'Fare exceeding permitted rate — permit violation' });
    mvaSections.push({ section: '177',  desc: 'General traffic law contravention' });
  }

  return {
    isOvercharge,
    chargedFare,
    statutoryFare,
    discrepancy: Math.abs(discrepancy),
    percentOver: isOvercharge ? Math.round((discrepancy / statutoryFare) * 100) : 0,
    routeData,
    mvaSections,
    timestamp: new Date().toISOString(),
    id: `DISP-${Date.now()}`,
  };
}

// ─── Dispute Card Generator ───────────────────────────────────────────────────

/**
 * Returns dispute card HTML element.
 */
function generateDisputeCard(dispute) {
  const { chargedFare, statutoryFare, discrepancy, routeData, mvaSections, isOvercharge } = dispute;
  const nightNote = routeData?.isNight
    ? `<span class="fare-night-badge">+20% Night Rate Applied</span>` : '';

  const sectionsHtml = mvaSections.map(s =>
    `<li>MVA §${s.section} — ${s.desc}</li>`
  ).join('');

  const card = document.createElement('div');
  card.className = `dispute-card ${isOvercharge ? 'dispute-card--alert' : 'dispute-card--valid'}`;
  card.setAttribute('data-dispute-id', dispute.id);
  card.setAttribute('role', 'alert');
  card.setAttribute('aria-live', 'assertive');

  card.innerHTML = `
    <div class="dispute-card__header">
      <span class="dispute-card__label">
        ${isOvercharge ? 'OVERCHARGE DETECTED' : 'FARE VERIFIED'}
      </span>
      <button class="dispute-card__close" aria-label="Close" onclick="this.closest('.dispute-card').remove()">✕</button>
    </div>

    <div class="dispute-card__fares">
      <div class="dispute-card__fare dispute-card__fare--official">
        <span class="fare-amount">₹${statutoryFare}</span>
        <span class="fare-label">Official SRO-97 Fare</span>
        ${nightNote}
      </div>
      ${isOvercharge ? `
      <div class="dispute-card__fare dispute-card__fare--demanded">
        <span class="fare-amount">₹${chargedFare}</span>
        <span class="fare-label">Demanded by Driver</span>
      </div>
      <div class="dispute-card__overcharge">
        <span class="overcharge-amount">₹${discrepancy} EXCESS</span>
        <span class="overcharge-pct">${dispute.percentOver}% above legal limit</span>
      </div>` : ''}
    </div>

    ${isOvercharge ? `
    <div class="dispute-card__legal">
      <strong>Applicable Sections:</strong>
      <ul>${sectionsHtml}</ul>
    </div>` : ''}

    <div class="dispute-card__actions">
      <button class="btn btn--speak" onclick="DisputeEngine.speakDispute(${JSON.stringify(dispute).replace(/"/g, '&quot;')})">
        Speak to Driver
      </button>
      <button class="btn btn--evidence" onclick="EvidenceLocker.openWithDispute(${JSON.stringify(dispute).replace(/"/g, '&quot;')})">
        File Complaint
      </button>
      <button class="btn btn--lang" onclick="DisputeEngine.toggleDisputeLanguage(this.closest('.dispute-card'))">
        اردو / EN
      </button>
    </div>

    <div class="dispute-card__qr-note">
      <span class="qr-certified">◉ SRO-97 Certified — Valid Offline</span>
      <span class="dispute-ts">${new Date(dispute.timestamp).toLocaleString('en-IN')}</span>
    </div>
  `;

  // Urdu translation overlay (hidden by default, toggled by lang button)
  const urduOverlay = document.createElement('div');
  urduOverlay.className = 'dispute-card__urdu hidden';
  urduOverlay.dir = 'rtl';
  urduOverlay.lang = 'ur';
  urduOverlay.innerHTML = `
    <p class="urdu-main">
      محکمہ ٹرانسپورٹ کے سرکاری نوٹیفکیشن (SRO-97) کے مطابق اس روٹ کا کرایہ
      <strong>صرف ₹${statutoryFare} روپے</strong> ہے۔
      ${isOvercharge
        ? `<br>زیادہ کرایہ وصول کرنا (₹${discrepancy} اضافی) قانوناً جرم ہے — دفعہ 192A موٹر وہیکل ایکٹ۔`
        : `کرایہ درست ہے۔`}
    </p>
  `;
  card.appendChild(urduOverlay);

  return card;
}

// ─── Web Speech: STT & TTS Verbal Negotiator ─────────────────────────────────

const SpeechAPI = (() => {
  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  let recognition = null;
  let isListening = false;

  function isSTTSupported() { return !!SpeechRecognition; }
  function isTTSSupported() { return !!synth; }

  function startListening({ lang = 'ur-IN', onResult, onError, onEnd }) {
    if (!isSTTSupported()) {
      onError?.('Speech recognition not supported. Please type your query.');
      return;
    }
    if (isListening) stopListening();

    try {
      recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onresult = (event) => {
        const alternatives = Array.from(event.results[0]);
        const best = alternatives.sort((a, b) => b.confidence - a.confidence)[0];
        onResult?.(best.transcript.trim());
      };

      recognition.onerror = (event) => {
        isListening = false;
        const msg = event.error === 'not-allowed'
          ? 'Microphone access denied. Allow mic permission in browser settings.'
          : `Recognition error: ${event.error}`;
        onError?.(msg);
      };

      recognition.onend = () => {
        isListening = false;
        onEnd?.();
      };

      recognition.start();
      isListening = true;
    } catch (err) {
      isListening = false;
      onError?.(err.message || 'Speech recognition initialization failed');
    }
  }

  function stopListening() {
    try {
      recognition?.stop();
    } catch (_) {}
    isListening = false;
  }

  function speakVerdict(dispute, lang = 'ur-IN') {
    if (!isTTSSupported()) return;
    if (synth.speaking) synth.cancel();

    const { statutoryFare, discrepancy, isOvercharge } = dispute;

    const scripts = {
      'ur-IN': isOvercharge
        ? `محکمہ ٹرانسپورٹ کے سرکاری نوٹیفکیشن کے مطابق اس روٹ کا کرایہ صرف ${statutoryFare} روپے ہے۔ آپ نے ${discrepancy} روپے زیادہ مانگے۔ یہ قانوناً جرم ہے — دفعہ ایک سو بانوے۔`
        : `کرایہ درست ہے۔ ${statutoryFare} روپے سرکاری نرخ ہے۔`,

      'hi-IN': isOvercharge
        ? `परिवहन विभाग की अधिसूचना के अनुसार इस मार्ग का किराया केवल ${statutoryFare} रुपये है। आपने ${discrepancy} रुपये अधिक माँगे। यह मोटर वाहन अधिनियम की धारा एक सौ बानवे के तहत अपराध है।`
        : `किराया सही है। ${statutoryFare} रुपये आधिकारिक दर है।`,

      'en-IN': isOvercharge
        ? `According to the Transport Department notification, the official fare for this route is ${statutoryFare} rupees. You have demanded ${discrepancy} rupees extra. This is an offense under Section 192A of the Motor Vehicles Act.`
        : `The fare is correct. ${statutoryFare} rupees is the statutory rate.`,
    };

    const text = scripts[lang] || scripts['ur-IN'];
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.88;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    const voices = synth.getVoices();
    const preferred = voices.find(v => v.lang === lang)
      || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (preferred) utter.voice = preferred;

    synth.speak(utter);
    return utter;
  }

  return {
    startListening,
    stopListening,
    speakVerdict,
    isSTTSupported,
    isTTSSupported,
    get isListening() { return isListening; }
  };
})();

// ─── Parse Fare From Natural Language ────────────────────────────────────────

function parseFareStatement(text) {
  if (!text) return { from: null, to: null, chargedFare: null };

  const fareMatch = text.match(/(?:₹|rs\.?\s*|rupe\s*)(\d+)/i)
    || text.match(/(\d+)\s*(?:₹|rs\.?|rupe)/i)
    || text.match(/\b(\d{2,3})\b/);
  const chargedFare = fareMatch ? parseInt(fareMatch[1], 10) : null;

  let from = null, to = null;
  const enMatch = text.match(/from\s+([a-z\s\-]+?)\s+to\s+([a-z\s\-]+?)(?:\s+\d|$)/i);
  const urMatch = text.match(/([a-z\s\-]+?)\s+se\s+([a-z\s\-]+?)(?:\s+\d|$)/i);
  const match = enMatch || urMatch;
  if (match) {
    from = match[1].trim();
    to   = match[2].trim();
  }

  return { from, to, chargedFare };
}

// ─── Legacy Compatibility Methods ─────────────────────────────────────────────

function calculateLegalFare(vehicleType, distanceKm, isNight = false) {
  const tariff = STATUTORY_TARIFFS[vehicleType] || STATUTORY_TARIFFS.matador_minibus;
  let fare = tariff.baseFare;

  if (distanceKm > tariff.baseKm) {
    const extraKm = distanceKm - tariff.baseKm;
    fare += Math.ceil(extraKm * tariff.perKmAfter);
  }

  if (isNight) {
    fare = Math.round(fare * 1.20);
  }

  return {
    legalFare: fare,
    breakdown: `${tariff.label}: Base ₹${tariff.baseFare} for ${tariff.baseKm}km + ₹${tariff.perKmAfter}/km thereafter${isNight ? ' (+20% night tariff)' : ''}`
  };
}

function verifyFare(origin, destination, demandedFare, vehicleType = "matador_minibus") {
  const normO = (origin || "").toLowerCase().trim();
  const normD = (destination || "").toLowerCase().trim();
  const key = `${normO}-${normD}`;
  const reverseKey = `${normD}-${normO}`;
  const corridor = CORRIDORS[key] || CORRIDORS[reverseKey] || { dist: 4.0, mode: vehicleType };

  const now = new Date();
  const isNight = now.getHours() >= NIGHT_HOUR_START || now.getHours() < 6;

  // Try checking exact SRO-97 matrix first
  const matrixResult = lookupStatutoryFare(origin, destination, isNight);
  let legalFare = null;
  let breakdown = '';
  let distanceKm = corridor.dist;

  if (matrixResult) {
    legalFare = matrixResult.fare;
    distanceKm = matrixResult.distanceKm;
    breakdown = `SRO-97 Statutory Gazette Rate (${distanceKm} km)${isNight ? ' +20% night tariff' : ''}`;
  } else {
    const legacyCalc = calculateLegalFare(corridor.mode || vehicleType, corridor.dist, isNight);
    legalFare = legacyCalc.legalFare;
    breakdown = legacyCalc.breakdown;
  }

  const demanded = Number(demandedFare);
  const overcharge = Math.max(0, demanded - legalFare);

  return {
    origin,
    destination,
    distanceKm,
    demandedFare: demanded,
    legalFare,
    overcharge,
    isViolation: overcharge > 0,
    breakdown,
    mvaSection: "Section 192A / SRO-97",
    penaltyNotice: "Permit Violation: fine up to ₹10,000 and suspension of route authorization."
  };
}

function parseDisputeQuery(rawText) {
  const parsed = parseFareStatement(rawText || '');
  return {
    origin: parsed.from || "Lal Chowk",
    destination: parsed.to || "Batamaloo",
    demandedFare: parsed.chargedFare || 30
  };
}

function verbalNegotiationTTS(legalFare, origin, destination) {
  const disputeMock = {
    statutoryFare: legalFare,
    chargedFare: legalFare + 10,
    discrepancy: 10,
    isOvercharge: true
  };
  SpeechAPI.speakVerdict(disputeMock, 'ur-IN');
}

// ─── Public API ───────────────────────────────────────────────────────────────

const DisputeEngine = {
  process({ text, fromLocation, toLocation, chargedFare, containerEl }) {
    const isNight = new Date().getHours() >= NIGHT_HOUR_START;

    if (text && (!fromLocation || !chargedFare)) {
      const parsed = parseFareStatement(text);
      fromLocation  = fromLocation  || parsed.from;
      toLocation    = toLocation    || parsed.to;
      chargedFare   = chargedFare   || parsed.chargedFare;
    }

    if (!chargedFare) {
      return { error: 'Could not extract charged fare from input.' };
    }

    let routeData = null;
    let statutoryFare = null;

    if (fromLocation && toLocation) {
      routeData = lookupStatutoryFare(fromLocation, toLocation, isNight);
    }

    if (routeData) {
      statutoryFare = routeData.fare;
    } else {
      return {
        error: 'Route not found in SRO-97 matrix.',
        hint: 'Enter distance in km for per-km calculation.',
        parsed: { fromLocation, toLocation, chargedFare, isNight },
      };
    }

    const dispute = calculateDiscrepancy(chargedFare, statutoryFare, routeData);

    if (containerEl) {
      const existing = containerEl.querySelector('.dispute-card');
      existing?.remove();
      const card = generateDisputeCard(dispute);
      containerEl.prepend(card);
    }

    return { dispute, card: containerEl ? containerEl.querySelector('.dispute-card') : null };
  },

  processWithDistance({ chargedFare, distanceKm, containerEl }) {
    const isNight = new Date().getHours() >= NIGHT_HOUR_START;
    const baseRate = FALLBACK_RATE_PER_KM;
    const baseFare = Math.ceil(distanceKm * baseRate);
    const nightSurcharge = isNight ? Math.ceil(baseFare * 0.20) : 0;
    const statutoryFare = baseFare + nightSurcharge;

    const routeData = {
      fare: statutoryFare,
      baseFare,
      nightSurcharge,
      distanceKm,
      isNight,
      source: `Per-km rate (₹${baseRate}/km)`,
    };

    const dispute = calculateDiscrepancy(chargedFare, statutoryFare, routeData);

    if (containerEl) {
      const existing = containerEl.querySelector('.dispute-card');
      existing?.remove();
      containerEl.prepend(generateDisputeCard(dispute));
    }

    return { dispute };
  },

  speakDispute(dispute, lang = 'ur-IN') {
    SpeechAPI.speakVerdict(dispute, lang);
  },

  toggleDisputeLanguage(cardEl) {
    const urdu = cardEl.querySelector('.dispute-card__urdu');
    if (urdu) urdu.classList.toggle('hidden');
  },

  startVoiceInput({ onResult, onError, onEnd, lang = 'ur-IN' }) {
    SpeechAPI.startListening({ lang, onResult, onError, onEnd });
  },

  stopVoiceInput() {
    SpeechAPI.stopListening();
  },

  classifyIntent,
  lookupStatutoryFare,
  parseFareStatement,
  SpeechAPI,
  SRO97_FARE_MATRIX,

  // Backward-compatibility aliases
  STATUTORY_TARIFFS,
  CORRIDORS,
  calculateLegalFare,
  verifyFare,
  parseDisputeQuery,
  verbalNegotiationTTS,
};

// Attach to global environments
if (typeof window !== "undefined") {
  window.DisputeEngine = DisputeEngine;
  window.SafarDisputeEngine = DisputeEngine;
}
if (typeof globalThis !== "undefined") {
  globalThis.DisputeEngine = DisputeEngine;
  globalThis.SafarDisputeEngine = DisputeEngine;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = DisputeEngine;
}
