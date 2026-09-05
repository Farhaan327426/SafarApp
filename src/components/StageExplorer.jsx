import React, { useState } from 'react';
import { corridors } from '../data/corridors';
import OccupancyBadge from './OccupancyBadge';

export default function StageExplorer({ onUseRoute }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorridorId, setSelectedCorridorId] = useState(corridors[0]?.id || '');

  const filteredCorridors = corridors.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCorridor = corridors.find(c => c.id === selectedCorridorId) || filteredCorridors[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Corridor & Stage Explorer</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hierarchical transit routes & stage-by-stage statutory fares</p>
        </div>
        <input
          type="text"
          placeholder="Search corridors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2 border-r dark:border-slate-800 pr-0 md:pr-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Corridors ({filteredCorridors.length})</span>
          <div className="space-y-1">
            {filteredCorridors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCorridorId(c.id)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                  c.id === activeCorridor?.id
                    ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-semibold">{c.id}</div>
                <div className="text-xs opacity-80 truncate">{c.name}</div>
              </button>
            ))}
          </div>
        </div>

        {activeCorridor && (
          <div className="md:col-span-2 space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeCorridor.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ID: {activeCorridor.id} • Frequency: {activeCorridor.frequencyText}</p>
                </div>
                <OccupancyBadge tier={activeCorridor.occupancyTier} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
                <div><span className="font-semibold">First Trip:</span> {activeCorridor.firstTrip}</div>
                <div><span className="font-semibold">Last Trip:</span> {activeCorridor.lastTrip}</div>
                <div><span className="font-semibold">Vehicles:</span> {activeCorridor.vehicleTypes.join(', ')}</div>
              </div>
              {onUseRoute && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      const first = activeCorridor.stages[0]?.stopName || '';
                      const last = activeCorridor.stages[activeCorridor.stages.length - 1]?.stopName || '';
                      const dist = activeCorridor.stages[activeCorridor.stages.length - 1]?.kmFromSource || 0;
                      onUseRoute({ from: first, to: last, distance: dist });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Calculate Fare on this Corridor ➔
                  </button>
                </div>
              )}
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-700">
              {activeCorridor.stages.map((stage, idx) => (
                <div key={stage.stopId} className="relative flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 timeline-stop">
                  <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-100 ring-4 ring-white dark:ring-slate-900" />
                  <div>
                    <span className="text-xs font-mono text-slate-400">Stage {idx + 1}</span>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{stage.stopName}</div>
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
