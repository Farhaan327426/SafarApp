/**
 * Safar — Direct UPI Intent & Payment Modal Facilitator
 * Generates upi:// deep links and client-side QR codes via window.QRCode.
 */

export async function requestUpiPaymentIntent(tripParams) {
  const { vehicleNo, fareAmount, routeId, origin, destination } = tripParams;

  try {
    const res = await fetch('/api/v1/trips/upi-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleNo, fareAmount, routeId, origin, destination })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to generate UPI payment intent.');
    }

    renderUpiModal(json.data);
    return json.data;
  } catch (err) {
    alert(`UPI Payment Error: ${err.message}`);
    throw err;
  }
}

function renderUpiModal(data) {
  const { tripId, upiLink, amount, driverName, vehicleNo } = data;

  let modalOverlay = document.getElementById('upi-payment-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'upi-payment-modal';
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="modal-card upi-modal-card">
      <button class="modal-close" id="btn-close-upi-modal">&times;</button>
      <div class="upi-modal-header">
        <span class="upi-badge">Direct UPI Payment</span>
        <h3>Pay ₹${amount} directly to Driver</h3>
        <p class="text-subtle">${driverName} · ${vehicleNo}</p>
      </div>

      <div class="qr-container-box">
        <div id="upi-qr-target" class="qr-canvas"></div>
        <p class="qr-hint">Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)</p>
      </div>

      <div class="upi-action-box">
        <a href="${upiLink}" class="btn-primary-action btn-upi-app" target="_blank" rel="noopener">
          📱 Open in UPI App
        </a>
      </div>

      <div class="upi-notice-box">
        <p><strong>Notice:</strong> Safar does not collect or store funds. Payment goes directly to the driver's UPI ID. Confirm with conductor after paying.</p>
      </div>
    </div>
  `;

  modalOverlay.style.display = 'flex';

  const qrTarget = document.getElementById('upi-qr-target');
  if (qrTarget && window.QRCode) {
    qrTarget.innerHTML = '';
    new window.QRCode(qrTarget, {
      text: upiLink,
      width: 180,
      height: 180,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : 0
    });
  }

  const closeBtn = document.getElementById('btn-close-upi-modal');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modalOverlay.style.display = 'none';
    };
  }
}
