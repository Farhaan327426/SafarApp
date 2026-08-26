/**
 * SAFAR — Master Transit Application Engine (ES6 Entry Point)
 * Commuter fare computation, offline Background Sync ledger, live route caching,
 * Driver Console with live GPS broadcasting & receipt verification,
 * Multilingual AI Transit Assistant with context awareness,
 * Full-screen Fare Dispute Resolution Badge, Network Status Monitor,
 * Haptic Touch Engine, and Accessible Shared Mobility Blueprint (Mind Map).
 */

import { updateNetworkStatus } from './core/network.js';
import { initTabNavigation, switchTab } from './features/navigation/tab-navigation.js';
import { loadRoutes } from './features/fare/routes-service.js';
import { initFareUI, calculateFare, openDisputeModal, closeDisputeModal } from './features/fare/fare-ui.js';
import { initBookingUI, updateOfflineBadge, submitBooking, flushOfflineQueue } from './features/booking/booking-ui.js';
import { loadMindmapData } from './features/mindmap/mindmap-service.js';
import { initMindMap, renderMindMap, setMindmapZoom, handleMindmapKeyboardNav } from './features/mindmap/mindmap-engine.js';
import { initAiAssistant, triggerSendAiMessage, processAiQuery, sendAiResponse, toggleVoiceInput, sendAiChipQuery } from './features/ai/ai-assistant.js';
import { initDriverConsole, populateConductorRoutes, adjustPassengerCount, toggleConductorBroadcast, triggerConductorVerifyCode } from './features/driver/driver-console.js';
import { initCommuterMap } from './features/map/commuter-map.js';
import { initDriverMap } from './features/map/driver-map.js';
import { initSosHandler, triggerEmergencySos } from './features/sos/sos-handler.js';
import { showToast } from './core/toast.js';
import { initOfflineManager } from './offline-manager.js';
import { initI18n } from './i18n.js';

// ─── MASTER ASYNC BOOTSTRAP SEQUENCE ─────────────────────────────────────────
async function bootstrap() {
  // 1. Data Services Loading (Async cache & API data fetch)
  await loadMindmapData();
  await loadRoutes();
  await updateOfflineBadge();

  // 2. Initialize Feature UI Event Listeners
  initTabNavigation();
  initFareUI();
  initBookingUI();
  initDriverConsole();
  initAiAssistant();
  initMindMap();
  initSosHandler();
  initCommuterMap();
  initOfflineManager();
  await initI18n();

  // 3. Network Monitoring
  if (typeof window !== "undefined") {
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);
    updateNetworkStatus();
  }

  // 4. Activate Initial View based on URL pathname
  const initialTab = (typeof window !== "undefined" && window.location.pathname === "/driver") ? "driver" : "commuter";
  switchTab(initialTab, false);
}

// Top-level module execution (ES6 modules run after DOM parse)
bootstrap();

// ─── EXPOSE LEGACY WINDOW API FOR 100% BACKWARDS COMPATIBILITY ──────────────
if (typeof window !== "undefined") {
  window.switchTab = switchTab;
  window.switchBottomTab = switchTab;
  window.populateConductorRoutes = populateConductorRoutes;
  window.adjustPassengerCount = adjustPassengerCount;
  window.toggleConductorBroadcast = toggleConductorBroadcast;
  window.triggerConductorVerifyCode = triggerConductorVerifyCode;
  window.initDriverMap = initDriverMap;
  window.triggerSendAiMessage = triggerSendAiMessage;
  window.processAiQuery = processAiQuery;
  window.sendAiResponse = sendAiResponse;
  window.toggleVoiceInput = toggleVoiceInput;
  window.sendAiChipQuery = sendAiChipQuery;
  window.renderMindMap = renderMindMap;
  window.showToast = showToast;
  window.openDisputeModal = openDisputeModal;
  window.closeDisputeModal = closeDisputeModal;
  window.triggerEmergencySos = triggerEmergencySos;
}
