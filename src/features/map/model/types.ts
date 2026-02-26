export const OVERLAY_KEYS = ['areas', 'heat', 'markers'] as const;

export type OverlayKey = (typeof OVERLAY_KEYS)[number];

export type OverlayData = {
  areas: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  heat: GeoJSON.FeatureCollection<GeoJSON.Point>;
  markers: GeoJSON.FeatureCollection<GeoJSON.Point>;
};

export type MapOverlays = Partial<OverlayData>;

export type UserLocation = {
  coordinates: [number, number];
  accuracy?: number;
  heading?: number | null;
  timestamp?: number;
};
