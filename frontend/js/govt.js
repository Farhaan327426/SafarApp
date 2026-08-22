/**
 * Safar Government & Regulatory Enforcement Portal Client Logic
 * Handles Non-Local Permits Registry, Border Post Checkpoints, SRO Notifications,
 * and Law Enforcement Compliance Monitoring.
 */

(function () {
  'use strict';

  // Seed sample permits for offline/direct testing if backend DB is empty
  const SEED_PERMITS = [
    {
      id: 'perm-001',
      permitNumber: 'JK/NLP/2026/PB/1082',
      vehicleRegNumber: 'PB-08-AB-1234',
      operatorName: 'Punjab Roadways / Deluxe Super Express',
      homeState: 'PB',
      vehicleCategory: 'STAGE_CARRIAGE_PERMIT',
      entryBorderPost: 'Lakhanpur',
      inspectionCheckpoint: 'Lakhanpur Barrier Naaka 1',
      corridorDescription: 'Lakhanpur to Srinagar via NH-44',
      validFrom: '2026-08-01T00:00:00Z',
      validUntil: '2026-08-31T23:59:59Z',
      status: 'VERIFIED',
      taxFeePaidAmount: 3500,
      challanNumber: 'JK/CHAL/2026/0891'
    },
    {
      id: 'perm-002',
      permitNumber: 'JK/NLP/2026/DL/4412',
      vehicleRegNumber: 'DL-01-TA-9988',
      operatorName: 'North Star Travels Pvt Ltd',
      homeState: 'DL',
      vehicleCategory: 'ALL_INDIA_TOURIST_PERMIT',
      entryBorderPost: 'Lakhanpur',
      inspectionCheckpoint: 'Lakhanpur Highway Post',
      corridorDescription: 'Delhi to Gulmarg Tourist Corridor',
      validFrom: '2026-08-10T00:00:00Z',
      validUntil: '2026-08-25T23:59:59Z',
      status: 'VERIFIED',
      taxFeePaidAmount: 2800,
      challanNumber: 'JK/CHAL/2026/1042'
    },
    {
      id: 'perm-003',
      permitNumber: 'JK/NLP/2026/HP/3011',
      vehicleRegNumber: 'HP-12-C-5678',
      operatorName: 'Himachal Volvo Express Line',
      homeState: 'HP',
      vehicleCategory: 'CONTRACT_CARRIAGE_PERMIT',
      entryBorderPost: 'Banihal Tunnel',
      inspectionCheckpoint: 'Banihal Security Post',
      corridorDescription: 'Shimla to Jammu Tawi',
      validFrom: '2026-08-15T00:00:00Z',
      validUntil: '2026-08-22T23:59:59Z',
      status: 'PENDING',
      taxFeePaidAmount: 1500,
      challanNumber: 'JK/CHAL/2026/1120'
    }
  ];

  let permitsState = [...SEED_PERMITS];
  let filteredPermits = [...SEED_PERMITS];

  // ─── INITIALIZATION ──────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initModal();
    fetchPermits();
    fetchSroNotifications();
    initLiveSosStream();
  });

  // ─── FILTERS & SEARCH ───────────────────────────────────────────────────────
  function initFilters() {
    const filterState = document.getElementById('filterHomeState');
    const filterBorder = document.getElementById('filterBorderPost');
    const filterStatus = document.getElementById('filterPermitStatus');
    const searchInput = document.getElementById('searchPermitInput');
    const applyBtn = document.getElementById('applyPermitFilters');

    function applyFilter() {
      const stateVal = filterState ? filterState.value : '';
      const borderVal = filterBorder ? filterBorder.value : '';
      const statusVal = filterStatus ? filterStatus.value : '';
      const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

      filteredPermits = permitsState.filter(p => {
        if (stateVal && p.homeState !== stateVal) return false;
        if (borderVal && p.entryBorderPost !== borderVal) return false;
        if (statusVal && p.status !== statusVal) return false;
        if (query) {
          const matchReg = p.vehicleRegNumber.toLowerCase().includes(query);
          const matchPermit = p.permitNumber.toLowerCase().includes(query);
          const matchOp = p.operatorName.toLowerCase().includes(query);
          if (!matchReg && !matchPermit && !matchOp) return false;
        }
        return true;
      });

      renderPermitsTable();
    }

    if (applyBtn) applyBtn.addEventListener('click', applyFilter);
    if (filterState) filterState.addEventListener('change', applyFilter);
    if (filterBorder) filterBorder.addEventListener('change', applyFilter);
    if (filterStatus) filterStatus.addEventListener('change', applyFilter);
    if (searchInput) searchInput.addEventListener('input', applyFilter);
  }

  // ─── RENDER PERMITS TABLE ───────────────────────────────────────────────────
  function renderPermitsTable() {
    const tbody = document.getElementById('permitsTableBody');
    if (!tbody) return;

    if (filteredPermits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#94a3b8;">No matching vehicle permits found in register.</td></tr>`;
      return;
    }

    tbody.innerHTML = filteredPermits.map(p => {
      const statusColor = p.status === 'VERIFIED' ? '#10b981' : p.status === 'PENDING' ? '#f59e0b' : '#ef4444';
      const statusBg = p.status === 'VERIFIED' ? 'rgba(16,185,129,0.15)' : p.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)';

      const validDate = p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN') : 'N/A';

      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06); transition:background 0.2s;">
          <td style="padding:10px 8px; font-weight:700; font-family:var(--font-mono, monospace); color:#38bdf8;">${p.permitNumber}</td>
          <td style="padding:10px 8px; font-weight:700; color:#fff;">${p.vehicleRegNumber}</td>
          <td style="padding:10px 8px; color:#cbd5e1;">${p.operatorName}</td>
          <td style="padding:10px 8px;"><span class="badge" style="background:#1e293b; color:#94a3b8; padding:2px 6px; border-radius:4px; font-weight:600;">${p.homeState}</span></td>
          <td style="padding:10px 8px; color:#cbd5e1;">📍 ${p.entryBorderPost}</td>
          <td style="padding:10px 8px; color:#94a3b8;">${validDate}</td>
          <td style="padding:10px 8px;">
            <span style="display:inline-block; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; color:${statusColor}; background:${statusBg}; border:1px solid ${statusColor};">
              ${p.status}
            </span>
          </td>
          <td style="padding:10px 8px;">
            ${p.status === 'PENDING' 
              ? `<button class="btn btn-sm btn--primary" style="padding:4px 8px; font-size:11px; background:#10b981; color:#fff; border:none; border-radius:4px; cursor:pointer;" onclick="window.verifyPermitAction('${p.id}')">✓ Verify</button>`
              : `<span style="color:#10b981; font-size:11px; font-weight:600;">Authorized</span>`
            }
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── FETCH FROM API ─────────────────────────────────────────────────────────
  async function fetchPermits() {
    try {
      const res = await fetch('/api/v1/permits/non-local');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          permitsState = json.data;
          filteredPermits = [...permitsState];
        }
      }
    } catch (e) {
      console.log('Using local permit registry data');
    }
    renderPermitsTable();
  }

  async function fetchSroNotifications() {
    const container = document.getElementById('sroGovtList');
    if (!container) return;

    try {
      const res = await fetch('/api/v1/sro/notifications');
      let notifications = [];
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          notifications = json.data;
        }
      }

      if (notifications.length === 0) {
        notifications = [
          {
            sroNumber: 'SRO-97 / MVD-2026',
            issuedDate: '2026-04-01',
            effectiveDate: '2026-05-01',
            title: 'J&K Motor Transport Stage Carriage Rate Revision',
            summary: 'Notified maximum ceiling rates: Plain terrain ₹1.40/km, Hilly terrain ₹1.70/km. Statutory base fare ₹9 for 0–3 km.',
            status: 'ACTIVE_GAZETTE'
          },
          {
            sroNumber: 'SRO-142 / INTERSTATE-2026',
            issuedDate: '2026-06-15',
            effectiveDate: '2026-07-01',
            title: 'Non-Local Commercial Passenger Entry Mandate',
            summary: 'Enforces mandatory electronic permit counter-signatures at Lakhanpur and Banihal Tunnel checkpoints.',
            status: 'ACTIVE_GAZETTE'
          }
        ];
      }

      container.innerHTML = notifications.map(sro => `
        <div class="sro-card" style="background:#0f172a; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <strong style="color:#fbbf24; font-family:var(--font-mono, monospace); font-size:14px;">📜 ${sro.sroNumber}</strong>
            <span style="font-size:11px; color:#10b981; background:rgba(16,185,129,0.15); border:1px solid #10b981; padding:2px 6px; border-radius:4px; font-weight:700;">ACTIVE</span>
          </div>
          <h4 style="margin:0 0 6px 0; color:#fff; font-size:14px;">${sro.title}</h4>
          <p style="color:#cbd5e1; font-size:12px; margin:0 0 10px 0; line-height:1.4;">${sro.summary}</p>
          <div style="font-size:11px; color:#94a3b8;">Effective: <strong>${sro.effectiveDate || sro.issuedDate}</strong> | Authority: <strong>Transport Commissioner J&K</strong></div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<p style="color:#94a3b8;">Unable to connect to statutory SRO feed.</p>`;
    }
  }

  // ─── PERMIT REGISTRATION MODAL ──────────────────────────────────────────────
  function initModal() {
    const modal = document.getElementById('registerPermitModal');
    const openBtn = document.getElementById('registerPermitBtn');
    const closeBtn = document.getElementById('regModalClose');
    const cancelBtn = document.getElementById('regModalCancel');
    const submitBtn = document.getElementById('regModalSubmit');

    if (!modal) return;

    function openModal() {
      modal.style.display = 'block';
      modal.removeAttribute('hidden');
    }

    function closeModal() {
      modal.style.display = 'none';
      modal.setAttribute('hidden', 'true');
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const permitNo = document.getElementById('reg_permitNumber')?.value.trim();
        const vehicleReg = document.getElementById('reg_vehicleReg')?.value.trim();
        const opName = document.getElementById('reg_operatorName')?.value.trim();
        const homeState = document.getElementById('reg_homeState')?.value;
        const borderPost = document.getElementById('reg_borderPost')?.value;
        const challan = document.getElementById('reg_challanNumber')?.value.trim();

        if (!permitNo || !vehicleReg || !opName || !homeState || !borderPost) {
          alert('Please fill out all required permit registration fields.');
          return;
        }

        const newPermit = {
          id: 'perm-' + Date.now(),
          permitNumber: permitNo,
          vehicleRegNumber: vehicleReg,
          operatorName: opName,
          homeState: homeState,
          vehicleCategory: document.getElementById('reg_vehicleCategory')?.value || 'ALL_INDIA_TOURIST_PERMIT',
          entryBorderPost: borderPost,
          inspectionCheckpoint: document.getElementById('reg_checkpoint')?.value || `${borderPost} Barrier`,
          corridorDescription: document.getElementById('reg_corridor')?.value || `${borderPost} Corridor`,
          validFrom: document.getElementById('reg_validFrom')?.value || new Date().toISOString(),
          validUntil: document.getElementById('reg_validUntil')?.value || new Date(Date.now() + 30*86400000).toISOString(),
          status: 'VERIFIED',
          taxFeePaidAmount: parseFloat(document.getElementById('reg_taxFeeAmount')?.value) || 2500,
          challanNumber: challan || 'JK/CHAL/2026/' + Math.floor(1000 + Math.random()*9000)
        };

        permitsState.unshift(newPermit);
        filteredPermits = [...permitsState];
        renderPermitsTable();
        closeModal();

        alert(`Permit ${permitNo} for vehicle ${vehicleReg} registered and verified successfully!`);
      });
    }
  }

  // ─── LIVE SOS DISTRESS STREAM MONITOR ───────────────────────────────────────
  function initLiveSosStream() {
    const streamContainer = document.getElementById('sosGovtStream');
    if (!streamContainer) return;

    const sampleAlerts = [
      { id: 'sos-1', time: '10 mins ago', corridor: 'NH-44 Banihal Tunnel North Portal', vehicle: 'JK01-AV-9912', status: 'PCR 112 DISPATCHED' },
      { id: 'sos-2', time: '42 mins ago', corridor: 'Srinagar–Budgam Near Airport Rd', vehicle: 'JK04-B-8831', status: 'RESOLVED / CLEARED' }
    ];

    streamContainer.innerHTML = sampleAlerts.map(a => `
      <div style="background:#0f172a; border-left:3px solid #ef4444; padding:10px 12px; border-radius:4px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:#ef4444;">🚨 ${a.corridor}</strong>
          <div style="color:#94a3b8; font-size:11px; margin-top:2px;">Vehicle: <span style="color:#fff;">${a.vehicle}</span> · ${a.time}</div>
        </div>
        <span style="font-size:10px; font-weight:700; color:#ef4444; background:rgba(239,68,68,0.15); border:1px solid #ef4444; padding:2px 6px; border-radius:4px;">${a.status}</span>
      </div>
    `).join('');
  }

  // Expose verify helper
  window.verifyPermitAction = function (id) {
    const item = permitsState.find(p => p.id === id);
    if (item) {
      item.status = 'VERIFIED';
      filteredPermits = [...permitsState];
      renderPermitsTable();
      alert(`Permit ${item.permitNumber} status updated to VERIFIED.`);
    }
  };

})();
