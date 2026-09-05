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
}) {
  const visible = isOpen ?? open;
  const [passengers, setPassengers] = useState(1);
  const canvasRef = useRef(null);

  const origin = passData?.origin ?? propOrigin ?? 'Lal Chowk';
  const destination = passData?.destination ?? propDestination ?? 'Hazratbal';
  const vehicle = passData?.vehicle ?? propVehicle ?? 'Matador';
  const baseFare = passData?.baseFare ?? propFarePerSeat ?? 15;

  const totalFare = baseFare * passengers;
  const timestamp = new Date().toISOString();

  const qrPayload = JSON.stringify({
    v: 1,
    org: origin,
    dst: destination,
    vh: vehicle,
    p: passengers,
    tf: totalFare,
    ts: timestamp,
    sro: 'J&K SRO-97'
  });

  useEffect(() => {
    if (visible && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrPayload, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      }, (err) => {
        if (err) console.error(err);
      });
    }
  }, [visible, qrPayload, passengers]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 conductor-pass-card">
        <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Digital Transit Pass</h3>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Offline Slip</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700">
          <canvas ref={canvasRef} />
          <span className="mt-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Verified under J&K SRO-97</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-slate-500">Route:</span><span className="font-medium text-slate-900 dark:text-white">{origin} ➔ {destination}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Vehicle:</span><span className="font-medium text-slate-900 dark:text-white">{vehicle}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Passengers:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPassengers(p => Math.max(1, p - 1))} className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 font-bold">-</button>
              <span className="font-bold">{passengers}</span>
              <button onClick={() => setPassengers(p => p + 1)} className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 font-bold">+</button>
            </div>
          </div>
          <div className="flex justify-between border-t pt-2 dark:border-slate-800 text-sm font-bold">
            <span className="text-slate-900 dark:text-white">Total Fare:</span>
            <span className="text-slate-900 dark:text-white">₹{totalFare}</span>
          </div>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium text-sm">
          Done
        </button>
      </div>
    </div>
  );
}
