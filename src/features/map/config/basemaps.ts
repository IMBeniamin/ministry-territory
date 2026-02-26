export type BasemapType = 'vector' | 'raster';

export type Basemap = {
  id: string;
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

export const BASEMAPS = [
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
  },
] as const satisfies readonly Basemap[];

export type BasemapId = (typeof BASEMAPS)[number]['id'];

export const DEFAULT_BASEMAP_ID: BasemapId = 'osm-3d';

const enabledBasemaps = BASEMAPS.filter(
  (basemap) => !('enabled' in basemap) || basemap.enabled !== false,
);
const defaultBasemap = BASEMAPS.find(
  (basemap) => basemap.id === DEFAULT_BASEMAP_ID,
);

if (!defaultBasemap) {
  throw new Error(`Invalid default basemap id: ${DEFAULT_BASEMAP_ID}`);
}

export const normalizeBasemapId = (value: string): BasemapId => {
  const basemap = BASEMAPS.find((entry) => entry.id === value);
  return basemap?.id ?? DEFAULT_BASEMAP_ID;
};

export const getBasemapById = (id: string) => {
  const basemap = BASEMAPS.find((entry) => entry.id === id);
  return basemap ?? defaultBasemap;
};

export type BasemapOption = {
  value: BasemapId;
  label: string;
};

export const getBasemapOptions = (): BasemapOption[] =>
  enabledBasemaps.map((basemap) => ({
    value: basemap.id,
    label: basemap.label,
  }));
