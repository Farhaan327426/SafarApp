import React from 'react';

export default function OccupancyBadge({ tier = 'low' }) {
  const labels = {
    low: 'Low Rush',
    moderate: 'Moderate',
    high: 'High Rush'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider badge-tier-${tier}`}>
      {labels[tier] || tier}
    </span>
  );
}
