/**
 * SAFAR — React Hook for Tariff Synchronization
 * Subscribes to the external store via useSyncExternalStore.
 */

import { useSyncExternalStore, useEffect } from 'react';
import { tariffSyncService } from '../services/tariffSyncService.js';

/**
 * Hook to subscribe to the tariff synchronization service.
 *
 * @param {ReturnType<typeof import('../services/tariffSyncService').createTariffSyncService>} [service]
 */
export function useTariffSync(service = tariffSyncService) {
  const state = useSyncExternalStore(
    service.subscribe,
    service.getSnapshot,
    service.getSnapshot
  );

  useEffect(() => {
    if (!state.tariffs && state.dataFreshness === 'NO_DATA') {
      service.sync().catch(() => {});
    }
  }, [service, state.tariffs, state.dataFreshness]);

  return {
    ...state,
    sync: service.sync
  };
}
