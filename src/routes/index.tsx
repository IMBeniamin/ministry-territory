import { Button, Stack, Text, Title } from '@mantine/core';
import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeRouteComponent,
});

function HomeRouteComponent() {
  return (
    <Stack gap="md">
      <Title order={2}>Welcome</Title>
      <Text c="dimmed">
        Manage territories, track check-ins, and keep teams aligned.
      </Text>
      <Button component={Link} to="/livemap" w="fit-content">
        Open map
      </Button>
    </Stack>
  );
}
