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
  Zap,
  AlertTriangle,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import VehicleIllustration, { VEHICLE_VISUAL_META } from "./VehicleIllustration.jsx";
import { getVehicleRouteViability } from "../data/transitZones.js";

export default function MobileView({
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
  // Mobile Tab State: 'fares' | 'compare' | 'dispute' | 'rights'
  const [mobileActiveTab, setMobileActiveTab] = useState("fares");
  const [driverChargedAmount, setDriverChargedAmount] = useState("");

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
    <div className="pb-24 max-w-md mx-auto space-y-4">
      {/* Mobile Top Emergency Speed-Dial Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse"></span>
          <span className="text-[11px] font-extrabold text-[#234b4c]">SRO-97 Active</span>
          <span className="text-[10px] text-[#78908a]">• 2026 Gazette</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <a
            href="tel:112"
            className="px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5] flex items-center gap-1"
          >
            🚨 112
          </a>
          <a
            href="tel:1033"
            className="px-2 py-0.5 rounded-full bg-[#edf5ee] text-[#234b4c] border border-[#c3d8c6] flex items-center gap-1"
          >
            🛣️ 1033
          </a>
        </div>
      </div>

      {/* Mobile Tab 1: Fares Flow */}
      {mobileActiveTab === "fares" && (
        <div className="space-y-4">
          {/* Mobile Route Card */}
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5ece3]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-[#234b4c] text-[#f2bd70] flex items-center justify-center font-black text-[10px]">
                  1
                </span>
                <span className="text-xs font-bold text-[#234b4c]">Route &amp; Terrain</span>
              </div>
              <button
                onClick={() => {
                  handleFromChange("");
                  handleToChange("");
                  setDistance("");
                  showToast("Route cleared.");
                }}
                className="text-[10.5px] font-semibold text-[#78908a] hover:text-[#d36b3d] flex items-center gap-1"
              >
                <RefreshCw size={11} /> Clear
              </button>
            </div>

            {/* Boarding Input */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase text-[#78908a] mb-1 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d36b3d]"></span> Boarding Point
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-2.5 text-[#d36b3d]" />
                <input
                  type="text"
                  value={from}
                  onFocus={() => setSearchFromFocus(true)}
                  onChange={(e) => handleFromChange(e.target.value)}
                  placeholder="e.g. Lal Chowk, Jammu Tawi"
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-xs font-bold text-[#234b4c] focus:outline-none focus:ring-1 focus:ring-[#74a181]"
                />
              </div>

              {searchFromFocus && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#fbfcf8] border border-[#dce5dc] rounded-xl shadow-xl p-2 z-30 max-h-48 overflow-y-auto">
                  <div className="flex justify-between items-center pb-1 mb-1 border-b border-[#e5ece3] text-[9.5px] font-bold text-[#78908a] uppercase">
                    <span>Popular Hubs</span>
                    <span>20 Districts</span>
                  </div>
                  {popularLocations
                    .filter((loc) => loc.toLowerCase().includes(from.toLowerCase()))
                    .slice(0, 15)
                    .map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocationPick("from", loc)}
                        className="w-full text-left px-2 py-1.5 rounded text-xs font-semibold text-[#345657] hover:bg-[#edf5ee] flex justify-between items-center"
                      >
                        <span>{loc}</span>
                        <ChevronRight size={11} className="text-[#78908a]" />
                      </button>
                    ))}
                  <button
                    onClick={() => setSearchFromFocus(false)}
                    className="w-full mt-1 text-center text-[10px] font-bold text-[#78908a] py-0.5"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1">
              <button
                onClick={handleSwap}
                className="w-7 h-7 rounded-lg bg-[#edf3eb] border border-[#dce5dc] text-[#345657] flex items-center justify-center shadow-xs"
                title="Swap"
              >
                <ArrowDownUp size={12} />
              </button>
            </div>

            {/* Drop-off Input */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase text-[#78908a] mb-1 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#557b72]"></span> Drop-off Point
              </label>
              <div className="relative">
                <MapPinned size={15} className="absolute left-3 top-2.5 text-[#557b72]" />
                <input
                  type="text"
                  value={to}
                  onFocus={() => setSearchToFocus(true)}
                  onChange={(e) => handleToChange(e.target.value)}
                  placeholder="e.g. Gulmarg, Pahalgam, Katra"
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-xs font-bold text-[#234b4c] focus:outline-none focus:ring-1 focus:ring-[#74a181]"
                />
              </div>

              {searchToFocus && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#fbfcf8] border border-[#dce5dc] rounded-xl shadow-xl p-2 z-30 max-h-48 overflow-y-auto">
                  <div className="flex justify-between items-center pb-1 mb-1 border-b border-[#e5ece3] text-[9.5px] font-bold text-[#78908a] uppercase">
                    <span>Destinations</span>
                    <span>20 Districts</span>
                  </div>
                  {popularLocations
                    .filter((loc) => loc.toLowerCase().includes(to.toLowerCase()))
                    .slice(0, 15)
                    .map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocationPick("to", loc)}
                        className="w-full text-left px-2 py-1.5 rounded text-xs font-semibold text-[#345657] hover:bg-[#edf5ee] flex justify-between items-center"
                      >
                        <span>{loc}</span>
                        <ChevronRight size={11} className="text-[#78908a]" />
                      </button>
                    ))}
                  <button
                    onClick={() => setSearchToFocus(false)}
                    className="w-full mt-1 text-center text-[10px] font-bold text-[#78908a] py-0.5"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Micro Route Summary Strip */}
            {hasRoute && (
              <div className="pt-2 border-t border-[#edf3eb] flex items-center justify-between text-[11px] text-[#234b4c]">
                <span className="font-extrabold bg-[#edf5ee] px-2 py-0.5 rounded-md">
                  📏 {distance || 0} KM
                </span>
                <span className="font-semibold text-[#557b72]">⏱️ {currentRouteMeta.duration}</span>
                <span className="font-semibold text-[#3f6e5b] truncate max-w-[130px]" title={currentRouteMeta.terrain}>
                  🏔️ {currentRouteMeta.terrain.split(" ")[0]}
                </span>
              </div>
            )}
          </div>

          {/* Quick Corridor Horizontal Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {activePresets.slice(0, 6).map((preset) => (
              <button
                key={`${preset.from}-${preset.to}`}
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold shrink-0 border transition ${
                  from === preset.from && to === preset.to
                    ? "bg-[#234b4c] text-[#f4f6ed] border-[#234b4c]"
                    : "bg-[#fbfcf8] text-[#345657] border-[#dce5dc]"
                }`}
              >
                {preset.from} ➔ {preset.to}
              </button>
            ))}
          </div>

          {/* Mobile Vehicle Selection Header & Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-[#234b4c] text-[#f2bd70] flex items-center justify-center font-black text-[10px]">
                  2
                </span>
                <span className="text-xs font-bold text-[#234b4c]">Select Vehicle ({visibleVehicles.length})</span>
              </div>
              <button
                onClick={() => {
                  setInspectedVehicleKey(vehicle);
                  setShowFleetGuide(true);
                }}
                className="text-[10.5px] font-bold text-[#3f6e5b] flex items-center gap-1"
              >
                <Eye size={12} /> Specs
              </button>
            </div>

            {/* Mobile Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {vehicleCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setVehicleCategoryFilter(cat.key)}
                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold shrink-0 transition ${
                    vehicleCategoryFilter === cat.key
                      ? "bg-[#234b4c] text-[#f4f6ed]"
                      : "bg-[#edf3eb] text-[#557b72]"
                  }`}
                >
                  {cat.label.replace(/\(\d+\)/, "")}
                </button>
              ))}
            </div>

            {/* Mobile Touch Vehicle Cards Grid (2-Columns) */}
            <div className="grid grid-cols-2 gap-2.5">
              {visibleVehicles.map((v) => {
                const isSelected = vehicle === v.key || vehicle === v.id;
                const km = Number(distance) || 0;
                const viability = getVehicleRouteViability(v.key, km, from, to);
                const cardFare = getCardFare(v);

                return (
                  <button
                    key={v.key}
                    onClick={() => {
                      setVehicle(v.key);
                      showToast(`Selected ${v.label}`);
                    }}
                    className={`p-2.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#f4f7f2] border-[#234b4c] shadow-xs"
                        : !viability.isViable && hasRoute
                        ? "bg-[#fdfaf8] border-[#ebdcd5] opacity-75"
                        : "bg-[#ffffff] border-[#e2eae0]"
                    }`}
                  >
                    <div className="w-full h-16 rounded-xl bg-gradient-to-b from-[#f3f7f1] to-[#e4ece2] flex items-center justify-center p-1 relative mb-1.5 overflow-hidden">
                      <VehicleIllustration vehicleKey={v.key} className="w-full h-full object-contain" />
                      <div className="absolute top-1 right-1">
                        {hasRoute && !viability.isViable ? (
                          <span className="text-[8px] font-bold text-[#b91c1c] bg-[#fee2e2] px-1 py-0.2 rounded">
                            Limit
                          </span>
                        ) : hasRoute && cardFare > 0 ? (
                          <span className="text-[9.5px] font-black text-[#234b4c] bg-white px-1.5 py-0.5 rounded shadow-xs">
                            ₹{cardFare}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[11px] text-[#234b4c] truncate">{v.label}</h4>
                        {isSelected && <CheckCircle2 size={11} className="text-[#234b4c]" />}
                      </div>
                      <p className="text-[9px] text-[#78908a] truncate mt-0.5">👥 {v.capacity}</p>
                    </div>

                    <div className="mt-1.5 pt-1 border-t border-[#edf3eb] flex items-center justify-between text-[9px]">
                      <span className="text-[#78908a]">{v.isPerSeat ? "Per Seat" : "Full Cab"}</span>
                      <span className="font-extrabold text-[#234b4c]">
                        {v.calcType === "urban-stage" ? "₹8-18" : v.calcType === "stage-slab" ? "₹9-26" : `₹${v.perKm}/km`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sticky Mobile Floating Fare Bar */}
          <div className="sticky bottom-20 z-20 bg-gradient-to-r from-[#234b4c] to-[#1c3d3e] text-white p-3.5 rounded-2xl shadow-2xl border border-[#3c6b69] flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2">
            <div>
              <div className="flex items-center gap-1 text-[10px] text-[#c4d6cb]">
                <span>{chosenVehicle.label}</span>
                <span>•</span>
                <span>{chosenVehicle.isPerSeat ? "Per Seat" : "Full Cab"}</span>
              </div>
              <div className="text-xl font-black text-white">
                {hasRoute && fareParts.isViable && displayFare > 0
                  ? `₹${displayFare.toLocaleString("en-IN")}`
                  : hasRoute && !fareParts.isViable
                  ? "Not Serviced"
                  : "₹ —"}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-[#142e2f] text-white border border-[#386260]"
                title="Share"
              >
                <Share2 size={14} />
              </button>
              {hasRoute && fareParts.isViable && displayFare > 0 && (
                <button
                  onClick={() => setShowConductorSlip(true)}
                  className="px-3 py-2 rounded-xl bg-[#d36b3d] text-white font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition"
                >
                  <QrCode size={13} />
                  <span>Get Pass</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab 2: Compare All Fleets */}
      {mobileActiveTab === "compare" && (
        <div className="space-y-3">
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl p-4 shadow-sm">
            <h3 className="font-extrabold text-sm text-[#234b4c]">Compare All Vehicles for this Route</h3>
            <p className="text-[11px] text-[#78908a] mt-0.5">
              {from || "Origin"} ➔ {to || "Destination"} ({distance || 0} KM)
            </p>
          </div>

          <div className="space-y-2">
            {eligibleVehicles.map((v) => {
              const isSelected = vehicle === v.key || vehicle === v.id;
              const cardFare = getCardFare(v);
              const km = Number(distance) || 0;
              const viability = getVehicleRouteViability(v.key, km, from, to);

              return (
                <div
                  key={v.key}
                  onClick={() => {
                    setVehicle(v.key);
                    showToast(`Selected ${v.label}`);
                  }}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 bg-white ${
                    isSelected ? "border-[#234b4c] bg-[#f4f7f2] shadow-xs" : "border-[#e2eae0]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-10 rounded-xl bg-[#edf3eb] p-1 flex items-center justify-center border border-[#dce5dc] shrink-0">
                      <VehicleIllustration vehicleKey={v.key} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#234b4c]">{v.label}</h4>
                      <p className="text-[10px] text-[#78908a]">👥 {v.capacity} • {v.badge}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {!viability.isViable && hasRoute ? (
                      <span className="text-[9.5px] font-bold text-[#b91c1c] bg-[#fee2e2] px-1.5 py-0.5 rounded">
                        Not Viable
                      </span>
                    ) : cardFare > 0 ? (
                      <span className="text-base font-black text-[#234b4c]">₹{cardFare}</span>
                    ) : (
                      <span className="text-xs text-[#78908a]">₹{v.perKm}/km</span>
                    )}
                    <span className="text-[9.5px] text-[#78908a] block">
                      {v.isPerSeat ? "per seat" : "entire cab"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Tab 3: Dispute & Defense Auditor */}
      {mobileActiveTab === "dispute" && (
        <div className="space-y-4">
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e5ece3]">
              <ShieldAlert size={18} className="text-[#d36b3d]" />
              <div>
                <h3 className="font-bold text-xs text-[#234b4c]">Mobile Fare Dispute Auditor</h3>
                <p className="text-[10px] text-[#78908a]">Check driver extortion under SRO-97</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#edf5ee] border border-[#d2e4d4] text-xs">
              <div className="flex justify-between">
                <span className="text-[#78908a]">Active Route:</span>
                <span className="font-bold text-[#234b4c]">{from || "Lal Chowk"} ➔ {to || "Destination"}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#78908a]">Official Legal Ceiling:</span>
                <span className="font-black text-[#16a34a] text-sm">₹{displayFare || 20}</span>
              </div>
            </div>

            <div>
              <label className="text-[10.5px] font-bold text-[#78908a] mb-1 block">
                How much did driver or conductor demand? (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 60"
                value={driverChargedAmount}
                onChange={(e) => setDriverChargedAmount(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#f6f8f3] border border-[#dce5dc] text-sm font-bold text-[#234b4c]"
              />
            </div>

            {chargedNum > 0 && officialNum > 0 && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  overchargeDiff > 0
                    ? "bg-[#fff2f2] border border-[#fca5a5] text-[#991b1b]"
                    : "bg-[#edf5ee] border border-[#d2e4d4] text-[#234b4c]"
                }`}
              >
                {overchargeDiff > 0 ? (
                  <div className="space-y-1">
                    <p className="font-black text-sm">⚠️ Extortion Alert: +₹{overchargeDiff} Overcharge!</p>
                    <p className="text-[11px] leading-snug">
                      This demands exceeds the notified tariff under <strong>Section 192A MVA</strong>.
                    </p>
                    <a
                      href="transit-defense.html"
                      className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-[#dc2626] text-white font-bold text-[10.5px]"
                    >
                      File RTO Grievance ➔
                    </a>
                  </div>
                ) : (
                  <p className="font-bold text-[#16a34a] flex items-center gap-1.5">
                    <Check size={16} /> Driver charged within legal tariff!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Tab 4: Rights & Directory */}
      {mobileActiveTab === "rights" && (
        <div className="space-y-3">
          <div className="bg-[#fbfcf8] border border-[#dce5dc] rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-[#234b4c] uppercase tracking-wider pb-2 border-b border-[#e5ece3] flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#16a34a]" /> Statutory Commuter Rights
            </h3>

            <div className="space-y-2 text-xs text-[#345657]">
              <div className="p-2.5 rounded-xl bg-[#f8faf6] border border-[#e2eae0]">
                <p className="font-bold text-[#234b4c]">1. Maximum Fare Ceiling (Sec 192A MVA)</p>
                <p className="text-[11px] text-[#78908a] mt-0.5">
                  No commercial vehicle operator can charge more than the gazetted SRO-97 schedule.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f8faf6] border border-[#e2eae0]">
                <p className="font-bold text-[#234b4c]">2. Stage Carriage Destination Liability</p>
                <p className="text-[11px] text-[#78908a] mt-0.5">
                  Passengers on Matadors &amp; Tata Magics are only liable for fares up to their destination stop.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f8faf6] border border-[#e2eae0]">
                <p className="font-bold text-[#234b4c]">3. Offline Passenger Fare Slip</p>
                <p className="text-[11px] text-[#78908a] mt-0.5">
                  Commuters can flash their SAFAR digital QR slip as legal proof of correct tender.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#e5ece3]">
              <p className="text-[10.5px] font-bold text-[#78908a] uppercase mb-1.5">Emergency Helplines</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <a href="tel:112" className="p-2 rounded-xl bg-[#edf5ee] text-[#234b4c] text-center border border-[#d2e4d4]">
                  🚨 Police: 112
                </a>
                <a href="tel:1033" className="p-2 rounded-xl bg-[#edf5ee] text-[#234b4c] text-center border border-[#d2e4d4]">
                  🛣️ NH-44: 1033
                </a>
                <a href="tel:108" className="p-2 rounded-xl bg-[#edf5ee] text-[#234b4c] text-center border border-[#d2e4d4]">
                  🚑 Medical: 108
                </a>
                <a href="tel:181" className="p-2 rounded-xl bg-[#edf5ee] text-[#234b4c] text-center border border-[#d2e4d4]">
                  🚺 Women: 181
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Native Bottom Navigation Dock */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#fbfcf8]/95 backdrop-blur-md border-t border-[#dce5dc] px-3 py-2 flex items-center justify-around shadow-lg max-w-md mx-auto">
        {[
          { key: "fares", label: "Fares", icon: Calculator },
          { key: "compare", label: "Compare", icon: SlidersHorizontal },
          { key: "dispute", label: "Dispute", icon: ShieldAlert },
          { key: "rights", label: "Rights", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = mobileActiveTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setMobileActiveTab(tab.key);
                showToast(`Switched to ${tab.label}`);
              }}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? "text-[#234b4c] font-extrabold" : "text-[#78908a] font-medium"
              }`}
            >
              <Icon size={18} className={isActive ? "text-[#234b4c]" : "text-[#78908a]"} />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
