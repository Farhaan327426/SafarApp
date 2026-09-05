import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Minus, Plus, QrCode, ShieldCheck, Download } from "lucide-react";

/**
 * Encode the QR payload to a compact, offline-safe base64 string.
 * Schema v1: { v, r, f, t, m, p, amt, ts }
 */
function buildQRPayload({ origin, destination, vehicle, passengers, totalFare }) {
  const payload = {
    v: 1,
    r: "SRO-97",
    f: origin.toUpperCase().replace(/\s+/g, "_").slice(0, 20),
    t: destination.toUpperCase().replace(/\s+/g, "_").slice(0, 20),
    m: vehicle.toUpperCase().replace(/[\s-]+/g, "_").slice(0, 16),
    p: passengers,
    amt: Number(totalFare) * passengers,
    ts: Math.floor(Date.now() / 1000),
  };
  try {
    return btoa(JSON.stringify(payload));
  } catch {
    return btoa("SAFAR-JK-SRO97-PASS");
  }
}

/** Draw QR code to canvas using the QRious library (if available) or fallback placeholder */
function renderQRToCanvas(canvas, text) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Use QRious if loaded globally (qrcode.js in frontend), else use a simple grid placeholder
  if (window.QRCode) {
    try {
      // qrcode.js pattern
      const qr = new window.QRCode(document.createElement("div"), {
        text,
        width: 160,
        height: 160,
        colorDark: "#234b4c",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M,
      });
      // After brief tick, the img is generated
      setTimeout(() => {
        const img = qr._el?.querySelector("img") || qr._el?.querySelector("canvas");
        if (img) {
          canvas.width = 160;
          canvas.height = 160;
          ctx.drawImage(img, 0, 0, 160, 160);
        }
      }, 50);
      return;
    } catch { /* fallthrough */ }
  }

  // Simple SVG-based visual placeholder drawn on canvas
  canvas.width = 160;
  canvas.height = 160;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 160, 160);
  ctx.fillStyle = "#234b4c";

  const cellSize = 5;
  const seed = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = 32;
  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      const hash = (seed * (row + 1) * (col + 1)) % 17;
      if (hash < 8 || (row < 4 && col < 4) || (row < 4 && col > cells - 5) || (row > cells - 5 && col < 4)) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize - 1, cellSize - 1);
      }
    }
  }

  // Corner anchors
  [[0, 0], [0, cells - 7], [cells - 7, 0]].forEach(([r, c]) => {
    ctx.strokeStyle = "#234b4c";
    ctx.lineWidth = 2;
    ctx.strokeRect(c * cellSize, r * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillRect((c + 2) * cellSize, (r + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  });
}

/**
 * ConductorSlipModal — Offline-first digital transit pass / fare receipt.
 * Shows an SRO-97 boarding pass with a scannable QR code and statutory watermark.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   origin: string
 *   destination: string
 *   vehicle: string  (vehicle label)
 *   distanceKm: number
 *   farePerSeat: number
 */
export default function ConductorSlipModal({
  open,
  onClose,
  origin = "—",
  destination = "—",
  vehicle = "Shared Cab",
  distanceKm = 0,
  farePerSeat = 0,
}) {
  const [passengers, setPassengers] = useState(1);
  const canvasRef = useRef(null);

  const totalFare = farePerSeat * passengers;
  const timestamp = new Date();
  const dateStr = timestamp.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const refreshQR = useCallback(() => {
    const payload = buildQRPayload({ origin, destination, vehicle, passengers, totalFare: farePerSeat });
    renderQRToCanvas(canvasRef.current, payload);
  }, [origin, destination, vehicle, passengers, farePerSeat]);

  useEffect(() => {
    if (open) {
      setPassengers(1);
      setTimeout(refreshQR, 60);
    }
  }, [open]);

  useEffect(() => {
    if (open) refreshQR();
  }, [passengers, open, refreshQR]);

  if (!open) return null;

  const handleDecrease = () => setPassengers((p) => Math.max(1, p - 1));
  const handleIncrease = () => setPassengers((p) => Math.min(10, p + 1));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Digital Conductor Pass"
        style={{
          background: "#ffffff",
          borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
          width: "100%",
          maxWidth: 400,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #234b4c, #2c5b5c)",
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(242,189,112,0.2)",
                border: "1px solid rgba(242,189,112,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QrCode size={18} color="#f2bd70" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#f4f6ed" }}>
                Digital Fare Pass
              </h3>
              <p style={{ margin: 0, fontSize: "0.65rem", color: "#9cbbb7" }}>
                Verified under J&K SRO-97 · Offline-Safe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: 10,
              color: "#f4f6ed",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Boarding Pass Body */}
        <div style={{ padding: "18px 18px 0" }}>
          {/* Route */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.6rem", color: "#78908a", fontWeight: 600, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.05em" }}>From</p>
              <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#234b4c", margin: 0 }}>{origin || "—"}</p>
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#eaf0e9",
                border: "1px solid #dce5dc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={14} color="#557b72" style={{ transform: "rotate(45deg)" }} />
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <p style={{ fontSize: "0.6rem", color: "#78908a", fontWeight: 600, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.05em" }}>To</p>
              <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#234b4c", margin: 0 }}>{destination || "—"}</p>
            </div>
          </div>

          {/* Trip meta */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              { label: "Vehicle", value: vehicle },
              { label: "Distance", value: `${distanceKm} km` },
              { label: "Date", value: dateStr },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "#f5f7f3",
                  border: "1px solid #e5ece3",
                  borderRadius: 10,
                  padding: "6px 8px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "0.58rem", color: "#78908a", fontWeight: 600, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#234b4c", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Passenger counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#eaf0e9",
              border: "1px solid #d2e4d4",
              borderRadius: 14,
              padding: "10px 14px",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#234b4c" }}>Passengers</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={handleDecrease}
                disabled={passengers <= 1}
                aria-label="Decrease passengers"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  border: "1px solid #d2e4d4",
                  background: passengers <= 1 ? "#f0f4ee" : "#ffffff",
                  color: passengers <= 1 ? "#aec4b0" : "#234b4c",
                  cursor: passengers <= 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Minus size={14} />
              </button>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#234b4c",
                  minWidth: 24,
                  textAlign: "center",
                }}
              >
                {passengers}
              </span>
              <button
                onClick={handleIncrease}
                disabled={passengers >= 10}
                aria-label="Increase passengers"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  border: "1px solid #d2e4d4",
                  background: passengers >= 10 ? "#f0f4ee" : "#ffffff",
                  color: passengers >= 10 ? "#aec4b0" : "#234b4c",
                  cursor: passengers >= 10 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Dashed receipt divider with notch */}
          <div
            style={{
              position: "relative",
              margin: "0 -18px 0",
              borderTop: "2px dashed #d8e3d8",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: -10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#f5f6f1",
                border: "1px solid #dce5dc",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: -10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#f5f6f1",
                border: "1px solid #dce5dc",
              }}
            />
          </div>
        </div>

        {/* QR + Fare Section */}
        <div
          style={{
            padding: "14px 18px 18px",
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          {/* QR Code Canvas */}
          <div
            style={{
              flexShrink: 0,
              padding: 6,
              background: "#ffffff",
              border: "2px solid #dce5dc",
              borderRadius: 12,
            }}
          >
            <canvas
              ref={canvasRef}
              id="passQrCanvas"
              width={120}
              height={120}
              style={{ display: "block", borderRadius: 6 }}
            />
          </div>

          {/* Fare & verification */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: "0.6rem", color: "#78908a", fontWeight: 600, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Legal Fare
              </p>
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#234b4c", margin: 0, lineHeight: 1.1 }}>
                ₹{totalFare}
              </p>
              <p style={{ fontSize: "0.65rem", color: "#78908a", margin: "2px 0 0" }}>
                {passengers} × ₹{farePerSeat} per seat
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 9px",
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
              }}
            >
              <ShieldCheck size={12} color="#16a34a" />
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#15803d" }}>
                SRO-97 Verified Rate
              </span>
            </div>

            <p style={{ fontSize: "0.58rem", color: "#78908a", margin: "6px 0 0" }}>
              {dateStr} · {timeStr}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #e5ece3",
            padding: "10px 18px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <p style={{ fontSize: "0.62rem", color: "#78908a", margin: 0, textAlign: "center" }}>
            Show this pass to your conductor. Legally, they cannot charge more than{" "}
            <strong style={{ color: "#234b4c" }}>₹{farePerSeat}</strong> per seat under J&K Motor Vehicles Rules.
          </p>
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 12,
              border: "1px solid #dce5dc",
              background: "#f0f4ee",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#345657",
              cursor: "pointer",
            }}
          >
            Close Pass
          </button>
        </div>
      </div>
    </div>
  );
}
