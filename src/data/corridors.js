/**
 * SAFAR — TransitCorridor Schema Dataset
 * Hierarchical J&K corridor data for Stage Explorer
 * Schema: TransitCorridor { id, name, vehicleTypes, frequencyText, firstTrip, lastTrip, occupancyTier, stages[] }
 * Each stage: { stopId, stopName, kmFromSource, statutoryFare }
 */

/** @typedef {'bus'|'matador'|'sumo'|'shared-cab'|'tata-magic'|'e-rickshaw'|'taxi'|'suv-taxi'} VehicleType */
/** @typedef {'low'|'moderate'|'high'} OccupancyTier */

/**
 * @typedef {Object} CorridorStage
 * @property {string} stopId
 * @property {string} stopName
 * @property {number} kmFromSource
 * @property {number} statutoryFare - Per-seat fare at this stop from source (SRO-97)
 */

/**
 * @typedef {Object} TransitCorridor
 * @property {string} id
 * @property {string} name
 * @property {string} region - 'kashmir-plain'|'kashmir-hill'|'jammu-plain'|'jammu-hill'
 * @property {VehicleType[]} vehicleTypes
 * @property {string} frequencyText
 * @property {string} firstTrip
 * @property {string} lastTrip
 * @property {OccupancyTier} occupancyTier
 * @property {string} highway
 * @property {CorridorStage[]} stages
 */

/** @type {TransitCorridor[]} */
export const JK_CORRIDORS = [
  {
    id: "JK-SRI-01",
    name: "Lal Chowk ⇄ Hazratbal via Dalgate",
    region: "kashmir-plain",
    vehicleTypes: ["matador", "e-rickshaw"],
    frequencyText: "Every 8–12 min",
    firstTrip: "06:30",
    lastTrip: "20:00",
    occupancyTier: "high",
    highway: "Boulevard Road / Foreshore Road",
    stages: [
      { stopId: "lal-chowk",   stopName: "Lal Chowk",           kmFromSource: 0,  statutoryFare: 0  },
      { stopId: "ma-road",     stopName: "MA Road",              kmFromSource: 1,  statutoryFare: 10 },
      { stopId: "trc",         stopName: "TRC Crossing",         kmFromSource: 2,  statutoryFare: 10 },
      { stopId: "dalgate",     stopName: "Dalgate",              kmFromSource: 4,  statutoryFare: 10 },
      { stopId: "rainawari",   stopName: "Rainawari",            kmFromSource: 6,  statutoryFare: 14 },
      { stopId: "saida-kadal", stopName: "Saida Kadal",          kmFromSource: 8,  statutoryFare: 14 },
      { stopId: "nigeen",      stopName: "Nigeen Lake",          kmFromSource: 9,  statutoryFare: 17 },
      { stopId: "hazratbal",   stopName: "Hazratbal",            kmFromSource: 11, statutoryFare: 17 },
    ],
  },

  {
    id: "JK-SRI-02",
    name: "Batamaloo ⇄ Baramulla via NH-1",
    region: "kashmir-plain",
    vehicleTypes: ["sumo", "matador", "bus"],
    frequencyText: "Every 15–25 min",
    firstTrip: "06:00",
    lastTrip: "19:30",
    occupancyTier: "high",
    highway: "NH-1 Valley Highway",
    stages: [
      { stopId: "batamaloo",  stopName: "Batamaloo Bus Stand",  kmFromSource: 0,  statutoryFare: 0  },
      { stopId: "parimpora",  stopName: "Parimpora",            kmFromSource: 6,  statutoryFare: 31 },
      { stopId: "pattan",     stopName: "Pattan",               kmFromSource: 30, statutoryFare: 156},
      { stopId: "sangrama",   stopName: "Sangrama",             kmFromSource: 40, statutoryFare: 208},
      { stopId: "sopore",     stopName: "Sopore",               kmFromSource: 48, statutoryFare: 249},
      { stopId: "baramulla",  stopName: "Baramulla",            kmFromSource: 54, statutoryFare: 281},
    ],
  },

  {
    id: "JK-SRI-03",
    name: "Pantha Chowk ⇄ Anantnag via NH-44",
    region: "kashmir-plain",
    vehicleTypes: ["sumo", "bus", "matador"],
    frequencyText: "Every 10–20 min",
    firstTrip: "06:00",
    lastTrip: "20:00",
    occupancyTier: "high",
    highway: "NH-44 Valley Expressway",
    stages: [
      { stopId: "pantha-chowk",  stopName: "Pantha Chowk",     kmFromSource: 0,  statutoryFare: 0  },
      { stopId: "pampore",       stopName: "Pampore",           kmFromSource: 8,  statutoryFare: 42 },
      { stopId: "awantipora",    stopName: "Awantipora",        kmFromSource: 18, statutoryFare: 94 },
      { stopId: "bijbehara",     stopName: "Bijbehara",         kmFromSource: 28, statutoryFare: 145},
      { stopId: "anantnag",      stopName: "Anantnag",          kmFromSource: 32, statutoryFare: 166},
    ],
  },

  {
    id: "JK-JAM-01",
    name: "Jammu GBS ⇄ Katra Vaishno Devi",
    region: "jammu-hill",
    vehicleTypes: ["bus", "sumo", "taxi"],
    frequencyText: "Every 20–30 min",
    firstTrip: "05:00",
    lastTrip: "22:00",
    occupancyTier: "high",
    highway: "NH-44 / Katra Bypass",
    stages: [
      { stopId: "jammu-gbs",       stopName: "Jammu General Bus Stand", kmFromSource: 0,  statutoryFare: 0  },
      { stopId: "nagrota",         stopName: "Nagrota",                 kmFromSource: 12, statutoryFare: 62 },
      { stopId: "domel",           stopName: "Domel",                   kmFromSource: 30, statutoryFare: 156},
      { stopId: "jhajjar-kotli",   stopName: "Jhajjar Kotli",           kmFromSource: 38, statutoryFare: 197},
      { stopId: "katra",           stopName: "Katra (Vaishno Devi)",    kmFromSource: 49, statutoryFare: 255},
    ],
  },

  {
    id: "JK-JAM-02",
    name: "Jammu ⇄ Udhampur via NH-44",
    region: "jammu-hill",
    vehicleTypes: ["bus", "sumo", "shared-cab"],
    frequencyText: "Every 15–20 min",
    firstTrip: "06:00",
    lastTrip: "20:00",
    occupancyTier: "moderate",
    highway: "NH-44 4-Lane Highway",
    stages: [
      { stopId: "jammu",       stopName: "Jammu",              kmFromSource: 0,  statutoryFare: 0  },
      { stopId: "nagrota",     stopName: "Nagrota",            kmFromSource: 12, statutoryFare: 62 },
      { stopId: "nandni",      stopName: "Nandni Tunnel",      kmFromSource: 30, statutoryFare: 156},
      { stopId: "tikri",       stopName: "Tikri",              kmFromSource: 50, statutoryFare: 260},
      { stopId: "udhampur",    stopName: "Udhampur",           kmFromSource: 65, statutoryFare: 338},
    ],
  },

  {
    id: "JK-NKA-01",
    name: "Srinagar ⇄ Baramulla via NH-1",
    region: "kashmir-plain",
    vehicleTypes: ["sumo", "bus", "matador"],
    frequencyText: "Every 12–18 min",
    firstTrip: "06:00",
    lastTrip: "19:30",
    occupancyTier: "high",
    highway: "NH-1 Valley Highway",
    stages: [
      { stopId: "srinagar",   stopName: "Srinagar (Parimpora)", kmFromSource: 0,  statutoryFare: 0  },
      { stopId: "shalteng",   stopName: "Shalteng",             kmFromSource: 8,  statutoryFare: 42 },
      { stopId: "pattan",     stopName: "Pattan",               kmFromSource: 24, statutoryFare: 125},
      { stopId: "sangrama",   stopName: "Sangrama",             kmFromSource: 34, statutoryFare: 177},
      { stopId: "sopore",     stopName: "Sopore",               kmFromSource: 42, statutoryFare: 218},
      { stopId: "baramulla",  stopName: "Baramulla",            kmFromSource: 54, statutoryFare: 281},
    ],
  },

  {
    id: "JK-NKA-02",
    name: "Srinagar ⇄ Sonmarg (Tourist Corridor)",
    region: "kashmir-hill",
    vehicleTypes: ["sumo", "taxi", "suv-taxi"],
    frequencyText: "Every 30–45 min",
    firstTrip: "07:00",
    lastTrip: "15:00",
    occupancyTier: "moderate",
    highway: "NH-1 (Srinagar–Leh)",
    stages: [
      { stopId: "srinagar",  stopName: "Srinagar",             kmFromSource: 0,  statutoryFare: 0   },
      { stopId: "ganderbal", stopName: "Ganderbal",            kmFromSource: 21, statutoryFare: 109  },
      { stopId: "kangan",    stopName: "Kangan",               kmFromSource: 45, statutoryFare: 234  },
      { stopId: "gund",      stopName: "Gund",                 kmFromSource: 62, statutoryFare: 322  },
      { stopId: "sonmarg",   stopName: "Sonmarg",              kmFromSource: 80, statutoryFare: 416  },
    ],
  },

  {
    id: "JK-SRI-04",
    name: "Srinagar ⇄ Gulmarg (Mountain Pass)",
    region: "kashmir-hill",
    vehicleTypes: ["sumo", "suv-taxi", "taxi"],
    frequencyText: "Every 30–40 min",
    firstTrip: "07:00",
    lastTrip: "16:00",
    occupancyTier: "moderate",
    highway: "Tangmarg–Gulmarg Road",
    stages: [
      { stopId: "srinagar",  stopName: "Srinagar",             kmFromSource: 0,  statutoryFare: 0   },
      { stopId: "narbal",    stopName: "Narbal",               kmFromSource: 14, statutoryFare: 73  },
      { stopId: "magam",     stopName: "Magam",                kmFromSource: 22, statutoryFare: 114 },
      { stopId: "tangmarg",  stopName: "Tangmarg",             kmFromSource: 38, statutoryFare: 198 },
      { stopId: "gulmarg",   stopName: "Gulmarg",              kmFromSource: 51, statutoryFare: 265 },
    ],
  },
];

/**
 * Get a corridor by ID
 * @param {string} id
 * @returns {TransitCorridor|undefined}
 */
export function getCorridorById(id) {
  return JK_CORRIDORS.find((c) => c.id === id);
}

/**
 * Search corridors by name or stop name
 * @param {string} query
 * @returns {TransitCorridor[]}
 */
export function searchCorridors(query) {
  if (!query || !query.trim()) return JK_CORRIDORS;
  const q = query.trim().toLowerCase();
  return JK_CORRIDORS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.stages.some((s) => s.stopName.toLowerCase().includes(q)) ||
      c.highway.toLowerCase().includes(q)
  );
}

/**
 * Get fare between two stops on a corridor
 * @param {TransitCorridor} corridor
 * @param {string} fromStopId
 * @param {string} toStopId
 * @returns {{ fare: number, distanceKm: number }|null}
 */
export function getStageFare(corridor, fromStopId, toStopId) {
  const fromStage = corridor.stages.find((s) => s.stopId === fromStopId);
  const toStage = corridor.stages.find((s) => s.stopId === toStopId);
  if (!fromStage || !toStage) return null;
  const distanceKm = Math.abs(toStage.kmFromSource - fromStage.kmFromSource);
  const fare = Math.abs(toStage.statutoryFare - fromStage.statutoryFare);
  return { fare: Math.max(10, fare), distanceKm };
}

/** Map occupancy tier to display label */
export const OCCUPANCY_LABELS = {
  low: "Seats Available",
  moderate: "Filling Fast",
  high: "High Rush",
};

/** Map occupancy tier to hex color */
export const OCCUPANCY_COLORS = {
  low: "#16a34a",
  moderate: "#d97706",
  high: "#dc2626",
};
