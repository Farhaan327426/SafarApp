import React, { useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Calculator,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Compass,
  FileText,
  Info,
  LayoutGrid,
  List,
  MapPin,
  MapPinned,
  Navigation,
  PhoneCall,
  QrCode,
  RefreshCw,
  Route,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Table,
  Zap,
  AlertTriangle,
  Eye,
} from "lucide-react";
import VehicleIllustration, { VEHICLE_VISUAL_META } from "./VehicleIllustration.jsx";
import { getVehicleRouteViability } from "../data/transitZones.js";

export default function DesktopView({
  from,
  to,
  distance,
  setDistance,
  handleFromChange,
  handleToChange,
  handleSwap,
  handleLocationPick,
  searchFromFocus,
  setSearchFromFocus,
  searchToFocus,
  setSearchToFocus,
  vehicle,
  setVehicle,
  chosenVehicle,
  eligibleVehicles,
  visibleVehicles,
  vehicleCategories,
  vehicleCategoryFilter,
  setVehicleCategoryFilter,
  categoryCounts,
  vehicleViewMode,
  setVehicleViewMode,
  activePresets,
  handleSelectPreset,
  popularLocations,
  currentRouteMeta,
  currentRouteProfile,
  terrainRegion,
  setTerrainRegion,
  userRegionOverride,
  setUserRegionOverride,
  contextAlerts,
  fareParts,
  displayFare,
  priceMode,
  setPriceMode,
  handleShare,
  setShowConductorSlip,
  setShowFleetGuide,
  setInspectedVehicleKey,
  showToast,
  hasRoute,
}) {
  const [driverChargedAmount, setDriverChargedAmount] = useState("");
  const [showDisputeCalc, setShowDisputeCalc] = useState(false);

  // Helper to compute calculated fare for any vehicle card on current route
  const getCardFare = (v) => {
    const km = Number(distance) || 0;
    const viability = getVehicleRouteViability(v.key, km, from, to);
    if (!viability.isViable || km <= 0) return 0;

    switch (v.calcType) {
      case "e-rickshaw":
        return Math.max(15, Math.round(km * 15));
      case "e-auto":
        return km <= 1 ? 25 : 25 + Math.round((km - 1) * 20);
      case "stage-slab":
        if (km <= 3) return 9;
        if (km <= 5) return 14;
        if (km <= 10) return 17;
        if (km <= 15) return 20;
        if (km <= 20) return 26;
        return 26 + Math.round((km - 20) * 1.4);
      case "urban-stage":
        if (km <= 3) return 8;
        if (km <= 6) return 12;
        if (km <= 10) return 15;
        return 18;
      case "tourist-group":
        return Math.max(25, Math.round(km * 2.25));
      case "stage-carriage": {
        const rate =
          terrainRegion === "kashmir-plain"
            ? 1.64
            : terrainRegion === "kashmir-hill"
            ? 1.88
            : terrainRegion === "jammu-plain"
            ? 1.12
            : 1.59;
        return Math.max(10, Math.round(km * rate));
      }
      case "stage-carriage-big": {
        const rate =
          terrainRegion === "kashmir-plain"
            ? 1.4
            : terrainRegion === "kashmir-hill"
            ? 1.64
            : terrainRegion === "jammu-plain"
            ? 1.12
            : 1.59;
        return Math.max(10, Math.round(km * rate));
      }
      case "metered-auto":
        return km <= 2 ? 45 : 45 + Math.round((km - 2) * 7.4);
      default:
        return Math.max(15, v.base + Math.round(km * v.perKm) + (v.key === "suv-taxi" ? 20 : 0));
    }
  };

  const chargedNum = Number(driverChargedAmount) || 0;
  const officialNum = Number(displayFare) || 0;
  const overchargeDiff = chargedNum > 0 && officialNum > 0 ? chargedNum - officialNum : 0;

  return (
    <div className="space-y-6">
      {/* Desktop Command Center Hero Bar */}
      <section className="bg-gradient-to-r from-[#1b3d3e] via-[#234b4c] to-[#2e5d5e] rounded-3xl p-6 lg:p-7 text-[#f4f6ed] shadow-lg relative overflow-hidden border border-[#3c6b69]">
        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#f2bd70]/20 text-[#f2bd70] border border-[#f2bd70]/30">
                🖥️ Desktop Command Center
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/15 text-[#e5f0ea]">
                SRO-97 Statutory Shield
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Jammu &amp; Kashmir Transit Regulatory Portal
            </h1>
            <p className="mt-1 text-xs lg:text-sm text-[#c7dad0] max-w-2xl">
              Official statutory fare computation, real-time geofenced operational fleet validation, and instant commuter defense across all 20 districts.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 xl:gap-3 shrink-0">
            <div className="bg-[#142f30]/80 border border-[#386260] px-3.5 py-2 rounded-2xl text-center">
              <p className="text-[10px] text-[#aac2b3] uppercase font-bold">Fleets</p>
              <p className="text-sm font-black text-[#ffffff]">11 Categories</p>
            </div>
            <div className="bg-[#142f30]/80 border border-[#386260] px-3.5 py-2 rounded-2xl text-center">
              <p className="text-[10px] text-[#aac2b3] uppercase font-bold">Coverage</p>
              <p className="text-sm font-black text-[#ffffff]">20 Districts</p>
            </div>
            <div className="bg-[#142f30]/80 border border-[#386260] px-3.5 py-2 rounded-2xl text-center">
              <p className="text-[10px] text-[#aac2b3] uppercase font-bold">Corridors</p>
              <p className="text-sm font-black text-[#f2bd70]">500+ Active</p>
            </div>
            <div className="bg-[#142f30]/80 border border-[#386260] px-3.5 py-2 rounded-2xl text-center">
              <p className="text-[10px] text-[#aac2b3] uppercase font-bold">Engine</p>
              <p className="text-sm font-black text-[#ffffff]">100% Offline</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Corridor Selector Bar */}
      <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-bold text-[#78908a] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Compass size={14} className="text-[#d36b3d]" /> Quick Corridors:
          </span>
          {activePresets.map((preset) => (
            <button
              key={`${preset.from}-${preset.to}`}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                from === preset.from && to === preset.to
                  ? "bg-[#234b4c] text-[#f4f6ed] border-[#234b4c] shadow-xs"
                  : "bg-[#f4f7f2] text-[#345657] border-[#dce5dc] hover:border-[#74a181] hover:bg-[#edf5ee]"
              }`}
            >
              {preset.from} ➔ {preset.to} ({preset.distance} km)
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Command Center Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Route Station & Geographic Intelligence (3.5 / 12 Cols) */}
        <div className="xl:col-span-4 space-y-5">
          {/* Route Builder Box */}
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#e5ece3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center font-black text-xs shadow-xs">
                  1
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#234b4c]">Origin &amp; Destination</h2>
                  <p className="text-[10.5px] text-[#78908a]">J&amp;K Transit Corridors</p>
                </div>
              </div>

              <button
                onClick={() => {
                  handleFromChange("");
                  handleToChange("");
                  setDistance("");
                  setTerrainRegion("kashmir-plain");
                  showToast("Cleared route inputs.");
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#78908a] hover:text-[#d36b3d] transition"
              >
                <RefreshCw size={12} />
                <span>Reset</span>
              </button>
            </div>

            {/* From Input */}
            <div className="relative mb-3">
              <label className="block text-[11px] font-bold text-[#78908a] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d36b3d]"></span> Boarding Hub
              </label>
              <div className="relative">
                <MapPin size={17} className="absolute left-3.5 top-3 text-[#d36b3d]" />
                <input
                  type="text"
                  value={from}
                  onFocus={() => setSearchFromFocus(true)}
                  onChange={(e) => handleFromChange(e.target.value)}
                  placeholder="e.g. Lal Chowk, Jammu Tawi, Katra"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-xs font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181] focus:bg-[#ffffff] transition"
                />
              </div>

              {searchFromFocus && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl shadow-xl p-2 z-30 max-h-52 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-[#e5ece3] mb-1">
                    <p className="text-[10px] font-bold text-[#78908a] uppercase">Popular Hubs (A-Z)</p>
                    <span className="text-[9px] font-bold text-[#557b72] bg-[#edf5ee] px-1.5 py-0.5 rounded">20 Districts</span>
                  </div>
                  {popularLocations
                    .filter((loc) => loc.toLowerCase().includes(from.toLowerCase()))
                    .sort((a, b) => a.localeCompare(b))
                    .map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocationPick("from", loc)}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-[#345657] hover:bg-[#edf5ee] flex items-center justify-between transition"
                      >
                        <span>{loc}</span>
                        <ChevronRight size={12} className="text-[#78908a]" />
                      </button>
                    ))}
                  <button
                    onClick={() => setSearchFromFocus(false)}
                    className="w-full mt-1 text-center text-[10.5px] font-bold text-[#78908a] py-1 hover:text-[#d36b3d]"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1 relative z-10">
              <button
                onClick={handleSwap}
                className="w-8 h-8 rounded-xl bg-[#edf3eb] hover:bg-[#dce9dc] border border-[#dce5dc] text-[#345657] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
                title="Swap Direction"
              >
                <ArrowDownUp size={14} />
              </button>
            </div>

            {/* To Input */}
            <div className="relative mt-1 mb-3">
              <label className="block text-[11px] font-bold text-[#78908a] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#557b72]"></span> Destination Hub
              </label>
              <div className="relative">
                <MapPinned size={17} className="absolute left-3.5 top-3 text-[#557b72]" />
                <input
                  type="text"
                  value={to}
                  onFocus={() => setSearchToFocus(true)}
                  onChange={(e) => handleToChange(e.target.value)}
                  placeholder="e.g. Gulmarg, Pahalgam, Baramulla"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-xs font-bold text-[#234b4c] focus:outline-none focus:ring-2 focus:ring-[#74a181] focus:bg-[#ffffff] transition"
                />
              </div>

              {searchToFocus && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl shadow-xl p-2 z-30 max-h-52 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-[#e5ece3] mb-1">
                    <p className="text-[10px] font-bold text-[#78908a] uppercase">Destinations (A-Z)</p>
                    <span className="text-[9px] font-bold text-[#557b72] bg-[#edf5ee] px-1.5 py-0.5 rounded">20 Districts</span>
                  </div>
                  {popularLocations
                    .filter((loc) => loc.toLowerCase().includes(to.toLowerCase()))
                    .sort((a, b) => a.localeCompare(b))
                    .map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocationPick("to", loc)}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-[#345657] hover:bg-[#edf5ee] flex items-center justify-between transition"
                      >
                        <span>{loc}</span>
                        <ChevronRight size={12} className="text-[#78908a]" />
                      </button>
                    ))}
                  <button
                    onClick={() => setSearchToFocus(false)}
                    className="w-full mt-1 text-center text-[10.5px] font-bold text-[#78908a] py-1 hover:text-[#d36b3d]"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Geodesic Distance & Highway Metadata */}
            <div className="p-3 rounded-2xl bg-[#edf5ee] border border-[#d2e4d4] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#78908a] font-medium">Road Distance:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#234b4c] text-sm">{distance || 0} KM</span>
                  <input
                    type="number"
                    min="1"
                    max="800"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-16 py-0.5 px-1.5 rounded-lg bg-white border border-[#c5d8c8] text-xs font-bold text-[#234b4c]"
                    title="Manual KM adjustment"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#78908a] font-medium">Drive Duration:</span>
                <span className="font-bold text-[#345657]">{currentRouteMeta.duration}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#78908a] font-medium">Terrain Profile:</span>
                <span className="font-semibold text-[#426a54] text-[11px]">
                  {currentRouteMeta.terrain}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#d8e8da]">
                <span className="text-[#78908a] font-medium">Highway:</span>
                <span className="font-semibold text-[#234b4c] text-[11px] truncate max-w-[170px]" title={currentRouteMeta.highway}>
                  {currentRouteMeta.highway}
                </span>
              </div>
            </div>

            {/* Division / Ambiguity Override */}
            {hasRoute && currentRouteProfile?.isAmbiguous && (
              <div className="mt-3 p-3 rounded-xl bg-[#fefce8] border border-[#fef08a] text-xs text-[#854d0e]">
                <p className="font-bold text-[11px]">Gateway Route Detected:</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    onClick={() => setUserRegionOverride("jammu")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      userRegionOverride === "jammu" ? "bg-[#854d0e] text-white" : "bg-[#fef9c3] text-[#854d0e]"
                    }`}
                  >
                    Jammu
                  </button>
                  <button
                    onClick={() => setUserRegionOverride("kashmir")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      userRegionOverride === "kashmir" ? "bg-[#854d0e] text-white" : "bg-[#fef9c3] text-[#854d0e]"
                    }`}
                  >
                    Kashmir
                  </button>
                  <button
                    onClick={() => setUserRegionOverride("both")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      userRegionOverride === "both" ? "bg-[#854d0e] text-white" : "bg-[#fef9c3] text-[#854d0e]"
                    }`}
                  >
                    Cross-Division
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mountain Pass Advisory & Hazard Center */}
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#78908a] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#557b72]" /> Real-time Alpine Alerts
            </h3>

            {contextAlerts.isWinterClosure && (
              <div className="p-3 rounded-xl bg-[#ebf3f7] border border-[#a8c9db] text-[#1f4860] text-xs flex items-start gap-2">
                <Snowflake size={15} className="text-[#2b6cb0] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[11px]">Seasonal Mountain Pass Advisory</p>
                  <p className="text-[10.5px] mt-0.5 text-[#2c5282]">
                    High passes (Mughal Road / Sinthan / Razdan) are closed during heavy snow. Divert via NH-44.
                  </p>
                </div>
              </div>
            )}

            {contextAlerts.isBatamalooNorthRedirect && (
              <div className="p-3 rounded-xl bg-[#fdf5eb] border border-[#f0cfa0] text-[#784319] text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="text-[#d36b3d] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[11px]">North Terminal Notice</p>
                  <p className="text-[10.5px] mt-0.5 text-[#8f5223]">
                    North-bound traffic departs from Parimpora Terminal. Connect via city feeder.
                  </p>
                </div>
              </div>
            )}

            {contextAlerts.isFrontier && (
              <div className="p-3 rounded-xl bg-[#f0f4ee] border border-[#c3d8c6] text-[#234b4c] text-xs flex items-start gap-2">
                <ShieldCheck size={15} className="text-[#557b72] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[11px]">Frontier / LOC Transit Zone</p>
                  <p className="text-[10.5px] mt-0.5 text-[#345657]">
                    Convoy timing and civil ID clearance apply in Gurez, Karnah, and Uri.
                  </p>
                </div>
              </div>
            )}

            {!contextAlerts.isWinterClosure && !contextAlerts.isBatamalooNorthRedirect && !contextAlerts.isFrontier && (
              <div className="p-3 rounded-xl bg-[#edf5ee] border border-[#d2e4d4] text-[11px] text-[#345657]">
                <p className="font-semibold">🛣️ Arterial Highways Clear</p>
                <p className="text-[10.5px] text-[#557b72] mt-0.5">
                  NH-44 Expressway, Chenani-Nashri Tunnel, and Navyug Tunnel operational.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Statutory Fleet Selection & Comparative Rate Matrix (5 / 12 Cols) */}
        <div className="xl:col-span-5 space-y-5">
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 shadow-sm">
            {/* Header & View Switcher */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#e5ece3]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#234b4c] text-[#f2bd70] flex items-center justify-center font-black text-xs shadow-xs">
                  2
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#234b4c]">Statutory Vehicle Fleet</h2>
                  <p className="text-[10.5px] text-[#78908a]">11 Official Gazette Categories</p>
                </div>
              </div>

              {/* View Mode Toggle: Visual Cards vs Side-by-Side Comparison Table */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center p-1 bg-[#edf3eb] rounded-xl border border-[#dce5dc]">
                  <button
                    onClick={() => setVehicleViewMode("visual")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      vehicleViewMode === "visual"
                        ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                        : "text-[#557b72] hover:text-[#234b4c]"
                    }`}
                    title="Visual HD Cards"
                  >
                    <LayoutGrid size={12} />
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setVehicleViewMode("table")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      vehicleViewMode === "table"
                        ? "bg-[#234b4c] text-[#f4f6ed] shadow-xs"
                        : "text-[#557b72] hover:text-[#234b4c]"
                    }`}
                    title="Compare Table"
                  >
                    <Table size={12} />
                    <span>Compare Matrix</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setInspectedVehicleKey(vehicle);
                    setShowFleetGuide(true);
                  }}
                  className="p-1.5 rounded-xl bg-[#eef4ed] text-[#234b4c] hover:bg-[#dfebe0] border border-[#d2e4d4] transition"
                  title="Open Fleet Guide"
                >
                  <Eye size={15} />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
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

            {/* View Mode 1: Visual Vehicle Cards */}
            {vehicleViewMode === "visual" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[720px] overflow-y-auto pr-1">
                {visibleVehicles.map((v) => {
                  const isSelected = vehicle === v.key || vehicle === v.id;
                  const km = Number(distance) || 0;
                  const viability = getVehicleRouteViability(v.key, km, from, to);
                  const cardFare = getCardFare(v);
                  const visualMeta = VEHICLE_VISUAL_META[v.key];

                  return (
                    <button
                      key={v.key}
                      onClick={() => {
                        setVehicle(v.key);
                        showToast(`Selected ${v.label}`);
                      }}
                      className={`p-3 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#f4f7f2] border-[#234b4c] shadow-sm ring-2 ring-[#234b4c]/10"
                          : !viability.isViable && hasRoute
                          ? "bg-[#fdfaf8] border-[#ebdcd5] opacity-80"
                          : "bg-[#ffffff] border-[#e2eae0] hover:border-[#adc9b2] hover:bg-[#f8faf6]"
                      }`}
                    >
                      {/* Vehicle Illustration Render Box */}
                      <div className="w-full h-24 rounded-xl bg-gradient-to-b from-[#f3f7f1] to-[#e4ece2] border border-[#d8e4d8] flex items-center justify-center p-2 relative overflow-hidden mb-2">
                        <VehicleIllustration vehicleKey={v.key} className="w-full h-full object-contain filter drop-shadow-xs" />
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#234b4c] text-[#f4f6ed]">
                          {v.badge}
                        </span>
                        <div className="absolute top-1.5 right-1.5">
                          {hasRoute && !viability.isViable ? (
                            <span className="text-[9px] font-bold text-[#b91c1c] bg-[#fee2e2] px-1.5 py-0.5 rounded border border-[#fca5a5]">
                              Not Serviced
                            </span>
                          ) : hasRoute && cardFare > 0 ? (
                            <span className="text-[11px] font-black text-[#234b4c] bg-white px-2 py-0.5 rounded-lg border border-[#d2e4d4] shadow-xs">
                              ₹{cardFare}
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-bold text-[#557b72] bg-white/90 px-1.5 py-0.5 rounded">
                              {v.calcType === "urban-stage" ? "₹8-₹18" : v.calcType === "stage-slab" ? "₹9-₹26" : `₹${v.perKm}/km`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-[#234b4c] truncate">{v.label}</h4>
                          {isSelected && <CheckCircle2 size={13} className="text-[#557b72]" />}
                        </div>
                        <p className="text-[10px] text-[#78908a] truncate mt-0.5">{visualMeta?.name || v.sublabel}</p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-[#e2eae0] flex items-center justify-between text-[10px]">
                        <span className="text-[#78908a]">👥 {v.capacity}</span>
                        <span className="font-bold text-[#234b4c]">
                          {v.isPerSeat ? "Per Seat" : "Full Cab"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* View Mode 2: Multi-Vehicle Side-by-Side Comparison Matrix */
              <div className="overflow-x-auto border border-[#e2eae0] rounded-2xl bg-white max-h-[720px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#edf5ee] border-b border-[#dce5dc] z-10 text-[10px] uppercase text-[#78908a]">
                    <tr>
                      <th className="py-2.5 px-3">Vehicle Type</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Fare for Route</th>
                      <th className="py-2.5 px-3">Capacity</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaf0e9] text-[#345657]">
                    {visibleVehicles.map((v) => {
                      const isSelected = vehicle === v.key || vehicle === v.id;
                      const cardFare = getCardFare(v);
                      const km = Number(distance) || 0;
                      const viability = getVehicleRouteViability(v.key, km, from, to);

                      return (
                        <tr
                          key={v.key}
                          onClick={() => {
                            setVehicle(v.key);
                            showToast(`Selected ${v.label}`);
                          }}
                          className={`cursor-pointer transition hover:bg-[#f4f8f4] ${
                            isSelected ? "bg-[#eaf3eb] font-bold" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 flex items-center gap-2">
                            <div className="w-9 h-7 rounded bg-[#edf3eb] p-0.5 flex items-center justify-center shrink-0 border border-[#dce5dc]">
                              <VehicleIllustration vehicleKey={v.key} className="w-full h-full object-contain" />
                            </div>
                            <span className="truncate max-w-[120px] text-[#234b4c] font-bold">{v.label}</span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#78908a]">
                            {v.category === "bus" ? "Stage Bus" : v.category === "shared" ? "Shared Cab" : v.category === "ev" ? "EV / Auto" : "Contract Taxi"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {!viability.isViable && hasRoute ? (
                              <span className="text-[10px] font-bold text-[#b91c1c] bg-[#fee2e2] px-1.5 py-0.5 rounded">
                                Limit
                              </span>
                            ) : cardFare > 0 ? (
                              <span className="font-extrabold text-[#234b4c] text-sm">₹{cardFare}</span>
                            ) : (
                              <span className="text-[#78908a]">{v.calcType === "urban-stage" ? "₹8-₹18" : `₹${v.perKm}/km`}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#557b72]">{v.capacity}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVehicle(v.key);
                                showToast(`Selected ${v.label}`);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition ${
                                isSelected
                                  ? "bg-[#234b4c] text-[#f4f6ed]"
                                  : "bg-[#edf5ee] text-[#234b4c] hover:bg-[#d8e8da]"
                              }`}
                            >
                              {isSelected ? "Active" : "Pick"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Fare Result, Conductor Slip & Dispute Auditor (3.5 / 12 Cols) */}
        <div className="xl:col-span-3 space-y-5">
          {/* Live Official Fare Card */}
          <div className="bg-gradient-to-br from-[#234b4c] via-[#204445] to-[#183637] rounded-3xl p-5 sm:p-6 text-[#f4f6ed] shadow-xl border border-[#3c6b69] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#f2bd70] bg-[#f2bd70]/20 px-2.5 py-0.5 rounded-full border border-[#f2bd70]/30 flex items-center gap-1">
                <CircleGauge size={12} /> Official Tariff
              </span>
              <span className="text-[10px] font-bold text-[#cbe1d3] bg-[#386260] px-2 py-0.5 rounded-md">
                {fareParts.isViable ? "Statutory Ceiling" : "Out of Zone"}
              </span>
            </div>

            {/* Per Seat vs Full Cab Mode Toggle */}
            {chosenVehicle.isPerSeat && fareParts.isViable && !fareParts.isZeroEligible && (
              <div className="mt-3 flex items-center bg-[#183637]/80 p-1 rounded-xl border border-[#386260]">
                <button
                  onClick={() => setPriceMode("per-seat")}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition ${
                    priceMode === "per-seat" ? "bg-[#d36b3d] text-white" : "text-[#c4d6cb]"
                  }`}
                >
                  Per Seat
                </button>
                <button
                  onClick={() => setPriceMode("full-cab")}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition ${
                    priceMode === "full-cab" ? "bg-[#d36b3d] text-white" : "text-[#c4d6cb]"
                  }`}
                >
                  Full Cab
                </button>
              </div>
            )}

            {/* Big Currency Display */}
            <div className="mt-3.5">
              <p className="text-[10px] uppercase font-bold text-[#aac2b3] tracking-wide">Government Approved Rate</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-4xl font-black text-white">
                  {!hasRoute
                    ? "₹ —"
                    : fareParts.isViable && displayFare > 0
                    ? `₹${displayFare.toLocaleString("en-IN")}`
                    : "No Fare"}
                </span>
                <span className="text-xs text-[#f2bd70] font-semibold">
                  {hasRoute && fareParts.isViable
                    ? chosenVehicle.isPerSeat && priceMode === "per-seat"
                      ? "(Per Passenger)"
                      : "(Entire Vehicle)"
                    : ""}
                </span>
              </div>
            </div>

            {/* Active Vehicle Visual Snapshot */}
            <div className="mt-3.5 p-2.5 rounded-xl bg-[#142e2f] border border-[#386260] flex items-center gap-2.5">
              <div className="w-16 h-12 rounded-lg bg-[#193a3c] p-1 flex items-center justify-center shrink-0 border border-[#3c6b69]/70">
                <VehicleIllustration vehicleKey={chosenVehicle.key} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{chosenVehicle.label}</h4>
                <p className="text-[10px] text-[#b4d2c2] truncate">
                  {VEHICLE_VISUAL_META[chosenVehicle.key]?.hallmark}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex-1 py-2 rounded-xl bg-[#f4f6ed] text-[#234b4c] font-bold text-xs hover:bg-[#e4eae0] transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Share2 size={13} />
                <span>Share</span>
              </button>
              {hasRoute && fareParts.isViable && displayFare > 0 && (
                <button
                  onClick={() => setShowConductorSlip(true)}
                  className="flex-1 py-2 rounded-xl bg-[#d36b3d] text-white font-bold text-xs hover:bg-[#c05e32] transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <QrCode size={13} />
                  <span>Fare Pass</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Fare Dispute & Overcharge Auditor Station */}
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e5ece3]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#d36b3d]" />
                <h3 className="font-bold text-xs text-[#234b4c]">Dispute &amp; Overcharge Check</h3>
              </div>
              <button
                onClick={() => setShowDisputeCalc((prev) => !prev)}
                className="text-[10px] font-bold text-[#557b72] hover:text-[#234b4c]"
              >
                {showDisputeCalc ? "Minimize" : "Audit"}
              </button>
            </div>

            <p className="text-[11px] text-[#78908a]">
              Did the driver or conductor demand an extra amount above the statutory gazetted ceiling?
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Driver charged (₹)"
                  value={driverChargedAmount}
                  onChange={(e) => setDriverChargedAmount(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-xs font-bold text-[#234b4c]"
                />
              </div>

              {chargedNum > 0 && officialNum > 0 && (
                <div
                  className={`p-2.5 rounded-xl text-xs ${
                    overchargeDiff > 0
                      ? "bg-[#fff2f2] border border-[#fca5a5] text-[#991b1b]"
                      : "bg-[#edf5ee] border border-[#d2e4d4] text-[#234b4c]"
                  }`}
                >
                  {overchargeDiff > 0 ? (
                    <div>
                      <p className="font-extrabold text-[12px] flex items-center gap-1">
                        <span>⚠️ Overcharged by ₹{overchargeDiff}!</span>
                      </p>
                      <p className="text-[10.5px] mt-0.5 leading-snug">
                        Violation under Section 192A Motor Vehicles Act. You can dispute this charge or generate a formal grievance notice.
                      </p>
                      <a
                        href="transit-defense.html"
                        className="mt-1.5 inline-block text-[10.5px] font-bold text-[#dc2626] underline"
                      >
                        Open Transit Defense Locker ➔
                      </a>
                    </div>
                  ) : (
                    <p className="font-bold text-[11px] text-[#16a34a] flex items-center gap-1">
                      <Check size={14} /> Charged within legal limit (₹{officialNum})
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Transparent Rate Breakdown */}
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-3xl p-5 shadow-sm text-xs space-y-2">
            <h3 className="font-bold text-xs text-[#234b4c] uppercase tracking-wider pb-2 border-b border-[#e5ece3]">
              Statutory Formula
            </h3>
            <div className="flex justify-between text-[#78908a]">
              <span>Formula:</span>
              <span className="font-semibold text-[#234b4c] text-right truncate max-w-[150px]">
                {fareParts.formulaDesc}
              </span>
            </div>
            <div className="flex justify-between text-[#78908a]">
              <span>Permit Class:</span>
              <span className="font-semibold text-[#234b4c]">{chosenVehicle.badge}</span>
            </div>
            <div className="flex justify-between text-[#78908a]">
              <span>Total Route KM:</span>
              <span className="font-semibold text-[#234b4c]">{distance || 0} KM</span>
            </div>
            <div className="pt-2 border-t border-[#e5ece3] flex justify-between font-bold text-[#234b4c]">
              <span>Guaranteed Ceiling:</span>
              <span className="text-[#d36b3d]">{displayFare ? `₹${displayFare}` : "—"}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
