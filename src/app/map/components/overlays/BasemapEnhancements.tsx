import { useEffect, useState } from 'react';
import { Layer, useMap } from 'react-map-gl/maplibre';
import type { FillExtrusionLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { Basemap } from '@/app/map/config/basemaps';

const BUILDING_LAYER_ID = 'app-3d-buildings';
const HOUSENUMBER_LAYER_ID = 'app-housenumbers';

type BasemapEnhancementsProps = {
  basemap: Basemap;
};

export function BasemapEnhancements({ basemap }: BasemapEnhancementsProps) {
  const { current: map } = useMap();
  const [vectorSourceId, setVectorSourceId] = useState<string | null>(null);
  const [beforeId, setBeforeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!map) return;

    const detectSources = () => {
      const style = map.getStyle();
      if (!style) return;

      const sources = style.sources ?? {};
      const vectorEntry = Object.entries(sources).find(
        ([, source]) => source.type === 'vector',
      );
      setVectorSourceId(vectorEntry?.[0] ?? null);

      const symbolLayer = style.layers?.find((l) => l.type === 'symbol');
      setBeforeId(symbolLayer?.id);
    };

    detectSources();
    map.on('styledata', detectSources);
    return () => {
      map.off('styledata', detectSources);
    };
  }, [map]);

  if (!vectorSourceId || basemap.type !== 'vector') {
    return null;
  }

  const buildingLayer: Omit<FillExtrusionLayerSpecification, 'source'> = {
    id: BUILDING_LAYER_ID,
    type: 'fill-extrusion',
    'source-layer': 'building',
    minzoom: 15,
    paint: {
      'fill-extrusion-color': '#c8c8c8',
      'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14.5,
        0,
        15.5,
        0.4,
        16.8,
        0.75,
        19,
        0.75,
      ],
    },
  };

  const housenumberLayer: Omit<SymbolLayerSpecification, 'source'> = {
    id: HOUSENUMBER_LAYER_ID,
    type: 'symbol',
    'source-layer': 'housenumber',
    minzoom: 17,
    layout: {
      'text-field': ['get', 'housenumber'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 17, 11, 19, 14],
      'text-font': ['Noto Sans Regular', 'Open Sans Regular'],
      'text-allow-overlap': false,
      'text-ignore-placement': false,
      'text-anchor': 'center',
      'text-padding': 1,
    },
    paint: {
      'text-color': '#000000',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  };

  return (
    <>
      {basemap.supports3d && (
        <Layer source={vectorSourceId} {...buildingLayer} />
      )}
      {basemap.supportsHouseNumbers && (
        <Layer source={vectorSourceId} {...housenumberLayer} />
      )}
    </>
  );
}
