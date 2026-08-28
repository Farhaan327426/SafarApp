import React, { useState, useMemo } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Bell,
  BusFront,
  Calculator,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleGauge,
  Clock3,
  Compass,
  FileText,
  HelpCircle,
  Info,
  MapPin,
  MapPinned,
  Menu,
  MoreHorizontal,
  Navigation,
  PhoneCall,
  RefreshCw,
  Route,
  Search,
  Settings2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const vehicleOptions = [
  {
    key: "shared-cab",
    label: "Shared Cab",
    sublabel: "Sumo / Tavera / Bolero",
    detail: "Standard passenger seat on fixed route",
    icon: CarFront,
    base: 35,
    perKm: 5.2,
    capacity: "4 to 7 Seats",
    badge: "Most Popular",
    color: "#d36b3d",
  },
  {
    key: "auto",
    label: "Auto-Rickshaw",
    sublabel: "3-Wheeler Metered",
    detail: "Short & medium city trips up to 3 people",
    icon: CarFront,
    base: 45,
    perKm: 7.4,
    capacity: "Up to 3 Persons",
    badge: "City Travel",
    color: "#bc8a20",
  },
  {
    key: "mini-bus",
    label: "Mini Bus / 407",
    sublabel: "Matador / Local Transit",
    detail: "Budget stage carriage across town hubs",
    icon: BusFront,
    base: 18,
    perKm: 2.9,
    capacity: "Per Passenger",
    badge: "Lowest Fare",
    color: "#557b72",
  },
  {
    key: "taxi",
    label: "Private Taxi",
    sublabel: "Sedan / Tourist Cab",
    detail: "Point-to-point dedicated vehicle hire",
    icon: CarFront,
    base: 160,
    perKm: 16.5,
    capacity: "Entire Vehicle (4+1)",
    badge: "Dedicated Cab",
    color: "#3e6b8a",
  },
];

const popularLocations = [
  "Srinagar",
  "Gulmarg",
  "Pahalgam",
  "Sonmarg",
  "Jammu",
  "Katra",
  "Anantnag",
  "Baramulla",
  "Sopore",
  "Budgam",
  "Srinagar Airport",
  "Lal Chowk",
  "Dal Lake (Dalgate)",
  "Ganderbal",
];

const routePresets = [
  {
    from: "Srinagar",
    to: "Gulmarg",
    distance: 51,
    duration: "1h 35m",
    terrain: "Mountain Pass",
    highway: "NH-1A / Tangmarg Rd",
    stops: ["Tangmarg", "Magam", "Narbal"],
    recommended: "Shared Cab or Private Taxi",
  },
  {
    from: "Srinagar",
    to: "Pahalgam",
    distance: 92,
    duration: "2h 20m",
    terrain: "Scenic Valley Corridor",
    highway: "KP Road / NH-44",
    stops: ["Pampore", "Awantipora", "Anantnag"],
    recommended: "Shared Cab / Private Taxi",
  },
  {
    from: "Srinagar",
    to: "Sonmarg",
    distance: 80,
    duration: "2h 10m",
    terrain: "High Mountain Highway",
    highway: "NH-1 (Srinagar-Leh)",
    stops: ["Ganderbal", "Kangan", "Gund"],
    recommended: "Shared Cab / Tourist Taxi",
  },
  {
    from: "Jammu",
    to: "Katra",
    distance: 49,
    duration: "1h 14m",
    terrain: "Expressway Foothills",
    highway: "NH-44 / Katra Bypass",
    stops: ["Nagrota", "Jhajjar Kotli"],
    recommended: "Mini Bus / Shared Taxi",
  },
  {
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
    duration: "1h 20m",
    terrain: "Plains / 4-Lane Highway",
    highway: "NH-44 Valley Expressway",
    stops: ["Bijbehara", "Awantipora", "Pampore"],
    recommended: "Mini Bus / Shared Cab",
  },
  {
    from: "Sopore",
    to: "Srinagar",
    distance: 49,
    duration: "1h 16m",
    terrain: "Plains Road",
    highway: "Sopore-Srinagar Highway",
    stops: ["Sangrama", "Pattan", "Shalteng"],
    recommended: "Shared Cab / Mini Bus",
  },
  {
    from: "Srinagar Airport",
    to: "Lal Chowk",
    distance: 12,
    duration: "25m",
    terrain: "City / Airport Corridor",
    highway: "Airport Road / Hyderpora",
    stops: ["Hyderpora", "Rambagh", "Jahangir Chowk"],
    recommended: "Prepaid Taxi / Auto",
  },
];

const recentEstimatesList = [
  {
    route: "Srinagar → Gulmarg",
    meta: "Shared Cab · Tangmarg corridor",
    amount: "₹ 300",
    time: "Today, 10:40 AM",
    vehicleKey: "shared-cab",
    from: "Srinagar",
    to: "Gulmarg",
    distance: 51,
  },
  {
    route: "Jammu → Katra",
    meta: "Private Taxi · Vaishno Devi route",
    amount: "₹ 1,020",
    time: "Yesterday, 06:15 PM",
    vehicleKey: "taxi",
    from: "Jammu",
    to: "Katra",
    distance: 49,
  },
  {
    route: "Anantnag → Srinagar",
    meta: "Mini Bus · NH-44 Expressway",
    amount: "₹ 170",
    time: "12 Jun, 09:15 AM",
    vehicleKey: "mini-bus",
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
  },
  {
    route: "Srinagar Airport → Lal Chowk",
    meta: "Auto-Rickshaw · City Transfer",
    amount: "₹ 140",
    time: "10 Jun, 02:30 PM",
    vehicleKey: "auto",
    from: "Srinagar Airport",
    to: "Lal Chowk",
    distance: 12,
  },
];

const faqs = [
  {
    q: "How does Safar calculate the fair fare?",
    a: "Safar combines statutory rates regulated by the J&K Transport Department (SRO-97 / MVD guidelines) with verified distance and route terrain factors. This gives you a clear baseline before you negotiate or board.",
  },
  {
    q: "Is this price per seat or for the whole cab?",
    a: "For Shared Cabs and Mini Buses, the rate shown is per passenger seat. For Private Taxis, the rate is for the entire vehicle. For Auto-rickshaws, it is for the entire trip (up to 3 persons).",
  },
  {
    q: "What if a driver asks for significantly more?",
    a: "During heavy snowfall, road blockages, or peak tourist season, private operators may quote higher rates. You can show the official breakdown from Safar or call the J&K Traffic Helpline (1033 / 0194-2450022).",
  },
  {
    q: "Are toll taxes and parking charges included?",
    a: "Standard estimates do not include special toll plazas (like Banihal or expressway tolls) or airport parking fees. These are paid directly if applicable.",
  },
];

export default function App() {
  const [activeNav, setActiveNav] = useState("Fare calculator");
  const [from, setFrom] = useState("Srinagar");
  const [to, setTo] = useState("Gulmarg");
  const [distance, setDistance] = useState("51");
  const [vehicle, setVehicle] = useState("shared-cab");
  const [hasCalculated, setHasCalculated] = useState(true);
  const [notice, setNotice] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [searchFromFocus, setSearchFromFocus] = useState(false);
  const [searchToFocus, setSearchToFocus] = useState(false);
  const [priceMode, setPriceMode] = useState("per-seat");

  const chosenVehicle = useMemo(
    () => vehicleOptions.find((option) => option.key === vehicle) ?? vehicleOptions[0],
    [vehicle]
  );

  const routeMatch = useMemo(
    () =>
      routePresets.find(
        (route) =>
          (route.from.toLowerCase() === from.trim().toLowerCase() &&
            route.to.toLowerCase() === to.trim().toLowerCase()) ||
          (route.from.toLowerCase() === to.trim().toLowerCase() &&
            route.to.toLowerCase() === from.trim().toLowerCase())
      ),
    [from, to]
  );

  const fareParts = useMemo(() => {
    const km = Math.max(1, Number(distance) || 1);
    const base = chosenVehicle.base;
    const distanceCost = Math.round(km * chosenVehicle.perKm);
    const localAdjustment =
      chosenVehicle.key === "shared-cab"
        ? 0
        : chosenVehicle.key === "mini-bus"
        ? -4
        : chosenVehicle.key === "auto"
        ? 5
        : 15;
    const totalSingle = Math.max(15, base + distanceCost + localAdjustment);
    
    // Calculate full cab multiplier if applicable
    const seatsMultiplier = chosenVehicle.key === "shared-cab" ? 5 : chosenVehicle.key === "mini-bus" ? 18 : 1;
    const fullCabCost = chosenVehicle.key === "taxi" ? totalSingle : totalSingle * seatsMultiplier;

    return {
      base,
      distanceCost,
      localAdjustment,
      totalSingle,
      fullCabCost,
      perKmRate: chosenVehicle.perKm,
    };
  }, [chosenVehicle, distance]);

  const displayFare = useMemo(() => {
    if (chosenVehicle.key === "taxi" || chosenVehicle.key === "auto") {
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
    setFrom(to);
    setTo(oldFrom);
    showToast(`Swapped: ${to} ⇄ ${from}`);
  };

  const handleSelectPreset = (preset) => {
    setFrom(preset.from);
    setTo(preset.to);
    setDistance(String(preset.distance));
    setHasCalculated(true);
    showToast(`Loaded ${preset.from} → ${preset.to} (${preset.distance} km)`);
  };

  const handleLocationPick = (type, loc) => {
    if (type === "from") {
      setFrom(loc);
      setSearchFromFocus(false);
    } else {
      setTo(loc);
      setSearchToFocus(false);
    }
    // Check if there is an automatic match
    const matching = routePresets.find(
      (r) =>
        (r.from.toLowerCase() === (type === "from" ? loc : from).toLowerCase() &&
          r.to.toLowerCase() === (type === "to" ? loc : to).toLowerCase()) ||
        (r.to.toLowerCase() === (type === "from" ? loc : from).toLowerCase() &&
          r.from.toLowerCase() === (type === "to" ? loc : to).toLowerCase())
    );
    if (matching) {
      setDistance(String(matching.distance));
    }
    showToast(`Set ${type === "from" ? "Starting Point" : "Destination"} to ${loc}`);
  };

  const handleShare = () => {
    const text = `🚗 Safar Fare Estimate: ${from} to ${to} (${distance} km) via ${chosenVehicle.label} is ₹${displayFare}. Check official J&K transit rates on Safar.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Estimate copied to clipboard!");
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
                <p className="text-[11px] text-[#78908a] font-medium hidden sm:block">
                  Smart Transit & Legal Fare Guide
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
            {/* Live rates heartbeat status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf5ee] border border-[#d2e4d4] text-[11px] text-[#426a54] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#529b68] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#529b68]"></span>
              </span>
              <span>SRO-97 Verified Rates</span>
            </div>

            {/* How it works button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-[#345657] bg-[#f0f4ee] hover:bg-[#e4ece2] border border-[#dce5dc] transition"
              title="How Safar Works"
            >
              <CircleHelp size={16} className="text-[#d36b3d]" />
              <span className="hidden sm:inline">Help</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-[#557b72] hover:bg-[#eaf0e9] hover:text-[#234b4c] transition relative"
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d36b3d]" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#fbfcf8] border border-[#dce5dc] p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e5ece3]">
                    <h3 className="text-xs font-bold text-[#234b4c] uppercase tracking-wider">
                      J&K Transit Alerts
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf5ee] text-[#426a54]">
                      Live
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-[#f5f8f3] border border-[#e2eae0] text-xs">
                      <p className="font-semibold text-[#345657]">Tangmarg - Gulmarg Road</p>
                      <p className="text-[11px] text-[#78908a] mt-0.5">
                        Clear traffic. Snow chains mandatory only during severe icing.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#f5f8f3] border border-[#e2eae0] text-xs">
                      <p className="font-semibold text-[#345657]">NH-44 Jammu-Srinagar</p>
                      <p className="text-[11px] text-[#78908a] mt-0.5">
                        Two-way light vehicular traffic operating smoothly through Navyug Tunnel.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="w-full mt-3 py-1.5 text-center text-xs font-bold text-[#d36b3d] hover:underline"
                  >
                    Close Alerts
                  </button>
                </div>
              )}
            </div>
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

            <div className="pt-4 border-t border-[#dce5dc] space-y-2">
              <button
                onClick={() => {
                  setShowHelpModal(true);
                  setMobileNavOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2.5 text-xs font-semibold text-[#557b72] hover:bg-[#eaf0e9] rounded-xl"
              >
                <HelpCircle size={16} />
                <span>How Safar Works</span>
              </button>
              <div className="p-3 rounded-xl bg-[#eaf0e9] text-[11px] text-[#557b72]">
                <p className="font-bold">Passenger Helpline: 1033</p>
                <p className="text-[10px] text-[#78908a]">Jammu & Kashmir Transport Helpdesk</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ========================================================================= */}
        {/* TAB 1: FARE CALCULATOR (PRIMARY LANDING VIEW)                             */}
        {/* ========================================================================= */}
        {activeNav === "Fare calculator" && (
          <div className="space-y-6">
            {/* Friendly Hero Banner */}
            <section className="bg-gradient-to-r from-[#234b4c] via-[#2c5b5c] to-[#345657] rounded-3xl p-6 sm:p-8 text-[#f4f6ed] shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2bd70]/20 text-[#f2bd70] border border-[#f2bd70]/30 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles size={13} />
                  <span>Fair & Simple Road Travel</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Know the exact fair fare <br className="hidden sm:block" />
                  before you board across J&K.
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[#c7dad0] leading-relaxed">
                  Simple, transparent estimates for Shared Cabs, Autos, Mini Buses, and Private Taxis based on Jammu & Kashmir official transport guidelines.
                </p>
              </div>

              {/* Decorative Mountain SVGs */}
              <div className="absolute right-0 bottom-0 w-80 h-40 opacity-20 pointer-events-none">
                <svg viewBox="0 0 400 150" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M0 150 L80 60 L140 100 L220 30 L300 90 L360 40 L400 150 Z" fill="#ffffff" />
                </svg>
              </div>
            </section>

            {/* Quick 1-Click Popular Corridor Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-bold text-[#78908a] uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Compass size={14} /> Quick Trips:
              </span>
              {routePresets.map((preset) => (
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
              {/* Left Column: Route Builder & Vehicle Selection (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Step 1: Route Builder Box */}
                <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#e5ece3]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#e5eee4] text-[#345657] flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#234b4c]">Where are you going?</h2>
                        <p className="text-[11px] text-[#78908a]">Enter your start and destination in J&K</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setFrom("Srinagar");
                        setTo("Gulmarg");
                        setDistance("51");
                        setVehicle("shared-cab");
                        setHasCalculated(true);
                        showToast("Reset to Srinagar ➔ Gulmarg");
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-[#78908a] hover:text-[#d36b3d] transition"
                    >
                      <RefreshCw size={13} />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Route Inputs with Swap Action */}
                  <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_48px_1fr] items-center gap-3">
                    {/* From Input */}
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-[#78908a] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#d36b3d]"></span> Starting Point
                      </label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-3.5 top-3.5 text-[#d36b3d]" />
                        <input
                          type="text"
                          value={from}
                          onFocus={() => setSearchFromFocus(true)}
                          onChange={(e) => {
                            setFrom(e.target.value);
                            setHasCalculated(false);
                          }}
                          placeholder="e.g. Srinagar, Lal Chowk"
                          className="w-full pl-10 pr-3 py-3 rounded-2xl bg-[#f6f8f3] border border-[#dce5dc] text-sm font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181] focus:bg-[#fbfcf8] transition"
                        />
                      </div>

                      {/* Autocomplete Dropdown for FROM */}
                      {searchFromFocus && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl shadow-xl p-2 z-30 max-h-48 overflow-y-auto">
                          <p className="text-[10px] font-bold text-[#78908a] px-2 py-1 uppercase">
                            Suggested Hubs
                          </p>
                          {popularLocations
                            .filter((loc) => loc.toLowerCase().includes(from.toLowerCase()))
                            .map((loc) => (
                              <button
                                key={loc}
                                onClick={() => handleLocationPick("from", loc)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#345657] hover:bg-[#edf5ee] flex items-center justify-between"
                              >
                                <span>{loc}</span>
                                <ChevronRight size={13} className="text-[#78908a]" />
                              </button>
                            ))}
                          <button
                            onClick={() => setSearchFromFocus(false)}
                            className="w-full mt-1 text-center text-[11px] font-bold text-[#78908a] py-1 hover:text-[#d36b3d]"
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
                        <span className="w-2 h-2 rounded-full bg-[#557b72]"></span> Destination
                      </label>
                      <div className="relative">
                        <MapPinned size={18} className="absolute left-3.5 top-3.5 text-[#557b72]" />
                        <input
                          type="text"
                          value={to}
                          onFocus={() => setSearchToFocus(true)}
                          onChange={(e) => {
                            setTo(e.target.value);
                            setHasCalculated(false);
                          }}
                          placeholder="e.g. Gulmarg, Pahalgam"
                          className="w-full pl-10 pr-3 py-3 rounded-2xl bg-[#f6f8f3] border border-[#dce5dc] text-sm font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181] focus:bg-[#fbfcf8] transition"
                        />
                      </div>

                      {/* Autocomplete Dropdown for TO */}
                      {searchToFocus && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl shadow-xl p-2 z-30 max-h-48 overflow-y-auto">
                          <p className="text-[10px] font-bold text-[#78908a] px-2 py-1 uppercase">
                            Suggested Destinations
                          </p>
                          {popularLocations
                            .filter((loc) => loc.toLowerCase().includes(to.toLowerCase()))
                            .map((loc) => (
                              <button
                                key={loc}
                                onClick={() => handleLocationPick("to", loc)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#345657] hover:bg-[#edf5ee] flex items-center justify-between"
                              >
                                <span>{loc}</span>
                                <ChevronRight size={13} className="text-[#78908a]" />
                              </button>
                            ))}
                          <button
                            onClick={() => setSearchToFocus(false)}
                            className="w-full mt-1 text-center text-[11px] font-bold text-[#78908a] py-1 hover:text-[#d36b3d]"
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Distance in Kilometers */}
                  <div className="mt-4 pt-4 border-t border-[#eaf0e9] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:w-auto">
                      <span className="text-xs font-bold text-[#345657]">Road Distance:</span>
                      <span className="text-xs text-[#78908a] ml-1.5">
                        {routeMatch ? "Verified highway corridor" : "Estimated distance"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-36">
                        <input
                          type="number"
                          min="1"
                          max="800"
                          value={distance}
                          onChange={(e) => {
                            setDistance(e.target.value);
                            setHasCalculated(false);
                          }}
                          className="w-full py-2 pl-3 pr-10 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-sm font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181]"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-[#78908a]">
                          KM
                        </span>
                      </div>
                      <span className="text-xs text-[#78908a]">
                        (~{Math.round((Number(distance) || 1) * 0.621)} miles)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 2: Vehicle Selection Cards */}
                <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#e5ece3]">
                    <div className="w-8 h-8 rounded-xl bg-[#e5eee4] text-[#345657] flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#234b4c]">Select Vehicle Type</h2>
                      <p className="text-[11px] text-[#78908a]">
                        Choose how you plan to travel along this corridor
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {vehicleOptions.map((v) => {
                      const Icon = v.icon;
                      const selected = vehicle === v.key;
                      return (
                        <button
                          key={v.key}
                          onClick={() => {
                            setVehicle(v.key);
                            setHasCalculated(true);
                            showToast(`Selected ${v.label}`);
                          }}
                          className={`relative p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                            selected
                              ? "bg-[#f4f7f2] border-[#234b4c] shadow-md ring-2 ring-[#234b4c]/10"
                              : "bg-[#fbfcf8] border-[#e2eae0] hover:border-[#adc9b2] hover:bg-[#f8faf6]"
                          }`}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                              style={{
                                backgroundColor: selected ? "#234b4c" : "#edf3eb",
                                color: selected ? "#f2bd70" : v.color,
                              }}
                            >
                              <Icon size={20} />
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                selected
                                  ? "bg-[#234b4c] text-[#f4f6ed]"
                                  : "bg-[#edf3eb] text-[#557b72]"
                              }`}
                            >
                              {v.badge}
                            </span>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-[#234b4c]">{v.label}</h3>
                              {selected && <CheckCircle2 size={15} className="text-[#557b72]" />}
                            </div>
                            <p className="text-[11px] font-medium text-[#78908a]">{v.sublabel}</p>
                            <p className="text-[10px] text-[#8a9c95] mt-1 leading-snug">{v.detail}</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-[#e2eae0] flex items-center justify-between text-[11px]">
                            <span className="text-[#78908a]">Base: ₹{v.base}</span>
                            <span className="font-bold text-[#345657]">₹{v.perKm}/km</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Fare Result Card & Breakdown (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Result Evergreen Hero Card */}
                <div className="relative bg-gradient-to-br from-[#234b4c] via-[#204445] to-[#183637] rounded-3xl p-6 sm:p-7 text-[#f4f6ed] shadow-xl overflow-hidden border border-[#3c6b69]">
                  {/* Decorative ambient background */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#3d706d]/30 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#f2bd70]/10 blur-xl pointer-events-none" />

                  {/* Header info */}
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#f2bd70] bg-[#f2bd70]/15 px-2.5 py-1 rounded-full border border-[#f2bd70]/25">
                        <CircleGauge size={13} />
                        <span>Fair Price Guidance</span>
                      </div>
                      <p className="text-xs text-[#c4d6cb] mt-2 font-medium">
                        {from} <ArrowRight size={12} className="inline mx-1" /> {to}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#386260] text-[#cbe1d3] border border-[#4d7f7c]">
                      Verified Rate
                    </span>
                  </div>

                  {/* Price Mode Switcher (Per Seat vs Full Cab) */}
                  {chosenVehicle.key === "shared-cab" || chosenVehicle.key === "mini-bus" ? (
                    <div className="relative z-10 mt-4 flex items-center bg-[#183637]/70 p-1 rounded-xl border border-[#386260]">
                      <button
                        onClick={() => setPriceMode("per-seat")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          priceMode === "per-seat"
                            ? "bg-[#d36b3d] text-[#ffffff] shadow-sm"
                            : "text-[#c4d6cb] hover:text-[#ffffff]"
                        }`}
                      >
                        Per Seat
                      </button>
                      <button
                        onClick={() => setPriceMode("full-cab")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          priceMode === "full-cab"
                            ? "bg-[#d36b3d] text-[#ffffff] shadow-sm"
                            : "text-[#c4d6cb] hover:text-[#ffffff]"
                        }`}
                      >
                        Entire Vehicle
                      </button>
                    </div>
                  ) : null}

                  {/* Big Live Price Display */}
                  <div className="relative z-10 mt-4">
                    <p className="text-[11px] text-[#aac2b3] font-medium">Recommended Fair Range</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight text-[#ffffff]">
                        ₹{displayFare.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-[#f2bd70] font-semibold">
                        {chosenVehicle.key === "taxi"
                          ? "(Entire Taxi)"
                          : chosenVehicle.key === "auto"
                          ? "(Entire Auto)"
                          : priceMode === "full-cab"
                          ? `(All ${chosenVehicle.capacity})`
                          : "(Per Passenger)"}
                      </span>
                    </div>
                  </div>

                  {/* Quick Specs Pill Row */}
                  <div className="relative z-10 grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-[#3c6b69]/70 text-xs">
                    <div className="bg-[#183637]/50 p-2.5 rounded-xl border border-[#386260]/60">
                      <p className="text-[10px] text-[#aac2b3]">Vehicle Type</p>
                      <p className="font-bold text-[#ffffff] truncate mt-0.5">{chosenVehicle.label}</p>
                    </div>
                    <div className="bg-[#183637]/50 p-2.5 rounded-xl border border-[#386260]/60">
                      <p className="text-[10px] text-[#aac2b3]">Estimated Distance</p>
                      <p className="font-bold text-[#ffffff] mt-0.5">{distance || 0} Kilometers</p>
                    </div>
                  </div>

                  {/* Share & Copy Actions */}
                  <div className="relative z-10 mt-4 flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#f4f6ed] text-[#234b4c] font-bold text-xs hover:bg-[#e4eae0] transition shadow-sm"
                    >
                      <Share2 size={14} />
                      <span>Share / Copy Fare</span>
                    </button>
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
                      <h3 className="font-bold text-sm text-[#234b4c]">Transparent Math</h3>
                    </div>
                    <span className="text-[10px] font-bold text-[#78908a] bg-[#edf3eb] px-2 py-0.5 rounded-md">
                      SRO-97 Formula
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#78908a]">Base Boarding Charge</span>
                      <span className="font-bold text-[#345657]">₹{fareParts.base}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#78908a]">
                        Distance Cost ({distance || 0} km × ₹{fareParts.perKmRate}/km)
                      </span>
                      <span className="font-bold text-[#345657]">₹{fareParts.distanceCost}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#78908a] flex items-center gap-1">
                        Regional J&K Terrain Factor
                        <Info size={12} className="text-[#8a9c95]" />
                      </span>
                      <span
                        className={`font-bold ${
                          fareParts.localAdjustment < 0 ? "text-[#557b72]" : "text-[#bc633a]"
                        }`}
                      >
                        {fareParts.localAdjustment < 0 ? "−" : "+"}₹
                        {Math.abs(fareParts.localAdjustment)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#e2eae0] flex items-center justify-between text-sm">
                      <span className="font-extrabold text-[#234b4c]">Total Fair Estimate</span>
                      <span className="font-extrabold text-[#d36b3d] text-base">
                        ₹{displayFare.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-2xl bg-[#f2f6f0] border border-[#dbe6d9] text-[11px] text-[#4d7159] flex items-start gap-2">
                    <Info size={15} className="shrink-0 mt-0.5 text-[#557b72]" />
                    <p className="leading-relaxed">
                      Rates represent official standard schedules. During extreme winter weather or night hours, slight driver variations may occur.
                    </p>
                  </div>
                </div>

                {/* Corridor Context Card */}
                {routeMatch && (
                  <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-[#e5ece3]">
                      <h3 className="font-bold text-sm text-[#234b4c]">Route Details</h3>
                      <span className="text-xs font-bold text-[#d36b3d]">{routeMatch.duration}</span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#78908a]">Highway / Corridor:</span>
                        <span className="font-semibold text-[#345657]">{routeMatch.highway}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#78908a]">Terrain:</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#eef4ed] font-semibold text-[#426a54] text-[11px]">
                          {routeMatch.terrain}
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[11px] text-[#78908a] block mb-1">Key En-Route Stops:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {routeMatch.stops.map((stop) => (
                            <span
                              key={stop}
                              className="px-2 py-0.5 rounded-lg bg-[#f0f4ee] border border-[#dce5dc] text-[10px] font-semibold text-[#345657]"
                            >
                              📍 {stop}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Recent Estimates & FAQ Accordions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
              {/* Recent Estimates List (6 Cols) */}
              <div className="lg:col-span-6 bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#e5ece3]">
                  <div className="flex items-center gap-2">
                    <Clock3 size={17} className="text-[#557b72]" />
                    <h3 className="font-bold text-sm text-[#234b4c]">Recent Corridor Estimates</h3>
                  </div>
                  <button
                    onClick={() => setActiveNav("Recent estimates")}
                    className="text-xs font-bold text-[#d36b3d] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  {recentEstimatesList.slice(0, 3).map((item) => (
                    <button
                      key={item.route}
                      onClick={() => {
                        setFrom(item.from);
                        setTo(item.to);
                        setDistance(String(item.distance));
                        setVehicle(item.vehicleKey);
                        setHasCalculated(true);
                        showToast(`Loaded ${item.route}`);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#f8faf6] border border-[#e2eae0] hover:bg-[#edf5ee] hover:border-[#c5d8c7] transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#e5eee4] text-[#345657] flex items-center justify-center">
                          <Route size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#234b4c]">{item.route}</p>
                          <p className="text-[10px] text-[#78908a]">{item.meta}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#d36b3d]">{item.amount}</span>
                        <p className="text-[9px] text-[#8a9c95]">{item.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Passenger Rights & Tips (6 Cols) */}
              <div className="lg:col-span-6 bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-[#e5ece3]">
                  <ShieldAlert size={17} className="text-[#d36b3d]" />
                  <h3 className="font-bold text-sm text-[#234b4c]">Passenger Rights & Tips</h3>
                </div>

                <div className="mt-3.5 space-y-3 text-xs text-[#557b72]">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#557b72] shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-[#234b4c]">Confirm Before Boarding:</strong> Always clarify if the quoted rate is per passenger or for the entire vehicle before getting into shared cabs or autos.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#557b72] shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-[#234b4c]">Luggage Policy:</strong> Standard handheld baggage is free. Extra commercial crates or ski bags may incur a nominal ₹30–₹50 surcharge.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#557b72] shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-[#234b4c]">Helpline Support:</strong> Dial <strong>1033</strong> or contact the local Transport Authority if any driver refuses standard rates or overcharges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ROUTE GUIDE & CORRIDOR DIRECTORY                                   */}
        {/* ========================================================================= */}
        {activeNav === "Route guide" && (
          <div className="space-y-6">
            <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5ece3]">
                <div>
                  <h2 className="text-xl font-extrabold text-[#234b4c]">J&K Transit Corridors</h2>
                  <p className="text-xs text-[#78908a] mt-1">
                    Verified distances, typical travel times, and recommended transit modes across Jammu & Kashmir.
                  </p>
                </div>
                <button
                  onClick={() => setActiveNav("Fare calculator")}
                  className="px-4 py-2 rounded-xl bg-[#234b4c] text-[#f4f6ed] font-bold text-xs hover:bg-[#1a3839] transition self-start"
                >
                  Back to Calculator
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routePresets.map((r) => (
                  <div
                    key={`${r.from}-${r.to}`}
                    className="p-5 rounded-2xl bg-[#f8faf6] border border-[#e2eae0] hover:border-[#adc9b2] transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#234b4c] text-sm">
                          {r.from} ➔ {r.to}
                        </span>
                        <span className="font-bold text-[#d36b3d] bg-[#fbf3ec] px-2 py-0.5 rounded-md">
                          {r.duration}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-[#78908a]">
                        <p>
                          <strong className="text-[#345657]">Distance:</strong> {r.distance} km
                        </p>
                        <p>
                          <strong className="text-[#345657]">Highway:</strong> {r.highway}
                        </p>
                        <p>
                          <strong className="text-[#345657]">Terrain:</strong> {r.terrain}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#e2eae0]">
                        <p className="text-[10px] font-bold text-[#78908a] uppercase">Key Stops:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.stops.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 rounded bg-[#edf3eb] text-[10px] font-medium text-[#345657]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleSelectPreset(r);
                        setActiveNav("Fare calculator");
                      }}
                      className="mt-4 w-full py-2 rounded-xl bg-[#e5eee4] text-[#234b4c] font-bold text-xs hover:bg-[#234b4c] hover:text-[#f4f6ed] transition flex items-center justify-center gap-1.5"
                    >
                      <span>Calculate This Route</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: RECENT ESTIMATES                                                   */}
        {/* ========================================================================= */}
        {activeNav === "Recent estimates" && (
          <div className="space-y-6">
            <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-[#e5ece3]">
                <div>
                  <h2 className="text-xl font-extrabold text-[#234b4c]">Calculation History</h2>
                  <p className="text-xs text-[#78908a] mt-1">
                    Past route fares generated during your session. Click any card to re-estimate.
                  </p>
                </div>
                <button
                  onClick={() => showToast("History is saved locally in your browser")}
                  className="text-xs font-bold text-[#557b72] hover:underline"
                >
                  Local Storage Synced
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {recentEstimatesList.map((item) => (
                  <div
                    key={item.route}
                    className="p-4 rounded-2xl bg-[#f8faf6] border border-[#e2eae0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#edf5ee] transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center font-bold">
                        <Route size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#234b4c]">{item.route}</h4>
                        <p className="text-xs text-[#78908a]">{item.meta}</p>
                        <p className="text-[10px] text-[#8a9c95] mt-0.5">{item.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <span className="text-lg font-black text-[#d36b3d]">{item.amount}</span>
                      <button
                        onClick={() => {
                          setFrom(item.from);
                          setTo(item.to);
                          setDistance(String(item.distance));
                          setVehicle(item.vehicleKey);
                          setHasCalculated(true);
                          setActiveNav("Fare calculator");
                          showToast(`Loaded ${item.route}`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#234b4c] text-[#f4f6ed] text-xs font-bold hover:bg-[#1a3839] transition"
                      >
                        Recalculate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OFFICIAL RATE CARD & PASSENGER RIGHTS                             */}
        {/* ========================================================================= */}
        {activeNav === "Official rate card" && (
          <div className="space-y-6">
            <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="pb-6 border-b border-[#e5ece3]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf5ee] text-[#426a54] text-xs font-bold uppercase mb-2">
                  <ShieldCheck size={14} /> Statutory Notification (SRO-97)
                </div>
                <h2 className="text-xl font-extrabold text-[#234b4c]">
                  Official J&K Transport Fare Schedules
                </h2>
                <p className="text-xs text-[#78908a] mt-1">
                  Legal fare ceilings mandated by the Motor Vehicles Department (MVD), Jammu & Kashmir.
                </p>
              </div>

              {/* Rate Card Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#dce5dc] text-[#78908a] uppercase text-[10px]">
                      <th className="py-3 px-4">Vehicle Category</th>
                      <th className="py-3 px-4">Base Minimum Fare</th>
                      <th className="py-3 px-4">Rate per KM</th>
                      <th className="py-3 px-4">Standard Seating</th>
                      <th className="py-3 px-4">Applicability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaf0e9] font-medium text-[#345657]">
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-[#234b4c]">Shared Maxi-Cab (Sumo/Tavera)</td>
                      <td className="py-3.5 px-4">₹ 35</td>
                      <td className="py-3.5 px-4">₹ 5.20 / passenger-km</td>
                      <td className="py-3.5 px-4">4+1 to 7+1</td>
                      <td className="py-3.5 px-4">Inter-district corridors</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-[#234b4c]">Auto-Rickshaw (3-Wheeler)</td>
                      <td className="py-3.5 px-4">₹ 45 (first 2 km)</td>
                      <td className="py-3.5 px-4">₹ 7.40 / km</td>
                      <td className="py-3.5 px-4">Up to 3 passengers</td>
                      <td className="py-3.5 px-4">Town & City limits</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-[#234b4c]">Mini Bus (Stage Carriage 407)</td>
                      <td className="py-3.5 px-4">₹ 18</td>
                      <td className="py-3.5 px-4">₹ 2.90 / km</td>
                      <td className="py-3.5 px-4">Per seat (18+ seats)</td>
                      <td className="py-3.5 px-4">Regular transit routes</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-bold text-[#234b4c]">Private Tourist Taxi</td>
                      <td className="py-3.5 px-4">₹ 160</td>
                      <td className="py-3.5 px-4">₹ 16.50 / km</td>
                      <td className="py-3.5 px-4">Entire Vehicle (4+1)</td>
                      <td className="py-3.5 px-4">Dedicated hire / sightseeing</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* FAQs Section */}
              <div className="mt-8 pt-6 border-t border-[#e5ece3]">
                <h3 className="font-bold text-base text-[#234b4c] mb-4">
                  Frequently Asked Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {faqs.map((f, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#f8faf6] border border-[#e2eae0]">
                      <h4 className="font-bold text-xs text-[#234b4c]">{f.q}</h4>
                      <p className="text-xs text-[#78908a] mt-1.5 leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
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
            <span>— Simple, User-Friendly J&K Transit Fare Guide</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setShowHelpModal(true)} className="hover:text-[#234b4c]">
              How it Works
            </button>
            <button
              onClick={() => showToast("Rate data is updated daily according to J&K Transport schedules")}
              className="hover:text-[#234b4c]"
            >
              Rate Card Policy
            </button>
            <span className="text-[#dce5dc]">|</span>
            <span>24/7 Helpline: <strong>1033</strong></span>
          </div>
        </div>
      </footer>

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
                <p className="text-xs text-[#78908a]">3 Simple Steps to Fair Travel</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-[#345657] mt-4">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f8faf6] border border-[#e2eae0]">
                <span className="w-6 h-6 rounded-full bg-[#234b4c] text-[#f4f6ed] flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-[#234b4c]">Pick Your Route</h4>
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
                  <h4 className="font-bold text-[#234b4c]">Select Vehicle</h4>
                  <p className="text-[#78908a] mt-0.5">
                    Choose from Shared Cabs (Sumo), Auto-Rickshaws, Mini Buses, or Private Taxis.
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
