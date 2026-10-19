import '@tanstack/react-start/server-only';
import type { HealthStatus } from '../types/status';

export function healthResponse(): Response {
  const status: HealthStatus = { status: 'ok', service: 'HostelWatt API' };
  return Response.json(status, { headers: { 'Cache-Control': 'no-store' } });
}