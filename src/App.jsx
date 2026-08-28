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
  Navigation,
  PhoneCall,
  RefreshCw,
  Route,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  X,
} from "lucide-react";

const vehicleCategories = [
  { key: "all", label: "All Vehicles (9)" },
  { key: "shared", label: "Shared Cabs & Vans" },
  { key: "bus", label: "Private Buses" },
  { key: "auto", label: "Autos & E-Rickshaws" },
  { key: "taxi", label: "Private Taxis" },
];

const vehicleOptions = [
  {
    key: "shared-cab",
    category: "shared",
    label: "Shared Maxi-Cab",
    sublabel: "Tata Sumo / Bolero / Tavera",
    detail: "Standard passenger seat on inter-district corridors",
    icon: CarFront,
    base: 35,
    perKm: 5.2,
    capacity: "4 to 7 Seats",
    badge: "Most Popular",
    isPerSeat: true,
    seatsMultiplier: 5,
    color: "#d36b3d",
  },
  {
    key: "tata-magic",
    category: "shared",
    label: "Tata Magic / Van",
    sublabel: "Maruti Eeco / Magic / Winger",
    detail: "Feeder routes & rural-to-town transit",
    icon: CarFront,
    base: 25,
    perKm: 4.2,
    capacity: "6 to 8 Seats",
    badge: "Rural & Feeder",
    isPerSeat: true,
    seatsMultiplier: 7,
    color: "#c27438",
  },
  {
    key: "mini-bus",
    category: "bus",
    label: "Mini Bus / 407",
    sublabel: "Tata 407 / Swaraj Mazda / Matador",
    detail: "Budget local stage carriage across towns & hubs",
    icon: BusFront,
    base: 18,
    perKm: 2.9,
    capacity: "Per Passenger (18-24 Seats)",
    badge: "High Frequency",
    isPerSeat: true,
    seatsMultiplier: 18,
    color: "#557b72",
  },
  {
    key: "private-bus",
    category: "bus",
    label: "Private 2+2 Bus",
    sublabel: "Standard 32-52 Seater (Non-SRTC)",
    detail: "Inter-district long route passenger bus",
    icon: BusFront,
    base: 15,
    perKm: 2.4,
    capacity: "Per Passenger (32+ Seats)",
    badge: "Lowest Fare",
    isPerSeat: true,
    seatsMultiplier: 32,
    color: "#3f6e5b",
  },
  {
    key: "auto",
    category: "auto",
    label: "Auto-Rickshaw (Petrol/CNG)",
    sublabel: "3-Wheeler Metered Auto",
    detail: "City & town short-to-medium trips (up to 3 persons)",
    icon: CarFront,
    base: 45,
    perKm: 7.4,
    capacity: "Up to 3 Persons",
    badge: "City Travel",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#bc8a20",
  },
  {
    key: "e-auto",
    category: "auto",
    label: "E-Auto (Electric Auto)",
    sublabel: "Battery Electric 3-Wheeler (L5M)",
    detail: "Eco-friendly town transit with regulated rates",
    icon: Zap,
    base: 30,
    perKm: 6.0,
    capacity: "Up to 3 Persons",
    badge: "Zero Emission",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#2e8b57",
  },
  {
    key: "e-rickshaw",
    category: "auto",
    label: "E-Rickshaw (Toto / Cart)",
    sublabel: "Local Colony & Market Cart",
    detail: "Ultra-short local trips & market connections",
    icon: Zap,
    base: 15,
    perKm: 4.0,
    capacity: "Up to 4 Persons / Per Seat",
    badge: "Local Shuttles",
    isPerSeat: true,
    seatsMultiplier: 4,
    color: "#4a7c59",
  },
  {
    key: "taxi",
    category: "taxi",
    label: "Private Sedan Taxi",
    sublabel: "Maruti Dzire / Toyota Etios",
    detail: "Direct point-to-point dedicated sedan hire",
    icon: CarFront,
    base: 140,
    perKm: 14.5,
    capacity: "Entire Vehicle (4+1)",
    badge: "Dedicated Sedan",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#3e6b8a",
  },
  {
    key: "suv-taxi",
    category: "taxi",
    label: "Private SUV Taxi",
    sublabel: "Innova Crysta / Scorpio / Xylo",
    detail: "Dedicated mountain pass & tourist point-to-point hire",
    icon: CarFront,
    base: 200,
    perKm: 19.5,
    capacity: "Entire Vehicle (6+1 / 7+1)",
    badge: "Mountain & Tour",
    isPerSeat: false,
    seatsMultiplier: 1,
    color: "#28536b",
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
  },
  {
    from: "Srinagar",
    to: "Pahalgam",
    distance: 92,
    duration: "2h 20m",
    terrain: "Scenic Valley Corridor",
    highway: "KP Road / NH-44",
    stops: ["Pampore", "Awantipora", "Anantnag"],
  },
  {
    from: "Srinagar",
    to: "Sonmarg",
    distance: 80,
    duration: "2h 10m",
    terrain: "High Mountain Highway",
    highway: "NH-1 (Srinagar-Leh)",
    stops: ["Ganderbal", "Kangan", "Gund"],
  },
  {
    from: "Jammu",
    to: "Katra",
    distance: 49,
    duration: "1h 14m",
    terrain: "Expressway Foothills",
    highway: "NH-44 / Katra Bypass",
    stops: ["Nagrota", "Jhajjar Kotli"],
  },
  {
    from: "Anantnag",
    to: "Srinagar",
    distance: 53,
    duration: "1h 20m",
    terrain: "Plains / 4-Lane Highway",
    highway: "NH-44 Valley Expressway",
    stops: ["Bijbehara", "Awantipora", "Pampore"],
  },
  {
    from: "Sopore",
    to: "Srinagar",
    distance: 49,
    duration: "1h 16m",
    terrain: "Plains Road",
    highway: "Sopore-Srinagar Highway",
    stops: ["Sangrama", "Pattan", "Shalteng"],
  },
];

const recentEstimatesList = [
  {
    route: "Srinagar → Gulmarg",
    meta: "Shared Maxi-Cab · Tangmarg corridor",
    amount: "₹ 300",
    time: "Today, 10:40 AM",
    vehicleKey: "shared-cab",
    from: "Srinagar",
    to: "Gulmarg",
    distance: 51,
  },
  {
    route: "Jammu → Katra",
    meta: "Private Sedan Taxi · Vaishno Devi route",
    amount: "₹ 850",
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
];

export default function App() {
  const [activeNav, setActiveNav] = useState("Fare calculator");
  const [from, setFrom] = useState("Srinagar");
  const [to, setTo] = useState("Gulmarg");
  const [distance, setDistance] = useState("51");
  const [vehicle, setVehicle] = useState("shared-cab");
  const [vehicleCategoryFilter, setVehicleCategoryFilter] = useState("all");
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

  const filteredVehicles = useMemo(() => {
    if (vehicleCategoryFilter === "all") return vehicleOptions;
    return vehicleOptions.filter((v) => v.category === vehicleCategoryFilter);
  }, [vehicleCategoryFilter]);

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
    
    // Regional local adjustment according to vehicle class
    const localAdjustment =
      chosenVehicle.key === "shared-cab"
        ? 0
        : chosenVehicle.key === "tata-magic"
        ? -2
        : chosenVehicle.key === "mini-bus"
        ? -4
        : chosenVehicle.key === "private-bus"
        ? -5
        : chosenVehicle.key === "auto"
        ? 5
        : chosenVehicle.key === "e-auto"
        ? 0
        : chosenVehicle.key === "e-rickshaw"
        ? -2
        : chosenVehicle.key === "suv-taxi"
        ? 20
        : 10;

    const totalSingle = Math.max(10, base + distanceCost + localAdjustment);
    const fullCabCost = chosenVehicle.isPerSeat
      ? totalSingle * chosenVehicle.seatsMultiplier
      : totalSingle;

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
    setFrom(to);
    setTo(oldFrom);
    showToast(`Swapped: ${to} ⇄ ${from}`);
  };

  const handleSelectPreset = (preset) => {
    setFrom(preset.from);
    setTo(preset.to);
    setDistance(String(preset.distance));
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
    const text = `🚗 Safar Fare Estimate: ${from} to ${to} (${distance} km) via ${chosenVehicle.label} is ₹${displayFare}. Official J&K transit rates on Safar.`;
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
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#edf5ee] border border-[#d2e4d4] text-[11px] text-[#426a54] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#529b68] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#529b68]"></span>
              </span>
              <span>SRO-97 Verified Rates</span>
            </div>

            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-[#345657] bg-[#f0f4ee] hover:bg-[#e4ece2] border border-[#dce5dc] transition"
              title="How Safar Works"
            >
              <CircleHelp size={16} className="text-[#d36b3d]" />
              <span className="hidden sm:inline">Help</span>
            </button>

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
          </div>
        </div>
      )}

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeNav === "Fare calculator" && (
          <div className="space-y-6">
            {/* Hero Card */}
            <section className="bg-gradient-to-r from-[#234b4c] via-[#2c5b5c] to-[#345657] rounded-3xl p-6 sm:p-8 text-[#f4f6ed] shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2bd70]/20 text-[#f2bd70] border border-[#f2bd70]/30 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles size={13} />
                  <span>Official Transit Fare Guide</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Know the exact fare <br className="hidden sm:block" />
                  before you board across J&K.
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[#c7dad0] leading-relaxed">
                  Accurate government statutory rates for all 9 commercial passenger vehicles in Jammu & Kashmir.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#183637]/80 border border-[#4d7f7c]/60 text-[11px] text-[#f2bd70]">
                    <BusFront size={13} />
                    <span><strong>5,900+ Private Fleet:</strong> Stage carriages, minibuses (Matadors) & private service buses power the vast bulk of J&K transit</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#183637]/60 border border-[#4d7f7c]/40 text-[10px] text-[#c4d6cb]">
                    <ShieldCheck size={12} className="text-[#74a181]" />
                    <span>Excludes Govt SRTC & E-buses</span>
                  </div>
                </div>
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
                          onChange={(e) => setFrom(e.target.value)}
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
                          onChange={(e) => setTo(e.target.value)}
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
                          onChange={(e) => setDistance(e.target.value)}
                          className="w-full py-2 pl-3 pr-10 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-sm font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181]"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-[#78908a]">
                          KM
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Vehicle Selection Cards */}
                <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#e5ece3]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#e5eee4] text-[#345657] flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#234b4c]">Select Vehicle Type</h2>
                        <p className="text-[11px] text-[#78908a]">
                          All 9 commercial transit categories across Jammu & Kashmir
                        </p>
                      </div>
                    </div>

                    {/* Exclusions Notice */}
                    <span className="text-[10px] font-bold text-[#78908a] bg-[#eef4ed] px-2.5 py-1 rounded-lg border border-[#dce5dc] self-start sm:self-auto">
                      Non-SRTC & Non-E-Bus
                    </span>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3.5 scrollbar-none">
                    {vehicleCategories.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setVehicleCategoryFilter(cat.key)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition ${
                          vehicleCategoryFilter === cat.key
                            ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                            : "bg-[#f0f4ee] text-[#557b72] hover:bg-[#e4ece2]"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Vehicle Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredVehicles.map((v) => {
                      const Icon = v.icon;
                      const selected = vehicle === v.key;
                      return (
                        <button
                          key={v.key}
                          onClick={() => {
                            setVehicle(v.key);
                            showToast(`Selected ${v.label}`);
                          }}
                          className={`relative p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                            selected
                              ? "bg-[#f4f7f2] border-[#234b4c] shadow-md ring-2 ring-[#234b4c]/10"
                              : "bg-[#fbfcf8] border-[#e2eae0] hover:border-[#adc9b2] hover:bg-[#f8faf6]"
                          }`}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
                              style={{
                                backgroundColor: selected ? "#234b4c" : "#edf3eb",
                                color: selected ? "#f2bd70" : v.color,
                              }}
                            >
                              <Icon size={18} />
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

                          <div className="mt-2.5">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-[13px] text-[#234b4c]">{v.label}</h3>
                              {selected && <CheckCircle2 size={14} className="text-[#557b72]" />}
                            </div>
                            <p className="text-[11px] font-medium text-[#78908a]">{v.sublabel}</p>
                            <p className="text-[10px] text-[#8a9c95] mt-0.5 leading-snug">{v.detail}</p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#e2eae0] flex items-center justify-between text-[11px]">
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
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#f2bd70] bg-[#f2bd70]/15 px-2.5 py-1 rounded-full border border-[#f2bd70]/25">
                        <CircleGauge size={13} />
                        <span>Official Fare Estimate</span>
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
                  {chosenVehicle.isPerSeat ? (
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
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight text-[#ffffff]">
                        ₹{displayFare.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-[#f2bd70] font-semibold">
                        {!chosenVehicle.isPerSeat
                          ? `(Entire ${chosenVehicle.label})`
                          : priceMode === "full-cab"
                          ? `(Entire Vehicle - ${chosenVehicle.seatsMultiplier} Seats)`
                          : "(Per Passenger Seat)"}
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
                      <span>Copy / Share Fare</span>
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
                      <span className="font-extrabold text-[#234b4c]">Total Fare Estimate</span>
                      <span className="font-extrabold text-[#d36b3d] text-base">
                        ₹{displayFare.toLocaleString("en-IN")}
                      </span>
                    </div>
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
          </div>
        )}

        {/* Other tabs */}
        {activeNav === "Route guide" && (
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#234b4c] pb-4 border-b border-[#e5ece3]">
              J&K Transit Corridors Directory
            </h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routePresets.map((r) => (
                <div key={`${r.from}-${r.to}`} className="p-5 rounded-2xl bg-[#f8faf6] border border-[#e2eae0]">
                  <div className="flex justify-between items-center text-sm font-bold text-[#234b4c]">
                    <span>{r.from} ➔ {r.to}</span>
                    <span className="text-xs text-[#d36b3d] bg-[#fbf3ec] px-2 py-0.5 rounded">{r.duration}</span>
                  </div>
                  <p className="text-xs text-[#78908a] mt-2">{r.distance} km • {r.highway}</p>
                  <button
                    onClick={() => {
                      handleSelectPreset(r);
                      setActiveNav("Fare calculator");
                    }}
                    className="mt-4 w-full py-2 bg-[#e5eee4] text-[#234b4c] font-bold text-xs rounded-xl hover:bg-[#234b4c] hover:text-[#f4f6ed] transition"
                  >
                    Calculate This Route ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
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
                Official J&K Transport Fare Schedules (SRO-97)
              </h2>
              <p className="text-xs text-[#78908a] mt-1">
                Mandatory maximum fare ceiling rates for all 9 non-SRTC commercial passenger vehicles in Jammu & Kashmir.
              </p>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#dce5dc] text-[#78908a] uppercase text-[10px]">
                    <th className="py-3 px-4">Vehicle Category</th>
                    <th className="py-3 px-4">Base Minimum Fare</th>
                    <th className="py-3 px-4">Rate per KM</th>
                    <th className="py-3 px-4">Standard Seating</th>
                    <th className="py-3 px-4">Transit Applicability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaf0e9] font-medium text-[#345657]">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">Shared Maxi-Cab (Sumo/Tavera)</td>
                    <td className="py-3.5 px-4">₹ 35</td>
                    <td className="py-3.5 px-4">₹ 5.20 / pass-km</td>
                    <td className="py-3.5 px-4">4+1 to 7+1</td>
                    <td className="py-3.5 px-4">Inter-district corridors</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">Tata Magic / Passenger Van</td>
                    <td className="py-3.5 px-4">₹ 25</td>
                    <td className="py-3.5 px-4">₹ 4.20 / pass-km</td>
                    <td className="py-3.5 px-4">6 to 8 seats</td>
                    <td className="py-3.5 px-4">Feeder & rural routes</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">Mini Bus (Stage Carriage 407)</td>
                    <td className="py-3.5 px-4">₹ 18</td>
                    <td className="py-3.5 px-4">₹ 2.90 / km</td>
                    <td className="py-3.5 px-4">Per seat (18-24)</td>
                    <td className="py-3.5 px-4">Town & district routes</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">Private 2+2 Bus (Non-SRTC)</td>
                    <td className="py-3.5 px-4">₹ 15</td>
                    <td className="py-3.5 px-4">₹ 2.40 / km</td>
                    <td className="py-3.5 px-4">Per seat (32+)</td>
                    <td className="py-3.5 px-4">Long distance routes</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">Auto-Rickshaw (Petrol/CNG)</td>
                    <td className="py-3.5 px-4">₹ 45 (first 2 km)</td>
                    <td className="py-3.5 px-4">₹ 7.40 / km</td>
                    <td className="py-3.5 px-4">Up to 3 passengers</td>
                    <td className="py-3.5 px-4">City & town limits</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">E-Auto (Electric Auto)</td>
                    <td className="py-3.5 px-4">₹ 30</td>
                    <td className="py-3.5 px-4">₹ 6.00 / km</td>
                    <td className="py-3.5 px-4">Up to 3 passengers</td>
                    <td className="py-3.5 px-4">Urban zero-emission</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">E-Rickshaw (Toto / Cart)</td>
                    <td className="py-3.5 px-4">₹ 15</td>
                    <td className="py-3.5 px-4">₹ 4.00 / km</td>
                    <td className="py-3.5 px-4">Up to 4 passengers</td>
                    <td className="py-3.5 px-4">Local colony & market</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">Private Sedan Taxi (Dzire/Etios)</td>
                    <td className="py-3.5 px-4">₹ 140</td>
                    <td className="py-3.5 px-4">₹ 14.50 / km</td>
                    <td className="py-3.5 px-4">Entire vehicle (4+1)</td>
                    <td className="py-3.5 px-4">Dedicated sedan hire</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#234b4c]">Private SUV Taxi (Innova/Crysta)</td>
                    <td className="py-3.5 px-4">₹ 200</td>
                    <td className="py-3.5 px-4">₹ 19.50 / km</td>
                    <td className="py-3.5 px-4">Entire vehicle (6+1/7+1)</td>
                    <td className="py-3.5 px-4">Mountain pass & tours</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Private Fleet Context Information Card */}
            <div className="mt-6 p-5 rounded-2xl bg-[#edf5ee] border border-[#d2e4d4] flex flex-col sm:flex-row items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center shrink-0">
                <BusFront size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#234b4c]">
                  J&K Private Transit Fleet Dynamics (5,900+ Registered Fleet)
                </h4>
                <p className="text-xs text-[#426a54] leading-relaxed">
                  <strong>Private Fleet Reality:</strong> Private stage carriages, minibuses (commonly known as <strong>Matadors</strong>), and private service vehicles make up the vast bulk of public transit across Jammu & Kashmir, with over <strong>5,900 private service buses</strong> actively registered. Safar provides transparent legal maximum fare ceilings for this critical private lifeline.
                </p>
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
                <p className="text-xs text-[#78908a]">3 Simple Steps to Check Your Fare</p>
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
                  <h4 className="font-bold text-[#234b4c]">Select Vehicle (9 J&K Categories)</h4>
                  <p className="text-[#78908a] mt-0.5">
                    Choose from Shared Cabs, Tata Magic, Mini Buses, Private Buses, Autos, E-Autos, E-Rickshaws, Sedan Taxis, and SUV Taxis.
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
