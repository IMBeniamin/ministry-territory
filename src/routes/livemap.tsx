import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import maplibregl, {
  type GeoJSONSource,
  type GeolocateControl,
  type LngLat,
  type Map,
  type MapMouseEvent,
  type MapTouchEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_PITCH,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_PITCH,
  MAP_MAX_ZOOM,
  MAP_STYLE_URL,
  SATELLITE_FADE_ZOOM,
  SATELLITE_MAX_ZOOM,
  SATELLITE_MIN_ZOOM,
  SATELLITE_TILE_URL,
} from '../app/config/mapConfig';
import { initialHeatPoints, territoryGeoJson } from '../app/mocks/mapData';
import './livemap.css';

export const Route = createFileRoute('/livemap')({
  component: MapRouteComponent,
});

function MapRouteComponent() {

  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const scribbleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const geolocateRef = useRef<GeolocateControl | null>(null);
  const heatDataRef = useRef(cloneHeatData());
  const isHeatPaintingRef = useRef(false);
  const heatPaintThrottleRef = useRef(0);
  const extrusionLayersRef = useRef<
    Array<{
      id: string;
      baseOpacity: unknown;
      baseTransition: unknown;
    }>
  >([]);
  const scribbleStrokesRef = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const activeStrokeRef = useRef<Array<{ x: number; y: number }>>([]);
  const isScribblingRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeTool, setActiveTool] = useState<'explore' | 'heat' | 'scribble'>('explore');
  const [satelliteEnabled, setSatelliteEnabled] = useState(false);
  const [zoom, setZoom] = useState(MAP_DEFAULT_ZOOM);
  const [hasScribbles, setHasScribbles] = useState(false);
  const [heatPointCount, setHeatPointCount] = useState(
    heatDataRef.current.features.length,
  );

  const satelliteHint = satelliteEnabled && zoom < SATELLITE_MIN_ZOOM;
  const toolHint = useMemo(() => {
    if (activeTool === 'heat') return 'Paint heat points by dragging on the map.';
    if (activeTool === 'scribble') return 'Draw freehand notes on top of the map.';
    return 'Explore with two-finger tilt for 3D buildings.';
  }, [activeTool]);

  const captureExtrusionLayers = (map: Map) => {
    const layers = map.getStyle().layers ?? [];
    extrusionLayersRef.current = layers
      .filter((layer) => layer.type === 'fill-extrusion')
      .map((layer) => {
        return {
          id: layer.id,
          baseOpacity: map.getPaintProperty(layer.id, 'fill-extrusion-opacity'),
          baseTransition: map.getPaintProperty(
            layer.id,
            'fill-extrusion-opacity-transition',
          ),
        };
      });
  };

  const applyExtrusionFade = (map: Map, enabled: boolean) => {
    extrusionLayersRef.current.forEach(({ id, baseOpacity, baseTransition }) => {
      if (!map.getLayer(id)) return;
      if (!enabled) {
        if (baseTransition !== undefined) {
          map.setPaintProperty(id, 'fill-extrusion-opacity-transition', baseTransition);
        }
        if (baseOpacity !== undefined) {
          map.setPaintProperty(id, 'fill-extrusion-opacity', baseOpacity);
        }
        return;
      }
      const fadeExpression: unknown = [
        '*',
        baseOpacity ?? 0.75,
        ['interpolate', ['linear'], ['zoom'], SATELLITE_FADE_ZOOM, 1, SATELLITE_MIN_ZOOM, 0],
      ];
      map.setPaintProperty(id, 'fill-extrusion-opacity-transition', { duration: 500 });
      map.setPaintProperty(id, 'fill-extrusion-opacity', fadeExpression);
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const nextMap = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      pitch: MAP_DEFAULT_PITCH,
      maxPitch: MAP_MAX_PITCH,
      attributionControl: false,
      antialias: true,
    });

    mapRef.current = nextMap;
    const attributionControl = new maplibregl.AttributionControl({
      compact: true,
    });
    nextMap.addControl(attributionControl, 'bottom-left');
    const navControl = new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
    });
    nextMap.addControl(navControl, 'bottom-right');
    const geolocateControl = new maplibregl.GeolocateControl({
      trackUserLocation: true,
      showUserLocation: true,
      showAccuracyCircle: false,
      positionOptions: { enableHighAccuracy: true },
    });
    geolocateRef.current = geolocateControl;
    nextMap.addControl(geolocateControl, 'bottom-right');

    const handleLoad = () => {
      setMapReady(true);
      setupMapLayers(nextMap, heatDataRef.current);
      captureExtrusionLayers(nextMap);
    };
    const handleZoom = () => setZoom(nextMap.getZoom());
    nextMap.on('load', handleLoad);
    nextMap.on('zoom', handleZoom);

    return () => {
      nextMap.off('load', handleLoad);
      nextMap.off('zoom', handleZoom);
      nextMap.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const visibility = satelliteEnabled ? 'visible' : 'none';
    if (map.getLayer(SATELLITE_LAYER_ID)) {
      map.setLayoutProperty(SATELLITE_LAYER_ID, 'visibility', visibility);
    }
    applyExtrusionFade(map, satelliteEnabled);
  }, [mapReady, satelliteEnabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeTool === 'explore') {
      map.dragPan.enable();
      map.dragRotate.enable();
      map.scrollZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
    } else {
      map.dragPan.disable();
      map.dragRotate.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
    }
  }, [activeTool]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const handleHeatStart = (event: MapMouseEvent | MapTouchEvent) => {
      if (activeTool !== 'heat') return;
      isHeatPaintingRef.current = true;
      addHeatPoint(event.lngLat);
    };
    const handleHeatMove = (event: MapMouseEvent | MapTouchEvent) => {
      if (!isHeatPaintingRef.current || activeTool !== 'heat') return;
      addHeatPoint(event.lngLat);
    };
    const handleHeatEnd = () => {
      isHeatPaintingRef.current = false;
    };

    if (activeTool === 'heat') {
      map.on('mousedown', handleHeatStart);
      map.on('mousemove', handleHeatMove);
      map.on('mouseup', handleHeatEnd);
      map.on('touchstart', handleHeatStart);
      map.on('touchmove', handleHeatMove);
      map.on('touchend', handleHeatEnd);
    }

    return () => {
      map.off('mousedown', handleHeatStart);
      map.off('mousemove', handleHeatMove);
      map.off('mouseup', handleHeatEnd);
      map.off('touchstart', handleHeatStart);
      map.off('touchmove', handleHeatMove);
      map.off('touchend', handleHeatEnd);
    };
  }, [activeTool, mapReady]);

  useEffect(() => {
    const container = mapContainerRef.current;
    const canvas = scribbleCanvasRef.current;
    if (!container || !canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      redrawScribbles(context);
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    resizeCanvas();

    return () => observer.disconnect();
  }, []);

  const addHeatPoint = (lngLat: LngLat) => {
    const now = Date.now();
    if (now - heatPaintThrottleRef.current < 80) return;
    heatPaintThrottleRef.current = now;

    heatDataRef.current.features.push({
      type: 'Feature',
      properties: { intensity: 0.75 },
      geometry: {
        type: 'Point',
        coordinates: [lngLat.lng, lngLat.lat],
      },
    });

    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(HEAT_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(heatDataRef.current);
    setHeatPointCount(heatDataRef.current.features.length);
  };

  const redrawScribbles = (context: CanvasRenderingContext2D) => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.strokeStyle = 'rgba(250, 120, 60, 0.9)';
    context.lineWidth = 3;

    scribbleStrokesRef.current.forEach((stroke) => {
      if (stroke.length < 2) return;
      context.beginPath();
      stroke.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.stroke();
    });
  };

  const handleScribbleStart = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'scribble') return;
    event.preventDefault();
    const canvas = scribbleCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const point = getCanvasPoint(event, canvas);
    const newStroke = [point];
    activeStrokeRef.current = newStroke;
    scribbleStrokesRef.current.push(newStroke);
    isScribblingRef.current = true;
    setHasScribbles(true);

    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handleScribbleMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isScribblingRef.current || activeTool !== 'scribble') return;
    event.preventDefault();
    const canvas = scribbleCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const point = getCanvasPoint(event, canvas);
    const stroke = activeStrokeRef.current;
    stroke.push(point);

    const lastPoint = stroke[stroke.length - 2];
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.strokeStyle = 'rgba(250, 120, 60, 0.9)';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const handleScribbleEnd = () => {
    if (activeTool !== 'scribble') return;
    isScribblingRef.current = false;
    activeStrokeRef.current = [];
  };

  const clearScribbles = () => {
    const canvas = scribbleCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    scribbleStrokesRef.current = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasScribbles(false);
  };

  const resetHeatmap = () => {
    heatDataRef.current = cloneHeatData();
    const map = mapRef.current;
    const source = map?.getSource(HEAT_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(heatDataRef.current);
    setHeatPointCount(heatDataRef.current.features.length);
  };

  const recenterMap = () => {
    mapRef.current?.easeTo({
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      pitch: MAP_DEFAULT_PITCH,
      duration: 700,
    });
  };

  const locateUser = () => {
    geolocateRef.current?.trigger();
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
          <Switch
            checked={satelliteEnabled}
            onChange={(event) => setSatelliteEnabled(event.currentTarget.checked)}
            label="Enable satellite imagery"
            description="Fades in past zoom 17 when enabled."
          />
          <SegmentedControl
            value={activeTool}
            onChange={(value) => setActiveTool(value as 'explore' | 'heat' | 'scribble')}
            data={[
              { label: 'Explore', value: 'explore' },
              { label: 'Heat', value: 'heat' },
              { label: 'Scribble', value: 'scribble' },
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
          <Group grow>
            <Button
              size="xs"
              variant="light"
              onClick={clearScribbles}
              disabled={!hasScribbles}
            >
              Clear scribbles
            </Button>
            <Button size="xs" variant="light" onClick={resetHeatmap}>
              Reset heat
            </Button>
          </Group>
          <Text size="xs" c="dimmed">
            {toolHint}
          </Text>
          {satelliteHint && (
            <Text size="xs" c="dimmed">
              Zoom closer to view satellite imagery.
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
            <span className="legend-swatch heat" />
            <Text size="xs">Heatmap edits · {heatPointCount} points</Text>
          </div>
          <div className="legend-row">
            <span className="legend-swatch scribble" />
            <Text size="xs">Freehand notes layer</Text>
          </div>
        </Stack>
      </Paper>
      <div id="map-container" ref={mapContainerRef}>
        <canvas
          ref={scribbleCanvasRef}
          className={`scribble-layer ${activeTool === 'scribble' ? 'active' : ''}`}
          onPointerDown={handleScribbleStart}
          onPointerMove={handleScribbleMove}
          onPointerUp={handleScribbleEnd}
          onPointerLeave={handleScribbleEnd}
        />
      </div>
    </div>
    );
}

const SATELLITE_SOURCE_ID = 'satellite-imagery';
const SATELLITE_LAYER_ID = 'satellite-imagery-layer';
const TERRITORY_SOURCE_ID = 'territory-source';
const TERRITORY_FILL_LAYER_ID = 'territory-fill';
const TERRITORY_LINE_LAYER_ID = 'territory-outline';
const TERRITORY_LABEL_LAYER_ID = 'territory-label';
const HEAT_SOURCE_ID = 'heat-points';
const HEAT_LAYER_ID = 'heatmap-layer';
const HEAT_POINT_LAYER_ID = 'heatmap-points';
const BUILDING_LAYER_ID = 'buildings-3d';
const HOUSENUMBER_LAYER_ID = 'housenumbers';

const cloneHeatData = () => JSON.parse(JSON.stringify(initialHeatPoints));

const getCanvasPoint = (
  event: ReactPointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

const findFirstSymbolLayerId = (map: Map) => {
  const style = map.getStyle();
  const symbolLayer = style.layers?.find((layer) => layer.type === 'symbol');
  return symbolLayer?.id;
};

const findVectorSourceId = (map: Map) => {
  const style = map.getStyle();
  const sources = style.sources ?? {};
  const vectorEntry = Object.entries(sources).find(
    ([, source]) => source.type === 'vector',
  );
  return vectorEntry?.[0] ?? null;
};

const setupMapLayers = (map: Map, heatData: typeof initialHeatPoints) => {
  map.addSource(TERRITORY_SOURCE_ID, {
    type: 'geojson',
    data: territoryGeoJson,
  });
  map.addLayer({
    id: TERRITORY_FILL_LAYER_ID,
    type: 'fill',
    source: TERRITORY_SOURCE_ID,
    paint: {
      'fill-color': '#2f6bff',
      'fill-opacity': 0.18,
    },
  });
  map.addLayer({
    id: TERRITORY_LINE_LAYER_ID,
    type: 'line',
    source: TERRITORY_SOURCE_ID,
    paint: {
      'line-color': '#1f4fdd',
      'line-width': 2.5,
    },
  });
  map.addLayer({
    id: TERRITORY_LABEL_LAYER_ID,
    type: 'symbol',
    source: TERRITORY_SOURCE_ID,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 14,
      'text-font': ['Noto Sans Regular', 'Open Sans Regular'],
      'text-offset': [0, 0.6],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#1f4fdd',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
    },
  });

  map.addSource(HEAT_SOURCE_ID, {
    type: 'geojson',
    data: heatData,
  });
  map.addLayer({
    id: HEAT_LAYER_ID,
    type: 'heatmap',
    source: HEAT_SOURCE_ID,
    maxzoom: 18,
    paint: {
      'heatmap-weight': ['get', 'intensity'],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 18, 1.4],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(33, 102, 172, 0)',
        0.2,
        'rgba(103, 169, 207, 0.6)',
        0.4,
        'rgba(209, 229, 240, 0.7)',
        0.6,
        'rgba(253, 219, 199, 0.8)',
        0.8,
        'rgba(239, 138, 98, 0.9)',
        1,
        'rgba(178, 24, 43, 0.95)',
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 12, 14, 18, 26],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.9, 18, 0.65],
    },
  });
  map.addLayer({
    id: HEAT_POINT_LAYER_ID,
    type: 'circle',
    source: HEAT_SOURCE_ID,
    minzoom: 17.5,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 17.5, 4, 19, 8],
      'circle-color': 'rgba(240, 110, 60, 0.9)',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  });

  map.addSource(SATELLITE_SOURCE_ID, {
    type: 'raster',
    tiles: [SATELLITE_TILE_URL],
    maxzoom: SATELLITE_MAX_ZOOM,
    tileSize: 256,
  });

  const beforeId = findFirstSymbolLayerId(map);
  map.addLayer(
    {
      id: SATELLITE_LAYER_ID,
      type: 'raster',
      source: SATELLITE_SOURCE_ID,
      minzoom: SATELLITE_FADE_ZOOM,
      layout: {
        visibility: 'none',
      },
      paint: {
        'raster-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          SATELLITE_FADE_ZOOM,
          0,
          SATELLITE_MIN_ZOOM,
          0.7,
          SATELLITE_MIN_ZOOM + 1.5,
          1,
        ],
        'raster-opacity-transition': {
          duration: 600,
        },
      },
    },
    beforeId,
  );

  const vectorSourceId = findVectorSourceId(map);
  if (vectorSourceId) {
    map.addLayer(
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

    map.addLayer({
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
    });
  }
};
