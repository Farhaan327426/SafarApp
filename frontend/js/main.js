/**
 * SAFAR — J&K Smart Transit & Legal Fare Guide
 * Interactive Engine & UI Handlers
 */

// 1. Vehicle Option Definitions
const vehicleOptions = [
  {
    key: "shared-cab",
    label: "Shared Cab",
    sublabel: "Sumo / Tavera / Bolero",
    detail: "Standard passenger seat on fixed corridor",
    base: 35,
    perKm: 5.2,
    capacity: "4 to 7 Seats",
    badge: "Most Popular",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`
  },
  {
    key: "auto",
    label: "Auto-Rickshaw",
    sublabel: "3-Wheeler Metered",
    detail: "Short & medium town trips (up to 3 persons)",
    base: 45,
    perKm: 7.4,
    capacity: "Up to 3 Persons",
    badge: "City Travel",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="9" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
  },
  {
    key: "mini-bus",
    label: "Mini Bus / 407",
    sublabel: "Matador / Local Transit",
    detail: "Budget stage carriage across town hubs",
    base: 18,
    perKm: 2.9,
    capacity: "Per Passenger",
    badge: "Lowest Fare",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="15" rx="2"></rect><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle><path d="M3 10h18"></path><path d="M12 4v6"></path></svg>`
  },
  {
    key: "taxi",
    label: "Private Taxi",
    sublabel: "Sedan / Tourist Cab",
    detail: "Point-to-point dedicated vehicle hire",
    base: 160,
    perKm: 16.5,
    capacity: "Entire Vehicle (4+1)",
    badge: "Dedicated Cab",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path><circle cx="6.5" cy="16.5" r="2.5"></circle><circle cx="16.5" cy="16.5" r="2.5"></circle></svg>`
  }
];

// 2. Verified Route Presets
const routePresets = [
  {
    from: "Srinagar",
    to: "Gulmarg",
    distance: 51,
    duration: "1h 35m",
    terrain: "Mountain Pass",
    highway: "NH-1A / Tangmarg Rd",
    stops: ["Tangmarg", "Magam", "Narbal"]
  },
  {
    from: "Srinagar",
    to: "Pahalgam",
    distance: 92,
    duration: "2h 20m",
    terrain: "Scenic Valley Corridor",
    highway: "KP Road / NH-44",
    stops: ["Pampore", "Awantipora", "Anantnag"]
  },
  {
    from: "Srinagar",
    to: "Sonmarg",
    distance: 80,
    duration: "2h 10m",
    terrain: "High Mountain Highway",
    highway: "NH-1 (Srinagar-Leh)",
    stops: ["Ganderbal", "Kangan", "Gund"]
  },
  {
    from: "Jammu",
    to: "Katra",
    distance: 49,
    duration: "1h 14m",
    terrain: "Expressway Foothills",
    highway: "NH-44 / Katra Bypass",
    stops: ["Nagrota", "Jhajjar Kotli"]
  },
  {
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
    duration: "1h 20m",
    terrain: "Plains / 4-Lane Highway",
    highway: "NH-44 Valley Expressway",
    stops: ["Bijbehara", "Awantipora", "Pampore"]
  },
  {
    from: "Sopore",
    to: "Srinagar",
    distance: 49,
    duration: "1h 16m",
    terrain: "Plains Road",
    highway: "Sopore-Srinagar Highway",
    stops: ["Sangrama", "Pattan", "Shalteng"]
  }
];

// 3. Recent Estimates List
const recentEstimates = [
  {
    route: "Srinagar ➔ Gulmarg",
    from: "Srinagar",
    to: "Gulmarg",
    distance: 51,
    vehicleKey: "shared-cab",
    amount: "₹ 300",
    meta: "Shared Cab · Tangmarg corridor",
    time: "Today, 10:40 AM"
  },
  {
    route: "Jammu ➔ Katra",
    from: "Jammu",
    to: "Katra",
    distance: 49,
    vehicleKey: "taxi",
    amount: "₹ 1,020",
    meta: "Private Taxi · Vaishno Devi route",
    time: "Yesterday, 06:15 PM"
  },
  {
    route: "Anantnag ➔ Srinagar",
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
    vehicleKey: "mini-bus",
    amount: "₹ 170",
    meta: "Mini Bus · NH-44 Expressway",
    time: "12 Jun, 09:15 AM"
  }
];

// State variables
let currentFrom = "Srinagar";
let currentTo = "Gulmarg";
let currentDistance = 51;
let currentVehicleKey = "shared-cab";
let currentPriceMode = "per-seat";

// DOM Elements
const inputFrom = document.getElementById("input-from");
const inputTo = document.getElementById("input-to");
const inputDistance = document.getElementById("input-distance");
const swapBtn = document.getElementById("swap-route-btn");
const resetBtn = document.getElementById("reset-route-btn");
const vehicleCardsContainer = document.getElementById("vehicle-cards-container");
const quickPresetButtons = document.getElementById("quick-preset-buttons");
const displayPriceVal = document.getElementById("display-price-val");
const displayPriceBasis = document.getElementById("display-price-basis");
const fareRouteSummary = document.getElementById("fare-route-summary");
const specVehicleName = document.getElementById("spec-vehicle-name");
const specDistanceVal = document.getElementById("spec-distance-val");
const mathBaseFare = document.getElementById("math-base-fare");
const mathDistanceLabel = document.getElementById("math-distance-label");
const mathDistanceCost = document.getElementById("math-distance-cost");
const mathAdjustment = document.getElementById("math-adjustment");
const mathTotalFare = document.getElementById("math-total-fare");
const seatModeContainer = document.getElementById("seat-mode-container");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toast-text");
const helpModal = document.getElementById("help-modal");
const helpModalTrigger = document.getElementById("help-modal-trigger");
const footerHelpTrigger = document.getElementById("footer-help-trigger");
const closeModalBtn = document.getElementById("close-modal-btn");
const modalCloseActionBtn = document.getElementById("modal-close-action-btn");
const notificationsBtn = document.getElementById("notifications-btn");
const notificationsDropdown = document.getElementById("notifications-dropdown");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileDrawer = document.getElementById("mobile-drawer");
const closeDrawerBtn = document.getElementById("close-drawer-btn");
const shareFareBtn = document.getElementById("share-fare-btn");
const helplineBtn = document.getElementById("helpline-btn");

// Toast helper
function showToast(msg) {
  if (!toast) return;
  toastText.textContent = msg;
  toast.hidden = false;
  setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}

// Format Currency
function formatRupees(num) {
  return "₹ " + Math.round(num).toLocaleString("en-IN");
}

// Render Quick Corridor Pills
function renderQuickPresets() {
  if (!quickPresetButtons) return;
  quickPresetButtons.innerHTML = "";
  routePresets.forEach((preset) => {
    const btn = document.createElement("button");
    btn.className = `corridor-pill ${preset.from === currentFrom && preset.to === currentTo ? "active" : ""}`;
    btn.textContent = `${preset.from} ➔ ${preset.to} (${preset.distance} km)`;
    btn.addEventListener("click", () => {
      currentFrom = preset.from;
      currentTo = preset.to;
      currentDistance = preset.distance;
      inputFrom.value = currentFrom;
      inputTo.value = currentTo;
      inputDistance.value = currentDistance;
      calculateAndRender();
      showToast(`Loaded ${preset.from} ➔ ${preset.to}`);
    });
    quickPresetButtons.appendChild(btn);
  });
}

// Render Vehicle Selection Cards
function renderVehicleCards() {
  if (!vehicleCardsContainer) return;
  vehicleCardsContainer.innerHTML = "";
  vehicleOptions.forEach((v) => {
    const isSelected = v.key === currentVehicleKey;
    const card = document.createElement("button");
    card.className = `vehicle-card ${isSelected ? "selected" : ""}`;
    card.innerHTML = `
      <div class="vehicle-card-top">
        <div class="vehicle-icon-box">${v.icon}</div>
        <span class="vehicle-badge">${v.badge}</span>
      </div>
      <div class="vehicle-card-meta">
        <div class="vehicle-title-row">
          <strong>${v.label}</strong>
        </div>
        <p>${v.sublabel}</p>
        <span class="vehicle-desc">${v.detail}</span>
      </div>
      <div class="vehicle-card-footer">
        <span>Base: ₹${v.base}</span>
        <strong>₹${v.perKm}/km</strong>
      </div>
    `;
    card.addEventListener("click", () => {
      currentVehicleKey = v.key;
      calculateAndRender();
      showToast(`Selected ${v.label}`);
    });
    vehicleCardsContainer.appendChild(card);
  });
}

// Calculate and update UI
function calculateAndRender() {
  const v = vehicleOptions.find((opt) => opt.key === currentVehicleKey) || vehicleOptions[0];
  const km = Math.max(1, Number(currentDistance) || 1);
  const base = v.base;
  const distCost = Math.round(km * v.perKm);
  const adj = v.key === "shared-cab" ? 0 : v.key === "mini-bus" ? -4 : v.key === "auto" ? 5 : 15;
  const totalSingle = Math.max(15, base + distCost + adj);

  const seatsMultiplier = v.key === "shared-cab" ? 5 : v.key === "mini-bus" ? 18 : 1;
  const fullCabCost = v.key === "taxi" ? totalSingle : totalSingle * seatsMultiplier;

  const finalFare = (v.key === "taxi" || v.key === "auto")
    ? totalSingle
    : currentPriceMode === "full-cab"
    ? fullCabCost
    : totalSingle;

  // Update elements
  if (fareRouteSummary) fareRouteSummary.textContent = `${currentFrom} ➔ ${currentTo}`;
  if (displayPriceVal) displayPriceVal.textContent = formatRupees(finalFare);
  if (specVehicleName) specVehicleName.textContent = v.label;
  if (specDistanceVal) specDistanceVal.textContent = `${km} KM`;

  if (displayPriceBasis) {
    if (v.key === "taxi") displayPriceBasis.textContent = "(Entire Taxi)";
    else if (v.key === "auto") displayPriceBasis.textContent = "(Entire Auto)";
    else if (currentPriceMode === "full-cab") displayPriceBasis.textContent = `(All ${v.capacity})`;
    else displayPriceBasis.textContent = "(Per Passenger)";
  }

  if (mathBaseFare) mathBaseFare.textContent = formatRupees(base);
  if (mathDistanceLabel) mathDistanceLabel.textContent = `Distance Cost (${km} km × ₹${v.perKm}/km)`;
  if (mathDistanceCost) mathDistanceCost.textContent = formatRupees(distCost);
  if (mathAdjustment) {
    mathAdjustment.textContent = (adj < 0 ? "− " : "+ ") + formatRupees(Math.abs(adj));
  }
  if (mathTotalFare) mathTotalFare.textContent = formatRupees(finalFare);

  // Toggle Seat Mode Visibility
  if (seatModeContainer) {
    if (v.key === "taxi" || v.key === "auto") {
      seatModeContainer.style.display = "none";
    } else {
      seatModeContainer.style.display = "flex";
    }
  }

  // Update Corridor Context details
  const match = routePresets.find(
    (r) =>
      (r.from.toLowerCase() === currentFrom.toLowerCase() && r.to.toLowerCase() === currentTo.toLowerCase()) ||
      (r.from.toLowerCase() === currentTo.toLowerCase() && r.to.toLowerCase() === currentFrom.toLowerCase())
  );

  const contextCard = document.getElementById("corridor-context-card");
  if (contextCard) {
    if (match) {
      contextCard.style.display = "block";
      document.getElementById("context-duration").textContent = match.duration;
      document.getElementById("context-highway").textContent = match.highway;
      document.getElementById("context-terrain").textContent = match.terrain;
      const chips = document.getElementById("context-stops-chips");
      if (chips) {
        chips.innerHTML = match.stops.map((s) => `<span>📍 ${s}</span>`).join("");
      }
    } else {
      contextCard.style.display = "none";
    }
  }

  renderVehicleCards();
  renderQuickPresets();
}

// Render Route Guide
function renderRouteGuide() {
  const container = document.getElementById("guide-cards-container");
  if (!container) return;
  container.innerHTML = "";
  routePresets.forEach((r) => {
    const card = document.createElement("div");
    card.className = "guide-corridor-card";
    card.innerHTML = `
      <div>
        <div class="guide-header">
          <span>${r.from} ➔ ${r.to}</span>
          <span class="guide-duration">${r.duration}</span>
        </div>
        <div class="guide-meta">
          <span><strong>Distance:</strong> ${r.distance} km</span>
          <span><strong>Highway:</strong> ${r.highway}</span>
          <span><strong>Terrain:</strong> ${r.terrain}</span>
        </div>
      </div>
      <button class="calc-route-btn">Calculate This Route ➔</button>
    `;
    card.querySelector(".calc-route-btn").addEventListener("click", () => {
      currentFrom = r.from;
      currentTo = r.to;
      currentDistance = r.distance;
      inputFrom.value = currentFrom;
      inputTo.value = currentTo;
      inputDistance.value = currentDistance;
      switchTab("calculator");
      calculateAndRender();
      showToast(`Loaded ${r.from} ➔ ${r.to}`);
    });
    container.appendChild(card);
  });
}

// Render History
function renderHistory() {
  const container = document.getElementById("history-items-container");
  if (!container) return;
  container.innerHTML = "";
  recentEstimates.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item-row";
    row.innerHTML = `
      <div class="history-left">
        <div class="history-icon-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle></svg>
        </div>
        <div>
          <h4 class="history-title">${item.route}</h4>
          <p class="history-meta">${item.meta}</p>
        </div>
      </div>
      <div class="history-right">
        <span class="history-price">${item.amount}</span>
        <button class="recalc-btn">Recalculate</button>
      </div>
    `;
    row.querySelector(".recalc-btn").addEventListener("click", () => {
      currentFrom = item.from;
      currentTo = item.to;
      currentDistance = item.distance;
      currentVehicleKey = item.vehicleKey;
      inputFrom.value = currentFrom;
      inputTo.value = currentTo;
      inputDistance.value = currentDistance;
      switchTab("calculator");
      calculateAndRender();
      showToast(`Loaded ${item.route}`);
    });
    container.appendChild(row);
  });
}

// Switch Navigation Tabs
function switchTab(tabId) {
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });
  document.querySelectorAll(".drawer-link").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });
  document.querySelectorAll(".tab-view").forEach((view) => {
    view.classList.toggle("active", view.id === `tab-${tabId}`);
    view.hidden = view.id !== `tab-${tabId}`;
  });
}

// Event Listeners
if (inputFrom) {
  inputFrom.addEventListener("input", (e) => {
    currentFrom = e.target.value;
    calculateAndRender();
  });
}

if (inputTo) {
  inputTo.addEventListener("input", (e) => {
    currentTo = e.target.value;
    calculateAndRender();
  });
}

if (inputDistance) {
  inputDistance.addEventListener("input", (e) => {
    currentDistance = Math.max(1, Number(e.target.value) || 1);
    calculateAndRender();
  });
}

if (swapBtn) {
  swapBtn.addEventListener("click", () => {
    const temp = currentFrom;
    currentFrom = currentTo;
    currentTo = temp;
    inputFrom.value = currentFrom;
    inputTo.value = currentTo;
    calculateAndRender();
    showToast(`Swapped: ${currentFrom} ⇄ ${currentTo}`);
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    currentFrom = "Srinagar";
    currentTo = "Gulmarg";
    currentDistance = 51;
    currentVehicleKey = "shared-cab";
    inputFrom.value = currentFrom;
    inputTo.value = currentTo;
    inputDistance.value = currentDistance;
    calculateAndRender();
    showToast("Route reset to Srinagar ➔ Gulmarg");
  });
}

// Seat mode switch pills
document.querySelectorAll(".mode-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".mode-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    currentPriceMode = pill.getAttribute("data-mode");
    calculateAndRender();
  });
});

// Navigation tab click handlers
document.querySelectorAll(".nav-tab, .drawer-link").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.getAttribute("data-tab");
    switchTab(target);
    if (mobileDrawer) mobileDrawer.hidden = true;
  });
});

// Modal triggers
if (helpModalTrigger) helpModalTrigger.addEventListener("click", () => (helpModal.hidden = false));
if (footerHelpTrigger) footerHelpTrigger.addEventListener("click", () => (helpModal.hidden = false));
if (closeModalBtn) closeModalBtn.addEventListener("click", () => (helpModal.hidden = true));
if (modalCloseActionBtn) modalCloseActionBtn.addEventListener("click", () => (helpModal.hidden = true));

// Notifications dropdown toggle
if (notificationsBtn && notificationsDropdown) {
  notificationsBtn.addEventListener("click", () => {
    notificationsDropdown.hidden = !notificationsDropdown.hidden;
  });
}

// Mobile drawer toggle
if (mobileMenuBtn && mobileDrawer) {
  mobileMenuBtn.addEventListener("click", () => (mobileDrawer.hidden = false));
}
if (closeDrawerBtn && mobileDrawer) {
  closeDrawerBtn.addEventListener("click", () => (mobileDrawer.hidden = true));
}
const drawerBackdrop = document.querySelector(".drawer-backdrop");
if (drawerBackdrop && mobileDrawer) {
  drawerBackdrop.addEventListener("click", () => (mobileDrawer.hidden = true));
}

// Share button
if (shareFareBtn) {
  shareFareBtn.addEventListener("click", () => {
    const text = `🚗 Safar Fare Estimate: ${currentFrom} to ${currentTo} (${currentDistance} km) is ${displayPriceVal.textContent}. Official J&K transit rates on Safar.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Estimate copied to clipboard!");
    } else {
      showToast("Ready to share!");
    }
  });
}

if (helplineBtn) {
  helplineBtn.addEventListener("click", () => {
    showToast("J&K Transport Helpline: Dial 1033");
  });
}

// Initialization on load
document.addEventListener("DOMContentLoaded", () => {
  renderQuickPresets();
  renderVehicleCards();
  renderRouteGuide();
  renderHistory();
  calculateAndRender();
});
