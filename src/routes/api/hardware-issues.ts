import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/hardware-issues')({
  server: { handlers: {
    GET: async ({ request }) => {
      const { handleHardwareIssues } = await import('@/server/routes/hardware-issues.server');
      return handleHardwareIssues(request);
    },
    POST: async ({ request }) => {
      const { handleHardwareIssues } = await import('@/server/routes/hardware-issues.server');
      return handleHardwareIssues(request);
    },
  } },
});