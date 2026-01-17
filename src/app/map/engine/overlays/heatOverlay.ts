import type { Map } from 'maplibre-gl';
import type { OverlayData } from '@/app/map/types';
import { ensureGeoJsonSource, ensureLayer } from './overlayUtils';
import type { OverlayContext, OverlayDefinition } from './overlayRegistry';

const HEAT_SOURCE_ID = 'heat-source';
const HEAT_LAYER_ID = 'heatmap-layer';
const HEAT_POINT_LAYER_ID = 'heatmap-points';

export const HEAT_OVERLAY: OverlayDefinition<OverlayData['heat']> = {
  id: 'heat',
  sourceId: HEAT_SOURCE_ID,
  layerIds: [HEAT_LAYER_ID, HEAT_POINT_LAYER_ID],
  apply(map: Map, data: OverlayData['heat'], context: OverlayContext) {
    ensureGeoJsonSource(map, HEAT_SOURCE_ID, data);

    ensureLayer(
      map,
      {
        id: HEAT_LAYER_ID,
        type: 'heatmap',
        source: HEAT_SOURCE_ID,
        maxzoom: 18,
        paint: {
          'heatmap-weight': ['get', 'intensity'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 18, 1.4],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(33, 102, 172, 0)',
            0.2,
            'rgba(103, 169, 207, 0.6)',
            0.4,
            'rgba(209, 229, 240, 0.7)',
            0.6,
            'rgba(253, 219, 199, 0.8)',
            0.8,
            'rgba(239, 138, 98, 0.9)',
            1,
            'rgba(178, 24, 43, 0.95)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 12, 14, 18, 26],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.9, 18, 0.65],
        },
      },
      context.beforeId,
    );

    ensureLayer(
      map,
      {
        id: HEAT_POINT_LAYER_ID,
        type: 'circle',
        source: HEAT_SOURCE_ID,
        minzoom: 17.5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 17.5, 4, 19, 8],
          'circle-color': 'rgba(240, 110, 60, 0.9)',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
        },
      },
      context.beforeId,
    );
  },
};
