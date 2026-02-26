import { Suspense, lazy } from 'react';
import { Center, Loader } from '@mantine/core';
import { loadLiveMapPage } from '@/features/map/lib/loadLiveMapPage';

const LiveMapPage = lazy(async () => {
  const module = await loadLiveMapPage();
  return { default: module.LiveMapPage };
});

export function LazyLiveMapRoute() {
  return (
    <Suspense
      fallback={
        <Center h="100%">
          <Loader size="sm" />
        </Center>
      }
    >
      <LiveMapPage />
    </Suspense>
  );
}
