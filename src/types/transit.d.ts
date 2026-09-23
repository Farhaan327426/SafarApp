/**
 * SAFAR — J&K Smart Transit & Legal Fare Guide
 * Canonical TypeScript Definitions for Transit, Tariffs, and State Machines
 * Grounded in S.O. 126 dated 29 April 2026 modifying SRO-97 dated 19 March 2021.
 */

export type VehicleId =
  | 'e-rickshaw'
  | 'e-auto'
  | 'auto'
  | 'tata-magic'
  | 'mini-bus'
  | 'private-bus'
  | 'shared-cab'
  | 'taxi-sedan'
  | 'taxi-suv'
  | 'force-traveler'
  | 'vikram-tempo';

export type RegulatoryTariffClassId =
  | 'ELECTRIC_FEEDER_FIXED'
  | 'ELECTRIC_AUTO_STAGE'
  | 'PETROL_AUTO'
  | 'TATA_MAGIC'
  | 'MEDIUM_MINI_BUS'
  | 'BIG_BUS'
  | 'MAXI_CAB_BASE'
  | 'MOTOR_CAB_BASE'
  | 'MAXI_CAB_MEDIUM_TOURIST'
  | 'MAXI_CAB_PREMIUM_TOURIST';

export type StatutoryTerrainRegion =
  | 'kashmir-plain'
  | 'kashmir-hill'
  | 'jammu-plain'
  | 'jammu-hill';

export type TerrainType = 'plain' | 'hilly';

export type FareCalculation =
  | { calculationType: 'PER_KM'; perKm: number }
  | { calculationType: 'FIRST_KM_PLUS_SUBSEQUENT'; firstKm: number; subsequentKm: number }
  | { calculationType: 'BASE_PLUS_PER_KM'; baseFare: number; perKm: number }
  | { calculationType: 'MIN_PLUS_PER_KM'; minFare: number; perKm: number }
  | { calculationType: 'TERRAIN_RATE'; minFare: number; ratesByTerrain: Record<StatutoryTerrainRegion, number> };

export interface TariffDerivation {
  legalBasis: string;
  baseline: string | null;
  adjustment: string;
  absoluteRateSource: string;
}

export interface TariffEntryProvenance {
  calculationBasis: string;
  sourceReference: string;
  baselineSource: string | null;
  absoluteFareSource: string;
}

export type TariffEntry = FareCalculation & {
  currency: 'INR';
  notes?: string;
  derivation: TariffDerivation;
  provenance?: TariffEntryProvenance;
};

export interface ProvenanceMetadata {
  sourceReference: string;
  baselineSource: string;
  evStatutoryClause: string;
  nonEvRevisionBasis: string;
  issuingAuthority: string;
}

export interface TariffSchedule {
  schemaVersion: string;
  activeScheduleId: string;
  publishedDate: string;
  publishedAt: string;
  effectiveFrom: string;
  validUntil: string | null;
  amendmentSequence: number;
  checksum: string;
  provenanceMetadata: ProvenanceMetadata;
  tariffs: Record<VehicleId, TariffEntry>;
}

export type NetworkCondition = 'ONLINE' | 'OFFLINE' | 'UNREACHABLE';

export type DataFreshness = 'CACHE_FRESH' | 'CACHE_STALE' | 'NO_DATA';

export type FareState =
  | 'SELECT_ROUTE'
  | 'CALCULATING'
  | 'FARE_AVAILABLE'
  | 'TARIFF_UNAVAILABLE'
  | 'ROUTE_UNRESOLVED'
  | 'RESTRICTED';

export type EligibilityReasonCode =
  | 'OK'
  | 'DISALLOW_HAZARDOUS'
  | 'DISALLOW_INTERDISTRICT'
  | 'DISALLOW_HIGHWAY'
  | 'EXCEED_MAX_DISTANCE'
  | 'OUTSIDE_OPERATING_ZONE'
  | 'PORTAL_RESTRICTED';

export interface VehicleProvenance {
  fareSource: string;
  permitSource: string;
  operatingZoneSource: string;
  portalRestrictionSource: string;
  verifiedAt: string;
  notes?: string;
}

declare module '*.css';

export interface OperationalZone {
  maxDistanceKm: number;
  divisions: ('Kashmir' | 'Jammu' | 'both')[];
  restrictedPortals?: string[];
  terrainSuitability: TerrainType[];
}

export interface VehicleOption {
  id: VehicleId;
  name: string;
  category: 'urban' | 'rural' | 'suburban' | 'regional' | 'intercity';
  capacity: number;
  regulatoryTariffClassId: RegulatoryTariffClassId;
  operationalZone: OperationalZone;
  provenance: VehicleProvenance;
}

export interface CorridorStage {
  stopId: string;
  stopName: string;
  kmFromSource: number;
}

export interface Corridor {
  id: string;
  name: string;
  origin: string;
  destination: string;
  division: 'Kashmir' | 'Jammu' | 'both';
  terrain: string;
  tariffTerrain: StatutoryTerrainRegion;
  roadNetworkDistance: number;
  stages: CorridorStage[];
}

export interface SyncState {
  networkCondition: NetworkCondition;
  dataFreshness: DataFreshness;
  lastSyncedAt: number | null;
  activeScheduleId: string | null;
  tariffs: Record<VehicleId, TariffEntry> | null;
  error: string | null;
}
