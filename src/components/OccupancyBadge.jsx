import React from 'react';

const TIER_META = {
  low: {
    label: 'Seats Available',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
  },
  moderate: {
    label: 'Filling Fast',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
  },
  high: {
    label: 'High Rush',
    className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
  }
};

export default function OccupancyBadge({ tier = 'low', showIcon = true }) {
  const meta = TIER_META[tier] || TIER_META.low;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.className}`}>
      {showIcon && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          tier === 'low' ? 'bg-emerald-500' : tier === 'moderate' ? 'bg-amber-500' : 'bg-rose-500'
        }`} />
      )}
      <span>{meta.label}</span>
    </span>
  );
}
