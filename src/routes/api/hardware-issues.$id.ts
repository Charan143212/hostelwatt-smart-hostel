import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/hardware-issues/$id')({
  server: { handlers: {
    PATCH: async ({ request, params }) => {
      const { handleHardwareIssues } = await import('@/server/routes/hardware-issues.server');
      return handleHardwareIssues(request, params.id);
    },
  } },
});