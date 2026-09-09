/**
 * SAFAR — Statutory Vehicle Operational Zones & Transit Corridor Profiles
 * Canonical Data Layer for Jammu & Kashmir Transit Network
 */

// 1. Vehicle-Zone Truth Table (All 11 Categories)
export const VEHICLE_OPERATIONAL_ZONES = {
  "vikram-tempo": {
    id: "vikram",
    name: "Vikram Tempo",
    operationalZone: {
      region: ["jammu"],
      routeType: ["intracity"],
      districts: ["jammu"]
    }
  },
  "auto": {
    id: "auto",
    name: "Auto Rickshaw",
    operationalZone: {
      region: ["jammu", "kashmir", "srinagar"],
      routeType: ["intracity"],
      districts: ["jammu", "srinagar"]
    }
  },
  "e-auto": {
    id: "e-auto",
    name: "E-Auto",
    operationalZone: {
      region: ["jammu", "kashmir", "srinagar"],
      routeType: ["intracity"],
      districts: ["jammu", "srinagar"]
    }
  },
  "e-rickshaw": {
    id: "e-rickshaw",
    name: "E-Rickshaw",
    operationalZone: {
      region: ["jammu", "kashmir", "srinagar"],
      routeType: ["intracity"],
      districts: ["jammu", "srinagar", "katra", "baramulla", "anantnag"]
    }
  },
  "tata-magic": {
    id: "tata-magic",
    name: "Tata Magic",
    operationalZone: {
      region: ["jammu", "kashmir", "both"],
      routeType: ["intercity"],
      districts: ["all"]
    }
  },
  "shared-cab": {
    id: "shared-cab",
    name: "Sumo (Shared Cab)",
    operationalZone: {
      region: ["jammu", "kashmir", "both"],
      routeType: ["intercity"],
      districts: ["all"]
    }
  },
  "mini-bus": {
    id: "mini-bus",
    name: "Matador (Mini Bus)",
    operationalZone: {
      region: ["jammu", "kashmir", "both"],
      routeType: ["intercity"],
      districts: ["all"]
    }
  },
  "private-bus": {
    id: "private-bus",
    name: "Private Bus",
    operationalZone: {
      region: ["jammu", "kashmir", "both"],
      routeType: ["intercity"],
      districts: ["all"]
    }
  },
  "force-traveler": {
    id: "force-traveler",
    name: "Tempo Traveler",
    operationalZone: {
      region: ["jammu", "kashmir", "both"],
      routeType: ["intercity", "intracity", "both"],
      districts: ["all"]
    }
  },
  "taxi": {
    id: "taxi",
    name: "Sedan Taxi",
    operationalZone: {
      region: ["jammu", "kashmir", "both"],
      routeType: ["intercity", "intracity", "both"],
      districts: ["all"]
    }
  },
  "suv-taxi": {
    id: "suv-taxi",
    name: "SUV Taxi",
    operationalZone: {
      region: ["jammu", "kashmir", "both"],
      routeType: ["intercity", "intracity", "both"],
      districts: ["all"]
    }
  }
};

// 2. Canonical J&K Transit Location & District Lookup Dictionary
export const CANONICAL_LOCATIONS = {
  // --- Srinagar District ---
  "srinagar": { district: "srinagar", region: "kashmir" },
  "lal chowk": { district: "srinagar", region: "kashmir" },
  "lal chowk (srinagar)": { district: "srinagar", region: "kashmir" },
  "dal lake": { district: "srinagar", region: "kashmir" },
  "dal lake (dalgate)": { district: "srinagar", region: "kashmir" },
  "dalgate": { district: "srinagar", region: "kashmir" },
  "hazratbal": { district: "srinagar", region: "kashmir" },
  "batamaloo": { district: "srinagar", region: "kashmir" },
  "parimpora": { district: "srinagar", region: "kashmir" },
  "pantha chowk": { district: "srinagar", region: "kashmir" },
  "soura": { district: "srinagar", region: "kashmir" },
  "nowhatta": { district: "srinagar", region: "kashmir" },
  "trc": { district: "srinagar", region: "kashmir" },
  "trc srinagar": { district: "srinagar", region: "kashmir" },
  "shalteng": { district: "srinagar", region: "kashmir" },
  "qamarwari": { district: "srinagar", region: "kashmir" },
  "tengpora": { district: "srinagar", region: "kashmir" },
  "sanat nagar": { district: "srinagar", region: "kashmir" },
  "rawalpore": { district: "srinagar", region: "kashmir" },
  "chanapora": { district: "srinagar", region: "kashmir" },
  "nigeen": { district: "srinagar", region: "kashmir" },
  "rainawari": { district: "srinagar", region: "kashmir" },

  // --- Budgam District ---
  "budgam": { district: "budgam", region: "kashmir" },
  "srinagar airport": { district: "budgam", region: "kashmir" },
  "airport": { district: "budgam", region: "kashmir" },
  "humhama": { district: "budgam", region: "kashmir" },
  "rambagh": { district: "budgam", region: "kashmir" },
  "hyderpora": { district: "budgam", region: "kashmir" },
  "chadoora": { district: "budgam", region: "kashmir" },
  "magam": { district: "budgam", region: "kashmir" },
  "beerwah": { district: "budgam", region: "kashmir" },
  "khansahib": { district: "budgam", region: "kashmir" },
  "doodhpathri": { district: "budgam", region: "kashmir" },
  "yusmarg": { district: "budgam", region: "kashmir" },
  "charar-e-sharief": { district: "budgam", region: "kashmir" },
  "ompora": { district: "budgam", region: "kashmir" },

  // --- Baramulla District ---
  "baramulla": { district: "baramulla", region: "kashmir" },
  "baramulla bus stand": { district: "baramulla", region: "kashmir" },
  "sopore": { district: "baramulla", region: "kashmir" },
  "sopore bus stand": { district: "baramulla", region: "kashmir" },
  "gulmarg": { district: "baramulla", region: "kashmir" },
  "tangmarg": { district: "baramulla", region: "kashmir" },
  "sangrama": { district: "baramulla", region: "kashmir" },
  "pattan": { district: "baramulla", region: "kashmir" },
  "uri": { district: "baramulla", region: "kashmir" },
  "kreeri": { district: "baramulla", region: "kashmir" },
  "narbal": { district: "baramulla", region: "kashmir" },

  // --- Anantnag District ---
  "anantnag": { district: "anantnag", region: "kashmir" },
  "anantnag bus stand": { district: "anantnag", region: "kashmir" },
  "kp road": { district: "anantnag", region: "kashmir" },
  "pahalgam": { district: "anantnag", region: "kashmir" },
  "bijbehara": { district: "anantnag", region: "kashmir" },
  "kokernag": { district: "anantnag", region: "kashmir" },
  "verinag": { district: "anantnag", region: "kashmir" },
  "daksum": { district: "anantnag", region: "kashmir" },
  "achabal": { district: "anantnag", region: "kashmir" },
  "mattana": { district: "anantnag", region: "kashmir" },

  // --- Ganderbal District ---
  "ganderbal": { district: "ganderbal", region: "kashmir" },
  "sonmarg": { district: "ganderbal", region: "kashmir" },
  "kangan": { district: "ganderbal", region: "kashmir" },
  "gund": { district: "ganderbal", region: "kashmir" },
  "beehama": { district: "ganderbal", region: "kashmir" },
  "nagbal": { district: "ganderbal", region: "kashmir" },
  "safapora": { district: "ganderbal", region: "kashmir" },
  "mansbal": { district: "ganderbal", region: "kashmir" },

  // --- Pulwama District ---
  "pulwama": { district: "pulwama", region: "kashmir" },
  "awantipora": { district: "pulwama", region: "kashmir" },
  "pampore": { district: "pulwama", region: "kashmir" },
  "tral": { district: "pulwama", region: "kashmir" },
  "kakapora": { district: "pulwama", region: "kashmir" },
  "rajpora": { district: "pulwama", region: "kashmir" },

  // --- Shopian District ---
  "shopian": { district: "shopian", region: "kashmir" },
  "aharbal": { district: "shopian", region: "kashmir" },
  "sedow": { district: "shopian", region: "kashmir" },
  "keller": { district: "shopian", region: "kashmir" },
  "herpora": { district: "shopian", region: "kashmir" },

  // --- Kulgam District ---
  "kulgam": { district: "kulgam", region: "kashmir" },
  "qazigund": { district: "kulgam", region: "kashmir" },
  "yaripora": { district: "kulgam", region: "kashmir" },
  "frisal": { district: "kulgam", region: "kashmir" },
  "wanpoh": { district: "kulgam", region: "kashmir" },

  // --- Kupwara District ---
  "kupwara": { district: "kupwara", region: "kashmir" },
  "handwara": { district: "kupwara", region: "kashmir" },
  "langate": { district: "kupwara", region: "kashmir" },
  "karnah": { district: "kupwara", region: "kashmir" },
  "tangdar": { district: "kupwara", region: "kashmir" },
  "trehgam": { district: "kupwara", region: "kashmir" },
  "sogam": { district: "kupwara", region: "kashmir" },
  "lolab": { district: "kupwara", region: "kashmir" },

  // --- Bandipora District ---
  "bandipora": { district: "bandipora", region: "kashmir" },
  "gurez": { district: "bandipora", region: "kashmir" },
  "gurez valley": { district: "bandipora", region: "kashmir" },
  "dawar": { district: "bandipora", region: "kashmir" },
  "sumbal": { district: "bandipora", region: "kashmir" },
  "hajan": { district: "bandipora", region: "kashmir" },

  // --- Jammu District ---
  "jammu": { district: "jammu", region: "jammu" },
  "jammu tawi": { district: "jammu", region: "jammu" },
  "jammu tawi station": { district: "jammu", region: "jammu" },
  "jammu bus stand": { district: "jammu", region: "jammu" },
  "gandhi nagar": { district: "jammu", region: "jammu" },
  "gandhi nagar (jammu)": { district: "jammu", region: "jammu" },
  "janipur": { district: "jammu", region: "jammu" },
  "janipur (jammu)": { district: "jammu", region: "jammu" },
  "narwal": { district: "jammu", region: "jammu" },
  "narwal (jammu)": { district: "jammu", region: "jammu" },
  "satwari": { district: "jammu", region: "jammu" },
  "jewel": { district: "jammu", region: "jammu" },
  "jewel chowk": { district: "jammu", region: "jammu" },
  "bikram chowk": { district: "jammu", region: "jammu" },
  "nagrota": { district: "jammu", region: "jammu" },
  "akhnoor": { district: "jammu", region: "jammu" },
  "r.s. pura": { district: "jammu", region: "jammu" },
  "canal road": { district: "jammu", region: "jammu" },
  "bantalab": { district: "jammu", region: "jammu" },

  // --- Reasi District ---
  "katra": { district: "reasi", region: "jammu" },
  "katra station": { district: "reasi", region: "jammu" },
  "katra railway station": { district: "reasi", region: "jammu" },
  "banganga": { district: "reasi", region: "jammu" },
  "banganga (katra)": { district: "reasi", region: "jammu" },
  "reasi": { district: "reasi", region: "jammu" },
  "jhajjar kotli": { district: "reasi", region: "jammu" },
  "pouni": { district: "reasi", region: "jammu" },

  // --- Udhampur District ---
  "udhampur": { district: "udhampur", region: "jammu" },
  "patnitop": { district: "udhampur", region: "jammu" },
  "sanasar": { district: "udhampur", region: "jammu" },
  "chenani": { district: "udhampur", region: "jammu" },
  "tikri": { district: "udhampur", region: "jammu" },
  "samroli": { district: "udhampur", region: "jammu" },
  "kud": { district: "udhampur", region: "jammu" },
  "ramnagar": { district: "udhampur", region: "jammu" },

  // --- Ramban District & Border Portals ---
  "ramban": { district: "ramban", region: "jammu", isBorderPortal: true },
  "banihal": { district: "ramban", region: "jammu", isBorderPortal: true },
  "batote": { district: "ramban", region: "jammu" },
  "chanderkote": { district: "ramban", region: "jammu" },
  "ramsoo": { district: "ramban", region: "jammu" },

  // --- Doda District ---
  "doda": { district: "doda", region: "jammu" },
  "bhaderwah": { district: "doda", region: "jammu" },
  "assar": { district: "doda", region: "jammu" },
  "thathri": { district: "doda", region: "jammu" },
  "gandoh": { district: "doda", region: "jammu" },

  // --- Kishtwar District ---
  "kishtwar": { district: "kishtwar", region: "jammu" },
  "sinthan top": { district: "kishtwar", region: "jammu", isBorderPortal: true },
  "chhatroo": { district: "kishtwar", region: "jammu" },
  "paddar": { district: "kishtwar", region: "jammu" },

  // --- Rajouri District ---
  "rajouri": { district: "rajouri", region: "jammu" },
  "sunderbani": { district: "rajouri", region: "jammu" },
  "nowshera": { district: "rajouri", region: "jammu" },
  "kalakote": { district: "rajouri", region: "jammu" },
  "thanamandi": { district: "rajouri", region: "jammu" },

  // --- Poonch District ---
  "poonch": { district: "poonch", region: "jammu" },
  "surankote": { district: "poonch", region: "jammu" },
  "mendhar": { district: "poonch", region: "jammu" },
  "bafliaz": { district: "poonch", region: "jammu", isBorderPortal: true },
  "bafliaz (mughal road)": { district: "poonch", region: "jammu", isBorderPortal: true },

  // --- Samba District ---
  "samba": { district: "samba", region: "jammu" },
  "mansar lake": { district: "samba", region: "jammu" },
  "ghagwal": { district: "samba", region: "jammu" },
  "bari brahmana": { district: "samba", region: "jammu" },
  "vijaypur": { district: "samba", region: "jammu" },

  // --- Kathua District ---
  "kathua": { district: "kathua", region: "jammu" },
  "hiranagar": { district: "kathua", region: "jammu" },
  "billawar": { district: "kathua", region: "jammu" },
  "basohli": { district: "kathua", region: "jammu" },
  "lakhanpur": { district: "kathua", region: "jammu" },
};

// 3. Ambiguous Waypoints / Border Portals requiring confirmation when matched in isolation
export const BORDER_PORTAL_LOCATIONS = ["banihal", "sinthan top", "bafliaz", "bafliaz (mughal road)"];

// Helper to normalize and match any free-text location string to canonical location
export function lookupCanonicalLocation(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  const q = rawText.trim().toLowerCase();

  // 1. Direct match
  if (CANONICAL_LOCATIONS[q]) {
    return { ...CANONICAL_LOCATIONS[q], matchedName: q };
  }

  // 2. Clean common stop suffixes: "bus stand", "chowk", "railway station", "station", "market", "terminal", "airport"
  const cleanQ = q
    .replace(/\b(bus stand|railway station|station|chowk|market|terminal|airport|stand|stop)\b/gi, "")
    .trim();

  if (CANONICAL_LOCATIONS[cleanQ]) {
    return { ...CANONICAL_LOCATIONS[cleanQ], matchedName: cleanQ };
  }

  // 3. Substring match against canonical keys (longest match wins)
  let bestMatch = null;
  let maxLen = 0;

  for (const [key, meta] of Object.entries(CANONICAL_LOCATIONS)) {
    if (q.includes(key) || key.includes(q)) {
      if (key.length > maxLen) {
        maxLen = key.length;
        bestMatch = { ...meta, matchedName: key };
      }
    }
  }

  return bestMatch;
}

/**
 * 4. Strict Route Profile Resolver
 * Enforces District Boundary as sole routeType determiner:
 * - districtOrigin !== districtDestination -> ALWAYS "intercity"
 * - districtOrigin === districtDestination -> ALWAYS "intracity"
 */
export function resolveRouteProfile(origin, destination, isPreset = false, presetProfile = null, userRegionOverride = null) {
  if (isPreset && presetProfile) {
    return {
      ...presetProfile,
      isAmbiguous: false
    };
  }

  const s1 = (origin || "").trim();
  const s2 = (destination || "").trim();

  if (!s1 || !s2) {
    return null;
  }

  const loc1 = lookupCanonicalLocation(s1);
  const loc2 = lookupCanonicalLocation(s2);

  const district1 = loc1 ? loc1.district : s1.toLowerCase().includes("jammu") ? "jammu" : "srinagar";
  const district2 = loc2 ? loc2.district : s2.toLowerCase().includes("jammu") ? "jammu" : "srinagar";

  const canonicalRegion1 = loc1 ? loc1.region : district1 === "jammu" ? "jammu" : "kashmir";
  const canonicalRegion2 = loc2 ? loc2.region : district2 === "jammu" ? "jammu" : "kashmir";

  // Check for ambiguous border portals (e.g. Banihal, Sinthan Top, Bafliaz)
  const isLoc1Portal = loc1 && loc1.isBorderPortal;
  const isLoc2Portal = loc2 && loc2.isBorderPortal;
  const hasAmbiguousPortal = isLoc1Portal || isLoc2Portal;

  let isAmbiguous = false;
  let ambiguityNote = "";

  if (hasAmbiguousPortal && !userRegionOverride) {
    const portalName = isLoc1Portal ? loc1.matchedName : loc2.matchedName;
    isAmbiguous = true;
    ambiguityNote = `${portalName.toUpperCase()} is an inter-divisional mountain portal. Please confirm travel division.`;
  }

  // Resolved Region:
  // If the two endpoints are canonically in different divisions, finalRegion is always "both".
  // The override resolves ambiguity but does not collapse an inherently cross-division route.
  let finalRegion = "kashmir";
  if (canonicalRegion1 !== canonicalRegion2) {
    finalRegion = "both";
  } else if (canonicalRegion1 === "jammu") {
    finalRegion = "jammu";
  } else {
    finalRegion = "kashmir";
  }

  // When user provides an explicit override, clear ambiguity
  // If the two endpoints are canonically in different divisions, finalRegion is always "both" regardless of override.
  // The override resolves ambiguity and only sets division when endpoints do not canonically span across divisions.
  if (userRegionOverride) {
    isAmbiguous = false;
    if (canonicalRegion1 === canonicalRegion2 && ["jammu", "kashmir", "both"].includes(userRegionOverride)) {
      finalRegion = userRegionOverride;
    }
  }

  // Primary Rule: District boundary as sole routeType determiner
  const finalRouteType = district1 === district2 ? "intracity" : "intercity";

  return {
    origin: s1,
    destination: s2,
    region: finalRegion,
    routeType: finalRouteType,
    districts: Array.from(new Set([district1, district2])),
    isAmbiguous,
    ambiguityNote
  };
}

/**
 * 5. Strict Vehicle Eligibility Filter
 * Whitelist filtering: Silently excludes unauthorized vehicles.
 * No card, no fare, no placeholder.
 */
export function filterEligibleVehicles(vehicles, routeProfile) {
  if (!routeProfile) {
    return vehicles;
  }

  return vehicles.filter((v) => {
    const zone = v.operationalZone;
    // Strict Whitelist: Reject any vehicle without explicit operationalZone
    if (!zone || !Array.isArray(zone.region) || !Array.isArray(zone.routeType)) {
      return false;
    }

    // 1. Region check: vehicle must cover the specific route region
    const validRegions = ["jammu", "kashmir", "both"];
    if (!validRegions.includes(routeProfile.region)) {
      return false;
    }

    const regionMatch =
      zone.region.includes(routeProfile.region) ||
      (zone.region.includes("both") && (routeProfile.region === "jammu" || routeProfile.region === "kashmir")) ||
      (routeProfile.region === "both" &&
        (zone.region.includes("both") ||
          (zone.region.includes("jammu") && zone.region.includes("kashmir"))));

    if (!regionMatch) return false;

    // 2. Route Type check: vehicle must cover the requested route type
    const validRouteTypes = ["intercity", "intracity", "both"];
    if (!validRouteTypes.includes(routeProfile.routeType)) {
      return false;
    }

    const routeTypeMatch =
      zone.routeType.includes(routeProfile.routeType) ||
      (zone.routeType.includes("both") &&
        (routeProfile.routeType === "intercity" || routeProfile.routeType === "intracity")) ||
      (routeProfile.routeType === "both" &&
        (zone.routeType.includes("both") ||
          (zone.routeType.includes("intercity") && zone.routeType.includes("intracity"))));

    if (!routeTypeMatch) return false;

    // 3. District restrictions (e.g. Vikram in Jammu only, Auto in Jammu + Srinagar only)
    if (zone.districts && !zone.districts.includes("all")) {
      if (!routeProfile.districts || routeProfile.districts.length === 0) {
        return false;
      }
      if (routeProfile.routeType === "intracity") {
        const isAllowed = routeProfile.districts.every((d) =>
          zone.districts.includes(d.toLowerCase())
        );
        if (!isAllowed) return false;
      } else {
        const isAllowed = routeProfile.districts.some((d) =>
          zone.districts.includes(d.toLowerCase())
        );
        if (!isAllowed) return false;
      }
    }

    return true;
  });
}

/**
 * Vehicle Operational Distance & Corridor Viability Matrix
 *
 * @param {string} vehicleKey - Key of vehicle (e.g. 'e-rickshaw', 'e-auto', 'auto')
 * @param {number} km - Total distance in km
 * @param {string} [from=''] - Origin location
 * @param {string} [to=''] - Destination location
 * @returns {{ isViable: boolean, reason: string, maxKm: number, vehicleName?: string, alternativeKey: string, alternativeName: string }}
 */
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

  let profile = null;
  if (from && to) {
    try {
      profile = resolveRouteProfile(from, to);
    } catch (e) {}
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
      if (profile && profile.routeType === "intercity") {
        return {
          isViable: false,
          maxKm: 10,
          vehicleName: "E-Rickshaw (Toto / Cart)",
          reason: `E-Rickshaws operate strictly within local municipal limits and cannot ply on inter-district highway corridors (${dist} km).`,
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
      if (profile && profile.routeType === "intercity") {
        return {
          isViable: false,
          maxKm: 15,
          vehicleName: "E-Auto (Smart Metered)",
          reason: `E-Autos operate strictly within urban municipal limits and do not service inter-district highway routes (${dist} km).`,
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
      if (profile && profile.routeType === "intercity") {
        return {
          isViable: false,
          maxKm: 25,
          vehicleName: "Auto-Rickshaw (Petrol/CNG)",
          reason: `Auto-Rickshaws operate strictly within municipal limits and do not service inter-district highway corridors (${dist} km).`,
          alternativeKey: "shared-cab",
          alternativeName: "Shared Maxi-Cab or Sedan Taxi",
        };
      }
      break;

    case "vikram-tempo":
      if (profile && (profile.region === "kashmir" || (profile.districts && !profile.districts.includes("jammu")))) {
        return {
          isViable: false,
          maxKm: 20,
          vehicleName: "Vikram Tempo (Jammu City)",
          reason: "Vikram Tempos operate exclusively in Jammu City and are not operational in Kashmir Division or outside Jammu district.",
          alternativeKey: "mini-bus",
          alternativeName: "Mini Bus (Matador) or Shared Cab",
        };
      }
      if (dist > 20 || (profile && profile.routeType === "intercity")) {
        return {
          isViable: false,
          maxKm: 20,
          vehicleName: "Vikram Tempo (Jammu City)",
          reason: `Vikram Tempos run on designated short urban corridors in Jammu (up to 20 km) and cannot ply on inter-district mountain routes (${dist} km).`,
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
          reason: `Tata Magic feeder vans operate on short rural-urban feeder stages (up to 35 km) and do not operate across long-distance highways (${dist} km).`,
          alternativeKey: "mini-bus",
          alternativeName: "Mini Bus (Matador) or Shared Cab",
        };
      }
      if (profile && profile.routeType === "intracity" && profile.districts && profile.districts.includes("srinagar")) {
        return {
          isViable: false,
          maxKm: 35,
          vehicleName: "Tata Magic / Feeder 4-Wheeler",
          reason: "Tata Magic feeder vans are not permitted on Srinagar core municipal routes (serviced by Matadors, E-Autos and Smart City buses).",
          alternativeKey: "mini-bus",
          alternativeName: "Mini Bus (Matador)",
        };
      }
      break;

    case "mini-bus":
      if (dist > 70) {
        return {
          isViable: false,
          maxKm: 70,
          vehicleName: "Matador (Mini-Bus)",
          reason: `Matadors and Mini-Buses operate on sub-district stage routes (up to 70 km). For journeys exceeding 70 km (${dist} km), use 2+2 Big Buses or Shared Maxi-Cabs.`,
          alternativeKey: "bus-2x2",
          alternativeName: "Private 2+2 Big Bus or Shared Cab",
        };
      }
      if (profile && profile.region === "both") {
        return {
          isViable: false,
          maxKm: 70,
          vehicleName: "Matador (Mini-Bus)",
          reason: `Matadors and Mini-Buses do not operate across the inter-divisional Jammu–Srinagar highway corridor (${dist} km). Commuters use 2+2 Big Buses or Shared Maxi-Cabs.`,
          alternativeKey: "shared-cab",
          alternativeName: "Shared Maxi-Cab (Sumo/Bolero)",
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

