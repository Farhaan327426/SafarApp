/**
 * SafarApp — Evidence Locker & Grievance Engine
 * Modules: Evidence Capture (photo, GPS, plate) · Legal Complaint Formatter
 *          · MVA Penalty Code Mapper · Direct Dispatch (WhatsApp · Email · SMS · Clipboard)
 *          · Backward-Compatibility for Safar Commuter Defense Layer
 *
 * Storage: IndexedDB primary, localStorage fallback.
 * All complaint text generation is offline-capable.
 */

'use strict';

// ─── Dispatch Endpoints ───────────────────────────────────────────────────────

const DISPATCH = Object.freeze({
  TRAFFIC_WHATSAPP: '+919419035000',
  RTO_KASHMIR_EMAIL: 'rto-kashmir@jk.gov.in',
  RTO_JAMMU_EMAIL:   'rto-jammu@jk.gov.in',
  HELPLINE_SMS:      '1800-180-0001',
});

// Backward-compatibility endpoints map
const ENDPOINTS = Object.freeze({
  TRAFFIC_POLICE_WHATSAPP: "919419035000",
  RTO_KASHMIR_EMAIL: "rto-kashmir@jk.gov.in",
  RTO_JAMMU_EMAIL: "rto-jammu@jk.gov.in"
});

// ─── MVA Penal Code Map ───────────────────────────────────────────────────────

const MVA_SECTIONS = Object.freeze({
  '192A': {
    title: 'Using Vehicle Without Permit / Fare Violation',
    penalty: 'First offence: ₹10,000 fine. Subsequent: ₹10,000 + permit cancellation.',
    trigger: 'FARE_GOUGE',
  },
  '194A': {
    title: 'Carrying Excess Passengers (Overloading)',
    penalty: '₹20,000 minimum OR ₹2,000 per passenger in excess of permitted capacity.',
    trigger: 'OVERLOAD',
  },
  '177': {
    title: 'General Contravention of Motor Vehicles Act',
    penalty: 'First offence: ₹500. Subsequent: ₹1,500.',
    trigger: 'GENERAL',
  },
  '179': {
    title: 'Disobedience of Orders / Route Abandonment',
    penalty: '₹2,000 fine. Authority empowered: Traffic Police / RTO.',
    trigger: 'ROUTE_ABANDON',
  },
  '183': {
    title: 'Driving at Excessive Speed',
    penalty: '₹1,000–₹2,000. Repeated offence: licence suspension.',
    trigger: 'RASH_DRIVING',
  },
});

// Backward-compatibility violation codes
const VIOLATION_CODES = Object.freeze({
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
});

// ─── Evidence Store ───────────────────────────────────────────────────────────

let _evidenceStore = [];

function _persistEvidence() {
  try {
    const serializable = _evidenceStore.map(rec => ({
      ...rec,
      photoDataUrls: (rec.photoDataUrls || []).map((_, i) => `[photo_${i + 1}_omitted]`),
    }));
    localStorage.setItem('safar_evidence_meta', JSON.stringify(serializable));
  } catch (_) {}
}

function _hydrateEvidence() {
  try {
    const raw = localStorage.getItem('safar_evidence_meta');
    if (raw) {
      const meta = JSON.parse(raw);
      _evidenceStore = meta.map(m => ({ ...m, photoDataUrls: [] }));
    }
  } catch (_) {}
}

_hydrateEvidence();

// ─── GPS Acquisition ──────────────────────────────────────────────────────────

function acquireGPS(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported on this device.'));
      return;
    }
    const timer = setTimeout(() => reject(new Error('GPS timeout — location unavailable.')), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(timer);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: new Date().toISOString(),
        });
      },
      err => {
        clearTimeout(timer);
        reject(new Error(`GPS error: ${err.message}`));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
    );
  });
}

// ─── Photo Capture ────────────────────────────────────────────────────────────

function capturePhoto() {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document unavailable'));
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No photo selected.')); return; }

      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Photo read error.'));
      reader.readAsDataURL(file);
    };

    input.oncancel = () => reject(new Error('Photo capture cancelled.'));
    input.click();
  });
}

// ─── Evidence Record Management ───────────────────────────────────────────────

function createEvidence({ regNo, routeId, hubKey, statement, violationType, dispute } = {}) {
  const mvaSections = resolveMVASections(violationType, dispute);

  const record = {
    id: `EV-${Date.now()}`,
    regNo: regNo ? regNo.toUpperCase().trim() : null,
    routeId: routeId || null,
    hubKey:  hubKey  || null,
    gps:     null,
    photoDataUrls: [],
    statement: statement || '',
    violationType: violationType || 'GENERAL',
    mvaSections,
    dispute: dispute || null,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    dispatchedAt: null,
    dispatchChannels: [],
  };

  _evidenceStore.unshift(record);
  _persistEvidence();
  return record;
}

function getEvidence(id) {
  return _evidenceStore.find(r => r.id === id) || null;
}

function getAllEvidence() {
  return [..._evidenceStore];
}

function updateEvidence(id, patch) {
  const idx = _evidenceStore.findIndex(r => r.id === id);
  if (idx === -1) return null;
  _evidenceStore[idx] = { ..._evidenceStore[idx], ...patch };
  _persistEvidence();
  return _evidenceStore[idx];
}

async function attachGPS(id) {
  const gps = await acquireGPS();
  return updateEvidence(id, { gps });
}

async function attachPhoto(id) {
  const dataUrl = await capturePhoto();
  const rec = getEvidence(id);
  if (!rec) throw new Error(`Evidence record ${id} not found.`);
  rec.photoDataUrls.push(dataUrl);
  _persistEvidence();
  return dataUrl;
}

// ─── MVA Section Resolver ─────────────────────────────────────────────────────

function resolveMVASections(violationType, dispute) {
  const sections = [];

  if (dispute?.isOvercharge) {
    sections.push('192A');
    sections.push('177');
  }
  if (violationType === 'OVERLOAD' || violationType === 'OVERCROWDING') sections.push('194A');
  if (violationType === 'ROUTE_ABANDON' || violationType === 'REFUSAL_TO_PLY') sections.push('179');
  if (violationType === 'RASH_DRIVING')  sections.push('183');
  if (!sections.length)                  sections.push('177');

  return [...new Set(sections)];
}

// ─── Complaint Formatter ──────────────────────────────────────────────────────

function formatComplaint(evidenceId) {
  const rec = getEvidence(evidenceId);
  if (!rec) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const gpsStr = rec.gps
    ? `GPS: ${rec.gps.lat.toFixed(6)}, ${rec.gps.lng.toFixed(6)} (±${Math.round(rec.gps.accuracy)}m)`
    : 'GPS: Location not captured';

  const sectionsList = rec.mvaSections.map(sec => {
    const info = MVA_SECTIONS[sec];
    return info
      ? `  • Section ${sec} — ${info.title}\n    Penalty: ${info.penalty}`
      : `  • Section ${sec}`;
  }).join('\n');

  const fareBlock = rec.dispute ? `
FARE DISCREPANCY DETAIL:
  Official Statutory Fare (SRO-97): ₹${rec.dispute.statutoryFare}
  Amount Demanded by Driver:        ₹${rec.dispute.chargedFare}
  Overcharge Amount:                ₹${rec.dispute.discrepancy}
  Overcharge Percentage:            ${rec.dispute.percentOver}%
` : '';

  const subject = `COMPLAINT — Vehicle ${rec.regNo || '[Reg Not Captured]'} — ${rec.violationType} — ${dateStr}`;

  const body = `
To,
The Regional Transport Officer,
J&K Transport Department

Subject: Formal Complaint Against Vehicle ${rec.regNo || '[Registration Not Captured]'}
         Violation: ${rec.violationType}
         Date: ${dateStr} | Time: ${timeStr}

Respected Sir/Madam,

I, a commuter of J&K, wish to formally register the following complaint against the vehicle/operator detailed below:

VEHICLE DETAILS:
  Registration No.: ${rec.regNo || 'Not captured (see photo evidence)'}
  Route/Location:   ${rec.routeId || rec.hubKey || 'See GPS coordinates below'}
  ${gpsStr}

NATURE OF VIOLATION:
${sectionsList}
${fareBlock}
COMMUTER STATEMENT:
  ${rec.statement || '[Statement not provided]'}

EVIDENCE SUBMITTED:
  • Number of photos attached: ${rec.photoDataUrls ? rec.photoDataUrls.length : 0}
  • GPS timestamp: ${rec.gps?.ts || 'Not available'}
  • Complaint generated by SafarApp (SRO-97 certified system)

I request appropriate action under the Motor Vehicles Act 1988 against the defaulting vehicle/driver.

Reference ID: ${rec.id}
Submitted via SafarApp — Jammu & Kashmir Transit Defense Platform
`.trim();

  const bodyUrdu = `
شکایت — گاڑی ${rec.regNo || '[رجسٹریشن نمبر]'}
تاریخ: ${dateStr} | وقت: ${timeStr}
${rec.gps ? `مقام: ${rec.gps.lat.toFixed(4)}, ${rec.gps.lng.toFixed(4)}` : ''}
${rec.dispute ? `سرکاری کرایہ: ₹${rec.dispute.statutoryFare} | مانگا: ₹${rec.dispute.chargedFare} | زیادہ: ₹${rec.dispute.discrepancy}` : ''}
دفعات: ${rec.mvaSections.map(s => `§${s}`).join(', ')}
بیان: ${rec.statement || '—'}
ID: ${rec.id}
  `.trim();

  const shortSMS = `SafarApp Complaint [${rec.id}] — ${rec.regNo || 'NO-REG'} — ${rec.violationType} — ${dateStr} ${timeStr} — MVA §${rec.mvaSections.join('/')}`;

  return { subject, body, bodyUrdu, shortSMS };
}

// ─── Backward-Compatibility Dossier Builder ───────────────────────────────────

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

// ─── Dispatch Methods (Supports both ID and legacy dossier object) ───────────

function dispatchWhatsApp(target) {
  let bodyText = '';
  let id = null;

  if (typeof target === 'object' && target?.body) {
    bodyText = target.body;
  } else if (typeof target === 'string') {
    id = target;
    const complaint = formatComplaint(id);
    if (complaint) {
      bodyText = `📋 FORMAL COMPLAINT — SafarApp\n\n${complaint.bodyUrdu}\n\n---\nFull complaint ID: ${id}`;
    }
  }

  if (!bodyText) return;

  const phone = DISPATCH.TRAFFIC_WHATSAPP.replace(/\D/g, '');
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(bodyText)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener');
  }

  if (id) {
    updateEvidence(id, {
      dispatchedAt: new Date().toISOString(),
      dispatchChannels: [...(getEvidence(id)?.dispatchChannels || []), 'WHATSAPP'],
      status: 'DISPATCHED',
    });
  }
}

function dispatchEmail(target, region = 'kashmir') {
  let subject = '';
  let body = '';
  let id = null;

  if (typeof target === 'object' && target?.subject) {
    subject = target.subject;
    body = target.body;
  } else if (typeof target === 'string') {
    id = target;
    const rec = getEvidence(id);
    const complaint = formatComplaint(id);
    if (complaint && rec) {
      subject = complaint.subject;
      body = complaint.body;
      const regPrefix = parseInt(rec.regNo?.replace(/[^0-9]/g, '').slice(0, 2) || '0', 10);
      region = regPrefix >= 9 ? 'jammu' : 'kashmir';
    }
  }

  if (!subject || !body) return;

  const toEmail = region === 'jammu' ? DISPATCH.RTO_JAMMU_EMAIL : DISPATCH.RTO_KASHMIR_EMAIL;
  const mailto = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  if (typeof window !== 'undefined') {
    window.location.href = mailto;
  }

  if (id) {
    updateEvidence(id, {
      dispatchedAt: new Date().toISOString(),
      dispatchChannels: [...(getEvidence(id)?.dispatchChannels || []), 'EMAIL'],
      status: 'DISPATCHED',
    });
  }
}

async function dispatchClipboard(evidenceId) {
  const complaint = formatComplaint(evidenceId);
  if (!complaint || typeof navigator === 'undefined') return;

  await navigator.clipboard.writeText(complaint.body);

  updateEvidence(evidenceId, {
    dispatchChannels: [...(getEvidence(evidenceId)?.dispatchChannels || []), 'CLIPBOARD'],
  });

  return true;
}

function dispatchSMS(evidenceId) {
  const complaint = formatComplaint(evidenceId);
  if (!complaint || typeof window === 'undefined') return;

  const smsUri = `sms:${DISPATCH.HELPLINE_SMS}?body=${encodeURIComponent(complaint.shortSMS)}`;
  window.location.href = smsUri;

  updateEvidence(evidenceId, {
    dispatchChannels: [...(getEvidence(evidenceId)?.dispatchChannels || []), 'SMS'],
  });
}

// ─── UI: Evidence Locker Panel ────────────────────────────────────────────────

function renderLockerForm(containerEl, { dispute = null, regNo = '', routeId = '' } = {}) {
  if (!containerEl) return;
  const tempId = `ev-draft-${Date.now()}`;

  containerEl.innerHTML = `
    <div class="locker-form" id="${tempId}">
      <h2 class="locker-form__title">Evidence Locker</h2>

      <div class="form-row">
        <label class="form-label" for="ev-reg">Vehicle Registration</label>
        <input class="form-input" id="ev-reg" type="text" placeholder="JK01 AB 1234"
          value="${regNo}" pattern="JK[0-9]{2}\\s?[A-Z]{1,2}\\s?[0-9]{4}"
          inputmode="text" autocomplete="off" />
      </div>

      <div class="form-row">
        <label class="form-label">Violation Type</label>
        <div class="form-radio-group">
          ${[
            ['FARE_GOUGE',    'Fare Overcharging'],
            ['OVERLOAD',      'Overloading (120%+)'],
            ['ROUTE_ABANDON', 'Route Abandonment'],
            ['RASH_DRIVING',  'Rash Driving'],
            ['GENERAL',       'Other Violation'],
          ].map(([val, label]) => `
            <label class="form-radio">
              <input type="radio" name="ev-vtype" value="${val}"
                ${(dispute && val === 'FARE_GOUGE') || val === 'GENERAL' ? 'checked' : ''}>
              ${label}
            </label>`).join('')}
        </div>
      </div>

      <div class="form-row">
        <label class="form-label" for="ev-stmt">Your Statement</label>
        <textarea class="form-textarea" id="ev-stmt" rows="3"
          placeholder="Describe what happened — date, time, demand made, driver behavior..."
          >${dispute ? `Driver demanded ₹${dispute.chargedFare} on route ${dispute.routeData?.routeKey || ''} (SRO-97 official rate: ₹${dispute.statutoryFare}). Overcharge: ₹${dispute.discrepancy}.` : ''}</textarea>
      </div>

      ${dispute ? `
      <div class="locker-dispute-summary">
        <span class="summary-badge">Linked Dispute: ${dispute.id}</span>
        <span>₹${dispute.chargedFare} demanded vs ₹${dispute.statutoryFare} official</span>
      </div>` : ''}

      <div class="form-row locker-evidence-actions">
        <button class="btn btn--secondary" id="ev-btn-gps">📍 Capture GPS</button>
        <button class="btn btn--secondary" id="ev-btn-photo">📷 Add Photo</button>
        <div class="ev-status" id="ev-status"></div>
      </div>

      <div class="photo-preview" id="ev-photo-preview"></div>

      <div class="form-row locker-dispatch">
        <button class="btn btn--primary" id="ev-btn-save">Seal Evidence Record</button>
      </div>

      <div class="dispatch-panel hidden" id="ev-dispatch">
        <h3 class="dispatch-title">Dispatch Complaint</h3>
        <div class="dispatch-grid">
          <button class="btn btn--whatsapp" id="ev-btn-wa">WhatsApp Traffic Police</button>
          <button class="btn btn--email"    id="ev-btn-email">Email RTO</button>
          <button class="btn btn--sms"      id="ev-btn-sms">SMS Helpline</button>
          <button class="btn btn--clip"     id="ev-btn-clip">Copy Complaint</button>
        </div>
        <div class="complaint-preview" id="ev-complaint-text"></div>
      </div>
    </div>
  `;

  let activeRecord = null;

  const statusEl = containerEl.querySelector('#ev-status');
  const dispatchPanel = containerEl.querySelector('#ev-dispatch');

  function setStatus(msg, type = 'info') {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = `ev-status ev-status--${type}`;
  }

  // GPS capture
  containerEl.querySelector('#ev-btn-gps')?.addEventListener('click', async () => {
    setStatus('Acquiring GPS…', 'info');
    try {
      const gps = await acquireGPS();
      if (activeRecord) await attachGPS(activeRecord.id);
      setStatus(`GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)} (±${Math.round(gps.accuracy)}m)`, 'ok');
    } catch (e) {
      setStatus(e.message, 'error');
    }
  });

  // Photo capture
  containerEl.querySelector('#ev-btn-photo')?.addEventListener('click', async () => {
    try {
      if (!activeRecord) {
        setStatus('Save evidence record first, then add photo.', 'warn');
        return;
      }
      const dataUrl = await attachPhoto(activeRecord.id);
      const preview = containerEl.querySelector('#ev-photo-preview');
      if (preview) {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = 'photo-thumb';
        img.alt = 'Evidence photo';
        preview.appendChild(img);
      }
      setStatus(`Photo ${activeRecord.photoDataUrls.length} attached.`, 'ok');
    } catch (e) {
      setStatus(e.message, 'error');
    }
  });

  // Save / Seal
  containerEl.querySelector('#ev-btn-save')?.addEventListener('click', () => {
    const regNo     = containerEl.querySelector('#ev-reg')?.value.trim() || '';
    const statement = containerEl.querySelector('#ev-stmt')?.value.trim() || '';
    const vtype     = containerEl.querySelector('input[name="ev-vtype"]:checked')?.value || 'GENERAL';

    if (activeRecord) {
      updateEvidence(activeRecord.id, {
        regNo,
        statement,
        violationType: vtype,
        mvaSections: resolveMVASections(vtype, dispute)
      });
    } else {
      activeRecord = createEvidence({
        regNo,
        statement,
        violationType: vtype,
        dispute,
        routeId
      });
    }

    const complaint = formatComplaint(activeRecord.id);
    const complaintTextEl = containerEl.querySelector('#ev-complaint-text');
    if (complaintTextEl && complaint) {
      complaintTextEl.textContent = complaint.body;
    }
    if (dispatchPanel) {
      dispatchPanel.classList.remove('hidden');
    }
    setStatus(`Record sealed: ${activeRecord.id}`, 'ok');
  });

  // Dispatch buttons
  containerEl.querySelector('#ev-btn-wa')?.addEventListener('click', () => {
    if (activeRecord) dispatchWhatsApp(activeRecord.id);
  });
  containerEl.querySelector('#ev-btn-email')?.addEventListener('click', () => {
    if (activeRecord) dispatchEmail(activeRecord.id);
  });
  containerEl.querySelector('#ev-btn-sms')?.addEventListener('click', () => {
    if (activeRecord) dispatchSMS(activeRecord.id);
  });
  containerEl.querySelector('#ev-btn-clip')?.addEventListener('click', async () => {
    if (activeRecord) {
      await dispatchClipboard(activeRecord.id);
      setStatus('Complaint copied to clipboard.', 'ok');
    }
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

const EvidenceLocker = {
  createEvidence,
  getEvidence,
  getAllEvidence,
  updateEvidence,
  attachGPS,
  attachPhoto,
  formatComplaint,
  dispatchWhatsApp,
  dispatchEmail,
  dispatchSMS,
  dispatchClipboard,
  renderLockerForm,
  resolveMVASections,
  MVA_SECTIONS,
  DISPATCH,

  // Backward compatibility
  ENDPOINTS,
  VIOLATION_CODES,
  buildGrievanceDossier,

  openWithDispute(dispute) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('locker-modal');
    const body  = document.getElementById('locker-modal-body');
    if (!modal || !body) return;
    renderLockerForm(body, {
      dispute,
      regNo: '',
      routeId: dispute?.routeData?.routeKey || '',
    });
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  },

  closeModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('locker-modal');
    modal?.classList.add('hidden');
    modal?.setAttribute('aria-hidden', 'true');
  },
};

if (typeof window !== "undefined") {
  window.EvidenceLocker = EvidenceLocker;
  window.SafarEvidenceLocker = EvidenceLocker;
}
if (typeof globalThis !== "undefined") {
  globalThis.EvidenceLocker = EvidenceLocker;
  globalThis.SafarEvidenceLocker = EvidenceLocker;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = EvidenceLocker;
}
