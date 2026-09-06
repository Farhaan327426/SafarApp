import React, { useState } from 'react';
import { corridors } from '../data/corridors.js';
import OccupancyBadge from './OccupancyBadge.jsx';

export default function StageExplorer({ onUseRoute }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorridorId, setSelectedCorridorId] = useState(corridors[0]?.id || '');

  const q = searchQuery.toLowerCase().trim();
  const filteredCorridors = corridors.filter(c =>
    !q ||
    c.name.toLowerCase().includes(q) ||
    c.id.toLowerCase().includes(q) ||
    c.stages.some(s => s.stopName.toLowerCase().includes(q))
  );

  const activeCorridor = corridors.find(c => c.id === selectedCorridorId) || filteredCorridors[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Corridor &amp; Stage Explorer</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hierarchical transit routes &amp; stage-by-stage statutory fares</p>
        </div>
        <input
          type="text"
          placeholder="Search corridors or stops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 px-3.5 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2 border-r dark:border-slate-800 pr-0 md:pr-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Corridors ({filteredCorridors.length})</span>
          <div className="space-y-1.5">
            {filteredCorridors.map((c) => {
              const isSelected = c.id === activeCorridor?.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCorridorId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-bold">{c.id}</div>
                    <span className="text-[10px] opacity-75 font-semibold">{c.frequencyText}</span>
                  </div>
                  <div className="text-xs opacity-85 truncate mt-0.5">{c.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {activeCorridor && (
          <div className="md:col-span-2 space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeCorridor.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ID: {activeCorridor.id} • Frequency: {activeCorridor.frequencyText}</p>
                </div>
                <div className="text-right">
                  <OccupancyBadge tier={activeCorridor.occupancyTier} />
                  <div className="text-[10px] text-slate-400 mt-1">Observed Peak Pattern</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
                <div><span className="font-semibold">First Trip:</span> {activeCorridor.firstTrip}</div>
                <div><span className="font-semibold">Last Trip:</span> {activeCorridor.lastTrip}</div>
                <div><span className="font-semibold">Vehicles:</span> {activeCorridor.vehicleTypes.join(', ')}</div>
              </div>
              {onUseRoute && (
                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      const first = activeCorridor.stages[0]?.stopName || '';
                      const last = activeCorridor.stages[activeCorridor.stages.length - 1]?.stopName || '';
                      const dist = activeCorridor.stages[activeCorridor.stages.length - 1]?.kmFromSource || 0;
                      onUseRoute({ from: first, to: last, distance: dist });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                  >
                    <span>Calculate Fare on this Corridor</span> ➔
                  </button>
                </div>
              )}
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {activeCorridor.stages.map((stage, idx) => (
                <div key={stage.stopId} className="relative flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-100 ring-4 ring-white dark:ring-slate-900" />
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Stage {idx + 1}</span>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{stage.stopName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">{stage.kmFromSource} km</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">₹{stage.statutoryFare}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
