import maplibregl, { type Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  FOLLOW_ANIMATION_MS,
  FOLLOW_RECENTER_DISTANCE_METERS,
  FOLLOW_RECENTER_INTERVAL_MS,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_PITCH,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_PITCH,
  MAP_MAX_ZOOM,
} from '@/app/map/config/defaults';
import { getBasemapById, type BasemapId } from '@/app/map/config/basemaps';
import type { MapOverlays, UserLocation } from '@/app/map/types';
import { OVERLAY_REGISTRY, USER_LOCATION_OVERLAY, buildUserLocationGeoJson } from './overlays';
import { removeLayerIfExists, removeSourceIfExists } from './overlays/overlayUtils';

const BUILDING_LAYER_ID = 'app-3d-buildings';
const HOUSENUMBER_LAYER_ID = 'app-housenumbers';

export type MapEngineMetrics = {
  styleSwitches: number;
  tileLoads: number;
};

export type MapEngineOptions = {
  onReady?: (map: Map) => void;
  onZoom?: (zoom: number) => void;
  onFollowModeChange?: (enabled: boolean) => void;
};

export class MapEngine {
  private map: Map | null = null;
  private activeBasemapId: BasemapId | null = null;
  private overlays: MapOverlays = {};
  private userLocation: UserLocation | null = null;
  private styleReady = false;
  private followMode = false;
  private lastFollowUpdate = 0;
  private metrics: MapEngineMetrics = { styleSwitches: 0, tileLoads: 0 };
  private readonly options: MapEngineOptions;

  constructor(options: MapEngineOptions = {}) {
    this.options = options;
  }

  init(container: HTMLElement, initialStyleUrl: string, initialBasemapId?: BasemapId) {
    if (this.map) return;
    this.activeBasemapId = initialBasemapId ?? null;

    const map = new maplibregl.Map({
      container,
      style: initialStyleUrl,
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      pitch: MAP_DEFAULT_PITCH,
      maxPitch: MAP_MAX_PITCH,
      attributionControl: false,
    });

    this.map = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      'bottom-right',
    );

    map.on('style.load', () => {
      this.styleReady = true;
      this.applyBasemapEnhancements();
      this.applyOverlays();
      this.applyUserLocation();
    });

    map.on('load', () => {
      this.options.onReady?.(map);
    });

    map.on('zoom', () => {
      this.options.onZoom?.(map.getZoom());
    });

    map.on('dragstart', () => {
      if (this.followMode) {
        this.setFollowMode(false);
      }
    });

    map.on('sourcedata', (event) => {
      const dataEvent = event as { sourceDataType?: string };
      if (dataEvent.sourceDataType === 'tile') {
        this.metrics.tileLoads += 1;
      }
    });
  }

  getMap() {
    return this.map;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  setBasemap(basemapId: BasemapId) {
    const map = this.map;
    if (!map) return;
    const basemap = getBasemapById(basemapId);
    if (!basemap) return;
    if (this.activeBasemapId === basemapId) return;

    this.activeBasemapId = basemapId;
    this.styleReady = false;
    this.metrics.styleSwitches += 1;
    map.setStyle(basemap.styleUrl);
  }

  setOverlays(nextOverlays: Partial<MapOverlays>) {
    this.overlays = { ...this.overlays, ...nextOverlays };
    const map = this.map;
    if (!map || !this.styleReady) return;

    const beforeId = findFirstSymbolLayerId(map);
    (Object.keys(nextOverlays) as Array<keyof MapOverlays>).forEach((key) => {
      const overlay = OVERLAY_REGISTRY[key];
      if (!overlay) return;
      const data = this.overlays[key];
      if (!data) {
        this.removeOverlay(overlay.layerIds, overlay.sourceId);
        return;
      }
      overlay.apply(map, data, { beforeId });
    });
  }

  setFollowMode(enabled: boolean) {
    if (this.followMode === enabled) return;
    this.followMode = enabled;
    this.options.onFollowModeChange?.(enabled);

    if (enabled && this.userLocation) {
      this.centerOnUser(true);
    }
  }

  setUserLocation(location: UserLocation | null) {
    const previous = this.userLocation;
    this.userLocation = location;

    if (!this.map || !this.styleReady) return;
    if (!location) {
      this.removeOverlay(
        USER_LOCATION_OVERLAY.layerIds,
        USER_LOCATION_OVERLAY.sourceId,
      );
      return;
    }
    this.applyUserLocation();

    if (!this.followMode || !location) return;
    if (this.shouldRecenter(previous, location)) {
      this.centerOnUser(false);
    }
  }

  destroy() {
    if (!this.map) return;
    this.map.remove();
    this.map = null;
    this.styleReady = false;
  }

  private applyOverlays() {
    const map = this.map;
    if (!map || !this.styleReady) return;
    const beforeId = findFirstSymbolLayerId(map);

    (Object.keys(OVERLAY_REGISTRY) as Array<keyof typeof OVERLAY_REGISTRY>).forEach(
      (key) => {
        const overlay = OVERLAY_REGISTRY[key];
        const data = this.overlays[key];
        if (!data) return;
        overlay.apply(map, data, { beforeId });
      },
    );
  }

  private applyUserLocation() {
    if (!this.map || !this.userLocation) return;
    const beforeId = findFirstSymbolLayerId(this.map);
    const data = buildUserLocationGeoJson(this.userLocation);
    USER_LOCATION_OVERLAY.apply(this.map, data, { beforeId });
  }

  private removeOverlay(layerIds: string[], sourceId: string) {
    const map = this.map;
    if (!map) return;
    layerIds.forEach((layerId) => removeLayerIfExists(map, layerId));
    removeSourceIfExists(map, sourceId);
  }

  private applyBasemapEnhancements() {
    if (!this.map || !this.activeBasemapId) return;
    const basemap = getBasemapById(this.activeBasemapId);
    if (!basemap) return;

    if (typeof basemap.preferredPitch === 'number') {
      this.map.setPitch(basemap.preferredPitch);
    }

    if (basemap.type !== 'vector') return;

    const vectorSourceId = findPrimaryVectorSourceId(this.map);
    if (!vectorSourceId) return;

    const beforeId = findFirstSymbolLayerId(this.map);

    if (basemap.supports3d) {
      this.ensure3dBuildings(vectorSourceId, beforeId);
    }

    if (basemap.supportsHouseNumbers) {
      this.ensureHouseNumbers(vectorSourceId, beforeId);
    }
  }

  private ensure3dBuildings(vectorSourceId: string, beforeId?: string) {
    if (!this.map) return;
    if (this.map.getLayer('building-3d') || this.map.getLayer(BUILDING_LAYER_ID)) {
      return;
    }

    this.map.addLayer(
      {
        id: BUILDING_LAYER_ID,
        source: vectorSourceId,
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#c8c8c8',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14.5,
            0,
            15.5,
            0.4,
            16.8,
            0.75,
            19,
            0.75,
          ],
        },
      },
      beforeId,
    );
  }

  private ensureHouseNumbers(vectorSourceId: string, beforeId?: string) {
    if (!this.map) return;
    if (this.map.getLayer('housenumber') || this.map.getLayer(HOUSENUMBER_LAYER_ID)) {
      return;
    }

    this.map.addLayer(
      {
        id: HOUSENUMBER_LAYER_ID,
        type: 'symbol',
        source: vectorSourceId,
        'source-layer': 'housenumber',
        minzoom: 17,
        layout: {
          'text-field': ['get', 'housenumber'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 17, 11, 19, 14],
          'text-font': ['Noto Sans Regular', 'Open Sans Regular'],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-anchor': 'center',
          'text-padding': 1,
        },
        paint: {
          'text-color': '#202020',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.2,
        },
      },
      beforeId,
    );
  }

  private shouldRecenter(previous: UserLocation | null, next: UserLocation) {
    const now = Date.now();
    if (now - this.lastFollowUpdate < FOLLOW_RECENTER_INTERVAL_MS) {
      return false;
    }

    if (!previous) return true;

    const distance = haversineDistanceMeters(previous.coordinates, next.coordinates);
    if (distance < FOLLOW_RECENTER_DISTANCE_METERS) return false;

    this.lastFollowUpdate = now;
    return true;
  }

  private centerOnUser(immediate: boolean) {
    if (!this.map || !this.userLocation) return;
    const basemap = this.activeBasemapId
      ? getBasemapById(this.activeBasemapId)
      : null;
    const pitch = basemap?.preferredPitch ?? MAP_DEFAULT_PITCH;
    this.lastFollowUpdate = Date.now();

    if (immediate) {
      this.map.jumpTo({ center: this.userLocation.coordinates, pitch });
      return;
    }

    this.map.easeTo({
      center: this.userLocation.coordinates,
      pitch,
      duration: FOLLOW_ANIMATION_MS,
    });
  }
}

const findFirstSymbolLayerId = (map: Map) => {
  const style = map.getStyle();
  const symbolLayer = style.layers?.find((layer) => layer.type === 'symbol');
  return symbolLayer?.id;
};

const findPrimaryVectorSourceId = (map: Map) => {
  const style = map.getStyle();
  const sources = style.sources ?? {};
  const vectorEntry = Object.entries(sources).find(([, source]) => source.type === 'vector');
  return vectorEntry?.[0] ?? null;
};

const haversineDistanceMeters = (
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number],
) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};
