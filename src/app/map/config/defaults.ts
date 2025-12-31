import type { LngLatLike } from 'maplibre-gl';

export const MAP_DEFAULT_CENTER: LngLatLike = [10.3278, 44.8062];
export const MAP_DEFAULT_ZOOM = 14.5;
export const MAP_DEFAULT_PITCH = 0;
export const MAP_MAX_PITCH = 70;
export const MAP_MAX_ZOOM = 20;

export const FOLLOW_RECENTER_DISTANCE_METERS = 12;
export const FOLLOW_RECENTER_INTERVAL_MS = 900;
export const FOLLOW_ANIMATION_MS = 600;
