import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LngLat, MapMouseEvent, MapTouchEvent } from 'maplibre-gl';
import {
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { MapEngine } from '@/app/map/engine/MapEngine';
import {
  DEFAULT_BASEMAP_ID,
  getBasemapById,
  type BasemapId,
} from '@/app/map/config/basemaps';
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_PITCH,
  MAP_DEFAULT_ZOOM,
} from '@/app/map/config/defaults';
import { initialHeatPoints, territoryGeoJson } from '@/app/map/mocks/overlayData';
import './livemap.css';

export const Route = createFileRoute('/livemap')({
  component: MapRouteComponent,
});

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 1500,
  timeout: 10_000,
};

function MapRouteComponent() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapEngineRef = useRef<MapEngine | null>(null);
  const geolocationWatchRef = useRef<number | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState<'explore' | 'heat'>('explore');
  const [basemapFamily, setBasemapFamily] = useState<'osm' | 'satellite'>('osm');
  const [is3dEnabled, setIs3dEnabled] = useState(false);
  const [followMode, setFollowMode] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const activeBasemapId = useMemo<BasemapId>(() => {
    if (basemapFamily === 'satellite') return 'satellite-hybrid';
    return is3dEnabled ? 'osm-3d' : 'osm-streets';
  }, [basemapFamily, is3dEnabled]);

  const toolHint = useMemo(() => {
    if (activeTool === 'heat') return 'Paint heat points by dragging on the map.';
    return 'Explore with two-finger tilt for 3D buildings.';
  }, [activeTool]);


  useEffect(() => {
    if (!mapContainerRef.current || mapEngineRef.current) return;
    const initialBasemap = getBasemapById(DEFAULT_BASEMAP_ID);
    if (!initialBasemap) return;

    const engine = new MapEngine({
      onReady: () => {
        setMapReady(true);
        engine.setOverlays({
          areas: territoryGeoJson,
          // heat: heatDataRef.current,
        });
      },
      onFollowModeChange: setFollowMode,
    });

    engine.init(mapContainerRef.current, initialBasemap.styleUrl, DEFAULT_BASEMAP_ID);
    mapEngineRef.current = engine;

    return () => {
      engine.destroy();
      mapEngineRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapEngineRef.current?.setBasemap(activeBasemapId);
  }, [activeBasemapId]);

  useEffect(() => {
    mapEngineRef.current?.setFollowMode(followMode);
  }, [followMode]);

  useEffect(() => {
    if (!trackingEnabled || !('geolocation' in navigator)) return;

    const handlePosition = (position: GeolocationPosition) => {
      mapEngineRef.current?.setUserLocation({
        coordinates: [position.coords.longitude, position.coords.latitude],
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        timestamp: position.timestamp,
      });
      setGeoError(null);
    };

    const handlePositionError = (error: GeolocationPositionError) => {
      setGeoError(error.message);
    };

    geolocationWatchRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      GEOLOCATION_OPTIONS,
    );

    return () => {
      if (geolocationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geolocationWatchRef.current);
        geolocationWatchRef.current = null;
      }
    };
  }, [trackingEnabled]);
  
  const recenterMap = () => {
    mapEngineRef.current?.getMap()?.easeTo({
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      pitch: MAP_DEFAULT_PITCH,
      duration: 700,
    });
  };

  const locateUser = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported in this browser.');
      return;
    }
    setTrackingEnabled(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapEngineRef.current?.setUserLocation({
          coordinates: [position.coords.longitude, position.coords.latitude],
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        });
        setGeoError(null);
      },
      (error) => setGeoError(error.message),
      GEOLOCATION_OPTIONS,
    );
  };

  const handleBasemapChange = (value: string) => {
    const nextFamily = value as 'osm' | 'satellite';
    setBasemapFamily(nextFamily);
    if (nextFamily === 'satellite') {
      setIs3dEnabled(false);
    }
  };

  return (
    <div className="map-page">
      <Paper className="control-panel" shadow="md" radius="md" p="md">
        <Stack gap="sm">
          <div>
            <Title order={4}>Live Territory Map</Title>
            <Text size="xs" c="dimmed">
              Parma Centro · Mock territory · OSM vector + Esri imagery
            </Text>
          </div>
          <SegmentedControl
            value={basemapFamily}
            onChange={handleBasemapChange}
            data={[
              { label: 'OSM', value: 'osm' },
              { label: 'Satellite', value: 'satellite' },
            ]}
            fullWidth
          />
          <Switch
            checked={is3dEnabled}
            onChange={(event) => setIs3dEnabled(event.currentTarget.checked)}
            disabled={basemapFamily === 'satellite'}
            label="3D buildings"
            description="Pitch to reveal building extrusions."
          />
          <Switch
            checked={followMode}
            onChange={(event) => setFollowMode(event.currentTarget.checked)}
            label="Follow mode"
            description="Keeps the map centered on your location."
          />
          <SegmentedControl
            value={activeTool}
            onChange={(value) => setActiveTool(value as 'explore' | 'heat')}
            data={[
              { label: 'Explore', value: 'explore' },
              { label: 'Heat', value: 'heat' },
            ]}
            fullWidth
          />
          <Group grow>
            <Button size="xs" onClick={locateUser}>
              Locate me
            </Button>
            <Button size="xs" variant="default" onClick={recenterMap}>
              Reset view
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            {toolHint}
          </Text>
          {geoError && (
            <Text size="xs" c="dimmed">
              {geoError}
            </Text>
          )}
        </Stack>
      </Paper>
      <Paper className="legend-panel" shadow="md" radius="md" p="sm">
        <Stack gap="xs">
          <Text size="xs" fw={600}>
            Territory & Activity
          </Text>
          <div className="legend-row">
            <span className="legend-swatch territory" />
            <Text size="xs">Assigned territory boundary</Text>
          </div>
          <div className="legend-row">
            <span className="legend-swatch location" />
            <Text size="xs">Your location</Text>
          </div>
        </Stack>
      </Paper>
      <div id="map-container" ref={mapContainerRef} />
    </div>
  );
}
