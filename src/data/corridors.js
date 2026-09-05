export const corridors = [
  {
    id: 'JK-SRI-01',
    name: 'Lal Chowk ⇄ Hazratbal via Dalgate',
    vehicleTypes: ['Matador', 'E-Bus'],
    frequencyText: 'Every 10 min',
    firstTrip: '06:00',
    lastTrip: '21:00',
    occupancyTier: 'low',
    stages: [
      { stopId: 's1', stopName: 'Lal Chowk', kmFromSource: 0, statutoryFare: 0 },
      { stopId: 's2', stopName: 'Dalgate', kmFromSource: 3.2, statutoryFare: 10 },
      { stopId: 's3', stopName: 'Hazratbal', kmFromSource: 11.5, statutoryFare: 20 }
    ]
  },
  {
    id: 'JK-SRI-02',
    name: 'Batamaloo ⇄ Baramulla NH-1',
    vehicleTypes: ['Sumo', 'Mini-Bus'],
    frequencyText: 'Every 15 min',
    firstTrip: '06:30',
    lastTrip: '19:30',
    occupancyTier: 'high',
    stages: [
      { stopId: 's1', stopName: 'Batamaloo', kmFromSource: 0, statutoryFare: 0 },
      { stopId: 's2', stopName: 'Pattan', kmFromSource: 27.0, statutoryFare: 45 },
      { stopId: 's3', stopName: 'Baramulla', kmFromSource: 54.0, statutoryFare: 85 }
    ]
  },
  {
    id: 'JK-SRI-03',
    name: 'Lal Chowk ⇄ Anantnag NH-44',
    vehicleTypes: ['Bus', 'Cab', 'Sumo'],
    frequencyText: 'Every 12 min',
    firstTrip: '06:00',
    lastTrip: '20:00',
    occupancyTier: 'moderate',
    stages: [
      { stopId: 's1', stopName: 'Lal Chowk', kmFromSource: 0, statutoryFare: 0 },
      { stopId: 's2', stopName: 'Pampore', kmFromSource: 14.0, statutoryFare: 25 },
      { stopId: 's3', stopName: 'Anantnag', kmFromSource: 52.0, statutoryFare: 80 }
    ]
  },
  {
    id: 'JK-JAM-01',
    name: 'General Bus Stand ⇄ Katra',
    vehicleTypes: ['Deluxe Bus', 'Cab'],
    frequencyText: 'Every 8 min',
    firstTrip: '05:00',
    lastTrip: '22:00',
    occupancyTier: 'high',
    stages: [
      { stopId: 's1', stopName: 'General Bus Stand', kmFromSource: 0, statutoryFare: 0 },
      { stopId: 's2', stopName: 'Jhajjar Kotli', kmFromSource: 30.0, statutoryFare: 50 },
      { stopId: 's3', stopName: 'Katra', kmFromSource: 48.0, statutoryFare: 90 }
    ]
  },
  {
    id: 'JK-JAM-02',
    name: 'Jammu ⇄ Udhampur NH-44',
    vehicleTypes: ['Bus', 'Sumo'],
    frequencyText: 'Every 20 min',
    firstTrip: '06:00',
    lastTrip: '20:30',
    occupancyTier: 'moderate',
    stages: [
      { stopId: 's1', stopName: 'Jammu', kmFromSource: 0, statutoryFare: 0 },
      { stopId: 's2', stopName: 'Nagrota', kmFromSource: 15.0, statutoryFare: 25 },
      { stopId: 's3', stopName: 'Udhampur', kmFromSource: 65.0, statutoryFare: 110 }
    ]
  },
  {
    id: 'JK-KMR-01',
    name: 'Pantha Chowk ⇄ Anantnag NH-44',
    vehicleTypes: ['Bus', 'Cab', 'Sumo'],
    frequencyText: 'Every 15 min',
    firstTrip: '06:30',
    lastTrip: '19:00',
    occupancyTier: 'low',
    stages: [
      { stopId: 's1', stopName: 'Pantha Chowk', kmFromSource: 0, statutoryFare: 0 },
      { stopId: 's2', stopName: 'Awantipora', kmFromSource: 30.0, statutoryFare: 45 },
      { stopId: 's3', stopName: 'Anantnag', kmFromSource: 45.0, statutoryFare: 70 }
    ]
  },
  {
    id: 'JK-NKA-01',
    name: 'Srinagar ⇄ Baramulla',
    vehicleTypes: ['Bus', 'Sumo'],
    frequencyText: 'Every 10 min',
    firstTrip: '06:00',
    lastTrip: '20:00',
    occupancyTier: 'moderate',
    stages: [
      { stopId: 's1', stopName: 'Srinagar', kmFromSource: 0, statutoryFare: 0 },
      { stopId: 's2', stopName: 'Sangrama', kmFromSource: 42.0, statutoryFare: 65 },
      { stopId: 's3', stopName: 'Baramulla', kmFromSource: 54.0, statutoryFare: 85 }
    ]
  },
  {
    id: 'JK-NKA-02',
    name: 'Srinagar ⇄ Sonmarg',
    vehicleTypes: ['Tourist Bus', 'Cab'],
    frequencyText: 'Every 30 min',
    firstTrip: '07:00',
    lastTrip: '18:00',
    occupancyTier: 'high',
    stages: [
      { stopId: 's1', stopName: 'Srinagar', kmFromSource: 0, statutoryFare: 0 },
      { stopId: 's2', stopName: 'Ganderbal', kmFromSource: 21.0, statutoryFare: 35 },
      { stopId: 's3', stopName: 'Sonmarg', kmFromSource: 80.0, statutoryFare: 180 }
    ]
  }
];

export const JK_CORRIDORS = corridors;

export const OCCUPANCY_LABELS = {
  low: 'Seats Available',
  moderate: 'Moderate Rush',
  high: 'Standing / Heavy Rush'
};

export const OCCUPANCY_COLORS = {
  low: '#16a34a',
  moderate: '#d97706',
  high: '#dc2626'
};

export function searchCorridors(query) {
  if (!query || !query.trim()) return corridors;
  const q = query.toLowerCase().trim();
  return corridors.filter(
    (c) =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.stages.some((s) => s.stopName.toLowerCase().includes(q))
  );
}

export function getStageFare(corridorId, stopId) {
  const corridor = corridors.find((c) => c.id === corridorId);
  if (!corridor) return null;
  const stage = corridor.stages.find((s) => s.stopId === stopId);
  return stage ? stage.statutoryFare : null;
}
