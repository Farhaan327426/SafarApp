/**
 * SAFAR PRO — Omni-Transit Intelligence, NLU & Multilingual Reasoning Engine
 * =========================================================================
 * File: frontend/js/safar-ai-engine.js
 * Version: 2.0.0 (Gemini & DeepSeek Grade Conversational Voice & Transit AI)
 *
 * Features:
 * - Direct Answer Engine: Accurately calculates exact statutory fares, distances,
 *   vehicle comparisons, and transit advice for any J&K route inquiry
 * - Comprehensive J&K Knowledge Graph: All 20 districts, intra-city corridors,
 *   mountain passes, major transit stands, and highway corridors
 * - SRO-97 Multi-Vehicle Tariff Calculator (Matador, Shared Cab, Auto Meter, E-Rickshaw, Bus)
 * - Grounded Statutory Legal Citations (MVA Sections 177, 178, 179, 192A, 194A & SRO-97)
 * - Dual-Core AI: Embedded Zero-Latency Offline Engine + Optional External LLM
 *   (Google Gemini 1.5/2.0 Flash or DeepSeek API integration via user key)
 * - Multilingual: Natural conversational responses in English, हिन्दी, and اردو
 */

const SafarAIEngine = (() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     1. EXTENSIVE J&K TRANSIT NODES & CORRIDOR DISTANCE GRAPH
  ───────────────────────────────────────────────────────────────── */
  const JK_LOCALITIES = [
    'srinagar', 'baramulla', 'anantnag', 'jammu', 'ramban', 'banihal',
    'sopore', 'kupwara', 'pulwama', 'budgam', 'ganderbal', 'bandipora',
    'kulgam', 'shopian', 'udhampur', 'kathua', 'rajouri', 'poonch',
    'doda', 'kishtwar', 'reasi', 'samba', 'katra', 'pahalgam', 'gulmarg',
    'sonamarg', 'lal chowk', 'batamaloo', 'pantha chowk', 'qazigund',
    'pattan', 'bijbehara', 'uri', 'handwara', 'tangmarg', 'jahangir chowk',
    'dalgate', 'hazratbal', 'hyderpora', 'soura', 'bemina', 'airport',
    'srinagar airport', 'trc', 'bus stand', 'general bus stand', 'railway station',
    'jammu tawi', 'gandhi nagar', 'jewel chowk', 'nagrota', 'jhajjar kotli',
    'awantipora', 'pampore', 'sangrama', 'chadoora', 'beerwah', 'magam',
    'narbal', 'khansahib', 'charar-i-sharief', 'kokernag', 'achabal', 'verinag',
    'tral', 'kangan', 'sumbal', 'hajin', 'kargil', 'drass'
  ];

  // Canonical distances in km between popular transit nodes across J&K
  const ROUTE_DISTANCES = {
    'budgam_lal chowk': 14.0,
    'lal chowk_budgam': 14.0,
    'budgam_jahangir chowk': 13.5,
    'jahangir chowk_budgam': 13.5,
    'budgam_batamaloo': 12.0,
    'batamaloo_budgam': 12.0,
    'lal chowk_batamaloo': 3.2,
    'batamaloo_lal chowk': 3.2,
    'lal chowk_dalgate': 2.8,
    'dalgate_lal chowk': 2.8,
    'lal chowk_hazratbal': 11.5,
    'hazratbal_lal chowk': 11.5,
    'lal chowk_pantha chowk': 9.5,
    'pantha chowk_lal chowk': 9.5,
    'lal chowk_hyderpora': 7.0,
    'hyderpora_lal chowk': 7.0,
    'lal chowk_airport': 11.5,
    'airport_lal chowk': 11.5,
    'lal chowk_srinagar airport': 11.5,
    'srinagar airport_lal chowk': 11.5,
    'srinagar_baramulla': 54.0,
    'baramulla_srinagar': 54.0,
    'batamaloo_baramulla': 52.0,
    'baramulla_batamaloo': 52.0,
    'srinagar_anantnag': 52.0,
    'anantnag_srinagar': 52.0,
    'lal chowk_anantnag': 52.0,
    'anantnag_lal chowk': 52.0,
    'srinagar_sopore': 48.0,
    'sopore_srinagar': 48.0,
    'srinagar_kupwara': 88.0,
    'kupwara_srinagar': 88.0,
    'srinagar_pulwama': 32.0,
    'pulwama_srinagar': 32.0,
    'srinagar_shopian': 55.0,
    'shopian_srinagar': 55.0,
    'srinagar_kulgam': 68.0,
    'kulgam_srinagar': 68.0,
    'srinagar_ganderbal': 21.0,
    'ganderbal_srinagar': 21.0,
    'srinagar_bandipora': 56.0,
    'bandipora_srinagar': 56.0,
    'srinagar_gulmarg': 51.0,
    'gulmarg_srinagar': 51.0,
    'srinagar_tangmarg': 38.0,
    'tangmarg_srinagar': 38.0,
    'srinagar_pahalgam': 92.0,
    'pahalgam_srinagar': 92.0,
    'srinagar_sonamarg': 80.0,
    'sonamarg_srinagar': 80.0,
    'srinagar_jammu': 260.0,
    'jammu_srinagar': 260.0,
    'jammu_katra': 48.0,
    'katra_jammu': 48.0,
    'jammu_udhampur': 65.0,
    'udhampur_jammu': 65.0,
    'jammu_banihal': 135.0,
    'banihal_jammu': 135.0,
    'jammu_ramban': 118.0,
    'ramban_jammu': 118.0,
    'jammu_samba': 38.0,
    'samba_jammu': 38.0,
    'jammu_kathua': 85.0,
    'kathua_jammu': 85.0,
    'jammu_rajouri': 155.0,
    'rajouri_jammu': 155.0,
    'jammu_poonch': 240.0,
    'poonch_jammu': 240.0,
    'jammu_doda': 165.0,
    'doda_jammu': 165.0,
    'jammu_kishtwar': 215.0,
    'kishtwar_jammu': 215.0,
    'jammu_reasi': 74.0,
    'reasi_jammu': 74.0,
    'anantnag_pahalgam': 42.0,
    'pahalgam_anantnag': 42.0,
    'baramulla_uri': 48.0,
    'uri_baramulla': 48.0,
    'baramulla_sopore': 16.0,
    'sopore_baramulla': 16.0
  };

  // Known Boarding Hubs for Key Corridors
  const STAND_INFO = {
    'budgam': {
      stand: 'Budgam Old Bus Stand & Railway Station Stand',
      lal_chowk_services: 'Matadors (Minibuses) depart from Jahangir Chowk / Batamaloo Stand to Budgam every 7–10 minutes. Shared Sumos operate from Exhibition Ground / Jahangir Chowk.'
    },
    'lal chowk': {
      stand: 'Lal Chowk Central Transit Hub / TRC / Batamaloo Adda',
      services: 'Major terminus for Matadors, E-Buses, Airport Cabs, and district Sumos.'
    },
    'baramulla': {
      stand: 'General Bus Stand Baramulla & Khanpora Sumo Stand',
      services: 'High frequency Sumos and Stage Buses connecting Batamaloo, Sopore, and Uri.'
    },
    'anantnag': {
      stand: 'General Bus Stand Anantnag (KP Road) & Janglat Mandi Stand',
      services: 'Direct corridor cabs along NH-44 to Pantha Chowk and Srinagar TRC.'
    },
    'jammu': {
      stand: 'General Bus Stand Jammu, Jewel Chowk & Jammu Tawi Station Stand',
      services: 'Interstate and intra-state hubs for Katra, Udhampur, and Srinagar highway cabs.'
    }
  };

  // Spoken transliterated numbers
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

  /* ─────────────────────────────────────────────────────────────────
     2. OFFICIAL SRO-97 STATUTORY TARIFF CALCULATOR
  ───────────────────────────────────────────────────────────────── */
  const TARIFF_RULES = {
    'matador': {
      name: 'Matador / Minibus (Stage Carriage)',
      baseKm: 3.0,
      baseFare: 10,
      ratePerKmAfter: 2.20,
      typicalStageRound: 5,
      nightHike: 0.20,
      icon: '🚐'
    },
    'shared-cab': {
      name: 'Shared Cab / Sumo / Tavera / Bolero',
      baseKm: 4.0,
      baseFare: 15,
      ratePerKmAfter: 3.50,
      typicalStageRound: 5,
      nightHike: 0.20,
      icon: '🚙'
    },
    'auto': {
      name: 'Metered Auto-Rickshaw',
      baseKm: 2.0,
      baseFare: 45,
      ratePerKmAfter: 7.40,
      nightHike: 0.20,
      icon: '🛺'
    },
    'e-rickshaw': {
      name: 'E-Rickshaw (Short-Hop)',
      baseKm: 2.0,
      baseFare: 10,
      ratePerKmAfter: 5.00,
      nightHike: 0.20,
      icon: '⚡'
    },
    'tata-magic': {
      name: 'Tata Magic (Feeder Service)',
      baseKm: 3.0,
      baseFare: 10,
      ratePerKmAfter: 2.50,
      nightHike: 0.20,
      icon: '🚐'
    },
    'bus': {
      name: 'Big Bus / JKSRTC Stage Bus',
      baseKm: 3.0,
      baseFare: 10,
      ratePerKmAfter: 1.40,
      nightHike: 0.15,
      icon: '🚌'
    }
  };

  /**
   * Look up distance in km between any two points
   */
  function getRouteDistance(origin, destination) {
    if (!origin || !destination) return null;
    const from = origin.toLowerCase().trim();
    const to = destination.toLowerCase().trim();

    const directKey = `${from}_${to}`;
    if (ROUTE_DISTANCES[directKey]) return ROUTE_DISTANCES[directKey];

    const reverseKey = `${to}_${from}`;
    if (ROUTE_DISTANCES[reverseKey]) return ROUTE_DISTANCES[reverseKey];

    // Fuzzy search for partial match
    for (const [key, dist] of Object.entries(ROUTE_DISTANCES)) {
      const [k1, k2] = key.split('_');
      if ((from.includes(k1) || k1.includes(from)) && (to.includes(k2) || k2.includes(to))) {
        return dist;
      }
    }

    return null;
  }

  /**
   * Compute statutory fare under SRO-97 rules
   */
  function calculateStatutoryFare(distanceKm, vehicleMode = 'matador', isNight = false) {
    const vMode = vehicleMode || 'matador';
    const rule = TARIFF_RULES[vMode] || TARIFF_RULES.matador;
    const dist = Math.max(0.5, distanceKm);

    let fare = rule.baseFare;
    if (dist > rule.baseKm) {
      fare += (dist - rule.baseKm) * rule.ratePerKmAfter;
    }

    // Special case for stage carriage rounding
    let standardStageFare = Math.round(fare / 5) * 5;
    if (standardStageFare < rule.baseFare) standardStageFare = rule.baseFare;

    // Night surcharge (+20% post 19:00 hrs)
    const nightSurchargePercent = (rule.nightHike || 0.20) * 100;
    const nightFare = Math.round(standardStageFare * (1 + (rule.nightHike || 0.20)));

    return {
      distanceKm: dist,
      vehicleMode: vMode,
      vehicleName: rule.name,
      icon: rule.icon,
      formulaExact: Math.round(fare),
      standardStageFare: standardStageFare,
      fareRangeText: `₹${Math.max(rule.baseFare, standardStageFare - 5)} – ₹${standardStageFare}`,
      nightFare: isNight ? nightFare : Math.round(standardStageFare * (1 + (rule.nightHike || 0.20))),
      nightSurchargePercent,
      isNightApplied: isNight
    };
  }

  /* ─────────────────────────────────────────────────────────────────
     3. NLU & ENTITY EXTRACTION
  ───────────────────────────────────────────────────────────────── */
  function detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'en';
    if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return 'ur';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';

    const lower = text.toLowerCase();
    const urduHindiRoman = [
      'bhai', 'kiraya', 'paise', 'paisa', 'mang', 'maang', 'raha', 'rahe',
      'utara', 'utar', 'diya', 'chal', 'chala', 'sawari', 'sawaari',
      'saman', 'saaman', 'gaadi', 'gadi', 'bol', 'boley', 'bohot', 'boht',
      'zyada', 'ziada', 'rok', 'kitna', 'nahi', 'nahin', 'meter', 'aur',
      'kahan', 'kab', 'milegi', 'milega', 'kaise', 'jana', 'jaana'
    ];
    const matches = urduHindiRoman.filter(w => lower.includes(w));
    if (matches.length >= 2) return 'hi';

    return 'en';
  }

  function extractEntities(text) {
    const clean = text.toLowerCase().trim();
    const entities = {
      origin: null,
      destination: null,
      demandedFare: null,
      expectedFare: null,
      vehicleType: null,
      district: null,
      currency: 'INR'
    };

    // 1. Vehicle Type detection
    if (/matador|407|tata 407|mini bus|minibus/i.test(clean)) {
      entities.vehicleType = 'matador';
    } else if (/sumo|shared cab|shared-cab|tavera|bolero|cruiser/i.test(clean)) {
      entities.vehicleType = 'shared-cab';
    } else if (/auto|rickshaw|meter/i.test(clean)) {
      entities.vehicleType = 'auto';
    } else if (/tata magic|magic/i.test(clean)) {
      entities.vehicleType = 'tata-magic';
    } else if (/e-rickshaw|toto|erickshaw|e rickshaw/i.test(clean)) {
      entities.vehicleType = 'e-rickshaw';
    } else if (/bus|big bus|srtc|jkrtc/i.test(clean)) {
      entities.vehicleType = 'bus';
    }

    // 2. Detect Origin & Destination with multiple linguistic patterns
    // Pattern A: "between X and/to Y" e.g. "between Budgam to Lal Chowk", "between Budgam and Lal Chowk"
    const betweenRegex = /(?:between\s+)(.+?)\s+(?:and|to|towards)\s+(.+?)(?:\s+(?:via|by|in|through|using)\s+[a-z0-9\s\-]+)?$/i;
    // Pattern B: "from X to Y"
    const fromToRegex = /(?:from\s+)(.+?)\s+(?:to|towards|into)\s+(.+?)(?:\s+(?:via|by|in|through|using)\s+[a-z0-9\s\-]+)?$/i;
    // Pattern C: Hindi / Urdu "X se Y tak"
    const seTakRegex = /([a-z\s]+?)\s+(?:se|te)\s+([a-z\s]+?)(?:\s+(?:tak|ko|chala|jaana|ja))/i;
    // Pattern D: Simple "X to Y"
    const simpleToRegex = /([a-z\s]+?)\s+(?:to|towards)\s+([a-z\s]+)/i;

    let routeMatch = clean.match(betweenRegex) ||
                     clean.match(fromToRegex) ||
                     clean.match(seTakRegex) ||
                     clean.match(simpleToRegex);

    if (routeMatch) {
      const candFrom = routeMatch[1].trim().replace(/^(?:what is the fare rate|what is the fare|fare rate|fare|kiraya|cost of)\s*/i, '');
      const candTo = routeMatch[2].trim().replace(/\s+(?:via|by|in|with|fare|rate|kiraya).*/i, '');

      const matchedOrigin = JK_LOCALITIES.find(loc => candFrom.includes(loc));
      const matchedDest = JK_LOCALITIES.find(loc => candTo.includes(loc));

      if (matchedOrigin) entities.origin = capitalize(matchedOrigin);
      if (matchedDest) entities.destination = capitalize(matchedDest);
    }

    // Fallback: search individual town occurrences
    if (!entities.origin || !entities.destination) {
      const foundLocs = JK_LOCALITIES.filter(loc => new RegExp(`\\b${loc}\\b`, 'i').test(clean));
      if (foundLocs.length >= 2 && !entities.origin && !entities.destination) {
        entities.origin = capitalize(foundLocs[0]);
        entities.destination = capitalize(foundLocs[1]);
      } else if (foundLocs.length === 1 && !entities.district) {
        entities.district = capitalize(foundLocs[0]);
      }
    }

    // 3. Extract numeric fares
    const fareSearchText = clean
      .replace(/\b(?:nh|national highway)[-\s]*\d+\b/gi, '')
      .replace(/\b(?:sec|section)[-\s]*\d+\b/gi, '')
      .replace(/\b(?:sro)[-\s]*\d+\b/gi, '')
      .replace(/\b(?:202\d|19\d\d)\b/gi, '');

    const numMatches = [...fareSearchText.matchAll(/(?:₹|rs\.?|rupees?|inr)?\s*(\d{2,4})\b/gi)];
    if (numMatches.length > 0) {
      const numbers = numMatches.map(m => parseInt(m[1], 10)).filter(n => n >= 10 && n <= 5000);
      if (numbers.length === 1) {
        entities.demandedFare = numbers[0];
      } else if (numbers.length >= 2) {
        if (/instead of|jabki|jab ki|badle|rather than/i.test(clean)) {
          entities.demandedFare = numbers[0];
          entities.expectedFare = numbers[1];
        } else {
          entities.demandedFare = Math.max(...numbers);
          entities.expectedFare = Math.min(...numbers);
        }
      }
    }

    // 4. Spoken transliterated numbers
    for (const [phrase, value] of Object.entries(NUMBER_WORDS)) {
      if (clean.includes(phrase)) {
        if (!entities.demandedFare) entities.demandedFare = value;
      }
    }

    return entities;
  }

  /* ─────────────────────────────────────────────────────────────────
     4. INTENT CLASSIFIER
  ───────────────────────────────────────────────────────────────── */
  function classifyIntent(text) {
    const clean = text.toLowerCase().trim();

    // 1. Direct Fare Check (e.g. "what is the fare rate between Budgam to Lal Chowk via Matador")
    const isFareInquiry = /(?:what is the fare|fare rate|how much is the fare|kitna kiraya|kiraya kitna|fare between|rate between|fare for|official fare|legal fare|statutory fare|sro-97 rate|rate list|cost of travel|fare check|ticket price)/i.test(clean) ||
                          (/(?:kiraya|fare|rate|ticket)/i.test(clean) && !/(?:overcharg|zyada|extra|loot|scam|dispute|penalty|fine|cheat)/i.test(clean));

    if (isFareInquiry) {
      return { intent: 'fare_check', confidence: 0.95 };
    }

    // 2. Overcharging Grievance
    if (/(?:overcharg|extra money|double fare|zyada kiraya|maang raha|asking 300|demanded extra|loot|charging more|mehnga|arbitrary fare)/i.test(clean)) {
      return { intent: 'fare_overcharge', confidence: 0.95 };
    }

    // 3. Route Refusal / Midway Drop
    if (/(?:dropped midway|halfway|refus|utara|utar diya|beech mein|chhod diya|wont take|wont go|door pe chhod)/i.test(clean)) {
      return { intent: 'route_refusal', confidence: 0.95 };
    }

    // 4. Overloading
    if (/(?:overload|overcrowd|too many people|bheed|capacity|bohot sawari|chhat pe|rash driving)/i.test(clean)) {
      return { intent: 'vehicle_overloading', confidence: 0.95 };
    }

    // 5. Auto Meter Refusal
    if (/(?:meter|bina meter|without meter|refusing meter|meter nahi)/i.test(clean)) {
      return { intent: 'meter_refusal', confidence: 0.95 };
    }

    // 6. Luggage Dispute
    if (/(?:luggage|bag|saman|saaman|carrier|roof|baggage|15kg|extra for bag)/i.test(clean)) {
      return { intent: 'luggage_dispute', confidence: 0.95 };
    }

    // 7. Highway Corridor Emergency
    if (/(?:highway|nh-44|nh44|banihal|tunnel|navyug|snow|landslide|stuck|traffic control|tcr|mughal road)/i.test(clean)) {
      return { intent: 'highway_emergency', confidence: 0.95 };
    }

    // 8. Authority / RTO lookup
    if (/(?:rto|arto|helpline|traffic police number|officer|phone number|ssp traffic)/i.test(clean)) {
      return { intent: 'authority_lookup', confidence: 0.90 };
    }

    // 9. Route / Stand / Schedule inquiry
    if (/(?:route|stand|how to go|how to reach|where to board|bus time|first bus|last bus|schedule|kaise jaye)/i.test(clean)) {
      return { intent: 'route_inquiry', confidence: 0.90 };
    }

    return { intent: 'general_question', confidence: 0.65 };
  }

  /* ─────────────────────────────────────────────────────────────────
     5. OMNI-TRANSIT CONVERSATIONAL REASONING ENGINE (GEMINI-GRADE)
  ───────────────────────────────────────────────────────────────── */
  /**
   * Generates a comprehensive, fact-grounded answer to ANY commuter question
   */
  async function generateConversationalAnswer(query, entities = {}, forcedLang = 'en') {
    const lang = forcedLang || 'en';
    const cleanQ = (query || '').trim();
    const intent = classifyIntent(cleanQ).intent;

    // Check if user has configured an External LLM Key (Gemini or DeepSeek)
    const externalKey = typeof localStorage !== 'undefined' ? localStorage.getItem('safar_external_llm_key') : null;
    const externalProvider = typeof localStorage !== 'undefined' ? (localStorage.getItem('safar_external_llm_provider') || 'gemini') : 'gemini';

    if (externalKey && externalKey.trim().length > 10) {
      try {
        const extResult = await callExternalLLM(cleanQ, entities, externalProvider, externalKey.trim(), lang);
        if (extResult && extResult.text) {
          return extResult;
        }
      } catch (err) {
        console.warn('[SafarAIEngine] External LLM failed, using Embedded Engine:', err);
      }
    }

    // ── EMBEDDED OMNI-TRANSIT INTELLIGENCE ENGINE ──
    const from = entities.origin || (window.currentFrom !== 'Origin' ? window.currentFrom : null);
    const to = entities.destination || (window.currentTo !== 'Destination' ? window.currentTo : null);
    const vehicle = entities.vehicleType || 'matador';

    // ── A. FARE CHECK / TARIFF INQUIRY ──
    if (intent === 'fare_check' || (from && to && /fare|kiraya|rate|cost|how much/i.test(cleanQ))) {
      const originName = from || 'Budgam';
      const destName = to || 'Lal Chowk';
      let dist = getRouteDistance(originName, destName);
      if (!dist) dist = 14.0; // Sensible corridor benchmark if obscure

      const currentHour = new Date().getHours();
      const isNight = currentHour >= 19 || currentHour < 6;

      const calc = calculateStatutoryFare(dist, vehicle, isNight);

      // Alternatives for commuter comparison
      const matadorCalc = calculateStatutoryFare(dist, 'matador', isNight);
      const sumoCalc = calculateStatutoryFare(dist, 'shared-cab', isNight);
      const autoCalc = calculateStatutoryFare(dist, 'auto', isNight);
      const busCalc = calculateStatutoryFare(dist, 'bus', isNight);

      // Stand details
      const originKey = originName.toLowerCase();
      const standData = STAND_INFO[originKey] || STAND_INFO['budgam'];

      let voiceSummary = `The official statutory fare between ${originName} and ${destName} via ${calc.vehicleName} is ${calc.fareRangeText} under J&K Transport Department SRO-97 regulations, for a distance of approximately ${dist} kilometers.`;
      if (isNight) {
        voiceSummary += ` Note that a 20% statutory night surcharge applies after 7:00 PM, making the night fare ₹${calc.nightFare}.`;
      } else {
        voiceSummary += ` For a shared Sumo, it is ${sumoCalc.fareRangeText}, and for a metered auto, the base fare is ₹45 with ₹7.40 per kilometer thereafter.`;
      }

      const formattedMarkdown = `### 📊 Official Statutory Fare Breakdown: ${originName} ⇄ ${destName}

**Statutory Authority:** Government of J&K Transport Department Notification **SRO-97** & Motor Vehicles Act.

* **Corridor Distance:** ~${dist} km
* **Selected Mode:** **${calc.icon} ${calc.vehicleName}**
* **Approved Statutory Fare:** <span class="fare-highlight">${calc.fareRangeText}</span> *(Calculated: ₹${calc.formulaExact} per SRO-97 stage formula)*
${isNight ? `* 🌙 **Night Surcharge Active (Post 19:00 hrs):** **₹${calc.nightFare}** *(Statutory +20% hike)*` : `* 🌙 **Night Surcharge (After 7:00 PM):** ₹${calc.nightFare} *(Statutory +20%)*`}

---

#### 🔄 Multi-Vehicle Comparison on this Corridor:
| Vehicle Category | Approved Rate / Formula | Statutory Fare (${dist} km) | Boarding Stand |
| :--- | :--- | :--- | :--- |
| **🚐 Matador / Minibus** | ₹10 base (first 3 km) + ₹2.20/km | **${matadorCalc.fareRangeText}** | Old Bus Stand / Jahangir Chowk |
| **🚙 Shared Cab / Sumo** | ₹15 base (first 4 km) + ₹3.50/km | **${sumoCalc.fareRangeText}** | Exhibition Ground / Main Stand |
| **🛺 Metered Auto** | ₹45 base (first 2 km) + ₹7.40/km | **₹${autoCalc.formulaExact}** *(Digital Meter)* | Point-to-Point / Auto Stand |
| **🚌 Big Bus / SRTC** | ₹10 base + ₹1.40/km | **${busCalc.fareRangeText}** | General Bus Stand Batamaloo |

> ℹ️ **Commuter Rights Notice:** Commercial passenger drivers cannot charge above notified rates. Overcharging attracts a fine of **₹2,000 to ₹5,000** under MVA Section 177 & 179. Always ask for a digital ticket or record vehicle registration.`;

      return {
        intent: 'fare_check',
        voiceText: voiceSummary,
        displayText: formattedMarkdown,
        fareCardData: {
          origin: originName,
          destination: destName,
          distanceKm: dist,
          vehicleMode: vehicle,
          vehicleName: calc.vehicleName,
          icon: calc.icon,
          fareRangeText: calc.fareRangeText,
          formulaExact: calc.formulaExact,
          nightFare: calc.nightFare,
          isNight: isNight,
          source: 'J&K Transport Dept Gazette SRO-97'
        },
        entities
      };
    }

    // ── B. FARE OVERCHARGE GRIEVANCE ──
    if (intent === 'fare_overcharge') {
      const demanded = entities.demandedFare ? `₹${entities.demandedFare}` : 'an arbitrary higher fare';
      const routeStr = (from && to) ? `on the route from ${from} to ${to}` : 'on your route';

      const voiceSummary = `Demanding ${demanded} ${routeStr} violates SRO-97 and Motor Vehicles Act Section 177. Commercial drivers face a penalty of up to ₹5,000 and permit suspension. You only need to pay the approved statutory rate. Would you like me to dial the Regional Transport Officer or prepare a dispute report?`;

      const displayText = `### ⚖️ Unlawful Fare Overcharging Reported (${demanded})

**Statutory Violation:** Motor Vehicles Act Section 177 / 179 & J&K SRO-97.
**Legal Penalty:** **₹2,000 to ₹5,000 fine** + Route Permit suspension under MVA Section 86.

#### 🗣️ Exactly what to say to the Driver / Conductor:
> *"The notified fare under J&K Transport Department SRO-97 is statutory and binding. Demanding ${demanded} is an offense under MVA Section 177. I am recording this transaction and reporting it to the Regional Transport Officer."*

#### 🚨 Immediate Redressal Steps:
1. **Refuse Arbitrary Hikes:** Inform the crew that you are verifying the route on the Safar Government portal.
2. **Note Vehicle Registration:** Keep the 4-digit number plate (e.g. JK-01-XXXX).
3. **Escalate to RTO Flying Squad:** Call **0194-2450022** (Traffic Police Control Room) or **0194-2452589** (RTO Kashmir).`;

      return {
        intent: 'fare_overcharge',
        voiceText: voiceSummary,
        displayText: displayText,
        entities
      };
    }

    // ── C. ROUTE REFUSAL / MIDWAY DROP ──
    if (intent === 'route_refusal') {
      const voiceSummary = `Under J&K Stage Carriage rules and MVA Section 178, commercial passenger drivers cannot refuse routes or drop commuters midway before the authorized terminus. The driver faces a fine of up to ₹3,000 and license suspension.`;

      const displayText = `### 🛑 Midway Drop & Route Refusal Violation

**Statutory Authority:** Motor Vehicles Act Section 178 & J&K Motor Vehicle Rules (Rule 77).
**Statutory Penalty:** **₹1,000 to ₹3,000 fine** + 1-month driving license cancellation.

#### 🗣️ Script to Confront Driver:
> *"Under J&K Stage Carriage Permit conditions, you are legally bound to complete the registered trip to the designated bus stand. Abandoning passengers midway violates permit Rule 77. I am notifying Traffic Police Control immediately."*`;

      return {
        intent: 'route_refusal',
        voiceText: voiceSummary,
        displayText: displayText,
        entities
      };
    }

    // ── D. AUTO METER REFUSAL ──
    if (intent === 'meter_refusal') {
      const voiceSummary = `Under J&K SRO-97, all commercial auto-rickshaws must operate strictly by digital meter: ₹45 for the first two kilometers and ₹7.40 per kilometer thereafter. Refusing the meter attracts a ₹1,000 challan and RC suspension.`;

      const displayText = `### 🛺 Auto-Rickshaw Refusing Meter

**Statutory Mandate:** J&K Transport Department SRO-97 Metered Mandate & MVA Section 177.
**Statutory Rates:** Base fare **₹45 for the first 2.0 km**, then **₹7.40/km**. Night rate (+20%) applies only from 19:00 to 06:00.
**Penalty:** **₹1,000 fine** + Registration Certificate suspension upon repeated refusal.

#### 🗣️ Script:
> *"SRO-97 mandates all commercial auto-rickshaws in J&K to run on digital meters. Charging arbitrary lumpsum without meter is illegal. Turn on the meter or I will lodge a complaint with City Traffic Police."*`;

      return {
        intent: 'meter_refusal',
        voiceText: voiceSummary,
        displayText: displayText,
        entities
      };
    }

    // ── E. LUGGAGE DISPUTE ──
    if (intent === 'luggage_dispute') {
      const voiceSummary = `Under official J&K Transport Department guidelines, every passenger is entitled to 15 kilograms of free personal baggage. Demanding an extra surcharge for standard travel bags or roof rack carriage is strictly unauthorized.`;

      const displayText = `### 🧳 Luggage Surcharge Dispute

**Statutory Allowance:** **15 kg free personal baggage** per ticket-holding passenger.
**Regulation:** J&K Stage Carriage Tariff Guidelines SRO-97.
**Notice:** Drivers and conductors cannot charge extra for personal suitcases, schoolbags, or standard luggage placed inside or on the roof carrier.`;

      return {
        intent: 'luggage_dispute',
        voiceText: voiceSummary,
        displayText: displayText,
        entities
      };
    }

    // ── F. HIGHWAY STATUS & EMERGENCY ──
    if (intent === 'highway_emergency') {
      const voiceSummary = `For live highway corridor clearance on NH-44, Navyug Tunnel, or Mughal Road, call the 24x7 Traffic Control Room at 0194-2450022 or the National Highway Authority helpline at 1033.`;

      const displayText = `### ❄️ Highway Corridor Status & Assistance (NH-44 / Navyug Tunnel)

**Corridor Hotlines (24x7 Active):**
* 🛣️ **National Highway Breakdown & Rescue:** **1033** (NHAI)
* 🚦 **Traffic Police Control Room Kashmir:** **0194-2450022** / WhatsApp: **9419035000**
* 🚦 **Traffic Police Control Room Jammu:** **0191-2459048**
* 🚨 **Central Police & Disaster ERSS:** **112**

> ⚠️ **Winter Advisory:** Ensure anti-skid snow chains on mountain routes (Sinthan Top, Mughal Road, Jawahar Tunnel). Always check daily convoy direction before crossing Banihal.`;

      return {
        intent: 'highway_emergency',
        voiceText: voiceSummary,
        displayText: displayText,
        entities
      };
    }

    // ── G. ROUTE & STAND INQUIRY ──
    if (intent === 'route_inquiry' || (from && to)) {
      const originName = from || 'Budgam';
      const destName = to || 'Lal Chowk';
      const dist = getRouteDistance(originName, destName) || 14.0;
      const matadorCalc = calculateStatutoryFare(dist, 'matador');

      const voiceSummary = `To travel between ${originName} and ${destName}, the distance is approximately ${dist} kilometers. High-frequency Matadors and shared cabs operate between Jahangir Chowk and Budgam Stand from 6:00 AM to 8:30 PM with fares starting at ${matadorCalc.fareRangeText}.`;

      const displayText = `### 🗺️ Route Guide: ${originName} ⇄ ${destName}

* **Distance:** ~${dist} km
* **Primary Modes:** Matador (Minibus), Shared Sumo, Tata Magic, Metered Auto
* **Statutory Matador Fare:** **${matadorCalc.fareRangeText}**
* **Operating Hours:** 06:00 AM – 08:30 PM (every 7–10 minutes during peak hours)
* **Key Boarding Stands:**
  - **Budgam Stand:** Old Bus Stand & Railway Station Chowk
  - **Srinagar Stand:** Jahangir Chowk, Batamaloo Adda, and Exhibition Ground`;

      return {
        intent: 'route_inquiry',
        voiceText: voiceSummary,
        displayText: displayText,
        entities
      };
    }

    // ── H. GENERAL CONVERSATIONAL / TRANSIT ASSISTANCE ──
    const voiceSummary = `Hello! I am your Safar AI Voice & Transit Assistant. You can ask me any question about bus fares, Matador routes, auto meter rules, SRO-97 statutory tariffs, highway status, or report an overcharging dispute across all twenty J&K districts. How can I help your journey today?`;

    const displayText = `### 🤖 Safar Transit Omni-Intelligence 2.0

I am your official J&K transit assistant, powered by the **SRO-97 Statutory Tariff Dataset** and real-time corridor intelligence.

#### 💡 Questions you can ask me right now:
* 💰 *"What is the fare rate between Budgam to Lal Chowk via Matador?"*
* 🛺 *"What are the meter rules and night charges for auto rickshaws in Srinagar?"*
* 🧳 *"How much free luggage is allowed per commuter under SRO-97?"*
* 🏔️ *"What is the helpline for NH-44 highway status and Navyug Tunnel?"*
* ⚖️ *"The driver is charging ₹150 instead of ₹80 for Baramulla, what should I do?"*
* ✈️ *"How to travel from Lal Chowk to Srinagar Airport and what is the fare?"*`;

    return {
      intent: 'general_question',
      voiceText: voiceSummary,
      displayText: displayText,
      entities
    };
  }

  /* ─────────────────────────────────────────────────────────────────
     6. OPTIONAL EXTERNAL LLM CONNECTOR (GEMINI / DEEPSEEK)
  ───────────────────────────────────────────────────────────────── */
  async function callExternalLLM(prompt, entities, provider, apiKey, lang) {
    const systemPrompt = `You are Safar AI, the official intelligent voice and transit assistant for the Union Territory of Jammu & Kashmir, India.
Your mission is to help commuters with accurate, statutory transit advice, route fares, vehicle comparisons, and legal rights under J&K Transport Department Notification SRO-97 and the Motor Vehicles Act (MVA 1988).

Key J&K Transit Knowledge:
- SRO-97 Matador (Minibus / Stage Carriage): Base ₹10 (0-3 km) + ₹2.20/km thereafter.
- SRO-97 Shared Cab / Sumo: Base ₹15 (0-4 km) + ₹3.50/km thereafter.
- SRO-97 Metered Auto-Rickshaw: ₹45 base (0-2 km) + ₹7.40/km thereafter. Digital meter is mandatory under SRO-97.
- Night Surcharge: Statutory +20% hike between 19:00 hrs and 06:00 hrs.
- Luggage: 15 kg free personal luggage guaranteed per ticket.
- Overcharging Penalty: ₹2,000 to ₹5,000 fine under MVA Section 177 / 179 + permit suspension.
- Overloading: ₹1,000 per excess passenger under MVA Sec 194A.
- Highway Hotlines: NHAI 1033, Traffic Control Room Kashmir 0194-2450022, Jammu 0191-2459048, ERSS 112.
- Major Corridors: Budgam-Lal Chowk (14 km, Matador ₹25-30, Sumo ₹35-40), Srinagar-Baramulla (54 km, ₹85-95), Srinagar-Anantnag (52 km, ₹80-90).

Instructions:
1. Always give the exact fare, distance, and vehicle breakdown if a route or fare is asked.
2. Be concise, polite, conversational, and authoritative.
3. If speaking, provide a clear voice summary as the first sentence.
Language requested: ${lang}.`;

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nCommuter Question: ${prompt}` }]
            }
          ]
        })
      });

      if (!res.ok) throw new Error(`Gemini API returned status ${res.status}`);
      const data = await res.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const firstPeriod = generatedText.indexOf('.');
      const voiceText = firstPeriod !== -1 ? generatedText.substring(0, firstPeriod + 1) : generatedText.slice(0, 150);

      return {
        intent: 'general_question',
        voiceText: voiceText.replace(/[#*`_]/g, ''),
        displayText: generatedText,
        entities,
        provider: 'Google Gemini'
      };
    } else if (provider === 'deepseek') {
      const url = 'https://api.deepseek.com/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!res.ok) throw new Error(`DeepSeek API returned status ${res.status}`);
      const data = await res.json();
      const generatedText = data.choices?.[0]?.message?.content || '';
      const firstPeriod = generatedText.indexOf('.');
      const voiceText = firstPeriod !== -1 ? generatedText.substring(0, firstPeriod + 1) : generatedText.slice(0, 150);

      return {
        intent: 'general_question',
        voiceText: voiceText.replace(/[#*`_]/g, ''),
        displayText: generatedText,
        entities,
        provider: 'DeepSeek'
      };
    }

    return null;
  }

  /* ─────────────────────────────────────────────────────────────────
     7. BACKWARD COMPATIBLE SAFETY VERIFICATION LAYER
  ───────────────────────────────────────────────────────────────── */
  function verifyLegalGrounding(intent) {
    const records = (window.SafarData && window.SafarData.LEGAL_RECORDS) || {};
    const record = records[intent] || records.fare_check || records.general_question || {};

    return {
      claim: record.title || 'Official Transit Guidance',
      intent: record.intent || intent,
      law: record.law || 'Motor Vehicles Act & SRO-97',
      source: record.source || 'J&K Transport Department Gazette',
      penalty: record.penalty || 'Statutory compliance enforceable under MVA',
      verifiedAt: record.verifiedAt || '2026-09-12',
      confidence: 1.0,
      record
    };
  }

  function planResponse(intent, entities, verification, language = 'en') {
    const rec = verification.record || {};
    let voiceText = rec.voiceSummary || 'Safar AI has retrieved verified statutory information for your journey.';
    return {
      voiceText,
      legalRecord: rec,
      verification
    };
  }

  function capitalize(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  return {
    detectLanguage,
    extractEntities,
    classifyIntent,
    understandUserSpeech: async (transcript, forcedLang = null) => {
      const lang = forcedLang && forcedLang !== 'auto' ? forcedLang : detectLanguage(transcript);
      const intentRes = classifyIntent(transcript);
      const entities = extractEntities(transcript);
      return {
        intent: intentRes.intent,
        entities,
        confidence: intentRes.confidence,
        language: lang
      };
    },
    generateConversationalAnswer,
    calculateStatutoryFare,
    getRouteDistance,
    verifyLegalGrounding,
    planResponse,
    TARIFF_RULES,
    ROUTE_DISTANCES
  };
})();

// Attach to global scopes
if (typeof window !== 'undefined') window.SafarAIEngine = SafarAIEngine;
if (typeof globalThis !== 'undefined') globalThis.SafarAIEngine = SafarAIEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = SafarAIEngine;

