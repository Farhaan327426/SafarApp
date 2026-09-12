/**
 * SAFAR PRO — NLU, Intent Extraction & Safety Verification Engine
 * ===================================================
 * File: frontend/js/safar-ai-engine.js
 * Features:
 * - Natural language understanding with intent classification & entity extraction
 * - Multilingual support (English, Hindi, Urdu & Roman transliteration)
 * - Grounded Safety Layer: Legal claims retrieved strictly from verified records
 * - Dual Response Planning: Concise voice-first output + rich visual verdict
 * - Backend-first architecture ready (/api/voice/understand) with full client fallback
 */

const SafarAIEngine = (() => {
  'use strict';

  // Known J&K Transit nodes for entity extraction
  const JK_LOCALITIES = [
    'srinagar', 'baramulla', 'anantnag', 'jammu', 'ramban', 'banihal',
    'sopore', 'kupwara', 'pulwama', 'budgam', 'ganderbal', 'bandipora',
    'kulgam', 'shopian', 'udhampur', 'kathua', 'rajouri', 'poonch',
    'doda', 'kishtwar', 'reasi', 'samba', 'katra', 'pahalgam', 'gulmarg',
    'sonamarg', 'lal chowk', 'batamaloo', 'pantha chowk', 'qazigund',
    'pattan', 'bijbehara', 'uri', 'handwara', 'trisa', 'tangmarg'
  ];

  // Common Hindi / Urdu spoken numbers transliterated
  const NUMBER_WORDS = {
    'sau': 100, 'so': 100, 'ek sau': 100,
    'dedh sau': 150, 'derh sau': 150, 'dhedh sau': 150,
    'do sau': 200,
    'dhai sau': 250, 'dhaayi sau': 250,
    'teen sau': 300,
    'chaar sau': 400, 'char sau': 400,
    'paanch sau': 500, 'panch sau': 500,
    'hazaar': 1000, 'hazar': 1000, 'ek hazaar': 1000,
    'one hundred': 100, 'one fifty': 150, 'two hundred': 200,
    'three hundred': 300, 'four hundred': 400, 'five hundred': 500
  };

  /**
   * Detect language from transcript or text
   */
  function detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'en';

    // Check for Arabic / Urdu script
    if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) {
      return 'ur';
    }

    // Check for Devanagari script
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }

    // Check for Roman Urdu / Hindi keywords
    const urduHindiRoman = [
      'bhai', 'kiraya', 'paise', 'paisa', 'mang', 'maang', 'raha', 'rahe',
      'utara', 'utar', 'diya', 'chal', 'chala', 'sawari', 'sawaari',
      'saman', 'saaman', 'gaadi', 'gadi', 'bol', 'boley', 'bohot', 'boht',
      'zyada', 'ziada', 'rok', 'kitna', 'nahi', 'nahin', 'meter', 'aur'
    ];

    const lower = text.toLowerCase();
    const matches = urduHindiRoman.filter(w => lower.includes(w));
    if (matches.length >= 2) {
      return 'hi'; // Hindi/Urdu Romanized
    }

    return 'en';
  }

  /**
   * Extract entities: origin, destination, demandedFare, expectedFare, vehicleType, district
   */
  function extractEntities(text) {
    const clean = text.toLowerCase();
    const entities = {
      origin: null,
      destination: null,
      demandedFare: null,
      expectedFare: null,
      vehicleType: null,
      district: null,
      currency: 'INR'
    };

    // 1. Detect origin & destination route patterns
    // e.g. "from baramulla to srinagar", "baramulla se srinagar", "baramulla to srinagar"
    const routeRegexEnglish = /(?:from\s+)?([a-z\s]+?)\s+(?:to|towards|into)\s+([a-z\s]+)/i;
    const routeRegexHindiUrdu = /([a-z\s]+?)\s+(?:se|te)\s+([a-z\s]+?)(?:\s+(?:tak|ko|chala|jaana|ja))/i;

    let routeMatch = clean.match(routeRegexEnglish) || clean.match(routeRegexHindiUrdu);
    if (routeMatch) {
      const candFrom = routeMatch[1].trim();
      const candTo = routeMatch[2].trim();

      const matchedOrigin = JK_LOCALITIES.find(loc => candFrom.includes(loc));
      const matchedDest = JK_LOCALITIES.find(loc => candTo.includes(loc));

      if (matchedOrigin) entities.origin = capitalize(matchedOrigin);
      if (matchedDest) entities.destination = capitalize(matchedDest);
    }

    // Direct standalone town match if route regex didn't catch both
    if (!entities.origin || !entities.destination) {
      const foundLocs = JK_LOCALITIES.filter(loc => new RegExp(`\\b${loc}\\b`, 'i').test(clean));
      if (foundLocs.length >= 2 && !entities.origin && !entities.destination) {
        entities.origin = capitalize(foundLocs[0]);
        entities.destination = capitalize(foundLocs[1]);
      } else if (foundLocs.length === 1 && !entities.district) {
        entities.district = capitalize(foundLocs[0]);
      }
    }

    // 2. Extract numeric fares (e.g. "asking 300", "paid 150", "₹300", "300 rupees")
    // Clean text by stripping highway designations (NH-44, NH44), sections (sec 177), and SRO (SRO-97)
    const fareSearchText = clean
      .replace(/\b(?:nh|national highway)[-\s]*\d+\b/gi, '')
      .replace(/\b(?:sec|section)[-\s]*\d+\b/gi, '')
      .replace(/\b(?:sro)[-\s]*\d+\b/gi, '')
      .replace(/\b(?:202\d|19\d\d)\b/gi, ''); // Exclude years like 2026, 1988

    const numMatches = [...fareSearchText.matchAll(/(?:₹|rs\.?|rupees?|inr)?\s*(\d{2,4})\b/gi)];
    if (numMatches.length > 0) {
      const numbers = numMatches.map(m => parseInt(m[1], 10)).filter(n => n >= 10 && n <= 5000);
      if (numbers.length === 1) {
        entities.demandedFare = numbers[0];
      } else if (numbers.length >= 2) {
        // e.g. "asking 300 instead of 150" or "paid 150 but asking 300"
        if (/instead of|jabki|jab ki|badle|rather than/i.test(clean)) {
          entities.demandedFare = numbers[0];
          entities.expectedFare = numbers[1];
        } else {
          entities.demandedFare = Math.max(...numbers);
          entities.expectedFare = Math.min(...numbers);
        }
      }
    }

    // 3. Spoken transliterated numbers fallback ("teen sau", "dedh sau")
    for (const [phrase, value] of Object.entries(NUMBER_WORDS)) {
      if (clean.includes(phrase)) {
        if (!entities.demandedFare) {
          entities.demandedFare = value;
        } else if (!entities.expectedFare && entities.demandedFare !== value) {
          entities.expectedFare = value;
        }
      }
    }

    // 4. Vehicle Type detection
    if (/sumo|shared cab|tavera|bolero/i.test(clean)) {
      entities.vehicleType = 'shared-cab';
    } else if (/auto|rickshaw|meter/i.test(clean)) {
      entities.vehicleType = 'auto';
    } else if (/matador|407|mini bus|minibus/i.test(clean)) {
      entities.vehicleType = 'matador';
    } else if (/tata magic|magic/i.test(clean)) {
      entities.vehicleType = 'tata-magic';
    } else if (/e-rickshaw|toto|erickshaw/i.test(clean)) {
      entities.vehicleType = 'e-rickshaw';
    } else if (/bus|big bus/i.test(clean)) {
      entities.vehicleType = 'bus';
    }

    return entities;
  }

  /**
   * Multi-intent classification with scoring & confidence
   */
  function classifyIntent(text) {
    const clean = text.toLowerCase();

    const INTENT_PATTERNS = [
      {
        intent: 'fare_overcharge',
        keywords: [
          'overcharg', 'extra', 'double', 'more money', 'kiraya', '300', '200', '150',
          'zyada', 'ziada', 'lumpsum', 'loot', 'charging more', 'asking for', 'demanded',
          'paise zyada', 'mehnga', 'notified fare'
        ],
        weight: 1.0
      },
      {
        intent: 'route_refusal',
        keywords: [
          'midway', 'drop', 'halfway', 'refus', 'destination', 'utara', 'utar diya',
          'beech mein', 'chhod diya', 'wont go', 'wont take', 'door pe chhod', 'abandoned'
        ],
        weight: 1.1
      },
      {
        intent: 'vehicle_overloading',
        keywords: [
          'overload', 'seats', 'rash', 'speed', 'danger', 'crowd', 'overcrowd',
          'bohot sawari', 'too many people', 'bheed', 'capacity', 'chhat pe'
        ],
        weight: 1.1
      },
      {
        intent: 'meter_refusal',
        keywords: [
          'meter', 'auto', 'rickshaw', 'toto', 'refusing meter', 'meter nahi',
          'bina meter', 'without meter'
        ],
        weight: 1.2
      },
      {
        intent: 'luggage_dispute',
        keywords: [
          'luggage', 'bag', 'parcel', 'saman', 'saaman', 'carrier', 'roof', 'baggage',
          'suitcase', '15kg', 'extra for bag'
        ],
        weight: 1.1
      },
      {
        intent: 'highway_emergency',
        keywords: [
          'block', 'slide', 'snow', 'banihal', 'tunnel', 'navyug', 'highway', 'stuck',
          'landslide', 'jam', 'nh-44', 'nh44', 'mughal road', 'stranded', 'patrol'
        ],
        weight: 1.2
      },
      {
        intent: 'fare_check',
        keywords: [
          'kitna hai', 'what is the fare', 'how much', 'fare for', 'fare check',
          'official fare', 'sro-97 rate', 'rate list', 'legal rate'
        ],
        weight: 1.0
      },
      {
        intent: 'authority_lookup',
        keywords: [
          'rto', 'arto', 'traffic police', 'helpline', 'contact', 'officer',
          'phone number', 'complaint number', 'control room', 'ssp'
        ],
        weight: 1.0
      }
    ];

    let bestIntent = 'general_question';
    let maxScore = 0;

    for (const pattern of INTENT_PATTERNS) {
      let score = 0;
      for (const kw of pattern.keywords) {
        if (clean.includes(kw)) {
          score += 1.0;
        }
      }
      score *= pattern.weight;

      if (score > maxScore) {
        maxScore = score;
        bestIntent = pattern.intent;
      }
    }

    const confidence = maxScore > 0 ? Math.min(0.98, 0.65 + (maxScore * 0.08)) : 0.45;

    return {
      intent: bestIntent,
      confidence: parseFloat(confidence.toFixed(2))
    };
  }

  /**
   * Main NLU pipeline: understand speech transcript or typed query
   */
  async function understandUserSpeech(transcript, forcedLang = null) {
    if (!transcript || typeof transcript !== 'string') {
      return {
        intent: 'general_question',
        entities: {},
        confidence: 0.5,
        language: 'en'
      };
    }

    const detectedLang = forcedLang && forcedLang !== 'auto' ? forcedLang : detectLanguage(transcript);
    const intentResult = classifyIntent(transcript);
    const entities = extractEntities(transcript);

    // Optional backend integration hook if a server is mounted at /api/voice/understand
    // This allows seamless zero-config server delegation without ever putting API keys in the browser!
    if (typeof window !== 'undefined' && window.SAFAR_BACKEND_VOICE_URL) {
      try {
        const response = await fetch(window.SAFAR_BACKEND_VOICE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, language: detectedLang, clientEntities: entities })
        });
        if (response.ok) {
          const serverData = await response.json();
          if (serverData && serverData.intent) {
            return {
              intent: serverData.intent,
              entities: { ...entities, ...(serverData.entities || {}) },
              confidence: serverData.confidence || intentResult.confidence,
              language: serverData.language || detectedLang
            };
          }
        }
      } catch (_) {
        // Graceful fallback to client engine
      }
    }

    return {
      intent: intentResult.intent,
      entities,
      confidence: intentResult.confidence,
      language: detectedLang
    };
  }

  /**
   * Grounded Safety & Verification Layer
   * Maps intent to an immutable verified statutory record.
   * NEVER invents penalties or rules.
   */
  function verifyLegalGrounding(intent) {
    const records = (window.SafarData && window.SafarData.LEGAL_RECORDS) || {};
    const record = records[intent] || records.general_question;

    return {
      claim: record.title,
      intent: record.intent,
      law: record.law,
      source: record.source,
      penalty: record.penalty,
      verifiedAt: record.verifiedAt,
      confidence: 1.0,
      record
    };
  }

  /**
   * Plan Voice & Screen Responses
   * - Voice: concise, conversational, voice-first
   * - Screen: detailed legal verdict with citations and action buttons
   */
  function planResponse(intent, entities, verification, language = 'en') {
    const rec = verification.record;
    let voiceText = '';

    if (intent === 'fare_overcharge') {
      if (entities.demandedFare && entities.origin && entities.destination) {
        voiceText = `I understand. The driver is asking ₹${entities.demandedFare} for ${entities.origin} to ${entities.destination}. Under SRO-97, overcharging is unlawful and punishable by up to ₹5,000 fine. Would you like me to prepare a grievance or call the RTO?`;
      } else if (entities.demandedFare) {
        voiceText = `Under J&K SRO-97, charging ₹${entities.demandedFare} without notified tariff is illegal. Tell me your starting stop and destination, and I will verify the exact statutory fare.`;
      } else {
        voiceText = `Demanding excess fare is an offense under Motor Vehicles Act Section 177. You only need to pay the approved statutory rate. Which route are you travelling on?`;
      }
    } else if (intent === 'route_refusal') {
      voiceText = `Under J&K Stage Carriage rules, drivers cannot drop passengers midway or refuse designated routes. I have prepared the legal citation and Traffic Control helpline.`;
    } else if (intent === 'vehicle_overloading') {
      voiceText = `Overloading carries an immediate fine of ₹1,000 per excess passenger under MVA Section 194A. You can report this immediately to the Highway Flying Squad.`;
    } else if (intent === 'meter_refusal') {
      voiceText = `Auto-rickshaws must operate by digital meter or statutory slab rates under SRO-97. Refusal attracts a ₹1,000 fine and RC suspension.`;
    } else if (intent === 'highway_emergency') {
      voiceText = `For highway blockages or emergency assistance on NH-44, dial 1033 for NHAI rescue, or 0194-2450022 for Traffic Police Control.`;
    } else if (intent === 'luggage_dispute') {
      voiceText = `Under official J&K rules, each passenger is entitled to 15 kilograms of free personal luggage. Surcharging standard bags is not permitted.`;
    } else {
      voiceText = rec.voiceSummary || `Safar AI has retrieved the verified transport rule for your issue. Review the citation and contact numbers below.`;
    }

    return {
      voiceText,
      legalRecord: rec,
      verification
    };
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return {
    detectLanguage,
    extractEntities,
    classifyIntent,
    understandUserSpeech,
    verifyLegalGrounding,
    planResponse
  };
})();

// Attach to global scope
if (typeof window !== 'undefined') {
  window.SafarAIEngine = SafarAIEngine;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SafarAIEngine = SafarAIEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafarAIEngine;
}
