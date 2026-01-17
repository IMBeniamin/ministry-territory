import type { Map } from 'maplibre-gl';
import type { OverlayData, OverlayKey } from '@/app/map/types';

export type OverlayContext = {
  beforeId?: string;
};

export type OverlayDefinition<T> = {
  id: string;
  sourceId: string;
  layerIds: string[];
  apply: (map: Map, data: T, context: OverlayContext) => void;
};

export type OverlayRegistry = {
  [K in OverlayKey]: OverlayDefinition<OverlayData[K]>;
};
