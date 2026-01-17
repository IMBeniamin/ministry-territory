import { Source, Layer } from 'react-map-gl/maplibre';
import type { FillLayerSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { OverlayData } from '@/app/map/types';

const SOURCE_ID = 'areas-source';

const fillLayer: Omit<FillLayerSpecification, 'source'> = {
  id: 'areas-fill',
  type: 'fill',
  paint: {
    'fill-color': '#2f6bff',
    'fill-opacity': 0.18,
    'fill-antialias': false,
  },
};

const lineLayer: Omit<LineLayerSpecification, 'source'> = {
  id: 'areas-outline',
  type: 'line',
  layout: {
    'line-cap': 'round',
    'line-join': 'round',
  },
  paint: {
    'line-color': '#1f4fdd',
    'line-width': 2.5,
  },
};

const labelLayer: Omit<SymbolLayerSpecification, 'source'> = {
  id: 'areas-label',
  type: 'symbol',
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 14,
    'text-font': ['Noto Sans Regular', 'Open Sans Regular'],
    'text-offset': [0, 0.6],
    'text-anchor': 'top',
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#1f4fdd',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1,
  },
};

type AreasOverlayProps = {
  data: OverlayData['areas'] | null | undefined;
};

export function AreasOverlay({ data }: AreasOverlayProps) {
  if (!data) return null;

  return (
    <Source id={SOURCE_ID} type="geojson" data={data}>
      <Layer {...fillLayer} />
      <Layer {...lineLayer} />
      <Layer {...labelLayer} />
    </Source>
  );
}
