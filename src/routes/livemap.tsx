import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Collapse, Paper, SegmentedControl } from '@mantine/core';
import { IconMap2 } from '@tabler/icons-react';
import { createFileRoute } from '@tanstack/react-router';
import { MapEngine } from '@/app/map/engine/MapEngine';
import {
  DEFAULT_BASEMAP_ID,
  getBasemapById,
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
  const [basemapFamily, setBasemapFamily] = useState<'osm' | 'satellite'>('osm');
  const [mapTypeOpen, setMapTypeOpen] = useState(false);

  const activeBasemapId = useMemo<BasemapId>(() => {
    if (basemapFamily === 'satellite') return 'satellite-hybrid';
    return 'osm-streets';
  }, [basemapFamily]);

  useEffect(() => {
    if (!mapContainerRef.current || mapEngineRef.current) return;
    const initialBasemap = getBasemapById(DEFAULT_BASEMAP_ID);
    if (!initialBasemap) return;

    const engine = new MapEngine({
      onReady: () => {
        engine.setOverlays({
          areas: territoryGeoJson,
        });
      },
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

  const handleBasemapChange = (value: string) => {
    const nextFamily = value as 'osm' | 'satellite';
    setBasemapFamily(nextFamily);
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
              value={basemapFamily}
              onChange={handleBasemapChange}
              data={[
                { label: 'OSM', value: 'osm' },
                { label: 'Satellite', value: 'satellite' },
              ]}
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
