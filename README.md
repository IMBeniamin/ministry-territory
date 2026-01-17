# Ministry Territory

Base React + TypeScript + Vite project for territory mapping and overlay-driven workflows.

## Development

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Test: `pnpm test`

## Structure

- `src/app/map/config`: basemap definitions and map defaults.
- `src/app/map/engine`: `MapEngine` and overlay implementations.
- `src/app/map/mocks`: sample overlay data for local development.
- `src/routes`: app routes (`/livemap` hosts the map).
- `public/styles`: MapLibre style JSONs for basemaps.
