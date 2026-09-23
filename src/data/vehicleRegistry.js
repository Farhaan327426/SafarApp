/**
 * SAFAR — J&K Smart Transit & Legal Fare Guide
 * Canonical 11-Vehicle Registry with S.O. 126 Regulatory Tariff Class Mapping
 * and Field-Specific Provenance Metadata.
 */

/** @type {import('../types/transit').VehicleProvenance} */
const STANDARD_PROVENANCE = {
  fareSource: "S.O. 126 of 2026",
  permitSource: "Motor Vehicles Act 1988 & J&K Motor Vehicle Rules",
  operatingZoneSource: "RTA Srinagar / Jammu Operational Guidelines",
  portalRestrictionSource: "Traffic Police J&K Advisory & NH-44 SOP",
  verifiedAt: "2026-04-29"
};

/** @type {Record<import('../types/transit').VehicleId, import('../types/transit').VehicleOption>} */
export const VEHICLE_REGISTRY = {
  'e-rickshaw': {
    id: 'e-rickshaw',
    name: 'E-Rickshaw',
    category: 'urban',
    capacity: 4,
    regulatoryTariffClassId: 'ELECTRIC_FEEDER_FIXED',
    operationalZone: {
      maxDistanceKm: 10,
      divisions: ['Kashmir', 'Jammu'],
      restrictedPortals: ['Mughal Road', 'Sinthan Top', 'NH-44 Tunnel'],
      terrainSuitability: ['plain']
    },
    provenance: {
      ...STANDARD_PROVENANCE,
      fareSource: "S.O. 126 of 2026 (Fixed at ₹15/km)"
    }
  },
  'e-auto': {
    id: 'e-auto',
    name: 'E-Auto Rickshaw',
    category: 'urban',
    capacity: 3,
    regulatoryTariffClassId: 'ELECTRIC_AUTO_STAGE',
    operationalZone: {
      maxDistanceKm: 25,
      divisions: ['Kashmir', 'Jammu'],
      restrictedPortals: ['Mughal Road', 'Sinthan Top'],
      terrainSuitability: ['plain']
    },
    provenance: {
      ...STANDARD_PROVENANCE,
      fareSource: "S.O. 126 of 2026 (₹25 1st km + ₹20 sub km)"
    }
  },
  'auto': {
    id: 'auto',
    name: 'Auto Rickshaw (Petrol)',
    category: 'urban',
    capacity: 3,
    regulatoryTariffClassId: 'PETROL_AUTO',
    operationalZone: {
      maxDistanceKm: 35,
      divisions: ['Kashmir', 'Jammu'],
      restrictedPortals: ['Mughal Road', 'Sinthan Top'],
      terrainSuitability: ['plain', 'hilly']
    },
    provenance: STANDARD_PROVENANCE
  },
  'tata-magic': {
    id: 'tata-magic',
    name: 'Tata Magic / Feeder Van',
    category: 'rural',
    capacity: 7,
    regulatoryTariffClassId: 'TATA_MAGIC',
    operationalZone: {
      maxDistanceKm: 45,
      divisions: ['Kashmir', 'Jammu'],
      terrainSuitability: ['plain', 'hilly']
    },
    provenance: STANDARD_PROVENANCE
  },
  'mini-bus': {
    id: 'mini-bus',
    name: 'Mini-Bus (Matador)',
    category: 'suburban',
    capacity: 22,
    regulatoryTariffClassId: 'MEDIUM_MINI_BUS',
    operationalZone: {
      maxDistanceKm: 60,
      divisions: ['Kashmir', 'Jammu'],
      terrainSuitability: ['plain', 'hilly']
    },
    provenance: STANDARD_PROVENANCE
  },
  'private-bus': {
    id: 'private-bus',
    name: 'Big Passenger Bus',
    category: 'regional',
    capacity: 45,
    regulatoryTariffClassId: 'BIG_BUS',
    operationalZone: {
      maxDistanceKm: 350,
      divisions: ['Kashmir', 'Jammu', 'both'],
      terrainSuitability: ['plain', 'hilly']
    },
    provenance: STANDARD_PROVENANCE
  },
  'shared-cab': {
    id: 'shared-cab',
    name: 'Shared Cab (Sumo / Bolero)',
    category: 'regional',
    capacity: 8,
    regulatoryTariffClassId: 'MAXI_CAB_BASE',
    operationalZone: {
      maxDistanceKm: 300,
      divisions: ['Kashmir', 'Jammu', 'both'],
      terrainSuitability: ['plain', 'hilly']
    },
    provenance: STANDARD_PROVENANCE
  },
  'taxi-sedan': {
    id: 'taxi-sedan',
    name: 'Contract Taxi (Base Model / Sedan)',
    category: 'intercity',
    capacity: 4,
    regulatoryTariffClassId: 'MOTOR_CAB_BASE',
    operationalZone: {
      maxDistanceKm: 400,
      divisions: ['Kashmir', 'Jammu', 'both'],
      terrainSuitability: ['plain', 'hilly']
    },
    provenance: {
      ...STANDARD_PROVENANCE,
      notes: "Covers Indica/Swift/Dzire/Winger base motor cab class per S.O. 126"
    }
  },
  'taxi-suv': {
    id: 'taxi-suv',
    name: 'Premium Tourist Taxi (SUV)',
    category: 'intercity',
    capacity: 6,
    regulatoryTariffClassId: 'MAXI_CAB_PREMIUM_TOURIST',
    operationalZone: {
      maxDistanceKm: 500,
      divisions: ['Kashmir', 'Jammu', 'both'],
      terrainSuitability: ['plain', 'hilly']
    },
    provenance: {
      ...STANDARD_PROVENANCE,
      notes: "Covers Innova/Fortuner premium tourist class; medium tourist class (Scorpio/Xylo) maps to MAXI_CAB_MEDIUM_TOURIST"
    }
  },
  'force-traveler': {
    id: 'force-traveler',
    name: 'Tempo / Force Traveler',
    category: 'regional',
    capacity: 13,
    regulatoryTariffClassId: 'MAXI_CAB_BASE',
    operationalZone: {
      maxDistanceKm: 350,
      divisions: ['Kashmir', 'Jammu', 'both'],
      terrainSuitability: ['plain', 'hilly']
    },
    provenance: {
      ...STANDARD_PROVENANCE,
      notes: "Tempo Traveller explicitly classified under Base-model Taxi/Maxi Cab category in S.O. 126"
    }
  },
  'vikram-tempo': {
    id: 'vikram-tempo',
    name: 'Vikram Tempo',
    category: 'suburban',
    capacity: 6,
    regulatoryTariffClassId: 'TATA_MAGIC',
    operationalZone: {
      maxDistanceKm: 30,
      divisions: ['Kashmir', 'Jammu'],
      terrainSuitability: ['plain']
    },
    provenance: STANDARD_PROVENANCE
  }
};

/**
 * Get all registered vehicles as a list.
 * @returns {import('../types/transit').VehicleOption[]}
 */
export function getAllVehicles() {
  return Object.values(VEHICLE_REGISTRY);
}

/**
 * Get vehicle by ID.
 * @param {string} id
 * @returns {import('../types/transit').VehicleOption | null}
 */
export function getVehicleById(id) {
  return VEHICLE_REGISTRY[/** @type {import('../types/transit').VehicleId} */ (id)] || null;
}
