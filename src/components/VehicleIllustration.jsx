import React from "react";

/**
 * High-fidelity, responsive vector illustrations and recognition metadata
 * for all 11 statutory transit vehicle types across Jammu & Kashmir.
 */

export const VEHICLE_VISUAL_META = {
  "shared-cab": {
    name: "Tata Sumo / Bolero",
    categoryLabel: "Shared Maxi-Cab",
    hallmark: "Boxy White 4x4 with Heavy-Duty Roof Luggage Carrier & Tarpaulin",
    howToSpot: "Found at dedicated Sumo Stands (TRC, Batamaloo, Pantha Chowk in Srinagar; Jewel Chowk in Jammu). Drivers call out destinations.",
    luggage: "Heavy Rooftop Luggage (2-3 large bags/suitcases strapped on carrier)",
    idealFor: "Mountain Passes, Alpine Corridors & Inter-District Routes (All 20 Districts)",
    tagline: "The lifeline of J&K mountain highways",
    accentColor: "#d36b3d",
    bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent",
  },
  "mini-bus": {
    name: "Matador (Tata 407 / Swaraj Mazda)",
    categoryLabel: "Stage Carriage Mini-Bus",
    hallmark: "Iconic Blue & Cream or Green/White Tata 407 with curved front nose",
    howToSpot: "Stationed at General Bus Stands, Lal Chowk, Batamaloo & all arterial district stops. Frequent boarding every 5-10 minutes.",
    luggage: "Medium (Under-seat & rear aisle space for shopping bags & duffels)",
    idealFor: "Intra-District Arterials & Suburban Stages (5–45 km)",
    tagline: "Universal high-frequency transit across Kashmir & Jammu plains",
    accentColor: "#557b72",
    bgGradient: "from-emerald-600/10 via-teal-600/5 to-transparent",
  },
  "vikram-tempo": {
    name: "Vikram 3-Wheeler Tempo",
    categoryLabel: "Jammu Urban Stage Shuttle",
    hallmark: "Front-snout 3-wheeler diesel tempo with canvas roof and longitudinal rear benches",
    howToSpot: "Found exclusively across Jammu Urban areas (Satwari, Gandhi Nagar, Canal Road, Jewel, Janipur). Fixed route slabs ₹8-₹18.",
    luggage: "Light Hand Baggage only",
    idealFor: "Jammu City Intra-Urban Hubs (0–15 km)",
    tagline: "Jammu's iconic multi-passenger shared 3-wheeler",
    accentColor: "#a65c2a",
    bgGradient: "from-orange-600/10 via-amber-600/5 to-transparent",
  },
  "e-rickshaw": {
    name: "E-Rickshaw (Battery Toto)",
    categoryLabel: "Zero-Emission Local Feeder",
    hallmark: "Bright Green lightweight open-frame electric toto with weather canopy",
    howToSpot: "Active in Srinagar SMC, Jammu JMC, Katra town, and Baramulla markets. Wave down anywhere for short 1-4 km hops.",
    luggage: "Handbags & Grocery Bags only",
    idealFor: "Short Market Hops, Hospital Feeder & Inner City Streets (1–6 km)",
    tagline: "Quiet, non-polluting local point-to-point hop",
    accentColor: "#2f855a",
    bgGradient: "from-emerald-500/10 via-green-500/5 to-transparent",
  },
  "e-auto": {
    name: "E-Auto (Mahindra Treo / Piaggio)",
    categoryLabel: "Metered Electric Auto",
    hallmark: "Aerodynamic dual-tone emerald & white closed cabin with 'EV' emblem",
    howToSpot: "Available at Srinagar & Jammu auto stands and key intersections. Official statutory rate: ₹25 for first km, then ₹20/km.",
    luggage: "1-2 Small Suitcases or Duffel Bags behind rear seat",
    idealFor: "Intra-City Trips up to 12 km within municipal corporation bounds",
    tagline: "Modern statutory metered clean electric mobility",
    accentColor: "#237249",
    bgGradient: "from-teal-600/10 via-emerald-600/5 to-transparent",
  },
  "auto": {
    name: "Auto Rickshaw (Bajaj RE)",
    categoryLabel: "Standard 3-Wheeler Auto",
    hallmark: "Classic Yellow canopy with Black metal chassis and front circular headlight",
    howToSpot: "Stationed at designated Municipal Auto Stands near railway stations, hospitals, and commercial markets.",
    luggage: "Up to 2 Medium Duffel Bags",
    idealFor: "City-Wide Point-to-Point Transit (1–15 km)",
    tagline: "Reliable statutory metered transport across J&K towns",
    accentColor: "#bc8a20",
    bgGradient: "from-amber-600/10 via-yellow-600/5 to-transparent",
  },
  "tata-magic": {
    name: "Tata Magic / Maruti Eeco",
    categoryLabel: "Suburban Feeder Van",
    hallmark: "White compact passenger minivan with sliding side passenger door",
    howToSpot: "Frequent feeder routes in Baramulla, Sopore, Kupwara, Outer Jammu & rural ring roads. Fixed stage slabs ₹9 to ₹26.",
    luggage: "Medium (Under seat & small boot storage)",
    idealFor: "Semi-Urban & Rural Connector Routes (3–20 km)",
    tagline: "Comfortable high-frequency suburban shared shuttle",
    accentColor: "#c27438",
    bgGradient: "from-amber-600/10 via-stone-500/5 to-transparent",
  },
  "private-bus": {
    name: "Private Stage Bus (32+ Seater)",
    categoryLabel: "Trunk Highway Stage Carriage",
    hallmark: "Large 32+ passenger coach in multi-color livery with front destination placard",
    howToSpot: "Departs from District General Bus Stands (Pantha Chowk, Batamaloo, Jammu General Stand) connecting major towns via national highways.",
    luggage: "Full Luggage Hold (Underbelly cargo bays & interior overhead racks)",
    idealFor: "Inter-District Trunk Highways (Srinagar-Jammu-Katra-Poonch)",
    tagline: "Economical high-capacity corridor transportation",
    accentColor: "#3f6e5b",
    bgGradient: "from-emerald-700/10 via-cyan-700/5 to-transparent",
  },
  "force-traveler": {
    name: "Force Traveller (14-Seater)",
    categoryLabel: "Tourist & Group Maxi-Cab",
    hallmark: "High-roof white van with large panoramic dark tinted windows & roof AC unit",
    howToSpot: "TRC Srinagar, Srinagar Airport, Katra SMVD Shrine Board stands & Gulmarg/Pahalgam tourist stands. Shared or Full Charter.",
    luggage: "Large Rear Cargo Compartment (10+ full suitcases)",
    idealFor: "Tourist Circuits, Family Charters & Scenic Highland Highway Hops",
    tagline: "Premium group travel for J&K alpine destinations",
    accentColor: "#2c5282",
    bgGradient: "from-blue-600/10 via-indigo-600/5 to-transparent",
  },
  "taxi": {
    name: "Sedan Taxi (Dzire / Etios)",
    categoryLabel: "Private Contract Tourist Cab",
    hallmark: "White/Silver modern compact sedan with yellow commercial plate / taxi badge",
    howToSpot: "Available at Airport Taxi stands, tourist taxi unions, hotels, and pre-paid counters across Srinagar, Jammu & Katra.",
    luggage: "Full Sedan Boot (3-4 suitcases comfortably)",
    idealFor: "Airport Transfers, Point-to-Point City Rides & Family Tours",
    tagline: "Private point-to-point comfort with official government tariff",
    accentColor: "#3e6b8a",
    bgGradient: "from-sky-600/10 via-slate-600/5 to-transparent",
  },
  "suv-taxi": {
    name: "SUV Taxi (Innova / Scorpio)",
    categoryLabel: "Alpine Tourist SUV",
    hallmark: "Silver/Graphite Toyota Innova Crysta or Scorpio with sleek roof luggage rack",
    howToSpot: "Stationed at Premium Tourist Taxi Stands (TRC Srinagar, Jammu Airport, Katra). Required for high-altitude passes during winter/monsoon.",
    luggage: "Heavy Baggage (Spacious boot + rooftop carrier)",
    idealFor: "All-Weather Alpine Passes, Gulmarg, Sonmarg, Sinthan Top, Leh Road",
    tagline: "Robust all-terrain alpine comfort for mountain highways",
    accentColor: "#28536b",
    bgGradient: "from-cyan-700/10 via-blue-700/5 to-transparent",
  },
};

/**
 * Tata Sumo / Bolero SVG (Shared Cab)
 * Features: Classic boxy frame, front bumper guards, heavy-duty roof rack with strapped luggage, rear spare wheel
 */
export function TataSumoIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="sumoBodyGrad" x1="0" y1="30" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#edf1f3" />
          <stop offset="100%" stopColor="#d5dde0" />
        </linearGradient>
        <linearGradient id="sumoGlassGrad" x1="0" y1="40" x2="0" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4a6b82" />
          <stop offset="100%" stopColor="#253a47" />
        </linearGradient>
        <linearGradient id="sumoTarpGrad" x1="0" y1="12" x2="0" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e28743" />
          <stop offset="100%" stopColor="#b25d1e" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="126" rx="115" ry="7" fill="#1b2a2a" fillOpacity="0.18" />

      {/* Roof Luggage Rack with Packed Baggage / Tarpaulin */}
      <rect x="75" y="16" width="105" height="20" rx="5" fill="url(#sumoTarpGrad)" />
      <line x1="95" y1="16" x2="95" y2="36" stroke="#f6c28b" strokeWidth="1.8" />
      <line x1="120" y1="16" x2="120" y2="36" stroke="#f6c28b" strokeWidth="1.8" />
      <line x1="145" y1="16" x2="145" y2="36" stroke="#f6c28b" strokeWidth="1.8" />
      <line x1="165" y1="16" x2="165" y2="36" stroke="#f6c28b" strokeWidth="1.8" />
      <rect x="100" y="8" width="45" height="10" rx="3" fill="#2b5b84" />
      <rect x="68" y="32" width="125" height="6" rx="1.5" fill="#2c3e50" />
      <line x1="75" y1="38" x2="75" y2="44" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="110" y1="38" x2="110" y2="44" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="150" y1="38" x2="150" y2="44" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="185" y1="38" x2="185" y2="44" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round" />

      {/* Rear Mounted Spare Tyre */}
      <rect x="23" y="60" width="14" height="42" rx="4" fill="#202224" />
      <rect x="27" y="68" width="6" height="26" rx="2" fill="#555a60" />

      {/* Main Car Body - Boxy Tata Sumo Silhouette */}
      <path
        d="M 32 62 L 32 100 L 225 100 L 236 94 L 236 82 L 202 78 L 178 44 L 52 44 L 38 52 Z"
        fill="url(#sumoBodyGrad)"
        stroke="#8b9ea6"
        strokeWidth="1.2"
      />

      {/* Black Lower Protective Cladding / Bumper */}
      <path
        d="M 30 96 L 30 106 L 68 106 A 18 18 0 0 1 104 106 L 172 106 A 18 18 0 0 1 208 106 L 244 106 L 244 94 L 225 100 Z"
        fill="#262c30"
      />

      {/* Windows Frame & Tinted Glass */}
      <polygon points="175,48 198,76 168,76 150,48" fill="url(#sumoGlassGrad)" />
      <rect x="100" y="48" width="46" height="28" rx="2" fill="url(#sumoGlassGrad)" />
      <polygon points="56,48 96,48 96,76 46,76 46,60" fill="url(#sumoGlassGrad)" />
      <line x1="98" y1="48" x2="98" y2="76" stroke="#2c3e50" strokeWidth="3" />
      <line x1="148" y1="48" x2="148" y2="76" stroke="#2c3e50" strokeWidth="3" />

      {/* Side Details: Door Lines, Handle, Side Indicator */}
      <line x1="150" y1="76" x2="150" y2="98" stroke="#a0b2ba" strokeWidth="1.5" />
      <line x1="98" y1="76" x2="98" y2="98" stroke="#a0b2ba" strokeWidth="1.5" />
      <rect x="154" y="80" width="10" height="3" rx="1" fill="#3c4c54" />
      <rect x="104" y="80" width="10" height="3" rx="1" fill="#3c4c54" />
      <rect x="212" y="81" width="5" height="3" rx="1" fill="#f59e0b" />

      {/* Front Grille & Headlight */}
      <rect x="234" y="80" width="5" height="12" rx="1.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.8" />
      <rect x="238" y="94" width="7" height="11" rx="2" fill="#1e2327" />

      {/* J&K Taxi Permit Stripe / Sumo Decal */}
      <rect x="40" y="88" width="155" height="3.5" fill="#d36b3d" opacity="0.85" />
      <text x="50" y="87" fill="#234b4c" fontSize="7" fontWeight="bold" fontFamily="sans-serif">SUMO MAXI CAB</text>

      {/* Front Wheel */}
      <g>
        <circle cx="190" cy="110" r="19" fill="#1c2024" />
        <circle cx="190" cy="110" r="12" fill="#50565e" />
        <circle cx="190" cy="110" r="6" fill="#88929e" />
        <circle cx="190" cy="110" r="2.5" fill="#1c2024" />
      </g>

      {/* Rear Wheel */}
      <g>
        <circle cx="86" cy="110" r="19" fill="#1c2024" />
        <circle cx="86" cy="110" r="12" fill="#50565e" />
        <circle cx="86" cy="110" r="6" fill="#88929e" />
        <circle cx="86" cy="110" r="2.5" fill="#1c2024" />
      </g>
    </svg>
  );
}

/**
 * Matador (Mini Bus / Tata 407) SVG
 * Features: Iconic Tata 407 curved nose, blue & cream livery, large passenger windows, dual rear wheels
 */
export function MatadorIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="matadorBlue" x1="0" y1="35" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#437793" />
          <stop offset="100%" stopColor="#244d64" />
        </linearGradient>
        <linearGradient id="matadorCream" x1="0" y1="30" x2="0" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbf9f0" />
          <stop offset="100%" stopColor="#e8e2cd" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="127" rx="120" ry="7" fill="#1b2a2a" fillOpacity="0.18" />

      {/* Bus Body - Upper Cream Section */}
      <path
        d="M 28 42 C 28 36, 34 32, 42 32 L 210 32 C 224 32, 236 40, 240 54 L 246 80 L 28 80 Z"
        fill="url(#matadorCream)"
      />

      {/* Bus Body - Lower Blue Section with 407 Nose */}
      <path
        d="M 26 80 L 246 80 L 252 86 C 254 94, 250 104, 244 106 L 218 106 A 18 18 0 0 1 182 106 L 108 106 A 18 18 0 0 1 72 106 L 26 106 Z"
        fill="url(#matadorBlue)"
      />

      {/* Decorative Red/Orange Accent Stripe */}
      <rect x="26" y="78" width="224" height="4" fill="#e0633b" />

      {/* Split Front Windshield (Tata 407 Characteristic) */}
      <path d="M 214 36 L 234 52 L 238 74 L 206 74 L 206 36 Z" fill="#2d4454" />
      <line x1="222" y1="36" x2="222" y2="74" stroke="#e8e2cd" strokeWidth="2.5" />

      {/* Side Passenger Windows Row */}
      <g fill="#2d4454" rx="2">
        <rect x="168" y="38" width="32" height="34" rx="2" />
        <rect x="130" y="38" width="34" height="34" rx="2" />
        <rect x="92" y="38" width="34" height="34" rx="2" />
        <rect x="54" y="38" width="34" height="34" rx="2" />
        <rect x="32" y="38" width="18" height="34" rx="2" />
      </g>
      <line x1="184" y1="38" x2="184" y2="72" stroke="#b0c0cb" strokeWidth="1" />
      <line x1="147" y1="38" x2="147" y2="72" stroke="#b0c0cb" strokeWidth="1" />
      <line x1="109" y1="38" x2="109" y2="72" stroke="#b0c0cb" strokeWidth="1" />
      <line x1="71" y1="38" x2="71" y2="72" stroke="#b0c0cb" strokeWidth="1" />

      {/* Front Nose, Grille & Headlights */}
      <rect x="246" y="86" width="6" height="10" rx="2" fill="#fef08a" stroke="#d97706" strokeWidth="0.8" />
      <line x1="244" y1="96" x2="252" y2="96" stroke="#c0d0d8" strokeWidth="2" />
      <line x1="243" y1="100" x2="250" y2="100" stroke="#c0d0d8" strokeWidth="2" />

      {/* Stage Carriage Route Board on Roof */}
      <rect x="100" y="24" width="75" height="10" rx="2" fill="#244d64" stroke="#e8e2cd" strokeWidth="1" />
      <text x="107" y="32" fill="#fef08a" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">TATA 407 MATADOR</text>

      {/* Front Wheel */}
      <g>
        <circle cx="200" cy="110" r="19" fill="#1c2024" />
        <circle cx="200" cy="110" r="12" fill="#50565e" />
        <circle cx="200" cy="110" r="6" fill="#88929e" />
        <circle cx="200" cy="110" r="2.5" fill="#1c2024" />
      </g>

      {/* Heavy Duty Double Rear Wheels */}
      <g>
        <circle cx="86" cy="110" r="19" fill="#1c2024" />
        <circle cx="92" cy="110" r="19" fill="#1c2024" />
        <circle cx="90" cy="110" r="12" fill="#50565e" />
        <circle cx="90" cy="110" r="6" fill="#88929e" />
        <circle cx="90" cy="110" r="2.5" fill="#1c2024" />
      </g>
    </svg>
  );
}

/**
 * Vikram Tempo SVG (Jammu Urban 3-Wheeler)
 * Features: Authentic elongated front bonnet with circular lamp, open passenger cabin with tubular frame and canvas canopy
 */
export function VikramTempoIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="vikramMetal" x1="0" y1="50" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#bf6530" />
          <stop offset="100%" stopColor="#873f15" />
        </linearGradient>
        <linearGradient id="vikramCanopy" x1="0" y1="30" x2="0" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e4d9b8" />
          <stop offset="100%" stopColor="#c5b68d" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="126" rx="110" ry="6.5" fill="#1b2a2a" fillOpacity="0.18" />

      {/* Canvas Canopy Roof */}
      <path d="M 45 34 C 45 30, 55 28, 70 28 L 195 28 C 205 28, 212 32, 212 38 L 210 52 L 45 52 Z" fill="url(#vikramCanopy)" />
      <line x1="75" y1="28" x2="75" y2="52" stroke="#873f15" strokeWidth="1.5" />
      <line x1="120" y1="28" x2="120" y2="52" stroke="#873f15" strokeWidth="1.5" />
      <line x1="165" y1="28" x2="165" y2="52" stroke="#873f15" strokeWidth="1.5" />

      {/* Tubular Steel Safety Framework */}
      <line x1="48" y1="52" x2="48" y2="92" stroke="#2b3137" strokeWidth="3" />
      <line x1="110" y1="52" x2="110" y2="92" stroke="#2b3137" strokeWidth="3" />
      <line x1="170" y1="52" x2="170" y2="92" stroke="#2b3137" strokeWidth="3" />
      <line x1="210" y1="52" x2="210" y2="78" stroke="#2b3137" strokeWidth="3" />
      <line x1="48" y1="74" x2="170" y2="74" stroke="#e4d9b8" strokeWidth="2.5" />

      {/* Front Snout / Engine Bonnet (Famous Vikram Nose) */}
      <path
        d="M 210 74 L 244 86 C 250 88, 252 94, 250 102 L 244 106 L 222 106 A 18 18 0 0 1 186 106 L 46 106 L 42 90 L 170 90 L 208 74 Z"
        fill="url(#vikramMetal)"
      />

      {/* Front Windshield on Driver Section */}
      <polygon points="174,52 208,52 206,74 174,74" fill="#385263" />

      {/* Front Circular Chrome Headlight */}
      <circle cx="248" cy="94" r="6" fill="#fef08a" stroke="#ffffff" strokeWidth="1.2" />
      <circle cx="248" cy="94" r="2" fill="#ffffff" />

      {/* Passenger Benches Silhouette */}
      <rect x="58" y="78" width="105" height="10" rx="2" fill="#522a13" opacity="0.8" />
      <text x="65" y="100" fill="#fef08a" fontSize="8" fontWeight="bold" fontFamily="sans-serif">VIKRAM JAMMU</text>

      {/* Front 3-Wheeler Single Wheel */}
      <g>
        <circle cx="230" cy="112" r="16" fill="#1c2024" />
        <circle cx="230" cy="112" r="9" fill="#50565e" />
        <circle cx="230" cy="112" r="4" fill="#88929e" />
      </g>

      {/* Rear Main Wheel */}
      <g>
        <circle cx="82" cy="110" r="19" fill="#1c2024" />
        <circle cx="82" cy="110" r="12" fill="#50565e" />
        <circle cx="82" cy="110" r="6" fill="#88929e" />
        <circle cx="82" cy="110" r="2.5" fill="#1c2024" />
      </g>
    </svg>
  );
}

/**
 * E-Rickshaw SVG (Battery Toto)
 * Features: Lightweight open green frame, curved yellow canopy, passenger seat bench, thin EV wheels
 */
export function ERickshawIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="erickGreen" x1="0" y1="60" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="126" rx="100" ry="6" fill="#1b2a2a" fillOpacity="0.16" />

      {/* Lightweight Yellow Curved Canopy */}
      <path d="M 55 38 C 55 30, 80 26, 140 26 C 200 26, 218 32, 218 40 L 216 46 L 55 46 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />

      {/* Tubular Black Frame Structure */}
      <line x1="60" y1="46" x2="60" y2="92" stroke="#1f2937" strokeWidth="2.5" />
      <line x1="120" y1="46" x2="120" y2="92" stroke="#1f2937" strokeWidth="2.5" />
      <line x1="190" y1="46" x2="190" y2="76" stroke="#1f2937" strokeWidth="2.5" />
      <line x1="85" y1="50" x2="85" y2="58" stroke="#facc15" strokeWidth="2" />
      <line x1="150" y1="50" x2="150" y2="58" stroke="#facc15" strokeWidth="2" />

      {/* Driver Windscreen & Apron */}
      <polygon points="186,46 208,46 204,74 186,74" fill="#3b82f6" fillOpacity="0.3" stroke="#1f2937" strokeWidth="1.5" />

      {/* Green Metal Body Lower Panels */}
      <path
        d="M 56 86 L 165 86 L 180 74 L 212 74 L 222 96 L 222 106 L 202 106 A 16 16 0 0 1 170 106 L 112 106 A 16 16 0 0 1 80 106 L 56 106 Z"
        fill="url(#erickGreen)"
      />

      {/* Passenger Seat Bench & Battery Compartment */}
      <rect x="68" y="74" width="48" height="14" rx="3" fill="#1e293b" />
      <rect x="122" y="78" width="38" height="12" rx="2" fill="#1e293b" />
      <circle cx="95" cy="96" r="6" fill="#fef08a" />
      <path d="M 96 92 L 93 96 L 96 96 L 94 100 L 98 95 L 95 95 Z" fill="#059669" />

      {/* Front Headlamp */}
      <circle cx="222" cy="86" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

      {/* Front Wheel */}
      <g>
        <circle cx="212" cy="112" r="15" fill="#111827" />
        <circle cx="212" cy="112" r="9" fill="#9ca3af" />
        <circle cx="212" cy="112" r="4" fill="#111827" />
        <line x1="212" y1="103" x2="212" y2="121" stroke="#4b5563" strokeWidth="1" />
        <line x1="203" y1="112" x2="221" y2="112" stroke="#4b5563" strokeWidth="1" />
      </g>

      {/* Rear Wheel */}
      <g>
        <circle cx="96" cy="112" r="15" fill="#111827" />
        <circle cx="96" cy="112" r="9" fill="#9ca3af" />
        <circle cx="96" cy="112" r="4" fill="#111827" />
        <line x1="96" y1="103" x2="96" y2="121" stroke="#4b5563" strokeWidth="1" />
        <line x1="87" y1="112" x2="105" y2="112" stroke="#4b5563" strokeWidth="1" />
      </g>
    </svg>
  );
}

/**
 * E-Auto SVG (Modern Electric Auto / Mahindra Treo)
 * Features: Aerodynamic teardrop body, dual-tone emerald & white, single front windscreen wiper, EV emblem
 */
export function EAutoIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="eautoGreen" x1="0" y1="40" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="126" rx="105" ry="6.5" fill="#1b2a2a" fillOpacity="0.16" />

      {/* Aerodynamic Teardrop Monocoque Roof & Body */}
      <path
        d="M 52 82 C 52 50, 72 34, 130 34 L 175 34 C 205 34, 222 48, 228 72 L 232 94 L 222 106 L 198 106 A 16 16 0 0 1 166 106 L 116 106 A 16 16 0 0 1 84 106 L 52 106 Z"
        fill="url(#eautoGreen)"
      />

      {/* White Aerodynamic Lower Door Contrast Accent */}
      <path d="M 95 64 L 165 64 C 172 64, 178 70, 176 78 L 170 102 L 95 102 Z" fill="#f8fafc" />

      {/* Large Panoramic Front Curved Windshield */}
      <path d="M 172 38 L 216 46 C 224 54, 226 68, 224 78 L 182 78 Z" fill="#1e3a4a" />
      <line x1="202" y1="78" x2="212" y2="52" stroke="#94a3b8" strokeWidth="1.5" />

      {/* Passenger Side Open Window */}
      <rect x="98" y="44" width="65" height="28" rx="4" fill="#0f172a" opacity="0.85" />
      <rect x="105" y="66" width="48" height="8" rx="2" fill="#334155" />

      {/* EV Clean Mobility Badge */}
      <circle cx="132" cy="85" r="9" fill="#047857" />
      <text x="127" y="88" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">EV</text>

      {/* Modern Flush LED Headlight */}
      <rect x="228" y="84" width="5" height="12" rx="2" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />

      {/* Front Wheel */}
      <g>
        <circle cx="210" cy="112" r="16" fill="#1e293b" />
        <circle cx="210" cy="112" r="10" fill="#64748b" />
        <circle cx="210" cy="112" r="4" fill="#047857" />
      </g>

      {/* Rear Wheel */}
      <g>
        <circle cx="98" cy="112" r="16" fill="#1e293b" />
        <circle cx="98" cy="112" r="10" fill="#64748b" />
        <circle cx="98" cy="112" r="4" fill="#047857" />
      </g>
    </svg>
  );
}

/**
 * Auto Rickshaw SVG (Classic Bajaj RE 3-Wheeler)
 * Features: Yellow roof canopy, black metal chassis, circular front headlamp, meter on dashboard
 */
export function AutoRickshawIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="autoYellow" x1="0" y1="30" x2="0" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="126" rx="100" ry="6.5" fill="#1b2a2a" fillOpacity="0.16" />

      {/* Classic Yellow Canopy Top */}
      <path
        d="M 56 68 C 56 42, 80 32, 145 32 C 185 32, 204 40, 212 56 L 210 70 L 56 70 Z"
        fill="url(#autoYellow)"
      />

      {/* Classic Black Metal Lower Body */}
      <path
        d="M 56 70 L 210 70 L 218 88 L 222 106 L 198 106 A 16 16 0 0 1 166 106 L 116 106 A 16 16 0 0 1 84 106 L 54 106 Z"
        fill="#1e2429"
      />

      {/* Front Windshield */}
      <polygon points="168,40 206,46 200,68 168,68" fill="#334e68" />
      <rect x="172" y="62" width="10" height="6" rx="1" fill="#dc2626" />
      <circle cx="177" cy="65" r="1" fill="#fef08a" />

      {/* Open Side Entry with Safety Bar */}
      <rect x="95" y="44" width="65" height="32" rx="3" fill="#0f172a" opacity="0.9" />
      <line x1="95" y1="72" x2="160" y2="72" stroke="#f59e0b" strokeWidth="2.5" />

      {/* Circular Chrome Headlamp */}
      <circle cx="218" cy="88" r="6" fill="#fef08a" stroke="#d1d5db" strokeWidth="1.2" />

      {/* Yellow Registration Plate */}
      <rect x="62" y="90" width="18" height="6" rx="1" fill="#facc15" />
      <text x="64" y="95" fill="#000" fontSize="4.5" fontWeight="bold" fontFamily="sans-serif">JK 01</text>

      {/* Front Wheel */}
      <g>
        <circle cx="204" cy="112" r="16" fill="#111827" />
        <circle cx="204" cy="112" r="9" fill="#6b7280" />
        <circle cx="204" cy="112" r="3.5" fill="#111827" />
      </g>

      {/* Rear Wheel */}
      <g>
        <circle cx="98" cy="112" r="16" fill="#111827" />
        <circle cx="98" cy="112" r="9" fill="#6b7280" />
        <circle cx="98" cy="112" r="3.5" fill="#111827" />
      </g>
    </svg>
  );
}

/**
 * Tata Magic / Maruti Eeco SVG (Suburban Feeder Van)
 * Features: Compact white van body, sliding passenger side door with handle, rear tinted window
 */
export function TataMagicIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="magicBody" x1="0" y1="36" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="80%" stopColor="#edf2f7" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="126" rx="112" ry="6.5" fill="#1b2a2a" fillOpacity="0.18" />

      {/* Compact Van Silhouette */}
      <path
        d="M 38 48 C 38 40, 48 36, 60 36 L 195 36 C 212 36, 225 44, 230 62 L 236 86 C 238 94, 236 104, 230 106 L 208 106 A 16 16 0 0 1 176 106 L 104 106 A 16 16 0 0 1 72 106 L 38 106 Z"
        fill="url(#magicBody)"
        stroke="#94a3b8"
        strokeWidth="1.2"
      />

      <rect x="38" y="98" width="192" height="6" fill="#334155" />

      {/* Front Windshield */}
      <path d="M 175 40 L 214 46 L 222 72 L 175 72 Z" fill="#294354" />

      {/* Middle Passenger Window (Sliding Door) */}
      <rect x="110" y="42" width="58" height="30" rx="2" fill="#294354" />
      <rect x="46" y="42" width="58" height="30" rx="2" fill="#294354" />

      {/* Sliding Door Track Line & Door Handle */}
      <line x1="90" y1="80" x2="175" y2="80" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="160" y="74" width="8" height="3" rx="1" fill="#334155" />

      {/* Headlight & Indicator */}
      <rect x="232" y="74" width="5" height="12" rx="2" fill="#fef08a" stroke="#e2e8f0" strokeWidth="0.8" />
      <rect x="232" y="86" width="5" height="4" rx="1" fill="#f59e0b" />

      {/* Front Wheel */}
      <g>
        <circle cx="192" cy="110" r="17" fill="#1e293b" />
        <circle cx="192" cy="110" r="10" fill="#64748b" />
        <circle cx="192" cy="110" r="4" fill="#cbd5e1" />
      </g>

      {/* Rear Wheel */}
      <g>
        <circle cx="88" cy="110" r="17" fill="#1e293b" />
        <circle cx="88" cy="110" r="10" fill="#64748b" />
        <circle cx="88" cy="110" r="4" fill="#cbd5e1" />
      </g>
    </svg>
  );
}

/**
 * Private Bus SVG (32+ Seater Highway Coach)
 * Features: Long chassis, crimson & cream highway livery, large panoramic side windows, roof luggage carrier
 */
export function PrivateBusIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="busRed" x1="0" y1="30" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="127" rx="125" ry="7" fill="#1b2a2a" fillOpacity="0.18" />

      {/* Full Length Coach Body */}
      <path
        d="M 22 40 C 22 34, 30 28, 42 28 L 235 28 C 248 28, 256 36, 258 50 L 260 88 C 260 98, 254 106, 246 106 L 225 106 A 16 16 0 0 1 193 106 L 98 106 A 16 16 0 0 1 66 106 L 22 106 Z"
        fill="url(#busRed)"
      />

      <rect x="22" y="28" width="236" height="6" fill="#fef3c7" />

      {/* Destination LED Board */}
      <rect x="205" y="32" width="45" height="8" rx="1.5" fill="#0f172a" />
      <text x="210" y="38" fill="#facc15" fontSize="5" fontWeight="bold" fontFamily="sans-serif">J&K STAGE</text>

      {/* Large Highway Windows */}
      <g fill="#1e293b">
        <rect x="30" y="38" width="22" height="32" rx="2" />
        <rect x="56" y="38" width="24" height="32" rx="2" />
        <rect x="84" y="38" width="24" height="32" rx="2" />
        <rect x="112" y="38" width="24" height="32" rx="2" />
        <rect x="140" y="38" width="24" height="32" rx="2" />
        <rect x="168" y="38" width="24" height="32" rx="2" />
        <path d="M 196 38 L 244 38 C 250 44, 252 54, 252 70 L 196 70 Z" />
      </g>

      {/* Underbelly Luggage Cargo Compartment Doors */}
      <rect x="98" y="86" width="38" height="15" rx="1.5" fill="#581c1c" stroke="#991b1b" strokeWidth="0.8" />
      <rect x="140" y="86" width="38" height="15" rx="1.5" fill="#581c1c" stroke="#991b1b" strokeWidth="0.8" />

      {/* Front Headlights */}
      <rect x="256" y="76" width="4" height="14" rx="1.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.8" />

      {/* Front Wheel */}
      <g>
        <circle cx="210" cy="110" r="18" fill="#111827" />
        <circle cx="210" cy="110" r="11" fill="#4b5563" />
        <circle cx="210" cy="110" r="5" fill="#9ca3af" />
      </g>

      {/* Rear Double Axle */}
      <g>
        <circle cx="82" cy="110" r="18" fill="#111827" />
        <circle cx="82" cy="110" r="11" fill="#4b5563" />
        <circle cx="82" cy="110" r="5" fill="#9ca3af" />
      </g>
    </svg>
  );
}

/**
 * Force Traveller SVG (14-Seater Tourist Maxi-Cab)
 * Features: High-roof white van, large panoramic privacy dark glass, roof AC unit pod, front chrome grille
 */
export function ForceTravelerIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="travellerBody" x1="0" y1="30" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="127" rx="120" ry="6.5" fill="#1b2a2a" fillOpacity="0.18" />

      {/* Rooftop Air Conditioning Unit Pod */}
      <rect x="100" y="20" width="55" height="8" rx="3" fill="#334155" />
      <line x1="110" y1="23" x2="145" y2="23" stroke="#64748b" strokeWidth="1" />

      {/* High-Roof Van Body Silhouette */}
      <path
        d="M 32 46 C 32 34, 44 28, 58 28 L 205 28 C 220 28, 232 36, 238 52 L 246 82 C 248 92, 244 104, 236 106 L 214 106 A 16 16 0 0 1 182 106 L 104 106 A 16 16 0 0 1 72 106 L 32 106 Z"
        fill="url(#travellerBody)"
        stroke="#94a3b8"
        strokeWidth="1.2"
      />

      {/* Panoramic Dark Privacy Touring Glass */}
      <path
        d="M 40 40 L 195 40 L 235 48 L 240 70 L 40 70 Z"
        fill="#0f172a"
      />
      <line x1="85" y1="40" x2="85" y2="70" stroke="#f1f5f9" strokeWidth="2" />
      <line x1="130" y1="40" x2="130" y2="70" stroke="#f1f5f9" strokeWidth="2" />
      <line x1="175" y1="40" x2="175" y2="70" stroke="#f1f5f9" strokeWidth="2" />

      {/* Side Tourist Graphics Stripe */}
      <path d="M 40 82 L 180 82 L 200 90 L 40 90 Z" fill="#2563eb" opacity="0.85" />

      {/* Front Chrome Grille & Headlight */}
      <rect x="242" y="74" width="5" height="12" rx="2" fill="#fef08a" stroke="#cbd5e1" strokeWidth="0.8" />
      <line x1="240" y1="90" x2="246" y2="90" stroke="#94a3b8" strokeWidth="2" />

      {/* Front Wheel */}
      <g>
        <circle cx="198" cy="110" r="18" fill="#1e293b" />
        <circle cx="198" cy="110" r="11" fill="#64748b" />
        <circle cx="198" cy="110" r="5" fill="#e2e8f0" />
      </g>

      {/* Rear Wheel */}
      <g>
        <circle cx="88" cy="110" r="18" fill="#1e293b" />
        <circle cx="88" cy="110" r="11" fill="#64748b" />
        <circle cx="88" cy="110" r="5" fill="#e2e8f0" />
      </g>
    </svg>
  );
}

/**
 * Sedan Taxi SVG (Maruti Dzire / Etios)
 * Features: Sleek modern 3-box sedan silhouette, yellow commercial plate / taxi badge, alloy wheels
 */
export function SedanTaxiIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="sedanBody" x1="0" y1="45" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="126" rx="110" ry="6.5" fill="#1b2a2a" fillOpacity="0.18" />

      {/* Roof TAXI Light Sign */}
      <rect x="125" y="38" width="28" height="7" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
      <text x="129" y="44" fill="#000000" fontSize="5" fontWeight="bold" fontFamily="sans-serif">TAXI</text>

      {/* Sleek Aerodynamic Sedan Profile */}
      <path
        d="M 36 82 L 52 68 L 96 46 L 175 46 L 214 68 L 244 76 L 248 94 C 248 102, 242 106, 234 106 L 210 106 A 16 16 0 0 1 178 106 L 102 106 A 16 16 0 0 1 70 106 L 36 106 Z"
        fill="url(#sedanBody)"
        stroke="#64748b"
        strokeWidth="1.2"
      />

      {/* Tinted Cabin Windows */}
      <polygon points="60,68 98,50 98,72 56,72" fill="#1e293b" />
      <rect x="102" y="50" width="40" height="22" rx="1" fill="#1e293b" />
      <polygon points="146,50 172,50 204,70 146,72" fill="#1e293b" />

      {/* Door Handle & Character Crease */}
      <line x1="56" y1="78" x2="230" y2="78" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="150" y="74" width="8" height="2.5" rx="1" fill="#334155" />
      <rect x="108" y="74" width="8" height="2.5" rx="1" fill="#334155" />

      {/* Sleek Front Headlight */}
      <path d="M 235 74 L 246 76 L 242 86 L 228 84 Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="0.8" />

      {/* Front Wheel */}
      <g>
        <circle cx="194" cy="110" r="16" fill="#0f172a" />
        <circle cx="194" cy="110" r="10" fill="#64748b" />
        <circle cx="194" cy="110" r="4" fill="#f8fafc" />
      </g>

      {/* Rear Wheel */}
      <g>
        <circle cx="86" cy="110" r="16" fill="#0f172a" />
        <circle cx="86" cy="110" r="10" fill="#64748b" />
        <circle cx="86" cy="110" r="4" fill="#f8fafc" />
      </g>
    </svg>
  );
}

/**
 * SUV Taxi SVG (Toyota Innova Crysta / Scorpio)
 * Features: Long premium alpine SUV body, roof luggage rails, alloy rims, high ground clearance
 */
export function SUVTaxiIllustration({ className = "w-full h-full" }) {
  return (
    <svg viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="suvBody" x1="0" y1="40" x2="0" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="60%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Road Shadow */}
      <ellipse cx="140" cy="126" rx="115" ry="7" fill="#1b2a2a" fillOpacity="0.18" />

      {/* Aerodynamic Sleek Roof Luggage Carrier */}
      <rect x="75" y="32" width="115" height="5" rx="2" fill="#0f172a" />
      <line x1="85" y1="37" x2="85" y2="42" stroke="#475569" strokeWidth="2" />
      <line x1="135" y1="37" x2="135" y2="42" stroke="#475569" strokeWidth="2" />
      <line x1="180" y1="37" x2="180" y2="42" stroke="#475569" strokeWidth="2" />

      {/* Premium Innova Crysta / Scorpio SUV Profile */}
      <path
        d="M 32 74 L 40 58 C 44 46, 56 42, 70 42 L 180 42 L 218 64 L 244 76 L 246 94 C 246 104, 240 106, 230 106 L 210 106 A 18 18 0 0 1 174 106 L 102 106 A 18 18 0 0 1 66 106 L 32 106 Z"
        fill="url(#suvBody)"
        stroke="#64748b"
        strokeWidth="1.2"
      />

      {/* Tinted Touring Windows */}
      <polygon points="50,60 85,46 85,70 44,70" fill="#0f172a" />
      <rect x="90" y="46" width="46" height="24" rx="1.5" fill="#0f172a" />
      <polygon points="140,46 176,46 210,66 140,70" fill="#0f172a" />

      {/* Chrome Beltline & Door Handles */}
      <line x1="44" y1="72" x2="216" y2="72" stroke="#94a3b8" strokeWidth="1.5" />
      <rect x="144" y="75" width="9" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="98" y="75" width="9" height="2.5" rx="1" fill="#e2e8f0" />

      {/* Aggressive LED Headlamp */}
      <polygon points="230,76 245,78 242,88 226,86" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />

      {/* Front High-Clearance Alloy Wheel */}
      <g>
        <circle cx="192" cy="110" r="18" fill="#0f172a" />
        <circle cx="192" cy="110" r="11" fill="#64748b" />
        <circle cx="192" cy="110" r="5" fill="#f8fafc" />
      </g>

      {/* Rear High-Clearance Alloy Wheel */}
      <g>
        <circle cx="84" cy="110" r="18" fill="#0f172a" />
        <circle cx="84" cy="110" r="11" fill="#64748b" />
        <circle cx="84" cy="110" r="5" fill="#f8fafc" />
      </g>
    </svg>
  );
}

/**
 * Universal Vehicle Illustration Dispatcher
 */
export default function VehicleIllustration({ vehicleKey, className = "w-full h-full" }) {
  switch (vehicleKey) {
    case "shared-cab":
      return <TataSumoIllustration className={className} />;
    case "mini-bus":
      return <MatadorIllustration className={className} />;
    case "vikram-tempo":
      return <VikramTempoIllustration className={className} />;
    case "e-rickshaw":
      return <ERickshawIllustration className={className} />;
    case "e-auto":
      return <EAutoIllustration className={className} />;
    case "auto":
      return <AutoRickshawIllustration className={className} />;
    case "tata-magic":
      return <TataMagicIllustration className={className} />;
    case "private-bus":
      return <PrivateBusIllustration className={className} />;
    case "force-traveler":
      return <ForceTravelerIllustration className={className} />;
    case "taxi":
      return <SedanTaxiIllustration className={className} />;
    case "suv-taxi":
      return <SUVTaxiIllustration className={className} />;
    default:
      return <TataSumoIllustration className={className} />;
  }
}
