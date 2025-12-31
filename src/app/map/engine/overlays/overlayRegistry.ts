import type { Map } from 'maplibre-gl';

export type OverlayContext = {
  beforeId?: string;
};

export type OverlayDefinition<T> = {
  id: string;
  sourceId: string;
  layerIds: string[];
  apply: (map: Map, data: T, context: OverlayContext) => void;
};
