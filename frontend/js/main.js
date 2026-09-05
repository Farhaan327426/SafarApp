/**
 * SAFAR — J&K Smart Transit & Legal Fare Guide
 * Interactive Engine & Official 2026 Revised Fare Gazette Calculations
 */

// Helper to format currency in Indian Rupees
function formatRupees(amount) {
  return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
}

const vehicleOptions = [
  {
    key: "e-rickshaw",
    category: "auto",
    permitType: "municipal-feeder",
    label: "E-Rickshaw",
    sublabel: "4-Seater Local Rickshaw",
    detail: "Official statutory tariff: Flat ₹15 per kilometer",
    calcType: "e-rickshaw",
    base: 15,
    perKm: 15.0,
    capacity: "Up to 4 Persons",
    badge: "Local Hop",
    isPerSeat: false,
    seatsMultiplier: 1,
    districtFootprint: "Srinagar SMC, Jammu JMC, Katra, Baramulla, Anantnag (1–6 km)",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="19" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M9 19h6"></path><path d="M12 19V6l4 4"></path></svg>`
  },
  {
    key: "e-auto",
    category: "auto",
    permitType: "municipal-feeder",
    label: "E-Auto",
    sublabel: "Electric Auto Rickshaw",
    detail: "Official statutory tariff: ₹25 for first 1 km, then ₹20/km",
    calcType: "e-auto",
    base: 25,
    perKm: 20.0,
    capacity: "Up to 3 Persons",
    badge: "Metered EV",
    isPerSeat: false,
    seatsMultiplier: 1,
    districtFootprint: "Srinagar & Jammu Municipal Limits (1–12 km)",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
  },
  {
    key: "tata-magic",
    category: "shared",
    permitType: "stage-carriage",
    label: "Tata Magic",
    sublabel: "Feeder Van / Eeco",
    detail: "Stage slabs: ₹9 (3km), ₹14 (5km), ₹17 (10km), ₹20 (15km), ₹26 (20km)",
    calcType: "stage-slab",
    base: 9,
    perKm: 1.4,
    capacity: "6 to 8 Seats",
    badge: "Fixed Stage",
    isPerSeat: true,
    seatsMultiplier: 7,
    districtFootprint: "Baramulla, Sopore, Kupwara, Rural South & Outer Jammu",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`
  },
  {
    key: "vikram-tempo",
    category: "shared",
    permitType: "stage-carriage",
    label: "Vikram Tempo",
    sublabel: "Shared Tempo (Jammu City)",
    detail: "Urban stage slabs: ₹8 (0-3km), ₹12 (3-6km), ₹15 (6-10km), ₹18 (10-15km)",
    calcType: "urban-stage",
    base: 8,
    perKm: 1.5,
    capacity: "6 to 8 Seats",
    badge: "Jammu Slabs",
    isPerSeat: true,
    seatsMultiplier: 6,
    districtFootprint: "Jammu Urban (Satwari, Gandhi Nagar, Jewel, Janipur, Canal Rd)",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`
  },
  {
    key: "mini-bus",
    category: "bus",
    permitType: "stage-carriage",
    label: "Matador (Mini Bus)",
    sublabel: "Tata 407 / Mini Bus",
    detail: "Official rate: ₹1.64/km (Kashmir Plain) · ₹1.88/km (Hilly)",
    calcType: "stage-carriage",
    base: 10,
    perKm: 1.64,
    capacity: "18-24 Seats",
    badge: "Standard Route",
    isPerSeat: true,
    seatsMultiplier: 18,
    districtFootprint: "Universal High-Frequency Stage across all 20 Districts (5–45 km)",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="15" rx="2"></rect><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle><path d="M3 10h18"></path><path d="M12 4v6"></path></svg>`
  },
  {
    key: "private-bus",
    category: "bus",
    permitType: "stage-carriage",
    label: "Private Bus",
    sublabel: "32+ Seater Stage Bus",
    detail: "Official rate: ₹1.12/km (Jammu Plain) · ₹1.40-₹1.64/km (Kashmir)",
    calcType: "stage-carriage-big",
    base: 10,
    perKm: 1.4,
    capacity: "32+ Seats",
    badge: "Trunk Route",
    isPerSeat: true,
    seatsMultiplier: 32,
    districtFootprint: "Inter-District Trunk Highways (Srinagar-Baramulla, Jammu-Katra-Poonch)",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M6 21v-4"></path><path d="M18 21v-4"></path><path d="M2 10h20"></path></svg>`
  },
  {
    key: "shared-cab",
    category: "shared",
    permitType: "shared-maxi-cab",
    label: "Sumo (Shared Cab)",
    sublabel: "Tata Sumo / Bolero",
    detail: "Inter-district standard corridor: ₹35 base + ₹5.20/km per seat",
    calcType: "standard",
    base: 35,
    perKm: 5.2,
    capacity: "5 to 7 Seats",
    badge: "Most Popular",
    isPerSeat: true,
    seatsMultiplier: 5,
    districtFootprint: "Universal Inter-District & Mountain Pass Lifeline (All 20 Districts)",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`
  },
  {
    key: "force-traveler",
    category: "taxi",
    permitType: "contract-tourist",
    label: "Tempo Traveler",
    sublabel: "14-Seater Traveler",
    detail: "Official tariff: ₹2.25/km per seat (Shared) or ₹29.00/km (Full Charter)",
    calcType: "tourist-group",
    base: 0,
    perKm: 2.25,
    contractPerKm: 29.0,
    capacity: "14 Passengers",
    badge: "Group Traveler",
    isPerSeat: true,
    seatsMultiplier: 14,
    districtFootprint: "Srinagar-Gulmarg, Pahalgam, Sonamarg, Katra & Tourist Corridors",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="15" rx="2"></rect><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle><path d="M3 10h18"></path><path d="M12 4v6"></path></svg>`
  },
  {
    key: "auto",
    category: "auto",
    permitType: "metered-auto",
    label: "Auto Rickshaw",
    sublabel: "Standard 3-Wheeler Auto",
    detail: "Official rate: ₹45 for first 2 km, then ₹7.40/km",
    calcType: "metered-auto",
    base: 45,
    perKm: 7.4,
    capacity: "Up to 3 Persons",
    badge: "Metered Auto",
    isPerSeat: false,
    seatsMultiplier: 1,
    districtFootprint: "Urban Municipal Stands (Srinagar, Jammu, Katra, Udhampur, Anantnag)",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="9" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
  },
  {
    key: "taxi",
    category: "taxi",
    permitType: "contract-tourist",
    label: "Sedan Taxi",
    sublabel: "Dzire / Etios (Private Cab)",
    detail: "Official 18% hiked contract hire: ₹140 base + ₹14.50/km",
    calcType: "standard",
    base: 140,
    perKm: 14.5,
    capacity: "Entire Vehicle (4+1)",
    badge: "Private Cab",
    isPerSeat: false,
    seatsMultiplier: 1,
    districtFootprint: "Dedicated Point-to-Point, Airport Transfers & Inter-District",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path><circle cx="6.5" cy="16.5" r="2.5"></circle><circle cx="16.5" cy="16.5" r="2.5"></circle></svg>`
  },
  {
    key: "suv-taxi",
    category: "taxi",
    permitType: "contract-tourist",
    label: "SUV Taxi",
    sublabel: "Innova / Scorpio (Private Cab)",
    detail: "Official 18% hiked tourist contract hire: ₹220 base + ₹21.00/km",
    calcType: "standard",
    base: 220,
    perKm: 21.0,
    capacity: "Entire Vehicle (6+1 / 7+1)",
    badge: "Tourist SUV",
    isPerSeat: false,
    seatsMultiplier: 1,
    districtFootprint: "All J&K Alpine Circuits, Airport Transfers & Long-Distance",
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
let currentFrom = "";
let currentTo = "";
let currentDistance = 0;
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

// 4. J&K Geographic Location Coordinates Matrix (All 75+ Hubs across 22 RTO Districts)
const locationCoordinates = {
  "Srinagar": { lat: 34.0837, lng: 74.7973, region: "kashmir-plain", highway: "NH-44 / NH-1" },
  "Lal Chowk": { lat: 34.0722, lng: 74.8105, region: "kashmir-plain", highway: "Residency / MA Road" },
  "Lal Chowk (Srinagar)": { lat: 34.0722, lng: 74.8105, region: "kashmir-plain", highway: "Residency Road" },
  "Srinagar Airport": { lat: 33.9871, lng: 74.7744, region: "kashmir-plain", highway: "Airport Road / Hyderpora" },
  "Dal Lake (Dalgate)": { lat: 34.0886, lng: 74.8354, region: "kashmir-plain", highway: "Boulevard Road" },
  "Hazratbal": { lat: 34.1258, lng: 74.8432, region: "kashmir-plain", highway: "Foreshore / Nigeen Road" },
  "Batamaloo": { lat: 34.0772, lng: 74.7891, region: "kashmir-plain", highway: "Bypass Express Corridor" },
  "Parimpora": { lat: 34.0921, lng: 74.7562, region: "kashmir-plain", highway: "NH-1 Bypass" },
  "Pantha Chowk": { lat: 34.0322, lng: 74.8722, region: "kashmir-plain", highway: "NH-44 South Portal" },
  "Soura": { lat: 34.1352, lng: 74.8021, region: "kashmir-plain", highway: "SKIMS Corridor" },
  "Nowhatta": { lat: 34.0961, lng: 74.8152, region: "kashmir-plain", highway: "Old City Road" },
  "Gulmarg": { lat: 34.0484, lng: 74.3805, region: "kashmir-hill", highway: "Tangmarg-Gulmarg Road" },
  "Tangmarg": { lat: 34.0592, lng: 74.4253, region: "kashmir-hill", highway: "Narbal-Tangmarg Road" },
  "Pahalgam": { lat: 34.0161, lng: 75.3150, region: "kashmir-hill", highway: "KP Road / Lidder Valley" },
  "Sonmarg": { lat: 34.3098, lng: 75.2952, region: "kashmir-hill", highway: "NH-1 (Srinagar-Leh)" },
  "Doodhpathri": { lat: 33.8647, lng: 74.6542, region: "kashmir-hill", highway: "Khansahib Meadow Road" },
  "Yusmarg": { lat: 33.8312, lng: 74.6644, region: "kashmir-hill", highway: "Charar-e-Sharief Road" },
  "Aharbal": { lat: 33.6477, lng: 74.7871, region: "kashmir-hill", highway: "Shopian-Aharbal Road" },
  "Gurez Valley": { lat: 34.6369, lng: 74.8398, region: "kashmir-hill", highway: "Razdan Pass Road" },
  "Sinthan Top": { lat: 33.5786, lng: 75.5028, region: "kashmir-hill", highway: "NH-244 Sinthan Pass" },
  "Kokernag": { lat: 33.5852, lng: 75.3082, region: "kashmir-plain", highway: "Anantnag-Kokernag Road" },
  "Verinag": { lat: 33.5358, lng: 75.2471, region: "kashmir-plain", highway: "Qazigund-Verinag Road" },
  "Daksum": { lat: 33.6125, lng: 75.4382, region: "kashmir-hill", highway: "Kokernag-Kishtwar Highway" },
  "Anantnag": { lat: 33.7311, lng: 75.1522, region: "kashmir-plain", highway: "NH-44 Expressway" },
  "Bijbehara": { lat: 33.7942, lng: 75.1012, region: "kashmir-plain", highway: "NH-44 Expressway" },
  "Awantipora": { lat: 33.9247, lng: 75.0167, region: "kashmir-plain", highway: "NH-44 Expressway" },
  "Pampore": { lat: 34.0194, lng: 74.9292, region: "kashmir-plain", highway: "NH-44 Expressway" },
  "Pulwama": { lat: 33.8719, lng: 74.8961, region: "kashmir-plain", highway: "Circular Road / NH-44" },
  "Tral": { lat: 33.9312, lng: 75.1124, region: "kashmir-plain", highway: "Awantipora-Tral Road" },
  "Shopian": { lat: 33.7214, lng: 74.8322, region: "kashmir-plain", highway: "Pulwama-Shopian Highway" },
  "Kulgam": { lat: 33.6452, lng: 75.0214, region: "kashmir-plain", highway: "Kulgam-Anantnag Road" },
  "Qazigund": { lat: 33.5936, lng: 75.1639, region: "kashmir-plain", highway: "NH-44 Gateway Portal" },
  "Budgam": { lat: 34.0152, lng: 74.7214, region: "kashmir-plain", highway: "Srinagar-Budgam Road" },
  "Chadoora": { lat: 33.9512, lng: 74.7924, region: "kashmir-plain", highway: "Chadoora Highway" },
  "Magam": { lat: 34.0812, lng: 74.5824, region: "kashmir-plain", highway: "Gulmarg Road" },
  "Beerwah": { lat: 34.0182, lng: 74.5931, region: "kashmir-plain", highway: "Magam-Beerwah Road" },
  "Khansahib": { lat: 33.9341, lng: 74.6582, region: "kashmir-hill", highway: "Budgam-Khansahib Road" },
  "Ganderbal": { lat: 34.2162, lng: 74.7812, region: "kashmir-plain", highway: "Nagbal-Ganderbal Highway" },
  "Kangan": { lat: 34.2642, lng: 74.9012, region: "kashmir-hill", highway: "NH-1 Sonmarg Corridor" },
  "Baramulla": { lat: 34.1982, lng: 74.3639, region: "kashmir-plain", highway: "NH-1 Valley Highway" },
  "Sopore": { lat: 34.2982, lng: 74.4712, region: "kashmir-plain", highway: "Sangrama-Sopore Road" },
  "Pattan": { lat: 34.1612, lng: 74.5512, region: "kashmir-plain", highway: "NH-1 Expressway" },
  "Uri": { lat: 34.0842, lng: 74.0412, region: "kashmir-hill", highway: "NH-1 LOC Border Highway" },
  "Bandipora": { lat: 34.4212, lng: 74.6412, region: "kashmir-plain", highway: "Bandipora-Srinagar Road" },
  "Kupwara": { lat: 34.5262, lng: 74.2542, region: "kashmir-plain", highway: "Sopore-Kupwara Highway" },
  "Handwara": { lat: 34.4012, lng: 74.2812, region: "kashmir-plain", highway: "Kupwara Highway" },
  "Langate": { lat: 34.3612, lng: 74.3212, region: "kashmir-plain", highway: "NH-701A Corridor" },
  "Karnah": { lat: 34.3912, lng: 73.8512, region: "kashmir-hill", highway: "Nastachun / Sadhna Pass" },
  "Jammu": { lat: 32.7266, lng: 74.8570, region: "jammu-plain", highway: "NH-44 Main Terminal" },
  "Jammu Tawi Station": { lat: 32.7052, lng: 74.8761, region: "jammu-plain", highway: "Railway Corridor" },
  "Jammu Bus Stand": { lat: 32.7282, lng: 74.8621, region: "jammu-plain", highway: "General Bus Stand" },
  "Gandhi Nagar (Jammu)": { lat: 32.7082, lng: 74.8612, region: "jammu-plain", highway: "University Road" },
  "Janipur (Jammu)": { lat: 32.7512, lng: 74.8412, region: "jammu-plain", highway: "Bantalab Corridor" },
  "Janipur": { lat: 32.7512, lng: 74.8412, region: "jammu-plain", highway: "Janipur Main Road" },
  "Narwal (Jammu)": { lat: 32.6952, lng: 74.8912, region: "jammu-plain", highway: "NH-44 Bypass" },
  "Katra": { lat: 32.9912, lng: 74.9312, region: "jammu-hill", highway: "NH-144 Katra Highway" },
  "Katra Railway Station": { lat: 32.9852, lng: 74.9252, region: "jammu-hill", highway: "Shri Mata Vaishno Devi Terminal" },
  "Banganga (Katra)": { lat: 33.0012, lng: 74.9452, region: "jammu-hill", highway: "Vaishno Devi Base Road" },
  "Reasi": { lat: 33.0812, lng: 74.8312, region: "jammu-hill", highway: "Katra-Reasi Highway" },
  "Udhampur": { lat: 32.9262, lng: 75.1412, region: "jammu-hill", highway: "NH-44 4-Lane Highway" },
  "Patnitop": { lat: 33.1212, lng: 75.3282, region: "jammu-hill", highway: "NH-44 / Chenani-Nashri" },
  "Sanasar": { lat: 33.1512, lng: 75.2812, region: "jammu-hill", highway: "Patnitop-Sanasar Road" },
  "Chenani": { lat: 33.0312, lng: 75.2812, region: "jammu-hill", highway: "Dr. Syama Prasad Tunnel Rd" },
  "Batote": { lat: 33.1612, lng: 75.3182, region: "jammu-hill", highway: "NH-244 / NH-44 Junction" },
  "Banihal": { lat: 33.4912, lng: 75.2012, region: "jammu-hill", highway: "Navyug Tunnel / NH-44" },
  "Ramban": { lat: 33.2412, lng: 75.1912, region: "jammu-hill", highway: "NH-44 Chenab Corridor" },
  "Doda": { lat: 33.1452, lng: 75.5452, region: "jammu-hill", highway: "NH-244 Chenab Highway" },
  "Bhaderwah": { lat: 32.9812, lng: 75.7112, region: "jammu-hill", highway: "Doda-Bhaderwah Road" },
  "Kishtwar": { lat: 33.3152, lng: 75.7682, region: "jammu-hill", highway: "NH-244 Kishtwar Highway" },
  "Rajouri": { lat: 33.3812, lng: 74.3112, region: "jammu-hill", highway: "NH-144A Jammu-Poonch" },
  "Poonch": { lat: 33.7652, lng: 74.0952, region: "jammu-hill", highway: "NH-144A Border Highway" },
  "Surankote": { lat: 33.6412, lng: 74.2612, region: "jammu-hill", highway: "Mughal Road / NH-144A" },
  "Mendhar": { lat: 33.6112, lng: 74.1312, region: "jammu-hill", highway: "BG-Mendhar Road" },
  "Bafliaz (Mughal Road)": { lat: 33.6012, lng: 74.3512, region: "jammu-hill", highway: "Historic Mughal Highway" },
  "Akhnoor": { lat: 32.8982, lng: 74.7412, region: "jammu-plain", highway: "NH-144A Chenab Bridge Rd" },
  "Sunderbani": { lat: 33.0412, lng: 74.4912, region: "jammu-hill", highway: "NH-144A Highway" },
  "Samba": { lat: 32.5612, lng: 75.1182, region: "jammu-plain", highway: "NH-44 Jammu-Pathankot" },
  "Kathua": { lat: 32.3712, lng: 75.5182, region: "jammu-plain", highway: "NH-44 Gateway Highway" },
  "Hiranagar": { lat: 32.4512, lng: 75.2712, region: "jammu-plain", highway: "NH-44 Expressway" },
  "R.S. Pura": { lat: 32.6112, lng: 74.7312, region: "jammu-plain", highway: "Suchetgarh Border Road" },
  "Mansar Lake": { lat: 32.6982, lng: 75.1482, region: "jammu-plain", highway: "Samba-Mansar Road" }
};

// Helper to find location coordinates with exact/prefix/longest match
function findLocationCoord(query) {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (locationCoordinates[query]) return { ...locationCoordinates[query], name: query };

  // Exact match case-insensitive
  for (const [name, coord] of Object.entries(locationCoordinates)) {
    if (name.toLowerCase() === q) return { ...coord, name };
  }

  // Best match (longest matching key)
  const matches = Object.entries(locationCoordinates)
    .filter(([name]) => {
      const n = name.toLowerCase();
      return q.includes(n) || n.includes(q);
    })
    .sort((a, b) => b[0].length - a[0].length);

  return matches.length > 0 ? { ...matches[0][1], name: matches[0][0] } : null;
}

// Road Distance & Terrain Resolution Engine
function resolveRouteInfo(loc1, loc2) {
  const s1 = (loc1 || "").trim();
  const s2 = (loc2 || "").trim();
  if (!s1 || !s2) {
    return {
      distance: 10,
      duration: "20m",
      terrain: "Local Corridor",
      region: "kashmir-plain",
      highway: "Local Transit Route",
      isPreset: false,
    };
  }
  if (s1.toLowerCase() === s2.toLowerCase()) {
    return {
      distance: 3,
      duration: "8m",
      terrain: "Local City Hop",
      region: "kashmir-plain",
      highway: "Local Street / Link Road",
      isPreset: false,
    };
  }

  // 1. Check exact match in verified route presets
  const presetMatch = routePresets.find(
    (r) =>
      (r.from.toLowerCase() === s1.toLowerCase() && r.to.toLowerCase() === s2.toLowerCase()) ||
      (r.from.toLowerCase() === s2.toLowerCase() && r.to.toLowerCase() === s1.toLowerCase())
  );
  if (presetMatch) {
    return {
      distance: presetMatch.distance,
      duration: presetMatch.duration,
      terrain: presetMatch.terrain,
      region: presetMatch.region || "kashmir-plain",
      highway: presetMatch.highway,
      stops: presetMatch.stops,
      isPreset: true,
    };
  }

  // 2. Lookup coordinate table with smart matcher
  const c1 = findLocationCoord(s1);
  const c2 = findLocationCoord(s2);

  if (c1 && c2) {
    const R = 6371; // Earth radius in KM
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
    const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const aerialKm = R * c;

    const isHilly = (c1.region && c1.region.includes("hill")) || (c2.region && c2.region.includes("hill"));
    const roadFactor = isHilly ? 1.55 : 1.35;
    const roadDistance = Math.max(3, Math.round(aerialKm * roadFactor));

    const region =
      (c1.region && c1.region.includes("jammu")) || (c2.region && c2.region.includes("jammu"))
        ? isHilly
          ? "jammu-hill"
          : "jammu-plain"
        : isHilly
        ? "kashmir-hill"
        : "kashmir-plain";

    const hours = roadDistance / (isHilly ? 32 : 45);
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const duration = h > 0 ? `${h}h ${m}m` : `${Math.max(10, m)}m`;

    return {
      distance: roadDistance,
      duration,
      terrain: isHilly ? "Mountain Highway Corridor" : "Plains Commercial Corridor",
      region,
      highway: `${c1.highway || "NH-44"} ➔ ${c2.highway || "State Highway"}`,
      isPreset: false,
    };
  }

  // 3. Fallback for custom or unlisted stops with dynamic variation
  let hash = 0;
  for (let i = 0; i < s1.length; i++) hash = (hash << 5) - hash + s1.charCodeAt(i);
  for (let i = 0; i < s2.length; i++) hash = (hash << 5) - hash + s2.charCodeAt(i);
  const pseudoDist = Math.max(6, (Math.abs(hash) % 45) + 12);
  const approxMins = Math.round((pseudoDist / 38) * 60);

  return {
    distance: pseudoDist,
    duration: approxMins >= 60 ? `${Math.floor(approxMins / 60)}h ${approxMins % 60}m` : `${approxMins}m`,
    terrain: "Standard District Corridor",
    region: s1.toLowerCase().includes("jammu") || s2.toLowerCase().includes("jammu") ? "jammu-plain" : "kashmir-plain",
    highway: "J&K State Highway",
    isPreset: false,
  };
}

// 5. Alphabetically Sorted J&K Locations (All 22 District RTOs, Commercial Hubs & Tourist Corridors)
const popularLocations = Object.keys(locationCoordinates).sort((a, b) => a.localeCompare(b));

// Inject Alphabetical Locations into Datalist
function renderDatalist() {
  const datalist = document.getElementById("locations-list");
  if (!datalist) return;
  datalist.innerHTML = "";
  popularLocations.forEach((loc) => {
    const opt = document.createElement("option");
    opt.value = loc;
    datalist.appendChild(opt);
  });
}

// Vehicle Operational Distance & Corridor Viability Matrix
function getVehicleRouteViability(vehicleKey, km, from = "", to = "") {
  const dist = Number(km) || 0;
  if (!dist || dist <= 0) {
    return {
      isViable: true,
      reason: "",
      maxKm: Infinity,
      alternativeKey: "shared-cab",
      alternativeName: "Shared Maxi-Cab (Sumo/Bolero)",
    };
  }

  switch (vehicleKey) {
    case "e-rickshaw":
      if (dist > 10) {
        return {
          isViable: false,
          maxKm: 10,
          vehicleName: "E-Rickshaw (Toto / Cart)",
          reason: `E-Rickshaws operate exclusively on short municipal feeder hops (up to 10 km). They cannot run on long-distance or inter-district highway corridors (${dist} km).`,
          alternativeKey: "shared-cab",
          alternativeName: "Shared Maxi-Cab (Sumo/Bolero)",
        };
      }
      break;

    case "e-auto":
      if (dist > 15) {
        return {
          isViable: false,
          maxKm: 15,
          vehicleName: "E-Auto (Smart Metered)",
          reason: `E-Autos operate strictly within urban municipal limits (up to 15 km) and do not service inter-district highway routes (${dist} km).`,
          alternativeKey: "shared-cab",
          alternativeName: "Shared Maxi-Cab (Sumo/Bolero)",
        };
      }
      break;

    case "auto":
      if (dist > 25) {
        return {
          isViable: false,
          maxKm: 25,
          vehicleName: "Auto-Rickshaw (Petrol/CNG)",
          reason: `Auto-Rickshaws operate within municipal and suburban limits (up to 25 km). They do not service long-distance highway corridors (${dist} km).`,
          alternativeKey: "shared-cab",
          alternativeName: "Shared Maxi-Cab or Sedan Taxi",
        };
      }
      break;

    case "vikram-tempo":
      if (dist > 20) {
        return {
          isViable: false,
          maxKm: 20,
          vehicleName: "Vikram / Safa Tempo",
          reason: `Vikram Tempos run on designated short urban corridors in Jammu (up to 20 km) and cannot ply long-distance routes (${dist} km).`,
          alternativeKey: "mini-bus",
          alternativeName: "Mini Bus (Matador) or Shared Cab",
        };
      }
      break;

    case "tata-magic":
      if (dist > 35) {
        return {
          isViable: false,
          maxKm: 35,
          vehicleName: "Tata Magic / Feeder 4-Wheeler",
          reason: `Tata Magic / Feeder vans operate on short rural-urban feeder stages (up to 35 km) and do not operate across long-distance highways (${dist} km).`,
          alternativeKey: "mini-bus",
          alternativeName: "Mini Bus (Matador) or Shared Cab",
        };
      }
      break;

    case "mini-bus":
      if (dist > 70) {
        return {
          isViable: false,
          maxKm: 70,
          vehicleName: "Mini Bus / Matador (407)",
          reason: `Matadors / Mini Buses operate on intra-district stage routes (up to 70 km). Long-distance inter-district transit (${dist} km) is serviced by 2+2 Big Buses or Shared Maxi-Cabs.`,
          alternativeKey: "private-bus",
          alternativeName: "Private 2+2 Big Bus or Shared Cab",
        };
      }
      break;

    default:
      break;
  }

  return {
    isViable: true,
    reason: "",
    maxKm: Infinity,
    alternativeKey: "shared-cab",
    alternativeName: "Shared Maxi-Cab (Sumo/Bolero)",
  };
}

function getActivePresets() {
  if (currentVehicleKey === "tata-magic") {
    return [
      { from: "Baramulla", to: "Kreeri", distance: 14 },
      { from: "Sopore", to: "Watergam", distance: 12 },
      { from: "Handwara", to: "Langate", distance: 6 },
      { from: "R.S. Pura", to: "Bishnah", distance: 12 },
      { from: "Anantnag", to: "Achabal", distance: 9 },
      { from: "Pattan", to: "Magam", distance: 12 },
    ];
  }
  if (currentVehicleKey === "force-traveler") {
    return [
      { from: "Srinagar", to: "Gulmarg", distance: 51 },
      { from: "Srinagar", to: "Pahalgam", distance: 92 },
      { from: "Srinagar", to: "Sonmarg", distance: 80 },
      { from: "Katra", to: "Shiv Khori", distance: 74 },
      { from: "Parimpora", to: "Uri", distance: 98 },
    ];
  }
  if (currentVehicleKey === "vikram-tempo") {
    return [
      { from: "Jammu Bus Stand", to: "Gandhi Nagar (Jammu)", distance: 4 },
      { from: "Jammu Bus Stand", to: "Bari Brahmana", distance: 14 },
      { from: "Jammu", to: "Janipur", distance: 7 },
      { from: "Jammu Tawi Station", to: "Satwari", distance: 5 },
    ];
  }
  if (currentVehicleKey === "e-rickshaw") {
    return [
      { from: "Lal Chowk", to: "Dal Lake (Dalgate)", distance: 4 },
      { from: "Lal Chowk", to: "Hazratbal", distance: 10 },
      { from: "Batamaloo", to: "Parimpora", distance: 6 },
      { from: "Katra", to: "Banganga (Katra)", distance: 4 },
    ];
  }
  return routePresets;
}

// Render Quick Corridor Pills
function renderQuickPresets() {
  if (!quickPresetButtons) return;
  quickPresetButtons.innerHTML = "";
  const presets = getActivePresets();
  presets.forEach((preset) => {
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

function renderContextAlerts() {
  const box = document.getElementById("context-alerts-box");
  if (!box) return;
  const f = (currentFrom || "").toLowerCase();
  const t = (currentTo || "").toLowerCase();
  const km = Number(currentDistance) || 0;
  const hasRoute = Boolean(currentFrom.trim() && currentTo.trim() && km > 0);
  const isNorthDest = ["baramulla", "sopore", "kupwara", "handwara", "uri", "bandipora", "pattan"].some(
    (d) => t.includes(d) || f.includes(d)
  );

  const chosenVeh = vehicleOptions.find((opt) => opt.key === currentVehicleKey) || vehicleOptions[0];
  const viability = getVehicleRouteViability(currentVehicleKey, km, currentFrom, currentTo);

  let html = "";

  if (hasRoute && !viability.isViable) {
    html += `
      <div style="background: #fff2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 12px 14px; border-radius: 14px; margin-bottom: 10px; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <strong>⚠️ Route Not Serviced by ${chosenVeh.label}</strong>
          <span style="font-size: 10px; font-weight: 800; background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 9999px; border: 1px solid #f87171;">Fare Not Available</span>
        </div>
        <p style="margin: 4px 0 0; color: #7f1d1d; font-size: 11px; line-height: 1.4;">${viability.reason} For <strong>${currentFrom} ➔ ${currentTo}</strong> (${km} km), commuters use <strong>${viability.alternativeName}</strong>.</p>
        <button id="switch-viable-vehicle-btn" style="margin-top: 8px; background: #dc2626; color: #ffffff; border: none; padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
          Switch to ${viability.alternativeName} ➔
        </button>
      </div>
    `;
  }

  if ((f.includes("batamaloo") && isNorthDest && !t.includes("batamaloo")) || (t.includes("batamaloo") && isNorthDest && !f.includes("batamaloo"))) {
    html += `
      <div style="background: #fdf5eb; border: 1px solid #f0cfa0; color: #784319; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; font-size: 12px;">
        <strong>Stand Shift Notice (Parimpora Terminal):</strong>
        <p style="margin: 3px 0 0; color: #8f5223; font-size: 11px;">North-bound cabs & buses depart from <strong>Parimpora Regional Stand</strong>. From Batamaloo, take a local city Matador/E-Auto (₹10–15) to Parimpora for Baramulla, Sopore, Kupwara & Uri.</p>
      </div>
    `;
  }

  const isMughal = (f.includes("shopian") && (t.includes("poonch") || t.includes("rajouri") || t.includes("bafliaz") || t.includes("surankote"))) ||
    (t.includes("shopian") && (f.includes("poonch") || f.includes("rajouri") || f.includes("bafliaz") || f.includes("surankote")));
  const isSinthan = (f.includes("kishtwar") && (t.includes("anantnag") || t.includes("kokernag"))) ||
    (t.includes("kishtwar") && (f.includes("anantnag") || f.includes("kokernag")));
  const isRazdan = (f.includes("bandipora") && t.includes("gurez")) || (t.includes("bandipora") && f.includes("gurez")) || f.includes("gurez") || t.includes("gurez");

  if (isMughal || isSinthan || isRazdan) {
    html += `
      <div style="background: #ebf3f7; border: 1px solid #a8c9db; color: #1f4860; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; font-size: 12px;">
        <strong>❄️ Seasonal Mountain Pass Advisory:</strong>
        <p style="margin: 3px 0 0; color: #2c5282; font-size: 11px;">High-altitude corridors (Mughal Road / Sinthan Top / Razdan Pass) are closed in winter due to snow. Regular transit routes divert via NH-44 highway.</p>
      </div>
    `;
  }

  if (f.includes("gurez") || t.includes("gurez") || f.includes("karnah") || t.includes("karnah") || f.includes("tangdhar") || t.includes("tangdhar") || f.includes("uri")) {
    html += `
      <div style="background: #f0f4ee; border: 1px solid #c3d8c6; color: #234b4c; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; font-size: 12px;">
        <strong>🛡️ Frontier / Border Transit Zone:</strong>
        <p style="margin: 3px 0 0; color: #345657; font-size: 11px;">Movement through border/pass areas (Gurez, Karnah, Uri border) is subject to civil/army convoy timings, identity verification, and weather clearance.</p>
      </div>
    `;
  }

  if (f.includes("katra") || t.includes("katra") || f.includes("banganga") || t.includes("banganga") || f.includes("baltal") || t.includes("baltal") || f.includes("nunwan") || t.includes("nunwan")) {
    html += `
      <div style="background: #fbf5e6; border: 1px solid #f0d898; color: #6b4710; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; font-size: 12px;">
        <strong>🕉️ Pilgrimage Corridor Statutory Tariffs:</strong>
        <p style="margin: 3px 0 0; color: #744210; font-size: 11px;">Official registered stand rates apply for Shri Mata Vaishno Devi (Katra) and Shri Amarnathji Yatra base camps (Baltal & Nunwan).</p>
      </div>
    `;
  }

  if (viability.isViable && (currentVehicleKey === "e-rickshaw" || currentVehicleKey === "e-auto") && km > 6) {
    html += `
      <div style="background: #fff8eb; border: 1px solid #f9dca2; color: #8a5314; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; font-size: 12px;">
        <strong>⚡ Urban Range Notice:</strong>
        <p style="margin: 3px 0 0; color: #975a16; font-size: 11px;">E-Rickshaws and E-Autos operate within municipal limits (1–8 km). For highway transit (${km} km), commuters use Shared Maxi-Cabs or Matadors.</p>
      </div>
    `;
  }

  box.innerHTML = html;
  box.style.display = html.trim() ? "block" : "none";

  const switchBtn = document.getElementById("switch-viable-vehicle-btn");
  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      currentVehicleKey = viability.alternativeKey;
      calculateAndRender();
      showToast(`Switched to ${viability.alternativeName}`);
    });
  }
}

// Render Vehicle Selection Cards
function renderVehicleCards() {
  if (!vehicleCardsContainer) return;
  vehicleCardsContainer.innerHTML = "";
  
  const list = currentCategoryFilter === "all"
    ? vehicleOptions
    : vehicleOptions.filter((v) => v.category === currentCategoryFilter);

  const km = Math.max(1, Number(currentDistance) || 1);
  const hasRoute = Boolean(currentFrom.trim() && currentTo.trim() && Number(currentDistance) > 0);

  list.forEach((v) => {
    const isSelected = v.key === currentVehicleKey;
    const cardViability = getVehicleRouteViability(v.key, currentDistance, currentFrom, currentTo);
    const card = document.createElement("button");
    card.className = `vehicle-card ${isSelected ? "selected" : ""}`;
    
    let cardFare = 0;
    if (cardViability.isViable) {
      switch (v.calcType) {
        case "e-rickshaw":
          cardFare = Math.max(15, Math.round(km * 15));
          break;
        case "e-auto":
          cardFare = km <= 1 ? 25 : 25 + Math.round((km - 1) * 20);
          break;
        case "stage-slab":
          if (km <= 3) cardFare = 9;
          else if (km <= 5) cardFare = 14;
          else if (km <= 10) cardFare = 17;
          else if (km <= 15) cardFare = 20;
          else if (km <= 20) cardFare = 26;
          else cardFare = 26 + Math.round((km - 20) * 1.40);
          break;
        case "urban-stage":
          if (km <= 3) cardFare = 8;
          else if (km <= 6) cardFare = 12;
          else if (km <= 10) cardFare = 15;
          else cardFare = 18;
          break;
        case "tourist-group":
          cardFare = Math.max(25, Math.round(km * 2.25));
          break;
        case "stage-carriage":
          {
            const rate = currentTerrainRegion === "kashmir-plain" ? 1.64 : currentTerrainRegion === "kashmir-hill" ? 1.88 : currentTerrainRegion === "jammu-plain" ? 1.12 : 1.59;
            cardFare = Math.max(10, Math.round(km * rate));
          }
          break;
        case "stage-carriage-big":
          {
            const rate = currentTerrainRegion === "kashmir-plain" ? 1.40 : currentTerrainRegion === "kashmir-hill" ? 1.64 : currentTerrainRegion === "jammu-plain" ? 1.12 : 1.59;
            cardFare = Math.max(10, Math.round(km * rate));
          }
          break;
        case "metered-auto":
          cardFare = km <= 2 ? 45 : 45 + Math.round((km - 2) * 7.4);
          break;
        default:
          cardFare = Math.max(15, v.base + Math.round(km * v.perKm) + (v.key === "suv-taxi" ? 20 : 0));
          break;
      }
    }

    let footerBaseText = v.capacity || "Govt Approved";
    let footerRateText = `₹${v.perKm}/km`;
    if (v.calcType === "stage-slab") {
      footerBaseText = "6 to 8 Seats";
      footerRateText = "Stage Slabs (₹9-₹26)";
    } else if (v.calcType === "urban-stage") {
      footerBaseText = "6 to 8 Seats";
      footerRateText = "Urban Slabs (₹8-₹18)";
    } else if (v.calcType === "tourist-group") {
      footerBaseText = "14 Passengers";
      footerRateText = "₹2.25/km per seat";
    } else if (v.calcType === "e-rickshaw") {
      footerBaseText = "Up to 4 Persons";
      footerRateText = "Flat ₹15/km";
    } else if (v.calcType === "e-auto") {
      footerBaseText = "Up to 3 Persons";
      footerRateText = "₹20/km Rate";
    } else if (v.calcType === "metered-auto") {
      footerBaseText = "Up to 3 Persons";
      footerRateText = "₹7.40/km Meter";
    }

    const fareBadge = hasRoute && !cardViability.isViable
      ? `<span style="font-weight: 700; font-size: 10px; background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 6px; border: 1px solid #fca5a5;">Not Available</span>`
      : hasRoute && cardFare > 0
      ? `<span style="font-weight: 800; font-size: 11px; background: #eef4ed; color: #234b4c; padding: 2px 7px; border-radius: 6px; border: 1px solid #d2e4d4;">₹ ${cardFare}</span>`
      : `<span style="font-weight: 700; font-size: 10px; background: #edf3eb; color: #557b72; padding: 2px 6px; border-radius: 6px;">${v.calcType === "urban-stage" ? "₹8-₹18" : v.calcType === "stage-slab" ? "₹9-₹26" : `₹${v.perKm}/km`}</span>`;

    const visualMeta = window.VEHICLE_VISUAL_META ? window.VEHICLE_VISUAL_META[v.key] : null;
    const illustrationSvg = window.getVehicleIllustrationSvg ? window.getVehicleIllustrationSvg(v.key) : v.icon;
    const hallmarkText = visualMeta?.name || v.label;

    card.innerHTML = `
      <div class="vehicle-illustration-showcase">
        ${illustrationSvg}
        <div class="showcase-badge-left">
          <span class="vehicle-badge">${v.badge}</span>
        </div>
        <div class="showcase-badge-right">
          ${fareBadge}
        </div>
        <div class="showcase-hallmark-tag" title="${hallmarkText}">
          ${hallmarkText}
        </div>
      </div>
      <div class="vehicle-card-meta">
        <div class="vehicle-title-row">
          <strong>${v.label}</strong>
          ${isSelected ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#234b4c" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` : ""}
        </div>
        <p>${v.sublabel}</p>
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
  const km = Number(currentDistance) || 0;
  const hasRoute = Boolean(currentFrom.trim() && currentTo.trim() && km > 0);
  const viability = getVehicleRouteViability(currentVehicleKey, km, currentFrom, currentTo);
  let base = v.base;
  let distCost = 0;
  let adj = 0;
  let totalSingle = 0;
  let formulaDesc = "";

  if (km > 0 && viability.isViable) {
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
        formulaDesc = km <= 1 ? "1st KM Base (₹25)" : `₹25 (1st km) + ${(km - 1)} km × ₹20/km`;
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

      case "urban-stage":
        if (km <= 3) {
          totalSingle = 8;
          base = 8;
          formulaDesc = "Urban Stage: 0 to 3 KM (₹8)";
        } else if (km <= 6) {
          totalSingle = 12;
          base = 12;
          formulaDesc = "Urban Stage: 3 to 6 KM (₹12)";
        } else if (km <= 10) {
          totalSingle = 15;
          base = 15;
          formulaDesc = "Urban Stage: 6 to 10 KM (₹15)";
        } else {
          totalSingle = 18;
          base = 18;
          formulaDesc = "Urban Stage: 10 to 15 KM (₹18)";
        }
        break;

      case "tourist-group":
        {
          const seatCost = Math.max(25, Math.round(km * 2.25));
          totalSingle = seatCost;
          formulaDesc = `${km} km × ₹2.25/km (Per Seat) · ₹29/km (Charter)`;
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
        formulaDesc = km <= 2 ? "First 2 KM Meter (₹45)" : `₹45 (1st 2km) + ${(km - 2)} km × ₹7.4/km`;
        break;

      default:
        base = v.base;
        distCost = Math.round(km * v.perKm);
        adj = v.key === "suv-taxi" ? 20 : 0;
        totalSingle = Math.max(15, base + distCost + adj);
        formulaDesc = `${km} km × ₹${v.perKm}/km`;
        break;
    }
  } else if (!viability.isViable) {
    formulaDesc = `Route not serviced (Exceeds ${viability.maxKm} km operational range)`;
  } else {
    formulaDesc = `Official rate: ₹${v.perKm}/km`;
  }

  const fullCabCost = v.key === "force-traveler"
    ? Math.max(1200, Math.round(km * 29.0))
    : v.isPerSeat
    ? totalSingle * v.seatsMultiplier
    : totalSingle;

  const finalFare = !viability.isViable
    ? 0
    : !v.isPerSeat
    ? totalSingle
    : currentPriceMode === "full-cab"
    ? fullCabCost
    : totalSingle;

  // Update elements
  if (fareRouteSummary) {
    if (hasRoute) {
      fareRouteSummary.textContent = `${currentFrom} ➔ ${currentTo}`;
      fareRouteSummary.style.display = "block";
    } else {
      fareRouteSummary.textContent = "";
      fareRouteSummary.style.display = "none";
    }
  }
  if (displayPriceVal) {
    if (!hasRoute) {
      displayPriceVal.textContent = "₹ —";
    } else if (!viability.isViable) {
      displayPriceVal.textContent = "Fare Not Available";
      displayPriceVal.style.fontSize = "24px";
      displayPriceVal.style.color = "#ffcaca";
    } else {
      displayPriceVal.textContent = formatRupees(finalFare);
      displayPriceVal.style.fontSize = "";
      displayPriceVal.style.color = "";
    }
  }
  if (specVehicleName) specVehicleName.textContent = v.label;
  if (specDistanceVal) specDistanceVal.textContent = hasRoute && km > 0 ? `${km} KM` : "—";

  if (displayPriceBasis) {
    if (!hasRoute) {
      displayPriceBasis.textContent = "(Choose route to calculate)";
    } else if (!viability.isViable) {
      displayPriceBasis.textContent = `(${v.label} does not operate on ${km} km route)`;
    } else if (!v.isPerSeat) {
      displayPriceBasis.textContent = `(Entire ${v.label})`;
    } else if (currentPriceMode === "full-cab") {
      displayPriceBasis.textContent = `(Entire Vehicle - ${v.seatsMultiplier} Seats)`;
    } else {
      displayPriceBasis.textContent = "(Per Passenger Seat)";
    }
  }

  const mathVehicleName = document.getElementById("math-vehicle-name");
  if (mathVehicleName) mathVehicleName.textContent = v.label;
  if (mathDistanceLabel) mathDistanceLabel.textContent = formulaDesc;
  if (mathDistanceCost) mathDistanceCost.textContent = hasRoute && km > 0 ? `${km} KM` : "—";
  if (mathTotalFare) {
    if (!hasRoute) {
      mathTotalFare.textContent = "₹ —";
    } else if (!viability.isViable) {
      mathTotalFare.textContent = "Fare Not Available";
      mathTotalFare.style.color = "#b91c1c";
    } else {
      mathTotalFare.textContent = formatRupees(finalFare);
      mathTotalFare.style.color = "";
    }
  }

  // Toggle Seat Mode Visibility
  if (seatModeContainer) {
    if (!v.isPerSeat) {
      seatModeContainer.style.display = "none";
    } else {
      seatModeContainer.style.display = "flex";
    }
  }

  // Update Corridor Context details
  const routeInfo = resolveRouteInfo(currentFrom, currentTo);
  const contextCard = document.getElementById("corridor-context-card");
  if (contextCard) {
    if (routeInfo.isPreset) {
      contextCard.style.display = "block";
      const dur = document.getElementById("context-duration");
      const hwy = document.getElementById("context-highway");
      const trn = document.getElementById("context-terrain");
      const chips = document.getElementById("context-stops-chips");
      if (dur) dur.textContent = routeInfo.duration;
      if (hwy) hwy.textContent = routeInfo.highway;
      if (trn) trn.textContent = routeInfo.terrain;
      if (chips && routeInfo.stops) {
        chips.innerHTML = routeInfo.stops.map((s) => `<span>📍 ${s}</span>`).join("");
      }
    } else {
      contextCard.style.display = "none";
    }
  }

  renderVehicleCards();
  renderQuickPresets();
  renderContextAlerts();
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

  // Initialize Driver Mode when its tab becomes visible
  if (tabId === 'driver' && typeof SafarDriverMode !== 'undefined') {
    SafarDriverMode.init();
  }
}

function updateRouteDistance(fromLoc, toLoc) {
  const info = resolveRouteInfo(fromLoc, toLoc);
  currentDistance = info.distance;
  currentTerrainRegion = info.region;
  if (inputDistance) inputDistance.value = currentDistance;
}

// Attach Event Listeners
function attachListeners() {
  if (inputFrom) {
    inputFrom.addEventListener("input", (e) => {
      currentFrom = e.target.value;
      updateRouteDistance(currentFrom, currentTo);
      calculateAndRender();
    });
    inputFrom.addEventListener("change", (e) => {
      currentFrom = e.target.value;
      updateRouteDistance(currentFrom, currentTo);
      calculateAndRender();
    });
  }

  if (inputTo) {
    inputTo.addEventListener("input", (e) => {
      currentTo = e.target.value;
      updateRouteDistance(currentFrom, currentTo);
      calculateAndRender();
    });
    inputTo.addEventListener("change", (e) => {
      currentTo = e.target.value;
      updateRouteDistance(currentFrom, currentTo);
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
      updateRouteDistance(currentFrom, currentTo);
      calculateAndRender();
      showToast(`Swapped: ${currentFrom} ⇄ ${currentTo}`);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentFrom = "";
      currentTo = "";
      currentDistance = 0;
      currentTerrainRegion = "kashmir-plain";
      if (inputFrom) inputFrom.value = "";
      if (inputTo) inputTo.value = "";
      if (inputDistance) inputDistance.value = "";
      calculateAndRender();
      showToast("Cleared route inputs. Choose your points!");
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
    if (helpModal) {
      helpModal.hidden = false;
      if (window.SafarHelpAssistant && typeof window.SafarHelpAssistant.init === "function") {
        window.SafarHelpAssistant.init();
      }
    }
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
  renderDatalist();
  renderQuickPresets();
  renderVehicleCards();
  renderRouteGuide();
  renderHistory();
  calculateAndRender();
  if (window.SafarHelpAssistant && typeof window.SafarHelpAssistant.init === "function") {
    window.SafarHelpAssistant.init();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSafar);
} else {
  initSafar();
}
