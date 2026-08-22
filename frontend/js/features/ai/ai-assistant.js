/**
 * SAFAR — Multilingual Transit AI Assistant Module
 * Context-aware Transit Copilot for Jammu & Kashmir Transit Network.
 */

import { store } from '../../core/state.js';
import { triggerHaptic } from '../../core/haptics.js';
import { showToast } from '../../core/toast.js';

export function initAiAssistant() {
  const aiState = store.getState('ai');
  store.setState('ai', { hasInitialized: true });
  const initialGreeting =
    "Assalamu Alaikum / नमस्ते! I am your Safar AI transit assistant. Ask me about stage-carriage fares, routes, crowd density, student discounts, or live GPS tracking across J&K.";
  sendAiResponse(initialGreeting, false);

  const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  if (SpeechRecognition) {
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN";

      rec.onresult = event => {
        const transcript = event.results[0][0].transcript;
        const inputEl = document.getElementById("aiInputText");
        if (inputEl) inputEl.value = transcript;
        setMicListeningState(false);
        triggerSendAiMessage();
      };

      rec.onerror = () => setMicListeningState(false);
      rec.onend = () => setMicListeningState(false);

      store.setState('ai', { recognition: rec });
    } catch (e) { }
  }

  const aiInputForm = document.getElementById("aiInputForm");
  if (aiInputForm) {
    aiInputForm.addEventListener("submit", e => {
      e.preventDefault();
      triggerSendAiMessage();
    });
  }

  const aiMicBtn = document.getElementById("aiMicBtn");
  if (aiMicBtn) {
    aiMicBtn.addEventListener("click", toggleVoiceInput);
  }

  const chipButtons = document.querySelectorAll(".ai-chip");
  chipButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const query = btn.getAttribute("data-query");
      if (query) sendAiChipQuery(query);
    });
  });

  store.subscribe('navigation', state => {
    if (state.activeTab === 'ai') {
      if (!store.getState('ai').hasInitialized) {
        initAiAssistant();
      }
      const chatContainer = document.getElementById("aiChatContainer");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  });
}

export function setMicListeningState(isListening) {
  store.setState('ai', { isListening });
  const micBtn = document.getElementById("aiMicBtn");
  if (!micBtn) return;
  if (isListening) {
    micBtn.classList.add("listening");
    micBtn.setAttribute("aria-label", "Listening... Speak your query now");
  } else {
    micBtn.classList.remove("listening");
    micBtn.setAttribute("aria-label", "Voice input");
  }
}

export function toggleVoiceInput() {
  const aiState = store.getState('ai');
  if (!aiState.recognition) {
    showToast("🎙️ Speech Recognition is not supported by your browser. Please type your query.", "info");
    return;
  }

  if (aiState.isListening) {
    aiState.recognition.stop();
    setMicListeningState(false);
  } else {
    try {
      aiState.recognition.start();
      setMicListeningState(true);
    } catch (err) {
      setMicListeningState(false);
    }
  }
}

export function sendAiResponse(text, isUser = false) {
  const chatContainer = document.getElementById("aiChatContainer");
  if (!chatContainer) return;

  const bubble = document.createElement("div");
  bubble.className = isUser ? "chat-bubble chat-user" : "chat-bubble chat-ai";

  const senderTag = document.createElement("div");
  senderTag.className = "chat-sender-tag";

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  senderTag.textContent = (isUser ? "👤 You" : "🤖 Safar AI") + " • " + timeStr;

  const contentDiv = document.createElement("div");
  contentDiv.className = "chat-text";
  contentDiv.textContent = text;

  bubble.appendChild(senderTag);
  bubble.appendChild(contentDiv);
  chatContainer.appendChild(bubble);

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

export function detectQueryLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ur";
  const lower = text.toLowerCase();
  if (
    lower.includes("kya") ||
    lower.includes("chhu") ||
    lower.includes("chhe") ||
    lower.includes("kathe") ||
    lower.includes("koshur") ||
    lower.includes("kiraya") ||
    lower.includes("kitna") ||
    lower.includes("kahan") ||
    lower.includes("namaskar") ||
    lower.includes("namaste") ||
    lower.includes("salam") ||
    lower.includes("shukriya") ||
    lower.includes("meharbani")
  ) {
    return "ks_roman";
  }
  return "en";
}

export function processAiQuery(rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  const lang = detectQueryLanguage(rawQuery);
  const isOffline = typeof navigator !== "undefined" ? !navigator.onLine : false;
  const offlineNotice = isOffline ? "\n\n📡 Note: You are offline. Showing cached regulatory data." : "";

  const commuterState = store.getState('commuter');
  const activeRoute = commuterState.route;

  if (
    q.includes("hello") || q.includes("hi") || q.includes("salam") ||
    q.includes("assalamu") || q.includes("namaste") || q.includes("kya haal") || q.includes("helo")
  ) {
    if (lang === "hi") {
      return "नमस्ते! मैं सफ़र AI सहायक हूँ। आप मुझसे बस किराया, रूट, लाइव बस लोकेशन या छात्र छूट के बारे में पूछ सकते हैं।" + offlineNotice;
    }
    if (lang === "ur" || lang === "ks_roman") {
      return "Walaikum Assalam! Be chhus tuhund Safar AI Assistant. Tohi hekyiv stage-carriage kiraya, route timetable, ya live bus tracking mutaliq prith." + offlineNotice;
    }
    return "Walaikum Assalam / Greetings! I am your Safar AI transit assistant. Ask me about regulated bus fares, route stops, crowd density, or student concession policies across J&K." + offlineNotice;
  }

  if (q.includes("student") || q.includes("discount") || q.includes("concession") || q.includes("pass") || q.includes("choot")) {
    if (lang === "hi") {
      return "🎓 छात्र रियायत नियम: परिवहन प्राधिकरण के आदेशानुसार वैध संस्थान पहचान पत्र रखने वाले छात्रों को बस किराए पर 50% की छूट प्रदान की जाती है।" + offlineNotice;
    }
    return "🎓 Student Concession Rules: As mandated by the J&K Transport Authority, bona fide students carrying a valid institutional photo ID card are entitled to a 50% fare discount on all stage carriage buses across Jammu & Kashmir." + offlineNotice;
  }

  if (q.includes("where is my bus") || q.includes("track") || q.includes("location") || q.includes("kahan hai") || q.includes("gps") || q.includes("live")) {
    if (typeof window !== "undefined" && window.liveTrackerModule && window.liveTrackerModule.activeTrips && window.liveTrackerModule.activeTrips.length > 0) {
      const trip = window.liveTrackerModule.activeTrips[0];
      return `📍 Live Vehicle Tracker: Found active bus [${trip.vehicleNo}] on corridor "${trip.routeName}". Current Speed: ${trip.speed || 24} km/h, Predicted ETA: ${trip.etaMinutes || 8} mins. Check the Commuter tab map for live real-time visual tracking.` + offlineNotice;
    }
    const driverState = store.getState('driver');
    if (driverState.isBroadcasting) {
      return `📡 Driver Broadcast Active: Your vehicle [${driverState.vehicleNo}] is currently transmitting live GPS pings to the central network (${driverState.pingsCount} pings dispatched).` + offlineNotice;
    }
    return "📍 Live Corridor GPS: Stage carriage vehicles continuously broadcast telemetry on major corridors (Srinagar–Budgam, Anantnag Express, Baramulla, Jammu–Katra). You can observe real-time pins directly on the Commuter Live Tracker." + offlineNotice;
  }

  if (q.includes("overcharge") || q.includes("complain") || q.includes("rule") || q.includes("police") || q.includes("authority") || q.includes("dispute") || q.includes("receipt") || q.includes("pcr")) {
    return "⚖️ Regulatory Compliance & Dispute Redressal: All stage carriage operators must adhere strictly to the notified rate schedule. If a conductor overcharges or refuses to issue a receipt, you can report the vehicle number to the Transport Authority Control Room or Police PCR (112). Use the Fare Calculator tab to display the official verified slab fare." + offlineNotice;
  }

  if (q.includes("crowd") || q.includes("rush") || q.includes("seat") || q.includes("full") || q.includes("kashmir university")) {
    return "📊 Corridor Density: Kashmir University and Lal Chowk corridors operate peak-hour shuttle mini-buses every 6 to 8 minutes. Current passenger load is MODERATE with seating available." + offlineNotice;
  }

  const routes = window.JK_ROUTES_DB || [];
  let matchedRoute = null;

  if ((q.includes("this route") || q.includes("fare") || q.includes("cheapest") || q.includes("cost") || q.includes("kiraya")) && activeRoute) {
    matchedRoute = activeRoute;
  }

  if (!matchedRoute) {
    if (q.includes("budgam")) matchedRoute = routes.find(r => r.name.toLowerCase().includes("budgam"));
    else if (q.includes("hazratbal") || q.includes("university")) matchedRoute = routes.find(r => r.name.toLowerCase().includes("hazratbal"));
    else if (q.includes("anantnag") || q.includes("islamabad")) matchedRoute = routes.find(r => r.name.toLowerCase().includes("anantnag"));
    else if (q.includes("sopore")) matchedRoute = routes.find(r => r.name.toLowerCase().includes("sopore"));
    else if (q.includes("ganderbal")) matchedRoute = routes.find(r => r.name.toLowerCase().includes("ganderbal"));
    else if (q.includes("lal chowk") || q.includes("chowk")) matchedRoute = routes.find(r => r.name.toLowerCase().includes("lal chowk"));
    else if (q.includes("jammu") || q.includes("katra")) matchedRoute = routes.find(r => r.name.toLowerCase().includes("katra") || r.name.toLowerCase().includes("jammu"));
  }

  if (matchedRoute) {
    const dist = matchedRoute.distance || 12;
    const miniBusFare = (typeof window !== "undefined" && window.getOfficialFare) ? window.getOfficialFare("MINI_BUS", dist) : { fare: 17 };
    const studentFare = miniBusFare ? Math.round(miniBusFare.fare * 0.5) : 9;

    if (lang === "hi") {
      return `🚌 रूट "${matchedRoute.name}" (${dist} किमी):\n• मिनी बस किराया: ₹${miniBusFare ? Math.round(miniBusFare.fare) : 17}\n• छात्र रियायती दर: ₹${studentFare}\nआप फेयर कैलकुलेटर टैब में विस्तृत स्टॉप-दर-स्टॉप दूरी भी देख सकते हैं।` + offlineNotice;
    }

    return `🚌 Route Details: "${matchedRoute.name}" (${dist} km)\n• Regulated Mini-Bus Fare: ₹${miniBusFare ? Math.round(miniBusFare.fare) : 17}\n• Student Concession Rate: ₹${studentFare} (50% discount)\n• Key Stops: ${matchedRoute.stops ? matchedRoute.stops.map(s => s.name || s).slice(0, 4).join(" ➔ ") + "..." : "Available in Route Planner"}` + offlineNotice;
  }

  if (q.includes("fare") || q.includes("kiraya") || q.includes("rate") || q.includes("price") || q.includes("cost") || q.includes("cheapest")) {
    return "💰 Regulated Stage Carriage Fare Slabs (≤20km Plain):\n• 0–3 km: ₹9\n• 3–5 km: ₹14\n• 5–10 km: ₹17\n• 10–15 km: ₹20\n• 15–20 km: ₹26\nBeyond 20km: Additional ₹1.40/km (Plain) or ₹1.70/km (Hilly). Student discount: 50%." + offlineNotice;
  }

  return `I checked our transport authority database for your query. You can calculate official fares in Commuter, broadcast GPS in Driver, or inspect the Blueprint Mind Map!` + offlineNotice;
}

export async function fetchBackendAiResponse(queryText) {
  try {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (!isOnline) {
      return processAiQuery(queryText);
    }

    const res = await fetch("/api/v1/ai/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryText })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.answer) {
        return json.data.answer;
      }
    }
  } catch (err) { }

  return processAiQuery(queryText);
}

export async function triggerSendAiMessage() {
  triggerHaptic(25);
  const inputEl = document.getElementById("aiInputText");
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text) return;

  sendAiResponse(text, true);
  inputEl.value = "";

  const responseText = await fetchBackendAiResponse(text);
  sendAiResponse(responseText, false);
}

export async function sendAiChipQuery(text) {
  triggerHaptic(20);
  sendAiResponse(text, true);
  const responseText = await fetchBackendAiResponse(text);
  sendAiResponse(responseText, false);
}
