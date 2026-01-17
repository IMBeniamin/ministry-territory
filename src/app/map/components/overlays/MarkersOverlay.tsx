import { Source, Layer } from 'react-map-gl/maplibre';
import type { CircleLayerSpecification } from 'maplibre-gl';
import type { OverlayData } from '@/app/map/types';

const SOURCE_ID = 'markers-source';

const circleLayer: Omit<CircleLayerSpecification, 'source'> = {
  id: 'markers-layer',
  type: 'circle',
  paint: {
    'circle-radius': 6,
    'circle-color': ['coalesce', ['get', 'color'], '#1f4fdd'],
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 1.5,
  },
};

type MarkersOverlayProps = {
  data: OverlayData['markers'] | null | undefined;
};

export function MarkersOverlay({ data }: MarkersOverlayProps) {
  if (!data) return null;

  return (
    <Source id={SOURCE_ID} type="geojson" data={data}>
      <Layer {...circleLayer} />
    </Source>
  );
}
