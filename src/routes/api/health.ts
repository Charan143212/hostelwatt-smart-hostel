import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const { healthResponse } = await import('@/server/routes/health.server');
        return healthResponse();
      },
    },
  },
});