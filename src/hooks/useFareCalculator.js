import { useMemo, useState } from 'react';

export function useFareCalculator({ vehicle, distance, terrainRegion, from, to, eligibleVehicles }) {
  const [priceMode, setPriceMode] = useState('statutory');

  const fareParts = useMemo(() => {
    const distNum = parseFloat(distance) || 0;
    const baseRate = vehicle?.baseFarePerKm || 2.5;
    const terrainMultiplier = terrainRegion === 'hilly' ? 1.15 : 1.0;
    
    const calculatedBase = distNum * baseRate * terrainMultiplier;
    const roundedFare = Math.max(Math.round(calculatedBase), vehicle?.minFare || 10);
    
    return {
      baseFare: roundedFare,
      distanceKm: distNum,
      ratePerKm: baseRate,
      terrainMultiplier,
      mode: priceMode,
      totalFare: priceMode === 'statutory' ? roundedFare : Math.round(roundedFare * 0.9)
    };
  }, [vehicle, distance, terrainRegion, priceMode]);

  const displayFare = fareParts.totalFare;

  return {
    fareParts,
    displayFare,
    priceMode,
    setPriceMode
  };
}
