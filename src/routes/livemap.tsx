import { createFileRoute } from '@tanstack/react-router';
import { loadLiveMapPage } from '@/features/map/lib/loadLiveMapPage';
import { LazyLiveMapRoute } from '@/features/map/ui/LazyLiveMapRoute';

export const Route = createFileRoute('/livemap')({
  loader: async () => {
    await loadLiveMapPage();
  },
  component: LazyLiveMapRoute,
});
