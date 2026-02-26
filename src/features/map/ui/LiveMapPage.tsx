import { useEffect, useRef, useState } from 'react';
import { Button, Collapse, Paper, SegmentedControl } from '@mantine/core';
import { IconMap2 } from '@tabler/icons-react';
import type { MapRef } from 'react-map-gl/maplibre';
import {
  getBasemapById,
  getBasemapOptions,
} from '@/features/map/config/basemaps';
import { territoryGeoJson } from '@/features/map/fixtures/overlayData';
import { useFollowMode } from '@/features/map/hooks/useFollowMode';
import { useMapState } from '@/features/map/hooks/useMapState';
import { TerritoryMap } from '@/features/map/ui/TerritoryMap';
import { AreasOverlay } from '@/features/map/ui/overlays/AreasOverlay';
import { BasemapEnhancements } from '@/features/map/ui/overlays/BasemapEnhancements';
import { HeatOverlay } from '@/features/map/ui/overlays/HeatOverlay';
import { MarkersOverlay } from '@/features/map/ui/overlays/MarkersOverlay';
import { UserLocationOverlay } from '@/features/map/ui/overlays/UserLocationOverlay';
import '@/features/map/styles/live-map-page.css';

export function LiveMapPage() {
  const mapRef = useRef<MapRef>(null);
  const [state, actions] = useMapState();
  const [mapTypeOpen, setMapTypeOpen] = useState(false);

  const basemap = getBasemapById(state.basemapId);

  const { handleDragStart } = useFollowMode({
    mapRef,
    userLocation: state.userLocation,
    followMode: state.followMode,
    preferredPitch: basemap.preferredPitch,
    onDisable: () => actions.setFollowMode(false),
  });

  useEffect(() => {
    if (state.isStyleLoaded) {
      actions.setOverlays({ areas: territoryGeoJson });
    }
  }, [state.isStyleLoaded, actions]);

  const handleBasemapChange = (value: string) => {
    actions.setBasemap(value);
    actions.setStyleLoaded(false);
  };

  return (
    <div className="map-page">
      <div className="map-type-control">
        <Button
          size="xs"
          variant="default"
          leftSection={<IconMap2 size={16} />}
          onClick={() => setMapTypeOpen((open) => !open)}
        >
          Map type
        </Button>

        <Collapse in={mapTypeOpen}>
          <Paper className="map-type-panel" shadow="md" radius="md" p="xs">
            <SegmentedControl
              value={state.basemapId}
              onChange={handleBasemapChange}
              data={getBasemapOptions()}
              size="xs"
              fullWidth
            />
          </Paper>
        </Collapse>
      </div>

      <div className="map-debug-panel">
        <div className="map-debug-item">
          <span className="map-debug-label">Zoom</span>
          <span className="map-debug-value">
            {state.viewState.zoom.toFixed(1)}
          </span>
        </div>
      </div>

      <div id="map-container">
        <TerritoryMap
          ref={mapRef}
          viewState={state.viewState}
          basemap={basemap}
          onMove={(evt) => actions.setViewState(evt.viewState)}
          onDragStart={handleDragStart}
          onStyleLoad={() => actions.setStyleLoaded(true)}
        >
          <BasemapEnhancements basemap={basemap} />
          <AreasOverlay data={state.overlays.areas} />
          <HeatOverlay data={state.overlays.heat} />
          <MarkersOverlay data={state.overlays.markers} />
          <UserLocationOverlay location={state.userLocation} />
        </TerritoryMap>
      </div>
    </div>
  );
}
