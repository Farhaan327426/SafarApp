import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function ConductorSlipModal({
  isOpen,
  open,
  onClose,
  passData,
  origin: propOrigin,
  destination: propDestination,
  vehicle: propVehicle,
  farePerSeat: propFarePerSeat,
  passengers: propPassengers,
  totalFare: propTotalFare,
  timestamp: propTimestamp
}) {
  const visible = isOpen ?? open;
  const [passengers, setPassengers] = useState(propPassengers || 1);
  const [openTimestamp, setOpenTimestamp] = useState(propTimestamp || Date.now());
  const canvasRef = useRef(null);

  // Lock timestamp when modal becomes visible; invariant across pax changes
  useEffect(() => {
    if (visible) {
      setOpenTimestamp(propTimestamp || Date.now());
      if (propPassengers) setPassengers(propPassengers);
    }
  }, [visible, propTimestamp, propPassengers]);

  const origin = passData?.origin ?? propOrigin ?? 'Lal Chowk';
  const destination = passData?.destination ?? propDestination ?? 'Hazratbal';
  const vehicle = passData?.vehicle ?? propVehicle ?? 'Matador';
  const baseFare = passData?.baseFare ?? propFarePerSeat ?? 20;
  const totalFare = propTotalFare ?? (baseFare * passengers);

  // Generate locked byte-identical base64 JSON payload
  const qrPayloadBase64 = (() => {
    const payload = {
      v: 1,
      o: origin,
      d: destination,
      veh: vehicle,
      pax: passengers,
      fare: totalFare,
      seat: baseFare,
      ts: openTimestamp,
      sro: 'SRO-97'
    };
    const jsonString = JSON.stringify(payload, ['v', 'o', 'd', 'veh', 'pax', 'fare', 'seat', 'ts', 'sro']);
    return btoa(unescape(encodeURIComponent(jsonString)));
  })();

  useEffect(() => {
    if (visible && canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const size = 180;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      QRCode.toCanvas(
        canvas,
        qrPayloadBase64,
        {
          width: size * dpr,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' }
        },
        (err) => {
          if (err) console.error('Conductor pass QR error:', err);
        }
      );
    }
  }, [visible, qrPayloadBase64]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 conductor-pass-card">
        <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Digital Transit Pass</h3>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Offline Verified Slip</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700">
          <canvas ref={canvasRef} />
          <span className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
            Verified under J&amp;K SRO-97
          </span>
        </div>

        <div className="relative my-2">
          <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800" />
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Route:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{origin} ➔ {destination}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Vehicle:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{vehicle}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Passengers:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPassengers(p => Math.max(1, p - 1))}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center"
              >
                -
              </button>
              <span className="font-bold w-4 text-center text-slate-900 dark:text-white">{passengers}</span>
              <button
                type="button"
                onClick={() => setPassengers(p => Math.min(10, p + 1))}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex justify-between border-t pt-2.5 dark:border-slate-800 text-sm font-bold">
            <span className="text-slate-900 dark:text-white">Total Fare:</span>
            <span className="text-emerald-600 dark:text-emerald-400">₹{totalFare}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
}
