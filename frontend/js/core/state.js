/**
 * SAFAR — Centralized Reactive State Store (Pub/Sub)
 */

import { MINIMAL_FALLBACK_MINDMAP } from './constants.js';

export const DEFAULT_STATE = {
  commuter: {
    route: null,
    boardingId: "my_location",
    deboardingId: "",
    userCoords: null,
    offlineCount: 0,
    lastCalculatedFare: null,
    lastCalculatedMeta: null,
    lastCalculatedSource: null,
    lastCalculatedVehicle: null,
    lastCalculatedOrigin: null,
    lastCalculatedDestination: null
  },
  driver: {
    passengerCount: 0,
    maxCapacity: 22,
    pingsCount: 0,
    earnings: 0,
    isBroadcasting: false,
    broadcastTimer: null,
    assignedRouteId: "",
    vehicleNo: "JK01-AV-9912",
    vehicleType: "MINI_BUS",
    driverMap: null,
    dutyStatus: "Off Duty",
    gpsStatus: "GPS Idle",
    authoritativeEarnings: null
  },
  ai: {
    isListening: false,
    recognition: null,
    hasInitialized: false
  },
  mindmap: {
    zoom: 1.0,
    expandedNodes: new Set(["root"]),
    selectedNodeId: "root",
    focusedNodeId: "node-root",
    searchFilter: "",
    data: MINIMAL_FALLBACK_MINDMAP
  },
  navigation: {
    activeTab: "commuter"
  }
};

export class StateStore {
  constructor(initialState = DEFAULT_STATE) {
    this._state = JSON.parse(JSON.stringify(initialState));
    // Restore Set objects lost during JSON clone
    if (initialState.mindmap && initialState.mindmap.expandedNodes) {
      this._state.mindmap.expandedNodes = new Set(initialState.mindmap.expandedNodes);
    }
    this._listeners = new Map();
  }

  getState(slice) {
    if (!slice) return this._state;
    return this._state[slice];
  }

  setState(slice, partialState) {
    if (!this._state[slice]) {
      this._state[slice] = {};
    }
    this._state[slice] = {
      ...this._state[slice],
      ...partialState
    };
    this._notify(slice);
  }

  subscribe(slice, callback) {
    if (!this._listeners.has(slice)) {
      this._listeners.set(slice, new Set());
    }
    const set = this._listeners.get(slice);
    set.add(callback);
    return () => set.delete(callback);
  }

  _notify(slice) {
    if (this._listeners.has(slice)) {
      const currentSliceState = this._state[slice];
      this._listeners.get(slice).forEach(cb => {
        try {
          cb(currentSliceState);
        } catch (e) {
          console.error(`[StateStore] Error in subscriber for slice '${slice}':`, e);
        }
      });
    }
  }
}

export const store = new StateStore(DEFAULT_STATE);
