import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  BusFront,
  Calculator,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CircleGauge,
  Clock3,
  Compass,
  FileText,
  Info,
  MapPin,
  MapPinned,
  Menu,
  Navigation,
  PhoneCall,
  QrCode,
  RefreshCw,
  Route,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  X,
  Eye,
  LayoutGrid,
  List,
} from "lucide-react";
import StageExplorer from "./components/StageExplorer.jsx";
import ConductorSlipModal from "./components/ConductorSlipModal.jsx";
import VehicleIllustration, {
  VEHICLE_VISUAL_META,
} from "./components/VehicleIllustration.jsx";
import {
  VEHICLE_OPERATIONAL_ZONES,
  resolveRouteProfile,
  filterEligibleVehicles,
} from "./data/transitZones.js";

const vehicleCategories = [
  { key: "all", label: "All Vehicles (11)" },
  { key: "ev", label: "⚡ Autos & EVs" },
  { key: "shared", label: "Shared Cabs" },
  { key: "bus", label: "Buses & Matadors" },
  { key: "taxi", label: "Private Taxis" },
];

const vehicleOptions = [
  {
    key: "e-rickshaw",
    id: "e-rickshaw",
    name: "E-Rickshaw",
    category: "ev",
    label: "E-Rickshaw",
    sublabel: "4-Seater Local Rickshaw",
    detail: "Official flat rate: ₹15/km per passenger or local hop",
    icon: Zap,
    calcType: "e-rickshaw",
    base: 15,
    perKm: 15.0,
    capacity: "Up to 4 Persons",
    badge: "Local Hop",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#2f855a",
    districtFootprint: "Srinagar SMC, Jammu JMC, Katra, Baramulla, Anantnag (1–6 km)",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["e-rickshaw"].operationalZone,
  },
  {
    key: "e-auto",
    id: "e-auto",
    name: "E-Auto",
    category: "ev",
    permitType: "municipal-feeder",
    label: "E-Auto",
    sublabel: "Electric Auto Rickshaw",
    detail: "Official statutory tariff: ₹25 for first 1 km, then ₹20/km",
    icon: Zap,
    calcType: "e-auto",
    base: 25,
    perKm: 20.0,
    capacity: "Up to 3 Persons",
    badge: "Metered EV",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#237249",
    districtFootprint: "Srinagar & Jammu Municipal Limits (1–12 km)",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["e-auto"].operationalZone,
  },
  {
    key: "tata-magic",
    id: "tata-magic",
    name: "Tata Magic",
    category: "shared",
    permitType: "stage-carriage",
    label: "Tata Magic",
    sublabel: "Feeder Van / Eeco",
    detail: "Stage slabs: ₹9 (3km), ₹14 (5km), ₹17 (10km), ₹20 (15km), ₹26 (20km)",
    icon: CarFront,
    calcType: "stage-slab",
    base: 9,
    perKm: 1.4,
    capacity: "6 to 8 Seats",
    badge: "Fixed Stage",
    isPerSeat: true,
    seatsMultiplier: 7,
    color: "#c27438",
    districtFootprint: "Baramulla, Sopore, Kupwara, Rural South & Outer Jammu",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["tata-magic"].operationalZone,
  },
  {
    key: "vikram-tempo",
    id: "vikram",
    name: "Vikram Tempo",
    category: "shared",
    permitType: "stage-carriage",
    label: "Vikram Tempo",
    sublabel: "Shared Tempo (Jammu City)",
    detail: "Urban stage slabs: ₹8 (0-3km), ₹12 (3-6km), ₹15 (6-10km), ₹18 (10-15km)",
    icon: CarFront,
    calcType: "urban-stage",
    base: 8,
    perKm: 1.5,
    capacity: "6 to 8 Seats",
    badge: "Jammu Slabs",
    isPerSeat: true,
    seatsMultiplier: 6,
    color: "#a65c2a",
    districtFootprint: "Jammu Urban (Satwari, Gandhi Nagar, Jewel, Janipur, Canal Rd)",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["vikram-tempo"].operationalZone,
  },
  {
    key: "mini-bus",
    id: "mini-bus",
    name: "Matador (Mini Bus)",
    category: "bus",
    permitType: "stage-carriage",
    label: "Matador (Mini Bus)",
    sublabel: "Tata 407 / Mini Bus",
    detail: "Official rate: ₹1.64/km (Kashmir Plain) · ₹1.88/km (Hilly)",
    icon: BusFront,
    calcType: "stage-carriage",
    base: 10,
    perKm: 1.64,
    capacity: "18-24 Seats",
    badge: "Standard Route",
    isPerSeat: true,
    seatsMultiplier: 18,
    color: "#557b72",
    districtFootprint: "Universal High-Frequency Stage across all 20 Districts (5–45 km)",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["mini-bus"].operationalZone,
  },
  {
    key: "private-bus",
    id: "private-bus",
    name: "Private Bus",
    category: "bus",
    permitType: "stage-carriage",
    label: "Private Bus",
    sublabel: "32+ Seater Stage Bus",
    detail: "Official rate: ₹1.12/km (Jammu Plain) · ₹1.40-₹1.64/km (Kashmir)",
    icon: BusFront,
    calcType: "stage-carriage-big",
    base: 10,
    perKm: 1.4,
    capacity: "32+ Seats",
    badge: "Trunk Route",
    isPerSeat: true,
    seatsMultiplier: 32,
    color: "#3f6e5b",
    districtFootprint: "Inter-District Trunk Highways (Srinagar-Baramulla, Jammu-Katra-Poonch)",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["private-bus"].operationalZone,
  },
  {
    key: "shared-cab",
    id: "shared-cab",
    name: "Sumo (Shared Cab)",
    category: "shared",
    permitType: "shared-maxi-cab",
    label: "Sumo (Shared Cab)",
    sublabel: "Tata Sumo / Bolero",
    detail: "Inter-district standard corridor: ₹35 base + ₹5.20/km per seat",
    icon: CarFront,
    calcType: "standard",
    base: 35,
    perKm: 5.2,
    capacity: "5 to 7 Seats",
    badge: "Most Popular",
    isPerSeat: true,
    seatsMultiplier: 5,
    color: "#d36b3d",
    districtFootprint: "Universal Inter-District & Mountain Pass Lifeline (All 20 Districts)",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["shared-cab"].operationalZone,
  },
  {
    key: "force-traveler",
    id: "force-traveler",
    name: "Tempo Traveler",
    category: "taxi",
    permitType: "contract-tourist",
    label: "Tempo Traveler",
    sublabel: "14-Seater Traveler",
    detail: "Official tariff: ₹2.25/km per seat (Shared) or ₹29.00/km (Full Charter)",
    icon: BusFront,
    calcType: "tourist-group",
    base: 0,
    perKm: 2.25,
    contractPerKm: 29.0,
    capacity: "14 Passengers",
    badge: "Group Traveler",
    isPerSeat: true,
    seatsMultiplier: 14,
    color: "#2c5282",
    districtFootprint: "Srinagar-Gulmarg, Pahalgam, Sonamarg, Katra & Tourist Corridors",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["force-traveler"].operationalZone,
  },
  {
    key: "auto",
    id: "auto",
    name: "Auto Rickshaw",
    category: "ev",
    permitType: "metered-auto",
    label: "Auto Rickshaw",
    sublabel: "Standard 3-Wheeler Auto",
    detail: "Official rate: ₹45 for first 2 km, then ₹7.40/km",
    icon: CarFront,
    calcType: "metered-auto",
    base: 45,
    perKm: 7.4,
    capacity: "Up to 3 Persons",
    badge: "Metered Auto",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#bc8a20",
    districtFootprint: "Urban Municipal Stands (Srinagar, Jammu, Katra, Udhampur, Anantnag)",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["auto"].operationalZone,
  },
  {
    key: "taxi",
    id: "taxi",
    name: "Sedan Taxi",
    category: "taxi",
    permitType: "contract-tourist",
    label: "Sedan Taxi",
    sublabel: "Dzire / Etios (Private Cab)",
    detail: "Official 18% hiked contract hire: ₹140 base + ₹14.50/km",
    icon: CarFront,
    calcType: "standard",
    base: 140,
    perKm: 14.5,
    capacity: "Entire Vehicle (4+1)",
    badge: "Private Cab",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#3e6b8a",
    districtFootprint: "Dedicated Point-to-Point, Airport Transfers & Inter-District",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["taxi"].operationalZone,
  },
  {
    key: "suv-taxi",
    id: "suv-taxi",
    name: "SUV Taxi",
    category: "taxi",
    permitType: "contract-tourist",
    label: "SUV Taxi",
    sublabel: "Innova / Scorpio (Private Cab)",
    detail: "Official 18% hiked tourist contract hire: ₹220 base + ₹21.00/km",
    icon: CarFront,
    calcType: "standard",
    base: 220,
    perKm: 21.0,
    capacity: "Entire Vehicle (6+1 / 7+1)",
    badge: "Tourist SUV",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#28536b",
    districtFootprint: "All J&K Alpine Circuits, Airport Transfers & Long-Distance",
    operationalZone: VEHICLE_OPERATIONAL_ZONES["suv-taxi"].operationalZone,
  },
];

const popularLocations = [
  // District HQs & Major RTO/ARTO Hubs (22 Codes)
  "Srinagar",
  "Jammu",
  "Anantnag",
  "Baramulla",
  "Budgam",
  "Pulwama",
  "Kupwara",
  "Ganderbal",
  "Bandipora",
  "Kulgam",
  "Shopian",
  "Udhampur",
  "Kathua",
  "Rajouri",
  "Poonch",
  "Doda",
  "Ramban",
  "Kishtwar",
  "Reasi",
  "Samba",
  // Major Commercial & Transit Towns
  "Sopore",
  "Katra",
  "Tangmarg",
  "Pattan",
  "Bijbehara",
  "Awantipora",
  "Pampore",
  "Kangan",
  "Qazigund",
  "Banihal",
  "Batote",
  "Bhaderwah",
  "Surankote",
  "Mendhar",
  "Akhnoor",
  "R.S. Pura",
  "Hiranagar",
  "Chenani",
  "Uri",
  "Handwara",
  "Langate",
  "Karnah",
  "Chadoora",
  "Magam",
  "Beerwah",
  "Tral",
  // Key Micro-Urban & Intra-City Hubs
  "Lal Chowk",
  "Srinagar Airport",
  "Dal Lake (Dalgate)",
  "Hazratbal",
  "Batamaloo",
  "Parimpora",
  "Pantha Chowk",
  "Soura",
  "Nowhatta",
  "Jammu Tawi Station",
  "Jammu Bus Stand",
  "Gandhi Nagar (Jammu)",
  "Janipur",
  "Narwal (Jammu)",
  "Banganga (Katra)",
  // Tourist & Scenic Corridors
  "Gulmarg",
  "Pahalgam",
  "Sonmarg",
  "Doodhpathri",
  "Yusmarg",
  "Aharbal",
  "Patnitop",
  "Sanasar",
  "Mansar Lake",
  "Sinthan Top",
  "Bafliaz (Mughal Road)",
  "Kokernag",
  "Verinag",
  "Daksum",
  "Gurez Valley",
];

const routePresets = [
  // Major Inter-District & Tourist Corridors
  {
    from: "Srinagar",
    to: "Gulmarg",
    distance: 51,
    duration: "1h 35m",
    terrain: "Mountain Pass",
    region: "kashmir-hill",
    highway: "NH-1A / Tangmarg Rd",
    stops: ["Tangmarg", "Magam", "Narbal"],
  },
  {
    from: "Srinagar",
    to: "Pahalgam",
    distance: 92,
    duration: "2h 20m",
    terrain: "Scenic Valley Corridor",
    region: "kashmir-plain",
    highway: "KP Road / NH-44",
    stops: ["Pampore", "Awantipora", "Anantnag"],
  },
  {
    from: "Srinagar",
    to: "Sonmarg",
    distance: 80,
    duration: "2h 10m",
    terrain: "High Mountain Highway",
    region: "kashmir-hill",
    highway: "NH-1 (Srinagar-Leh)",
    stops: ["Ganderbal", "Kangan", "Gund"],
  },
  {
    from: "Jammu",
    to: "Katra",
    distance: 49,
    duration: "1h 14m",
    terrain: "Expressway Foothills",
    region: "jammu-hill",
    highway: "NH-44 / Katra Bypass",
    stops: ["Nagrota", "Jhajjar Kotli"],
  },
  {
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
    duration: "1h 20m",
    terrain: "Plains / 4-Lane Highway",
    region: "kashmir-plain",
    highway: "NH-44 Valley Expressway",
    stops: ["Bijbehara", "Awantipora", "Pampore"],
  },
  {
    from: "Baramulla",
    to: "Srinagar",
    distance: 54,
    duration: "1h 25m",
    terrain: "Plains Expressway",
    region: "kashmir-plain",
    highway: "NH-1 Valley Highway",
    stops: ["Sangrama", "Pattan", "Shalteng"],
  },
  {
    from: "Sopore",
    to: "Srinagar",
    distance: 49,
    duration: "1h 16m",
    terrain: "Plains Road",
    region: "kashmir-plain",
    highway: "Sopore-Srinagar Highway",
    stops: ["Sangrama", "Pattan", "Shalteng"],
  },
  {
    from: "Kupwara",
    to: "Srinagar",
    distance: 85,
    duration: "2h 15m",
    terrain: "North Kashmir Highway",
    region: "kashmir-plain",
    highway: "Sopore-Kupwara Highway",
    stops: ["Handwara", "Langate", "Sangrama"],
  },
  {
    from: "Pulwama",
    to: "Srinagar",
    distance: 31,
    duration: "45m",
    terrain: "South Valley Link",
    region: "kashmir-plain",
    highway: "Circular Road / NH-44",
    stops: ["Kakapora", "Pampore", "Pantha Chowk"],
  },
  {
    from: "Shopian",
    to: "Srinagar",
    distance: 52,
    duration: "1h 20m",
    terrain: "Apple Valley Corridor",
    region: "kashmir-plain",
    highway: "Shopian-Pulwama-Srinagar Rd",
    stops: ["Pulwama", "Pampore"],
  },
  {
    from: "Kulgam",
    to: "Srinagar",
    distance: 68,
    duration: "1h 45m",
    terrain: "South Kashmir Plains",
    region: "kashmir-plain",
    highway: "Kulgam-Anantnag NH-44",
    stops: ["Wanpoh", "Bijbehara", "Awantipora"],
  },
  {
    from: "Ganderbal",
    to: "Srinagar",
    distance: 21,
    duration: "35m",
    terrain: "Suburban Corridor",
    region: "kashmir-plain",
    highway: "Ganderbal-Nagbal Rd",
    stops: ["Beehama", "Nagbal", "Soura"],
  },
  {
    from: "Bandipora",
    to: "Srinagar",
    distance: 58,
    duration: "1h 30m",
    terrain: "Wular Lake Highway",
    region: "kashmir-plain",
    highway: "Bandipora-Mansbal-Srinagar Rd",
    stops: ["Mansbal", "Safapora", "Shalteng"],
  },
  {
    from: "Srinagar",
    to: "Doodhpathri",
    distance: 42,
    duration: "1h 15m",
    terrain: "Meadow Mountain Corridor",
    region: "kashmir-hill",
    highway: "Budgam-Khansahib Rd",
    stops: ["Budgam", "Khansahib", "Raikiyar"],
  },
  {
    from: "Srinagar",
    to: "Yusmarg",
    distance: 47,
    duration: "1h 25m",
    terrain: "Pine Ridge Valley",
    region: "kashmir-hill",
    highway: "Chadoora-Charar-e-Sharief Rd",
    stops: ["Chadoora", "Charar-e-Sharief", "Nagbal"],
  },
  {
    from: "Jammu",
    to: "Udhampur",
    distance: 65,
    duration: "1h 30m",
    terrain: "4-Lane Mountain Foothills",
    region: "jammu-hill",
    highway: "NH-44 Jammu-Udhampur",
    stops: ["Nagrota", "Nandni Tunnel", "Tikri"],
  },
  {
    from: "Jammu",
    to: "Patnitop",
    distance: 112,
    duration: "2h 45m",
    terrain: "High Hill Resort Highway",
    region: "jammu-hill",
    highway: "NH-44 / Chenani-Nashri",
    stops: ["Udhampur", "Samroli", "Chenani"],
  },
  {
    from: "Jammu",
    to: "Rajouri",
    distance: 152,
    duration: "4h 10m",
    terrain: "Pir Panjal Foothills",
    region: "jammu-hill",
    highway: "NH-144A Jammu-Poonch",
    stops: ["Akhnoor", "Sunderbani", "Nowshera"],
  },
  {
    from: "Jammu",
    to: "Poonch",
    distance: 236,
    duration: "6h 30m",
    terrain: "Border Mountain Highway",
    region: "jammu-hill",
    highway: "NH-144A Highway",
    stops: ["Rajouri", "Bhimber Gali", "Surankote"],
  },
  {
    from: "Jammu",
    to: "Doda",
    distance: 165,
    duration: "4h 30m",
    terrain: "Chenab Valley Canyon",
    region: "jammu-hill",
    highway: "NH-244 Chenab Corridor",
    stops: ["Batote", "Assar", "Baglihar"],
  },
  {
    from: "Jammu",
    to: "Kathua",
    distance: 84,
    duration: "1h 45m",
    terrain: "Plains Expressway",
    region: "jammu-plain",
    highway: "NH-44 Jammu-Pathankot",
    stops: ["Samba", "Ghagwal", "Hiranagar"],
  },
  {
    from: "Srinagar",
    to: "Jammu",
    distance: 260,
    duration: "6h 00m",
    terrain: "Inter-Province Expressway",
    region: "kashmir-hill",
    highway: "NH-44 / Navyug & Chenani Tunnels",
    stops: ["Qazigund", "Banihal", "Ramban", "Udhampur"],
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
    stops: ["Rambagh", "Hyderpora", "Humhama"],
  },
  {
    from: "Lal Chowk",
    to: "Dal Lake (Dalgate)",
    distance: 4,
    duration: "10m",
    terrain: "City Lake Boulevard",
    region: "kashmir-plain",
    highway: "Boulevard Road",
    stops: ["MA Road", "TRC", "Dalgate"],
  },
  {
    from: "Lal Chowk",
    to: "Hazratbal",
    distance: 11,
    duration: "22m",
    terrain: "Old City & Lake Route",
    region: "kashmir-plain",
    highway: "Foreshore Road / Nigeen",
    stops: ["Dalgate", "Rainawari", "Nigeen"],
  },
  {
    from: "Batamaloo",
    to: "Parimpora",
    distance: 6,
    duration: "14m",
    terrain: "Micro-Urban Transit Route",
    region: "kashmir-plain",
    highway: "National Highway Bypass",
    stops: ["Tengpora", "Qamarwari"],
  },
  {
    from: "Jammu Tawi Station",
    to: "Gandhi Nagar (Jammu)",
    distance: 4,
    duration: "10m",
    terrain: "City Commuter Route",
    region: "jammu-plain",
    highway: "University Road",
    stops: ["Bikram Chowk", "Green Belt"],
  },
  {
    from: "Katra Station",
    to: "Banganga (Katra)",
    distance: 4,
    duration: "12m",
    terrain: "Pilgrim Feeder Route",
    region: "jammu-hill",
    highway: "Katra Main Bazaar Rd",
    stops: ["Main Market", "Yatri Parchi Counter"],
  },
];

// 3. J&K Geographic Location Coordinates Matrix (All 75+ Hubs across 22 RTO Districts)
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
function resolveRouteInfo(loc1, loc2, userRegionOverride = null) {
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
      routeProfile: null,
    };
  }

  // Check exact match in verified route presets
  const presetMatch = routePresets.find(
    (r) =>
      (r.from.toLowerCase() === s1.toLowerCase() && r.to.toLowerCase() === s2.toLowerCase()) ||
      (r.from.toLowerCase() === s2.toLowerCase() && r.to.toLowerCase() === s1.toLowerCase())
  );

  const profile = resolveRouteProfile(
    s1,
    s2,
    Boolean(presetMatch),
    presetMatch?.routeProfile || null,
    userRegionOverride
  );

  if (s1.toLowerCase() === s2.toLowerCase()) {
    return {
      distance: 3,
      duration: "8m",
      terrain: "Local City Hop",
      region: profile?.region === "jammu" ? "jammu-plain" : "kashmir-plain",
      highway: "Local Street / Link Road",
      isPreset: false,
      routeProfile: profile,
    };
  }

  if (presetMatch) {
    return {
      distance: presetMatch.distance,
      duration: presetMatch.duration,
      terrain: presetMatch.terrain,
      region: presetMatch.region || (profile?.region === "jammu" ? "jammu-plain" : "kashmir-plain"),
      highway: presetMatch.highway,
      stops: presetMatch.stops,
      isPreset: true,
      routeProfile: profile,
    };
  }

  // Lookup coordinate table with smart matcher
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
      routeProfile: profile,
    };
  }

  // Fallback for custom or unlisted stops with dynamic variation
  let hash = 0;
  for (let i = 0; i < s1.length; i++) hash = (hash << 5) - hash + s1.charCodeAt(i);
  for (let i = 0; i < s2.length; i++) hash = (hash << 5) - hash + s2.charCodeAt(i);
  const pseudoDist = Math.max(6, (Math.abs(hash) % 45) + 12);
  const approxMins = Math.round((pseudoDist / 38) * 60);

  return {
    distance: pseudoDist,
    duration: approxMins >= 60 ? `${Math.floor(approxMins / 60)}h ${approxMins % 60}m` : `${approxMins}m`,
    terrain: "Standard District Corridor",
    region: profile?.region === "jammu" ? "jammu-plain" : "kashmir-plain",
    highway: "J&K State Highway",
    isPreset: false,
    routeProfile: profile,
  };
}

// Vehicle Operational Distance & Corridor Viability Matrix
export function getVehicleRouteViability(vehicleKey, km, from = "", to = "") {
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

export default function App() {
  const [activeNav, setActiveNav] = useState("Fare calculator");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [vehicle, setVehicle] = useState("shared-cab");
  const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState("all");
  const [terrainRegion, setTerrainRegion] = useState("kashmir-plain");
  const [notice, setNotice] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showConductorSlip, setShowConductorSlip] = useState(false);
  const [searchFromFocus, setSearchFromFocus] = useState(false);
  const [searchToFocus, setSearchToFocus] = useState(false);
  const [priceMode, setPriceMode] = useState("per-seat");
  const [vehicleViewMode, setVehicleViewMode] = useState("visual"); // 'visual' | 'compact'
  const [showFleetGuide, setShowFleetGuide] = useState(false);
  const [inspectedVehicleKey, setInspectedVehicleKey] = useState(null);

  const [userRegionOverride, setUserRegionOverride] = useState(null);

  const hasRoute = Boolean(from.trim() && to.trim());

  // Dynamic Route & Distance Resolver
  const currentRouteMeta = useMemo(() => {
    return resolveRouteInfo(from, to, userRegionOverride);
  }, [from, to, userRegionOverride]);

  const currentRouteProfile = currentRouteMeta?.routeProfile || null;

  // Filtered Eligible Vehicles (Strict Whitelist Filtering)
  // Non-eligible vehicles are silently excluded — no card, no fare, no placeholder.
  const eligibleVehicles = useMemo(() => {
    if (!hasRoute || !currentRouteProfile) return vehicleOptions;
    return filterEligibleVehicles(vehicleOptions, currentRouteProfile);
  }, [hasRoute, currentRouteProfile]);

  // Zero-flash Synchronous Active Vehicle Resolution (Gap 5)
  // Resolves the active vehicle in the exact same render tick
  const activeVehicle = useMemo(() => {
    if (!hasRoute || !currentRouteProfile) {
      return vehicleOptions.find((v) => v.key === vehicle || v.id === vehicle) || vehicleOptions[0];
    }
    if (eligibleVehicles.length === 0) {
      return null;
    }
    const found = eligibleVehicles.find((v) => v.key === vehicle || v.id === vehicle);
    return found || eligibleVehicles[0];
  }, [hasRoute, currentRouteProfile, vehicle, eligibleVehicles]);

  // Synchronize state if activeVehicle changed
  useEffect(() => {
    if (activeVehicle && activeVehicle.key !== vehicle) {
      setVehicle(activeVehicle.key);
    }
  }, [activeVehicle, vehicle]);

  const chosenVehicle = activeVehicle || vehicleOptions[0];

  // Dynamic Category Counts
  const categoryCounts = useMemo(() => {
    const pool = hasRoute ? eligibleVehicles : vehicleOptions;
    const counts = { all: pool.length };
    pool.forEach((v) => {
      counts[v.category] = (counts[v.category] || 0) + 1;
    });
    return counts;
  }, [hasRoute, eligibleVehicles]);

  // Filtered Vehicles for Active Category Tab
  const visibleVehicles = useMemo(() => {
    const pool = hasRoute ? eligibleVehicles : vehicleOptions;
    if (vehicleCategoryFilter === "all") return pool;
    return pool.filter((v) => v.category === vehicleCategoryFilter);
  }, [hasRoute, eligibleVehicles, vehicleCategoryFilter]);

  // Synchronize distance and terrain on route update
  const syncRouteDistance = (nextFrom, nextTo) => {
    if (!nextFrom.trim() || !nextTo.trim()) {
      setDistance("");
      setUserRegionOverride(null);
      return null;
    }
    setUserRegionOverride(null);
    const info = resolveRouteInfo(nextFrom, nextTo, null);
    setDistance(String(info.distance));
    setTerrainRegion(info.region);
    return info;
  };

  // Exact Statutory Fare Calculations
  const fareParts = useMemo(() => {
    const km = Number(distance) || 0;

    // Secondary rule: If zero vehicles are eligible for a selected corridor
    if (hasRoute && (!activeVehicle || eligibleVehicles.length === 0)) {
      return {
        isViable: false,
        isZeroEligible: true,
        viability: {
          isViable: false,
          reason: "No registered vehicle category operates this route.",
          maxKm: 0,
        },
        base: 0,
        distanceCost: 0,
        localAdjustment: 0,
        totalSingle: 0,
        fullCabCost: 0,
        formulaDesc: "No registered vehicle category operates this route.",
        perKmRate: 0,
      };
    }

    const viability = getVehicleRouteViability(chosenVehicle.key, km, from, to);

    if (km <= 0) {
      return {
        isViable: true,
        isZeroEligible: false,
        viability,
        base: chosenVehicle.base,
        distanceCost: 0,
        localAdjustment: 0,
        totalSingle: 0,
        fullCabCost: 0,
        formulaDesc: `Official rate: ₹${chosenVehicle.perKm}/km`,
        perKmRate: chosenVehicle.perKm,
      };
    }

    if (!viability.isViable) {
      return {
        isViable: false,
        isZeroEligible: false,
        viability,
        base: 0,
        distanceCost: 0,
        localAdjustment: 0,
        totalSingle: 0,
        fullCabCost: 0,
        formulaDesc: `Route not serviced (Exceeds ${viability.maxKm} km operational range)`,
        perKmRate: 0,
      };
    }

    let base = chosenVehicle.base;
    let distanceCost = 0;
    let localAdjustment = 0;
    let totalSingle = 0;
    let formulaDesc = "";

    switch (chosenVehicle.calcType) {
      case "e-rickshaw":
        base = 15;
        distanceCost = Math.round(km * 15);
        totalSingle = Math.max(15, distanceCost);
        formulaDesc = `Flat ₹15/km (${km} km × ₹15)`;
        break;

      case "e-auto":
        base = 25;
        distanceCost = km <= 1 ? 0 : Math.round((km - 1) * 20);
        totalSingle = km <= 1 ? 25 : 25 + distanceCost;
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
          distanceCost = Math.round(extraKm * 1.40);
          totalSingle = 26 + distanceCost;
          formulaDesc = `₹26 (20km slab) + ${extraKm} km @ 50% Concession (₹1.40/km)`;
        }
        break;

      case "stage-carriage":
        {
          const ratePerKm =
            terrainRegion === "kashmir-plain"
              ? 1.64
              : terrainRegion === "kashmir-hill"
              ? 1.88
              : terrainRegion === "jammu-plain"
              ? 1.12
              : 1.59;
          base = 10;
          distanceCost = Math.round(km * ratePerKm);
          totalSingle = Math.max(10, distanceCost);
          formulaDesc = `${km} km × ₹${ratePerKm}/km`;
        }
        break;

      case "stage-carriage-big":
        {
          const ratePerKm =
            terrainRegion === "kashmir-plain"
              ? 1.40
              : terrainRegion === "kashmir-hill"
              ? 1.64
              : terrainRegion === "jammu-plain"
              ? 1.12
              : 1.59;
          base = 10;
          distanceCost = Math.round(km * ratePerKm);
          totalSingle = Math.max(10, distanceCost);
          formulaDesc = `${km} km × ₹${ratePerKm}/km`;
        }
        break;

      case "tourist-group":
        {
          const seatCost = Math.max(25, Math.round(km * 2.25));
          const charterCost = Math.max(1200, Math.round(km * 29.0));
          totalSingle = seatCost;
          formulaDesc = `${km} km × ₹2.25/km (Per Seat) · ₹29/km (Charter)`;
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

      case "metered-auto":
        base = 45;
        distanceCost = km <= 2 ? 0 : Math.round((km - 2) * 7.4);
        totalSingle = km <= 2 ? 45 : 45 + distanceCost;
        formulaDesc = km <= 2 ? "First 2 KM Meter (₹45)" : `₹45 (First 2 km) + ${(km - 2)} km × ₹7.40/km`;
        break;

      default:
        base = chosenVehicle.base;
        distanceCost = Math.round(km * chosenVehicle.perKm);
        localAdjustment = chosenVehicle.key === "suv-taxi" ? 20 : 0;
        totalSingle = Math.max(15, base + distanceCost + localAdjustment);
        formulaDesc = `${km} km × ₹${chosenVehicle.perKm}/km`;
        break;
    }

    const fullCabCost = chosenVehicle.key === "force-traveler"
      ? Math.max(1200, Math.round(km * 29.0))
      : chosenVehicle.isPerSeat
      ? totalSingle * chosenVehicle.seatsMultiplier
      : totalSingle;

    return {
      isViable: true,
      viability,
      base,
      distanceCost,
      localAdjustment,
      totalSingle,
      fullCabCost,
      formulaDesc,
      perKmRate: chosenVehicle.perKm,
    };
  }, [chosenVehicle, distance, from, to, terrainRegion]);

  const activePresets = useMemo(() => {
    if (vehicle === "tata-magic") {
      return [
        { from: "Baramulla", to: "Kreeri", distance: 14 },
        { from: "Sopore", to: "Watergam", distance: 12 },
        { from: "Handwara", to: "Langate", distance: 6 },
        { from: "R.S. Pura", to: "Bishnah", distance: 12 },
        { from: "Anantnag", to: "Achabal", distance: 9 },
        { from: "Pattan", to: "Magam", distance: 12 },
      ];
    }
    if (vehicle === "force-traveler") {
      return [
        { from: "Srinagar", to: "Gulmarg", distance: 51 },
        { from: "Srinagar", to: "Pahalgam", distance: 92 },
        { from: "Srinagar", to: "Sonmarg", distance: 80 },
        { from: "Katra", to: "Shiv Khori", distance: 74 },
        { from: "Parimpora", to: "Uri", distance: 98 },
      ];
    }
    if (vehicle === "vikram-tempo") {
      return [
        { from: "Jammu Bus Stand", to: "Gandhi Nagar (Jammu)", distance: 4 },
        { from: "Jammu Bus Stand", to: "Bari Brahmana", distance: 14 },
        { from: "Jammu", to: "Janipur", distance: 7 },
        { from: "Jammu Tawi Station", to: "Satwari", distance: 5 },
      ];
    }
    if (vehicle === "e-rickshaw") {
      return [
        { from: "Lal Chowk", to: "Dal Lake (Dalgate)", distance: 4 },
        { from: "Lal Chowk", to: "Hazratbal", distance: 10 },
        { from: "Batamaloo", to: "Parimpora", distance: 6 },
        { from: "Katra", to: "Banganga (Katra)", distance: 4 },
      ];
    }
    return routePresets;
  }, [vehicle]);

  const contextAlerts = useMemo(() => {
    const f = from.toLowerCase();
    const t = to.toLowerCase();
    const km = Number(distance) || 0;
    const isNorthDest = ["baramulla", "sopore", "kupwara", "handwara", "uri", "bandipora", "pattan"].some(
      (d) => t.includes(d) || f.includes(d)
    );

    const isBatamalooNorthRedirect =
      (f.includes("batamaloo") && isNorthDest && !t.includes("batamaloo")) ||
      (t.includes("batamaloo") && isNorthDest && !f.includes("batamaloo"));

    const isMughalRoad =
      (f.includes("shopian") && (t.includes("poonch") || t.includes("rajouri") || t.includes("bafliaz") || t.includes("surankote"))) ||
      (t.includes("shopian") && (f.includes("poonch") || f.includes("rajouri") || f.includes("bafliaz") || f.includes("surankote")));

    const isSinthanTop =
      (f.includes("kishtwar") && (t.includes("anantnag") || t.includes("kokernag"))) ||
      (t.includes("kishtwar") && (f.includes("anantnag") || f.includes("kokernag")));

    const isRazdanPass =
      (f.includes("bandipora") && t.includes("gurez")) ||
      (t.includes("bandipora") && f.includes("gurez")) ||
      f.includes("gurez") ||
      t.includes("gurez");

    const isWinterClosure = isMughalRoad || isSinthanTop || isRazdanPass;

    const isFrontier =
      f.includes("gurez") ||
      t.includes("gurez") ||
      f.includes("karnah") ||
      t.includes("karnah") ||
      f.includes("tangdhar") ||
      t.includes("tangdhar") ||
      f.includes("uri");

    const isPilgrimage =
      f.includes("katra") ||
      t.includes("katra") ||
      f.includes("banganga") ||
      t.includes("banganga") ||
      f.includes("baltal") ||
      t.includes("baltal") ||
      f.includes("nunwan") ||
      t.includes("nunwan");

    const viability = getVehicleRouteViability(vehicle, km, from, to);
    const isRangeWarning = viability.isViable && (vehicle === "e-rickshaw" || vehicle === "e-auto") && km > 6;

    return {
      isBatamalooNorthRedirect,
      isWinterClosure,
      isFrontier,
      isPilgrimage,
      isRangeWarning,
      viability,
    };
  }, [from, to, distance, vehicle]);

  const displayFare = useMemo(() => {
    if (!fareParts.isViable) {
      return 0;
    }
    if (!chosenVehicle.isPerSeat) {
      return fareParts.totalSingle;
    }
    return priceMode === "full-cab" ? fareParts.fullCabCost : fareParts.totalSingle;
  }, [chosenVehicle, fareParts, priceMode]);

  const showToast = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleSwap = () => {
    const oldFrom = from;
    const oldTo = to;
    setFrom(oldTo);
    setTo(oldFrom);
    syncRouteDistance(oldTo, oldFrom);
    showToast(`Swapped: ${oldTo} ⇄ ${oldFrom}`);
  };

  const handleSelectPreset = (preset) => {
    setFrom(preset.from);
    setTo(preset.to);
    setDistance(String(preset.distance));
    if (preset.region) setTerrainRegion(preset.region);
    showToast(`Loaded ${preset.from} ➔ ${preset.to} (${preset.distance} km)`);
  };

  const handleFromChange = (val) => {
    setFrom(val);
    syncRouteDistance(val, to);
  };

  const handleToChange = (val) => {
    setTo(val);
    syncRouteDistance(from, val);
  };

  const handleLocationPick = (type, loc) => {
    if (type === "from") {
      setFrom(loc);
      setSearchFromFocus(false);
      syncRouteDistance(loc, to);
    } else {
      setTo(loc);
      setSearchToFocus(false);
      syncRouteDistance(from, loc);
    }
    showToast(`Selected: ${loc}`);
  };

  const handleShare = () => {
    let text = "";
    if (hasRoute && !fareParts.isViable) {
      text = `🚗 Safar Advisory: ${chosenVehicle.label} does not service ${from} to ${to} (${distance} km). Recommended: ${fareParts.viability.alternativeName}. Check official J&K transit rates on Safar.`;
    } else {
      text = `🚗 Safar Fare Estimate: ${from} to ${to} (${distance} km) via ${chosenVehicle.label} is ₹${displayFare}. Official J&K transit rates on Safar.`;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Fare & route details copied to clipboard!");
    } else {
      showToast("Ready to share!");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f1] text-[#23383b] flex flex-col font-sans">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#fbfcf8]/90 backdrop-blur-md border-b border-[#dce5dc] px-4 sm:px-6 lg:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#345657] hover:bg-[#eaf0e9] transition"
              aria-label="Open Menu"
            >
              <Menu size={22} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#234b4c] text-[#f2bd70] shadow-[0_4px_12px_rgba(35,75,76,0.25)]">
                <Navigation size={20} className="transform -rotate-12" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d36b3d] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d36b3d]"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-[#234b4c]">SAFAR</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#eaf0e9] text-[#557b72] border border-[#d8e3d8]">
                    J&K
                  </span>
                </div>
                <p className="text-[12px] text-[#4a6d65] font-bold hidden sm:block tracking-wide" dir="rtl" lang="ur">
                  منزل سے بہتر ہے سفر
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#eaf0e9]/80 p-1 rounded-2xl border border-[#dce5dc]">
            {[
              { label: "Fare calculator", icon: Calculator },
              { label: "Route guide", icon: Route },
              { label: "Recent estimates", icon: Clock3 },
              { label: "Official rate card", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveNav(item.label);
                    showToast(`Switched to ${item.label}`);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#234b4c] text-[#f4f6ed] shadow-sm"
                      : "text-[#557b72] hover:text-[#234b4c] hover:bg-[#dce5dc]/50"
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf5ee] border border-[#d2e4d4] text-[11px] text-[#426a54] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#529b68] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#529b68]"></span>
              </span>
              <span>2026 Revised Rates</span>
            </div>

            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-[#345657] bg-[#f0f4ee] hover:bg-[#e4ece2] border border-[#dce5dc] transition"
              title="How Safar Works"
            >
              <CircleHelp size={16} className="text-[#d36b3d]" />
              <span className="hidden sm:inline">Help</span>
            </button>

            {/* Passenger Hub — replaces Defense Suite & notifications */}
            <button
              id="passengerRightsBtn"
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-[#345657] bg-[#f0f4ee] hover:bg-[#e4ece2] border border-[#dce5dc] transition"
              title="Passenger Rights & Helplines"
            >
              <ShieldCheck size={16} className="text-[#557b72]" />
              <span className="hidden sm:inline">Rights</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-full bg-[#fbfcf8] h-full shadow-2xl p-5 flex flex-col z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#dce5dc]">
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-[#234b4c]" />
                <span className="font-bold text-lg text-[#234b4c]">SAFAR J&K</span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-[#78908a] hover:bg-[#eaf0e9]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="mt-6 space-y-1.5 flex-1">
              {[
                { label: "Fare calculator", icon: Calculator, desc: "Instant trip cost estimate" },
                { label: "Route guide", icon: Route, desc: "Popular corridors & highway info" },
                { label: "Recent estimates", icon: Clock3, desc: "Your recent route calculations" },
                { label: "Official rate card", icon: FileText, desc: "Government SRO rules & rights" },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveNav(item.label);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition ${
                      active
                        ? "bg-[#234b4c] text-[#f4f6ed]"
                        : "text-[#345657] hover:bg-[#eaf0e9]"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-[#f2bd70]" : "text-[#557b72]"} />
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className={`text-[10px] ${active ? "text-[#dce5dc]" : "text-[#78908a]"}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeNav === "Fare calculator" && (
          <div className="space-y-6">
            {/* Hero Card */}
            <section className="bg-gradient-to-r from-[#234b4c] via-[#2c5b5c] to-[#345657] rounded-3xl p-6 sm:p-8 text-[#f4f6ed] shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Know what you owe <br className="hidden sm:block" />
                  before you go.
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[#c7dad0] leading-relaxed">
                  Statutory fare estimates for Shared Cabs, Autos, Matadors, and Private Taxis — every route, every mode, across Jammu & Kashmir.
                </p>
              </div>
            </section>

            {/* Quick 1-Click Popular Corridor Pills (Adapted to Selected Vehicle) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-bold text-[#78908a] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Compass size={14} /> Quick Trips ({chosenVehicle.label.split(" ")[0]}):
              </span>
              {activePresets.map((preset) => (
                <button
                  key={`${preset.from}-${preset.to}`}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                    from === preset.from && to === preset.to
                      ? "bg-[#234b4c] text-[#f4f6ed] border-[#234b4c] shadow-sm"
                      : "bg-[#fbfcf8] text-[#345657] border-[#dce5dc] hover:border-[#74a181] hover:bg-[#edf5ee]"
                  }`}
                >
                  {preset.from} ➔ {preset.to} ({preset.distance} km)
                </button>
              ))}
            </div>

            {/* Main Interactive Calculation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Vehicle Selection First (Step 1) & Route Builder (Step 2) (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Step 1: Vehicle Selection Cards */}
                <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#e5ece3]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center font-black text-xs shadow-xs">
                        1
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-[#234b4c]">Choose Your Vehicle Mode</h2>
                          <span className="hidden sm:inline-block text-[10px] font-bold bg-[#eef4ed] text-[#3f6e5b] border border-[#d2e4d4] px-2 py-0.5 rounded-full">
                            Visual Setup
                          </span>
                        </div>
                        <p className="text-[11px] text-[#78908a]">
                          Official statutory tariffs & authentic visual models across Jammu & Kashmir (11 Categories)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {/* View Mode Toggle */}
                      <div className="flex items-center p-1 bg-[#edf3eb] rounded-xl border border-[#dce5dc]">
                        <button
                          onClick={() => setVehicleViewMode("visual")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            vehicleViewMode === "visual"
                              ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                              : "text-[#557b72] hover:text-[#234b4c]"
                          }`}
                          title="Visual Vehicle Cards with Renders"
                        >
                          <LayoutGrid size={13} />
                          <span className="hidden xs:inline">Visual</span>
                        </button>
                        <button
                          onClick={() => setVehicleViewMode("compact")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            vehicleViewMode === "compact"
                              ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                              : "text-[#557b72] hover:text-[#234b4c]"
                          }`}
                          title="Compact List View"
                        >
                          <List size={13} />
                          <span className="hidden xs:inline">Compact</span>
                        </button>
                      </div>

                      {/* Fleet Guide Modal Button */}
                      <button
                        onClick={() => {
                          setInspectedVehicleKey(vehicle);
                          setShowFleetGuide(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eef4ed] text-[#234b4c] hover:bg-[#dfebe0] border border-[#d2e4d4] text-xs font-bold transition shadow-xs"
                        title="Open Vehicle Identification & Recognition Guide"
                      >
                        <Eye size={13} className="text-[#3f6e5b]" />
                        <span>Fleet Guide</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3.5 scrollbar-none">
                    {vehicleCategories.map((cat) => {
                      const count = categoryCounts[cat.key] ?? 0;
                      return (
                        <button
                          key={cat.key}
                          onClick={() => setVehicleCategoryFilter(cat.key)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition ${
                            vehicleCategoryFilter === cat.key
                              ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                              : "bg-[#f0f4ee] text-[#557b72] hover:bg-[#e4ece2]"
                          }`}
                        >
                          {cat.label.replace(/\(\d+\)/, `(${count})`)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Pre-selection Neutral Route Guidance Banner (Gap 4) */}
                  {!hasRoute && (
                    <div className="p-3.5 mb-3.5 rounded-2xl bg-[#eef4ed] border border-[#d2e4d4] flex items-center gap-2.5 text-xs text-[#234b4c]">
                      <Info size={16} className="text-[#3f6e5b] shrink-0" />
                      <span>
                        Select your route in Step 2 to view authorized statutory vehicles for your specific corridor.
                      </span>
                    </div>
                  )}

                  {/* Vehicle Grid & Secondary Rule: Zero-Eligible State */}
                  {hasRoute && visibleVehicles.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#fdf5f2] border border-[#f3d3c8] text-center my-2">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#fee2e2] flex items-center justify-center text-[#b91c1c] shadow-xs">
                        <ShieldAlert size={24} />
                      </div>
                      <h3 className="font-bold text-base text-[#9a3412]">
                        No registered vehicle category operates this route.
                      </h3>
                      <p className="text-xs text-[#78908a] mt-2 max-w-md mx-auto leading-relaxed">
                        Under official J&amp;K Transport Department licensing, no registered vehicle category is authorized to service this route corridor ({currentRouteProfile?.region?.toUpperCase()} • {currentRouteProfile?.routeType?.toUpperCase()}). Please adjust your pickup and drop points or choose another route.
                      </p>
                    </div>
                  ) : vehicleViewMode === "visual" ? (
                    /* Visual Rich Cards View (Uber / Chalo Style) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {visibleVehicles.map((v) => {
                        const selected = vehicle === v.key || vehicle === v.id;
                        const km = Number(distance) || 0;
                        const cardViability = getVehicleRouteViability(v.key, km, from, to);
                        const visualMeta = VEHICLE_VISUAL_META[v.key];
                        let cardFare = 0;
                        if (km > 0 && cardViability.isViable) {
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
                                const rate = terrainRegion === "kashmir-plain" ? 1.64 : terrainRegion === "kashmir-hill" ? 1.88 : terrainRegion === "jammu-plain" ? 1.12 : 1.59;
                                cardFare = Math.max(10, Math.round(km * rate));
                              }
                              break;
                            case "stage-carriage-big":
                              {
                                const rate = terrainRegion === "kashmir-plain" ? 1.40 : terrainRegion === "kashmir-hill" ? 1.64 : terrainRegion === "jammu-plain" ? 1.12 : 1.59;
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

                        return (
                          <button
                            key={v.key}
                            onClick={() => {
                              setVehicle(v.key);
                              showToast(`Selected ${v.label}`);
                            }}
                            className={`group relative p-3 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                              selected
                                ? "bg-[#f4f7f2] border-[#234b4c] shadow-md ring-2 ring-[#234b4c]/10"
                                : !cardViability.isViable && hasRoute
                                ? "bg-[#fdfaf8] border-[#ebdcd5] hover:border-[#d99f90] opacity-90"
                                : "bg-[#fbfcf8] border-[#e2eae0] hover:border-[#adc9b2] hover:bg-[#f8faf6]"
                            }`}
                          >
                            {/* Vehicle Illustration Showcase Container */}
                            <div
                              className={`w-full h-24 rounded-xl relative overflow-hidden flex items-center justify-center p-2 mb-2.5 transition-colors border ${
                                selected
                                  ? "bg-gradient-to-b from-[#e7f0ea] to-[#d6e7db] border-[#234b4c]/30"
                                  : "bg-gradient-to-b from-[#f5f8f3] to-[#ebf1e9] border-[#e0eae0] group-hover:from-[#eef4ec] group-hover:to-[#e4ece2]"
                              }`}
                            >
                              <VehicleIllustration
                                vehicleKey={v.key}
                                className="w-full h-full object-contain filter drop-shadow-xs transform group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Top-Left Badge: Vehicle Badge */}
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                <span
                                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                                    selected
                                      ? "bg-[#234b4c] text-[#f4f6ed]"
                                      : "bg-[#234b4c]/80 text-[#f4f6ed] backdrop-blur-xs"
                                  }`}
                                >
                                  {v.badge}
                                </span>
                              </div>

                              {/* Top-Right Badge: Calculated Fare or Status */}
                              <div className="absolute top-2 right-2">
                                {hasRoute && !cardViability.isViable ? (
                                  <span className="text-[10px] font-bold text-[#b91c1c] bg-[#fee2e2] px-2 py-0.5 rounded-md border border-[#fca5a5] shadow-xs">
                                    Not Available
                                  </span>
                                ) : hasRoute && cardFare > 0 ? (
                                  <span className="text-[11px] font-black text-[#234b4c] bg-[#ffffff] px-2 py-0.5 rounded-lg border border-[#d2e4d4] shadow-xs">
                                    ₹{cardFare}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-[#557b72] bg-[#ffffff]/90 px-2 py-0.5 rounded-md border border-[#e2eae0] shadow-xs">
                                    {v.calcType === "urban-stage" ? "₹8-₹18" : v.calcType === "stage-slab" ? "₹9-₹26" : `₹${v.perKm}/km`}
                                  </span>
                                )}
                              </div>

                              {/* Bottom-Left Hallmark Tag */}
                              <div className="absolute bottom-1.5 left-2">
                                <span className="text-[9px] font-semibold text-[#557b72] bg-white/85 px-1.5 py-0.5 rounded border border-[#dce5dc]/60 truncate max-w-[170px] inline-block">
                                  {visualMeta?.name || v.label}
                                </span>
                              </div>
                            </div>

                            {/* Card Content */}
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="font-bold text-[13px] text-[#234b4c]">{v.label}</h3>
                                  {selected && <CheckCircle2 size={14} className="text-[#557b72]" />}
                                </div>
                                <span className="text-[10px] font-bold text-[#3f6e5b] bg-[#edf3eb] px-1.5 py-0.5 rounded">
                                  {v.capacity}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-[#78908a] mt-0.5">{v.sublabel}</p>
                              
                              {/* Real-World Spotting Hallmark */}
                              <p className="text-[10px] text-[#5c7a73] line-clamp-1 mt-1 font-medium">
                                <strong className="text-[#234b4c]">Spot:</strong> {visualMeta?.hallmark}
                              </p>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-2.5 pt-2 border-t border-[#e2eae0] flex items-center justify-between text-[11px]">
                              <span className="text-[#78908a] text-[10.5px]">
                                {v.isPerSeat ? "Per Seat" : "Full Cab"}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#234b4c]">
                                  {v.calcType === "stage-slab"
                                    ? "Stage Slabs"
                                    : v.calcType === "urban-stage"
                                    ? "Urban Slabs"
                                    : v.calcType === "tourist-group"
                                    ? "₹2.25/km"
                                    : v.calcType === "e-auto"
                                    ? "₹20/km"
                                    : v.calcType === "metered-auto"
                                    ? "₹7.40/km"
                                    : `₹${v.perKm}/km`}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectedVehicleKey(v.key);
                                    setShowFleetGuide(true);
                                  }}
                                  className="text-[10px] text-[#78908a] hover:text-[#234b4c] p-0.5 rounded hover:bg-[#edf3eb]"
                                  title="View Identification Specs"
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Compact List View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {visibleVehicles.map((v) => {
                        const selected = vehicle === v.key || vehicle === v.id;
                        const km = Number(distance) || 0;
                        const cardViability = getVehicleRouteViability(v.key, km, from, to);
                        let cardFare = 0;
                        if (km > 0 && cardViability.isViable) {
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
                                const rate = terrainRegion === "kashmir-plain" ? 1.64 : terrainRegion === "kashmir-hill" ? 1.88 : terrainRegion === "jammu-plain" ? 1.12 : 1.59;
                                cardFare = Math.max(10, Math.round(km * rate));
                              }
                              break;
                            case "stage-carriage-big":
                              {
                                const rate = terrainRegion === "kashmir-plain" ? 1.40 : terrainRegion === "kashmir-hill" ? 1.64 : terrainRegion === "jammu-plain" ? 1.12 : 1.59;
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

                        return (
                          <button
                            key={v.key}
                            onClick={() => {
                              setVehicle(v.key);
                              showToast(`Selected ${v.label}`);
                            }}
                            className={`p-3 rounded-2xl text-left border-2 transition-all flex items-center gap-3 ${
                              selected
                                ? "bg-[#f4f7f2] border-[#234b4c] shadow-md ring-2 ring-[#234b4c]/10"
                                : !cardViability.isViable && hasRoute
                                ? "bg-[#fdfaf8] border-[#ebdcd5] hover:border-[#d99f90] opacity-90"
                                : "bg-[#fbfcf8] border-[#e2eae0] hover:border-[#adc9b2] hover:bg-[#f8faf6]"
                            }`}
                          >
                            <div className="w-16 h-12 shrink-0 rounded-xl bg-[#edf3eb] p-1 flex items-center justify-center border border-[#dce5dc] overflow-hidden">
                              <VehicleIllustration vehicleKey={v.key} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="font-bold text-xs text-[#234b4c] truncate">{v.label}</h3>
                                {hasRoute && !cardViability.isViable ? (
                                  <span className="text-[9px] font-bold text-[#b91c1c] bg-[#fee2e2] px-1.5 py-0.5 rounded border border-[#fca5a5]">
                                    NA
                                  </span>
                                ) : hasRoute && cardFare > 0 ? (
                                  <span className="text-[11px] font-black text-[#234b4c]">
                                    ₹{cardFare}
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] font-bold text-[#557b72]">
                                    {v.calcType === "urban-stage" ? "₹8-₹18" : v.calcType === "stage-slab" ? "₹9-₹26" : `₹${v.perKm}/km`}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#78908a] truncate">{v.sublabel}</p>
                              <div className="flex items-center gap-1 mt-1 text-[9.5px] text-[#557b72]">
                                <span>{v.capacity}</span>
                                <span>•</span>
                                <span className="font-semibold">{v.badge}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step 2: Route Builder Box */}
                <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#e5ece3]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center font-black text-xs shadow-xs">
                        2
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#234b4c]">Where are you traveling?</h2>
                        <p className="text-[11px] text-[#78908a]">Enter boarding point & drop-off destination in J&K</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setFrom("");
                        setTo("");
                        setDistance("");
                        setTerrainRegion("kashmir-plain");
                        showToast("Cleared route inputs. Choose your points!");
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-[#78908a] hover:text-[#d36b3d] transition"
                    >
                      <RefreshCw size={13} />
                      <span>Clear</span>
                    </button>
                  </div>

                  {/* Route Inputs with Swap Action */}
                  <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_48px_1fr] items-center gap-3">
                    {/* From Input */}
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-[#78908a] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#d36b3d]"></span> Boarding Point (Pickup)
                      </label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-3.5 top-3.5 text-[#d36b3d]" />
                        <input
                          type="text"
                          value={from}
                          onFocus={() => setSearchFromFocus(true)}
                          onChange={(e) => handleFromChange(e.target.value)}
                          placeholder="e.g. Srinagar, Lal Chowk, Katra"
                          className="w-full pl-10 pr-3 py-3 rounded-2xl bg-[#f6f8f3] border border-[#dce5dc] text-sm font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181] focus:bg-[#fbfcf8] transition"
                        />
                      </div>

                      {/* Autocomplete Dropdown for FROM */}
                      {searchFromFocus && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl shadow-xl p-2 z-30 max-h-56 overflow-y-auto">
                          <div className="flex items-center justify-between px-2 py-1 border-b border-[#e5ece3] mb-1">
                            <p className="text-[10px] font-bold text-[#78908a] uppercase">
                              Alphabetical Hubs (A-Z)
                            </p>
                            <span className="text-[9px] font-bold text-[#557b72] bg-[#edf5ee] px-1.5 py-0.5 rounded">
                              22 Districts
                            </span>
                          </div>
                          {popularLocations
                            .filter((loc) => loc.toLowerCase().includes(from.toLowerCase()))
                            .sort((a, b) => a.localeCompare(b))
                            .map((loc) => (
                              <button
                                key={loc}
                                onClick={() => handleLocationPick("from", loc)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#345657] hover:bg-[#edf5ee] flex items-center justify-between transition"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-[#eaf0e9] text-[#234b4c] text-[10px] font-extrabold flex items-center justify-center">
                                    {loc[0].toUpperCase()}
                                  </span>
                                  <span>{loc}</span>
                                </span>
                                <ChevronRight size={13} className="text-[#78908a]" />
                              </button>
                            ))}
                          <button
                            onClick={() => setSearchFromFocus(false)}
                            className="w-full mt-1.5 text-center text-[11px] font-bold text-[#78908a] py-1 hover:text-[#d36b3d]"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center my-1 sm:my-0">
                      <button
                        onClick={handleSwap}
                        className="w-10 h-10 rounded-2xl bg-[#edf3eb] hover:bg-[#dce9dc] border border-[#dce5dc] text-[#345657] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                        title="Swap Origin & Destination"
                        aria-label="Swap Route"
                      >
                        <ArrowDownUp size={16} />
                      </button>
                    </div>

                    {/* To Input */}
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-[#78908a] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#557b72]"></span> Deboarding Point (Drop-off)
                      </label>
                      <div className="relative">
                        <MapPinned size={18} className="absolute left-3.5 top-3.5 text-[#557b72]" />
                        <input
                          type="text"
                          value={to}
                          onFocus={() => setSearchToFocus(true)}
                          onChange={(e) => handleToChange(e.target.value)}
                          placeholder="e.g. Gulmarg, Pahalgam, Jammu"
                          className="w-full pl-10 pr-3 py-3 rounded-2xl bg-[#f6f8f3] border border-[#dce5dc] text-sm font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181] focus:bg-[#fbfcf8] transition"
                        />
                      </div>

                      {/* Autocomplete Dropdown for TO */}
                      {searchToFocus && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl shadow-xl p-2 z-30 max-h-56 overflow-y-auto">
                          <div className="flex items-center justify-between px-2 py-1 border-b border-[#e5ece3] mb-1">
                            <p className="text-[10px] font-bold text-[#78908a] uppercase">
                              Alphabetical Destinations (A-Z)
                            </p>
                            <span className="text-[9px] font-bold text-[#557b72] bg-[#edf5ee] px-1.5 py-0.5 rounded">
                              22 Districts
                            </span>
                          </div>
                          {popularLocations
                            .filter((loc) => loc.toLowerCase().includes(to.toLowerCase()))
                            .sort((a, b) => a.localeCompare(b))
                            .map((loc) => (
                              <button
                                key={loc}
                                onClick={() => handleLocationPick("to", loc)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#345657] hover:bg-[#edf5ee] flex items-center justify-between transition"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-[#eaf0e9] text-[#234b4c] text-[10px] font-extrabold flex items-center justify-center">
                                    {loc[0].toUpperCase()}
                                  </span>
                                  <span>{loc}</span>
                                </span>
                                <ChevronRight size={13} className="text-[#78908a]" />
                              </button>
                            ))}
                          <button
                            onClick={() => setSearchToFocus(false)}
                            className="w-full mt-1.5 text-center text-[11px] font-bold text-[#78908a] py-1 hover:text-[#d36b3d]"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real-time Dynamic Route & Highway Distance Card */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-[#edf5ee] border border-[#d2e4d4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center font-bold text-xs shrink-0">
                        <Route size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#234b4c]">
                            {hasRoute ? `${from} ➔ ${to}` : "Choose Boarding & Deboarding Points"}
                          </span>
                          {hasRoute && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#345657] text-[#f4f6ed]">
                              {distance || 0} KM
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#557b72] font-medium mt-0.5">
                          {hasRoute
                            ? `⏱️ Approx ${currentRouteMeta.duration} · 🏔️ ${currentRouteMeta.terrain}`
                            : "Select starting point and destination to calculate statutory fare"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[11px] font-bold text-[#78908a] hidden md:inline">
                        Manual override:
                      </span>
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="1"
                          max="800"
                          value={distance}
                          onChange={(e) => setDistance(e.target.value)}
                          placeholder="KM"
                          className="w-full py-1 pl-2 pr-7 rounded-xl bg-[#fbfcf8] border border-[#c5d8c8] text-xs font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181]"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] font-bold text-[#78908a]">
                          KM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Border / Mountain Gateway Ambiguity Confirmation Prompt (Risk 3) */}
                  {hasRoute && currentRouteProfile?.isAmbiguous && (
                    <div className="mt-3.5 p-3.5 rounded-2xl bg-[#fefce8] border border-[#fef08a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#854d0e] shadow-xs">
                      <div className="flex items-start sm:items-center gap-2">
                        <Info size={16} className="text-[#ca8a04] shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <p className="font-bold text-[12px] text-[#713f12]">Gateway Waypoint Detected:</p>
                          <p className="text-[11px] text-[#854d0e] mt-0.5">
                            {currentRouteProfile.ambiguityNote || "Border / Gateway corridor detected. Confirm travel division:"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setUserRegionOverride("jammu")}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                            userRegionOverride === "jammu"
                              ? "bg-[#854d0e] text-[#fefce8] shadow-xs"
                              : "bg-[#fef9c3] hover:bg-[#fef08a] text-[#854d0e] border border-[#fde047]"
                          }`}
                        >
                          Jammu Division
                        </button>
                        <button
                          onClick={() => setUserRegionOverride("kashmir")}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                            userRegionOverride === "kashmir"
                              ? "bg-[#854d0e] text-[#fefce8] shadow-xs"
                              : "bg-[#fef9c3] hover:bg-[#fef08a] text-[#854d0e] border border-[#fde047]"
                          }`}
                        >
                          Kashmir Division
                        </button>
                        <button
                          onClick={() => setUserRegionOverride("both")}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                            userRegionOverride === "both"
                              ? "bg-[#854d0e] text-[#fefce8] shadow-xs"
                              : "bg-[#fef9c3] hover:bg-[#fef08a] text-[#854d0e] border border-[#fde047]"
                          }`}
                        >
                          Cross-Division
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Real-time Contextual Alerts (Batamaloo Redirect, Winter Mountain Closures, Frontier & Pilgrimage) */}
                  {contextAlerts.isBatamalooNorthRedirect && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-[#fdf5eb] border border-[#f0cfa0] text-[#784319] text-xs flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-[#d36b3d] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[12px]">Stand Shift Notice (Parimpora Terminal):</p>
                        <p className="text-[11px] mt-0.5 text-[#8f5223]">
                          North-bound cabs & buses depart from <strong>Parimpora Regional Stand</strong>. From Batamaloo, take a local city Matador/E-Auto (₹10–15) to Parimpora for Baramulla, Sopore, Kupwara & Uri.
                        </p>
                      </div>
                    </div>
                  )}

                  {contextAlerts.isWinterClosure && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-[#ebf3f7] border border-[#a8c9db] text-[#1f4860] text-xs flex items-start gap-2.5">
                      <Snowflake size={16} className="text-[#2b6cb0] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[12px]">Seasonal Mountain Pass Advisory:</p>
                        <p className="text-[11px] mt-0.5 text-[#2c5282]">
                          High-altitude corridors (Mughal Road / Sinthan Top / Razdan Pass) are closed in winter due to snow. Regular transit routes divert via NH-44 highway.
                        </p>
                      </div>
                    </div>
                  )}

                  {hasRoute && !contextAlerts.viability.isViable && (
                    <div className="mt-3.5 p-3.5 rounded-2xl bg-[#fff2f2] border border-[#fca5a5] text-[#991b1b] text-xs flex items-start gap-2.5 shadow-sm">
                      <ShieldAlert size={18} className="text-[#dc2626] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-[12px] text-[#991b1b]">
                            Route Not Serviced by {chosenVehicle.label}
                          </p>
                          <span className="text-[10px] font-extrabold bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 rounded-full border border-[#f87171] shrink-0">
                            Fare Not Available
                          </span>
                        </div>
                        <p className="text-[11px] mt-1 text-[#7f1d1d] leading-relaxed">
                          {contextAlerts.viability.reason} For <strong>{from || "Origin"} ➔ {to || "Destination"}</strong> ({distance} km), commuters use <strong>{contextAlerts.viability.alternativeName}</strong>.
                        </p>
                        <button
                          onClick={() => {
                            setVehicle(contextAlerts.viability.alternativeKey);
                            showToast(`Switched to ${contextAlerts.viability.alternativeName}`);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#dc2626] text-white font-bold text-[11px] hover:bg-[#b91c1c] transition shadow-xs"
                        >
                          <ArrowRight size={12} />
                          Switch to {contextAlerts.viability.alternativeName}
                        </button>
                      </div>
                    </div>
                  )}

                  {contextAlerts.isFrontier && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-[#f0f4ee] border border-[#c3d8c6] text-[#234b4c] text-xs flex items-start gap-2.5">
                      <ShieldCheck size={16} className="text-[#557b72] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[12px]">Frontier / Border Transit Zone:</p>
                        <p className="text-[11px] mt-0.5 text-[#345657]">
                          Movement through border/pass areas (Gurez, Karnah, Uri border) is subject to civil/army convoy timings, identity verification, and weather clearance.
                        </p>
                      </div>
                    </div>
                  )}

                  {contextAlerts.isPilgrimage && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-[#fbf5e6] border border-[#f0d898] text-[#6b4710] text-xs flex items-start gap-2.5">
                      <Sparkles size={16} className="text-[#b7791f] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[12px]">Pilgrimage Corridor Statutory Tariffs:</p>
                        <p className="text-[11px] mt-0.5 text-[#744210]">
                          Official registered stand rates apply for Shri Mata Vaishno Devi (Katra) and Shri Amarnathji Yatra base camps (Baltal & Nunwan).
                        </p>
                      </div>
                    </div>
                  )}

                  {contextAlerts.isRangeWarning && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-[#fff8eb] border border-[#f9dca2] text-[#8a5314] text-xs flex items-start gap-2.5">
                      <Zap size={16} className="text-[#d36b3d] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[12px]">Urban Range Notice:</p>
                        <p className="text-[11px] mt-0.5 text-[#975a16]">
                          E-Rickshaws and E-Autos operate within municipal limits (1–8 km). For highway transit ({distance} km), commuters use Shared Maxi-Cabs or Matadors.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Distance & Region Controls */}
                  <div className="mt-3 pt-3 border-t border-[#eaf0e9] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#557b72]">
                      <Navigation size={13} className="text-[#d36b3d]" />
                      <span className="text-[11px]">
                        <strong>Corridor:</strong> {hasRoute ? currentRouteMeta.highway : "Select route"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#345657]">Region/Terrain:</span>
                      <select
                        value={terrainRegion}
                        onChange={(e) => setTerrainRegion(e.target.value)}
                        className="py-1 px-2 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-xs font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181]"
                      >
                        <option value="kashmir-plain">Kashmir Plains (₹1.64/km)</option>
                        <option value="kashmir-hill">Kashmir Hilly (₹1.88/km)</option>
                        <option value="jammu-plain">Jammu Plains (₹1.12/km)</option>
                        <option value="jammu-hill">Jammu Hilly (₹1.59/km)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Fare Result Card & Breakdown (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Result Evergreen Hero Card */}
                <div className="relative bg-gradient-to-br from-[#234b4c] via-[#204445] to-[#183637] rounded-3xl p-6 sm:p-7 text-[#f4f6ed] shadow-xl overflow-hidden border border-[#3c6b69]">
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#f2bd70] bg-[#f2bd70]/15 px-2.5 py-1 rounded-full border border-[#f2bd70]/25">
                        <CircleGauge size={13} />
                        <span>Official Fare Estimate</span>
                      </div>
                      {hasRoute && (
                        <p className="text-xs text-[#c4d6cb] mt-2 font-medium">
                          {from} <ArrowRight size={12} className="inline mx-1" /> {to}
                        </p>
                      )}
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      hasRoute && fareParts.isZeroEligible
                        ? "bg-[#782323] text-[#fca5a5] border-[#a33737]"
                        : hasRoute && !fareParts.isViable
                        ? "bg-[#782323] text-[#fca5a5] border-[#a33737]"
                        : "bg-[#386260] text-[#cbe1d3] border-[#4d7f7c]"
                    }`}>
                      {hasRoute && fareParts.isZeroEligible
                        ? "No Category"
                        : hasRoute && !fareParts.isViable
                        ? "Non-Serviced Route"
                        : "Verified Rate"}
                    </span>
                  </div>

                  {/* Price Mode Switcher (Per Seat vs Full Cab) */}
                  {chosenVehicle.isPerSeat && fareParts.isViable && !fareParts.isZeroEligible ? (
                    <div className="relative z-10 mt-4 flex items-center bg-[#183637]/70 p-1 rounded-xl border border-[#386260]">
                      <button
                        onClick={() => setPriceMode("per-seat")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          priceMode === "per-seat"
                            ? "bg-[#d36b3d] text-[#ffffff] shadow-sm"
                            : "text-[#c4d6cb] hover:text-[#ffffff]"
                        }`}
                      >
                        Per Seat Fare
                      </button>
                      <button
                        onClick={() => setPriceMode("full-cab")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          priceMode === "full-cab"
                            ? "bg-[#d36b3d] text-[#ffffff] shadow-sm"
                            : "text-[#c4d6cb] hover:text-[#ffffff]"
                        }`}
                      >
                        Entire Vehicle ({chosenVehicle.seatsMultiplier} Seats)
                      </button>
                    </div>
                  ) : null}

                  {/* Big Live Price Display */}
                  <div className="relative z-10 mt-4">
                    <p className="text-[11px] text-[#aac2b3] font-medium">Govt Approved Fare Range</p>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mt-1">
                      <span className={`tracking-tight font-black ${
                        !hasRoute || (fareParts.isViable && displayFare > 0)
                          ? "text-4xl sm:text-5xl text-[#ffffff]"
                          : "text-2xl sm:text-3xl text-[#ffcaca]"
                      }`}>
                        {!hasRoute
                          ? "₹ —"
                          : fareParts.isZeroEligible
                          ? "No Registered Vehicle"
                          : fareParts.isViable && displayFare > 0
                          ? `₹${displayFare.toLocaleString("en-IN")}`
                          : "Fare Not Available"}
                      </span>
                      <span className="text-xs text-[#f2bd70] font-semibold">
                        {!hasRoute
                          ? "(Choose route to calculate)"
                          : fareParts.isZeroEligible
                          ? "(No registered vehicle category operates this route)"
                          : !fareParts.isViable
                          ? `(${chosenVehicle.label} does not operate on ${distance} km route)`
                          : !chosenVehicle.isPerSeat
                          ? `(Entire ${chosenVehicle.label})`
                          : priceMode === "full-cab"
                          ? `(Entire Vehicle - ${chosenVehicle.seatsMultiplier} Seats)`
                          : "(Per Passenger Seat)"}
                      </span>
                    </div>
                  </div>

                  {/* Selected Vehicle Visual Showcase & Road Recognition */}
                  <div className="relative z-10 mt-4 pt-3.5 border-t border-[#3c6b69]/70">
                    <div className="p-3 rounded-2xl bg-[#142e2f]/90 border border-[#386260]/80 flex flex-col sm:flex-row items-center gap-3 shadow-inner">
                      <div className="w-full sm:w-36 h-20 shrink-0 bg-gradient-to-b from-[#193a3c] to-[#102728] rounded-xl p-1.5 flex items-center justify-center border border-[#3c6b69]/60 overflow-hidden relative group">
                        <VehicleIllustration
                          vehicleKey={chosenVehicle.key}
                          className="w-full h-full object-contain filter drop-shadow-xs transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 right-1 text-[8.5px] font-black px-1.5 py-0.5 rounded bg-[#234b4c] text-[#f2bd70] border border-[#386260]/60">
                          {chosenVehicle.badge}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 text-left w-full">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-[#ffffff] truncate">
                            {VEHICLE_VISUAL_META[chosenVehicle.key]?.name || chosenVehicle.label}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setInspectedVehicleKey(chosenVehicle.key);
                              setShowFleetGuide(true);
                            }}
                            className="text-[10px] font-bold text-[#f2bd70] hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <span>Spotting Tip</span>
                            <ChevronRight size={11} />
                          </button>
                        </div>
                        <p className="text-[10.5px] text-[#b4d2c2] line-clamp-1 mt-0.5 font-medium">
                          <strong className="text-[#ffffff]">Hallmark:</strong> {VEHICLE_VISUAL_META[chosenVehicle.key]?.hallmark}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="bg-[#1b3d3f] text-[#cde2d6] px-2 py-0.5 rounded-md border border-[#386260]/70 font-semibold">
                            👥 {chosenVehicle.capacity}
                          </span>
                          <span className="bg-[#1b3d3f] text-[#cde2d6] px-2 py-0.5 rounded-md border border-[#386260]/70 font-semibold truncate max-w-[190px]" title={VEHICLE_VISUAL_META[chosenVehicle.key]?.luggage}>
                            🧳 {VEHICLE_VISUAL_META[chosenVehicle.key]?.luggage?.split("(")[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Specs Pill Row */}
                  <div className="relative z-10 grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#3c6b69]/70 text-xs">
                    <div className="bg-[#183637]/50 p-2.5 rounded-xl border border-[#386260]/60">
                      <p className="text-[10px] text-[#aac2b3]">Vehicle Type</p>
                      <p className="font-bold text-[#ffffff] truncate mt-0.5">{chosenVehicle.label}</p>
                    </div>
                    <div className="bg-[#183637]/50 p-2.5 rounded-xl border border-[#386260]/60">
                      <p className="text-[10px] text-[#aac2b3]">Calculated Distance</p>
                      <p className="font-bold text-[#ffffff] mt-0.5">{hasRoute && distance ? `${distance} KM` : "—"}</p>
                    </div>
                  </div>

                  {/* Share, Pass & Helpline Actions */}
                  <div className="relative z-10 mt-4 flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#f4f6ed] text-[#234b4c] font-bold text-xs hover:bg-[#e4eae0] transition shadow-sm"
                    >
                      <Share2 size={14} />
                      <span>Copy / Share</span>
                    </button>
                    {hasRoute && fareParts.isViable && displayFare > 0 && (
                      <button
                        onClick={() => setShowConductorSlip(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#d36b3d] text-[#ffffff] font-bold text-xs hover:bg-[#c05e32] transition shadow-sm"
                        title="Generate Digital Fare Pass"
                      >
                        <QrCode size={14} />
                        <span>Fare Pass</span>
                      </button>
                    )}
                    <button
                      onClick={() => showToast("Helpline 1033 is available 24/7 across J&K")}
                      className="p-2.5 rounded-xl bg-[#183637] text-[#f2bd70] hover:bg-[#152e2f] border border-[#386260] transition"
                      title="Helpline 1033"
                    >
                      <PhoneCall size={16} />
                    </button>
                  </div>
                </div>

                {/* Transparent Fare Breakdown Card */}
                <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e5ece3]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-[#557b72]" />
                      <h3 className="font-bold text-sm text-[#234b4c]">Fare Breakdown</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      hasRoute && fareParts.isZeroEligible
                        ? "bg-[#fee2e2] text-[#991b1b]"
                        : hasRoute && !fareParts.isViable
                        ? "bg-[#fee2e2] text-[#991b1b]"
                        : "bg-[#edf5ee] text-[#557b72]"
                    }`}>
                      {hasRoute && fareParts.isZeroEligible
                        ? "No Category"
                        : hasRoute && !fareParts.isViable
                        ? "Route Limit Exceeded"
                        : "Official Rate"}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#78908a]">Vehicle Category</span>
                      <span className="font-bold text-[#345657]">
                        {fareParts.isZeroEligible ? "None Authorized" : chosenVehicle.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#78908a]">Rate Basis</span>
                      <span className={`font-bold text-right max-w-[220px] truncate ${
                        !fareParts.isViable ? "text-[#b91c1c]" : "text-[#345657]"
                      }`}>
                        {fareParts.formulaDesc}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#78908a]">Total Road Distance</span>
                      <span className="font-bold text-[#345657]">{distance ? `${distance} KM` : "—"}</span>
                    </div>

                    <div className="pt-3 border-t border-[#e2eae0] flex items-center justify-between text-sm">
                      <span className="font-extrabold text-[#234b4c]">Total Payable Fare</span>
                      <span className={`font-extrabold text-base ${
                        fareParts.isViable && displayFare > 0 ? "text-[#d36b3d]" : "text-[#b91c1c]"
                      }`}>
                        {hasRoute && fareParts.isViable && displayFare > 0
                          ? `₹${displayFare.toLocaleString("en-IN")}`
                          : hasRoute && !fareParts.isViable
                          ? "Fare Not Available"
                          : "₹ —"}
                      </span>
                    </div>
                  </div>

                  {hasRoute && fareParts.isZeroEligible ? (
                    <div className="mt-3 p-3.5 rounded-xl bg-[#fff2f2] border border-[#fca5a5] text-[11px] text-[#991b1b]">
                      <p className="font-bold flex items-center gap-1.5 text-[12px]">
                        <ShieldAlert size={15} className="text-[#dc2626]" />
                        <span>No registered vehicle category operates this route.</span>
                      </p>
                      <p className="mt-1 text-[#7f1d1d] leading-relaxed">
                        Under official J&K Transport Department licensing, no registered public or commercial transit vehicle category is authorized to service this route corridor profile.
                      </p>
                    </div>
                  ) : hasRoute && !fareParts.isViable ? (
                    <div className="mt-3 p-3 rounded-xl bg-[#fff2f2] border border-[#fca5a5] text-[11px] text-[#991b1b]">
                      <p className="font-bold flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-[#dc2626]" />
                        <span>Vehicle Operational Limit Exceeded</span>
                      </p>
                      <p className="mt-1 text-[#7f1d1d] leading-relaxed">
                        {chosenVehicle.label} does not operate on this {distance} km corridor. Commuters take <strong>{fareParts.viability.alternativeName}</strong>.
                      </p>
                      <button
                        onClick={() => {
                          setVehicle(fareParts.viability.alternativeKey);
                          showToast(`Switched to ${fareParts.viability.alternativeName}`);
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#b91c1c] underline hover:text-[#991b1b]"
                      >
                        Switch to {fareParts.viability.alternativeName} ➔
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#edf5ee] border border-[#d2e4d4] flex items-center gap-2 text-[11px] text-[#345657]">
                      <CheckCircle2 size={14} className="text-[#557b72] shrink-0" />
                      <span><strong>All-Inclusive:</strong> This is the complete official fare. No extra boarding fee or hidden charges.</span>
                    </div>
                  )}
                </div>

                {/* Corridor Context Card */}
                <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e5ece3]">
                    <h3 className="font-bold text-sm text-[#234b4c]">Route Details</h3>
                    <span className="text-xs font-bold text-[#d36b3d]">{currentRouteMeta.duration}</span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#78908a]">Highway / Corridor:</span>
                      <span className="font-semibold text-[#345657]">{currentRouteMeta.highway}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#78908a]">Terrain:</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#eef4ed] font-semibold text-[#426a54] text-[11px]">
                        {currentRouteMeta.terrain} ({terrainRegion.replace("-", " ")})
                      </span>
                    </div>
                    {currentRouteMeta.stops && currentRouteMeta.stops.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] text-[#78908a] block mb-1">Key En-Route Stops:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentRouteMeta.stops.map((stop) => (
                            <span
                              key={stop}
                              className="px-2 py-0.5 rounded-lg bg-[#f0f4ee] border border-[#dce5dc] text-[10px] font-semibold text-[#345657]"
                            >
                              📍 {stop}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stage Explorer Tab */}
        {activeNav === "Route guide" && (
          <StageExplorer
            onUseRoute={(preset) => {
              handleSelectPreset(preset);
              setActiveNav("Fare calculator");
            }}
          />
        )}

        {activeNav === "Recent estimates" && (
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#234b4c] pb-4 border-b border-[#e5ece3]">
              Recent Calculations
            </h2>
            <div className="mt-6 space-y-3">
              {recentEstimatesList.map((item) => (
                <div key={item.route} className="p-4 rounded-2xl bg-[#f8faf6] border border-[#e2eae0] flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-[#234b4c]">{item.route}</h4>
                    <p className="text-xs text-[#78908a]">{item.meta}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-extrabold text-[#d36b3d]">{item.amount}</span>
                    <button
                      onClick={() => {
                        setFrom(item.from);
                        setTo(item.to);
                        setDistance(String(item.distance));
                        setVehicle(item.vehicleKey);
                        setActiveNav("Fare calculator");
                      }}
                      className="px-3 py-1.5 bg-[#234b4c] text-[#f4f6ed] text-xs font-bold rounded-xl"
                    >
                      Recalculate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNav === "Official rate card" && (
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="pb-4 border-b border-[#e5ece3]">
              <h2 className="text-xl font-extrabold text-[#234b4c]">
                Official J&K Transport Fare Schedules (Revised 2026 Gazette)
              </h2>
              <p className="text-xs text-[#78908a] mt-1">
                Mandatory maximum fare ceiling rates for all commercial passenger vehicles across Jammu & Kashmir.
              </p>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#dce5dc] text-[#78908a] uppercase text-[10px]">
                    <th className="py-3 px-4">Vehicle Category</th>
                    <th className="py-3 px-4">Official Rate Rule</th>
                    <th className="py-3 px-4">Standard Slabs</th>
                    <th className="py-3 px-4">Transit Applicability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaf0e9] font-medium text-[#345657]">
                  <tr className="bg-[#edf5ee]/40">
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">⚡ E-Rickshaw (Toto / Cart)</td>
                    <td className="py-3.5 px-4">Flat ₹15 per km</td>
                    <td className="py-3.5 px-4">Up to 4 passengers</td>
                    <td className="py-3.5 px-4">Local colony & market hubs</td>
                  </tr>
                  <tr className="bg-[#edf5ee]/40">
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">⚡ E-Auto (Electric 3-Wheeler)</td>
                    <td className="py-3.5 px-4">₹25 (1st km) + ₹20/km subsequent</td>
                    <td className="py-3.5 px-4">Up to 3 passengers</td>
                    <td className="py-3.5 px-4">Urban green commuting</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">🛺 Tata Magic / Local 4-Wheeler</td>
                    <td className="py-3.5 px-4">Stage slabs: ₹9 (3km), ₹14 (5km), ₹17 (10km), ₹20 (15km), ₹26 (20km)</td>
                    <td className="py-3.5 px-4">6 to 8 seats</td>
                    <td className="py-3.5 px-4">50% concession for distance &gt;20km</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">🚌 Mini Bus (Matador / 407)</td>
                    <td className="py-3.5 px-4">₹1.64/km (Kashmir Plain) · ₹1.88/km (Hill)</td>
                    <td className="py-3.5 px-4">Per seat (18-24)</td>
                    <td className="py-3.5 px-4">Local high-frequency stage route</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">🚌 Private 2+2 Big Bus</td>
                    <td className="py-3.5 px-4">₹1.12/km (Jammu Plain) · ₹1.40/km (Kashmir) · ₹1.59/km (Hill)</td>
                    <td className="py-3.5 px-4">Per seat (32+)</td>
                    <td className="py-3.5 px-4">Long distance stage carriage</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">🛺 Auto-Rickshaw (Petrol/CNG)</td>
                    <td className="py-3.5 px-4">₹45 for first 2 km, then ₹7.40/km</td>
                    <td className="py-3.5 px-4">Up to 3 passengers</td>
                    <td className="py-3.5 px-4">City & town limits</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">🚕 Shared Maxi-Cab (Sumo/Bolero)</td>
                    <td className="py-3.5 px-4">₹35 Base + ₹5.20 / passenger-km</td>
                    <td className="py-3.5 px-4">4+1 to 7+1</td>
                    <td className="py-3.5 px-4">Inter-district corridors</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">🚕 Standard Sedan Taxi (+18% Hiked)</td>
                    <td className="py-3.5 px-4">₹140 Base + ₹14.50 / km</td>
                    <td className="py-3.5 px-4">Entire vehicle (4+1)</td>
                    <td className="py-3.5 px-4">Contract carriage (Dzire/Etios)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">🚕 Premium Tourist SUV (+18% Hiked)</td>
                    <td className="py-3.5 px-4">₹220 Base + ₹21.00 / km</td>
                    <td className="py-3.5 px-4">Entire vehicle (6+1/7+1)</td>
                    <td className="py-3.5 px-4">Innova Crysta, Scorpio, Fortuner</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dce5dc] bg-[#fbfcf8] mt-12 py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#78908a]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Navigation size={15} className="text-[#234b4c]" />
            <span className="font-bold text-[#234b4c]">SAFAR</span>
            <span dir="rtl" lang="ur" className="font-semibold text-[#4a6d65]">منزل سے بہتر ہے سفر</span>
            <span>— Simple, Transparent J&K Transit Fare Guide</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setShowHelpModal(true)} className="hover:text-[#234b4c]">
              How it Works
            </button>
            <span className="text-[#dce5dc]">|</span>
            <span>24/7 Helpline: <strong>1033</strong></span>
          </div>
        </div>
      </footer>

      {/* Vehicle Fleet & Recognition Guide Modal */}
      {showFleetGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#e2eae0] flex items-center justify-between bg-gradient-to-r from-[#edf3eb] to-[#f6f9f5]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center shadow-xs">
                  <BusFront size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#234b4c] flex items-center gap-2">
                    <span>J&K Vehicle Fleet & Recognition Guide</span>
                    <span className="text-[10px] font-extrabold bg-[#234b4c] text-[#f4f6ed] px-2 py-0.5 rounded-full">
                      11 Categories
                    </span>
                  </h3>
                  <p className="text-xs text-[#557b72] mt-0.5">
                    Visual hallmarks, seating limits, luggage guidelines, and official stands across J&K
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFleetGuide(false)}
                className="p-2 rounded-xl text-[#78908a] hover:bg-[#e4ece2] hover:text-[#234b4c] transition"
                aria-label="Close Fleet Guide"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicleOptions.map((v) => {
                  const meta = VEHICLE_VISUAL_META[v.key];
                  const isSelected = vehicle === v.key;
                  const isInspected = inspectedVehicleKey === v.key;

                  return (
                    <div
                      key={v.key}
                      className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                        isInspected
                          ? "bg-[#f4f8f4] border-[#234b4c] shadow-md ring-2 ring-[#234b4c]/15"
                          : isSelected
                          ? "bg-[#f9faf7] border-[#74a181] shadow-xs"
                          : "bg-[#ffffff] border-[#e2eae0] hover:border-[#adc9b2]"
                      }`}
                    >
                      {/* Vehicle Header & Render Showcase */}
                      <div>
                        <div className="w-full h-32 rounded-xl bg-gradient-to-b from-[#f3f7f1] to-[#e4ece2] border border-[#d8e4d8] flex items-center justify-center p-3 relative overflow-hidden group">
                          <VehicleIllustration vehicleKey={v.key} className="w-full h-full object-contain filter drop-shadow-sm transform group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute top-2 left-2 flex items-center gap-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#234b4c] text-[#f4f6ed] shadow-xs">
                              {v.badge}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 text-[#3f6e5b] border border-[#d2e4d4]">
                              {meta?.categoryLabel || v.category}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className="text-[10.5px] font-black px-2 py-0.5 rounded-md bg-white text-[#234b4c] border border-[#dce5dc] shadow-xs">
                              {v.calcType === "urban-stage" ? "₹8-₹18" : v.calcType === "stage-slab" ? "₹9-₹26" : `₹${v.perKm}/km`}
                            </span>
                          </div>
                        </div>

                        {/* Title & Sublabel */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-[#234b4c]">{meta?.name || v.label}</h4>
                            <span className="text-[11px] font-bold text-[#345657] bg-[#edf3eb] px-2 py-0.5 rounded-md">
                              👥 {v.capacity}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#78908a] mt-0.5">{v.sublabel}</p>
                          <p className="text-[11px] italic text-[#557b72] mt-1">"{meta?.tagline}"</p>
                        </div>

                        {/* Hallmarks & Recognition Features */}
                        <div className="mt-3 pt-3 border-t border-[#edf3eb] space-y-2 text-xs">
                          <div>
                            <span className="font-bold text-[#234b4c] block text-[11px]">👀 How to Spot on Road:</span>
                            <p className="text-[11px] text-[#557b72] leading-snug mt-0.5">{meta?.hallmark}</p>
                          </div>
                          <div>
                            <span className="font-bold text-[#234b4c] block text-[11px]">📍 Designated Stands & Boarding:</span>
                            <p className="text-[11px] text-[#557b72] leading-snug mt-0.5">{meta?.howToSpot}</p>
                          </div>
                          <div>
                            <span className="font-bold text-[#234b4c] block text-[11px]">🧳 Baggage Allowance:</span>
                            <p className="text-[11px] text-[#557b72] leading-snug mt-0.5">{meta?.luggage}</p>
                          </div>
                          <div>
                            <span className="font-bold text-[#234b4c] block text-[11px]">🏔️ Ideal Route Corridors:</span>
                            <p className="text-[11px] text-[#557b72] leading-snug mt-0.5">{meta?.idealFor}</p>
                          </div>
                        </div>
                      </div>

                      {/* Select Action */}
                      <div className="mt-4 pt-3 border-t border-[#edf3eb] flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#78908a]">
                          {v.isPerSeat ? "Per Seat Shared" : "Full Vehicle Hire"}
                        </span>
                        <button
                          onClick={() => {
                            setVehicle(v.key);
                            setShowFleetGuide(false);
                            showToast(`Selected ${v.label} for calculation`);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            isSelected
                              ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                              : "bg-[#edf3eb] text-[#234b4c] hover:bg-[#dfebe0]"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 size={13} className="text-[#f2bd70]" />
                              <span>Active Vehicle</span>
                            </>
                          ) : (
                            <span>Select this Vehicle</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e2eae0] bg-[#f9faf7] flex items-center justify-between text-xs text-[#78908a]">
              <span>Tariff source: J&K Transport Department Statutory Fare Revisions</span>
              <button
                onClick={() => setShowFleetGuide(false)}
                className="px-4 py-2 rounded-xl bg-[#234b4c] text-[#f4f6ed] font-bold hover:bg-[#1a3839] transition"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "How Safar Works" Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-[#78908a] hover:bg-[#eaf0e9]"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center">
                <Navigation size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#234b4c]">How Safar Works</h3>
                <p className="text-xs text-[#78908a]">3 Simple Steps to Check Your Fare</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-[#345657] mt-4">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f8faf6] border border-[#e2eae0]">
                <span className="w-6 h-6 rounded-full bg-[#234b4c] text-[#f4f6ed] flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-[#234b4c]">Pick Your Route & Terrain</h4>
                  <p className="text-[#78908a] mt-0.5">
                    Enter your start point and destination or click any quick corridor pill (like Srinagar ➔ Gulmarg).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f8faf6] border border-[#e2eae0]">
                <span className="w-6 h-6 rounded-full bg-[#234b4c] text-[#f4f6ed] flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-[#234b4c]">Select Vehicle (9 J&K Categories)</h4>
                  <p className="text-[#78908a] mt-0.5">
                    Choose from E-Rickshaws, E-Autos, Stage-wise Tata Magic, Matadors, Buses, or Contract Taxis.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f8faf6] border border-[#e2eae0]">
                <span className="w-6 h-6 rounded-full bg-[#234b4c] text-[#f4f6ed] flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-[#234b4c]">Know Before You Board</h4>
                  <p className="text-[#78908a] mt-0.5">
                    See the transparent rate calculated according to official J&K Transport Department rules so you are never overcharged.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-6 py-3 rounded-2xl bg-[#234b4c] text-[#f4f6ed] font-bold text-xs hover:bg-[#1a3839] transition"
            >
              Got it, let's calculate!
            </button>
          </div>
        </div>
      )}

      {/* Digital Conductor Fare Pass Modal */}
      <ConductorSlipModal
        open={showConductorSlip}
        onClose={() => setShowConductorSlip(false)}
        origin={from}
        destination={to}
        vehicle={chosenVehicle?.label || ""}
        distanceKm={Number(distance) || 0}
        farePerSeat={displayFare}
      />

      {/* Floating Toast Notification */}
      {notice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#234b4c] text-[#f4f6ed] text-xs font-semibold shadow-2xl border border-[#3c6b69] animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={16} className="text-[#f2bd70]" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
}
