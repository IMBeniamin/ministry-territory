import type { Map } from 'maplibre-gl';
import type { UserLocation } from '@/app/map/types';
import { ensureGeoJsonSource, ensureLayer } from './overlayUtils';
import type { OverlayContext, OverlayDefinition } from './overlayRegistry';

const USER_LOCATION_SOURCE_ID = 'user-location-source';
const USER_LOCATION_ACCURACY_LAYER_ID = 'user-location-accuracy';
const USER_LOCATION_HEADING_LAYER_ID = 'user-location-heading';
const USER_LOCATION_DOT_LAYER_ID = 'user-location-dot';

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

export const USER_LOCATION_OVERLAY: OverlayDefinition<
  GeoJSON.FeatureCollection<GeoJSON.Geometry>
> = {
  id: 'user-location',
  sourceId: USER_LOCATION_SOURCE_ID,
  layerIds: [
    USER_LOCATION_ACCURACY_LAYER_ID,
    USER_LOCATION_HEADING_LAYER_ID,
    USER_LOCATION_DOT_LAYER_ID,
  ],
  apply(map: Map, data: GeoJSON.FeatureCollection<GeoJSON.Geometry>, context: OverlayContext) {
    ensureGeoJsonSource(map, USER_LOCATION_SOURCE_ID, data);

    ensureLayer(
      map,
      {
        id: USER_LOCATION_ACCURACY_LAYER_ID,
        type: 'fill',
        source: USER_LOCATION_SOURCE_ID,
        filter: ['==', ['get', 'role'], 'accuracy'],
        paint: {
          'fill-color': 'rgba(49, 130, 255, 0.18)',
          'fill-outline-color': 'rgba(49, 130, 255, 0.4)',
        },
      },
      context.beforeId,
    );

    ensureLayer(
      map,
      {
        id: USER_LOCATION_HEADING_LAYER_ID,
        type: 'line',
        source: USER_LOCATION_SOURCE_ID,
        filter: ['==', ['get', 'role'], 'heading'],
        paint: {
          'line-color': 'rgba(49, 130, 255, 0.75)',
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
      },
      context.beforeId,
    );

    ensureLayer(
      map,
      {
        id: USER_LOCATION_DOT_LAYER_ID,
        type: 'circle',
        source: USER_LOCATION_SOURCE_ID,
        filter: ['==', ['get', 'role'], 'position'],
        paint: {
          'circle-radius': 6,
          'circle-color': '#1f65ff',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      },
      context.beforeId,
    );
  },
};
