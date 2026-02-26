# Ministry Territory

Base React + TypeScript + Vite project for territory mapping and overlay-driven workflows.

## Development

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Test: `pnpm test`

## Structure

- `src/app`: application bootstrap, router, and root layout.
- `src/features/home`: home page UI module.
- `src/features/map`: map feature (`config`, `hooks`, `model`, `lib`, `fixtures`, `ui`).
- `src/routes`: thin TanStack file-route wrappers.
- `src/shared`: shared theme, global styles, and app-level constants.
- `public/styles`: MapLibre style JSONs for basemaps.
