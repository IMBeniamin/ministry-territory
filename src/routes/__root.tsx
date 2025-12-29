import { Anchor, Container, Group, Title } from '@mantine/core';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { APP_NAME } from '@/app/config/constants';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="app-root">
      <header className="app-header">
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Title order={4}>{APP_NAME}</Title>
            <Group gap="md">
              <Anchor component={Link} to="/">
                Home
              </Anchor>
              <Anchor component={Link} to="/livemap">
                My Territory
              </Anchor>
            </Group>
          </Group>
        </Container>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
