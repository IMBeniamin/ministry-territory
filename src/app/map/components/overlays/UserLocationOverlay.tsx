import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { FillLayerSpecification, LineLayerSpecification, CircleLayerSpecification } from 'maplibre-gl';
import type { UserLocation } from '@/app/map/types';
import { buildUserLocationGeoJson } from '@/app/map/utils/geoUtils';

const SOURCE_ID = 'user-location-source';

const accuracyLayer: Omit<FillLayerSpecification, 'source'> = {
  id: 'user-location-accuracy',
  type: 'fill',
  filter: ['==', ['get', 'role'], 'accuracy'],
  paint: {
    'fill-color': 'rgba(49, 130, 255, 0.18)',
    'fill-outline-color': 'rgba(49, 130, 255, 0.4)',
  },
};

const headingLayer: Omit<LineLayerSpecification, 'source'> = {
  id: 'user-location-heading',
  type: 'line',
  filter: ['==', ['get', 'role'], 'heading'],
  paint: {
    'line-color': 'rgba(49, 130, 255, 0.75)',
    'line-width': 2.5,
    'line-opacity': 0.9,
  },
};

const dotLayer: Omit<CircleLayerSpecification, 'source'> = {
  id: 'user-location-dot',
  type: 'circle',
  filter: ['==', ['get', 'role'], 'position'],
  paint: {
    'circle-radius': 6,
    'circle-color': '#1f65ff',
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 2,
  },
};

type UserLocationOverlayProps = {
  location: UserLocation | null | undefined;
};

export function UserLocationOverlay({ location }: UserLocationOverlayProps) {
  const geoJson = useMemo(() => {
    if (!location) return null;
    return buildUserLocationGeoJson(location);
  }, [location]);

  if (!geoJson) return null;

  return (
    <Source id={SOURCE_ID} type="geojson" data={geoJson}>
      <Layer {...accuracyLayer} />
      <Layer {...headingLayer} />
      <Layer {...dotLayer} />
    </Source>
  );
}
