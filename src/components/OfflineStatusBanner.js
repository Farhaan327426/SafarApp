/**
 * SAFAR — Offline & Network Status Banner
 * Renders honest network connectivity and tariff cache freshness notices.
 * Implemented with React.createElement for zero-dependency universal ESM compatibility.
 */

import React from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * @param {object} props
 * @param {import('../types/transit').NetworkCondition} props.networkCondition
 * @param {import('../types/transit').DataFreshness} props.dataFreshness
 * @param {string | null} [props.activeScheduleId]
 * @param {number | null} [props.lastSyncedAt]
 * @param {() => void} [props.onRetry]
 */
export function OfflineStatusBanner({
  networkCondition,
  dataFreshness,
  activeScheduleId,
  lastSyncedAt,
  onRetry
}) {
  if (networkCondition === 'ONLINE' && dataFreshness === 'CACHE_FRESH') {
    return null;
  }

  // Case 1: Completely offline with fresh cache
  if (networkCondition === 'OFFLINE' && dataFreshness === 'CACHE_FRESH') {
    return React.createElement(
      'div',
      {
        role: 'status',
        'aria-live': 'polite',
        className: 'w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-amber-300 text-xs flex items-center justify-between'
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(WifiOff, { className: 'w-4 h-4 text-amber-400 shrink-0' }),
        React.createElement(
          'span',
          null,
          React.createElement('strong', null, 'Offline Mode:'),
          ' Using legally verified cached rates (Schedule: ',
          React.createElement('span', { className: 'font-mono' }, activeScheduleId || 'S.O. 126'),
          ')'
        )
      ),
      lastSyncedAt
        ? React.createElement(
            'span',
            { className: 'text-amber-400/70 text-[10px] hidden sm:inline' },
            `Cached: ${new Date(lastSyncedAt).toLocaleDateString()}`
          )
        : null
    );
  }

  // Case 2: Server unreachable but cache fresh
  if (networkCondition === 'UNREACHABLE' && dataFreshness === 'CACHE_FRESH') {
    return React.createElement(
      'div',
      {
        role: 'alert',
        'aria-live': 'assertive',
        className: 'w-full bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-yellow-300 text-xs flex items-center justify-between'
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(AlertTriangle, { className: 'w-4 h-4 text-yellow-400 shrink-0' }),
        React.createElement(
          'span',
          null,
          React.createElement('strong', null, 'Sync Unavailable:'),
          ' Operating on cached schedule ',
          React.createElement('span', { className: 'font-mono' }, activeScheduleId || 'S.O. 126'),
          '.'
        )
      ),
      onRetry
        ? React.createElement(
            'button',
            {
              onClick: onRetry,
              className: 'flex items-center gap-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-2.5 py-1 rounded text-xs transition-colors'
            },
            React.createElement(RefreshCw, { className: 'w-3 h-3' }),
            React.createElement('span', null, 'Retry')
          )
        : null
    );
  }

  // Case 3: No data at all (neither online nor cached)
  if (dataFreshness === 'NO_DATA') {
    return React.createElement(
      'div',
      {
        role: 'alert',
        'aria-live': 'assertive',
        className: 'w-full bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-red-300 text-xs flex items-center justify-between'
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(AlertTriangle, { className: 'w-4 h-4 text-red-400 shrink-0' }),
        React.createElement(
          'span',
          null,
          React.createElement('strong', null, 'No Tariff Data:'),
          ' Unable to load statutory fare schedules. Fares cannot be calculated until connected.'
        )
      ),
      onRetry
        ? React.createElement(
            'button',
            {
              onClick: onRetry,
              className: 'flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2.5 py-1 rounded text-xs transition-colors'
            },
            React.createElement(RefreshCw, { className: 'w-3 h-3' }),
            React.createElement('span', null, 'Retry')
          )
        : null
    );
  }

  return null;
}
