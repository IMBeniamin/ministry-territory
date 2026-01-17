export type BasemapType = 'vector' | 'raster';

export type BasemapDefinition<TId extends string = string> = {
  id: TId;
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

export const BASEMAPS: ReadonlyArray<BasemapDefinition> = [
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
];

export type BasemapId = (typeof BASEMAPS)[number]['id'];
export type Basemap = (typeof BASEMAPS)[number];

export const DEFAULT_BASEMAP_ID: BasemapId = 'osm-3d';

const BASEMAPS_BY_ID = BASEMAPS.reduce<Record<BasemapId, Basemap>>(
  (acc, basemap) => {
    acc[basemap.id] = basemap;
    return acc;
  },
  {} as Record<BasemapId, Basemap>,
);

export type BasemapOption = {
  value: BasemapId;
  label: string;
};

export const getBasemapById = (id: BasemapId) => BASEMAPS_BY_ID[id];

export const getEnabledBasemaps = () =>
  BASEMAPS.filter((basemap) => basemap.enabled !== false);

export const getBasemapOptions = (): BasemapOption[] =>
  getEnabledBasemaps().map((basemap) => ({
    value: basemap.id,
    label: basemap.label,
  }));

export const isBasemapId = (value: string): value is BasemapId =>
  Object.prototype.hasOwnProperty.call(BASEMAPS_BY_ID, value);
