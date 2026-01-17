import type { UserLocation } from '@/app/map/types';

const EARTH_RADIUS_METERS = 6378137;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

const destinationPoint = (
  origin: [number, number],
  bearingDegrees: number,
  distanceMeters: number,
): [number, number] => {
  const [lng, lat] = origin;
  const bearing = toRadians(bearingDegrees);
  const lat1 = toRadians(lat);
  const lng1 = toRadians(lng);
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return [toDegrees(lng2), toDegrees(lat2)];
};

const buildAccuracyPolygon = (
  center: [number, number],
  radiusMeters: number,
  steps = 48,
): GeoJSON.Polygon => {
  const coords: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i += 1) {
    const bearing = (360 * i) / steps;
    coords.push(destinationPoint(center, bearing, radiusMeters));
  }
  return {
    type: 'Polygon',
    coordinates: [coords],
  };
};

const buildHeadingLine = (
  center: [number, number],
  heading: number,
  lengthMeters: number,
): GeoJSON.LineString => {
  return {
    type: 'LineString',
    coordinates: [center, destinationPoint(center, heading, lengthMeters)],
  };
};

export const buildUserLocationGeoJson = (
  location: UserLocation,
): GeoJSON.FeatureCollection<GeoJSON.Geometry> => {
  const features: Array<GeoJSON.Feature<GeoJSON.Geometry>> = [];

  if (location.accuracy && location.accuracy > 0) {
    features.push({
      type: 'Feature',
      properties: { role: 'accuracy' },
      geometry: buildAccuracyPolygon(location.coordinates, location.accuracy),
    });
  }

  if (typeof location.heading === 'number' && !Number.isNaN(location.heading)) {
    const headingLength = Math.max(15, Math.min(location.accuracy ?? 25, 35));
    features.push({
      type: 'Feature',
      properties: { role: 'heading' },
      geometry: buildHeadingLine(location.coordinates, location.heading, headingLength),
    });
  }

  features.push({
    type: 'Feature',
    properties: { role: 'position' },
    geometry: {
      type: 'Point',
      coordinates: location.coordinates,
    },
  });

  return {
    type: 'FeatureCollection',
    features,
  };
};

export const haversineDistanceMeters = (
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number],
) => {
  const earthRadius = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};
