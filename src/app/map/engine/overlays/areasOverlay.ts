import type { Map } from 'maplibre-gl';
import type { OverlayData } from '@/app/map/types';
import { ensureGeoJsonSource, ensureLayer } from './overlayUtils';
import type { OverlayContext, OverlayDefinition } from './overlayRegistry';

const AREA_SOURCE_ID = 'areas-source';
const AREA_FILL_LAYER_ID = 'areas-fill';
const AREA_LINE_LAYER_ID = 'areas-outline';
const AREA_LABEL_LAYER_ID = 'areas-label';

export const AREAS_OVERLAY: OverlayDefinition<OverlayData['areas']> = {
  id: 'areas',
  sourceId: AREA_SOURCE_ID,
  layerIds: [AREA_FILL_LAYER_ID, AREA_LINE_LAYER_ID, AREA_LABEL_LAYER_ID],
  apply(map: Map, data: OverlayData['areas'], context: OverlayContext) {
    ensureGeoJsonSource(map, AREA_SOURCE_ID, data);

    ensureLayer(
      map,
      {
        id: AREA_FILL_LAYER_ID,
        type: 'fill',
        source: AREA_SOURCE_ID,
        paint: {
          'fill-color': '#2f6bff',
          'fill-opacity': 0.18,
          'fill-antialias': false,
        },
      },
      context.beforeId,
    );

    ensureLayer(
      map,
      {
        id: AREA_LINE_LAYER_ID,
        type: 'line',
        source: AREA_SOURCE_ID,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#1f4fdd',
          'line-width': 2.5,
        },
      },
      context.beforeId,
    );

    ensureLayer(
      map,
      {
        id: AREA_LABEL_LAYER_ID,
        type: 'symbol',
        source: AREA_SOURCE_ID,
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
      },
      context.beforeId,
    );
  },
};
