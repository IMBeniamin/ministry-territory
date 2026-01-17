import { useState, useCallback, useMemo } from 'react';
import type { ViewState } from 'react-map-gl/maplibre';
import type { BasemapId } from '@/app/map/config/basemaps';
import type { MapOverlays, UserLocation } from '@/app/map/types';
import { DEFAULT_BASEMAP_ID } from '@/app/map/config/basemaps';
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_DEFAULT_PITCH,
} from '@/app/map/config/defaults';

export type MapState = {
  viewState: ViewState;
  basemapId: BasemapId;
  overlays: MapOverlays;
  userLocation: UserLocation | null;
  followMode: boolean;
  isStyleLoaded: boolean;
};

export type MapActions = {
  setViewState: (viewState: ViewState) => void;
  setBasemap: (id: BasemapId) => void;
  setOverlays: (overlays: Partial<MapOverlays>) => void;
  setUserLocation: (location: UserLocation | null) => void;
  setFollowMode: (enabled: boolean) => void;
  setStyleLoaded: (loaded: boolean) => void;
};

export function useMapState(initialBasemapId?: BasemapId) {
  const [longitude, latitude] = MAP_DEFAULT_CENTER as [number, number];

  const [viewState, setViewState] = useState<ViewState>({
    longitude,
    latitude,
    zoom: MAP_DEFAULT_ZOOM,
    pitch: MAP_DEFAULT_PITCH,
    bearing: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const [basemapId, setBasemapId] = useState<BasemapId>(
    initialBasemapId ?? DEFAULT_BASEMAP_ID,
  );
  const [overlays, setOverlaysState] = useState<MapOverlays>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [followMode, setFollowMode] = useState(false);
  const [isStyleLoaded, setStyleLoaded] = useState(false);

  const setOverlays = useCallback((next: Partial<MapOverlays>) => {
    setOverlaysState((prev) => ({ ...prev, ...next }));
  }, []);

  const state: MapState = useMemo(
    () => ({
      viewState,
      basemapId,
      overlays,
      userLocation,
      followMode,
      isStyleLoaded,
    }),
    [viewState, basemapId, overlays, userLocation, followMode, isStyleLoaded],
  );

  const actions: MapActions = useMemo(
    () => ({
      setViewState,
      setBasemap: setBasemapId,
      setOverlays,
      setUserLocation,
      setFollowMode,
      setStyleLoaded,
    }),
    [setOverlays],
  );

  return [state, actions] as const;
}
