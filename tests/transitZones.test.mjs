import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  VEHICLE_OPERATIONAL_ZONES,
  resolveRouteProfile,
  filterEligibleVehicles,
} from "../src/data/transitZones.js";

// Mock vehicle catalog matching vehicleOptions structure
const mockVehicles = Object.entries(VEHICLE_OPERATIONAL_ZONES).map(([key, def]) => ({
  key,
  id: def.id,
  name: def.name,
  operationalZone: def.operationalZone,
}));

describe("SAFAR Statutory Vehicle Operational Zones & Corridor Profiles", () => {
  test("Scenario A: Jammu Intracity (Jammu Tawi Station -> Gandhi Nagar)", () => {
    const profile = resolveRouteProfile("Jammu Tawi Station", "Gandhi Nagar (Jammu)");

    assert.equal(profile.region, "jammu", "Region must be jammu");
    assert.equal(profile.routeType, "intracity", "RouteType must be intracity (same district)");
    assert.deepEqual(profile.districts, ["jammu"], "Districts must be ['jammu']");

    const eligible = filterEligibleVehicles(mockVehicles, profile).map((v) => v.key);

    // Eligible vehicles under truth table (7 vehicles)
    assert.ok(eligible.includes("vikram-tempo"), "Vikram / Safa Urban must be eligible in Jammu Intracity");
    assert.ok(eligible.includes("auto"), "Auto Rickshaw must be eligible in Jammu Intracity");
    assert.ok(eligible.includes("e-auto"), "E-Auto must be eligible in Jammu Intracity");
    assert.ok(eligible.includes("e-rickshaw"), "E-Rickshaw must be eligible in Jammu Intracity");
    assert.ok(eligible.includes("taxi"), "Private Taxi (Sedan) must be eligible in Jammu Intracity");
    assert.ok(eligible.includes("suv-taxi"), "Private Taxi (SUV) must be eligible in Jammu Intracity");
    assert.ok(eligible.includes("force-traveler"), "Force Traveler must be eligible in Jammu Intracity");
    assert.equal(eligible.length, 7, "Exactly 7 vehicles must be eligible in Jammu Intracity");

    // Silently excluded vehicles
    assert.ok(!eligible.includes("shared-cab"), "Shared Cab must be silently excluded from Jammu Intracity");
    assert.ok(!eligible.includes("mini-bus"), "Matador / Mini Bus must be silently excluded from Jammu Intracity");
    assert.ok(!eligible.includes("private-bus"), "Private Bus must be silently excluded from Jammu Intracity");
    assert.ok(!eligible.includes("tata-magic"), "Tata Magic must be silently excluded from Jammu Intracity");
  });

  test("Scenario B: Srinagar Intracity (Lal Chowk -> Dal Lake)", () => {
    const profile = resolveRouteProfile("Lal Chowk", "Dal Lake (Dalgate)");

    assert.equal(profile.region, "kashmir", "Region must be kashmir");
    assert.equal(profile.routeType, "intracity", "RouteType must be intracity (same district)");
    assert.deepEqual(profile.districts, ["srinagar"], "Districts must be ['srinagar']");

    const eligible = filterEligibleVehicles(mockVehicles, profile).map((v) => v.key);

    // Eligible vehicles under truth table (6 vehicles)
    assert.ok(eligible.includes("auto"), "Auto Rickshaw must be eligible in Srinagar Intracity");
    assert.ok(eligible.includes("e-auto"), "E-Auto must be eligible in Srinagar Intracity");
    assert.ok(eligible.includes("e-rickshaw"), "E-Rickshaw must be eligible in Srinagar Intracity");
    assert.ok(eligible.includes("taxi"), "Private Taxi (Sedan) must be eligible in Srinagar Intracity");
    assert.ok(eligible.includes("suv-taxi"), "Private Taxi (SUV) must be eligible in Srinagar Intracity");
    assert.ok(eligible.includes("force-traveler"), "Force Traveler must be eligible in Srinagar Intracity");
    assert.equal(eligible.length, 6, "Exactly 6 vehicles must be eligible in Srinagar Intracity");

    // Silently excluded vehicles
    assert.ok(!eligible.includes("vikram-tempo"), "Vikram must be silently excluded from Srinagar");
    assert.ok(!eligible.includes("shared-cab"), "Shared Cab must be silently excluded from Srinagar Intracity");
    assert.ok(!eligible.includes("mini-bus"), "Mini Bus must be silently excluded from Srinagar Intracity");
    assert.ok(!eligible.includes("private-bus"), "Private Bus must be silently excluded from Srinagar Intracity");
    assert.ok(!eligible.includes("tata-magic"), "Tata Magic must be silently excluded from Srinagar Intracity (Option A)");
  });

  test("Scenario C: Kashmir Intercity (Srinagar -> Baramulla) including Force Traveler", () => {
    const profile = resolveRouteProfile("Srinagar", "Baramulla");

    assert.equal(profile.region, "kashmir", "Region must be kashmir");
    assert.equal(profile.routeType, "intercity", "RouteType must be intercity (crosses district boundary)");

    const eligible = filterEligibleVehicles(mockVehicles, profile).map((v) => v.key);

    // Explicit assertion for all 7 eligible vehicles including force-traveler (Issue 3)
    assert.ok(eligible.includes("shared-cab"), "Shared Cab must be eligible in Kashmir Intercity");
    assert.ok(eligible.includes("mini-bus"), "Mini Bus must be eligible in Kashmir Intercity");
    assert.ok(eligible.includes("private-bus"), "Private Bus must be eligible in Kashmir Intercity");
    assert.ok(eligible.includes("tata-magic"), "Tata Magic must be eligible in Kashmir Intercity");
    assert.ok(eligible.includes("taxi"), "Standard Taxi must be eligible in Kashmir Intercity");
    assert.ok(eligible.includes("suv-taxi"), "SUV Taxi must be eligible in Kashmir Intercity");
    assert.ok(eligible.includes("force-traveler"), "Force Traveler must be eligible in Kashmir Intercity");
    assert.equal(eligible.length, 7, "Exactly 7 vehicles must be eligible in Kashmir Intercity");

    // Silently excluded vehicles
    assert.ok(!eligible.includes("vikram-tempo"), "Vikram must be silently excluded from Kashmir Intercity");
    assert.ok(!eligible.includes("auto"), "Auto Rickshaw must be silently excluded from Intercity");
    assert.ok(!eligible.includes("e-auto"), "E-Auto must be silently excluded from Intercity");
    assert.ok(!eligible.includes("e-rickshaw"), "E-Rickshaw must be silently excluded from Intercity");
  });

  test("Scenario D: Free-Text Normalization (Sopore Bus Stand -> Srinagar TRC)", () => {
    const profile = resolveRouteProfile("Sopore Bus Stand", "Srinagar TRC");

    assert.equal(profile.region, "kashmir", "Resolved region must be kashmir");
    assert.equal(profile.routeType, "intercity", "Resolved routeType must be intercity");
    assert.ok(profile.districts.includes("baramulla") && profile.districts.includes("srinagar"), "Districts must resolve to baramulla and srinagar");

    const eligible = filterEligibleVehicles(mockVehicles, profile).map((v) => v.key);
    assert.ok(!eligible.includes("vikram-tempo"), "Vikram must be excluded from Sopore-Srinagar");
    assert.ok(eligible.includes("shared-cab"), "Shared Cab must be eligible for Sopore-Srinagar");
  });

  test("Scenario E: Border Portal Cross-Division Override Preserves 'both' (Issue 4)", () => {
    // 1. Without override: Banihal triggers ambiguity prompt
    const profileUnconfirmed = resolveRouteProfile("Banihal", "Qazigund");
    assert.equal(profileUnconfirmed.isAmbiguous, true, "Banihal portal must trigger isAmbiguous: true");
    assert.equal(profileUnconfirmed.region, "both", "Banihal (Ramban) to Qazigund (Kulgam) cross-division must be 'both'");

    // 2. With override: Override clears isAmbiguous but preserves region: 'both' because endpoints are canonically in different divisions
    const profileConfirmed = resolveRouteProfile("Banihal", "Qazigund", false, null, "kashmir");
    assert.equal(profileConfirmed.isAmbiguous, false, "Override must clear isAmbiguous");
    assert.equal(profileConfirmed.region, "both", "Cross-division route must remain 'both' even when user selects override");

    // Vehicle eligibility for cross-division corridor
    const eligible = filterEligibleVehicles(mockVehicles, profileConfirmed).map((v) => v.key);
    assert.ok(eligible.includes("shared-cab"), "Shared Cab must be eligible on cross-division corridor");
    assert.ok(!eligible.includes("vikram-tempo"), "Vikram must be excluded from cross-division corridor");
    assert.ok(!eligible.includes("auto"), "Auto Rickshaw must be excluded from cross-division corridor");
  });

  test("Scenario F: Secondary Fallback (Zero Eligible Simulation)", () => {
    const impossibleProfile = {
      origin: "A",
      destination: "B",
      region: "invalid-region",
      routeType: "invalid-type",
      districts: ["none"],
    };

    const eligible = filterEligibleVehicles(mockVehicles, impossibleProfile);
    assert.equal(eligible.length, 0, "Must return zero vehicles for invalid profile");
  });

  test("Scenario G: Direct Cross-Division Intercity Corridor (Jammu -> Srinagar) (Gap 2)", () => {
    const profile = resolveRouteProfile("Jammu", "Srinagar");

    assert.equal(profile.region, "both", "Region must be 'both' for direct cross-division corridor");
    assert.equal(profile.routeType, "intercity", "RouteType must be 'intercity' across district boundaries");
    assert.equal(profile.isAmbiguous, false, "Direct highway endpoints without border portals must not be ambiguous");
    assert.deepEqual(profile.districts.sort(), ["jammu", "srinagar"].sort(), "Districts must be jammu and srinagar");

    const eligible = filterEligibleVehicles(mockVehicles, profile).map((v) => v.key);

    // Eligible vehicles under truth table for cross-division intercity (7 vehicles)
    assert.ok(eligible.includes("shared-cab"), "Shared Cab (Sumo/Tavera) must be eligible on Jammu-Srinagar corridor");
    assert.ok(eligible.includes("mini-bus"), "Matador / Mini Bus must be eligible on Jammu-Srinagar corridor");
    assert.ok(eligible.includes("private-bus"), "Private Bus must be eligible on Jammu-Srinagar corridor");
    assert.ok(eligible.includes("tata-magic"), "Tata Magic must be eligible on Jammu-Srinagar corridor");
    assert.ok(eligible.includes("taxi"), "Private Taxi (Sedan) must be eligible on Jammu-Srinagar corridor");
    assert.ok(eligible.includes("suv-taxi"), "Private Taxi (SUV) must be eligible on Jammu-Srinagar corridor");
    assert.ok(eligible.includes("force-traveler"), "Force Traveler must be eligible on Jammu-Srinagar corridor");
    assert.equal(eligible.length, 7, "Exactly 7 vehicle categories must be eligible on Jammu-Srinagar highway");

    // Silently excluded vehicles (4 vehicles)
    assert.ok(!eligible.includes("vikram-tempo"), "Vikram must be excluded from Jammu-Srinagar corridor");
    assert.ok(!eligible.includes("auto"), "Auto Rickshaw must be excluded from cross-division highway");
    assert.ok(!eligible.includes("e-auto"), "E-Auto must be excluded from cross-division highway");
    assert.ok(!eligible.includes("e-rickshaw"), "E-Rickshaw must be excluded from cross-division highway");
  });
});
