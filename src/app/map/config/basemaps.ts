export type BasemapType = 'vector' | 'raster';

export type BasemapId =
  | 'osm-streets'
  | 'osm-night'
  | 'osm-3d'
  | 'satellite-hybrid'
  | 'here-streets';

export type BasemapDefinition = {
  id: BasemapId;
  label: string;
  styleUrl: string;
  type: BasemapType;
  attribution: string;
  supports3d: boolean;
  supportsHouseNumbers: boolean;
  preferredPitch?: number;
  enabled?: boolean;
};

const STYLE_BASE = '/styles';

export const BASEMAPS: BasemapDefinition[] = [
  {
    id: 'osm-streets',
    label: 'OSM Streets',
    styleUrl: `${STYLE_BASE}/osm-streets.json`,
    type: 'vector',
    attribution: '© OpenMapTiles © OpenStreetMap contributors',
    supports3d: true,
    supportsHouseNumbers: true,
    preferredPitch: 0,
  },
  {
    id: 'osm-3d',
    label: 'OSM 3D',
    styleUrl: `${STYLE_BASE}/osm-3d.json`,
    type: 'vector',
    attribution: '© OpenMapTiles © OpenStreetMap contributors',
    supports3d: true,
    supportsHouseNumbers: true,
    preferredPitch: 55,
  },
  {
    id: 'osm-night',
    label: 'OSM Night',
    styleUrl: `${STYLE_BASE}/osm-night.json`,
    type: 'vector',
    attribution: '© OpenMapTiles © OpenStreetMap contributors',
    supports3d: true,
    supportsHouseNumbers: true,
    preferredPitch: 0,
    enabled: false,
  },
  {
    id: 'satellite-hybrid',
    label: 'Satellite',
    styleUrl: `${STYLE_BASE}/satellite-hybrid.json`,
    type: 'raster',
    attribution: '© Esri, Maxar, Earthstar Geographics',
    supports3d: false,
    supportsHouseNumbers: false,
    preferredPitch: 0,
  },
  {
    id: 'here-streets',
    label: 'HERE Streets',
    styleUrl: `${STYLE_BASE}/here-streets.json`,
    type: 'vector',
    attribution: '© HERE',
    supports3d: true,
    supportsHouseNumbers: true,
    preferredPitch: 0,
    enabled: false,
  },
];

export const DEFAULT_BASEMAP_ID: BasemapId = 'osm-streets';

const basemapLookup = BASEMAPS.reduce<Record<BasemapId, BasemapDefinition>>(
  (acc, basemap) => {
    acc[basemap.id] = basemap;
    return acc;
  },
  {} as Record<BasemapId, BasemapDefinition>,
);

export const getBasemapById = (id: BasemapId) => basemapLookup[id];

export const getEnabledBasemaps = () =>
  BASEMAPS.filter((basemap) => basemap.enabled !== false);
