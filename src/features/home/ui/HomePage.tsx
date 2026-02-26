import { Button, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';

export function HomePage() {
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
