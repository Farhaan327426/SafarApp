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
  Monitor,
  Smartphone,
} from "lucide-react";
import ConductorSlipModal from "./components/ConductorSlipModal.jsx";
import VehicleIllustration, {
  VEHICLE_VISUAL_META,
} from "./components/VehicleIllustration.jsx";
import DesktopView from "./components/DesktopView.jsx";
import MobileView from "./components/MobileView.jsx";
import {
  VEHICLE_OPERATIONAL_ZONES,
  resolveRouteProfile,
  filterEligibleVehicles,
  getVehicleRouteViability,
} from "./data/transitZones.js";
import { useFareCalculator } from "./hooks/useFareCalculator.js";

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

const recentEstimatesList = [
  {
    route: "Srinagar ➔ Gulmarg",
    meta: "51 KM • Mountain Pass • 1h 35m",
    amount: "₹96 / seat",
    from: "Srinagar",
    to: "Gulmarg",
    distance: 51,
    vehicleKey: "mini-bus",
  },
  {
    route: "Jammu ➔ Katra",
    meta: "49 KM • Expressway Foothills • 1h 14m",
    amount: "₹180 / seat",
    from: "Jammu",
    to: "Katra",
    distance: 49,
    vehicleKey: "shared-cab",
  },
  {
    route: "Lal Chowk ➔ Dal Lake (Dalgate)",
    meta: "4 KM • City Lake Boulevard • 10m",
    amount: "₹60 flat",
    from: "Lal Chowk",
    to: "Dal Lake (Dalgate)",
    distance: 4,
    vehicleKey: "e-rickshaw",
  },
  {
    route: "Anantnag ➔ Srinagar",
    meta: "53 KM • NH-44 Valley Expressway • 1h 20m",
    amount: "₹87 / seat",
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
    vehicleKey: "mini-bus",
  },
];

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
  const [vehicleViewMode, setVehicleViewMode] = useState("visual"); // 'visual' | 'table'
  const [showFleetGuide, setShowFleetGuide] = useState(false);
  const [inspectedVehicleKey, setInspectedVehicleKey] = useState(null);

  // Viewport Mode: 'auto' | 'pc' | 'mobile'
  const [viewportMode, setViewportMode] = useState(() => {
    return typeof window !== "undefined"
      ? localStorage.getItem("safar_viewport_mode") || "auto"
      : "auto";
  });
  const [isScreenMobile, setIsScreenMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsScreenMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleViewportChange = (mode) => {
    setViewportMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("safar_viewport_mode", mode);
    }
    showToast(
      mode === "auto"
        ? "Auto device view detection enabled"
        : mode === "pc"
        ? "Switched to PC Command Center view"
        : "Switched to Mobile App view"
    );
  };

  const effectiveView = viewportMode === "auto" ? (isScreenMobile ? "mobile" : "pc") : viewportMode;

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

  // Statutory Fare Computations via useFareCalculator Hook
  const { fareParts, displayFare, priceMode, setPriceMode } = useFareCalculator({
    vehicle: chosenVehicle,
    distance,
    terrainRegion,
    from,
    to,
    eligibleVehicles,
  });

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
            {/* Dedicated PC / Mobile View Switcher */}
            <div className="flex items-center p-1 bg-[#edf3eb] rounded-xl border border-[#dce5dc]" title="Switch between PC Command Center and Mobile App interfaces">
              <button
                onClick={() => handleViewportChange("auto")}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition ${
                  viewportMode === "auto"
                    ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                    : "text-[#557b72] hover:text-[#234b4c]"
                }`}
                title="Automatically adapt to screen width"
              >
                Auto
              </button>
              <button
                onClick={() => handleViewportChange("pc")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition ${
                  viewportMode === "pc"
                    ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                    : "text-[#557b72] hover:text-[#234b4c]"
                }`}
                title="Force PC / Desktop Command Center view"
              >
                <Monitor size={12} />
                <span className="hidden sm:inline">PC</span>
              </button>
              <button
                onClick={() => handleViewportChange("mobile")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition ${
                  viewportMode === "mobile"
                    ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                    : "text-[#557b72] hover:text-[#234b4c]"
                }`}
                title="Force Mobile App view"
              >
                <Smartphone size={12} />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf5ee] border border-[#d2e4d4] text-[11px] text-[#426a54] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#529b68] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#529b68]"></span>
              </span>
              <span>2026 Revised Rates</span>
            </div>

            {/* Official Unified Help & Passenger Rights Toggle */}
            <button
              id="helpModalTriggerBtn"
              onClick={() => setShowHelpModal((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-[#345657] bg-[#f0f4ee] hover:bg-[#e4ece2] border border-[#dce5dc] transition cursor-pointer shadow-xs"
              title="SAFAR Official Help, Passenger Rights & Helplines"
            >
              <CircleHelp size={16} className="text-[#d36b3d]" />
              <span className="hidden xs:inline">Help &amp; Rights</span>
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
          effectiveView === "pc" ? (
            <DesktopView
              from={from}
              to={to}
              distance={distance}
              setDistance={setDistance}
              handleFromChange={handleFromChange}
              handleToChange={handleToChange}
              handleSwap={handleSwap}
              handleLocationPick={handleLocationPick}
              searchFromFocus={searchFromFocus}
              setSearchFromFocus={setSearchFromFocus}
              searchToFocus={searchToFocus}
              setSearchToFocus={setSearchToFocus}
              vehicle={vehicle}
              setVehicle={setVehicle}
              chosenVehicle={chosenVehicle}
              eligibleVehicles={eligibleVehicles}
              visibleVehicles={visibleVehicles}
              vehicleCategories={vehicleCategories}
              vehicleCategoryFilter={vehicleCategoryFilter}
              setVehicleCategoryFilter={setVehicleCategoryFilter}
              categoryCounts={categoryCounts}
              vehicleViewMode={vehicleViewMode}
              setVehicleViewMode={setVehicleViewMode}
              activePresets={activePresets}
              handleSelectPreset={handleSelectPreset}
              popularLocations={popularLocations}
              currentRouteMeta={currentRouteMeta}
              currentRouteProfile={currentRouteProfile}
              terrainRegion={terrainRegion}
              setTerrainRegion={setTerrainRegion}
              userRegionOverride={userRegionOverride}
              setUserRegionOverride={setUserRegionOverride}
              contextAlerts={contextAlerts}
              fareParts={fareParts}
              displayFare={displayFare}
              priceMode={priceMode}
              setPriceMode={setPriceMode}
              handleShare={handleShare}
              setShowConductorSlip={setShowConductorSlip}
              setShowFleetGuide={setShowFleetGuide}
              setInspectedVehicleKey={setInspectedVehicleKey}
              showToast={showToast}
              hasRoute={hasRoute}
            />
          ) : (
            <div className={isScreenMobile ? "w-full" : "max-w-md mx-auto py-2"}>
              {!isScreenMobile && (
                <div className="mb-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#edf5ee] text-[#234b4c] border border-[#d2e4d4] shadow-xs">
                    📱 Mobile View Mode Active (Use Top Switcher for PC View)
                  </span>
                </div>
              )}
              <MobileView
                from={from}
                to={to}
                distance={distance}
                setDistance={setDistance}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleSwap={handleSwap}
                handleLocationPick={handleLocationPick}
                searchFromFocus={searchFromFocus}
                setSearchFromFocus={setSearchFromFocus}
                searchToFocus={searchToFocus}
                setSearchToFocus={setSearchToFocus}
                vehicle={vehicle}
                setVehicle={setVehicle}
                chosenVehicle={chosenVehicle}
                eligibleVehicles={eligibleVehicles}
                visibleVehicles={visibleVehicles}
                vehicleCategories={vehicleCategories}
                vehicleCategoryFilter={vehicleCategoryFilter}
                setVehicleCategoryFilter={setVehicleCategoryFilter}
                categoryCounts={categoryCounts}
                activePresets={activePresets}
                handleSelectPreset={handleSelectPreset}
                popularLocations={popularLocations}
                currentRouteMeta={currentRouteMeta}
                currentRouteProfile={currentRouteProfile}
                terrainRegion={terrainRegion}
                setTerrainRegion={setTerrainRegion}
                userRegionOverride={userRegionOverride}
                setUserRegionOverride={setUserRegionOverride}
                contextAlerts={contextAlerts}
                fareParts={fareParts}
                displayFare={displayFare}
                priceMode={priceMode}
                setPriceMode={setPriceMode}
                handleShare={handleShare}
                setShowConductorSlip={setShowConductorSlip}
                setShowFleetGuide={setShowFleetGuide}
                setInspectedVehicleKey={setInspectedVehicleKey}
                showToast={showToast}
                hasRoute={hasRoute}
              />
            </div>
          )
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
                <h3 className="font-bold text-lg text-[#234b4c]">SAFAR Help &amp; Passenger Rights</h3>
                <p className="text-xs text-[#78908a]">How Safar works &amp; J&amp;K statutory protections (SRO-97)</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-[#345657] mt-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f8faf6] border border-[#e2eae0]">
                <span className="w-6 h-6 rounded-full bg-[#234b4c] text-[#f4f6ed] flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-[#234b4c]">Pick Your Route &amp; Terrain</h4>
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
                  <h4 className="font-bold text-[#234b4c]">Select Vehicle (9 J&amp;K Categories)</h4>
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
                    See the transparent rate calculated according to official J&amp;K Transport Department rules so you are never overcharged.
                  </p>
                </div>
              </div>

              {/* Passenger Rights Section */}
              <div className="p-3.5 rounded-2xl bg-[#eaf0e9] border border-[#d2e4d4] space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#234b4c]">
                  <ShieldCheck size={16} className="text-[#16a34a]" />
                  <span>Your Rights as a Commuter (SRO-97)</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[#345657] text-[11px] leading-relaxed">
                  <li>Drivers cannot legally demand fares above the notified statutory ceiling (Section 192A MVA).</li>
                  <li>Stage carriage passengers are only liable for fares up to their destination stop.</li>
                  <li>In case of overcharging or refusal, quote official SRO-97 tariff or generate an offline Fare Pass.</li>
                </ul>
                <div className="pt-2 border-t border-[#d2e4d4] flex flex-wrap gap-2 text-[10px] font-bold text-[#234b4c]">
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#c3d8c6]">🚨 Police: 112</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#c3d8c6]">🛣️ NH-44: 1033</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#c3d8c6]">🚑 Medical: 108</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-[#c3d8c6]">🚺 Women: 181</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-5 py-3 rounded-2xl bg-[#234b4c] text-[#f4f6ed] font-bold text-xs hover:bg-[#1a3839] transition cursor-pointer"
            >
              Got it, close help!
            </button>
          </div>
        </div>
      )}

      {/* Digital Conductor Fare Pass Modal */}
      <ConductorSlipModal
        open={showConductorSlip}
        onClose={() => setShowConductorSlip(false)}
        origin={from || "Lal Chowk"}
        destination={to || "Hazratbal"}
        vehicle={chosenVehicle?.label || "Shared Cab"}
        distanceKm={Number(distance) || 0}
        farePerSeat={displayFare || 20}
        totalFare={displayFare || 20}
        passengers={1}
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
