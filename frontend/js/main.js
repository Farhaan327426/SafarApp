/**
 * SAFAR — J&K Smart Transit & Legal Fare Guide
 * Interactive Engine & Official 2026 Revised Fare Gazette Calculations
 */

// 1. Vehicle Option Definitions (9 Non-SRTC / Non-E-Bus J&K Categories)
const vehicleOptions = [
  {
    key: "e-rickshaw",
    category: "ev",
    label: "E-Rickshaw (Toto / Cart)",
    sublabel: "Local Colony & Market Cart",
    detail: "Official flat rate: ₹15/km per passenger or local hop",
    calcType: "e-rickshaw",
    base: 15,
    perKm: 15.0,
    capacity: "Up to 4 Persons / Per Seat",
    badge: "Flat ₹15/km",
    isPerSeat: true,
    seatsMultiplier: 4,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="19" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M9 19h6"></path><path d="M12 19V6l4 4"></path></svg>`
  },
  {
    key: "e-auto",
    category: "ev",
    label: "E-Auto (Electric 3-Wheeler)",
    sublabel: "Battery Electric Auto (L5M)",
    detail: "Official rate: ₹25 for 1st km, then ₹20/km thereafter",
    calcType: "e-auto",
    base: 25,
    perKm: 20.0,
    capacity: "Up to 3 Persons",
    badge: "₹25 + ₹20/km",
    isPerSeat: false,
    seatsMultiplier: 1,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
  },
  {
    key: "tata-magic",
    category: "shared",
    label: "Tata Magic / Feeder 4-Wheeler",
    sublabel: "Maruti Eeco / Magic / Winger",
    detail: "Official stage slabs: ₹9 (3km), ₹14 (5km), ₹17 (10km), ₹20 (15km), ₹26 (20km)",
    calcType: "stage-slab",
    base: 9,
    perKm: 1.4,
    capacity: "6 to 8 Seats",
    badge: "Stage Slabs (₹9-₹26)",
    isPerSeat: true,
    seatsMultiplier: 7,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`
  },
  {
    key: "mini-bus",
    category: "bus",
    label: "Mini Bus / Matador (407)",
    sublabel: "Tata 407 / Swaraj Mazda / Matador",
    detail: "5,900+ Fleet Backbone: ₹1.64/km (Kashmir) · ₹1.59-₹1.88/km (Hilly)",
    calcType: "stage-carriage",
    base: 10,
    perKm: 1.64,
    capacity: "Per Passenger (18-24 Seats)",
    badge: "₹1.64/km",
    isPerSeat: true,
    seatsMultiplier: 18,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="15" rx="2"></rect><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle><path d="M3 10h18"></path><path d="M12 4v6"></path></svg>`
  },
  {
    key: "private-bus",
    category: "bus",
    label: "Private 2+2 Bus (Stage Carriage)",
    sublabel: "Standard 32-52 Seater (Non-SRTC)",
    detail: "Official rate: ₹1.12/km (Jammu Plain) · ₹1.40-₹1.64/km (Kashmir)",
    calcType: "stage-carriage-big",
    base: 10,
    perKm: 1.4,
    capacity: "Per Passenger (32+ Seats)",
    badge: "₹1.12 - ₹1.40/km",
    isPerSeat: true,
    seatsMultiplier: 32,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M6 21v-4"></path><path d="M18 21v-4"></path><path d="M2 10h20"></path></svg>`
  },
  {
    key: "shared-cab",
    category: "shared",
    label: "Shared Maxi-Cab",
    sublabel: "Tata Sumo / Bolero / Tavera",
    detail: "Inter-district standard corridor: ₹35 base + ₹5.20/km per seat",
    calcType: "standard",
    base: 35,
    perKm: 5.2,
    capacity: "4 to 7 Seats",
    badge: "Most Popular",
    isPerSeat: true,
    seatsMultiplier: 5,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`
  },
  {
    key: "auto",
    category: "ev",
    label: "Auto-Rickshaw (Petrol/CNG)",
    sublabel: "3-Wheeler Metered Auto",
    detail: "Official rate: ₹45 for first 2 km, then ₹7.40/km",
    calcType: "metered-auto",
    base: 45,
    perKm: 7.4,
    capacity: "Up to 3 Persons",
    badge: "Metered (₹45 first 2km)",
    isPerSeat: false,
    seatsMultiplier: 1,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="9" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
  },
  {
    key: "taxi",
    category: "taxi",
    label: "Standard Sedan Taxi (Contract)",
    sublabel: "Maruti Dzire / Toyota Etios / Indica",
    detail: "Official 18% hiked contract hire: ₹140 base + ₹14.50/km",
    calcType: "standard",
    base: 140,
    perKm: 14.5,
    capacity: "Entire Vehicle (4+1)",
    badge: "Contract Taxi",
    isPerSeat: false,
    seatsMultiplier: 1,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path><circle cx="6.5" cy="16.5" r="2.5"></circle><circle cx="16.5" cy="16.5" r="2.5"></circle></svg>`
  },
  {
    key: "suv-taxi",
    category: "taxi",
    label: "Premium Tourist SUV Taxi",
    sublabel: "Innova Crysta / Scorpio / Fortuner",
    detail: "Official 18% hiked tourist contract hire: ₹220 base + ₹21.00/km",
    calcType: "standard",
    base: 220,
    perKm: 21.0,
    capacity: "Entire Vehicle (6+1 / 7+1)",
    badge: "Tourist SUV",
    isPerSeat: false,
    seatsMultiplier: 1,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"></rect><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg>`
  }
];

// 2. Verified Route Presets (Major 450+ Contract Carriage & 220+ Micro-Urban Network)
const routePresets = [
  {
    from: "Srinagar",
    to: "Gulmarg",
    distance: 51,
    duration: "1h 35m",
    terrain: "Mountain Pass",
    region: "kashmir-hill",
    highway: "NH-1A / Tangmarg Rd",
    stops: ["Tangmarg", "Magam", "Narbal"]
  },
  {
    from: "Srinagar",
    to: "Pahalgam",
    distance: 92,
    duration: "2h 20m",
    terrain: "Scenic Valley Corridor",
    region: "kashmir-plain",
    highway: "KP Road / NH-44",
    stops: ["Pampore", "Awantipora", "Anantnag"]
  },
  {
    from: "Srinagar",
    to: "Sonmarg",
    distance: 80,
    duration: "2h 10m",
    terrain: "High Mountain Highway",
    region: "kashmir-hill",
    highway: "NH-1 (Srinagar-Leh)",
    stops: ["Ganderbal", "Kangan", "Gund"]
  },
  {
    from: "Jammu",
    to: "Katra",
    distance: 49,
    duration: "1h 14m",
    terrain: "Expressway Foothills",
    region: "jammu-hill",
    highway: "NH-44 / Katra Bypass",
    stops: ["Nagrota", "Jhajjar Kotli"]
  },
  {
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
    duration: "1h 20m",
    terrain: "Plains / 4-Lane Highway",
    region: "kashmir-plain",
    highway: "NH-44 Valley Expressway",
    stops: ["Bijbehara", "Awantipora", "Pampore"]
  },
  {
    from: "Baramulla",
    to: "Srinagar",
    distance: 54,
    duration: "1h 25m",
    terrain: "Plains Expressway",
    region: "kashmir-plain",
    highway: "NH-1 Valley Highway",
    stops: ["Sangrama", "Pattan", "Shalteng"]
  },
  {
    from: "Sopore",
    to: "Srinagar",
    distance: 49,
    duration: "1h 16m",
    terrain: "Plains Road",
    region: "kashmir-plain",
    highway: "Sopore-Srinagar Highway",
    stops: ["Sangrama", "Pattan", "Shalteng"]
  },
  {
    from: "Kupwara",
    to: "Srinagar",
    distance: 85,
    duration: "2h 15m",
    terrain: "North Kashmir Highway",
    region: "kashmir-plain",
    highway: "Sopore-Kupwara Highway",
    stops: ["Handwara", "Langate", "Sangrama"]
  },
  {
    from: "Pulwama",
    to: "Srinagar",
    distance: 31,
    duration: "45m",
    terrain: "South Valley Link",
    region: "kashmir-plain",
    highway: "Circular Road / NH-44",
    stops: ["Kakapora", "Pampore", "Pantha Chowk"]
  },
  {
    from: "Shopian",
    to: "Srinagar",
    distance: 52,
    duration: "1h 20m",
    terrain: "Apple Valley Corridor",
    region: "kashmir-plain",
    highway: "Shopian-Pulwama-Srinagar Rd",
    stops: ["Pulwama", "Pampore"]
  },
  {
    from: "Kulgam",
    to: "Srinagar",
    distance: 68,
    duration: "1h 45m",
    terrain: "South Kashmir Plains",
    region: "kashmir-plain",
    highway: "Kulgam-Anantnag NH-44",
    stops: ["Wanpoh", "Bijbehara", "Awantipora"]
  },
  {
    from: "Ganderbal",
    to: "Srinagar",
    distance: 21,
    duration: "35m",
    terrain: "Suburban Corridor",
    region: "kashmir-plain",
    highway: "Ganderbal-Nagbal Rd",
    stops: ["Beehama", "Nagbal", "Soura"]
  },
  {
    from: "Bandipora",
    to: "Srinagar",
    distance: 58,
    duration: "1h 30m",
    terrain: "Wular Lake Highway",
    region: "kashmir-plain",
    highway: "Bandipora-Mansbal-Srinagar Rd",
    stops: ["Mansbal", "Safapora", "Shalteng"]
  },
  {
    from: "Srinagar",
    to: "Doodhpathri",
    distance: 42,
    duration: "1h 15m",
    terrain: "Meadow Mountain Corridor",
    region: "kashmir-hill",
    highway: "Budgam-Khansahib Rd",
    stops: ["Budgam", "Khansahib", "Raikiyar"]
  },
  {
    from: "Srinagar",
    to: "Yusmarg",
    distance: 47,
    duration: "1h 25m",
    terrain: "Pine Ridge Valley",
    region: "kashmir-hill",
    highway: "Chadoora-Charar-e-Sharief Rd",
    stops: ["Chadoora", "Charar-e-Sharief", "Nagbal"]
  },
  {
    from: "Jammu",
    to: "Udhampur",
    distance: 65,
    duration: "1h 30m",
    terrain: "4-Lane Mountain Foothills",
    region: "jammu-hill",
    highway: "NH-44 Jammu-Udhampur",
    stops: ["Nagrota", "Nandni Tunnel", "Tikri"]
  },
  {
    from: "Jammu",
    to: "Patnitop",
    distance: 112,
    duration: "2h 45m",
    terrain: "High Hill Resort Highway",
    region: "jammu-hill",
    highway: "NH-44 / Chenani-Nashri",
    stops: ["Udhampur", "Samroli", "Chenani"]
  },
  {
    from: "Jammu",
    to: "Rajouri",
    distance: 152,
    duration: "4h 10m",
    terrain: "Pir Panjal Foothills",
    region: "jammu-hill",
    highway: "NH-144A Jammu-Poonch",
    stops: ["Akhnoor", "Sunderbani", "Nowshera"]
  },
  {
    from: "Jammu",
    to: "Poonch",
    distance: 236,
    duration: "6h 30m",
    terrain: "Border Mountain Highway",
    region: "jammu-hill",
    highway: "NH-144A Highway",
    stops: ["Rajouri", "Bhimber Gali", "Surankote"]
  },
  {
    from: "Jammu",
    to: "Doda",
    distance: 165,
    duration: "4h 30m",
    terrain: "Chenab Valley Canyon",
    region: "jammu-hill",
    highway: "NH-244 Chenab Corridor",
    stops: ["Batote", "Assar", "Baglihar"]
  },
  {
    from: "Jammu",
    to: "Kathua",
    distance: 84,
    duration: "1h 45m",
    terrain: "Plains Expressway",
    region: "jammu-plain",
    highway: "NH-44 Jammu-Pathankot",
    stops: ["Samba", "Ghagwal", "Hiranagar"]
  },
  {
    from: "Srinagar",
    to: "Jammu",
    distance: 260,
    duration: "6h 00m",
    terrain: "Inter-Province Expressway",
    region: "kashmir-hill",
    highway: "NH-44 / Navyug & Chenani Tunnels",
    stops: ["Qazigund", "Banihal", "Ramban", "Udhampur"]
  },
  // Micro-Urban & Intra-City EV/Auto Circuits (220+ Micro Network)
  {
    from: "Lal Chowk",
    to: "Srinagar Airport",
    distance: 12,
    duration: "25m",
    terrain: "City Airport Link",
    region: "kashmir-plain",
    highway: "Airport Road / Hyderpora Bypass",
    stops: ["Rambagh", "Hyderpora", "Humhama"]
  },
  {
    from: "Lal Chowk",
    to: "Dal Lake (Dalgate)",
    distance: 4,
    duration: "10m",
    terrain: "City Lake Boulevard",
    region: "kashmir-plain",
    highway: "Boulevard Road",
    stops: ["MA Road", "TRC", "Dalgate"]
  },
  {
    from: "Lal Chowk",
    to: "Hazratbal",
    distance: 11,
    duration: "22m",
    terrain: "Old City & Lake Route",
    region: "kashmir-plain",
    highway: "Foreshore Road / Nigeen",
    stops: ["Dalgate", "Rainawari", "Nigeen"]
  },
  {
    from: "Batamaloo",
    to: "Parimpora",
    distance: 6,
    duration: "14m",
    terrain: "Micro-Urban Transit Route",
    region: "kashmir-plain",
    highway: "National Highway Bypass",
    stops: ["Tengpora", "Qamarwari"]
  },
  {
    from: "Jammu Tawi Station",
    to: "Gandhi Nagar (Jammu)",
    distance: 4,
    duration: "10m",
    terrain: "City Commuter Route",
    region: "jammu-plain",
    highway: "University Road",
    stops: ["Bikram Chowk", "Green Belt"]
  },
  {
    from: "Katra Station",
    to: "Banganga (Katra)",
    distance: 4,
    duration: "12m",
    terrain: "Pilgrim Feeder Route",
    region: "jammu-hill",
    highway: "Katra Main Bazaar Rd",
    stops: ["Main Market", "Yatri Parchi Counter"]
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
    meta: "Shared Maxi-Cab · Tangmarg corridor",
    time: "Today, 10:40 AM"
  },
  {
    route: "Jammu ➔ Katra",
    from: "Jammu",
    to: "Katra",
    distance: 49,
    vehicleKey: "taxi",
    amount: "₹ 850",
    meta: "Standard Sedan Taxi · Vaishno Devi route",
    time: "Yesterday, 06:15 PM"
  },
  {
    route: "Anantnag ➔ Srinagar",
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
    vehicleKey: "mini-bus",
    amount: "₹ 87",
    meta: "Mini Bus (Matador) · NH-44 Expressway",
    time: "12 Jun, 09:15 AM"
  }
];

// State variables
let currentFrom = "Srinagar";
let currentTo = "Gulmarg";
let currentDistance = 51;
let currentVehicleKey = "shared-cab";
let currentPriceMode = "per-seat";
let currentCategoryFilter = "all";
let currentTerrainRegion = "kashmir-plain";

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
      if (preset.region) currentTerrainRegion = preset.region;
      if (inputFrom) inputFrom.value = currentFrom;
      if (inputTo) inputTo.value = currentTo;
      if (inputDistance) inputDistance.value = currentDistance;
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
  
  const list = currentCategoryFilter === "all"
    ? vehicleOptions
    : vehicleOptions.filter((v) => v.category === currentCategoryFilter);

  list.forEach((v) => {
    const isSelected = v.key === currentVehicleKey;
    const card = document.createElement("button");
    card.className = `vehicle-card ${isSelected ? "selected" : ""}`;
    
    let footerBaseText = `Base: ₹${v.base}`;
    let footerRateText = `₹${v.perKm}/km`;
    if (v.calcType === "stage-slab") {
      footerBaseText = "₹9 - ₹26 Slabs";
      footerRateText = "50% Concession >20km";
    } else if (v.calcType === "e-rickshaw") {
      footerBaseText = "Flat ₹15/km";
      footerRateText = "Local/Shuttle";
    } else if (v.calcType === "e-auto") {
      footerBaseText = "₹25 (1st km)";
      footerRateText = "₹20/km next";
    }

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
        <span>${footerBaseText}</span>
        <strong>${footerRateText}</strong>
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
  let base = v.base;
  let distCost = 0;
  let adj = 0;
  let totalSingle = 0;
  let formulaDesc = "";

  switch (v.calcType) {
    case "e-rickshaw":
      base = 15;
      distCost = Math.round(km * 15);
      totalSingle = Math.max(15, distCost);
      formulaDesc = `Flat ₹15/km (${km} km × ₹15)`;
      break;

    case "e-auto":
      base = 25;
      distCost = km <= 1 ? 0 : Math.round((km - 1) * 20);
      totalSingle = km <= 1 ? 25 : 25 + distCost;
      formulaDesc = km <= 1 ? "1st KM Base Fare (₹25)" : `₹25 (1st km) + ${(km - 1)} km × ₹20/km`;
      break;

    case "stage-slab":
      if (km <= 3) {
        totalSingle = 9;
        base = 9;
        formulaDesc = "Stage Slab: 0 to 3 KM (₹9)";
      } else if (km <= 5) {
        totalSingle = 14;
        base = 14;
        formulaDesc = "Stage Slab: 3 to 5 KM (₹14)";
      } else if (km <= 10) {
        totalSingle = 17;
        base = 17;
        formulaDesc = "Stage Slab: 5 to 10 KM (₹17)";
      } else if (km <= 15) {
        totalSingle = 20;
        base = 20;
        formulaDesc = "Stage Slab: 10 to 15 KM (₹20)";
      } else if (km <= 20) {
        totalSingle = 26;
        base = 26;
        formulaDesc = "Stage Slab: 15 to 20 KM (₹26)";
      } else {
        base = 26;
        const extraKm = km - 20;
        distCost = Math.round(extraKm * 1.40);
        totalSingle = 26 + distCost;
        formulaDesc = `₹26 (20km slab) + ${extraKm} km @ 50% Concession (₹1.40/km)`;
      }
      break;

    case "stage-carriage":
      {
        const ratePerKm =
          currentTerrainRegion === "kashmir-plain"
            ? 1.64
            : currentTerrainRegion === "kashmir-hill"
            ? 1.88
            : currentTerrainRegion === "jammu-plain"
            ? 1.12
            : 1.59;
        base = 10;
        distCost = Math.round(km * ratePerKm);
        totalSingle = Math.max(10, distCost);
        formulaDesc = `${km} km × ₹${ratePerKm}/km`;
      }
      break;

    case "stage-carriage-big":
      {
        const ratePerKm =
          currentTerrainRegion === "kashmir-plain"
            ? 1.40
            : currentTerrainRegion === "kashmir-hill"
            ? 1.64
            : currentTerrainRegion === "jammu-plain"
            ? 1.12
            : 1.59;
        base = 10;
        distCost = Math.round(km * ratePerKm);
        totalSingle = Math.max(10, distCost);
        formulaDesc = `${km} km × ₹${ratePerKm}/km`;
      }
      break;

    case "metered-auto":
      base = 45;
      distCost = km <= 2 ? 0 : Math.round((km - 2) * 7.4);
      totalSingle = km <= 2 ? 45 : 45 + distCost;
      formulaDesc = km <= 2 ? "First 2 KM Base (₹45)" : `₹45 (1st 2km) + ${(km - 2)} km × ₹7.4/km`;
      break;

    default:
      base = v.base;
      distCost = Math.round(km * v.perKm);
      adj = v.key === "suv-taxi" ? 20 : 0;
      totalSingle = Math.max(15, base + distCost + adj);
      formulaDesc = `Base ₹${base} + (${km} km × ₹${v.perKm}/km)`;
      break;
  }

  const fullCabCost = v.isPerSeat ? totalSingle * v.seatsMultiplier : totalSingle;
  const finalFare = !v.isPerSeat
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
    if (!v.isPerSeat) {
      displayPriceBasis.textContent = `(Entire ${v.label})`;
    } else if (currentPriceMode === "full-cab") {
      displayPriceBasis.textContent = `(Entire Vehicle - ${v.seatsMultiplier} Seats)`;
    } else {
      displayPriceBasis.textContent = "(Per Passenger Seat)";
    }
  }

  if (mathBaseFare) mathBaseFare.textContent = formatRupees(base);
  if (mathDistanceLabel) mathDistanceLabel.textContent = formulaDesc;
  if (mathDistanceCost) mathDistanceCost.textContent = formatRupees(distCost);
  if (mathAdjustment) {
    mathAdjustment.textContent = adj !== 0 ? `+ ${formatRupees(adj)}` : "± ₹ 0";
  }
  if (mathTotalFare) mathTotalFare.textContent = formatRupees(finalFare);

  // Toggle Seat Mode Visibility
  if (seatModeContainer) {
    if (!v.isPerSeat) {
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
      const dur = document.getElementById("context-duration");
      const hwy = document.getElementById("context-highway");
      const trn = document.getElementById("context-terrain");
      const chips = document.getElementById("context-stops-chips");
      if (dur) dur.textContent = match.duration;
      if (hwy) hwy.textContent = match.highway;
      if (trn) trn.textContent = match.terrain;
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
      if (r.region) currentTerrainRegion = r.region;
      if (inputFrom) inputFrom.value = currentFrom;
      if (inputTo) inputTo.value = currentTo;
      if (inputDistance) inputDistance.value = currentDistance;
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
      if (inputFrom) inputFrom.value = currentFrom;
      if (inputTo) inputTo.value = currentTo;
      if (inputDistance) inputDistance.value = currentDistance;
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

// Attach Event Listeners
function attachListeners() {
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
      if (inputFrom) inputFrom.value = currentFrom;
      if (inputTo) inputTo.value = currentTo;
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
      currentTerrainRegion = "kashmir-plain";
      if (inputFrom) inputFrom.value = currentFrom;
      if (inputTo) inputTo.value = currentTo;
      if (inputDistance) inputDistance.value = currentDistance;
      calculateAndRender();
      showToast("Route reset to Srinagar ➔ Gulmarg");
    });
  }

  // Category filter pills
  document.querySelectorAll(".cat-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategoryFilter = btn.getAttribute("data-cat");
      renderVehicleCards();
    });
  });

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
  const hideModal = () => {
    if (helpModal) helpModal.hidden = true;
  };
  const showModal = () => {
    if (helpModal) helpModal.hidden = false;
  };

  if (helpModalTrigger) helpModalTrigger.addEventListener("click", showModal);
  if (footerHelpTrigger) footerHelpTrigger.addEventListener("click", showModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", hideModal);
  if (modalCloseActionBtn) modalCloseActionBtn.addEventListener("click", hideModal);
  if (helpModal) {
    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) hideModal();
    });
  }

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
}

// Initialization function
function initSafar() {
  attachListeners();
  renderQuickPresets();
  renderVehicleCards();
  renderRouteGuide();
  renderHistory();
  calculateAndRender();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSafar);
} else {
  initSafar();
}
