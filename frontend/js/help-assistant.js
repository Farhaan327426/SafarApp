/**
 * SAFAR PRO — Gemini & DeepSeek Grade Conversational Voice & Transit AI
 * ====================================================================
 * File: frontend/js/help-assistant.js
 * Version: 2.0.0
 *
 * Architecture:
 * - Real-Time Multi-Turn Conversational Chat Stream (User & Assistant Bubbles)
 * - Gemini Live / DeepSeek Interactive Voice Orb & Dynamic Sound Wave Visualizer
 * - Direct Answer Engine: Instant calculation of statutory fares (e.g. Budgam to Lal Chowk via Matador)
 * - Interactive Fare Breakdown Cards with live distance, mode badges, and night surcharge
 * - Grounded Statutory Citations (MVA Sections 177, 178, 179, 194A & SRO-97)
 * - Instant Barge-In: Commuter can tap or speak anytime to interrupt AI speech
 * - Dual AI Engine: 100% Offline Embedded Intelligence + Optional Google Gemini / DeepSeek API
 * - Multilingual (English, हिन्दी, اردو, and Roman transliteration)
 * - Official 20-District J&K Transport & Police Directory with 1-tap call & WhatsApp
 */

const SafarHelpAssistant = (() => {
  'use strict';

  // Fallback references
  const Data = () => window.SafarData || { DIRECTORY: [], PROBLEMS: [], LEGAL_RECORDS: {} };
  const Tools = () => window.SafarTools || null;
  const AIEngine = () => window.SafarAIEngine || null;
  const Voice = () => window.SafarVoiceEngine || null;

  /* ─────────────────────────────────────────────────────────────────
     1. STRUCTURED CONVERSATION STATE & MEMORY
  ───────────────────────────────────────────────────────────────── */
  const conversation = {
    sessionId: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'sess_' + Date.now(),
    language: 'auto', // 'auto' | 'en' | 'hi' | 'ur'
    messages: [
      {
        id: 'msg_welcome',
        role: 'assistant',
        text: 'Hello! I am your Safar AI Voice & Transit Assistant. You can ask me any question: route fares, Matador & Sumo charges under SRO-97, auto meter rules, highway status, or report an overcharging issue. How can I help your journey today?',
        displayText: `### 👋 Welcome to Safar Transit Omni-Assistant 2.0

I am your official J&K transit intelligence assistant, equipped to answer **any commuter inquiry** with statutory accuracy.

* 🚐 **Route & Fare Lookups:** Ask any route (e.g. *"What is the fare rate between Budgam to Lal Chowk via Matador?"*)
* 🛺 **Auto Meter Mandate:** Approved day and night tariffs under SRO-97
* ❄️ **Highway & Tunnel Status:** Real-time updates for NH-44, Navyug Tunnel & Mughal Road
* ⚖️ **Commuter Defense:** Instant legal citations and scripts for overcharging or midway refusal`,
        timestamp: Date.now(),
        intent: 'general_question'
      }
    ],
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
    pendingQuestion: null,
    awaitingConfirmation: false,
    confirmedAction: null,
    lastUserTranscript: null,
    lastAssistantResponse: null,
    lastIntent: null,
    lastToolResult: null
  };

  // UI state
  const state = {
    activeTab: 'problem', // 'problem' (AI Chat & Voice) | 'directory' | 'guide'
    selectedProblem: null,
    searchQuery: '',
    directoryFilter: 'all',
    customQuery: '',
    clarificationPrompt: null,
    confirmationPrompt: null,
    showModelSettings: false,
    activeSpeakingMsgId: null
  };

  /* ─────────────────────────────────────────────────────────────────
     2. MULTI-TURN CONVERSATION MANAGER & TURN HANDLER
  ───────────────────────────────────────────────────────────────── */
  async function handleUserTurn(transcript, source = 'speech') {
    if (!transcript || !transcript.trim()) return;
    const cleanText = transcript.trim();

    state.customQuery = cleanText;
    conversation.lastUserTranscript = cleanText;

    // Detect language & extract entities using SafarAIEngine
    const langToUse = conversation.language !== 'auto' ? conversation.language : null;
    const understanding = AIEngine()
      ? await AIEngine().understandUserSpeech(cleanText, langToUse)
      : { intent: 'fare_check', entities: {}, confidence: 0.8, language: 'en' };

    // Record user message
    const userTurn = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: cleanText,
      timestamp: Date.now(),
      language: understanding.language || 'en',
      confidence: understanding.confidence || 0.8,
      source: source,
      intent: understanding.intent
    };
    conversation.messages.push(userTurn);

    // Merge entities into memory
    if (understanding.entities) {
      for (const [key, val] of Object.entries(understanding.entities)) {
        if (val !== null && val !== undefined) {
          conversation.entities[key] = val;
        }
      }
    }

    // Check confirmation gates
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
        updateVoiceStatus(`✅ Executed ${action.toolName}.`, 'success', false);
        renderHelpModal();
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

    conversation.currentIntent = understanding.intent;
    conversation.lastIntent = conversation.currentIntent;

    // Show visual thinking indicator
    updateVoiceStatus('✨ Safar AI is thinking...', 'info', true);
    if (Voice()) {
      Voice().setState(Voice().VoiceState.THINKING);
    }
    renderHelpModal();
    scrollToChatBottom();

    // Call Omni-Transit Reasoning Engine
    let aiResponse = null;
    if (AIEngine() && typeof AIEngine().generateConversationalAnswer === 'function') {
      aiResponse = await AIEngine().generateConversationalAnswer(
        cleanText,
        conversation.entities,
        understanding.language
      );
    }

    // Fallback if engine unavailable
    if (!aiResponse) {
      const verification = AIEngine()
        ? AIEngine().verifyLegalGrounding(understanding.intent)
        : { record: Data().PROBLEMS[0] || {} };
      aiResponse = {
        intent: understanding.intent,
        voiceText: verification.record.voiceSummary || 'Safar AI has retrieved verified statutory information for your journey.',
        displayText: `### ⚖️ ${verification.record.title}\n\n${verification.record.scriptEnglish || ''}`,
        entities: conversation.entities
      };
    }

    state.selectedProblem = (Data().PROBLEMS || []).find(p => p.intent === aiResponse.intent) || Data().PROBLEMS[0];
    conversation.lastAssistantResponse = aiResponse.voiceText;

    const msgId = 'ast_' + Date.now();
    const assistantTurn = {
      id: msgId,
      role: 'assistant',
      text: aiResponse.voiceText,
      displayText: aiResponse.displayText,
      fareCardData: aiResponse.fareCardData || null,
      timestamp: Date.now(),
      intent: aiResponse.intent,
      provider: aiResponse.provider || 'Safar Omni-Engine'
    };
    conversation.messages.push(assistantTurn);

    // Reset input field & update UI
    state.customQuery = '';
    renderHelpModal();
    scrollToChatBottom();

    // Speak natural concise voice verdict aloud
    if (Voice() && aiResponse.voiceText) {
      state.activeSpeakingMsgId = msgId;
      updateVoiceStatus('🔊 Safar AI is speaking... (Tap mic or orb to interrupt)', 'listening', true);
      Voice().speak(aiResponse.voiceText, getTtsLang(understanding.language), () => {
        updateVoiceVisualizer(Voice().VoiceState.SPEAKING);
      }, () => {
        state.activeSpeakingMsgId = null;
        updateVoiceStatus('🎙️ Tap mic or orb to ask another question...', 'info', false);
        updateVoiceVisualizer(Voice().VoiceState.IDLE);
        renderHelpModal();
      });
    } else {
      updateVoiceStatus('🎙️ Tap mic to ask another question, or type below...', 'info', false);
      if (Voice()) Voice().setState(Voice().VoiceState.IDLE);
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
     3. MARKDOWN & FORMATTING UTILITIES
  ───────────────────────────────────────────────────────────────── */
  function formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Tables parsing
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const processed = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHtml = '<div class="chat-table-wrap"><table class="chat-table">';
        }
        if (/^\|[\s\-:|]+\|$/.test(line)) continue;
        const cells = line.split('|').slice(1, -1);
        const isHeader = tableHtml.indexOf('<tbody>') === -1 && tableHtml.indexOf('<thead>') === -1;
        if (isHeader) {
          tableHtml += '<thead><tr>' + cells.map(c => `<th>${formatInline(c.trim())}</th>`).join('') + '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>' + cells.map(c => `<td>${formatInline(c.trim())}</td>`).join('') + '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table></div>';
          processed.push(tableHtml);
        }
        processed.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table></div>';
      processed.push(tableHtml);
    }

    html = processed.join('\n');

    // Headers
    html = html.replace(/^#### (.*$)/gim, '<h5 class="chat-msg-h5">$1</h5>');
    html = html.replace(/^### (.*$)/gim, '<h4 class="chat-msg-h4">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="chat-msg-h3">$1</h3>');

    // Blockquotes
    html = html.replace(/^&gt;\s?(.*$)/gim, '<blockquote class="chat-quote">$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="chat-hr" />');

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li class="chat-bullet">$1</li>');
    html = html.replace(/((?:<li class="chat-bullet">.*<\/li>\s*)+)/g, '<ul class="chat-list">$1</ul>');

    // Inline
    html = formatInline(html);

    // Paragraph breaks
    html = html.replace(/\n\n/g, '<div class="chat-p-spacer"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  function formatInline(str) {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function scrollToChatBottom() {
    setTimeout(() => {
      const feed = document.getElementById('aiChatTimeline');
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
    }, 60);
  }

  /* ─────────────────────────────────────────────────────────────────
     4. HTML TEMPLATE BUILDERS
  ───────────────────────────────────────────────────────────────── */
  function buildChatMessages() {
    const isSpeaking = Voice() && Voice().getState() === Voice().VoiceState.SPEAKING;

    return conversation.messages.map(msg => {
      const isUser = msg.role === 'user';
      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isThisSpeaking = isSpeaking && state.activeSpeakingMsgId === msg.id;

      if (isUser) {
        return `
          <div class="chat-message-row user-row">
            <div class="chat-bubble user-bubble">
              <div class="bubble-header">
                <span class="bubble-sender">You</span>
                <span class="bubble-time">${timeStr}</span>
              </div>
              <div class="bubble-text">${escapeHtml(msg.text)}</div>
            </div>
            <div class="chat-avatar user-avatar">👤</div>
          </div>
        `;
      }

      // Assistant message
      const formattedHtml = formatMarkdown(msg.displayText || msg.text);
      const fareCardHtml = msg.fareCardData ? buildInteractiveFareCard(msg.fareCardData) : '';

      return `
        <div class="chat-message-row assistant-row">
          <div class="chat-avatar assistant-avatar">
            <span class="bot-icon">✨</span>
          </div>
          <div class="chat-bubble assistant-bubble">
            <div class="bubble-header">
              <div class="bubble-sender-wrap">
                <span class="bubble-sender">Safar AI</span>
                <span class="engine-badge">${msg.provider || 'Omni-Engine'}</span>
              </div>
              <div class="bubble-actions">
                <span class="bubble-time">${timeStr}</span>
                <button type="button" class="btn-msg-audio" data-msg-id="${msg.id}" data-voice-text="${encodeURIComponent(msg.text)}"
                        title="${isThisSpeaking ? 'Stop voice' : 'Listen aloud'}" aria-label="Listen aloud">
                  <span>${isThisSpeaking ? '⏹️' : '🔊'}</span>
                </button>
              </div>
            </div>

            <!-- Markdown Output -->
            <div class="bubble-text markdown-body">
              ${formattedHtml}
            </div>

            <!-- Rich Fare Breakdown Card (if applicable) -->
            ${fareCardHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  function buildInteractiveFareCard(card) {
    return `
      <div class="interactive-fare-widget">
        <div class="fare-widget-header">
          <div class="fare-widget-route">
            <span class="widget-pin">📍</span>
            <strong>${escapeHtml(card.origin)}</strong>
            <span class="route-arrow">➔</span>
            <strong>${escapeHtml(card.destination)}</strong>
          </div>
          <span class="fare-dist-badge">${card.distanceKm} km</span>
        </div>

        <div class="fare-widget-body">
          <div class="fare-metric-primary">
            <span class="metric-label">${card.icon || '🚐'} Approved Statutory Fare (${card.vehicleName || 'Matador'}):</span>
            <div class="metric-value-row">
              <span class="metric-value">${card.fareRangeText}</span>
              <span class="metric-tag">SRO-97 Statutory Cap</span>
            </div>
          </div>

          <div class="fare-sub-metrics">
            <div class="sub-metric-item">
              <span class="sub-label">Formula Exact:</span>
              <strong class="sub-val">₹${card.formulaExact}</strong>
            </div>
            <div class="sub-metric-item">
              <span class="sub-label">🌙 Night Fare (Post 19:00):</span>
              <strong class="sub-val night-val">₹${card.nightFare} (+20%)</strong>
            </div>
          </div>
        </div>

        <div class="fare-widget-actions">
          <button type="button" class="fare-act-btn btn-view-calc" data-origin="${escapeHtml(card.origin)}" data-dest="${escapeHtml(card.destination)}">
            <span>🗺️ Check Route Map</span>
          </button>
          <button type="button" class="fare-act-btn btn-report-hike" data-origin="${escapeHtml(card.origin)}" data-dest="${escapeHtml(card.destination)}" data-fare="${card.formulaExact}">
            <span>⚖️ Report Overcharge</span>
          </button>
          <button type="button" class="fare-act-btn action-call-trigger" data-call-num="01942450022" data-call-name="Traffic Control Room Kashmir">
            <span>📞 Traffic Helpline</span>
          </button>
        </div>
      </div>
    `;
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

  function buildRightsGuideCards() {
    const problems = (Data().PROBLEMS && Data().PROBLEMS.length) ? Data().PROBLEMS : [];
    return problems.map(p => `
      <div class="legal-card-guide">
        <div class="legal-card-header">
          <span class="legal-card-icon">${p.icon}</span>
          <div>
            <h4>${p.title}</h4>
            <span class="legal-law-pill">${p.law}</span>
          </div>
        </div>
        <p class="legal-card-penalty"><strong>Statutory Penalty:</strong> ${p.penalty}</p>
        <div class="legal-card-script">
          <label>🗣️ Official Spoken Script:</label>
          <p>"${p.scriptEnglish}"</p>
          ${p.scriptUrdu ? `<p class="urdu-script" dir="rtl">"${p.scriptUrdu}"</p>` : ''}
        </div>
        <div class="legal-card-footer">
          <span class="legal-verified-tag">🛡️ Verified Source: ${p.source}</span>
          <button type="button" class="copy-script-btn" data-copy-text="${encodeURIComponent(p.scriptEnglish)}">📋 Copy Script</button>
        </div>
      </div>
    `).join('');
  }

  /* ─────────────────────────────────────────────────────────────────
     5. MODAL CONTENT ASSEMBLY
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
    const isListening = Voice() && Voice().getState() === Voice().VoiceState.LISTENING;
    const isSpeaking = Voice() && Voice().getState() === Voice().VoiceState.SPEAKING;

    // External key status
    const extKey = typeof localStorage !== 'undefined' ? localStorage.getItem('safar_external_llm_key') : null;
    const extProvider = typeof localStorage !== 'undefined' ? (localStorage.getItem('safar_external_llm_provider') || 'gemini') : 'gemini';
    const isExtConnected = !!(extKey && extKey.trim().length > 10);

    container.innerHTML = `
      <!-- Top Switcher Bar -->
      <div class="help-tab-switcher" role="tablist">
        <button type="button" class="help-switcher-btn${state.activeTab === 'problem' ? ' active' : ''}"
                data-tab="problem" role="tab" aria-selected="${state.activeTab === 'problem'}">
          <span class="switcher-icon">✨</span>
          <strong>Conversational AI &amp; Voice</strong>
          <small>Gemini / DeepSeek Grade</small>
        </button>
        <button type="button" class="help-switcher-btn${state.activeTab === 'directory' ? ' active' : ''}"
                data-tab="directory" role="tab" aria-selected="${state.activeTab === 'directory'}">
          <span class="switcher-icon">📞</span>
          <strong>Official Directory</strong>
          <small>All 20 RTOs &amp; Traffic Police</small>
        </button>
        <button type="button" class="help-switcher-btn${state.activeTab === 'guide' ? ' active' : ''}"
                data-tab="guide" role="tab" aria-selected="${state.activeTab === 'guide'}">
          <span class="switcher-icon">⚖️</span>
          <strong>Commuter Rights &amp; Law</strong>
          <small>SRO-97 Statutory Records</small>
        </button>
      </div>

      <!-- ── TAB 1: CONVERSATIONAL VOICE & CHAT (GEMINI/DEEPSEEK GRADE) ── -->
      <div class="help-pane-content${state.activeTab === 'problem' ? ' active' : ''}" id="help-pane-problem">
        
        <!-- Interactive Gemini Live Voice Visualizer Bar -->
        <div class="gemini-voice-stage ${isSpeaking ? 'stage-speaking' : isListening ? 'stage-listening' : 'stage-idle'}">
          
          <div class="voice-orb-container" id="geminiVoiceOrb" title="Tap orb to talk or interrupt anytime">
            <div class="voice-orb-glow"></div>
            <div class="voice-orb-inner">
              <div class="orb-core">
                <span class="orb-icon">${isListening ? '🎙️' : isSpeaking ? '🔊' : '✨'}</span>
              </div>
            </div>
            <!-- Dynamic Frequency Waveforms -->
            <div class="audio-wave-bars">
              <span class="wave-bar wb-1"></span>
              <span class="wave-bar wb-2"></span>
              <span class="wave-bar wb-3"></span>
              <span class="wave-bar wb-4"></span>
              <span class="wave-bar wb-5"></span>
              <span class="wave-bar wb-6"></span>
              <span class="wave-bar wb-7"></span>
            </div>
          </div>

          <div class="voice-stage-info">
            <div class="stage-status-row">
              <span class="stage-state-pill ${isListening ? 'pill-listening' : isSpeaking ? 'pill-speaking' : 'pill-idle'}">
                ${isListening ? '🔴 LISTENING' : isSpeaking ? '🔊 SPEAKING' : '🟢 READY'}
              </span>
              <span class="stage-engine-name">
                ${isExtConnected ? `✨ ${extProvider === 'gemini' ? 'Google Gemini 1.5' : 'DeepSeek-V3'} Connected` : '🛡️ Safar Omni-Intelligence (Offline Ready)'}
              </span>
              <button type="button" id="toggleModelSettingsBtn" class="btn-model-settings" title="Configure Gemini / DeepSeek API Key">
                ⚙️ AI Model
              </button>
            </div>
            <p class="stage-sub-prompt" id="voiceStageStatusText">
              ${isListening ? "Listening... Speak naturally in English, हिन्दी, or اردو" : isSpeaking ? "Speaking answer aloud... Tap orb or mic to interrupt" : "Tap the orb or mic to speak, or type your question below"}
            </p>
          </div>

          <!-- Language Selector -->
          <div class="voice-lang-selector" title="Select Voice & Recognition Language">
            <button type="button" class="lang-pill${currentLang === 'auto' ? ' active' : ''}" data-lang="auto">Auto</button>
            <button type="button" class="lang-pill${currentLang === 'en' ? ' active' : ''}" data-lang="en">EN</button>
            <button type="button" class="lang-pill${currentLang === 'hi' ? ' active' : ''}" data-lang="hi">हिन्दी</button>
            <button type="button" class="lang-pill${currentLang === 'ur' ? ' active' : ''}" data-lang="ur">اردو</button>
          </div>
        </div>

        <!-- Optional External Model Configuration Drawer -->
        ${state.showModelSettings ? `
          <div class="model-settings-drawer">
            <div class="drawer-header">
              <strong>⚙️ AI Intelligence Provider Settings</strong>
              <button type="button" id="closeModelSettingsBtn" class="drawer-close-btn">✕</button>
            </div>
            <p class="drawer-desc">
              Safar comes with a built-in, zero-latency <strong>Omni-Transit Engine</strong> covering all 20 J&K districts offline.
              Optionally, connect your Google Gemini or DeepSeek API key for infinite open-domain AI capabilities!
            </p>
            <div class="drawer-row">
              <label for="extLlmProvider">AI Model Provider:</label>
              <select id="extLlmProvider" class="drawer-select">
                <option value="gemini"${extProvider === 'gemini' ? ' selected' : ''}>Google Gemini 1.5 / 2.0 Flash</option>
                <option value="deepseek"${extProvider === 'deepseek' ? ' selected' : ''}>DeepSeek-V3 / R1</option>
              </select>
            </div>
            <div class="drawer-row">
              <label for="extLlmApiKey">API Key (Stored locally in your browser):</label>
              <input type="password" id="extLlmApiKey" class="drawer-input" placeholder="AIzaSy... or sk-..." value="${extKey || ''}" />
            </div>
            <div class="drawer-actions">
              <button type="button" id="saveModelSettingsBtn" class="btn-primary-sm">Save Key</button>
              ${extKey ? `<button type="button" id="clearModelSettingsBtn" class="btn-secondary-sm">Use Offline Engine</button>` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Quick Prompt Chips (One-Tap Inquiries) -->
        <div class="quick-prompts-carousel">
          <button type="button" class="prompt-chip" data-prompt-text="What is the fare rate between Budgam to Lal Chowk via Matador?">
            🚐 Budgam to Lal Chowk via Matador
          </button>
          <button type="button" class="prompt-chip" data-prompt-text="What is the fare from Srinagar to Baramulla by Sumo?">
            🚙 Srinagar to Baramulla (Sumo)
          </button>
          <button type="button" class="prompt-chip" data-prompt-text="What are the auto rickshaw meter rules and night charges in Srinagar?">
            🛺 Auto Meter Rules &amp; Night Surcharge
          </button>
          <button type="button" class="prompt-chip" data-prompt-text="What is the 24x7 helpline for NH-44 highway status and Navyug Tunnel?">
            ❄️ NH-44 Highway &amp; Tunnel Status
          </button>
          <button type="button" class="prompt-chip" data-prompt-text="How much free luggage is allowed per commuter under SRO-97?">
            🧳 Free Luggage Allowance (15 kg)
          </button>
          <button type="button" class="prompt-chip" data-prompt-text="The driver is demanding extra fare above notified rate, how to report?">
            ⚖️ Report Overcharge Grievance
          </button>
        </div>

        <!-- Conversational Chat Stream -->
        <div class="ai-chat-timeline" id="aiChatTimeline">
          ${buildChatMessages()}
        </div>

        <!-- Sticky Chat Input Bar -->
        <div class="chat-input-toolbar">
          <div class="input-wrap">
            <input type="text" id="help-custom-input" class="chat-text-input"
                   placeholder="Ask any route, fare rate, auto meter rule, or grievance..."
                   value="${state.customQuery || ''}" autocomplete="off" />
            
            <button id="micBtn" class="chat-mic-btn${isListening ? ' recording' : ''}" type="button"
                    aria-label="${isListening ? 'Stop voice listening' : 'Start speaking'}"
                    title="${isListening ? 'Listening... Tap to stop' : 'Tap to speak your question'}">
              <span>${isListening ? '⏹️' : '🎙️'}</span>
            </button>
          </div>

          <button type="button" id="help-ask-ai-btn" class="chat-send-btn" title="Send question">
            <span>Ask AI ➔</span>
          </button>
        </div>

        <!-- Live Status Banner -->
        <div id="voiceStatusBanner" class="voice-status-banner hidden" role="status" aria-live="polite"></div>

        <!-- Confirmation Dialog for Calls / WhatsApp -->
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

      <!-- ── TAB 3: STATUTORY RIGHTS & SRO-97 ── -->
      <div class="help-pane-content${state.activeTab === 'guide' ? ' active' : ''}" id="help-pane-guide">
        <div class="rights-guide-header">
          <h3>⚖️ Official J&amp;K Commuter Rights &amp; SRO-97 Gazettes</h3>
          <p>Verified legal citations under the Motor Vehicles Act 1988 and J&amp;K Transport Department Gazettes. Drivers cannot violate these statutory provisions.</p>
        </div>
        <div class="rights-cards-grid">
          ${buildRightsGuideCards()}
        </div>
      </div>
    `;
  }

  /* ─────────────────────────────────────────────────────────────────
     6. VOICE & ORB LIFECYCLE MANAGEMENT
  ───────────────────────────────────────────────────────────────── */
  function updateVoiceVisualizer(voiceState) {
    const orb = document.getElementById('geminiVoiceOrb');
    const stage = document.querySelector('.gemini-voice-stage');
    const statusText = document.getElementById('voiceStageStatusText');

    if (!orb || !stage) return;

    stage.classList.remove('stage-idle', 'stage-listening', 'stage-speaking');

    if (voiceState === Voice().VoiceState.LISTENING) {
      stage.classList.add('stage-listening');
      if (statusText) statusText.textContent = "Listening... Speak your question naturally.";
    } else if (voiceState === Voice().VoiceState.SPEAKING) {
      stage.classList.add('stage-speaking');
      if (statusText) statusText.textContent = "Speaking answer aloud... Tap orb or mic to interrupt.";
    } else {
      stage.classList.add('stage-idle');
      if (statusText) statusText.textContent = "Tap the orb or mic to speak, or type your question below.";
    }
  }

  function updateVoiceStatus(message, type = 'info', isPulsing = false) {
    const banner = document.getElementById('voiceStatusBanner');
    const stageText = document.getElementById('voiceStageStatusText');

    if (stageText && message) {
      stageText.textContent = message.replace(/[🔴🔊✨🎙️✅]/g, '').trim();
    }

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
      micBtn.innerHTML = '<span>⏹️</span>';
      micBtn.setAttribute('title', 'Listening... Tap to stop & submit');
    } else {
      micBtn.classList.remove('recording');
      micBtn.innerHTML = '<span>🎙️</span>';
      micBtn.setAttribute('title', 'Tap to speak your question');
    }
  }

  async function startVoiceListening() {
    if (!Voice()) return;

    // Barge-in: stop any active assistant speech instantly!
    if (Voice().getState() === Voice().VoiceState.SPEAKING) {
      Voice().interrupt();
      state.activeSpeakingMsgId = null;
    }

    updateVoiceStatus("🎙️ Requesting microphone access...", "info", true);
    const perm = await Voice().requestMicrophonePermission();

    if (!perm.granted) {
      setMicBtnState(false);
      updateVoiceStatus("🔒 Microphone access is blocked. Allow mic in browser address bar or type below.", "error", false);
      return;
    }

    const sttLang = getSttLang();
    setMicBtnState(true);
    updateVoiceVisualizer(Voice().VoiceState.LISTENING);
    updateVoiceStatus("🔴 I'm listening... Speak naturally in English, हिन्दी, or اردو.", "listening", true);

    const started = Voice().startListening({
      lang: sttLang,
      onInterim: (text) => {
        const input = document.getElementById('help-custom-input');
        if (input) input.value = text;
        updateVoiceStatus(`🎙️ Hearing: "${escapeHtml(text)}"`, "listening", true);
      },
      onFinal: (text) => {
        setMicBtnState(false);
        updateVoiceVisualizer(Voice().VoiceState.IDLE);
        if (text && text.trim()) {
          updateVoiceStatus(`✓ "${escapeHtml(text)}" — Thinking...`, "info", true);
          handleUserTurn(text, 'speech');
        }
      },
      onError: (err) => {
        setMicBtnState(false);
        updateVoiceVisualizer(Voice().VoiceState.IDLE);
        if (err.code === 'MIC_PERMISSION_DENIED') {
          updateVoiceStatus("🔒 Microphone blocked. Please allow mic in browser settings.", "error", false);
        } else if (err.code === 'NO_SPEECH') {
          updateVoiceStatus("🎙️ Didn't hear anything. Tap mic to try again or type below.", "info", false);
        } else {
          updateVoiceStatus("🎙️ Voice input stopped. Tap mic to try again.", "info", false);
        }
      }
    });

    if (!started) {
      setMicBtnState(false);
      updateVoiceVisualizer(Voice().VoiceState.IDLE);
    }
  }

  function stopVoiceRecording(triggerSubmit = false) {
    if (Voice()) {
      Voice().stopListening();
    }
    setMicBtnState(false);
    updateVoiceVisualizer(Voice().VoiceState.IDLE);

    const input = document.getElementById('help-custom-input');
    if (triggerSubmit && input && input.value.trim()) {
      handleUserTurn(input.value.trim(), 'speech');
    }
  }

  async function toggleVoiceRecording() {
    if (Voice() && Voice().getState() === Voice().VoiceState.LISTENING) {
      stopVoiceRecording(true);
      return;
    }

    // Barge-in: if AI is speaking, interrupt it instantly!
    if (Voice() && Voice().getState() === Voice().VoiceState.SPEAKING) {
      Voice().interrupt();
      state.activeSpeakingMsgId = null;
      renderHelpModal();
      return;
    }

    const input = document.getElementById('help-custom-input');
    const existingVal = input ? input.value.trim() : '';

    if (existingVal) {
      handleUserTurn(existingVal, 'text');
      return;
    }

    await startVoiceListening();
  }

  function stopAiSpeech() {
    if (Voice()) {
      Voice().stopSpeaking();
    }
    state.activeSpeakingMsgId = null;
    updateVoiceVisualizer(Voice().VoiceState.IDLE);
  }

  function toggleAiVoiceSpeech(text = null, msgId = null) {
    if (Voice() && Voice().getState() === Voice().VoiceState.SPEAKING) {
      stopAiSpeech();
      renderHelpModal();
    } else {
      const textToSpeak = text || (conversation.messages.slice(-1)[0] ? conversation.messages.slice(-1)[0].text : '');
      if (Voice() && textToSpeak) {
        state.activeSpeakingMsgId = msgId;
        renderHelpModal();
        Voice().speak(textToSpeak, getTtsLang(conversation.language), null, () => {
          state.activeSpeakingMsgId = null;
          renderHelpModal();
        });
      }
    }
  }

  function copyToClipboard(text, btn, successLabel, resetLabel) {
    function applySuccess() {
      btn.textContent = successLabel;
      setTimeout(() => { btn.textContent = resetLabel; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(applySuccess).catch(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = resetLabel; }, 2000);
      });
    } else {
      applySuccess();
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     7. EVENT LISTENERS
  ───────────────────────────────────────────────────────────────── */
  function handleContainerClick(e) {
    // 1. Tab switch
    const switcher = e.target.closest('.help-switcher-btn');
    if (switcher) {
      stopVoiceRecording(false);
      stopAiSpeech();
      state.activeTab = switcher.dataset.tab;
      renderHelpModal();
      return;
    }

    // 2. Language selection
    const langPill = e.target.closest('.lang-pill');
    if (langPill) {
      conversation.language = langPill.dataset.lang;
      renderHelpModal();
      return;
    }

    // 3. Gemini Voice Orb tap (Talk or Barge-in)
    if (e.target.closest('#geminiVoiceOrb')) {
      toggleVoiceRecording();
      return;
    }

    // 4. Mic button tap
    if (e.target.closest('#micBtn')) {
      toggleVoiceRecording();
      return;
    }

    // 5. Send / Ask AI Button
    if (e.target.closest('#help-ask-ai-btn')) {
      const input = document.getElementById('help-custom-input');
      const val = input ? input.value.trim() : '';
      if (val) {
        handleUserTurn(val, 'text');
      }
      return;
    }

    // 6. Quick Prompt Chips
    const promptChip = e.target.closest('.prompt-chip');
    if (promptChip) {
      const pText = promptChip.dataset.promptText;
      if (pText) {
        handleUserTurn(pText, 'text');
      }
      return;
    }

    // 7. Message bubble voice toggle button
    const audioBtn = e.target.closest('.btn-msg-audio');
    if (audioBtn) {
      const vText = decodeURIComponent(audioBtn.dataset.voiceText || '');
      const mId = audioBtn.dataset.msgId;
      toggleAiVoiceSpeech(vText, mId);
      return;
    }

    // 8. Model Settings drawer toggles
    if (e.target.closest('#toggleModelSettingsBtn')) {
      state.showModelSettings = !state.showModelSettings;
      renderHelpModal();
      return;
    }
    if (e.target.closest('#closeModelSettingsBtn')) {
      state.showModelSettings = false;
      renderHelpModal();
      return;
    }
    if (e.target.closest('#saveModelSettingsBtn')) {
      const prov = document.getElementById('extLlmProvider')?.value || 'gemini';
      const key = document.getElementById('extLlmApiKey')?.value.trim() || '';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('safar_external_llm_provider', prov);
        localStorage.setItem('safar_external_llm_key', key);
      }
      state.showModelSettings = false;
      renderHelpModal();
      updateVoiceStatus(`✅ Saved API Key for ${prov === 'gemini' ? 'Google Gemini' : 'DeepSeek'}!`, 'success', false);
      return;
    }
    if (e.target.closest('#clearModelSettingsBtn')) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('safar_external_llm_key');
      }
      state.showModelSettings = false;
      renderHelpModal();
      updateVoiceStatus('🛡️ Reverted to Safar Offline Omni-Intelligence Engine.', 'info', false);
      return;
    }

    // 9. Interactive Fare Card Action: View Route
    const viewCalcBtn = e.target.closest('.btn-view-calc');
    if (viewCalcBtn) {
      const orig = viewCalcBtn.dataset.origin;
      const dest = viewCalcBtn.dataset.dest;
      if (window.populateFromSelect && orig) window.populateFromSelect(orig);
      if (window.populateToSelect && dest) window.populateToSelect(dest);
      // Close modal to let user view the main calculator
      const modal = document.getElementById('help-modal');
      if (modal) modal.setAttribute('hidden', '');
      return;
    }

    // 10. Interactive Fare Card Action: Report Overcharge
    const reportHikeBtn = e.target.closest('.btn-report-hike');
    if (reportHikeBtn) {
      const orig = reportHikeBtn.dataset.origin;
      const dest = reportHikeBtn.dataset.dest;
      const query = `The driver is overcharging for ${orig} to ${dest}. What is the legal penalty under SRO-97?`;
      handleUserTurn(query, 'text');
      return;
    }

    // 11. Directory Category Pills
    const dirPill = e.target.closest('.dir-pill');
    if (dirPill) {
      state.directoryFilter = dirPill.dataset.cat;
      renderHelpModal();
      return;
    }

    // 12. Clear Directory Search
    if (e.target.closest('#dir-clear-search')) {
      state.searchQuery = '';
      renderHelpModal();
      return;
    }

    // 13. Direct Call Action Trigger
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

    // 14. WhatsApp Action Trigger
    const waBtn = e.target.closest('.action-wa-trigger');
    if (waBtn) {
      const num = waBtn.dataset.waNum;
      const name = decodeURIComponent(waBtn.dataset.waName || 'Traffic Control');
      const msg = decodeURIComponent(waBtn.dataset.waMsg || '');
      conversation.awaitingConfirmation = true;
      conversation.confirmedAction = { toolName: 'openWhatsApp', args: { number: num, message: msg, name } };
      state.confirmationPrompt = {
        prompt: `Would you like Safar to open WhatsApp for ${name}?`
      };
      renderHelpModal();
      return;
    }

    // 15. Confirmation responses
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

    // 16. Copy Script Button
    const copyScriptBtn = e.target.closest('.copy-script-btn');
    if (copyScriptBtn) {
      const text = decodeURIComponent(copyScriptBtn.dataset.copyText);
      copyToClipboard(text, copyScriptBtn, '✓ Copied!', '📋 Copy Script');
      return;
    }

    // 17. Copy Number Button
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
     8. INITIALIZATION & EXPORTS
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
if (typeof window !== 'undefined') window.SafarHelpAssistant = SafarHelpAssistant;
if (typeof globalThis !== 'undefined') globalThis.SafarHelpAssistant = SafarHelpAssistant;
if (typeof module !== 'undefined' && module.exports) module.exports = SafarHelpAssistant;
