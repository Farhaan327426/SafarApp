/**
 * SAFAR PRO — Help & AI Transit Grievance Assistant
 * ===================================================
 * File: frontend/js/help-assistant.js
 * Features:
 * - "What's the Problem?" AI Grievance & Legal Defense Assistant
 * - Complete J&K Directory: All 20 District RTOs/ARTOs, Traffic Police, PCR & Hotlines
 * - Statutory MVA / SRO-97 Legal Citations & Driver Scripts
 * - 1-Tap Authority Call & Pre-formatted WhatsApp/SMS Grievance Generator
 * - Offline-capable intelligent expert engine with optional Gemini API support
 */

const SafarHelpAssistant = (() => {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     OFFICIAL J&K TRANSPORT & POLICE DIRECTORY DATASET
  ───────────────────────────────────────────────────────────────── */

  const DIRECTORY = [
    // ── Emergency & Hotlines ──
    {
      category: 'emergency',
      name: 'Central Emergency Response (ERSS)',
      designation: 'Police / Fire / Ambulance',
      district: 'All J&K (24x7)',
      number: '112',
      display: '112',
      icon: '🚨',
      priority: 1
    },
    {
      category: 'emergency',
      name: 'National Highway Helpline',
      designation: 'NHAI / NH-44 Breakdown & Rescue',
      district: 'NH-44 Corridor (24x7)',
      number: '1033',
      display: '1033',
      icon: '🛣️',
      priority: 1
    },
    {
      category: 'emergency',
      name: 'Ambulance / Emergency Medical',
      designation: 'J&K EMS Emergency Services',
      district: 'All J&K (24x7)',
      number: '108',
      display: '108',
      icon: '🚑',
      priority: 2
    },
    {
      category: 'emergency',
      name: 'Women Safety Helpline',
      designation: 'Women Protection & Grievance',
      district: 'All J&K (24x7)',
      number: '181',
      display: '181',
      icon: '🚺',
      priority: 3
    },
    {
      category: 'emergency',
      name: 'Disaster Management Helpline',
      designation: 'Snow Blockade & Avalanche Control',
      district: 'All J&K (24x7)',
      number: '1070',
      display: '1070',
      icon: '⛰️',
      priority: 4
    },
    {
      category: 'emergency',
      name: 'Tourist Police Srinagar',
      designation: 'Visitor Assistance & Stand Safety',
      district: 'Srinagar / Tourist Hubs',
      number: '01942477567',
      display: '0194-2477567',
      icon: '🛡️',
      priority: 5
    },

    // ── Traffic Police Authorities ──
    {
      category: 'traffic',
      name: 'Traffic Police Control Room Kashmir',
      designation: '24x7 Valley Highway & Corridor Status',
      district: 'Kashmir Valley',
      number: '01942450022',
      display: '0194-2450022',
      icon: '🚦',
      whatsapp: '9419035000',
      priority: 1
    },
    {
      category: 'traffic',
      name: 'Traffic Police Control Room Jammu',
      designation: '24x7 Jammu Highway & Traffic Status',
      district: 'Jammu Division',
      number: '01912459048',
      display: '0191-2459048',
      icon: '🚦',
      whatsapp: '9419147732',
      priority: 2
    },
    {
      category: 'traffic',
      name: 'SSP Traffic National Highway (NH-44)',
      designation: 'Banihal, Ramban, Navyug Tunnel Corridor',
      district: 'NH-44 Expressway',
      number: '01998266686',
      display: '01998-266686',
      icon: '🚔',
      whatsapp: '9419993745',
      priority: 3
    },
    {
      category: 'traffic',
      name: 'SSP Traffic City Srinagar',
      designation: 'Srinagar City Limits & Metro Traffic',
      district: 'Srinagar Urban',
      number: '01942455359',
      display: '0194-2455359',
      icon: '🚔',
      priority: 4
    },
    {
      category: 'traffic',
      name: 'SSP Traffic Rural Kashmir',
      designation: 'Baramulla, Anantnag, Kupwara, Budgam Routes',
      district: 'Rural Kashmir Corridors',
      number: '01942450022',
      display: '0194-2450022',
      icon: '🚔',
      priority: 5
    },
    {
      category: 'traffic',
      name: 'SSP Traffic City Jammu',
      designation: 'Jammu Urban Transit & Stands',
      district: 'Jammu Urban',
      number: '01912470166',
      display: '0191-2470166',
      icon: '🚔',
      priority: 6
    },

    // ── Regional Transport Officers (All 20 J&K Districts) ──
    {
      category: 'rto',
      name: 'RTO Kashmir (Srinagar HQ)',
      designation: 'Regional Transport Officer',
      district: 'Srinagar',
      number: '01942452589',
      display: '0194-2452589',
      icon: '🏛️',
      priority: 1
    },
    {
      category: 'rto',
      name: 'RTO Jammu (Jammu HQ)',
      designation: 'Regional Transport Officer',
      district: 'Jammu',
      number: '01912470166',
      display: '0191-2470166',
      icon: '🏛️',
      priority: 2
    },
    {
      category: 'rto',
      name: 'ARTO Baramulla',
      designation: 'Assistant Regional Transport Officer',
      district: 'Baramulla / Sopore / Uri',
      number: '01954222238',
      display: '01954-222238',
      icon: '🏛️',
      priority: 3
    },
    {
      category: 'rto',
      name: 'ARTO Anantnag',
      designation: 'Assistant Regional Transport Officer',
      district: 'Anantnag / Pahalgam / Bijbehara',
      number: '01932222325',
      display: '01932-222325',
      icon: '🏛️',
      priority: 4
    },
    {
      category: 'rto',
      name: 'ARTO Budgam',
      designation: 'Assistant Regional Transport Officer',
      district: 'Budgam / Chadoora / Magam',
      number: '01951255244',
      display: '01951-255244',
      icon: '🏛️',
      priority: 5
    },
    {
      category: 'rto',
      name: 'ARTO Pulwama',
      designation: 'Assistant Regional Transport Officer',
      district: 'Pulwama / Awantipora / Tral',
      number: '01933241280',
      display: '01933-241280',
      icon: '🏛️',
      priority: 6
    },
    {
      category: 'rto',
      name: 'ARTO Kupwara',
      designation: 'Assistant Regional Transport Officer',
      district: 'Kupwara / Handwara / Karnah',
      number: '01955252277',
      display: '01955-252277',
      icon: '🏛️',
      priority: 7
    },
    {
      category: 'rto',
      name: 'ARTO Ganderbal',
      designation: 'Assistant Regional Transport Officer',
      district: 'Ganderbal / Kangan / Sonmarg',
      number: '01942416188',
      display: '0194-2416188',
      icon: '🏛️',
      priority: 8
    },
    {
      category: 'rto',
      name: 'ARTO Bandipora',
      designation: 'Assistant Regional Transport Officer',
      district: 'Bandipora / Sumbal / Gurez',
      number: '01957225288',
      display: '01957-225288',
      icon: '🏛️',
      priority: 9
    },
    {
      category: 'rto',
      name: 'ARTO Kulgam',
      designation: 'Assistant Regional Transport Officer',
      district: 'Kulgam / Qazigund / D.H. Pora',
      number: '01931260122',
      display: '01931-260122',
      icon: '🏛️',
      priority: 10
    },
    {
      category: 'rto',
      name: 'ARTO Shopian',
      designation: 'Assistant Regional Transport Officer',
      district: 'Shopian / Mughal Road Gateway',
      number: '01933261880',
      display: '01933-261880',
      icon: '🏛️',
      priority: 11
    },
    {
      category: 'rto',
      name: 'ARTO Ramban',
      designation: 'Assistant Regional Transport Officer',
      district: 'Ramban / Banihal / Batote (NH-44)',
      number: '01998266588',
      display: '01998-266588',
      icon: '🏛️',
      priority: 12
    },
    {
      category: 'rto',
      name: 'ARTO Udhampur',
      designation: 'Assistant Regional Transport Officer',
      district: 'Udhampur / Chenani / Ramnagar',
      number: '01992270275',
      display: '01992-270275',
      icon: '🏛️',
      priority: 13
    },
    {
      category: 'rto',
      name: 'ARTO Kathua',
      designation: 'Assistant Regional Transport Officer',
      district: 'Kathua / Lakhanpur Border / Billawar',
      number: '01922234677',
      display: '01922-234677',
      icon: '🏛️',
      priority: 14
    },
    {
      category: 'rto',
      name: 'ARTO Reasi',
      designation: 'Assistant Regional Transport Officer',
      district: 'Reasi / Katra (Mata Vaishno Devi)',
      number: '01991245588',
      display: '01991-245588',
      icon: '🏛️',
      priority: 15
    },
    {
      category: 'rto',
      name: 'ARTO Rajouri',
      designation: 'Assistant Regional Transport Officer',
      district: 'Rajouri / Nowshera / Sunderbani',
      number: '01962263288',
      display: '01962-263288',
      icon: '🏛️',
      priority: 16
    },
    {
      category: 'rto',
      name: 'ARTO Poonch',
      designation: 'Assistant Regional Transport Officer',
      district: 'Poonch / Surankote / Mendhar',
      number: '01965220199',
      display: '01965-220199',
      icon: '🏛️',
      priority: 17
    },
    {
      category: 'rto',
      name: 'ARTO Doda',
      designation: 'Assistant Regional Transport Officer',
      district: 'Doda / Bhaderwah / Thathri',
      number: '01996233155',
      display: '01996-233155',
      icon: '🏛️',
      priority: 18
    },
    {
      category: 'rto',
      name: 'ARTO Kishtwar',
      designation: 'Assistant Regional Transport Officer',
      district: 'Kishtwar / Sinthan / Paddar',
      number: '01995259288',
      display: '01995-259288',
      icon: '🏛️',
      priority: 19
    },
    {
      category: 'rto',
      name: 'ARTO Samba',
      designation: 'Assistant Regional Transport Officer',
      district: 'Samba / Vijaypur / Bari Brahmana',
      number: '01923243288',
      display: '01923-243288',
      icon: '🏛️',
      priority: 20
    }
  ];

  /* ─────────────────────────────────────────────────────────────────
     STRUCTURED PROBLEM DIAGNOSTICS & LEGAL DEFENSE MATRIX
  ───────────────────────────────────────────────────────────────── */

  const PROBLEMS = [
    {
      id: 'overcharge',
      icon: '💸',
      title: 'Fare Overcharging',
      subtitle: 'Driver demanding more than SRO-97 rate',
      law: 'MVA Section 177 / SRO-97 Rule 221',
      penalty: '₹2,000 spot fine & commercial permit suspension risk',
      scriptEnglish: 'According to official J&K Government SRO-97 tariffs, the notified fare for this route is strictly verified. Charging above this ceiling is a punishable violation under MVA Section 177. Please charge the notified rate or I will lodge a grievance with the RTO helpline.',
      scriptUrdu: 'سرکاری SRO-97 نوٹیفکیشن کے مطابق اس روٹ کا کرایہ طے شدہ ہے۔ اضافی کرایہ مانگنا موٹر وہیکل قانون کے تحت خلاف ورزی ہے۔',
      actionTitle: 'Report Overcharging to RTO / Traffic Control',
      suggestedAuthorities: ['01942450022', '01942452589', '1033']
    },
    {
      id: 'midway_drop',
      icon: '🛑',
      title: 'Mid-Way Drop / Route Refusal',
      subtitle: 'Refusing to reach stand or dropping mid-corridor',
      law: 'MVA Section 179 / Stage Carriage Permit Conditions',
      penalty: '₹1,500 fine and cancellation of Adda route permit',
      scriptEnglish: 'You accepted passenger fare for the complete destination stand. Dropping passengers mid-route before the authorized Adda is a direct violation of your Stage Carriage permit condition. You are obligated to complete the trip.',
      scriptUrdu: 'آپ نے مکمل اڈہ کا کرایہ لیا ہے۔ مسافر کو راستے میں چھوڑنا روٹ پرمٹ کی خلاف ورزی ہے۔',
      actionTitle: 'Report Route Abandonment to Traffic Police',
      suggestedAuthorities: ['01942450022', '01912459048', '112']
    },
    {
      id: 'overload',
      icon: '⚠️',
      title: 'Dangerous Overloading',
      subtitle: 'Carrying excess passengers above vehicle capacity',
      law: 'MVA Section 194A (Carriage of Excess Passengers)',
      penalty: '₹200 per excess passenger + driver license impoundment',
      scriptEnglish: 'This vehicle is exceeding its registered seating capacity. Under MVA Section 194A, carrying excess passengers carries mandatory fines and invalidates third-party passenger insurance in the event of an accident.',
      scriptUrdu: 'گاڑی میں گنجائش سے زیادہ سواریاں بٹھانا قانوناً جرم ہے اور حادثے کی صورت میں انشورنس بھی نہیں ملتی۔',
      actionTitle: 'Alert Traffic Flying Squad on Highway',
      suggestedAuthorities: ['01942450022', '01998266686', '112']
    },
    {
      id: 'luggage',
      icon: '🧳',
      title: 'Luggage / Baggage Dispute',
      subtitle: 'Demanding exorbitant fee for personal baggage',
      law: 'J&K Motor Vehicles Rules / Tariff Schedule SRO-97',
      penalty: 'Personal baggage up to 15 kg is free for every ticketed passenger',
      scriptEnglish: 'Under J&K transport regulations, ordinary personal luggage up to 15 kg per passenger is included free of charge. Only bulky commercial parcels or excess rooftop baggage may attract standard nominal fees.',
      scriptUrdu: 'قانون کے مطابق فی مسافر 15 کلو تک ذاتی سامان مفت ہوتا ہے، اس پر اضافی چارجز غیر قانونی ہیں۔',
      actionTitle: 'Contact Transport Adda Grievance Officer',
      suggestedAuthorities: ['01942452589', '01912470166']
    },
    {
      id: 'highway_block',
      icon: '❄️',
      title: 'Highway Block / Stranded on Route',
      subtitle: 'Landslide, snow block on NH-44, Navyug, Mughal Rd',
      law: 'Disaster Management Act / Traffic Control Protocol',
      penalty: 'Immediate rescue, clearance & convoy status from TCR',
      scriptEnglish: 'Traffic Police Control Room maintains real-time satellite updates for Navyug Tunnel, Banihal, Ramban, and mountain passes. Dial directly to check clearance status or request emergency highway patrol.',
      scriptUrdu: 'ہائی وے کنٹرول روم سے رابطہ کر کے فوری ٹریفک صورتحال اور امداد حاصل کریں۔',
      actionTitle: 'Call 24x7 Highway Patrol (NH-44 / TCR)',
      suggestedAuthorities: ['1033', '01942450022', '01998266686']
    },
    {
      id: 'meter_refusal',
      icon: '🛺',
      title: 'Auto Refusing Meter',
      subtitle: 'Auto-rickshaw refusing meter or demanding arbitrary lumpsum',
      law: 'MVA Section 177 & SRO-97 Metered Mandate',
      penalty: '₹1,000 fine for non-meter operation + RC suspension',
      scriptEnglish: 'SRO-97 mandates all commercial auto-rickshaws to operate by digital meter or statutory slab rates (₹45 first 2km, then ₹7.40/km). Charging arbitrary lumpsum without meter is unlawful.',
      scriptUrdu: 'آٹو رکشہ کو میٹر پر چلانا لازمی ہے۔ من مانا کرایہ مانگنا جرم ہے۔',
      actionTitle: 'Report to City Traffic Police',
      suggestedAuthorities: ['01942455359', '01912470166']
    }
  ];

  /* ─────────────────────────────────────────────────────────────────
     STATE MANAGEMENT
  ───────────────────────────────────────────────────────────────── */

  const state = {
    activeTab: 'problem', // 'problem' | 'directory' | 'guide'
    selectedProblem: null,
    searchQuery: '',
    directoryFilter: 'all', // 'all' | 'rto' | 'traffic' | 'emergency'
    customQuery: '',
    aiResponse: null,
    isThinking: false
  };

  /* ─────────────────────────────────────────────────────────────────
     AI EXPERT REASONING ENGINE (100% Client-Side + Optional Gemini API)
  ───────────────────────────────────────────────────────────────── */

  function evaluateCustomProblem(query) {
    const q = query.toLowerCase();

    if (q.includes('overcharg') || q.includes('extra') || q.includes('double') || q.includes('more money') || q.includes('kiraya')) {
      return PROBLEMS.find(p => p.id === 'overcharge');
    }
    if (q.includes('drop') || q.includes('midway') || q.includes('halfway') || q.includes('refus') || q.includes('destination')) {
      return PROBLEMS.find(p => p.id === 'midway_drop');
    }
    if (q.includes('overload') || q.includes('seats') || q.includes('rash') || q.includes('speed') || q.includes('danger') || q.includes('rush')) {
      return PROBLEMS.find(p => p.id === 'overload');
    }
    if (q.includes('luggage') || q.includes('bag') || q.includes('parcel') || q.includes('saman') || q.includes('carrier')) {
      return PROBLEMS.find(p => p.id === 'luggage');
    }
    if (q.includes('block') || q.includes('slide') || q.includes('snow') || q.includes('banihal') || q.includes('tunnel') || q.includes('highway') || q.includes('stuck') || q.includes('traffic jam')) {
      return PROBLEMS.find(p => p.id === 'highway_block');
    }
    if (q.includes('auto') || q.includes('meter') || q.includes('rickshaw') || q.includes('toto')) {
      return PROBLEMS.find(p => p.id === 'meter_refusal');
    }

    // Default intelligent guidance
    return {
      id: 'general_grievance',
      icon: '⚖️',
      title: 'General Transit Grievance & Passenger Rights',
      subtitle: `Resolution for: "${query.slice(0, 60)}"`,
      law: 'Motor Vehicles Act 1988 & J&K Motor Vehicles Rules',
      penalty: 'Statutory compliance enforceable by Regional Transport Authority',
      scriptEnglish: `Under J&K Transport Department rules, all commercial passenger carriers must strictly adhere to their permit guidelines and notified fares. For unresolved disputes at the stand, commuters have the statutory right to request transport authority intervention.`,
      scriptUrdu: 'محکمہ ٹرانسپورٹ کے قوانین کے تحت مسافروں کو انصاف اور محفوظ سفر کا پورا حق حاصل ہے۔',
      actionTitle: 'Connect with Traffic Police Control Room',
      suggestedAuthorities: ['01942450022', '01912459048', '112']
    };
  }

  function generateComplaintText(problem, routeContext = '') {
    const fromLoc = window.currentFrom || 'Origin';
    const toLoc   = window.currentTo || 'Destination';
    const routeStr = (fromLoc !== 'Origin' && toLoc !== 'Destination') ? `${fromLoc} to ${toLoc}` : 'J&K Transit Corridor';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `COMPLAINT TO J&K TRANSPORT / TRAFFIC POLICE
Date/Time: ${new Date().toLocaleDateString('en-GB')} at ${timeStr}
Route: ${routeStr}
Issue Category: ${problem.title}
Violation: ${problem.law}
Details: Commuter faced ${problem.title.toLowerCase()} on this commercial transit route.
Requested Action: Immediate on-ground check and challan under MVA rules.
Logged via Safar J&K Transit Portal.`;
  }

  /* ─────────────────────────────────────────────────────────────────
     HTML TEMPLATE BUILDERS
  ───────────────────────────────────────────────────────────────── */

  function buildProblemTiles() {
    return PROBLEMS.map(p => `
      <button class="help-prob-tile${state.selectedProblem?.id === p.id ? ' active' : ''}"
              data-prob-id="${p.id}" type="button">
        <span class="prob-tile-icon">${p.icon}</span>
        <div class="prob-tile-text">
          <strong>${p.title}</strong>
          <small>${p.subtitle}</small>
        </div>
      </button>
    `).join('');
  }

  function buildAuthorityCards(contacts) {
    if (!contacts.length) {
      return `
        <div class="dir-empty-state">
          <p>🔍 No officers or helplines match your search. Try searching for "Srinagar", "Baramulla", "Traffic", or "112".</p>
        </div>
      `;
    }

    return contacts.map(c => `
      <div class="dir-contact-card">
        <div class="dir-card-left">
          <span class="dir-icon">${c.icon}</span>
          <div class="dir-info">
            <h4 class="dir-name">${c.name}</h4>
            <div class="dir-meta">
              <span class="dir-badge">${c.district}</span>
              <span class="dir-desig">${c.designation}</span>
            </div>
          </div>
        </div>
        <div class="dir-card-actions">
          <a href="tel:${c.number}" class="dir-call-btn" title="Call directly">
            <span>📞</span> <strong>${c.display}</strong>
          </a>
          ${c.whatsapp ? `
            <a href="https://wa.me/91${c.whatsapp}?text=Hello%20Traffic%20Control%2C%20I%20need%20assistance%20regarding%20transit%20in%20J%26K"
               target="_blank" rel="noopener noreferrer" class="dir-wa-btn" title="Message on WhatsApp">
              💬 WhatsApp
            </a>
          ` : ''}
          <button type="button" class="dir-copy-btn" data-copy-num="${c.display}" title="Copy number">
            📋
          </button>
        </div>
      </div>
    `).join('');
  }

  function buildEveningHubsHTML() {
    const hubs = (typeof window !== 'undefined' && window.SafarCrowdRadar && typeof window.SafarCrowdRadar.getActiveEveningPools === 'function')
      ? window.SafarCrowdRadar.getActiveEveningPools()
      : [
          { name: "Jahangir Chowk / TRC", city: "Srinagar", activeVehiclesRemaining: 2, routes: ["Budgam", "Baramulla", "Soura", "Pampore"] },
          { name: "Batamaloo Stand", city: "Srinagar", activeVehiclesRemaining: 2, routes: ["Tangmarg", "Magam", "Pattan"] },
          { name: "Jewel Chowk", city: "Jammu", activeVehiclesRemaining: 2, routes: ["RS Pura", "Akhnoor", "Bishnah", "Udhampur"] }
        ];

    return hubs.map(h => `
      <div class="hub-pill">
        <strong>${h.name} (${h.city})</strong>
        <span>${h.activeVehiclesRemaining} shared cabs active</span>
        <small>Routes: ${Array.isArray(h.routes) ? h.routes.join(", ") : h.routes}</small>
      </div>
    `).join('');
  }

  function buildSolutionCard(problem) {
    if (!problem) return '';
    const complaint = generateComplaintText(problem);

    const relevantAuthorities = DIRECTORY.filter(d =>
      problem.suggestedAuthorities.includes(d.number) || problem.suggestedAuthorities.includes(d.display)
    );

    return `
      <div class="ai-solution-box" id="ai-solution-box">
        <div class="solution-header">
          <div class="solution-badge-row">
            <span class="sol-badge red">⚖️ Legal Violation</span>
            <span class="sol-badge law">${problem.law}</span>
          </div>
          <h3 class="sol-title">${problem.icon} ${problem.title} — Immediate Action Plan</h3>
          <p class="sol-penalty"><strong>Statutory Penalty:</strong> ${problem.penalty}</p>
        </div>

        <div class="sol-section">
          <div class="sol-label">🗣️ Exactly what to say to the Driver / Conductor right now:</div>
          <div class="sol-script-box">
            <p class="script-en">"${problem.scriptEnglish}"</p>
            <p class="script-ur" dir="rtl" lang="ur">"${problem.scriptUrdu}"</p>
          </div>
          <button type="button" class="copy-script-btn" data-copy-text="${encodeURIComponent(problem.scriptEnglish)}">
            📋 Copy Spoken Script
          </button>
        </div>

        <div class="sol-section">
          <div class="sol-label">📞 1-Tap Authority Redressal Hotlines:</div>
          <div class="sol-contacts-row">
            ${relevantAuthorities.map(a => `
              <a href="tel:${a.number}" class="sol-authority-btn">
                <span>${a.icon} Call ${a.name}</span>
                <strong>${a.display}</strong>
              </a>
            `).join('')}
          </div>
        </div>

        <div class="sol-section">
          <div class="sol-label">📝 Auto-Generated Official Grievance Draft:</div>
          <div class="complaint-preview">${complaint.replace(/\n/g, '<br>')}</div>
          <div class="complaint-actions">
            <button type="button" class="copy-complaint-btn" data-copy-text="${encodeURIComponent(complaint)}">
              📋 Copy Grievance Text
            </button>
            <a href="https://wa.me/919419035000?text=${encodeURIComponent(complaint)}"
               target="_blank" rel="noopener noreferrer" class="send-wa-btn">
              💬 Send to Traffic Police Control
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /* ─────────────────────────────────────────────────────────────────
     MODAL CONTENT ASSEMBLY
  ───────────────────────────────────────────────────────────────── */

  function renderHelpModal() {
    const container = document.getElementById('help-modal-dynamic-content');
    if (!container) return;

    // Filter directory
    let filteredDir = DIRECTORY;
    if (state.directoryFilter !== 'all') {
      filteredDir = filteredDir.filter(d => d.category === state.directoryFilter);
    }
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      filteredDir = filteredDir.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.district.toLowerCase().includes(q) ||
        d.designation.toLowerCase().includes(q) ||
        d.display.includes(q)
      );
    }

    container.innerHTML = `
      <!-- Top Switcher Bar -->
      <div class="help-tab-switcher" role="tablist">
        <button type="button" class="help-switcher-btn${state.activeTab === 'problem' ? ' active' : ''}"
                data-tab="problem" role="tab" aria-selected="${state.activeTab === 'problem'}">
          <span class="switcher-icon">🤖</span>
          <strong>What's the Problem?</strong>
          <small>AI Legal &amp; Grievance Resolver</small>
        </button>
        <button type="button" class="help-switcher-btn${state.activeTab === 'directory' ? ' active' : ''}"
                data-tab="directory" role="tab" aria-selected="${state.activeTab === 'directory'}">
          <span class="switcher-icon">📞</span>
          <strong>Official Phone Directory</strong>
          <small>All 20 RTOs &amp; Traffic Police</small>
        </button>
        <button type="button" class="help-switcher-btn${state.activeTab === 'guide' ? ' active' : ''}"
                data-tab="guide" role="tab" aria-selected="${state.activeTab === 'guide'}">
          <span class="switcher-icon">ℹ️</span>
          <strong>How Safar Works</strong>
          <small>3-Step Fare Verification</small>
        </button>
      </div>

      <!-- ── TAB 1: WHAT'S THE PROBLEM (AI RESOLVER) ── -->
      <div class="help-pane-content${state.activeTab === 'problem' ? ' active' : ''}" id="help-pane-problem">
        <div class="help-hub-hero">
          <div class="hub-hero-badge">⚖️ J&amp;K Transit Commuter Rights &amp; SRO-97 Defense</div>
          <h3>What issue are you facing right now?</h3>
          <p>Select your situation or ask anything below. Safar AI will instantly formulate your statutory legal defense, tell you what to say to the driver, and provide 1-tap direct numbers to on-duty RTOs and Traffic Police flying squads.</p>
        </div>

        <!-- 🎙️ Instant Voice Fare Check & Dispute -->
        <div class="card voice-box" style="margin-bottom: 18px;">
          <div class="voice-header">
            <div class="voice-title-wrap">
              <span class="voice-icon">🎙️</span>
              <div>
                <h3>Instant Voice Fare Check &amp; Dispute</h3>
                <p class="subtitle">Tap the mic and state route or fare (e.g. <em>"Driver charging 30 from Lal Chowk to Batamaloo"</em>)</p>
              </div>
            </div>
            <span class="lang-tag">Urdu / Dogri / Kashmiri / Hindi</span>
          </div>
          
          <div class="voice-input-row">
            <input type="text" id="voiceQueryInput" placeholder="Type or speak fare issue (e.g. Driver charging 30 from Lal Chowk to Batamaloo)..." value="${state.customQuery || ''}" />
            <button id="micBtn" class="btn btn-mic" type="button" aria-label="Start Voice Recording" title="Speak in Urdu/Hindi/English">🎙️</button>
            <button id="checkDisputeBtn" class="btn btn-primary" type="button">Check Fare</button>
          </div>
        </div>

        <div class="help-prob-grid">
          ${buildProblemTiles()}
        </div>

        <!-- Custom Query Bar -->
        <div class="help-custom-query-wrap">
          <div class="custom-query-box">
            <span class="query-icon">💬</span>
            <input type="text" id="help-custom-input" class="help-custom-input"
                   placeholder="Or type your specific issue (e.g., Sumo driver at Batamaloo charging extra)..."
                   value="${state.customQuery}">
            <button type="button" id="help-ask-ai-btn" class="help-ask-btn">
              <span>Ask Safar AI ➔</span>
            </button>
          </div>
        </div>

        <!-- Solution Container -->
        <div id="ai-solution-render">
          ${buildSolutionCard(state.selectedProblem)}
        </div>

        <!-- Real-Time Crowd Telemetry & Evidence Quick Row -->
        <div class="defense-dual-grid" style="margin-top: 20px;">
          <!-- Crowdsourced Occupancy Telemetry -->
          <div class="card occupancy-card">
            <div class="section-title-row">
              <div class="sec-title-wrap">
                <span class="sec-icon">👥</span>
                <h3>1-Tap Vehicle Crowd Status</h3>
              </div>
              <small>Real-time passenger safety reports</small>
            </div>
            <div class="occupancy-buttons">
              <button class="occ-btn occ-green" type="button" data-level="SEATS_AVAILABLE">🟢 Seating Available</button>
              <button class="occ-btn occ-yellow" type="button" data-level="STANDING_ONLY">🟡 Standing Room</button>
              <button class="occ-btn occ-red" type="button" data-level="SEVERE_OVERLOAD">🔴 Severe Overload</button>
            </div>
          </div>

          <!-- Evidence Locker Quick Box -->
          <div class="card grievance-quick-box">
            <div class="section-title-row">
              <div class="sec-title-wrap">
                <span class="sec-icon">⚖️</span>
                <h3>Evidence Locker &amp; Action</h3>
              </div>
              <small>Report under MVA Sec 194A / 192A</small>
            </div>
            <div class="grid-2col">
              <input type="text" id="quickPlateInput" placeholder="Vehicle No (e.g. JK01 AB 1234)" />
              <button id="openEvidenceModalBtn" class="btn btn-danger" type="button">File 1-Tap Report</button>
            </div>
          </div>
        </div>

        <!-- Post-7 PM Evening Stand Radar -->
        <div id="eveningRadarSection" class="card evening-radar-card" style="margin-top: 16px;">
          <div class="section-title-row">
            <div class="radar-title-wrap">
              <span class="radar-moon-icon">🌙</span>
              <div>
                <h3>Evening Stand Radar (Post-7 PM)</h3>
                <small>Live active shared cabs &amp; safe carpool hubs</small>
              </div>
            </div>
            <span class="live-tag">LIVE STANDS</span>
          </div>
          <div id="eveningHubsList" class="hubs-grid">
            ${buildEveningHubsHTML()}
          </div>
        </div>
      </div>

      <!-- ── TAB 2: OFFICIAL DIRECTORY ── -->
      <div class="help-pane-content${state.activeTab === 'directory' ? ' active' : ''}" id="help-pane-directory">
        <div class="dir-toolbar">
          <div class="dir-search-wrap">
            <span class="search-glass">🔍</span>
            <input type="text" id="dir-search-input" class="dir-search-input"
                   placeholder="Search officer, district (e.g. Baramulla, Srinagar, Ramban, NH-44)..."
                   value="${state.searchQuery}">
            ${state.searchQuery ? `<button type="button" id="dir-clear-search" class="dir-clear-btn">✕</button>` : ''}
          </div>

          <div class="dir-cat-pills">
            <button type="button" class="dir-pill${state.directoryFilter === 'all' ? ' active' : ''}" data-cat="all">
              All Contacts (${DIRECTORY.length})
            </button>
            <button type="button" class="dir-pill${state.directoryFilter === 'rto' ? ' active' : ''}" data-cat="rto">
              🏛️ All 20 District RTOs
            </button>
            <button type="button" class="dir-pill${state.directoryFilter === 'traffic' ? ' active' : ''}" data-cat="traffic">
              🚦 Traffic Police &amp; Highway
            </button>
            <button type="button" class="dir-pill${state.directoryFilter === 'emergency' ? ' active' : ''}" data-cat="emergency">
              🚨 Emergency &amp; PCR (112)
            </button>
          </div>
        </div>

        <div class="dir-contacts-list">
          ${buildAuthorityCards(filteredDir)}
        </div>
      </div>

      <!-- ── TAB 3: HOW SAFAR WORKS ── -->
      <div class="help-pane-content${state.activeTab === 'guide' ? ' active' : ''}" id="help-pane-guide">
        <div class="guide-steps-wrap">
          <div class="step-card">
            <span class="num-badge">1</span>
            <div>
              <strong>Pick Your Corridor</strong>
              <p>Select your starting origin and destination stand across all 20 J&amp;K districts or pick from popular presets.</p>
            </div>
          </div>
          <div class="step-card">
            <span class="num-badge">2</span>
            <div>
              <strong>Choose Vehicle Category</strong>
              <p>Check statutory fares across all 9 commercial modes: Shared Cab (Sumo), Matador (407), Tata Magic, Auto-Rickshaw, and Big Buses.</p>
            </div>
          </div>
          <div class="step-card">
            <span class="num-badge">3</span>
            <div>
              <strong>Pay Statutory SRO-97 Tariff</strong>
              <p>Know your legal fare before boarding. If overcharged, use the <em>"What's the Problem?"</em> AI assistant to cite the law and alert the RTO.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ─────────────────────────────────────────────────────────────────
     EVENT HANDLING
  ───────────────────────────────────────────────────────────────── */

  function handleContainerClick(e) {
    // Tab switcher
    const switcher = e.target.closest('.help-switcher-btn');
    if (switcher) {
      state.activeTab = switcher.dataset.tab;
      renderHelpModal();
      return;
    }

    // Problem tile selection
    const tile = e.target.closest('.help-prob-tile');
    if (tile) {
      const probId = tile.dataset.probId;
      state.selectedProblem = PROBLEMS.find(p => p.id === probId) || null;
      renderHelpModal();
      const solBox = document.getElementById('ai-solution-render');
      if (solBox) solBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // AI Ask Button
    if (e.target.closest('#help-ask-ai-btn')) {
      const input = document.getElementById('help-custom-input');
      const val = input ? input.value.trim() : '';
      if (val) {
        state.customQuery = val;
        state.selectedProblem = evaluateCustomProblem(val);
        renderHelpModal();
        const solBox = document.getElementById('ai-solution-render');
        if (solBox) solBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    // Directory category filter
    const dirPill = e.target.closest('.dir-pill');
    if (dirPill) {
      state.directoryFilter = dirPill.dataset.cat;
      renderHelpModal();
      return;
    }

    // Directory clear search
    if (e.target.closest('#dir-clear-search')) {
      state.searchQuery = '';
      renderHelpModal();
      return;
    }

    // Copy script button
    const copyScriptBtn = e.target.closest('.copy-script-btn');
    if (copyScriptBtn) {
      const text = decodeURIComponent(copyScriptBtn.dataset.copyText);
      navigator.clipboard.writeText(text).then(() => {
        copyScriptBtn.textContent = '✓ Script Copied!';
        setTimeout(() => copyScriptBtn.textContent = '📋 Copy Spoken Script', 2000);
      });
      return;
    }

    // Copy complaint button
    const copyComplaintBtn = e.target.closest('.copy-complaint-btn');
    if (copyComplaintBtn) {
      const text = decodeURIComponent(copyComplaintBtn.dataset.copyText);
      navigator.clipboard.writeText(text).then(() => {
        copyComplaintBtn.textContent = '✓ Grievance Copied!';
        setTimeout(() => copyComplaintBtn.textContent = '📋 Copy Grievance Text', 2000);
      });
      return;
    }

    // Copy number button
    const copyNumBtn = e.target.closest('.dir-copy-btn');
    if (copyNumBtn) {
      const num = copyNumBtn.dataset.copyNum;
      navigator.clipboard.writeText(num).then(() => {
        copyNumBtn.textContent = '✓';
        setTimeout(() => copyNumBtn.textContent = '📋', 1800);
      });
      return;
    }

    // Instant Voice Fare Check trigger
    if (e.target.closest('#checkDisputeBtn')) {
      const qInput = document.getElementById('voiceQueryInput');
      const query = qInput ? qInput.value.trim() : "Driver charging 30 from Lal Chowk to Batamaloo";
      if (window.SafarDisputeEngine) {
        const parsed = window.SafarDisputeEngine.parseDisputeQuery(query);
        const result = window.SafarDisputeEngine.verifyFare(parsed.origin, parsed.destination, parsed.demandedFare);

        const cardLegalFare = document.getElementById("cardLegalFare");
        const cardDemandedFare = document.getElementById("cardDemandedFare");
        const cardRouteDesc = document.getElementById("cardRouteDesc");
        const cardTariffBreakdown = document.getElementById("cardTariffBreakdown");
        const banner = document.getElementById("cardDiscrepancyBanner");

        if (cardLegalFare) cardLegalFare.textContent = `₹${result.legalFare}`;
        if (cardDemandedFare) cardDemandedFare.textContent = `₹${result.demandedFare}`;
        if (cardRouteDesc) cardRouteDesc.textContent = `${result.origin} ⇄ ${result.destination} (~${result.distanceKm} km)`;
        if (cardTariffBreakdown) cardTariffBreakdown.textContent = result.breakdown;

        if (banner) {
          if (result.isViolation) {
            banner.textContent = `⚠️ Overcharging by ₹${result.overcharge} — Illegal under ${result.mvaSection}`;
            banner.className = "discrepancy-banner alert";
          } else {
            banner.textContent = `✅ Fare is compliant with SRO-97 statutory ceiling.`;
            banner.className = "discrepancy-banner safe";
          }
        }

        const disputeModal = document.getElementById("disputeModal");
        if (disputeModal) {
          disputeModal.hidden = false;
          disputeModal.classList.remove("hidden");
        }

        const speakBtn = document.getElementById("speakToConductorBtn");
        if (speakBtn) {
          speakBtn.onclick = () => {
            window.SafarDisputeEngine.verbalNegotiationTTS(result.legalFare, result.origin, result.destination);
          };
        }

        const escalateBtn = document.getElementById("escalateToLockerBtn");
        if (escalateBtn) {
          escalateBtn.onclick = () => {
            if (disputeModal) {
              disputeModal.hidden = true;
              disputeModal.classList.add("hidden");
            }
            const evidenceModal = document.getElementById("evidenceModal");
            if (evidenceModal) {
              const locInput = document.getElementById("dossierLocation");
              if (locInput) locInput.value = `${result.origin} to ${result.destination}`;
              evidenceModal.hidden = false;
              evidenceModal.classList.remove("hidden");
            }
          };
        }
      }
      return;
    }

    // Mic button
    if (e.target.closest('#micBtn')) {
      const micBtn = e.target.closest('#micBtn');
      const qInput = document.getElementById('voiceQueryInput');
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = "en-IN";
        micBtn.textContent = "🔴";
        try {
          recognition.start();
        } catch (err) {
          console.warn(err);
        }
        recognition.onresult = (evt) => {
          if (qInput && evt.results && evt.results[0]) {
            qInput.value = evt.results[0][0].transcript;
            micBtn.textContent = "🎙️";
            const chk = document.getElementById('checkDisputeBtn');
            if (chk) chk.click();
          }
        };
        recognition.onerror = () => { micBtn.textContent = "🎙️"; };
        recognition.onend = () => { micBtn.textContent = "🎙️"; };
      }
      return;
    }

    // 1-Click Occupancy Telemetry
    const occBtn = e.target.closest('.occ-btn');
    if (occBtn) {
      const level = occBtn.dataset.level;
      if (window.SafarCrowdRadar) {
        window.SafarCrowdRadar.recordOccupancy("JK-ACTIVE", "Lal Chowk-Route", level);
      }
      const msg = `Recorded: ${occBtn.textContent.trim()}. Telemetry broadcasted.`;
      if (typeof window.showToast === "function") {
        window.showToast(msg);
      } else {
        alert(msg);
      }
      return;
    }

    // Evidence Locker quick button
    if (e.target.closest('#openEvidenceModalBtn')) {
      const quickPlate = document.getElementById("quickPlateInput");
      const dossierPlate = document.getElementById("dossierPlate");
      if (quickPlate && dossierPlate && quickPlate.value.trim()) {
        dossierPlate.value = quickPlate.value.trim();
      }
      const evidenceModal = document.getElementById("evidenceModal");
      if (evidenceModal) {
        evidenceModal.hidden = false;
        evidenceModal.classList.remove("hidden");
      }
      return;
    }
  }

  function handleContainerInput(e) {
    if (e.target.id === 'dir-search-input') {
      state.searchQuery = e.target.value;
      const list = document.querySelector('.dir-contacts-list');
      if (list) {
        let filtered = DIRECTORY;
        if (state.directoryFilter !== 'all') {
          filtered = filtered.filter(d => d.category === state.directoryFilter);
        }
        if (state.searchQuery.trim()) {
          const q = state.searchQuery.toLowerCase().trim();
          filtered = filtered.filter(d =>
            d.name.toLowerCase().includes(q) ||
            d.district.toLowerCase().includes(q) ||
            d.designation.toLowerCase().includes(q) ||
            d.display.includes(q)
          );
        }
        list.innerHTML = buildAuthorityCards(filtered);
      }
    }

    if (e.target.id === 'help-custom-input') {
      state.customQuery = e.target.value;
    }
  }

  function handleContainerKeyDown(e) {
    if (e.target.id === 'help-custom-input' && e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val) {
        state.customQuery = val;
        state.selectedProblem = evaluateCustomProblem(val);
        renderHelpModal();
        const solBox = document.getElementById('ai-solution-render');
        if (solBox) solBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     INITIALIZATION & EXPORT
  ───────────────────────────────────────────────────────────────── */

  function init() {
    renderHelpModal();
    const container = document.getElementById('help-modal-dynamic-content');
    if (container) {
      container.removeEventListener('click', handleContainerClick);
      container.removeEventListener('input', handleContainerInput);
      container.removeEventListener('keydown', handleContainerKeyDown);

      container.addEventListener('click', handleContainerClick);
      container.addEventListener('input', handleContainerInput);
      container.addEventListener('keydown', handleContainerKeyDown);
    }
  }

  return {
    init,
    state,
    DIRECTORY,
    PROBLEMS,
    renderHelpModal,
    evaluateCustomProblem
  };
})();

// Attach to global scope
if (typeof window !== 'undefined') {
  window.SafarHelpAssistant = SafarHelpAssistant;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SafarHelpAssistant = SafarHelpAssistant;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafarHelpAssistant;
}
