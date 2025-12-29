export const territoryGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Parma Centro - Mock Territory',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [10.3208, 44.8033],
            [10.3344, 44.8033],
            [10.3362, 44.8086],
            [10.3266, 44.8112],
            [10.3192, 44.8085],
            [10.3208, 44.8033],
          ],
        ],
      },
    },
  ],
};

export const initialHeatPoints = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { intensity: 0.8 },
      geometry: { type: 'Point', coordinates: [10.3269, 44.8054] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.6 },
      geometry: { type: 'Point', coordinates: [10.3302, 44.8066] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.45 },
      geometry: { type: 'Point', coordinates: [10.3326, 44.8072] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.7 },
      geometry: { type: 'Point', coordinates: [10.3291, 44.8085] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.5 },
      geometry: { type: 'Point', coordinates: [10.3246, 44.8078] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.9 },
      geometry: { type: 'Point', coordinates: [10.3238, 44.8056] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.35 },
      geometry: { type: 'Point', coordinates: [10.3337, 44.8051] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.65 },
      geometry: { type: 'Point', coordinates: [10.3278, 44.8102] },
    },
  ],
};
