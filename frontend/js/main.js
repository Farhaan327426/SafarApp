/**
 * SAFAR — J&K Smart Transit & Legal Fare Guide
 * Interactive Engine & Official 2026 Revised Fare Gazette Calculations
 */

// Helper to format currency in Indian Rupees
function formatRupees(amount) {
  return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
}

// 1. Vehicle Option Definitions (9 Non-SRTC / Non-E-Bus J&K Categories)
const vehicleOptions = [
  {
    key: "e-rickshaw",
    category: "auto",
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
    category: "auto",
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
    category: "auto",
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

  const km = Math.max(1, Number(currentDistance) || 1);

  list.forEach((v) => {
    const isSelected = v.key === currentVehicleKey;
    const card = document.createElement("button");
    card.className = `vehicle-card ${isSelected ? "selected" : ""}`;
    
    let cardFare = 0;
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

    let footerBaseText = v.capacity || "Govt Approved";
    let footerRateText = `₹${v.perKm}/km`;
    if (v.calcType === "stage-slab") {
      footerBaseText = "6 to 8 Seats";
      footerRateText = "Stage Slabs (₹9-₹26)";
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

    card.innerHTML = `
      <div class="vehicle-card-top">
        <div class="vehicle-icon-box">${v.icon}</div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-weight: 800; font-size: 11px; background: #eef4ed; color: #234b4c; padding: 2px 7px; border-radius: 6px; border: 1px solid #d2e4d4;">₹ ${cardFare}</span>
          <span class="vehicle-badge">${v.badge}</span>
        </div>
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

  const mathVehicleName = document.getElementById("math-vehicle-name");
  if (mathVehicleName) mathVehicleName.textContent = v.label;
  if (mathDistanceLabel) mathDistanceLabel.textContent = formulaDesc;
  if (mathDistanceCost) mathDistanceCost.textContent = `${km} KM`;
  if (mathTotalFare) mathTotalFare.textContent = formatRupees(finalFare);

  // Update Live Route Distance Card in Step 1
  const routeInfo = resolveRouteInfo(currentFrom, currentTo);
  const liveRouteName = document.getElementById("live-route-name");
  const liveRouteKmPill = document.getElementById("live-route-km-pill");
  const liveRouteMeta = document.getElementById("live-route-meta");
  const liveRouteHighway = document.getElementById("live-route-highway");
  if (liveRouteName) liveRouteName.textContent = `${currentFrom} ➔ ${currentTo}`;
  if (liveRouteKmPill) liveRouteKmPill.textContent = `${km} KM`;
  if (liveRouteMeta) liveRouteMeta.textContent = `⏱️ Approx ${routeInfo.duration} · 🏔️ ${routeInfo.terrain}`;
  if (liveRouteHighway) liveRouteHighway.textContent = routeInfo.highway;

  // Toggle Seat Mode Visibility
  if (seatModeContainer) {
    if (!v.isPerSeat) {
      seatModeContainer.style.display = "none";
    } else {
      seatModeContainer.style.display = "flex";
    }
  }

  // Update Corridor Context details
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
      currentFrom = "Srinagar";
      currentTo = "Gulmarg";
      currentDistance = 51;
      currentVehicleKey = "shared-cab";
      currentTerrainRegion = "kashmir-hill";
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
  renderDatalist();
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
