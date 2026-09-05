/**
 * SafarApp - Evidence Locker & Grievance Dispatch (evidence-locker.js)
 */

const SafarEvidenceLocker = (() => {
  const ENDPOINTS = {
    TRAFFIC_POLICE_WHATSAPP: "919419035000",
    RTO_KASHMIR_EMAIL: "rto-kashmir@jk.gov.in",
    RTO_JAMMU_EMAIL: "rto-jammu@jk.gov.in"
  };

  const VIOLATION_CODES = {
    OVERCHARGING: {
      section: "Section 192A / SRO-97, Motor Vehicles Act 1988",
      title: "Fare Gouging & Unauthorized Tariff Demand",
      fine: "Up to ₹10,000 fine / Permit Cancellation"
    },
    OVERCROWDING: {
      section: "Section 194A, Motor Vehicles Act 1988",
      title: "Illegal Overcrowding & Passenger Footboard Endangerment",
      fine: "₹20,000 + ₹2,000 per excess passenger carried"
    },
    REFUSAL_TO_PLY: {
      section: "Section 179, Motor Vehicles Act 1988",
      title: "Refusal to Ply / Unauthorized Route Abandonment",
      fine: "₹5,000 fine on permit holder"
    }
  };

  function buildGrievanceDossier(data) {
    const violation = VIOLATION_CODES[data.violationType] || VIOLATION_CODES.OVERCHARGING;
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const reportBody = 
`OFFICIAL COMPLAINT: PUBLIC TRANSPORT VIOLATION
Date & Time: ${timestamp}
Location / Stand: ${data.location || "On Route"}
Vehicle Registration No: ${(data.vehiclePlate || "UNREG").toUpperCase()}

VIOLATION DETAILS:
- Offense: ${violation.title}
- Statutory Provision: ${violation.section}
- Legal Penalty Applicable: ${violation.fine}
- Demanded / Overcharged Amount: ${data.demandedAmount ? `₹${data.demandedAmount} (Legal Tariff: ₹${data.legalAmount})` : 'N/A'}

FACTUAL STATEMENT:
The driver/operator of vehicle ${(data.vehiclePlate || "UNREG").toUpperCase()} engaged in clear statutory non-compliance. Passenger rights under J&K Transport Department gazetted tariffs were willfully bypassed. Immediate inspection and action under MVA rules requested.

Filed via SafarApp Public Commuter Defense Layer.`;

    return {
      subject: `Transport Violation Report: ${(data.vehiclePlate || "UNREG").toUpperCase()} - ${violation.title}`,
      body: reportBody,
      timestamp,
      violation
    };
  }

  function dispatchWhatsApp(dossier) {
    const encoded = encodeURIComponent(dossier.body);
    const url = `https://wa.me/${ENDPOINTS.TRAFFIC_POLICE_WHATSAPP}?text=${encoded}`;
    window.open(url, "_blank");
  }

  function dispatchEmail(dossier, region = "kashmir") {
    const targetEmail = region === "jammu" ? ENDPOINTS.RTO_JAMMU_EMAIL : ENDPOINTS.RTO_KASHMIR_EMAIL;
    const url = `mailto:${targetEmail}?subject=${encodeURIComponent(dossier.subject)}&body=${encodeURIComponent(dossier.body)}`;
    window.location.href = url;
  }

  return {
    ENDPOINTS,
    VIOLATION_CODES,
    buildGrievanceDossier,
    dispatchWhatsApp,
    dispatchEmail
  };
})();

// Attach to global scope
if (typeof window !== "undefined") {
  window.SafarEvidenceLocker = SafarEvidenceLocker;
}
if (typeof globalThis !== "undefined") {
  globalThis.SafarEvidenceLocker = SafarEvidenceLocker;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = SafarEvidenceLocker;
}
