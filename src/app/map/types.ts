export type MapOverlays = {
  areas?: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  heat?: GeoJSON.FeatureCollection<GeoJSON.Point>;
  markers?: GeoJSON.FeatureCollection<GeoJSON.Point>;
};

export type UserLocation = {
  coordinates: [number, number];
  accuracy?: number;
  heading?: number | null;
  timestamp?: number;
};
