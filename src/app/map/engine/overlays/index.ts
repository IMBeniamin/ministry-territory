import { AREAS_OVERLAY } from './areasOverlay';
import { HEAT_OVERLAY } from './heatOverlay';
import { MARKERS_OVERLAY } from './markersOverlay';
import { USER_LOCATION_OVERLAY } from './userLocationOverlay';
import type { OverlayRegistry } from './overlayRegistry';

export const OVERLAY_REGISTRY = {
  areas: AREAS_OVERLAY,
  heat: HEAT_OVERLAY,
  markers: MARKERS_OVERLAY,
} satisfies OverlayRegistry;

export { USER_LOCATION_OVERLAY };
export { buildUserLocationGeoJson } from './userLocationOverlay';
