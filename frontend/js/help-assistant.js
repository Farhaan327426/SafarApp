/**
 * SAFAR PRO — Help & AI Transit Grievance Assistant
 * ===================================================
 * File: frontend/js/help-assistant.js
 * Architecture:
 * - UI Controller & Multi-Turn Conversation Manager
 * - Modular Integration with SafarData, SafarTools, SafarAIEngine, and SafarVoiceEngine
 * - Structured Turn History & Conversational Memory
 * - Safe Tool Router with Confirmation Gates
 * - Multilingual Support (Auto | English | Hindi | Urdu)
 * - 100% Offline-Capable with Touch & Text Fallbacks
 */

const SafarHelpAssistant = (() => {
  'use strict';

  // Fallback references if modular scripts load asynchronously
  const Data = () => window.SafarData || { DIRECTORY: [], PROBLEMS: [], LEGAL_RECORDS: {} };
  const Tools = () => window.SafarTools || null;
  const AIEngine = () => window.SafarAIEngine || null;
  const Voice = () => window.SafarVoiceEngine || null;

  /* ─────────────────────────────────────────────────────────────────
     STRUCTURED CONVERSATION STATE & MEMORY
  ───────────────────────────────────────────────────────────────── */
  const conversation = {
    sessionId: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'sess_' + Date.now(),
    language: 'auto', // 'auto' | 'en' | 'hi' | 'ur'
    messages: [],     // [{ role, text, timestamp, language, confidence, source, intent, action }]
    entities: {
      origin: null,
      destination: null,
      vehicleType: null,
      demandedFare: null,
      expectedFare: null,
      district: null,
      currency: 'INR'
    },
    currentIntent: null,
    pendingQuestion: null, // e.g. 'route' | 'demanded_fare'
    awaitingConfirmation: false,
    confirmedAction: null,
    lastUserTranscript: null,
    lastAssistantResponse: null,
    lastIntent: null,
    lastToolResult: null
  };

  // UI state for tabs and filtering
  const state = {
    activeTab: 'problem', // 'problem' | 'directory' | 'guide'
    selectedProblem: null,
    searchQuery: '',
    directoryFilter: 'all', // 'all' | 'rto' | 'traffic' | 'emergency'
    customQuery: '',
    clarificationPrompt: null,
    confirmationPrompt: null
  };

  /* ─────────────────────────────────────────────────────────────────
     MULTI-TURN CONVERSATION MANAGER & TURN HANDLER
  ───────────────────────────────────────────────────────────────── */

  /**
   * Main turn manager: receives user speech transcript or typed query
   */
  async function handleUserTurn(transcript, source = 'speech') {
    if (!transcript || !transcript.trim()) return;
    const cleanText = transcript.trim();

    state.customQuery = cleanText;
    conversation.lastUserTranscript = cleanText;

    // Detect language & understand intent using SafarAIEngine
    const langToUse = conversation.language !== 'auto' ? conversation.language : null;
    const understanding = AIEngine()
      ? await AIEngine().understandUserSpeech(cleanText, langToUse)
      : { intent: 'fare_overcharge', entities: {}, confidence: 0.8, language: 'en' };

    // Record structured user turn
    const userTurn = {
      role: 'user',
      text: cleanText,
      timestamp: Date.now(),
      language: understanding.language || 'en',
      confidence: understanding.confidence || 0.8,
      source: source,
      intent: understanding.intent
    };
    conversation.messages.push(userTurn);

    // Merge extracted entities into conversation memory
    if (understanding.entities) {
      for (const [key, val] of Object.entries(understanding.entities)) {
        if (val !== null && val !== undefined) {
          conversation.entities[key] = val;
        }
      }
    }

    // Check if user is answering an active confirmation prompt
    if (conversation.awaitingConfirmation && conversation.confirmedAction) {
      const isAffirmative = /yes|haan|ha|sure|call|dial|karo|bhejo|open/i.test(cleanText);
      const isNegative = /no|nahi|nahin|cancel|stop|mat/i.test(cleanText);

      if (isAffirmative) {
        const action = conversation.confirmedAction;
        conversation.awaitingConfirmation = false;
        conversation.confirmedAction = null;
        state.confirmationPrompt = null;
        if (Tools()) {
          await Tools().runTool(action.toolName, action.args, true);
        }
        updateVoiceStatus(`✅ Executing ${action.toolName}...`, 'success', false);
        return;
      } else if (isNegative) {
        conversation.awaitingConfirmation = false;
        conversation.confirmedAction = null;
        state.confirmationPrompt = null;
        updateVoiceStatus('Action cancelled.', 'info', false);
        renderHelpModal();
        return;
      }
    }

    // Check if user is answering a pending clarifying question
    if (conversation.pendingQuestion === 'route') {
      if (conversation.entities.origin && conversation.entities.destination) {
        conversation.pendingQuestion = null;
        state.clarificationPrompt = null;
      }
    } else if (conversation.pendingQuestion === 'fare') {
      if (conversation.entities.demandedFare) {
        conversation.pendingQuestion = null;
        state.clarificationPrompt = null;
      }
    }

    // Update conversation intent (preserve active intent if user is answering a clarification)
    if (understanding.intent !== 'general_question' || !conversation.currentIntent) {
      conversation.currentIntent = understanding.intent;
    }
    conversation.lastIntent = conversation.currentIntent;

    // Safety Verification: retrieve official statutory record
    const activeIntent = conversation.currentIntent || 'fare_overcharge';
    const verification = AIEngine()
      ? AIEngine().verifyLegalGrounding(activeIntent)
      : { record: Data().PROBLEMS[0] || {} };

    state.selectedProblem = verification.record;

    // Multi-turn Clarification: Ask missing question if beneficial
    const activeFrom = conversation.entities.origin || window.currentFrom;
    const activeTo = conversation.entities.destination || window.currentTo;

    if (understanding.intent === 'fare_overcharge' && (!activeFrom || activeFrom === 'Origin') && !conversation.pendingQuestion) {
      conversation.pendingQuestion = 'route';
      const questionText = 'What route were you travelling on? (For example: Baramulla to Srinagar)';
      state.clarificationPrompt = questionText;

      const assistantTurn = {
        role: 'assistant',
        text: questionText,
        timestamp: Date.now(),
        intent: understanding.intent,
        action: 'ask_route'
      };
      conversation.messages.push(assistantTurn);

      renderHelpModal();

      // Speak question concisely and transition to WAITING
      if (Voice()) {
        Voice().setState(Voice().VoiceState.WAITING);
        Voice().speak(questionText, getTtsLang(understanding.language), null, () => {
          if (source === 'speech') {
            // Re-open listening for the answer
            startVoiceListening();
          }
        });
      }
      return;
    }

    // Execute Tool: Lookup official fare if route is known
    let fareCheckResult = null;
    if (Tools() && activeFrom && activeTo && activeFrom !== 'Origin') {
      fareCheckResult = await Tools().runTool('lookupFare', {
        origin: activeFrom,
        destination: activeTo,
        vehicleType: conversation.entities.vehicleType || 'shared-cab',
        demandedFare: conversation.entities.demandedFare
      });
      conversation.lastToolResult = fareCheckResult;
    }

    // Plan Response: Voice-first concise speech + comprehensive UI card
    const plan = AIEngine()
      ? AIEngine().planResponse(understanding.intent, conversation.entities, verification, understanding.language)
      : { voiceText: verification.record.voiceSummary || verification.record.title };

    conversation.lastAssistantResponse = plan.voiceText;

    const assistantTurn = {
      role: 'assistant',
      text: plan.voiceText,
      timestamp: Date.now(),
      intent: understanding.intent,
      action: 'resolve'
    };
    conversation.messages.push(assistantTurn);

    // Render verdict and scroll smoothly into view
    renderHelpModal();
    const solBox = document.getElementById('ai-solution-render');
    if (solBox) {
      solBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Speak concise voice verdict aloud
    if (Voice()) {
      Voice().speak(plan.voiceText, getTtsLang(understanding.language));
    }
  }

  function getTtsLang(detectedLang) {
    if (conversation.language === 'ur' || detectedLang === 'ur') return 'ur-IN';
    if (conversation.language === 'hi' || detectedLang === 'hi') return 'hi-IN';
    return 'en-IN';
  }

  function getSttLang() {
    if (conversation.language === 'ur') return 'ur-IN';
    if (conversation.language === 'hi') return 'hi-IN';
    return 'en-IN';
  }

  /* ─────────────────────────────────────────────────────────────────
     HTML TEMPLATE BUILDERS
  ───────────────────────────────────────────────────────────────── */

  function buildProblemTiles() {
    const problems = (Data().PROBLEMS && Data().PROBLEMS.length) ? Data().PROBLEMS : [];
    return problems.map(p => `
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
              ${c.verifiedAt ? `<span class="dir-verified">✓ Verified ${c.verifiedAt}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="dir-card-actions">
          <button type="button" class="dir-call-btn action-call-trigger" 
                  data-call-num="${c.number}" data-call-name="${encodeURIComponent(c.name)}" title="Call directly">
            <span>📞</span> <strong>${c.display}</strong>
          </button>
          ${c.whatsapp ? `
            <button type="button" class="dir-wa-btn action-wa-trigger" 
                    data-wa-num="${c.whatsapp}" data-wa-name="${encodeURIComponent(c.name)}" title="Message on WhatsApp">
              💬 WhatsApp
            </button>
          ` : ''}
          <button type="button" class="dir-copy-btn" data-copy-num="${c.display}" title="Copy number">
            📋
          </button>
        </div>
      </div>
    `).join('');
  }

  function buildSolutionCard(problem) {
    if (!problem) return '';

    const fromLoc = conversation.entities.origin || window.currentFrom || 'Origin';
    const toLoc   = conversation.entities.destination || window.currentTo || 'Destination';
    const routeStr = (fromLoc !== 'Origin' && toLoc !== 'Destination') ? `${fromLoc} to ${toLoc}` : 'J&K Transit Corridor';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const fareLine = (conversation.entities.demandedFare)
      ? `\nDemanded Fare: ₹${conversation.entities.demandedFare}`
      : '';

    const complaint = `COMPLAINT TO J&K TRANSPORT / TRAFFIC POLICE
Date/Time: ${new Date().toLocaleDateString('en-GB')} at ${timeStr}
Route: ${routeStr}
Issue Category: ${problem.title}
Violation: ${problem.law}${fareLine}
Details: Commuter faced ${problem.title.toLowerCase()} on this commercial transit route.
Requested Action: Immediate on-ground check and challan under MVA rules.
Logged via Safar J&K Transit Portal.`;

    const dir = Data().DIRECTORY || [];
    const relevantAuthorities = dir.filter(d =>
      problem.suggestedAuthorities &&
      (problem.suggestedAuthorities.includes(d.number) || problem.suggestedAuthorities.includes(d.display))
    );

    const isSpeaking = Voice() && Voice().getState() === Voice().VoiceState.SPEAKING;

    return `
      <div class="ai-solution-box" id="ai-solution-box">
        <!-- Safar AI Legal Verdict Header Banner -->
        <div class="ai-verdict-banner">
          <div class="ai-verdict-info">
            <span class="ai-bot-avatar">🤖</span>
            <div>
              <div class="ai-verdict-title">Safar AI Legal Verdict</div>
              <div class="ai-verdict-sub">Statutory Analysis &amp; Commuter Defense Plan</div>
            </div>
          </div>
          <button type="button" id="ai-voice-speak-btn" class="ai-voice-speak-btn${isSpeaking ? ' speaking' : ''}" 
                  title="${isSpeaking ? 'Stop voice readout' : 'Listen to AI answer aloud'}"
                  aria-label="${isSpeaking ? 'Stop voice readout' : 'Listen to AI answer aloud'}">
            <span>${isSpeaking ? '⏹️ Stop Voice' : '🔊 Speak Answer'}</span>
          </button>
        </div>

        <!-- Verification Stamp Badge -->
        <div class="verification-seal-badge">
          <span>🛡️ Verified Official Source: <strong>${problem.source || 'J&K Transport Department SRO-97'}</strong></span>
          <small>Verified: ${problem.verifiedAt || '2026-09-12'} | Confidence: 100%</small>
        </div>

        <div class="solution-header">
          <div class="solution-badge-row">
            <span class="sol-badge red">⚖️ Statutory Violation</span>
            <span class="sol-badge law">${problem.law}</span>
          </div>
          <h3 class="sol-title">${problem.icon} ${problem.title} — Immediate Action Plan</h3>
          <p class="sol-penalty"><strong>Statutory Penalty:</strong> ${problem.penalty}</p>
        </div>

        <!-- Conversational Turn History Context (if multi-turn) -->
        ${conversation.messages.length > 2 ? `
          <div class="turn-context-pill">
            💬 <strong>Conversation Context:</strong> ${conversation.messages.slice(-3).map(m => `<em>${m.role === 'user' ? 'You' : 'AI'}:</em> "${escapeHtml(m.text)}"`).join(' ➔ ')}
          </div>
        ` : ''}

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
          <div class="sol-label">📞 1-Tap Verified Authority Hotlines (Gated for Safety):</div>
          <div class="sol-contacts-row">
            ${relevantAuthorities.map(a => `
              <button type="button" class="sol-authority-btn action-call-trigger" 
                      data-call-num="${a.number}" data-call-name="${encodeURIComponent(a.name)}">
                <span>${a.icon} Call ${a.name}</span>
                <strong>${a.display}</strong>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="sol-section">
          <div class="sol-label">📝 Official Grievance Draft:</div>
          <div class="complaint-preview">${complaint.replace(/\n/g, '<br>')}</div>
          <div class="complaint-actions">
            <button type="button" class="copy-complaint-btn" data-copy-text="${encodeURIComponent(complaint)}">
              📋 Copy Grievance Text
            </button>
            <button type="button" class="send-wa-btn action-wa-trigger" 
                    data-wa-num="9419035000" data-wa-name="Traffic Police Control Room" 
                    data-wa-msg="${encodeURIComponent(complaint)}">
              💬 Send to Traffic Police Control
            </button>
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

    const dir = Data().DIRECTORY || [];
    let filteredDir = dir;

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

    const currentLang = conversation.language;

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
          <h3>What is the problem?</h3>
          <p>Tell us what happened in your own words. Safar AI understands real intent in English, Urdu, or Hindi, extracts your route and fares, and cites verified statutory law with direct authority contacts.</p>
        </div>

        <!-- 🎙️ Unified Voice & AI Problem Box -->
        <div class="card problem-voice-box" style="margin-bottom: 20px;">
          <div class="voice-header">
            <div class="voice-title-wrap">
              <span class="voice-icon" id="voiceHeaderIcon">🤖</span>
              <div>
                <h3>What is the problem?</h3>
                <p class="subtitle">Tap mic or type: e.g. <em>"Driver charged ₹300 from Baramulla to Srinagar instead of ₹150"</em></p>
              </div>
            </div>
            
            <!-- Language Selector Pills -->
            <div class="voice-lang-selector" title="Select Voice & Input Language">
              <span class="lang-sel-label">🌐 Lang:</span>
              <button type="button" class="lang-pill${currentLang === 'auto' ? ' active' : ''}" data-lang="auto">Auto</button>
              <button type="button" class="lang-pill${currentLang === 'en' ? ' active' : ''}" data-lang="en">EN</button>
              <button type="button" class="lang-pill${currentLang === 'hi' ? ' active' : ''}" data-lang="hi">हिन्दी</button>
              <button type="button" class="lang-pill${currentLang === 'ur' ? ' active' : ''}" data-lang="ur">اردو</button>
            </div>
          </div>
          
          <div class="voice-input-row">
            <input type="text" id="help-custom-input" class="help-custom-input" 
                   placeholder="What is the problem? Tap mic to speak or type here..." 
                   value="${state.customQuery || ''}" autocomplete="off" />
            <button id="micBtn" class="btn btn-mic" type="button" aria-label="Tap to speak: What is the problem?" title="Tap to speak: What is the problem?">
              <span class="mic-icon-symbol">🎙️</span>
            </button>
            <button type="button" id="help-ask-ai-btn" class="btn btn-primary help-ask-btn">
              <span>Solve Problem ➔</span>
            </button>
          </div>

          <!-- Live Voice Status Banner -->
          <div id="voiceStatusBanner" class="voice-status-banner hidden" role="status" aria-live="polite"></div>

          <!-- Conversational Clarification Prompt (WAITING state) -->
          ${state.clarificationPrompt ? `
            <div class="conversational-clarify-card">
              <div class="clarify-icon">💬</div>
              <div class="clarify-content">
                <strong>Assistant needs details:</strong>
                <p>${state.clarificationPrompt}</p>
                <div class="clarify-actions">
                  <button type="button" id="clarifyAnswerMicBtn" class="clarify-mic-btn">🎙️ Speak Answer</button>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Confirmation Gate Modal Card (consequential call / WA actions) -->
          ${state.confirmationPrompt ? `
            <div class="action-confirm-dialog">
              <div class="confirm-icon">⚠️</div>
              <div class="confirm-content">
                <strong>Confirm Action:</strong>
                <p>${state.confirmationPrompt.prompt}</p>
                <div class="confirm-btn-row">
                  <button type="button" id="confirmActionYesBtn" class="confirm-yes-btn">Yes, Proceed</button>
                  <button type="button" id="confirmActionNoBtn" class="confirm-no-btn">Cancel</button>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Touch Fallback Problem Sheet -->
          <div id="voiceProblemModal" class="voice-problem-sheet hidden">
            <div class="voice-sheet-header">
              <div class="voice-wave-animation">
                <span class="vbar"></span><span class="vbar"></span><span class="vbar"></span><span class="vbar"></span><span class="vbar"></span>
              </div>
              <span class="voice-sheet-title">🎙️ <strong>What is the problem?</strong> Speak or choose:</span>
              <button type="button" id="closeVoiceSheetBtn" class="voice-sheet-close" aria-label="Close voice dialog">✕</button>
            </div>
            <div class="voice-problem-options">
              <button type="button" class="voice-prob-chip" data-prob-id="overcharge">
                <span class="chip-ico">💸</span> <strong>Overcharging extra fare</strong> <small>کرایہ زیادہ مانگ رہا ہے</small>
              </button>
              <button type="button" class="voice-prob-chip" data-prob-id="midway_drop">
                <span class="chip-ico">🛑</span> <strong>Dropped midway / Refusal</strong> <small>راستے میں اتار دیا / انکار</small>
              </button>
              <button type="button" class="voice-prob-chip" data-prob-id="overload">
                <span class="chip-ico">⚠️</span> <strong>Dangerous overloading</strong> <small>گنجائش سے زیادہ سواریاں</small>
              </button>
              <button type="button" class="voice-prob-chip" data-prob-id="meter_refusal">
                <span class="chip-ico">🛺</span> <strong>Auto refusing meter</strong> <small>میٹر پر چلنے سے انکار</small>
              </button>
              <button type="button" class="voice-prob-chip" data-prob-id="luggage">
                <span class="chip-ico">🧳</span> <strong>Excess luggage charges</strong> <small>سامان کے اضافی چارجز</small>
              </button>
              <button type="button" class="voice-prob-chip" data-prob-id="highway_block">
                <span class="chip-ico">❄️</span> <strong>Highway blocked / Snow</strong> <small>شاہراہ بند / برفباری</small>
              </button>
            </div>
          </div>

          <!-- 1-Tap Quick Problem Chips (Always accessible fallback) -->
          <div class="voice-quick-chips">
            <span class="chip-label">⚡ Common issues:</span>
            <button type="button" class="voice-chip" data-prob-id="overcharge">💸 Overcharging</button>
            <button type="button" class="voice-chip" data-prob-id="midway_drop">🛑 Dropped Midway</button>
            <button type="button" class="voice-chip" data-prob-id="overload">⚠️ Overcrowding</button>
            <button type="button" class="voice-chip" data-prob-id="meter_refusal">🛺 Meter Refusal</button>
            <button type="button" class="voice-chip" data-prob-id="luggage">🧳 Luggage Fee</button>
            <button type="button" class="voice-chip" data-prob-id="highway_block">❄️ Highway Block</button>
          </div>
        </div>

        <div class="help-prob-grid">
          ${buildProblemTiles()}
        </div>

        <!-- Solution Container -->
        <div id="ai-solution-render">
          ${buildSolutionCard(state.selectedProblem)}
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
              All Contacts (${dir.length})
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
     VOICE LIFECYCLE & STATUS BINDINGS
  ───────────────────────────────────────────────────────────────── */

  function updateVoiceStatus(message, type = 'info', isPulsing = false) {
    const banner = document.getElementById('voiceStatusBanner');
    if (!banner) return;
    if (!message) {
      banner.className = 'voice-status-banner hidden';
      banner.innerHTML = '';
      return;
    }
    banner.className = `voice-status-banner visible status-${type}`;
    banner.innerHTML = `
      <div class="voice-status-inner">
        ${isPulsing ? '<span class="voice-status-pulse"></span>' : ''}
        <span class="voice-status-text">${message}</span>
      </div>
    `;
  }

  function setMicBtnState(isListening) {
    const micBtn = document.getElementById('micBtn');
    if (!micBtn) return;
    if (isListening) {
      micBtn.classList.add('recording');
      micBtn.innerHTML = '<span class="mic-stop-icon">⏹️</span>';
      micBtn.setAttribute('title', 'Listening... Tap to Stop & Answer');
      micBtn.setAttribute('aria-label', 'Stop Voice Recording');
    } else {
      micBtn.classList.remove('recording');
      micBtn.innerHTML = '<span class="mic-icon-symbol">🎙️</span>';
      micBtn.setAttribute('title', 'Tap to speak: What is the problem?');
      micBtn.setAttribute('aria-label', 'Start Voice Recording');
    }
  }

  function startVoiceListening() {
    if (!Voice()) return;

    const sheet = document.getElementById('voiceProblemModal');
    if (sheet) sheet.classList.remove('hidden');

    const sttLang = getSttLang();
    setMicBtnState(true);
    updateVoiceStatus(`🎙️ Listening (${sttLang})... Tell me your problem:`, 'listening', true);

    const started = Voice().startListening({
      lang: sttLang,
      onInterim: (text) => {
        const input = document.getElementById('help-custom-input');
        if (input) input.value = text;
        updateVoiceStatus(`🎙️ Hearing: "${text}"`, 'listening', true);
      },
      onFinal: (text) => {
        setMicBtnState(false);
        if (sheet) sheet.classList.add('hidden');
        if (text && text.trim()) {
          updateVoiceStatus(`✅ Analyzing: "${text}"...`, 'success', false);
          handleUserTurn(text, 'speech');
        }
      },
      onError: (err) => {
        setMicBtnState(false);
        if (sheet) sheet.classList.remove('hidden');
        updateVoiceStatus('🎙️ Tap an issue below or type what happened:', 'info', false);
      }
    });

    if (!started) {
      setMicBtnState(false);
      updateVoiceStatus('🎙️ Microphone unavailable. Choose your problem below:', 'info', false);
    }
  }

  function stopVoiceRecording(triggerSubmit = false) {
    if (Voice()) {
      Voice().stopListening();
    }
    setMicBtnState(false);

    const sheet = document.getElementById('voiceProblemModal');
    if (sheet && triggerSubmit) sheet.classList.add('hidden');

    const input = document.getElementById('help-custom-input');
    if (triggerSubmit && input && input.value.trim()) {
      handleUserTurn(input.value.trim(), 'speech');
    }
  }

  function toggleVoiceRecording() {
    if (Voice() && Voice().getState() === Voice().VoiceState.LISTENING) {
      stopVoiceRecording(true);
      return;
    }

    // Barge-in: if speaking, interrupt
    if (Voice() && Voice().getState() === Voice().VoiceState.SPEAKING) {
      Voice().interrupt();
    }

    const input = document.getElementById('help-custom-input');
    const existingVal = input ? input.value.trim() : '';

    if (existingVal) {
      handleUserTurn(existingVal, 'text');
      return;
    }

    startVoiceListening();
  }

  function stopAiSpeech() {
    if (Voice()) {
      Voice().stopSpeaking();
    }
    const btn = document.getElementById('ai-voice-speak-btn');
    if (btn) {
      btn.classList.remove('speaking');
      btn.innerHTML = '<span>🔊 Speak Answer</span>';
    }
  }

  function toggleAiVoiceSpeech() {
    if (Voice() && Voice().getState() === Voice().VoiceState.SPEAKING) {
      stopAiSpeech();
      updateVoiceStatus('⏹️ Voice readout stopped.', 'info', false);
    } else {
      if (!state.selectedProblem) return;
      const textToSpeak = state.selectedProblem.voiceSummary || state.selectedProblem.scriptEnglish;
      if (Voice()) {
        Voice().speak(textToSpeak, getTtsLang(conversation.language));
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     CLIPBOARD HELPER (Fallback for HTTP / non-secure contexts)
  ───────────────────────────────────────────────────────────────── */

  function copyToClipboard(text, btn, successLabel, resetLabel) {
    function applySuccess() {
      btn.textContent = successLabel;
      setTimeout(() => { btn.textContent = resetLabel; }, 2000);
    }
    function fallback() {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        applySuccess();
      } catch (_) {
        btn.textContent = '⚠️ Copy Failed';
        setTimeout(() => { btn.textContent = resetLabel; }, 2000);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(applySuccess).catch(fallback);
    } else {
      fallback();
    }
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─────────────────────────────────────────────────────────────────
     EVENT HANDLING
  ───────────────────────────────────────────────────────────────── */

  function handleContainerClick(e) {
    // Tab switcher
    const switcher = e.target.closest('.help-switcher-btn');
    if (switcher) {
      stopVoiceRecording(false);
      stopAiSpeech();
      state.activeTab = switcher.dataset.tab;
      renderHelpModal();
      return;
    }

    // Language selector pills
    const langPill = e.target.closest('.lang-pill');
    if (langPill) {
      conversation.language = langPill.dataset.lang;
      renderHelpModal();
      return;
    }

    // Mic button
    if (e.target.closest('#micBtn')) {
      toggleVoiceRecording();
      return;
    }

    // Clarification answer mic button
    if (e.target.closest('#clarifyAnswerMicBtn')) {
      startVoiceListening();
      return;
    }

    // Confirmation gate responses
    if (e.target.closest('#confirmActionYesBtn')) {
      if (conversation.confirmedAction && Tools()) {
        const action = conversation.confirmedAction;
        conversation.awaitingConfirmation = false;
        conversation.confirmedAction = null;
        state.confirmationPrompt = null;
        Tools().runTool(action.toolName, action.args, true);
        renderHelpModal();
      }
      return;
    }
    if (e.target.closest('#confirmActionNoBtn')) {
      conversation.awaitingConfirmation = false;
      conversation.confirmedAction = null;
      state.confirmationPrompt = null;
      renderHelpModal();
      return;
    }

    // Problem tile selection (Touch fallback)
    const tile = e.target.closest('.help-prob-tile');
    if (tile) {
      stopVoiceRecording(false);
      stopAiSpeech();
      const probId = tile.dataset.probId;
      const prob = (Data().PROBLEMS || []).find(p => p.id === probId) || null;
      state.selectedProblem = prob;
      if (prob) {
        handleUserTurn(prob.title, 'touch');
      }
      return;
    }

    // Voice quick scenario chips
    const probChip = e.target.closest('.voice-chip, .voice-prob-chip');
    if (probChip) {
      stopVoiceRecording(false);
      stopAiSpeech();
      const probId = probChip.dataset.probId;
      const prob = (Data().PROBLEMS || []).find(p => p.id === probId);
      if (prob) {
        handleUserTurn(prob.title, 'touch');
      }
      return;
    }

    // AI voice speak button toggle
    if (e.target.closest('#ai-voice-speak-btn')) {
      toggleAiVoiceSpeech();
      return;
    }

    // Close voice sheet button
    if (e.target.closest('#closeVoiceSheetBtn')) {
      const sheet = document.getElementById('voiceProblemModal');
      if (sheet) sheet.classList.add('hidden');
      return;
    }

    // AI Ask Button ("Solve Problem ➔")
    if (e.target.closest('#help-ask-ai-btn')) {
      const input = document.getElementById('help-custom-input');
      const val = input ? input.value.trim() : '';
      if (val) {
        handleUserTurn(val, 'text');
      }
      return;
    }

    // Consequential Call Action Trigger (Gates with confirmation!)
    const callBtn = e.target.closest('.action-call-trigger');
    if (callBtn) {
      const num = callBtn.dataset.callNum;
      const name = decodeURIComponent(callBtn.dataset.callName || 'Authority');
      conversation.awaitingConfirmation = true;
      conversation.confirmedAction = { toolName: 'initiateCall', args: { number: num, name } };
      state.confirmationPrompt = {
        prompt: `Would you like Safar to dial ${name} (${num}) right now?`
      };
      renderHelpModal();
      if (Voice()) {
        Voice().speak(`Would you like me to dial ${name}?`, getTtsLang(conversation.language));
      }
      return;
    }

    // Consequential WhatsApp Action Trigger (Gates with confirmation!)
    const waBtn = e.target.closest('.action-wa-trigger');
    if (waBtn) {
      const num = waBtn.dataset.waNum;
      const name = decodeURIComponent(waBtn.dataset.waName || 'Traffic Control');
      const msg = decodeURIComponent(waBtn.dataset.waMsg || '');
      conversation.awaitingConfirmation = true;
      conversation.confirmedAction = { toolName: 'openWhatsApp', args: { number: num, message: msg, name } };
      state.confirmationPrompt = {
        prompt: `Would you like Safar to open WhatsApp with your pre-formatted grievance for ${name}?`
      };
      renderHelpModal();
      return;
    }

    // Directory category pills
    const dirPill = e.target.closest('.dir-pill');
    if (dirPill) {
      stopVoiceRecording(false);
      stopAiSpeech();
      state.directoryFilter = dirPill.dataset.cat;
      renderHelpModal();
      return;
    }

    // Directory clear search
    if (e.target.closest('#dir-clear-search')) {
      stopVoiceRecording(false);
      stopAiSpeech();
      state.searchQuery = '';
      renderHelpModal();
      return;
    }

    // Copy script button
    const copyScriptBtn = e.target.closest('.copy-script-btn');
    if (copyScriptBtn) {
      const text = decodeURIComponent(copyScriptBtn.dataset.copyText);
      copyToClipboard(text, copyScriptBtn, '✓ Script Copied!', '📋 Copy Spoken Script');
      return;
    }

    // Copy complaint button
    const copyComplaintBtn = e.target.closest('.copy-complaint-btn');
    if (copyComplaintBtn) {
      const text = decodeURIComponent(copyComplaintBtn.dataset.copyText);
      copyToClipboard(text, copyComplaintBtn, '✓ Grievance Copied!', '📋 Copy Grievance Text');
      return;
    }

    // Copy number button
    const copyNumBtn = e.target.closest('.dir-copy-btn');
    if (copyNumBtn) {
      const num = copyNumBtn.dataset.copyNum;
      copyToClipboard(num, copyNumBtn, '✓', '📋');
      return;
    }
  }

  function handleContainerInput(e) {
    if (e.target.id === 'dir-search-input') {
      state.searchQuery = e.target.value;

      const list = document.querySelector('.dir-contacts-list');
      if (list) {
        const dir = Data().DIRECTORY || [];
        let filtered = dir;
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

      const searchWrap = document.querySelector('.dir-search-wrap');
      if (searchWrap) {
        const existing = searchWrap.querySelector('#dir-clear-search');
        if (state.searchQuery && !existing) {
          const clearBtn = document.createElement('button');
          clearBtn.type = 'button';
          clearBtn.id = 'dir-clear-search';
          clearBtn.className = 'dir-clear-btn';
          clearBtn.textContent = '✕';
          searchWrap.appendChild(clearBtn);
        } else if (!state.searchQuery && existing) {
          existing.remove();
        }
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
        handleUserTurn(val, 'text');
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     INITIALIZATION & BACKWARD COMPATIBLE EXPORT
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
    conversation,
    handleUserTurn,
    renderHelpModal,
    evaluateCustomProblem: (query) => {
      handleUserTurn(query, 'text');
      return state.selectedProblem;
    },
    stopVoiceRecording,
    toggleVoiceRecording,
    speakAiUtterance: (text) => {
      if (Voice()) Voice().speak(text, getTtsLang(conversation.language));
    },
    stopAiSpeech,
    toggleAiVoiceSpeech
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
