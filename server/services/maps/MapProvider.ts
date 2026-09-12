export interface DistanceEstimate {
  straightLineKm: number;
  estimatedMinutes: number;
  isStraightLine: boolean;
}

export interface IMapProvider {
  name: string;
  getTileStyleUrl(): string;
  getAttribution(): string;
  calculateDistance(
    origin: [number, number], // [lat, lng]
    destination: [number, number]
  ): DistanceEstimate;
}

export class OpenFreeMapProvider implements IMapProvider {
  name = "openfreemap";

  getTileStyleUrl(): string {
    // OpenFreeMap provides free vector map styles based on OpenStreetMap
    return "https://tiles.openfreemap.org/styles/positron";
  }

  getAttribution(): string {
    return "© OpenStreetMap contributors, © OpenFreeMap";
  }

  calculateDistance(
    origin: [number, number],
    destination: [number, number]
  ): DistanceEstimate {
    // Haversine formula for spherical distance
    const [lat1, lon1] = origin;
    const [lat2, lon2] = destination;
    const R = 6371; // Earth's radius in km

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Number((R * c).toFixed(2));

    // Urban city road traffic heuristic: ~20 km/h average speed + 8 min prep/dispatch buffer
    const estimatedMinutes = Math.max(10, Math.round((distanceKm / 20) * 60 + 8));

    return {
      straightLineKm: distanceKm,
      estimatedMinutes,
      isStraightLine: true,
    };
  }
}

export const mapProvider = new OpenFreeMapProvider();
