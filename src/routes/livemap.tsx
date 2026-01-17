import { useEffect, useRef, useState } from 'react';
import { Button, Collapse, Paper, SegmentedControl } from '@mantine/core';
import { IconMap2 } from '@tabler/icons-react';
import { createFileRoute } from '@tanstack/react-router';
import { MapEngine } from '@/app/map/engine/MapEngine';
import {
  DEFAULT_BASEMAP_ID,
  getBasemapOptions,
  isBasemapId,
  type BasemapId,
} from '@/app/map/config/basemaps';
import { territoryGeoJson } from '@/app/map/mocks/overlayData';
import './livemap.css';

export const Route = createFileRoute('/livemap')({
  component: MapRouteComponent,
});

function MapRouteComponent() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapEngineRef = useRef<MapEngine | null>(null);
  const [activeBasemapId, setActiveBasemapId] = useState<BasemapId>(
    DEFAULT_BASEMAP_ID,
  );
  const [mapTypeOpen, setMapTypeOpen] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapEngineRef.current) return;

    const engine = new MapEngine({
      onReady: () => {
        engine.setOverlays({
          areas: territoryGeoJson,
        });
      },
    });

    engine.init(mapContainerRef.current, DEFAULT_BASEMAP_ID);
    mapEngineRef.current = engine;

    return () => {
      engine.destroy();
      mapEngineRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapEngineRef.current?.setBasemap(activeBasemapId);
  }, [activeBasemapId]);

  const handleBasemapChange = (value: string) => {
    if (!isBasemapId(value)) return;
    setActiveBasemapId(value);
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
              value={activeBasemapId}
              onChange={handleBasemapChange}
              data={getBasemapOptions()}
              size="xs"
              fullWidth
            />
          </Paper>
        </Collapse>
      </div>
      <div id="map-container" ref={mapContainerRef} />
    </div>
  );
}
