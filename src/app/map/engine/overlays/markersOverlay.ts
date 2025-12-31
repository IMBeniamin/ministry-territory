import type { Map } from 'maplibre-gl';
import type { MapOverlays } from '@/app/map/types';
import { ensureGeoJsonSource, ensureLayer } from './overlayUtils';
import type { OverlayContext, OverlayDefinition } from './overlayRegistry';

const MARKER_SOURCE_ID = 'markers-source';
const MARKER_LAYER_ID = 'markers-layer';

export const MARKERS_OVERLAY: OverlayDefinition<NonNullable<MapOverlays['markers']>> = {
  id: 'markers',
  sourceId: MARKER_SOURCE_ID,
  layerIds: [MARKER_LAYER_ID],
  apply(map: Map, data: NonNullable<MapOverlays['markers']>, context: OverlayContext) {
    ensureGeoJsonSource(map, MARKER_SOURCE_ID, data);

    ensureLayer(
      map,
      {
        id: MARKER_LAYER_ID,
        type: 'circle',
        source: MARKER_SOURCE_ID,
        paint: {
          'circle-radius': 6,
          'circle-color': ['coalesce', ['get', 'color'], '#1f4fdd'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      },
      context.beforeId,
    );
  },
};
