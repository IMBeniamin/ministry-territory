import { forwardRef, useCallback } from 'react';
import Map, {
  NavigationControl,
  AttributionControl,
  type MapRef,
  type ViewState,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_MAX_PITCH, MAP_MAX_ZOOM } from '@/app/map/config/defaults';
import type { Basemap } from '@/app/map/config/basemaps';

type TerritoryMapProps = {
  viewState: ViewState;
  basemap: Basemap;
  onMove: (evt: ViewStateChangeEvent) => void;
  onDragStart?: () => void;
  onStyleLoad?: () => void;
  children?: React.ReactNode;
};

export const TerritoryMap = forwardRef<MapRef, TerritoryMapProps>(
  function TerritoryMap(
    { viewState, basemap, onMove, onDragStart, onStyleLoad, children },
    ref,
  ) {
    const handleStyleLoad = useCallback(() => {
      onStyleLoad?.();
    }, [onStyleLoad]);

    return (
      <Map
        { ...{aroundCenter: false}}
        ref={ref}
        mapLib={maplibregl}
        {...viewState}
        onMove={onMove}
        onDragStart={onDragStart}
        onLoad={handleStyleLoad}
        mapStyle={basemap.styleUrl}
        maxZoom={MAP_MAX_ZOOM}
        maxPitch={MAP_MAX_PITCH}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        
      >
        <NavigationControl position="bottom-right" showCompass showZoom />
        <AttributionControl
          position="bottom-left"
          compact
          customAttribution={basemap.attribution}
        />
        {children}
      </Map>
    );
  },
);
