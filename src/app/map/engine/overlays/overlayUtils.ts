import type { GeoJSONSource, LayerSpecification, Map } from 'maplibre-gl';

export const ensureGeoJsonSource = (
  map: Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection,
) => {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource(sourceId, {
    type: 'geojson',
    data,
  });
};

export const ensureLayer = (
  map: Map,
  layer: LayerSpecification,
  beforeId?: string,
) => {
  if (map.getLayer(layer.id)) {
    if (beforeId && beforeId !== layer.id && map.getLayer(beforeId)) {
      map.moveLayer(layer.id, beforeId);
    }
    return;
  }
  map.addLayer(layer, beforeId);
};

export const removeLayerIfExists = (map: Map, layerId: string) => {
  if (!map.getLayer(layerId)) return;
  map.removeLayer(layerId);
};

export const removeSourceIfExists = (map: Map, sourceId: string) => {
  if (!map.getSource(sourceId)) return;
  map.removeSource(sourceId);
};
