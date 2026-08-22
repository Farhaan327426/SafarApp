/**
 * SAFAR — Core Shared Constants & Fallback Objects
 */

export const VEHICLE_CAPACITIES = {
  MINI_BUS: 22,
  BIG_BUS: 42,
  TATA_MAGIC: 7,
  SHARED_VAN: 8,
  E_RICKSHAW: 4,
  E_AUTO: 3,
  PETROL_AUTO: 3,
  TAXI_MAXI_CAB_BASE: 7,
  TAXI_MEDIUM_TOURIST: 4,
  TAXI_PREMIUM_TOURIST: 4
};

export const GPS_STATES = {
  UNAVAILABLE: "GPS Unavailable",
  PERMISSION_REQUIRED: "Permission Required",
  CONNECTING: "Connecting...",
  BROADCASTING: "Broadcasting Active",
  INTERRUPTED: "Signal Interrupted",
  STOPPED: "GPS Idle"
};

export const DUTY_STATES = {
  OFF_DUTY: "Off Duty",
  STARTING: "Starting Shift",
  ON_DUTY: "On Duty",
  ENDING: "Ending Shift"
};

export const MINIMAL_FALLBACK_MINDMAP = {
  id: "root",
  title: "Shared Mobility Platform Blueprint",
  category: "Root Architecture",
  description: "Master system architecture for SAFAR — powering intelligent, regulated, and accessible transit across Jammu & Kashmir.",
  actionText: "Explore Commuter Services",
  actionTab: "commuter",
  children: [
    {
      id: "matching-optimization",
      title: "Matching & Optimization",
      category: "Fleet Operations",
      description: "Algorithms and workflows optimizing vehicle scheduling, corridor load balancing, and real-time demand-supply coordination.",
      actionText: "Open Route & Live Map",
      actionTab: "commuter",
      children: [
        {
          id: "route-allocation",
          title: "Dynamic Dispatch & Corridor Allocation",
          category: "Matching",
          description: "Intelligent assignment of stage carriages to high-density corridors.",
          actionText: "View Corridors",
          actionTab: "commuter"
        }
      ]
    },
    {
      id: "safety-trust",
      title: "Safety & Trust",
      category: "Passenger Security",
      description: "Protocols, emergency response pipelines, and verification mechanisms safeguarding commuters, drivers, and conductors.",
      actionText: "Test Emergency SOS",
      actionTab: "sos",
      children: [
        {
          id: "emergency-sos",
          title: "Instant Emergency SOS & Geo-Dispatch",
          category: "Safety",
          description: "Direct real-time telemetry dispatch to Police PCR 112 and Regional Transport Authority.",
          actionText: "Trigger SOS Protocol",
          actionTab: "sos"
        }
      ]
    },
    {
      id: "financial-pricing",
      title: "Financial & Pricing Models",
      category: "Fare Economics",
      description: "Transparent, regulated fare computation engines and offline revenue reconciliation pipelines.",
      actionText: "Calculate Regulated Fare",
      actionTab: "commuter",
      children: [
        {
          id: "regulated-slabs",
          title: "Distance Slab Schedule (SRO-97 / MVD)",
          category: "Pricing",
          description: "Official statutory distance tiers: 0–3km (₹9), 3–5km (₹14), 5–10km (₹17), 10–15km (₹20), 15–20km (₹26).",
          actionText: "View Official Slabs",
          actionTab: "commuter"
        }
      ]
    },
    {
      id: "engagement-incentives",
      title: "Engagement & Incentives",
      category: "User Experience",
      description: "Concessions, loyalty programs, and gamified dispatch incentives promoting public transit adoption.",
      actionText: "Ask AI about Discounts",
      actionTab: "ai",
      children: [
        {
          id: "student-concessions",
          title: "Student & Senior Concession Mandates",
          category: "Incentives",
          description: "Automatic 50% discount enforcement for students with valid institutional photo IDs.",
          actionText: "Verify Concessions with AI",
          actionTab: "ai"
        }
      ]
    },
    {
      id: "regulatory-legal",
      title: "Regulatory & Legal",
      category: "Transport Governance",
      description: "Regulatory compliance, dispute resolution frameworks, anti-overcharging safeguards, and green transit mandates.",
      actionText: "Review Compliance Rules",
      actionTab: "ai",
      children: [
        {
          id: "overcharge-redressal",
          title: "Overcharging Redressal & Anti-Grievance",
          category: "Regulatory",
          description: "Direct passenger-facing official fare validation display to eliminate unauthorized surcharges.",
          actionText: "Resolve Fare Disputes",
          actionTab: "commuter"
        }
      ]
    }
  ]
};
